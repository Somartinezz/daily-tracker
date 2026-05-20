const express = require('express');
const cors    = require('cors');
const path    = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

/* ─── SESIÓN ─── */
app.use(session({
  secret: process.env.SESSION_SECRET || 'dt-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 8 * 60 * 60 * 1000,  // 8 horas
    httpOnly: true,
    secure: false
  }
}));

/* ─── MIDDLEWARE: verificar sesión ─── */
function requireAuth(req, res, next) {
  if (req.session && req.session.autenticado) return next();
  res.redirect('/login');
}

/* ─── RUTAS PÚBLICAS: login ─── */
app.get('/login', (req, res) => {
  if (req.session && req.session.autenticado) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body;
  const USER = process.env.LOGIN_USER || 'somartinez';
  const PASS = process.env.LOGIN_PASS || 'Cepas2026';

  if (usuario === USER && password === PASS) {
    req.session.autenticado = true;
    req.session.usuario = usuario;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

/* ─── RUTAS PROTEGIDAS ─── */
app.use('/api/tareas',   requireAuth, require('./routes/tareas'));
app.use('/api/maquinas', requireAuth, require('./routes/maquinas'));
app.use('/api/cierre',   requireAuth, require('./routes/cierre'));
app.use('/api/usuarios', requireAuth, require('./routes/usuarios'));

/* ─── ADMIN: categorizar historial ─── */
app.post('/api/admin/categorizar', requireAuth, async (req, res) => {
  const db = require('./db');
  const REGLAS = [
    { categoria:'Correo / Outlook',    keywords:['outlook','correo','mail','email','bandeja','firma','calendario','teams','meeting','reunion','reunión','invitación','invitacion','microsoft','exchange','adjunto','mensaje','inbox','spam','distribution'] },
    { categoria:'Equipos / Hardware',  keywords:['notebook','laptop','computadora','pc','equipo','celular','teléfono','telefono','auricular','headset','teclado','mouse','monitor','pantalla','impresora','escaner','scanner','disco','ram','batería','bateria','cargador','cable','usb','hdmi','docking','webcam','microfono','micrófono','cambio de equipo','reemplazo','formatear','hardware'] },
    { categoria:'Accesos / Permisos',  keywords:['contraseña','password','clave','acceso','permiso','permisos','cuenta','active directory','token','mfa','autenticación','autenticacion','2fa','bloqueo','bloqueado','bloqueada','desbloquear','login','no puede entrar','no entra','no accede','resetear','reset','expiró','expiro','nuevo usuario','nueva cuenta','carpeta compartida','carpeta de red','drive','unidad de red'] },
    { categoria:'Software / Sistema',  keywords:['windows','office','excel','word','powerpoint','pdf','adobe','chrome','firefox','navegador','programa','aplicación','aplicacion','software','instalación','instalacion','instalar','actualización','actualizacion','sistema operativo','driver','controlador','pantalla azul','virus','antivirus','licencia','activación','sap','erp','crm','zoom','slack','autocad','licencia','macro','vba'] },
    { categoria:'Red / Conectividad',  keywords:['internet','red','wifi','wi-fi','wireless','ethernet','conexión','conexion','conectividad','vpn','ping','lento','lenta','sin internet','sin conexion','sin conexión','router','switch','firewall','proxy','dns','ip','no conecta','no se conecta','no tiene red'] }
  ];
  function clasificar(texto) {
    const t = texto.toLowerCase();
    for (const r of REGLAS) { if (r.keywords.some(k => t.includes(k))) return r.categoria; }
    return 'Otros';
  }
  try {
    const { rows } = await db.query("SELECT id, texto, categoria FROM tareas");
    let n = 0;
    for (const t of rows) {
      if (t.categoria && t.categoria.trim()) continue;
      const cat = clasificar(t.texto);
      await db.query("UPDATE tareas SET categoria=$1 WHERE id=$2", [cat, t.id]);
      n++;
    }
    res.json({ ok: true, actualizadas: n });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

/* ─── SEED: máquinas DASS ─── */
app.post('/api/admin/seed-maquinas', requireAuth, async (req, res) => {
  const db = require('./db');
  const MAQUINAS = [
    { serial:'LR0DB04B',  pertenencia:'DASS' },
    { serial:'SPF3ENA3V', pertenencia:'DASS' },
    { serial:'PF3NY4P2',  pertenencia:'DASS' },
    { serial:'LR0F4ATH',  pertenencia:'DASS' },
    { serial:'PF3NHA8Q',  pertenencia:'DASS' },
    { serial:'PF3NH5N9',  pertenencia:'DASS' },
  ];
  try {
    let n = 0;
    for (const m of MAQUINAS) {
      const { rows } = await db.query('SELECT id FROM maquinas WHERE serial=$1', [m.serial]);
      if (rows.length > 0) continue;
      await db.query(
        'INSERT INTO maquinas (host, serial, pertenencia, usuario, estado) VALUES ($1,$2,$3,$4,$5)',
        ['', m.serial, m.pertenencia, 'Disponible', 'stock']
      );
      n++;
    }
    res.json({ ok: true, insertadas: n });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

/* ─── ADMIN: asignar usuario_atendido desde el nombre al inicio de la tarea ─── */
app.post('/api/admin/asignar-usuarios', requireAuth, async (req, res) => {
  const db = require('./db');
  try {
    const { rows } = await db.query("SELECT id, texto, usuario_atendido FROM tareas");
    let n = 0;
    for (const t of rows) {
      if (t.usuario_atendido && t.usuario_atendido.trim()) continue;
      /* Detectar patrón "Nombre [Apellido] [–|-|:] descripción"
         El separador puede ser –  —  -  :  seguido de espacio o fin */
      const match = t.texto.match(/^([A-ZÁÉÍÓÚÜÑa-záéíóúüñ][a-záéíóúüñA-ZÁÉÍÓÚÜÑ]*(?:\s+[A-ZÁÉÍÓÚÜÑa-záéíóúüñ][a-záéíóúüñA-ZÁÉÍÓÚÜÑ]*)?)[\s]*[–—\-:][\s]/u);
      if (!match) continue;
      const nombre = match[1].trim();
      /* Descartar si el "nombre" es una palabra genérica o muy corta */
      const IGNORAR = new Set(['instalar','cambiar','revisar','actualizar','configurar','conectar','error','problema','soporte','ayuda','tarea','usuario','equipo']);
      if (nombre.length < 3 || IGNORAR.has(nombre.toLowerCase())) continue;
      await db.query("UPDATE tareas SET usuario_atendido=$1 WHERE id=$2", [nombre, t.id]);
      n++;
    }
    res.json({ ok: true, actualizadas: n });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

/* ─── ARCHIVOS ESTÁTICOS (requiere auth excepto login.html) ─── */
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(path.join(__dirname)));

/* ─── CATCH-ALL ─── */
app.get('/{*path}', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
