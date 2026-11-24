// APLI COP – Función unificada en Appwrite
// Reemplaza todas las Edge Functions de Supabase:
// app-auth, chef-conversaciones, groq-chat, recaptcha-verify, oauth
//
// Variables que tenés que cargar en Appwrite > Functions > Variables:
//   APPWRITE_FUNCTION_PROJECT_ID  (lo pone Appwrite solo)
//   APPWRITE_API_KEY              (clave de servidor con permisos de bases de datos)
//   GROQ_API_KEY                  clave de Groq
//   reCAPTCHA_SECRET              clave secreta de reCAPTCHA v2
//   BOT_DEFAULT_KEY               (opcional) clave de OpenAI u otro proveedor para imágenes
//   JWT_SECRET                    string largo y aleatorio para firmar los tokens (ej: 64 chars random)
//   ADMIN_EMAIL                   tu email, para que tengas acceso de admin
//
// Desplegá con: appwrite functions createDeployment --functionId=<id> --entrypoint=main.js --code=.

const { Client, Databases, ID, Query } = require('node-appwrite');

const PROJECT_ID  = process.env.APPWRITE_FUNCTION_PROJECT_ID || '';
const API_KEY     = process.env.APPWRITE_API_KEY || '';
const GROQ_KEY    = process.env.GROQ_API_KEY || '';
const RC_SECRET   = process.env.reCAPTCHA_SECRET || '';
const JWT_SECRET  = process.env.JWT_SECRET || '';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase();
const AW_ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const DB_ID       = 'aplicop';   // ID del database en Appwrite (ver instrucciones)

// IDs de tablas en Appwrite (crear con el config.json que te paso por separado)
const T = {
  usuarios:          'usuarios',
  pedidos:           'pedidos',
  conversaciones:    'conversaciones',
  presencia:         'presencia',
  actualizaciones:   'actualizaciones',
  config_bot:        'config_bot',
  perfiles:          'perfiles',
  grupos:            'grupos',
  solicitudes:       'solicitudes',
  alertas_bot:       'alertas_bot',
  subidos:           'subidos',
  oauth_apps:        'oauth_apps',
  oauth_secrets:     'oauth_secrets',
  oauth_codes:       'oauth_codes',
  oauth_tokens:      'oauth_tokens',
};

const enc = new TextEncoder();

// ── Appwrite client con clave de servidor ──
function mkClient() {
  return new Client().setEndpoint(AW_ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
}
function mkDB() { return new Databases(mkClient()); }

// ── JWT mínimo (HMAC-SHA256) ──
async function sign(payload) {
  const key = await crypto.subtle.importKey('raw', enc.encode(JWT_SECRET), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const h = btoa(JSON.stringify({ alg:'HS256', typ:'JWT' })).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const p = btoa(JSON.stringify(payload)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(h+'.'+p)));
  const s = btoa(String.fromCharCode(...sig)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  return h+'.'+p+'.'+s;
}
async function verify(token) {
  try {
    const [h, p, s] = String(token||'').split('.');
    const key = await crypto.subtle.importKey('raw', enc.encode(JWT_SECRET), { name:'HMAC', hash:'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('HMAC', key, Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')), c=>c.charCodeAt(0)), enc.encode(h+'.'+p));
    if (!ok) return null;
    const pl = JSON.parse(atob(p.replace(/-/g,'+').replace(/_/g,'/')));
    if (pl.exp && pl.exp < Date.now()/1000) return null;
    return pl;
  } catch(_) { return null; }
}
async function sha256hex(s) {
  const b = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)));
  return Array.from(b).map(x=>x.toString(16).padStart(2,'0')).join('');
}
function rand(n) { const a=new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a).map(x=>x.toString(16).padStart(2,'0')).join(''); }


// Node.js 22 / Appwrite request compatibility
function getHeader(req, name) {
  const headers = req.headers || {};
  if (typeof headers.get === 'function') return headers.get(name) || '';
  const key = Object.keys(headers).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? String(headers[key]) : '';
}

// ── Helpers de respuesta ──
const CORS = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'content-type,authorization,x-appwrite-key', 'Access-Control-Allow-Methods':'POST,GET,OPTIONS' };
function json(d, status=200) { return new Response(JSON.stringify(d), { status, headers:{ ...CORS, 'Content-Type':'application/json', 'Cache-Control':'no-store' }}); }

// ── Autenticación de usuario (token APLI COP) ──
async function checkToken(tok) {
  if (!tok) return null;
  const pl = await verify(tok);
  if (!pl || !pl.email) return null;
  return { email: pl.email, nombre: pl.nombre || '' };
}

