const db = require('./db');

async function init() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tareas (
      id          VARCHAR(36) PRIMARY KEY,
      texto       VARCHAR(200) NOT NULL,
      completada  BOOLEAN DEFAULT FALSE,
      resolucion  VARCHAR(500) DEFAULT '',
      creada_en   TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS maquinas (
      id          SERIAL PRIMARY KEY,
      host        VARCHAR(80) DEFAULT '',
      serial      VARCHAR(80) DEFAULT '',
      pertenencia VARCHAR(80) DEFAULT '',
      usuario     VARCHAR(80) DEFAULT '',
      creada_en   TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS cierre_dia (
      fecha DATE PRIMARY KEY,
      texto TEXT DEFAULT ''
    )
  `);

  console.log('Tablas creadas OK');
  await db.end();
}

init().catch(e => { console.error(e); process.exit(1); });
