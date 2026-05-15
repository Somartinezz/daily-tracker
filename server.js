const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

/* Servir el frontend estático */
app.use(express.static(path.join(__dirname)));

/* Rutas de la API */
app.use('/api/tareas',   require('./routes/tareas'));
app.use('/api/maquinas', require('./routes/maquinas'));
app.use('/api/cierre',   require('./routes/cierre'));
app.use('/api/usuarios', require('./routes/usuarios'));

/* Cualquier otra ruta devuelve el index.html */
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
