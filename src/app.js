require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: [
      'https://test-sistema-inclusivo.web.app',           // mi frontend en Firebase
      'https://backend-inclusivo-tesis.onrender.com'      // mi backend en Render 
    ],
    credentials: true // JWT en headers
  }));
  
app.use(express.json());

// Rutas iniciales
app.use('/api/pacientes', require('./routes/paciente.routes'));
// Rutas de autenticación
app.use('/api/auth', require('./routes/auth.routes'));
// Rutas de citas
app.use('/api/citas', require('./routes/cita.routes'));
// Rutas de llamados
app.use('/api/llamados', require('./routes/llamado.routes'));
// Rutas de usuarios (solo administrador)
app.use('/api/usuarios', require('./routes/usuario.routes'));
// Rutas de reportes (solo administrador y secretaria)
app.use('/api/reportes', require('./routes/reporte.routes'));

module.exports = app;