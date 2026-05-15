const express = require('express');
const router  = express.Router();
const db      = require('../db');

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
    res.status(201).json({ id: rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const { host, serial, pertenencia, usuario, estado } = req.body;
  try {
    await db.query(
      'UPDATE maquinas SET host=$1, serial=$2, pertenencia=$3, usuario=$4, estado=$5 WHERE id=$6',
      [host, serial, pertenencia, usuario, estado ?? 'stock', req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM maquinas WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
