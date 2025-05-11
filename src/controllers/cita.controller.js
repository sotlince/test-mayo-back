const supabase = require('../config/supabase');
// Importar el modelo de Cita
// En este caso, no tenemos un modelo real, así que vamos a simularlo con un array
// Importar el modelo de Cita
const obtenerCitas = async (req, res) => {
    try {
        const { tipo_cita, estado } = req.query;
        let query = supabase.from('citas').select('*');
        if (tipo_cita) query = query.eq('tipo_cita', tipo_cita);
        if (estado) query = query.eq('estado', estado);
        const { data, error } = await query;
        if (error) throw error;
        res.json({ ok: true, citas: data });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error al obtener citas' });
    }
};
// Controlador para crear una cita
// Este controlador debería recibir los datos de la cita desde el body de la petición
const crearCita = async (req, res) => {
    try {
        const creado_en = new Date();
        const creado_por = req.usuario.id;
        const { id_paciente, fecha_inicio, fecha_fin, motivo, tipo_cita } = req.body;
        if (!id_paciente || !creado_por || !fecha_inicio || !fecha_fin || !tipo_cita) {
            console.error('Faltan datos para crear la cita:', req.body);
            return res.status(400).json({ ok: false, mensaje: 'Faltan datos para la cita' });
        }
        const { data, error } = await supabase
            .from('citas')
            .insert([{
                id_paciente,
                fecha_inicio,
                fecha_fin,
                motivo,
                tipo_cita,
                estado: 'Agendada',
                creado_en,
                creado_por,
            }])
            .select()
            .single();
        if (error) throw error;
        res.status(201).json({ ok: true, mensaje: 'Cita registrada correctamente', cita: data });
    } catch (error) {
        console.error('Error en crearCita:', error.message); // 👈 agrega esto
        res.status(500).json({ ok: false, mensaje: 'Error al registrar cita' });
    }
};
// Controlador para obtener una cita por ID
// Este controlador debería recibir el ID de la cita desde los parámetros de la URL
const obtenerCitaPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('citas')
            .select('*')
            .eq('id_cita', id)
            .single();

        if (error) throw error;

        res.json({ ok: true, cita: data });
    } catch (error) {
        res.status(404).json({ ok: false, mensaje: 'Cita no encontrada' });
    }
};
// Controlador para actualizar una cita por ID
// Este controlador debería recibir el ID de la cita desde los parámetros de la URL y los nuevos datos desde el body de la petición
const actualizarCita = async (req, res) => {
    const { id } = req.params;
    const datosActualizados = req.body;
    try {
        const { data, error } = await supabase
            .from('citas')
            .update(datosActualizados)
            .eq('id_cita', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ ok: true, mensaje: 'Cita actualizada', cita: data });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar cita' });
    }
};
// Controlador para eliminar una cita por ID
// Este controlador debería recibir el ID de la cita desde los parámetros de la URL
const eliminarCita = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('citas')
            .delete()
            .eq('id_cita', id)
            .select()
            .single();
        if (error) throw error;
        res.json({ ok: true, mensaje: 'Cita eliminada correctamente', cita: data });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error al eliminar cita' });
    }
};
// Controlador para obtener citas para el visor
// Este controlador debería obtener todas las citas y sus detalles para el visor
const obtenerCitasVisor = async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('citas')
        .select(`
          id_cita,
          fecha_inicio,
          fecha_fin,
          motivo,
          tipo_cita,
          paciente:pacientes ( nombre_completo, rut ),
          usuario:usuarios ( nombre_completo )
        `)
        .order('fecha_inicio', { ascending: true }); // 👈 ordenar por fecha de inicio
  
      if (error) throw error;
  
      res.json({ ok: true, citas: data });
    } catch (error) {
      console.error('Error al obtener citas para visor:', error.message);
      res.status(500).json({ ok: false, mensaje: 'Error al obtener citas para visor' });
    }
  };

// Exportar los controladores
module.exports = {
    obtenerCitas,
    crearCita,
    obtenerCitaPorId,
    actualizarCita,
    eliminarCita,
    obtenerCitasVisor
};