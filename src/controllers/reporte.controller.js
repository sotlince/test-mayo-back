const supabase = require('../config/supabase');

// 📅 Reporte 1: Citas atendidas entre fechas
const reporteCitasAtendidas = async (req, res) => {
  const { desde, hasta } = req.query;
  try {
    const { data, error } = await supabase
      .from('citas')
      .select('*, pacientes(nombre_completo), usuarios(nombre_completo)')
      .eq('estado', 'Atendida')
      .gte('fecha', desde)
      .lte('fecha', hasta);

    if (error) throw error;
    res.json({ ok: true, datos: data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener citas atendidas', error: error.message });
  }
};

// 📅 Reporte 2: Citas pendientes
const reporteCitasPendientes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('citas')
      .select('*, pacientes(nombre_completo)')
      .eq('estado', 'Agendada');

    if (error) throw error;
    res.json({ ok: true, datos: data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener citas pendientes', error: error.message });
  }
};

// 📣 Reporte 3: Llamados agrupados por prioridad
// 📣 Reporte: Llamados agrupados por prioridad
const reporteLlamadosPorPrioridad = async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('llamados')
        .select('prioridad');
  
      if (error) throw error;
  
      // Agrupación en JS
      const agrupado = {};
      data.forEach((llamado) => {
        const key = llamado.prioridad || 'Sin Prioridad';
        agrupado[key] = (agrupado[key] || 0) + 1;
      });
  
      // Convertimos a arreglo de objetos tipo { prioridad: 'Alta', count: 3 }
      const resultado = Object.entries(agrupado).map(([prioridad, count]) => ({
        prioridad,
        count
      }));
  
      res.json({ ok: true, datos: resultado });
  
    } catch (error) {
      res.status(500).json({ ok: false, mensaje: 'Error al agrupar llamados', error: error.message });
    }
  };

// 👥 Reporte 4: Usuarios por rol
const reporteUsuariosPorRol = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id_rol, roles(nombre_rol)')
      .then(respuesta => {
        // Agrupar manualmente en JS
        const agrupado = {};
        respuesta.data.forEach(u => {
          const rol = u.roles?.nombre_rol || 'No definido';
          agrupado[rol] = (agrupado[rol] || 0) + 1;
        });
        return { data: agrupado };
      });

    res.json({ ok: true, datos: data });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al agrupar usuarios por rol', error: error.message });
  }
};

module.exports = {
  reporteCitasAtendidas,
  reporteCitasPendientes,
  reporteLlamadosPorPrioridad,
  reporteUsuariosPorRol
};
