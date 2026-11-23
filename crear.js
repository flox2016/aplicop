const sdk = require('node-appwrite');

// 👇 1. PEGÁ TU ENDPOINT:
const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';

// 👇 2. PEGÁ TU API KEY:
const API_KEY = 'standard_a0ac88c151d2d20c35217930bfd1e286572f59cb81c518357d167d825bbb73b78f951056973621cc4a166581113b66ec9c562d6a630c77c1800ec6697cf66e6dfb2faca6f0e60ba0b8a50b4c6d1dd148b462ec89131d16f4cf056c44c5debb46dcc23b1b71fbbea41dedb3accc0173b4b91b43414953e82484e39c51a25c150a';

const client = new sdk.Client()
  .setEndpoint(ENDPOINT)
  .setProject('akjkf')
  .setKey(API_KEY);

const tablesDB = new sdk.TablesDB(client);
const databaseId = 'aplicop';

// 👇 Permisos que Claude te haya pedido (ej: lectura/escritura pública con Any):
const permisos = [
  sdk.Permission.read(sdk.Role.any()),
  sdk.Permission.create(sdk.Role.any()),
  sdk.Permission.update(sdk.Role.any()),
  sdk.Permission.delete(sdk.Role.any())
];

async function ponerPermisos() {
  const lista = await tablesDB.listTables({ databaseId });
  for (const tabla of lista.tables) {
    try {
      await tablesDB.updateTable({
        databaseId,
        tableId: tabla.$id,
        name: tabla.name,
        permissions: permisos
      });
      console.log(`✔ Permisos aplicados a: ${tabla.name}`);
    } catch (e) {
      console.log(`⚠️ Error en ${tabla.name}:`, e.message || e);
    }
  }
  console.log('\n🎉 ¡LISTO! Permisos actualizados en todas las tablas.');
}

ponerPermisos();
