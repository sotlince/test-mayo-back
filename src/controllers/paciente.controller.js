const supabase = require('../config/supabase');

// Controlador para crear un paciente
// Este controlador debería recibir los datos del paciente desde el body de la petición
const crearPaciente = async (req, res) => {
  try {
    const {
      rut,
      nombre_completo,
      fecha_nacimiento,
      sexo,
      telefono_contacto,
      tipo_discapacidad,
      modo_comunicacion,
      ayudas_tecnicas,
      avatar_url,
      requiere_asistencia,
      contacto_emergencia,
      antecedentes,
      sintomas // 🔥 recibido del frontend
    } = req.body;

    if (!rut || !nombre_completo || !fecha_nacimiento || !sexo || !tipo_discapacidad) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan datos obligatorios del paciente' });
    }

    // ✅ Insertar paciente
    const { data: pacienteCreado, error: errorPaciente } = await supabase
      .from('pacientes')
      .insert([{
        rut,
        nombre_completo,
        fecha_nacimiento,
        sexo,
        telefono_contacto: telefono_contacto || "",
        tipo_discapacidad,
        modo_comunicacion: modo_comunicacion || "No especificado",
        ayudas_tecnicas: Array.isArray(ayudas_tecnicas) ? ayudas_tecnicas : (ayudas_tecnicas ? [ayudas_tecnicas] : []),
        avatar_url: avatar_url || "https://example.com/default-avatar.png",
        requiere_asistencia: requiere_asistencia ?? false,
        contacto_emergencia: contacto_emergencia || "{}",
        antecedentes: Array.isArray(antecedentes) ? antecedentes : [antecedentes],
      }])
      .select()
      .single();

    if (errorPaciente) throw errorPaciente;

    let gravedadMaxima = 0;

    // ✅ Insertar síntomas asociados y calcular gravedad máxima
    if (sintomas && Array.isArray(sintomas) && sintomas.length > 0) {
      const sintomasParaInsertar = sintomas.map((sintoma) => {
        if (sintoma.gravedad > gravedadMaxima) gravedadMaxima = sintoma.gravedad;
        return {
          id_paciente: pacienteCreado.id_paciente,
          zona_cuerpo: sintoma.zona_cuerpo,
          descripcion: sintoma.descripcion,
          gravedad: sintoma.gravedad,
          fecha_reporte: new Date().toISOString()
        };
      });

      const { error: errorSintomas } = await supabase
        .from('sintomas')
        .insert(sintomasParaInsertar);

      if (errorSintomas) throw errorSintomas;
    }

    // 🔥 Crear llamado de urgencia si gravedad >= 7 y aún no hay uno hoy
    if (gravedadMaxima >= 7) {
      const hoy = new Date();
      const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
      const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).toISOString();

      const { data: llamadosExistentes, error: errorLlamado } = await supabase
        .from('llamados')
        .select('id_llamado')
        .eq('id_paciente', pacienteCreado.id_paciente)
        .gte('timestamp', inicioDia)
        .lt('timestamp', finDia);

      if (errorLlamado) throw errorLlamado;

      if (llamadosExistentes.length === 0) {
        let prioridad = 'Baja';
        if (gravedadMaxima === 10) prioridad = 'Alta';
        else if (gravedadMaxima === 9) prioridad = 'Media';

        await supabase
          .from('llamados')
          .insert([{
            id_paciente: pacienteCreado.id_paciente,
            id_usuario: '6fdcea78-615b-4efa-ba2e-1b602b6c83f6', // Super Administrador por defecto
            prioridad,
            prioridad_numerica: prioridad === 'Alta' ? 1 : prioridad === 'Media' ? 2 : 3,
            modo_notificacion: 'Visual', // o "Ambos", si quieres adaptarlo
            estado: 'Pendiente'
          }]);
      }
    }

    res.status(201).json({ ok: true, mensaje: 'Paciente y síntomas creados correctamente', paciente: pacienteCreado });

  } catch (error) {
    console.error('Error en crearPaciente:', error.message);
    res.status(500).json({ ok: false, mensaje: 'Error al crear paciente' });
  }
};



