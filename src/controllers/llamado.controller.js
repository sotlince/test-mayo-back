const supabase = require('../config/supabase');
// Simulación en memoria para llamados activos por 10 segundos
// let llamadosActivos = [];
// const llamarPaciente = async (req, res) => {
//     const { pacienteId } = req.params;
//     const { prioridad = 'Media', modo_notificacion = 'visual', id_usuario } = req.body;
//     try {
//         // Convertir prioridad textual a numérica
//         const prioridadMap = {
//             'Alta': 1,
//             'Media': 2,
//             'Baja': 3
//         };
//         const prioridad_numerica = prioridadMap[prioridad] || 2; // Por defecto: Media = 2
//         // Insertar en la base de datos con estado inicial: Pendiente
//         const { data, error } = await supabase
//             .from('llamados')
//             .insert([{
//                 id_paciente: pacienteId,
//                 id_usuario,
//                 prioridad,
//                 prioridad_numerica,
//                 modo_notificacion,
//                 estado: 'Pendiente'
//             }])
//             .select()
//             .single();
//         if (error) throw error;
//         res.json({
//             ok: true,
//             mensaje: 'Paciente registrado correctamente como pendiente',
//             llamado: data
//         });
//     } catch (error) {
//         console.error('Error al registrar paciente:', error.message);
//         res.status(500).json({ ok: false, mensaje: 'Error al registrar al paciente' });
//     }
// };
const llamarPaciente = async (req, res) => {
    const { pacienteId } = req.params;
    const { prioridad = 'Media', modo_notificacion = 'visual', id_usuario } = req.body;
  
    try {
      // 1️⃣ Verificar si ya existe un llamado hoy para este paciente
      const inicioDia = new Date();
      inicioDia.setHours(0, 0, 0, 0);
  
      const finDia = new Date(inicioDia);
      finDia.setDate(finDia.getDate() + 1);
  
      const { data: duplicado, error: errorDup } = await supabase
        .from('llamados')
        .select('id_llamado')
        .eq('id_paciente', pacienteId)
        .gte('timestamp', inicioDia.toISOString())
        .lt('timestamp', finDia.toISOString());
  
      if (errorDup) throw errorDup;
  
      if (duplicado.length > 0) {
        return res.status(409).json({
          ok: false,
          mensaje: 'Ya existe un llamado registrado para este paciente hoy.'
        });
      }
  
      // 2️⃣ Convertir prioridad textual a numérica
      const prioridadMap = {
        'Alta': 1,
        'Media': 2,
        'Baja': 3
      };
      const prioridad_numerica = prioridadMap[prioridad] || 2;
  
      // 3️⃣ Insertar en base de datos
      const { data, error } = await supabase
        .from('llamados')
        .insert([{
          id_paciente: pacienteId,
          id_usuario,
          prioridad,
          prioridad_numerica,
          modo_notificacion,
          estado: 'Pendiente'
        }])
        .select()
        .single();
  
      if (error) throw error;
  
      res.json({
        ok: true,
        mensaje: 'Paciente registrado correctamente como pendiente',
        llamado: data
      });
  
    } catch (error) {
      console.error('Error al registrar paciente:', error.message);
      res.status(500).json({ ok: false, mensaje: 'Error al registrar al paciente' });
    }
  };
// Controlador para actualizar el estado de un llamado
// (solo para el administrador y secretaria)
// Controlador para obtener los llamados activos
const obtenerLlamados = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('llamados')
            .select('*')
            .eq('estado', 'Llamado')
            .order('timestamp', { ascending: false });
        if (error) throw error;
        res.json({
            ok: true,
            llamados: data
        });
    } catch (error) {
        console.error('Error al obtener llamados activos:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener llamados activos' });
    }
};
// Controlador para obtener el historial de llamados
const obtenerHistorialLlamados = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('llamados')
            .select('*')
            .order('timestamp', { ascending: false });
        if (error) throw error;
        res.json({ ok: true, historial: data });
    } catch (error) {
        console.error('Error al obtener historial:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener historial de llamados' });
    }
}
// Controlador para actualizar el estado de un llamado
const actualizarEstadoLlamado = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!['Pendiente', 'Llamado', 'Atendido', 'Cancelado'].includes(estado)) {
      return res.status(400).json({ ok: false, mensaje: 'Estado inválido' });
  }

  try {
      const updates = [];

      // Si vamos a marcar uno como "Llamado", primero debemos desmarcar el actual
      if (estado === 'Llamado') {
          const { data: llamadoActual, error: errorActual } = await supabase
              .from('llamados')
              .select('id_llamado')
              .eq('estado', 'Llamado')
              .single();

          if (errorActual && errorActual.code !== 'PGRST116') { // si no es "no rows"
              throw errorActual;
          }

          if (llamadoActual) {
              const { error: errorUpdate } = await supabase
                  .from('llamados')
                  .update({ estado: 'Atendido', orden_manual: null })
                  .eq('id_llamado', llamadoActual.id_llamado);

              if (errorUpdate) throw errorUpdate;

              updates.push(`Paciente anterior (${llamadoActual.id_llamado}) marcado como Atendido`);
          }
      }

      // Ahora actualizamos el nuevo registro
      const updateData = { estado };
      if (estado === 'Atendido' || estado === 'Cancelado') {
          updateData.orden_manual = null;
      }

      const { data, error } = await supabase
          .from('llamados')
          .update(updateData)
          .eq('id_llamado', id)
          .select()
          .single();

      if (error) throw error;

      updates.push(`Paciente ${id} marcado como ${estado}`);

      res.json({
          ok: true,
          mensaje: `Estado actualizado correctamente`,
          updates,
          llamado: data,
      });

  } catch (error) {
      console.error('Error al actualizar estado del llamado:', error.message);
      res.status(500).json({ ok: false, mensaje: 'Error al actualizar el estado del llamado' });
  }
};


