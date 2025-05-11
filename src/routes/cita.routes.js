const { Router } = require('express');
const router = Router();
const {
    obtenerCitas,
    crearCita,
    obtenerCitaPorId,
    actualizarCita,
    eliminarCita,
    obtenerCitasVisor
} = require('../controllers/cita.controller');
router.get('/visor', obtenerCitasVisor);  // 🔴 sin token, primero
const { verificarToken, permitirRoles } = require('../middleware/auth.middleware');
// Rutas protegidas
router.get('/', verificarToken, permitirRoles('Secretaria', 'Medico', 'Administrador'), obtenerCitas);
router.post('/', verificarToken, permitirRoles('Secretaria', 'Administrador'), crearCita);
router.get('/:id', verificarToken, permitirRoles('Secretaria', 'Medico', 'Administrador'), obtenerCitaPorId);
router.put('/:id', verificarToken, permitirRoles('Secretaria', 'Administrador'), actualizarCita);
router.delete('/:id', verificarToken, permitirRoles('Administrador'), eliminarCita);

module.exports = router;