// ───────────────────────────────────────────────
//  ROUTER
// ───────────────────────────────────────────────
async function handleRequest({ req }) {
  if (req.method === 'OPTIONS') return json({}, 204);

  let body = {};
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch(_){}

  const path  = (req.path || '/').replace(/^\/+/,'');
  const action= body.action || path;
  if (!PROJECT_ID || !API_KEY || !JWT_SECRET || JWT_SECRET.length < 32) return json({ error:'Configuración incompleta: revisá PROJECT_ID, API_KEY y JWT_SECRET (mínimo 32 caracteres).' }, 500);

  // ── Rutas públicas de OAuth (GET) ──
  if (path === 'token')    return await oauthToken(body, req);
  if (path === 'userinfo') return await oauthUserinfo(req);

  try {
    switch(action) {
      // ───── administración APLI COP ─────
      case 'admin_login': return await adminLogin(body);
      case 'admin_data':  return await adminData(body);

      // ───── trámites ─────
      case 'tramite_auth': return await tramiteAuth(body);
      case 'tramite_data': return await tramiteData(body);

      // ───── app-auth ─────
      case 'register':    return await authRegister(body);
      case 'login':       return await authLogin(body);
      case 'me':          return await authMe(body);
      case 'nombres':     return await authNombres(body);

      // ───── chef-conversaciones ─────
      case 'create':          return await convCreate(body);
      case 'list':            return await convList(body);
      case 'messages':        return await convMessages(body);
      case 'add_message':     return await convAddMessage(body);
      case 'set_title':       return await convSetTitle(body);

      // ───── groq-chat ─────
      case 'chat':        return await groqChat(body);

      // ───── recaptcha-verify ─────
      case 'recaptcha':   return await rcVerify(body);

      // ───── oauth (gestión de apps) ─────
      case 'app_list':        return await oaAppList(body);
      case 'app_save':        return await oaAppSave(body);
      case 'app_delete':      return await oaAppDelete(body);
      case 'secret_new':      return await oaSecretNew(body);
      case 'secret_delete':   return await oaSecretDelete(body);
      case 'tokens_revoke':   return await oaTokensRevoke(body);
      case 'authorize_info':  return await oaAuthorizeInfo(body);
      case 'authorize_grant': return await oaAuthorizeGrant(body);
      case 'authorize_deny':  return await oaAuthorizeDeny(body);

      default: return json({ error: 'accion_desconocida' }, 400);
    }
  } catch(e) {
    console.error('apli-fn:', e?.message || e);
    return json({ error: 'Error interno' }, 500);
  }
};

// ═══════════════════════════════════════════════// ═══════════════════════════════════════════════
//  ADMINISTRACIÓN Y DATOS DEL PANEL
//  admin_login y admin_data son acciones de la función.
// ═══════════════════════════════════════════════
const ADMIN_TABLES = new Set([
  'usuarios','presencia','conversaciones','pedidos','actualizaciones',
  'config_bot','configuracion_del_bot','perfiles','grupos','solicitudes',
  'alertas_bot','subidos','tramites','tramite_mensajes'
]);

function normalizeTable(name) {
  const n = String(name || '');
  if (n === 'configuracion_del_bot') return T.config_bot;
  return ADMIN_TABLES.has(n) ? n : '';
}

async function adminUserByEmail(email) {
  const db = mkDB();
  const r = await db.listDocuments(DB_ID, T.usuarios, [
    Query.equal('email', String(email || '').toLowerCase()), Query.limit(1)
  ]);
  return r.documents[0] || null;
}

async function adminLogin({ email='', password='' }) {
  email = String(email || '').trim().toLowerCase();
  password = String(password || '');
  if (!email || !password) return json({ ok:false, error:'Completá el correo y la contraseña.' }, 400);
  const u = await adminUserByEmail(email);
  if (!u || u.password_hash !== await sha256hex(password + 'apli')) {
    return json({ ok:false, error:'Correo o contraseña incorrectos.' }, 401);
  }
  const allowed = (ADMIN_EMAIL && email === ADMIN_EMAIL) || u.admin === true;
  if (!allowed) return json({ ok:false, error:'Esta cuenta no tiene permisos de administrador.' }, 403);
  const token = await sign({ email, nombre:u.nombre || '', role:'admin', exp:Math.floor(Date.now()/1000) + 8*60*60 });
  return json({ ok:true, token, email, nombre:u.nombre || '' });
}

