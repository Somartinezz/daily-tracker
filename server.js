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