// Controlador para actualizar el orden manual de un llamado  
const actualizarOrdenManual = async (req, res) => {
    const { id } = req.params;
    const { orden_manual } = req.body;  
    try {
      const { data, error } = await supabase
        .from('llamados')
        .update({ orden_manual })
        .eq('id_llamado', id)
        .select(`id_llamado, orden_manual, id_paciente`) // aquí traigo el id_paciente
        .single(); 
      if (error) throw error;
      res.json({
        ok: true,
        mensaje: `Orden manual actualizado correctamente`,
        llamado: data
      });  
    } catch (error) {
      console.error('Error al actualizar orden manual:', error.message);
      res.status(500).json({ ok: false, mensaje: 'Error al actualizar el orden manual' });
    }
  };
// Controlador para obtener los llamados ordenados por prioridad y timestamp
// (solo para el administrador y secretaria)
const obtenerLlamadosOrdenados = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('llamados')
            .select(`
              id_llamado,
              id_paciente,
              id_usuario,
              prioridad,
              prioridad_numerica,
              modo_notificacion,
              estado,
              timestamp,
              orden_manual,
              paciente:pacientes (
    nombre_completo)
            `)
            .eq('estado', 'Pendiente')
            .order('orden_manual', { ascending: true, nullsLast: false }) // 1️⃣ orden manual decide
            .order('prioridad_numerica', { ascending: true })             // 2️⃣ usado solo si no hay orden manual
            .order('timestamp', { ascending: true });
        if (error) throw error;
        res.json({ ok: true, llamados: data });
    } catch (error) {
        console.error("Error al obtener llamados ordenados:", error.message);
        res.status(500).json({ ok: false, mensaje: "Error al obtener la lista de llamados" });
    }
};
// Controlador para obtener el dashboard de llamados
// (solo para el administrador y secretaria)
const obtenerDashboardLlamados = async (req, res) => {
  try {
      // 🔵 Llamados activos (estado = Llamado)
      const { data: activos, error: errorActivos } = await supabase
          .from('llamados')
          .select(`
              id_llamado,
              id_paciente,
              prioridad,
              estado,
              timestamp,
              paciente:pacientes(nombre_completo, rut)
          `)
          .eq('estado', 'Llamado');

      if (errorActivos) throw errorActivos;

      // 🟣 Pendientes (estado = Pendiente), máximo 5
      const { data: pendientes, error: errorPendientes } = await supabase
          .from('llamados')
          .select(`
              id_llamado,
              id_paciente,
              prioridad,
              prioridad_numerica,
              estado,
              timestamp,
              orden_manual,
              paciente:pacientes(nombre_completo, rut)
          `)
          .eq('estado', 'Pendiente')
          .order('orden_manual', { ascending: true, nullsLast: false })
          .order('prioridad_numerica', { ascending: true })
          .order('timestamp', { ascending: true })
          .limit(5);

      if (errorPendientes) throw errorPendientes;

      // 🟢 Últimos atendidos (estado = Atendido), últimos 4
      const { data: atendidos, error: errorAtendidos } = await supabase
          .from('llamados')
          .select(`
              id_llamado,
              id_paciente,
              prioridad,
              estado,
              timestamp,
              paciente:pacientes(nombre_completo, rut)
          `)
          .eq('estado', 'Atendido')
          .order('timestamp', { ascending: false })
          .limit(4);

      if (errorAtendidos) throw errorAtendidos;

      // 🔴 Cancelados (opcional)
      const { data: cancelados, error: errorCancelados } = await supabase
          .from('llamados')
          .select(`
              id_llamado,
              id_paciente,
              prioridad,
              estado,
              timestamp,
              paciente:pacientes(nombre_completo, rut)
          `)
          .eq('estado', 'Cancelado');

      if (errorCancelados) throw errorCancelados;

      res.json({
          ok: true,
          llamadosActivos: activos,
          pendientes,
          ultimosAtendidos: atendidos,
          cancelados
      });

  } catch (error) {
      console.error("Error en obtenerDashboardLlamados:", error.message);
      res.status(500).json({ ok: false, mensaje: "Error al obtener datos del dashboard" });
  }
};
module.exports = {
    llamarPaciente,
    obtenerLlamados,               // estado === "Llamado"
    obtenerHistorialLlamados,
    actualizarEstadoLlamado,       // PUT para cambiar estado
    actualizarOrdenManual,         // PUT para cambiar orden manual
    obtenerLlamadosOrdenados,       // todos los "Pendiente", ordenados
    obtenerDashboardLlamados       // dashboard de llamados activos, pendientes y atendidos
};