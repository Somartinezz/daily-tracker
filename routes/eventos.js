const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM eventos ORDER BY fecha ASC, hora_inicio ASC');
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { titulo, fecha, hora_inicio, hora_fin, descripcion, color } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO eventos (titulo, fecha, hora_inicio, hora_fin, descripcion, color) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [titulo, fecha, hora_inicio||null, hora_fin||null, descripcion||'', color||'#c4783a']
    );
    res.status(201).json({ id: rows[0].id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const { titulo, fecha, hora_inicio, hora_fin, descripcion, color } = req.body;
  try {
    await db.query(
      'UPDATE eventos SET titulo=$1, fecha=$2, hora_inicio=$3, hora_fin=$4, descripcion=$5, color=$6 WHERE id=$7',
      [titulo, fecha, hora_inicio||null, hora_fin||null, descripcion||'', color||'#c4783a', req.params.id]
    );
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM eventos WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
