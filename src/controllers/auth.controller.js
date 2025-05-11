const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const supabase = require('../config/supabase');

// Controlador para manejar el registro y login de usuarios
const register = async (req, res) => {
    const { nombre_completo, correo, telefono, password, id_rol, id_especialidad } = req.body;

    if (!nombre_completo || !correo || !password || !id_rol) {
        return res.status(400).json({ ok: false, mensaje: 'Faltan datos obligatorios' });
    }

    try {
        // Si se intenta crear un ADMIN, validar token de admin
        if (id_rol === 1) {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ ok: false, mensaje: 'Token requerido para crear administrador' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.rol !== 'Administrador') {
                return res.status(403).json({ ok: false, mensaje: 'Solo un administrador puede crear otro administrador' });
            }
        }

        // Verificar si el correo ya está registrado
        const { data: existente, error: errorExistente } = await supabase
            .from('usuarios')
            .select('id_usuario')
            .eq('correo', correo)
            .single();

        if (existente) {
            return res.status(400).json({ ok: false, mensaje: 'El correo ya está registrado' });
        }

        // Si viene id_especialidad, validar que exista
        let especialidadValida = null;
        if (id_rol === 3 && id_especialidad) {
            const { data: especialidad, error: errorEspecialidad } = await supabase
                .from('especialidades')
                .select('id_especialidad')
                .eq('id_especialidad', id_especialidad)
                .single();

            if (errorEspecialidad || !especialidad) {
                return res.status(400).json({ ok: false, mensaje: 'Especialidad no válida' });
            }

            especialidadValida = id_especialidad;
        }

        // Hashear la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Crear nuevo usuario
        const nuevoUsuario = {
            nombre_completo,
            correo,
            telefono,
            contrasena: hashedPassword,
            id_rol,
            id_especialidad: id_rol === 3 ? especialidadValida : null
        };

        const { data, error } = await supabase
            .from('usuarios')
            .insert([nuevoUsuario])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            ok: true,
            mensaje: 'Usuario creado correctamente',
            usuario: {
                id: data.id_usuario,
                nombre: data.nombre_completo,
                correo: data.correo,
                id_rol: data.id_rol,
                id_especialidad: data.id_especialidad
            }
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error al registrar usuario' });
    }
};

// Controlador para manejar el login de usuarios
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscar usuario solo por correo
        const { data: usuario, error: errorUsuario } = await supabase
            .from('usuarios')
            .select('*')
            .eq('correo', email)
            .single();

        if (errorUsuario || !usuario) {
            return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });
        }

        // Comparar contraseñas usando bcrypt
        const isMatch = await bcrypt.compare(password, usuario.contrasena);
        if (!isMatch) {
            return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });
        }

        // Buscar el nombre del rol en base al id_rol
        const { data: rolData, error: errorRol } = await supabase
            .from('roles')
            .select('nombre_rol')
            .eq('id_rol', usuario.id_rol)
            .single();

        if (errorRol || !rolData) {
            return res.status(500).json({ ok: false, mensaje: 'Error al obtener el rol del usuario' });
        }

        // Crear token con id y rol
        const token = jwt.sign(
            {
                id: usuario.id_usuario,
                rol: rolData.nombre_rol
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({
            ok: true,
            mensaje: 'Login exitoso',
            token
        });

    } catch (error) {
        console.error('Error en login:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
    }
};



// Nuevo: Obtener perfil desde el token
const getProfile = async (req, res) => {
    const usuarioId = req.usuario.id;

    try {
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select(`
                id_usuario,
                nombre_completo,
                correo,
                telefono,
                id_especialidad,
                roles (
                    nombre_rol
                )
            `)
            .eq('id_usuario', usuarioId)
            .single();

        if (error || !usuario) {
            return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
        }

        res.json({
            ok: true,
            usuario: {
                id: usuario.id_usuario,
                nombre: usuario.nombre_completo,
                correo: usuario.correo,
                telefono: usuario.telefono,
                rol: usuario.roles?.nombre_rol || 'No definido',
                id_especialidad: usuario.id_especialidad
            }
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener perfil' });
    }
};


module.exports = {
    login,
    register,
    getProfile
};
