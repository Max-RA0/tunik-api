// server/controllers/dashboard.controller.js
import sequelize from "../config/db.js";
import { QueryTypes } from "sequelize";

const safeRows = (rows) => (Array.isArray(rows) ? rows : []);

const asNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function ymd(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const da = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function startOfWeekMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 domingo ... 6 sábado
  const diff = (day === 0 ? -6 : 1) - day; // lunes
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfMonth(date = new Date()) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export const getDashboardMetrics = async (req, res) => {
  try {
    /* =========================
       CARDS
       ========================= */
    const [u] = await sequelize.query("SELECT COUNT(*) AS total FROM usuarios", {
      type: QueryTypes.SELECT,
    });

    const [v] = await sequelize.query("SELECT COUNT(*) AS total FROM vehiculos", {
      type: QueryTypes.SELECT,
    });

    const [s] = await sequelize.query("SELECT COUNT(*) AS total FROM servicios", {
      type: QueryTypes.SELECT,
    });

    const [p] = await sequelize.query("SELECT COUNT(*) AS total FROM pedidos", {
      type: QueryTypes.SELECT,
    });

    // ingresos cotizaciones (aprobadas/completadas)
    const [ingCot] = await sequelize.query(
      `
      SELECT COALESCE(SUM(dc.preciochange), 0) AS total
      FROM detallecotizaciones dc
      JOIN cotizaciones c ON c.idcotizaciones = dc.idcotizaciones
      WHERE LOWER(COALESCE(c.estado,'')) IN ('aprobado','aprobada','completado','completada')
      `,
      { type: QueryTypes.SELECT }
    );

    /* =========================
       RANGOS (para que no quede un punto solo)
       ========================= */
    const now = new Date();

    // Semanal: últimas 8 semanas (lunes como inicio)
    const weeksCount = 8;
    const thisMonday = startOfWeekMonday(now);
    const firstMonday = addDays(thisMonday, -(weeksCount - 1) * 7);

    const weekBuckets = Array.from({ length: weeksCount }).map((_, i) => {
      const monday = addDays(firstMonday, i * 7);
      const key = ymd(monday); // YYYY-MM-DD
      return { key, name: `Sem ${key}` };
    });

    // Mensual: últimos 12 meses
    const monthsCount = 12;
    const thisMonth = startOfMonth(now);
    const firstMonth = startOfMonth(addMonths(thisMonth, -(monthsCount - 1)));

    const monthBuckets = Array.from({ length: monthsCount }).map((_, i) => {
      const m = startOfMonth(addMonths(firstMonth, i));
      const key = ymd(m); // YYYY-MM-01
      const label = key.slice(0, 7); // YYYY-MM
      return { key, name: label };
    });

    // Anual: últimos 5 años
    const yearsCount = 5;
    const thisYear = now.getFullYear();
    const yearBuckets = Array.from({ length: yearsCount }).map((_, i) => {
      const y = thisYear - (yearsCount - 1) + i;
      return { key: String(y), name: String(y) };
    });

    /* =========================
       QUERIES: INGRESOS COTIZACIONES
       bucket semanal/mensual/anual
       ========================= */
    const cotWeekly = await sequelize.query(
      `
      SELECT
        DATE(DATE_SUB(c.fecha, INTERVAL WEEKDAY(c.fecha) DAY)) AS bucket,
        COALESCE(SUM(dc.preciochange), 0) AS total
      FROM cotizaciones c
      JOIN detallecotizaciones dc ON dc.idcotizaciones = c.idcotizaciones
      WHERE c.fecha BETWEEN :startDate AND :endDate
        AND LOWER(COALESCE(c.estado,'')) IN ('aprobado','aprobada','completado','completada')
      GROUP BY bucket
      ORDER BY bucket ASC
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          startDate: weekBuckets[0].key,
          endDate: ymd(addDays(now, 1)), // buffer
        },
      }
    );

    const cotMonthly = await sequelize.query(
      `
      SELECT
        DATE_FORMAT(c.fecha, '%Y-%m-01') AS bucket,
        COALESCE(SUM(dc.preciochange), 0) AS total
      FROM cotizaciones c
      JOIN detallecotizaciones dc ON dc.idcotizaciones = c.idcotizaciones
      WHERE c.fecha BETWEEN :startDate AND :endDate
        AND LOWER(COALESCE(c.estado,'')) IN ('aprobado','aprobada','completado','completada')
      GROUP BY bucket
      ORDER BY bucket ASC
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          startDate: monthBuckets[0].key,
          endDate: ymd(addDays(now, 1)),
        },
      }
    );

    const cotYearly = await sequelize.query(
      `
      SELECT
        YEAR(c.fecha) AS bucket,
        COALESCE(SUM(dc.preciochange), 0) AS total
      FROM cotizaciones c
      JOIN detallecotizaciones dc ON dc.idcotizaciones = c.idcotizaciones
      WHERE YEAR(c.fecha) BETWEEN :y0 AND :y1
        AND LOWER(COALESCE(c.estado,'')) IN ('aprobado','aprobada','completado','completada')
      GROUP BY YEAR(c.fecha)
      ORDER BY YEAR(c.fecha) ASC
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          y0: Number(yearBuckets[0].key),
          y1: Number(yearBuckets[yearBuckets.length - 1].key),
        },
      }
    );

    /* =========================
       QUERIES: INGRESOS PEDIDOS
       (cantidad * precio del producto)
       ========================= */
    const pedWeekly = await sequelize.query(
      `
      SELECT
        DATE(DATE_SUB(p.fechaPedido, INTERVAL WEEKDAY(p.fechaPedido) DAY)) AS bucket,
        COALESCE(SUM(d.cantidad * pr.precio), 0) AS total
      FROM pedidos p
      LEFT JOIN detallepedidoproducto d
        ON d.idpedido = p.idpedidos AND d.idproveedor = p.idproveedor
      LEFT JOIN productos pr
        ON pr.idproductos = d.idproducto
      WHERE p.fechaPedido BETWEEN :startDate AND :endDate
        AND LOWER(COALESCE(p.estado,'')) IN ('completado','completada','recibido','finalizado','finalizada')
      GROUP BY bucket
      ORDER BY bucket ASC
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          startDate: weekBuckets[0].key,
          endDate: ymd(addDays(now, 1)),
        },
      }
    );

    const pedMonthly = await sequelize.query(
      `
      SELECT
        DATE_FORMAT(p.fechaPedido, '%Y-%m-01') AS bucket,
        COALESCE(SUM(d.cantidad * pr.precio), 0) AS total
      FROM pedidos p
      LEFT JOIN detallepedidoproducto d
        ON d.idpedido = p.idpedidos AND d.idproveedor = p.idproveedor
      LEFT JOIN productos pr
        ON pr.idproductos = d.idproducto
      WHERE p.fechaPedido BETWEEN :startDate AND :endDate
        AND LOWER(COALESCE(p.estado,'')) IN ('completado','completada','recibido','finalizado','finalizada')
      GROUP BY bucket
      ORDER BY bucket ASC
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          startDate: monthBuckets[0].key,
          endDate: ymd(addDays(now, 1)),
        },
      }
    );

    const pedYearly = await sequelize.query(
      `
      SELECT
        YEAR(p.fechaPedido) AS bucket,
        COALESCE(SUM(d.cantidad * pr.precio), 0) AS total
      FROM pedidos p
      LEFT JOIN detallepedidoproducto d
        ON d.idpedido = p.idpedidos AND d.idproveedor = p.idproveedor
      LEFT JOIN productos pr
        ON pr.idproductos = d.idproducto
      WHERE YEAR(p.fechaPedido) BETWEEN :y0 AND :y1
        AND LOWER(COALESCE(p.estado,'')) IN ('completado','completada','recibido','finalizado','finalizada')
      GROUP BY YEAR(p.fechaPedido)
      ORDER BY YEAR(p.fechaPedido) ASC
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          y0: Number(yearBuckets[0].key),
          y1: Number(yearBuckets[yearBuckets.length - 1].key),
        },
      }
    );

    // Map helpers (para rellenar los ceros)
    const mapByBucketDate = (rows) => {
      const m = new Map();
      safeRows(rows).forEach((r) => {
        const raw = r.bucket;
        const key = raw instanceof Date ? ymd(raw) : String(raw).slice(0, 10);
        m.set(key, asNumber(r.total));
      });
      return m;
    };

    const mapByBucketYear = (rows) => {
      const m = new Map();
      safeRows(rows).forEach((r) => {
        m.set(String(r.bucket), asNumber(r.total));
      });
      return m;
    };

    const cotW = mapByBucketDate(cotWeekly);
    const pedW = mapByBucketDate(pedWeekly);

    const cotM = mapByBucketDate(cotMonthly);
    const pedM = mapByBucketDate(pedMonthly);

    const cotY = mapByBucketYear(cotYearly);
    const pedY = mapByBucketYear(pedYearly);

    const ingresosSemanal = weekBuckets.map((b) => ({
      name: b.name,
      ingresosCotizaciones: cotW.get(b.key) ?? 0,
      ingresosPedidos: pedW.get(b.key) ?? 0,
    }));

    const ingresosMensual = monthBuckets.map((b) => ({
      name: b.name,
      ingresosCotizaciones: cotM.get(b.key) ?? 0,
      ingresosPedidos: pedM.get(b.key) ?? 0,
    }));

    const ingresosAnual = yearBuckets.map((b) => ({
      name: b.name,
      ingresosCotizaciones: cotY.get(b.key) ?? 0,
      ingresosPedidos: pedY.get(b.key) ?? 0,
    }));

    /* =========================
       VEHÍCULOS EN TALLER (estado según última cita)
       + incluye "Sin cita"
       ========================= */
    const vehiculosEstadoTaller = await sequelize.query(
      `
      SELECT
        COALESCE(t.estado, 'Sin cita') AS name,
        COUNT(*) AS value
      FROM vehiculos v
      LEFT JOIN (
        SELECT a.placa, a.estado
        FROM agendacitas a
        JOIN (
          SELECT placa, MAX(fecha) AS maxFecha
          FROM agendacitas
          GROUP BY placa
        ) m
          ON m.placa = a.placa AND m.maxFecha = a.fecha
      ) t
        ON t.placa = v.placa
      GROUP BY COALESCE(t.estado, 'Sin cita')
      ORDER BY value DESC
      `,
      { type: QueryTypes.SELECT }
    );

    /* =========================
       PRODUCTOS BAJO STOCK
       ========================= */
    const productosBajoStock = await sequelize.query(
      `
      SELECT nombreproductos, cantidadexistente
      FROM productos
      ORDER BY cantidadexistente ASC
      LIMIT 10
      `,
      { type: QueryTypes.SELECT }
    );

    return res.json({
      ok: true,
      cards: {
        usuarios: asNumber(u?.total),
        vehiculos: asNumber(v?.total),
        servicios: asNumber(s?.total),
        pedidos: asNumber(p?.total),
        ingresos: asNumber(ingCot?.total), // ingresos cotizaciones (como ya lo tenías)
      },
      charts: {
        ingresosSemanal,
        ingresosMensual,
        ingresosAnual,
        vehiculosEstadoTaller: safeRows(vehiculosEstadoTaller),
        productosBajoStock: safeRows(productosBajoStock),
      },
    });
  } catch (err) {
    console.error("getDashboardMetrics:", err);
    return res.status(500).json({
      ok: false,
      msg: "Error en el servidor",
      error: err.message,
    });
  }
};
