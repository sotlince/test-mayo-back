const jwt = require('jsonwebtoken');

// Verifica que el token sea válido
const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ ok: false, mensaje: 'Token no proporcionado' });
    }
console.log('HEADER:', req.headers['authorization']);
console.log('TOKEN LIMPIO:', token);
    try {
        // Quita el prefijo "Bearer " si viene así
        const tokenLimpio = token.replace('Bearer ', '');
        const decoded = jwt.verify(tokenLimpio, process.env.JWT_SECRET);

        req.usuario = decoded; // guardamos info del usuario en la request
        next();
    } catch (error) {
        return res.status(401).json({ ok: false, mensaje: 'Token inválido o expirado' });
    }
};

// Verifica que el usuario tenga uno de los roles permitidos
const permitirRoles = (...rolesPermitidos) => {
    return (req, res, next) => {
        const { rol } = req.usuario;
        console.log('ROL DEL TOKEN:', rol); // ✅ Usa la variable correcta
        console.log('Roles permitidos:', rolesPermitidos);


        if (!rolesPermitidos.includes(rol)) {
            return res.status(403).json({ ok: false, mensaje: 'Acceso denegado por rol' });
        }

        next();
    };
};

module.exports = {
    verificarToken,
    permitirRoles
};