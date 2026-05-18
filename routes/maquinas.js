const express = require('express');
const router  = express.Router();
const db      = require('../db');

const CAMPOS_LABEL = { host:'Host', serial:'Serial', pertenencia:'Pertenencia', usuario:'Usuario', estado:'Estado' };

async function registrarCambios(maquinaId, anterior, nuevo) {
  for (const campo of Object.keys(CAMPOS_LABEL)) {
    const ant = (anterior[campo] || '').toString().trim();
    const nvo = (nuevo[campo]    || '').toString().trim();
    if (ant !== nvo) {
      await db.query(
        'INSERT INTO historial_maquinas (maquina_id, campo, valor_anterior, valor_nuevo) VALUES ($1,$2,$3,$4)',
        [maquinaId, CAMPOS_LABEL[campo], ant, nvo]
      );
    }
  }
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM maquinas ORDER BY creada_en ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { host, serial, pertenencia, usuario, estado } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO maquinas (host, serial, pertenencia, usuario, estado) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [host ?? '', serial ?? '', pertenencia ?? '', usuario ?? '', estado ?? 'stock']
    );
    const id = rows[0].id;
    await db.query(
      'INSERT INTO historial_maquinas (maquina_id, campo, valor_anterior, valor_nuevo) VALUES ($1,$2,$3,$4)',
      [id, 'Máquina', '', `Creada — Host: ${host || '—'}`]
    );
    res.status(201).json({ id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const { host, serial, pertenencia, usuario, estado } = req.body;
  const id = req.params.id;
  try {
    const { rows: ant } = await db.query('SELECT * FROM maquinas WHERE id=$1', [id]);
    await db.query(
      'UPDATE maquinas SET host=$1, serial=$2, pertenencia=$3, usuario=$4, estado=$5 WHERE id=$6',
      [host, serial, pertenencia, usuario, estado ?? 'stock', id]
    );
    if (ant.length > 0) await registrarCambios(id, ant[0], { host, serial, pertenencia, usuario, estado });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const { rows } = await db.query('SELECT * FROM maquinas WHERE id=$1', [id]);
    if (rows.length > 0) {
      await db.query(
        'INSERT INTO historial_maquinas (maquina_id, campo, valor_anterior, valor_nuevo) VALUES ($1,$2,$3,$4)',
        [id, 'Máquina', `Host: ${rows[0].host || '—'}`, 'Eliminada']
      );
    }
    await db.query('DELETE FROM maquinas WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/historial', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM historial_maquinas WHERE maquina_id=$1 ORDER BY fecha DESC LIMIT 50',
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
