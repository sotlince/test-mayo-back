const { Router } = require('express');
const router = Router();

const {  llamarPaciente,
    obtenerLlamados,
    obtenerHistorialLlamados,
    actualizarEstadoLlamado,
    obtenerLlamadosOrdenados,
    actualizarOrdenManual,
    obtenerDashboardLlamados} = require('../controllers/llamado.controller');
const { verificarToken, permitirRoles } = require('../middleware/auth.middleware');

// 📊 GET: Obtener llamados ordenados por prioridad y timestamp
router.get('/ordenados', verificarToken, permitirRoles('Secretaria', 'Administrador'), obtenerLlamadosOrdenados);

// ✏️ PUT: Actualizar orden manual de un llamado
router.put('/orden/:id', verificarToken, permitirRoles('Secretaria', 'Administrador'), actualizarOrdenManual);

// 📋 Historial (antes que :id)
router.get('/historial', verificarToken, permitirRoles('Administrador'), obtenerHistorialLlamados);

// 🔄 PUT: Cambiar estado del llamado
router.put('/:id', verificarToken, permitirRoles('Secretaria', 'Administrador'), actualizarEstadoLlamado);

// 🔘 POST: Llamar a un paciente
router.post('/:pacienteId', verificarToken, permitirRoles('Secretaria', 'Administrador'), llamarPaciente);

// 📺 GET: Visualizar llamados activos (en memoria)
router.get('/', obtenerLlamados);

// 📊 GET: Obtener dashboard de llamados activos, pendientes y atendidos
router.get('/dashboard', obtenerDashboardLlamados);

module.exports = router;
