import Agendacita from "../models/agendacitas.js";
import Vehiculo from "../models/vehiculo.js";

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

function normalizePlaca(v) {
  return String(v || "").toUpperCase().replace(/\s+/g, "").trim();
}

function normalizeEstado(v) {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function parseId(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseFecha(v) {
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const createAgendacita = async (req, res) => {
  try {
    const placa = normalizePlaca(req.body?.placa);
    const fecha = parseFecha(req.body?.fecha);
    const estado = normalizeEstado(req.body?.estado) || "Pendiente"; 

    if (!placa || !fecha) {
      return res.status(400).json({
        ok: false,
        msg: "Placa y fecha son obligatorios (fecha válida).",
      });
    }

    const veh = await Vehiculo.findByPk(placa);
    if (!veh) {
      return res.status(400).json({ ok: false, msg: "La placa no existe" });
    }

    const created = await Agendacita.create({
      placa,
      fecha,
      estado,
    });

    const full = await Agendacita.findByPk(created.idagendacitas, {
      include: [
        {
          model: Vehiculo,
          as: "vehiculo",
          attributes: ["placa", "modelo", "color", "numero_documento"],
        },
      ],
    });

    return res.status(201).json({ ok: true, data: full || created });
  } catch (err) {
    console.error("createAgendacita:", err);
    return res.status(500).json({ ok: false, msg: "Error en el servidor", error: err.message });
  }
};

export const getAgendacitas = async (req, res) => {
  try {
    const placa = req.query?.placa ? normalizePlaca(req.query.placa) : "";
    const estado = req.query?.estado ? String(req.query.estado).trim() : "";
    const numero_documento = req.query?.numero_documento ? String(req.query.numero_documento).trim() : "";

    const where = {};
    if (placa) where.placa = placa;
    if (estado) where.estado = estado;

    const includeVehiculo = {
      model: Vehiculo,
      as: "vehiculo",
      attributes: ["placa", "modelo", "color", "numero_documento"],
      ...(numero_documento
        ? { where: { numero_documento }, required: true }
        : { required: false }),
    };

    const rows = await Agendacita.findAll({
      where,
      include: [includeVehiculo],
      order: [["idagendacitas", "DESC"]],
    });

    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("getAgendacitas:", err);
    return res.status(500).json({ ok: false, msg: "Error listando agendamientos", error: err.message });
  }
};

export const getAgendacitaById = async (req, res) => {
  try {
    const id = parseId(req.params.idagendacitas ?? req.params.id);
    if (!id) return res.status(400).json({ ok: false, msg: "ID inválido" });

    const row = await Agendacita.findByPk(id, {
      include: [
        {
          model: Vehiculo,
          as: "vehiculo",
          attributes: ["placa", "modelo", "color", "numero_documento"],
        },
      ],
    });

    if (!row) return res.status(404).json({ ok: false, msg: "Agendamiento no encontrado" });
    return res.json({ ok: true, data: row });
  } catch (err) {
    console.error("getAgendacitaById:", err);
    return res.status(500).json({ ok: false, msg: "Error obteniendo agendamiento", error: err.message });
  }
};

export const updateAgendacita = async (req, res) => {
  try {
    const id = parseId(req.params.idagendacitas ?? req.params.id);
    if (!id) return res.status(400).json({ ok: false, msg: "ID inválido" });

    const row = await Agendacita.findByPk(id);
    if (!row) return res.status(404).json({ ok: false, msg: "Agendamiento no encontrado" });

    if (hasOwn(req.body, "placa")) {
      const placa = normalizePlaca(req.body.placa);
      if (!placa) return res.status(400).json({ ok: false, msg: "Placa inválida" });

      const veh = await Vehiculo.findByPk(placa);
      if (!veh) return res.status(400).json({ ok: false, msg: "La placa no existe" });

      row.placa = placa;
    }

    if (hasOwn(req.body, "fecha")) {
      const fecha = parseFecha(req.body.fecha);
      if (!fecha) return res.status(400).json({ ok: false, msg: "Fecha inválida" });
      row.fecha = fecha;
    }

    if (hasOwn(req.body, "estado")) {
      const estado = normalizeEstado(req.body.estado);
      if (!estado) return res.status(400).json({ ok: false, msg: "Estado inválido" });
      row.estado = estado;
    }

    await row.save();

    const full = await Agendacita.findByPk(id, {
      include: [
        {
          model: Vehiculo,
          as: "vehiculo",
          attributes: ["placa", "modelo", "color", "numero_documento"],
        },
      ],
    });

    return res.json({ ok: true, data: full || row });
  } catch (err) {
    console.error("updateAgendacita:", err);
    return res.status(500).json({ ok: false, msg: "Error actualizando agendamiento", error: err.message });
  }
};

export const deleteAgendacita = async (req, res) => {
  try {
    const id = parseId(req.params.idagendacitas ?? req.params.id);
    if (!id) return res.status(400).json({ ok: false, msg: "ID inválido" });

    const row = await Agendacita.findByPk(id);
    if (!row) return res.status(404).json({ ok: false, msg: "Agendamiento no encontrado" });

    await row.destroy();
    return res.json({ ok: true, msg: "Agendamiento eliminado correctamente" });
  } catch (err) {
    console.error("deleteAgendacita:", err);
    return res.status(500).json({ ok: false, msg: "Error eliminando agendamiento", error: err.message });
  }
};
