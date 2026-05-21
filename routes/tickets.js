const express = require('express');
const router  = express.Router();
const db      = require('../db');

/* Clasificación con Groq — si no hay API key, usa reglas simples */
async function clasificarConGroq(mensaje) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return clasificarLocal(mensaje);
  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [{
          role: 'system',
          content: `Sos un asistente de soporte IT. Analizá el mensaje del usuario y respondé SOLO con JSON válido (sin markdown):
{"categoria": "<una de: Correo / Outlook | Equipos / Hardware | Accesos / Permisos | Software / Sistema | Red / Conectividad | Otros>", "prioridad": "<alta | media | baja>", "resumen": "<resumen en una oración de máx 100 caracteres>"}`
        }, {
          role: 'user',
          content: mensaje
        }],
        temperature: 0.1,
        max_tokens: 200
      })
    });
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';
    const json = JSON.parse(content.replace(/```json?/g,'').replace(/```/g,'').trim());
    return { categoria: json.categoria||'Otros', prioridad: json.prioridad||'media', resumen: json.resumen||mensaje.slice(0,100) };
  } catch {
    return clasificarLocal(mensaje);
  }
}

function clasificarLocal(mensaje) {
  const t = mensaje.toLowerCase();
  let categoria = 'Otros', prioridad = 'media';
  if (['outlook','correo','mail','email','bandeja','exchange'].some(k=>t.includes(k))) categoria = 'Correo / Outlook';
  else if (['notebook','laptop','pc','equipo','celular','teclado','mouse','impresora','monitor','hardware'].some(k=>t.includes(k))) categoria = 'Equipos / Hardware';
  else if (['contraseña','password','clave','acceso','permiso','vpn','cuenta','bloqueado','reset'].some(k=>t.includes(k))) categoria = 'Accesos / Permisos';
  else if (['windows','office','excel','word','programa','instalar','software','sistema','driver'].some(k=>t.includes(k))) categoria = 'Software / Sistema';
  else if (['internet','red','wifi','conexion','conexión','no conecta','lento','lenta'].some(k=>t.includes(k))) categoria = 'Red / Conectividad';
  if (['urgente','no puedo trabajar','no funciona nada','caído','caida','bloqueado','sin acceso'].some(k=>t.includes(k))) prioridad = 'alta';
  else if (['cuando puedas','sin apuro','menor'].some(k=>t.includes(k))) prioridad = 'baja';
  return { categoria, prioridad, resumen: mensaje.slice(0,100) };
}

/* GET /api/tickets */
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM tickets ORDER BY fecha_creacion DESC LIMIT 200');
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

/* POST /api/tickets — recibe { usuario, mensaje } */
router.post('/', async (req, res) => {
  const { usuario, mensaje } = req.body;
  if (!usuario || !mensaje) return res.status(400).json({ error: 'usuario y mensaje requeridos' });
  try {
    const { categoria, prioridad, resumen } = await clasificarConGroq(mensaje);
    const { rows } = await db.query(
      `INSERT INTO tickets (usuario, descripcion, resumen, categoria, prioridad, estado)
       VALUES ($1,$2,$3,$4,$5,'abierto') RETURNING id`,
      [usuario, mensaje, resumen, categoria, prioridad]
    );
    res.status(201).json({ id: rows[0].id, categoria, prioridad, resumen });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

/* PATCH /api/tickets/:id — cambia estado */
router.patch('/:id', async (req, res) => {
  const { estado } = req.body;
  const ESTADOS = ['abierto','en progreso','resuelto','cerrado'];
  if (!ESTADOS.includes(estado)) return res.status(400).json({ error: 'estado inválido' });
  try {
    await db.query(
      'UPDATE tickets SET estado=$1, fecha_actualizacion=NOW() WHERE id=$2',
      [estado, req.params.id]
    );
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
module.exports.clasificarConGroq = clasificarConGroq;