async function requireAdmin(token) {
  const pl = await verify(token);
  if (!pl || !pl.email || pl.role !== 'admin') return null;
  const u = await adminUserByEmail(pl.email);
  if (!u || !((ADMIN_EMAIL && pl.email === ADMIN_EMAIL) || u.admin === true)) return null;
  return { email:pl.email, user:u };
}

function buildQueries(filters) {
  const out = [];
  for (const f of (Array.isArray(filters) ? filters : [])) {
    if (!f || !f.field || f.field === 'id' || f.op === 'or') continue;
    if (f.op === 'equal') out.push(Query.equal(f.field, f.value));
    else if (f.op === 'notEqual') out.push(Query.notEqual(f.field, f.value));
    else if (f.op === 'contains') out.push(Query.contains(f.field, f.value));
  }
  return out;
}

function matchesFilters(doc, filters) {
  return (Array.isArray(filters) ? filters : []).every(f => {
    if (!f || !f.field) return true;
    const value = f.field === 'id' ? doc.$id : doc[f.field];
    if (f.op === 'equal') return Array.isArray(f.value) ? f.value.includes(value) : value === f.value;
    if (f.op === 'notEqual') return value !== f.value;
    if (f.op === 'contains') return Array.isArray(value) ? value.includes(f.value) : String(value || '').includes(String(f.value));
    if (f.op === 'or') return (f.filters || []).some(x => doc[x.field] === x.value);
    return true;
  });
}

async function listAllDocuments(db, collection, queries, max=500) {
  const docs = [];
  let offset = 0;
  while (docs.length < max) {
    const take = Math.min(100, max - docs.length);
    const r = await db.listDocuments(DB_ID, collection, [...queries, Query.limit(take), Query.offset(offset)]);
    docs.push(...r.documents);
    if (r.documents.length < take || docs.length >= r.total) break;
    offset += r.documents.length;
  }
  return docs;
}

async function adminData({ token='', table='', op='select', data={}, filters=[], limit=500, orderBy='', descending=true, id='', conflict='' }) {
  const admin = await requireAdmin(token);
  if (!admin) return json({ data:null, total:0, error:'Sesión de administrador inválida.' }, 401);
  const collection = normalizeTable(table);
  if (!collection) return json({ data:null, total:0, error:'Colección no permitida: ' + String(table) }, 400);
  const db = mkDB();
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));
  const queries = buildQueries(filters);

  if (op === 'select') {
    let docs = await listAllDocuments(db, collection, queries, safeLimit);
    docs = docs.filter(d => matchesFilters(d, filters));
    if (orderBy) docs.sort((a,b) => {
      const av = a[orderBy] ?? '', bv = b[orderBy] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return descending ? -cmp : cmp;
    });
    return json({ data:docs.map(d => ({ ...d, id:d.$id })), total:docs.length, count:docs.length });
  }

  const docs = await listAllDocuments(db, collection, queries, 500);
  const matched = docs.filter(d => matchesFilters(d, filters));
  if (op === 'insert') {
    const created = await db.createDocument(DB_ID, collection, ID.unique(), data || {});
    return json({ data:{ ...created, id:created.$id }, total:1 });
  }
  if (op === 'upsert') {
    const field = String(conflict || (filters[0]?.field || ''));
    const value = field ? (data || {})[field] : undefined;
    const existing = field ? docs.find(d => d[field] === value) : null;
    if (existing) {
      const updated = await db.updateDocument(DB_ID, collection, existing.$id, data || {});
      return json({ data:{ ...updated, id:updated.$id }, total:1 });
    }
    const created = await db.createDocument(DB_ID, collection, ID.unique(), data || {});
    return json({ data:{ ...created, id:created.$id }, total:1 });
  }
  if (op === 'update' || op === 'delete') {
    const targets = id ? docs.filter(d => d.$id === id) : matched;
    const changed = [];
    for (const d of targets) {
      if (op === 'delete') await db.deleteDocument(DB_ID, collection, d.$id);
      else changed.push(await db.updateDocument(DB_ID, collection, d.$id, data || {}));
    }
    return json({ data:changed.map(d => ({ ...d, id:d.$id })), total:targets.length });
  }
  return json({ data:null, total:0, error:'Operación no permitida.' }, 400);
}

