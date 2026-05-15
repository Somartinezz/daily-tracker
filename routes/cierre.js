const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/:fecha', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM cierre_dia WHERE fecha=$1', [req.params.fecha]);
    res.json(rows[0] ?? { fecha: req.params.fecha, texto: '' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:fecha', async (req, res) => {
  const { texto } = req.body;
  try {
    await db.query(
      `INSERT INTO cierre_dia (fecha, texto) VALUES ($1,$2)
       ON CONFLICT (fecha) DO UPDATE SET texto=$2`,
      [req.params.fecha, texto]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
