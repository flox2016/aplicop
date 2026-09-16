// APLI COP — conexión con la Edge Function groq-chat
// IMPORTANTE: NO pongas una clave gsk_... de Groq aquí ni en ningún HTML público.
// La clave de Groq debe permanecer guardada como GROQ_API_KEY en Supabase.

const SUPABASE_FUNCTION_URL =
  'https://rymogjfcxjguylcdxuqr.supabase.co/functions/v1/groq-chat';

/**
 * Envía un mensaje a Chefi mediante la Edge Function de Supabase.
 * La Edge Function se encarga de usar GROQ_API_KEY en el servidor.
 *
 * @param {string} message Mensaje del usuario.
 * @returns {Promise<string>} Respuesta de Chefi.
 */
async function preguntarAChefi(message) {
  const response = await fetch(SUPABASE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // Si tu Edge Function tiene verify_jwt activado, agrega aquí:
      // 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ message })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `Chefi API ${response.status}: ${data.error || data.message || 'Error desconocido'}`
    );
  }

  return data.reply || data.response || data.message || JSON.stringify(data);
}