// ═══════════════════════════════════════════════
//  TRÁMITES
// ═══════════════════════════════════════════════
async function tramiteAuth({ token='' }) {
  const u = await checkToken(token);
  if (!u) return json({ ok:false, error:'Sesión inválida' }, 401);
  return json({ ok:true, email:u.email, nombre:u.nombre });
}

async function tramiteData({ token='', op='select', table='tramites', data={}, filters=[], id='' }) {
  const u = await checkToken(token);
  if (!u) return json({ data:null, error:'No autorizado' }, 401);
  const collection = (table === 'tramites' || table === 'tramite_mensajes') ? table : '';
  if (!collection) return json({ data:null, error:'Colección no permitida' }, 400);
  const db = mkDB();
  const safeFilters = Array.isArray(filters) ? filters : [];
  const queries = buildQueries(safeFilters);
  const docs = await listAllDocuments(db, collection, queries, 200);
  const own = docs.filter(d => {
    const owner = String(d.owner_email || d.email || d.usuario || '').toLowerCase();
    return owner === u.email && matchesFilters(d, safeFilters);
  });
  if (op === 'select') return json({ data:own.map(d => ({ ...d, id:d.$id })), total:own.length });
  if (op === 'insert') {
    const row = { ...(data || {}) };
    if (collection === 'tramites') row.owner_email = u.email;
    else row.email = u.email;
    const created = await db.createDocument(DB_ID, collection, ID.unique(), row);
    return json({ data:{ ...created, id:created.$id } });
  }
  if (op === 'update' || op === 'delete') {
    const targets = id ? own.filter(d => d.$id === id) : own;
    const changed = [];
    for (const d of targets) {
      if (op === 'delete') await db.deleteDocument(DB_ID, collection, d.$id);
      else changed.push(await db.updateDocument(DB_ID, collection, d.$id, data || {}));
    }
    return json({ data:changed.map(d => ({ ...d, id:d.$id })), total:targets.length });
  }
  return json({ error:'Operación no permitida' }, 400);
}


//  AUTH
// ═══════════════════════════════════════════════
async function authRegister({ email='', password='', nombre='' }) {
  email = email.trim().toLowerCase();
  if (!email || !password || !nombre) return json({ ok:false, error:'Faltan datos' }, 400);
  if (password.length < 6) return json({ ok:false, error:'La contraseña necesita al menos 6 caracteres' }, 400);
  const db = mkDB();
  // verificar que no existe
  try {
    const ex = await db.listDocuments(DB_ID, T.usuarios, [Query.equal('email', email), Query.limit(1)]);
    if (ex.total > 0) return json({ ok:false, error:'Ese Gmail ya está registrado' });
  } catch(_) {}
  const hash = await sha256hex(password + 'apli');
  const doc = { email, nombre: nombre.trim(), password_hash: hash, creado_en: new Date().toISOString() };
  await db.createDocument(DB_ID, T.usuarios, ID.unique(), doc);
  const token = await sign({ email, nombre: nombre.trim(), exp: Math.floor(Date.now()/1000) + 86400*30 });
  return json({ ok:true, token, email, nombre: nombre.trim() });
}

async function authLogin({ email='', password='' }) {
  email = email.trim().toLowerCase();
  if (!email || !password) return json({ ok:false, error:'Faltan datos' }, 400);
  const db = mkDB();
  const r = await db.listDocuments(DB_ID, T.usuarios, [Query.equal('email', email), Query.limit(1)]);
  if (!r.total) return json({ ok:false, error:'Gmail o contraseña incorrectos' }, 401);
  const u = r.documents[0];
  const hash = await sha256hex(password + 'apli');
  if (u.password_hash !== hash) return json({ ok:false, error:'Gmail o contraseña incorrectos' }, 401);
  const token = await sign({ email, nombre: u.nombre || '', exp: Math.floor(Date.now()/1000) + 86400*30 });
  return json({ ok:true, token, email, nombre: u.nombre || '' });
}

async function authMe({ token='' }) {
  const u = await checkToken(token);
  if (!u) return json({ ok:false, error:'Sesión inválida' }, 401);
  return json({ ok:true, ...u });
}

async function authNombres({ token='', emails=[] }) {
  const u = await checkToken(token);
  if (!u) return json({ ok:false }, 401);
  if (!emails.length) return json({ ok:true, usuarios:[] });
  const db = mkDB();
  const r = await db.listDocuments(DB_ID, T.usuarios, [Query.equal('email', emails.slice(0,100)), Query.limit(100)]);
  return json({ ok:true, usuarios: r.documents.map(d=>({ email:d.email, nombre:d.nombre })) });
}

