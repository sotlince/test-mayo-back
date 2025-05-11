const { Router } = require('express');
const router = Router();
// Importar todos los controladores desde un solo lugar
const {
    obtenerPacientes,
    crearPaciente,
    getPacienteById,
    actualizarPaciente,
    eliminarPaciente,
    getPacienteCompleto
} = require('../controllers/paciente.controller');

// Importar middleware de seguridad
const { verificarToken, permitirRoles } = require('../middleware/auth.middleware');

// 📌 Públicos (no requieren login)
router.get('/', obtenerPacientes);            // Listado de pacientes
router.post('/', crearPaciente);               // Registro público

// 🔐 Protegidos (requieren token + rol)
router.get('/:id', verificarToken, permitirRoles('Medico', 'Administrador'), getPacienteById);
router.put('/:id', verificarToken, permitirRoles('Medico', 'Administrador'), actualizarPaciente);

// 🔥 Nueva ruta corregida
router.get('/:id/completo', verificarToken, permitirRoles('Medico', 'Administrador'), getPacienteCompleto);

router.delete('/:id', verificarToken, permitirRoles('Administrador'), eliminarPaciente);

module.exports = router;