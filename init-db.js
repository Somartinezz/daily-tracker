const db = require('./db');

async function init() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tareas (
      id          VARCHAR(36) PRIMARY KEY,
      texto       VARCHAR(200) NOT NULL,
      completada  BOOLEAN DEFAULT FALSE,
      resolucion  VARCHAR(500) DEFAULT '',
      prioridad   VARCHAR(10) DEFAULT 'media',
      creada_en   TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`ALTER TABLE tareas ADD COLUMN IF NOT EXISTS prioridad VARCHAR(10) DEFAULT 'media'`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS maquinas (
      id          SERIAL PRIMARY KEY,
      host        VARCHAR(80) DEFAULT '',
      serial      VARCHAR(80) DEFAULT '',
      pertenencia VARCHAR(80) DEFAULT '',
      usuario     VARCHAR(80) DEFAULT '',
      estado      VARCHAR(20) DEFAULT 'stock',
      creada_en   TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'stock'`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS cierre_dia (
      fecha DATE PRIMARY KEY,
      texto TEXT DEFAULT ''
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS racha (
      id        SERIAL PRIMARY KEY,
      fecha     DATE NOT NULL,
      conteo    INT DEFAULT 1
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id            SERIAL PRIMARY KEY,
      nombre        VARCHAR(100) NOT NULL DEFAULT '',
      email         VARCHAR(100) DEFAULT '',
      departamento  VARCHAR(80)  DEFAULT '',
      equipo        VARCHAR(80)  DEFAULT '',
      cargo         VARCHAR(80)  DEFAULT '',
      activo        BOOLEAN      DEFAULT TRUE,
      creada_en     TIMESTAMP    DEFAULT NOW()
    )
  `);

  await db.query(`ALTER TABLE tareas ADD COLUMN IF NOT EXISTS usuario_atendido VARCHAR(80) DEFAULT ''`);
  await db.query(`ALTER TABLE tareas ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT ''`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS historial_maquinas (
      id             SERIAL PRIMARY KEY,
      maquina_id     INT NOT NULL,
      campo          VARCHAR(50) NOT NULL,
      valor_anterior TEXT DEFAULT '',
      valor_nuevo    TEXT DEFAULT '',
      fecha          TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log('Tablas OK');
  await db.end();
}

init().catch(e => { console.error(e); process.exit(1); });