// ═══════════════════════════════════════════════
//  CONVERSACIONES DEL BOT
// ═══════════════════════════════════════════════
async function convCreate({ token='' }) {
  const u = await checkToken(token);
  if (!u) return json({ error:'No autorizado' }, 401);
  const db = mkDB();
  const doc = await db.createDocument(DB_ID, T.conversaciones, ID.unique(), { usuario: u.email, titulo:'Nueva conversación', mensajes:'[]', creado_en:new Date().toISOString(), actualizado_en:new Date().toISOString() });
  return json({ data:{ id: doc.$id } });
}

async function convList({ token='' }) {
  const u = await checkToken(token);
  if (!u) return json({ data:[] });
  const db = mkDB();
  const r = await db.listDocuments(DB_ID, T.conversaciones, [Query.equal('usuario', u.email), Query.orderDesc('actualizado_en'), Query.limit(50)]);
  return json({ data: r.documents.map(d=>({ id:d.$id, title:d.titulo, updated_at:d.actualizado_en })) });
}

async function convMessages({ token='', convId='' }) {
  const u = await checkToken(token);
  if (!u) return json({ data:[] });
  const db = mkDB();
  try {
    const doc = await db.getDocument(DB_ID, T.conversaciones, convId);
    if (doc.usuario !== u.email) return json({ data:[] });
    return json({ data: JSON.parse(doc.mensajes || '[]') });
  } catch(_) { return json({ data:[] }); }
}

async function convAddMessage({ token='', convId='', role='', content='' }) {
  const u = await checkToken(token);
  if (!u) return json({ error:'No autorizado' }, 401);
  const db = mkDB();
  const doc = await db.getDocument(DB_ID, T.conversaciones, convId);
  if (doc.usuario !== u.email) return json({ error:'No autorizado' }, 403);
  const msgs = JSON.parse(doc.mensajes || '[]');
  msgs.push({ role, content, ts: Date.now() });
  await db.updateDocument(DB_ID, T.conversaciones, convId, { mensajes: JSON.stringify(msgs), actualizado_en: new Date().toISOString() });
  return json({});
}

async function convSetTitle({ token='', convId='', title='' }) {
  const u = await checkToken(token);
  if (!u) return json({ error:'No autorizado' }, 401);
  const db = mkDB();
  const doc = await db.getDocument(DB_ID, T.conversaciones, convId);
  if (doc.usuario !== u.email) return json({ error:'No autorizado' }, 403);
  await db.updateDocument(DB_ID, T.conversaciones, convId, { titulo: String(title).slice(0,60), actualizado_en: new Date().toISOString() });
  return json({});
}

// ═══════════════════════════════════════════════
//  GROQ CHAT
// ═══════════════════════════════════════════════
async function groqChat({ messages=[], model='', system='' }) {
  if (!GROQ_KEY) return json({ error:'Sin GROQ_API_KEY' }, 500);
  const msgs = system ? [{ role:'system', content:system }, ...messages] : messages;
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+GROQ_KEY },
    body: JSON.stringify({ model: model || 'llama-3.3-70b-versatile', messages: msgs, max_tokens:1024 })
  });
  const d = await r.json();
  return json(d, r.status);
}

// ═══════════════════════════════════════════════
//  reCAPTCHA
// ═══════════════════════════════════════════════
async function rcVerify({ token='' }) {
  if (!RC_SECRET) return json({ ok:true });   // si no hay clave configurada, no se traba a nadie
  if (!token) return json({ ok:false, error:'sin_token' }, 400);
  const body = new URLSearchParams({ secret: RC_SECRET, response: token });
  const r = await fetch('https://www.google.com/recaptcha/api/siteverify', { method:'POST', body });
  const g = await r.json().catch(()=>({}));
  if (!g.success) return json({ ok:false, error:(g['error-codes']||['invalido']).join(',') });
  return json({ ok:true });
}

