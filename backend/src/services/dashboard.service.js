const { Venta, AgendaCita, Vehiculo, User, Servicio, EvaluacionServicio, Producto, Pedido } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../database/connection');

class DashboardService {
  async getStats() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Total ventas del mes
    const ventasMes = await Venta.findAll({
      where: {
        fecha: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });
    const totalVentasMes = ventasMes.reduce((sum, v) => sum + parseFloat(v.total), 0);

    // Total citas del mes
    const citasMes = await AgendaCita.count({
      where: {
        fecha: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });

    // Citas pendientes
    const citasPendientes = await AgendaCita.count({
      where: {
        estado: 'Pendiente'
      }
    });

    // Total usuarios
    const totalUsuarios = await User.count();

    // Total vehículos
    const totalVehiculos = await Vehiculo.count();

    // Total servicios
    const totalServicios = await Servicio.count();

    // Promedio de calificaciones
    const evaluaciones = await EvaluacionServicio.findAll();
    let promedioCalificacion = 0;
    if (evaluaciones.length > 0) {
      const suma = evaluaciones.reduce((acc, e) => acc + e.calificacion, 0);
      promedioCalificacion = Math.round((suma / evaluaciones.length) * 100) / 100;
    }

    // Productos con bajo stock (menos de 5)
    const productosBajoStock = await Producto.count({
      where: {
        stock: { [Op.lt]: 5 }
      }
    });

    // Pedidos pendientes
    const pedidosPendientes = await Pedido.count({
      where: {
        estado: 'Pendiente'
      }
    });

    // Ventas por estado
    const ventasPorEstado = await Venta.findAll({
      attributes: [
        'estado',
        [sequelize.fn('COUNT', sequelize.col('idventas')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      group: ['estado']
    });

    return {
      ventasMes: {
        cantidad: ventasMes.length,
        total: totalVentasMes
      },
      citasMes,
      citasPendientes,
      totalUsuarios,
      totalVehiculos,
      totalServicios,
      promedioCalificacion,
      productosBajoStock,
      pedidosPendientes,
      ventasPorEstado
    };
  }
}

module.exports = new DashboardService();
