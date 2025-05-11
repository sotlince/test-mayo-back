const { Router } = require('express');
const router = Router();

const { login, register, getProfile } = require('../controllers/auth.controller');
const { verificarToken, permitirRoles } = require('../middleware/auth.middleware');

router.post('/login', login);

// Nuevo: Solo admins pueden registrar usuarios
//router.post('/register', verificarToken, permitirRoles('Administrador'), register);
router.post('/register', register);
// Nuevo: Obtener perfil desde token
router.get('/profile', verificarToken, getProfile);

module.exports = router;
