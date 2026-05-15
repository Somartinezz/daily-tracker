const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM usuarios ORDER BY nombre ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { nombre, email, departamento, equipo, cargo, activo } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO usuarios (nombre, email, departamento, equipo, cargo, activo) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [nombre ?? '', email ?? '', departamento ?? '', equipo ?? '', cargo ?? '', activo ?? true]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const { nombre, email, departamento, equipo, cargo, activo } = req.body;
  try {
    await db.query(
      'UPDATE usuarios SET nombre=$1, email=$2, departamento=$3, equipo=$4, cargo=$5, activo=$6 WHERE id=$7',
      [nombre, email, departamento, equipo, cargo, activo ?? true, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM usuarios WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
