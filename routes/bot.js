/**
 * Teams Bot — webhook handler para Azure Bot Framework
 * Endpoint público: POST /api/bot/messages
 *
 * Variables de entorno necesarias:
 *   MICROSOFT_APP_ID       — App ID del Azure Bot
 *   MICROSOFT_APP_PASSWORD — Client secret del Azure Bot
 *   GROQ_API_KEY           — API key de Groq (opcional, fallback a reglas locales)
 */
const { CloudAdapter, ConfigurationBotFrameworkAuthentication } = require('botbuilder');
const { clasificarConGroq } = require('./tickets');
const db = require('../db');

const botAuth = new ConfigurationBotFrameworkAuthentication({
  MicrosoftAppId:       process.env.MICROSOFT_APP_ID       || '',
  MicrosoftAppPassword: process.env.MICROSOFT_APP_PASSWORD  || '',
  MicrosoftAppType:     'MultiTenant'
});

const adapter = new CloudAdapter(botAuth);

/* Manejo de errores del adaptador */
adapter.onTurnError = async (context, error) => {
  console.error('[Bot] Error en turno:', error.message);
  await context.sendActivity('Hubo un error procesando tu solicitud. Intentá de nuevo.');
};

/* Handler principal */
async function messageHandler(context) {
  if (context.activity.type !== 'message') return;

  const mensaje = (context.activity.text || '').trim();
  if (!mensaje) return;

  const usuario = context.activity.from?.name || context.activity.from?.id || 'Desconocido';

  /* Confirmación inmediata mientras clasifica */
  await context.sendActivity(`⏳ Recibí tu mensaje, estoy creando el ticket...`);

  try {
    const { categoria, prioridad, resumen } = await clasificarConGroq(mensaje);

    const { rows } = await db.query(
      `INSERT INTO tickets (usuario, descripcion, resumen, categoria, prioridad, estado)
       VALUES ($1,$2,$3,$4,$5,'abierto') RETURNING id`,
      [usuario, mensaje, resumen, categoria, prioridad]
    );

    const id = rows[0].id;
    const prioBadge = { alta: '🔴 Alta', media: '🟡 Media', baja: '🟢 Baja' }[prioridad] || prioridad;

    await context.sendActivity(
      `✅ **Ticket #${id} creado**\n\n` +
      `📋 **Categoría:** ${categoria}\n` +
      `${prioBadge} **Prioridad**\n` +
      `📝 ${resumen}\n\n` +
      `El equipo de IT va a estar en contacto. ¡Gracias!`
    );
  } catch(e) {
    console.error('[Bot] Error al crear ticket:', e.message);
    await context.sendActivity('No pude crear el ticket en este momento. Contactá a IT directamente.');
  }
}

/* Express route handler — se usa en server.js como ruta pública */
async function botHandler(req, res) {
  await adapter.process(req, res, messageHandler);
}

module.exports = botHandler;