// Controlador para obtener todos los pacientes
// Este controlador debería conectarse a la base de datos y obtener todos los pacientes
const obtenerPacientes = async (req, res) => {
    try {
        const { data: pacientes, error } = await supabase
            .from('pacientes')
            .select('*');
        if (error) throw error;
        res.json({ ok: true, pacientes });
    } catch (error) {
        console.error('Error en obtenerPacientes:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener pacientes' });
    }
};

  
// Controlador para obtener un paciente por ID
// Este controlador debería recibir el ID del paciente desde los parámetros de la URL
const getPacienteById = async (req, res) => {
    const { id } = req.params;
    try {
      const { data: paciente, error: errorPaciente } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id_paciente', id)
        .single();
      
      if (errorPaciente) throw errorPaciente;
  
      const { data: sintomas, error: errorSintomas } = await supabase
        .from('sintomas')
        .select('*')
        .eq('id_paciente', id);
  
      if (errorSintomas) throw errorSintomas;
  
      res.json({ ok: true, paciente, sintomas });
    } catch (error) {
      console.error('Error en getPacienteById:', error.message);
      res.status(500).json({ ok: false, mensaje: 'Error al obtener paciente' });
    }
  };
  
// Controlador para actualizar un paciente por ID
// Este controlador debería recibir el ID del paciente desde los parámetros de la URL y los datos a actualizar desde el body de la petición
const actualizarPaciente = async (req, res) => {
    const { id } = req.params;
    const datos = req.body;
    try {
        const { data, error } = await supabase
            .from('pacientes')
            .update(datos)
            .eq('id_paciente', id)
            .select()
            .single();
        if (error) throw error;
        res.json({ ok: true, mensaje: 'Paciente actualizado', paciente: data });
    } catch (error) {
        console.error('Error en actualizarPaciente:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar paciente' });
    }
};
// Elimiminar paciente por ID
// Este controlador debería recibir el ID del paciente desde los parámetros de la URL 
const eliminarPaciente = async (req, res) => {
    const { id } = req.params;
    try {
      // 🔥 Primero eliminamos los síntomas asociados
      const { error: errorSintomas } = await supabase
        .from('sintomas')
        .delete()
        .eq('id_paciente', id);
      
      if (errorSintomas) throw errorSintomas;
  
      // ✅ Luego eliminamos el paciente
      const { data, error } = await supabase
        .from('pacientes')
        .delete()
        .eq('id_paciente', id)
        .select()
        .single();
      
      if (error) throw error;
  
      res.json({ ok: true, mensaje: `Paciente y síntomas eliminados correctamente`, paciente: data });
    } catch (error) {
      console.error('Error en eliminarPaciente:', error.message);
      res.status(500).json({ ok: false, mensaje: 'Error al eliminar paciente' });
    }
  };

// Controlador para obtener un paciente y sus síntomas juntos
const getPacienteCompleto = async (req, res) => {
    const { id } = req.params;
    try {
      // 🔵 Buscar el paciente
      const { data: paciente, error: errorPaciente } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id_paciente', id)
        .single();
      
      if (errorPaciente) throw errorPaciente;
  
      // 🔵 Buscar sus síntomas
      const { data: sintomas, error: errorSintomas } = await supabase
        .from('sintomas')
        .select('*')
        .eq('id_paciente', id);
      
      if (errorSintomas) throw errorSintomas;
  
      res.json({ ok: true, paciente, sintomas });
  
    } catch (error) {
      console.error('Error en getPacienteCompleto:', error.message);
      res.status(500).json({ ok: false, mensaje: 'Error al obtener paciente completo' });
    }
  };  
  
module.exports = {
    obtenerPacientes,
    crearPaciente,
    getPacienteById,
    actualizarPaciente,
    eliminarPaciente,
    getPacienteCompleto
};