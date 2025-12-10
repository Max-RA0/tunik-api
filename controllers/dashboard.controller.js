// server/controllers/dashboard.controller.js
import sequelize from "../config/db.js";
import { QueryTypes } from "sequelize";

const safeRows = (rows) => (Array.isArray(rows) ? rows : []);

export const getDashboardMetrics = async (req, res) => {
  try {
    // Cards
    const [u] = await sequelize.query(
      "SELECT COUNT(*) AS total FROM usuarios",
      { type: QueryTypes.SELECT }
    );
    const [v] = await sequelize.query(
      "SELECT COUNT(*) AS total FROM vehiculos",
      { type: QueryTypes.SELECT }
    );
    const [s] = await sequelize.query(
      "SELECT COUNT(*) AS total FROM servicios",
      { type: QueryTypes.SELECT }
    );
    const [p] = await sequelize.query(
      "SELECT COUNT(*) AS total FROM pedidos",
      { type: QueryTypes.SELECT }
    );

    // Charts
    const usuariosPorRol = await sequelize.query(
      `
      SELECT r.descripcion AS name, COUNT(*) AS value
      FROM usuarios u
      JOIN roles r ON r.idroles = u.idroles
      GROUP BY r.descripcion
      ORDER BY value DESC
      `,
      { type: QueryTypes.SELECT }
    );

    const vehiculosPorMarca = await sequelize.query(
      `
      SELECT m.descripcion AS name, COUNT(*) AS value
      FROM vehiculos v
      JOIN marcas m ON m.idmarca = v.idmarca
      GROUP BY m.descripcion
      ORDER BY value DESC
      `,
      { type: QueryTypes.SELECT }
    );

    const pedidosPorEstado = await sequelize.query(
      `
      SELECT COALESCE(estado,'Sin estado') AS name, COUNT(*) AS value
      FROM pedidos
      GROUP BY COALESCE(estado,'Sin estado')
      ORDER BY value DESC
      `,
      { type: QueryTypes.SELECT }
    );

    const cotizacionesPorEstado = await sequelize.query(
      `
      SELECT COALESCE(estado,'Sin estado') AS name, COUNT(*) AS value
      FROM cotizaciones
      GROUP BY COALESCE(estado,'Sin estado')
      ORDER BY value DESC
      `,
      { type: QueryTypes.SELECT }
    );

    const serviciosPorCategoria = await sequelize.query(
      `
      SELECT c.nombrecategorias AS name, COUNT(*) AS value
      FROM servicios s
      JOIN categoriaservicios c ON c.idcategoriaservicios = s.idcategoriaservicios
      GROUP BY c.nombrecategorias
      ORDER BY value DESC
      `,
      { type: QueryTypes.SELECT }
    );

    // Serie: pedidos últimos 30 días
    const pedidosUltimos30Dias = await sequelize.query(
      `
      SELECT DATE(fechaPedido) AS name, COUNT(*) AS value
      FROM pedidos
      WHERE fechaPedido >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(fechaPedido)
      ORDER BY DATE(fechaPedido) ASC
      `,
      { type: QueryTypes.SELECT }
    );

    // Productos con bajo stock (top 10)
    const productosBajoStock = await sequelize.query(
      `
      SELECT nombreproductos, cantidadexistente
      FROM productos
      ORDER BY cantidadexistente ASC
      LIMIT 10
      `,
      { type: QueryTypes.SELECT }
    );

    // "Ventas" (ingresos) aproximadas desde detallecotizaciones
    // (suma de preciochange en cotizaciones completadas)
    const [ing] = await sequelize.query(
      `
      SELECT COALESCE(SUM(dc.preciochange), 0) AS total
      FROM detallecotizaciones dc
      JOIN cotizaciones c ON c.idcotizaciones = dc.idcotizaciones
      WHERE LOWER(COALESCE(c.estado,'')) IN ('aprobado','aprobada')
      `,
      { type: QueryTypes.SELECT }
    );

    return res.json({
      ok: true,
      cards: {
        usuarios: Number(u?.total || 0),
        vehiculos: Number(v?.total || 0),
        servicios: Number(s?.total || 0),
        pedidos: Number(p?.total || 0),
        ingresos: Number(ing?.total || 0),
      },
      charts: {
        usuariosPorRol: safeRows(usuariosPorRol),
        vehiculosPorMarca: safeRows(vehiculosPorMarca),
        pedidosPorEstado: safeRows(pedidosPorEstado),
        cotizacionesPorEstado: safeRows(cotizacionesPorEstado),
        serviciosPorCategoria: safeRows(serviciosPorCategoria),
        pedidosUltimos30Dias: safeRows(pedidosUltimos30Dias),
        productosBajoStock: safeRows(productosBajoStock),
      },
    });
  } catch (err) {
    console.error("getDashboardMetrics:", err);
    return res.status(500).json({ ok: false, msg: "Error en el servidor", error: err.message });
  }
};
