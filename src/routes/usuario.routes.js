// 📁 src/routes/usuario.routes.js
const { Router } = require('express');
const router = Router();
const { listarUsuarios, eliminarUsuario, actualizarRol, editarUsuario, listarRoles 
} = require('../controllers/usuario.controller');
const { verificarToken, permitirRoles } = require('../middleware/auth.middleware');

// Listar todos los usuarios (solo Admin)
router.get('/', verificarToken, permitirRoles('Administrador'), listarUsuarios);

// Eliminar usuario por ID (solo Admin)
router.delete('/:id', verificarToken, permitirRoles('Administrador'), eliminarUsuario);

// Actualizar rol de usuario (solo Admin)
router.put('/:id/rol', verificarToken, permitirRoles('Administrador'), actualizarRol);

// Editar usuario (Admin a cualquiera, usuario común solo a sí mismo)
router.put('/:id', verificarToken, editarUsuario); // 👈 nueva ruta aquí

// Listar todos los roles (cualquier usuario logueado)
router.get('/roles', verificarToken, listarRoles);

module.exports = router;