// ═══════════════════════════════════════════════
//  OAUTH
// ═══════════════════════════════════════════════
async function oaUserDe(token) { return await checkToken(token); }
function urlOk(u) { try { const x=new URL(u); return x.protocol==='https:'||(x.protocol==='http:'&&['localhost','127.0.0.1'].includes(x.hostname)); } catch(_){return false;} }
function colorOk(c) { return /^#[0-9a-fA-F]{6}$/.test(c); }
function logoOk(l) { return !l||(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(l)&&l.length<=60000); }
function pubApp(a) { return { nombre:a.nombre, logo:a.logo||'', badge_color:a.badge_color||'#000000', homepage:a.homepage, descripcion:a.descripcion||'' }; }
function resolveRedirect(uris, pedido) { const l=Array.isArray(uris)?uris:[]; return pedido?(l.includes(pedido)?pedido:''):(l[0]||''); }
function withParams(base, p) { const u=new URL(base); for(const[k,v] of Object.entries(p)) if(v!=='') u.searchParams.set(k,v); return u.toString(); }
function oaErr(error,desc,status=400){return json({error,error_description:desc},status);}

async function oaAppList({ token='' }) {
  const u = await oaUserDe(token); if(!u) return json({error:'No autorizado'},401);
  const db=mkDB(), r=await db.listDocuments(DB_ID,T.oauth_apps,[Query.equal('owner',u.email),Query.limit(10)]);
  const out=[];
  for(const a of r.documents){
    const ss=await db.listDocuments(DB_ID,T.oauth_secrets,[Query.equal('app_id',a.$id)]);
    const tk=await db.listDocuments(DB_ID,T.oauth_tokens,[Query.equal('app_id',a.$id),Query.equal('revocado',false),Query.limit(100)]);
    const emails=new Set(tk.documents.map(t=>t.user_email)).size;
    out.push({...a,id:a.$id,secrets:ss.documents.map(s=>({...s,id:s.$id})),usuarios:emails});
  }
  return json({ok:true,apps:out});
}

async function oaAppSave({ token='',id='',nombre='',homepage='',descripcion='',logo='',badge_color='#000000',redirect_uris=[] }) {
  const u=await oaUserDe(token);if(!u)return json({error:'No autorizado'},401);
  nombre=String(nombre||'').trim().slice(0,40);
  if(nombre.length<2)return json({error:'Poné un nombre (mínimo 2 letras)'},400);
  if(!urlOk(homepage))return json({error:'URL de inicio inválida'},400);
  const uris=redirect_uris.map(s=>String(s).trim()).filter(Boolean);
  if(!uris.length)return json({error:'Agregá al menos una redirect URI'},400);
  if(uris.some(x=>!urlOk(x)))return json({error:'Una redirect URI no es válida'},400);
  if(!colorOk(badge_color))return json({error:'Color inválido'},400);
  if(!logoOk(logo))return json({error:'Logo inválido o muy pesado'},400);
  const db=mkDB(), ahora=new Date().toISOString();
  if(id){
    const a=await db.getDocument(DB_ID,T.oauth_apps,id);
    if(a.owner!==u.email)return json({error:'No encontrada'},404);
    await db.updateDocument(DB_ID,T.oauth_apps,id,{nombre,homepage,descripcion,logo,badge_color,redirect_uris:JSON.stringify(uris),actualizado_en:ahora});
    return json({ok:true,id});
  }
  const c=await db.listDocuments(DB_ID,T.oauth_apps,[Query.equal('owner',u.email),Query.limit(10)]);
  if(c.total>=10)return json({error:'Máximo 10 apps'},400);
  const nid=ID.unique(), client_id='apli_'+rand(10);
  await db.createDocument(DB_ID,T.oauth_apps,nid,{client_id,owner:u.email,nombre,homepage,descripcion,logo,badge_color,redirect_uris:JSON.stringify(uris),creado_en:ahora,actualizado_en:ahora});
  return json({ok:true,id:nid,client_id});
}

async function oaAppDelete({token='',id=''}) {
  const u=await oaUserDe(token);if(!u)return json({error:'No autorizado'},401);
  const db=mkDB(),a=await db.getDocument(DB_ID,T.oauth_apps,id);
  if(a.owner!==u.email)return json({error:'No encontrada'},404);
  for(const col of [T.oauth_tokens,T.oauth_codes,T.oauth_secrets]){
    const r=await db.listDocuments(DB_ID,col,[Query.equal('app_id',id),Query.limit(500)]);
    for(const d of r.documents) await db.deleteDocument(DB_ID,col,d.$id);
  }
  await db.deleteDocument(DB_ID,T.oauth_apps,id);
  return json({ok:true});
}

async function oaSecretNew({token='',id=''}) {
  const u=await oaUserDe(token);if(!u)return json({error:'No autorizado'},401);
  const db=mkDB(),a=await db.getDocument(DB_ID,T.oauth_apps,id);
  if(a.owner!==u.email)return json({error:'No encontrada'},404);
  const c=await db.listDocuments(DB_ID,T.oauth_secrets,[Query.equal('app_id',id),Query.limit(5)]);
  if(c.total>=5)return json({error:'Máximo 5 secrets'},400);
  const secret='apsec_'+rand(24);
  const fila=await db.createDocument(DB_ID,T.oauth_secrets,ID.unique(),{app_id:id,hash:await sha256hex(secret),sufijo:secret.slice(-4),creado_en:new Date().toISOString()});
  return json({ok:true,secret,secreto:{...fila,id:fila.$id}});
}

async function oaSecretDelete({token='',id='',secret_id=''}) {
  const u=await oaUserDe(token);if(!u)return json({error:'No autorizado'},401);
  const db=mkDB(),a=await db.getDocument(DB_ID,T.oauth_apps,id);
  if(a.owner!==u.email)return json({error:'No encontrada'},404);
  const c=await db.listDocuments(DB_ID,T.oauth_secrets,[Query.equal('app_id',id),Query.limit(5)]);
  if(c.total<=1)return json({error:'No podés borrar el único secret'},400);
  await db.deleteDocument(DB_ID,T.oauth_secrets,secret_id);
  return json({ok:true});
}

async function oaTokensRevoke({token='',id=''}) {
  const u=await oaUserDe(token);if(!u)return json({error:'No autorizado'},401);
  const db=mkDB(),a=await db.getDocument(DB_ID,T.oauth_apps,id);
  if(a.owner!==u.email)return json({error:'No encontrada'},404);
  const r=await db.listDocuments(DB_ID,T.oauth_tokens,[Query.equal('app_id',id),Query.limit(500)]);
  for(const t of r.documents) await db.updateDocument(DB_ID,T.oauth_tokens,t.$id,{revocado:true});
  const r2=await db.listDocuments(DB_ID,T.oauth_codes,[Query.equal('app_id',id),Query.limit(500)]);
  for(const c of r2.documents) await db.deleteDocument(DB_ID,T.oauth_codes,c.$id);
  return json({ok:true});
}

async function oaAuthorizeInfo({token='',client_id='',redirect_uri=''}) {
  const u=await oaUserDe(token);if(!u)return json({error:'No autorizado'},401);
  const db=mkDB(),r=await db.listDocuments(DB_ID,T.oauth_apps,[Query.equal('client_id',client_id),Query.limit(1)]);
  if(!r.total)return json({error:'App no registrada'},404);
  const a=r.documents[0];
  const uris=JSON.parse(a.redirect_uris||'[]');
  const red=resolveRedirect(uris,redirect_uri);
  if(!red)return json({error:'redirect_uri no coincide'},400);
  return json({ok:true,app:pubApp(a),redirect_host:new URL(red).host,usuario:u});
}

async function oaAuthorizeGrant({token='',client_id='',redirect_uri='',state='',code_challenge='',code_challenge_method=''}) {
  const u=await oaUserDe(token);if(!u)return json({error:'No autorizado'},401);
  const db=mkDB(),r=await db.listDocuments(DB_ID,T.oauth_apps,[Query.equal('client_id',client_id),Query.limit(1)]);
  if(!r.total)return json({error:'App no registrada'},404);
  const a=r.documents[0],uris=JSON.parse(a.redirect_uris||'[]');
  const red=resolveRedirect(uris,redirect_uri);if(!red)return json({error:'redirect_uri no coincide'},400);
  if(code_challenge&&(String(code_challenge_method||'S256')!=='S256'||!/^[A-Za-z0-9_-]{43,128}$/.test(code_challenge)))return json({error:'PKCE inválido'},400);
  const code=rand(32);
  await db.createDocument(DB_ID,T.oauth_codes,ID.unique(),{code_hash:await sha256hex(code),app_id:a.$id,user_email:u.email,user_name:u.nombre,redirect_uri:red,code_challenge:code_challenge||'',expira:new Date(Date.now()+5*60*1000).toISOString(),usado:false});
  return json({ok:true,redirect:withParams(red,{code,state:String(state||'').slice(0,500)})});
}

async function oaAuthorizeDeny({token='',client_id='',redirect_uri='',state=''}) {
  const db=mkDB(),r=await db.listDocuments(DB_ID,T.oauth_apps,[Query.equal('client_id',client_id),Query.limit(1)]);
  const a=r.documents?.[0],uris=JSON.parse(a?.redirect_uris||'[]');
  const red=a?resolveRedirect(uris,redirect_uri):'';
  if(!red)return json({ok:true,redirect:''});
  return json({ok:true,redirect:withParams(red,{error:'access_denied',state:String(state||'').slice(0,500)})});
}

// ───── OAuth: endpoints públicos ─────
async function oauthToken(body, req) {
  let p={};
  if(typeof body==='object'&&body.grant_type) p=body;
  else try { for(const[k,v] of new URLSearchParams(typeof req.body === 'string' ? req.body : '')) p[k]=v; } catch(_){}
  const basic=getHeader(req, 'authorization');
  if(basic.toLowerCase().startsWith('basic ')){
    try{const[i,s]=atob(basic.slice(6)).split(':');p.client_id=p.client_id||i;p.client_secret=p.client_secret||s;}catch(_){}
  }
  if(p.grant_type!=='authorization_code')return oaErr('unsupported_grant_type','Solo authorization_code');
  const db=mkDB(),ar=await db.listDocuments(DB_ID,T.oauth_apps,[Query.equal('client_id',String(p.client_id||'')),Query.limit(1)]);
  if(!ar.total)return oaErr('invalid_client','client_id desconocido',401);
  const app=ar.documents[0];
  const cr=await db.listDocuments(DB_ID,T.oauth_codes,[Query.equal('code_hash',await sha256hex(String(p.code||''))),Query.limit(1)]);
  const fila=cr.documents?.[0];
  if(!fila||fila.app_id!==app.$id||fila.usado||new Date(fila.expira).getTime()<Date.now())return oaErr('invalid_grant','Código inválido o vencido');
  if(p.redirect_uri&&p.redirect_uri!==fila.redirect_uri)return oaErr('invalid_grant','redirect_uri no coincide');
  let auth=false;
  if(p.client_secret){
    const h=await sha256hex(String(p.client_secret));
    const ss=await db.listDocuments(DB_ID,T.oauth_secrets,[Query.equal('app_id',app.$id),Query.limit(5)]);
    const ok=ss.documents.find(s=>s.hash===h);
    if(!ok)return oaErr('invalid_client','client_secret incorrecto',401);
    await db.updateDocument(DB_ID,T.oauth_secrets,ok.$id,{ultimo_uso:new Date().toISOString()});
    auth=true;
  }
  if(fila.code_challenge){
    const enc2=new TextEncoder();
    const d=new Uint8Array(await crypto.subtle.digest('SHA-256',enc2.encode(String(p.code_verifier||''))));
    const v=btoa(String.fromCharCode(...d)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    if(v!==fila.code_challenge)return oaErr('invalid_grant','code_verifier incorrecto');
    auth=true;
  }
  if(!auth)return oaErr('invalid_client','Falta el client_secret',401);
  await db.updateDocument(DB_ID,T.oauth_codes,fila.$id,{usado:true});
  const tok='aplit_'+rand(32);
  await db.createDocument(DB_ID,T.oauth_tokens,ID.unique(),{token_hash:await sha256hex(tok),app_id:app.$id,user_email:fila.user_email,user_name:fila.user_name||'',expira:new Date(Date.now()+30*86400*1000).toISOString(),revocado:false});
  return json({access_token:tok,token_type:'bearer',expires_in:30*86400,scope:'perfil'});
}

async function oauthUserinfo(req) {
  const h=getHeader(req, 'authorization');
  const tok=h.toLowerCase().startsWith('bearer ')?h.slice(7).trim():'';
  if(!tok)return oaErr('invalid_token','Falta el access_token',401);
  const db=mkDB(),r=await db.listDocuments(DB_ID,T.oauth_tokens,[Query.equal('token_hash',await sha256hex(tok)),Query.limit(1)]);
  const t=r.documents?.[0];
  if(!t||t.revocado||new Date(t.expira).getTime()<Date.now())return oaErr('invalid_token','Token inválido o vencido',401);
  return json({sub:t.user_email,email:t.user_email,name:t.user_name||''});
}


// Appwrite Functions Node.js 22 entry point.
// The original business logic returns Web Response objects; this adapter
// forwards their status, headers and body through Appwrite's response API.
module.exports = async ({ req, res, log, error }) => {
  try {
    const result = await handleRequest({ req });
    const responseBody = await result.text();
    const responseHeaders = Object.fromEntries(result.headers.entries());
    return res.send(responseBody, result.status, responseHeaders);
  } catch (e) {
    if (typeof error === 'function') error(e && e.stack ? e.stack : String(e));
    else console.error('APLI COP function:', e);
    return res.json({ error: 'Error interno de la función APLI COP' }, 500);
  }
};
