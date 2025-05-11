// 📁 src/routes/reporte.routes.js
const { Router } = require('express');
const router = Router();
const { verificarToken, permitirRoles } = require('../middleware/auth.middleware');

const {
  reporteCitasAtendidas,
  reporteCitasPendientes,
  reporteLlamadosPorPrioridad,
  reporteUsuariosPorRol
} = require('../controllers/reporte.controller');

// 📅 Reporte: Citas atendidas por rango de fechas
router.get('/citas-atendidas', verificarToken, permitirRoles('Administrador', 'Secretaria'), reporteCitasAtendidas);

// 📅 Reporte: Citas pendientes
router.get('/citas-pendientes', verificarToken, permitirRoles('Administrador', 'Secretaria'), reporteCitasPendientes);

// 📣 Reporte: Llamados agrupados por prioridad
router.get('/llamados-por-prioridad', verificarToken, permitirRoles('Administrador', 'Secretaria'), reporteLlamadosPorPrioridad);

// 👥 Reporte: Usuarios agrupados por rol
router.get('/usuarios-por-rol', verificarToken, permitirRoles('Administrador'), reporteUsuariosPorRol);

module.exports = router;