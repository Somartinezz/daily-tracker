const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM tareas ORDER BY creada_en DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { id, texto, completada, resolucion, prioridad, creada_en, usuario_atendido } = req.body;
  try {
    await db.query(
      'INSERT INTO tareas (id, texto, completada, resolucion, prioridad, creada_en, usuario_atendido) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [id, texto, completada ?? false, resolucion ?? '', prioridad ?? 'media', creada_en ?? new Date(), usuario_atendido ?? '']
    );
    res.status(201).json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const { texto, completada, resolucion, prioridad, usuario_atendido } = req.body;
  try {
    await db.query(
      'UPDATE tareas SET texto=$1, completada=$2, resolucion=$3, prioridad=$4, usuario_atendido=$5 WHERE id=$6',
      [texto, completada, resolucion, prioridad ?? 'media', usuario_atendido ?? '', req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM tareas WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
