const supabase = require('../config/supabase');

// 📋 GET: Listar todos los usuarios
// 🔐 Solo Administrador
const listarUsuarios = async (req, res) => {
  try {
    const { data, error } = await supabase.from('usuarios').select('*');
    if (error) throw error;
    res.json({ ok: true, usuarios: data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al listar usuarios', error: error.message });
  }
};

// 🗑️ DELETE: Eliminar un usuario por ID
// 🔐 Solo Administrador
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const idSuperAdmin = '478c34a6-27fd-43f6-91ac-014238297822'; //siempre deberia existir este Usuario en la BD

    if (id === idSuperAdmin) {
      return res.status(400).json({ ok: false, mensaje: 'No se puede eliminar al superadministrador' });
    }

    // Reasignar en citas
    const { error: errorCitas } = await supabase
      .from('citas')
      .update({ id_usuario: idSuperAdmin })
      .eq('id_usuario', id);

    if (errorCitas) throw errorCitas;

    // Reasignar en llamados
    const { error: errorLlamados } = await supabase
      .from('llamados')
      .update({ id_usuario: idSuperAdmin })
      .eq('id_usuario', id);

    if (errorLlamados) throw errorLlamados;

    // Finalmente eliminar usuario
    const { error: errorUsuario } = await supabase
      .from('usuarios')
      .delete()
      .eq('id_usuario', id);

    if (errorUsuario) throw errorUsuario;

    res.json({ ok: true, mensaje: 'Usuario eliminado correctamente y citas/llamados reasignados al superadmin' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar usuario', error: error.message });
  }
};


// 🔄 PUT: Actualizar rol de un usuario
// 🔐 Solo Administrador
const actualizarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_rol } = req.body;
    if (!id_rol) {
      return res.status(400).json({ ok: false, mensaje: 'Falta el id_rol en el body' });
    }

    const { error } = await supabase.from('usuarios').update({ id_rol }).eq('id_usuario', id);
    if (error) throw error;

    res.json({ ok: true, mensaje: 'Rol actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar rol', error: error.message });
  }
};
// PUT: Editar un usuario por ID
const editarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_completo, correo, telefono } = req.body;
    const id_usuario_token = req.usuario.id; // CORREGIDO
    const rol_usuario_token = req.usuario.rol; // CORREGIDO

    if (!nombre_completo || !correo) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan campos obligatorios' });
    }

    if (rol_usuario_token !== 'Administrador' && id.trim() !== id_usuario_token.trim()) {
      return res.status(403).json({ ok: false, mensaje: 'No tienes permiso para editar otros usuarios' });
    }

    const { error } = await supabase.from('usuarios')
      .update({ nombre_completo, correo, telefono })
      .eq('id_usuario', id);

    if (error) throw error;

    res.json({ ok: true, mensaje: 'Usuario editado correctamente' });
  } catch (error) {
    console.error("Error interno al editar usuario:", error);
    res.status(500).json({ ok: false, mensaje: 'Error al editar usuario', error: error.message });
  }
};
// 📋 GET: Listar todos los roles
const listarRoles = async (req, res) => {
  try {
    const { data, error } = await supabase.from('roles').select('*');
    if (error) throw error;
    res.json({ ok: true, roles: data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al listar roles', error: error.message });
  }
};

module.exports = { listarUsuarios, eliminarUsuario, actualizarRol, editarUsuario, listarRoles };