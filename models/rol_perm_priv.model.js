// server/models/rol_perm_priv.model.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATA_DIR = path.resolve(__dirname, "../data");
export const DATA_FILE = path.resolve(DATA_DIR, "roles.acl.json");

/** ====== Catálogo: módulos y subprocesos ====== */
export const MODULES = {
  usuarios: {
    label: "Gestión de Usuarios",
    subs: ["usuarios"],
  },
  servicios: {
    label: "Gestión de Servicios",
    subs: ["categoriaservicios", "servicios"],
  },
  ventas: {
    label: "Gestión de Ventas",
    subs: ["metodospago", "proveedor"],
  },
  evaluacion: {
    label: "Evaluación Servicios",
    subs: ["evaluacionservicios"],
  },
  vehiculos: {
    label: "Vehículos",
    subs: ["vehiculo", "tipovehiculo", "marca"],
  },
  config: {
    label: "Configuración",
    subs: ["roles"],
  },
};

export const ACTIONS = ["registrar", "buscar", "editar", "eliminar"];

/** Helpers de validación */
const moduleKeys = Object.keys(MODULES);
const allSubKeys = new Set(moduleKeys.flatMap((m) => MODULES[m].subs));

export async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "{}", "utf-8");
  }
}

export async function loadAclMap() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  try {
    const obj = JSON.parse(raw || "{}");
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

export async function saveAclMap(map) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(map, null, 2), "utf-8");
}

/**
 * Normaliza payloads de PUT (acepta formato viejo y nuevo).
 * NUEVO:
 * {
 *   permisos:   { [moduleKey]: string[] } // subprocesos habilitados por módulo
 *   privilegios:{ [subKey]: string[]   }  // acciones por subproceso
 * }
 * VIEJO (compat):
 *   permisos:    string[]   // módulos
 *   privilegios: string[]   // acciones globales
 */
export function normalizeAclPayload(payload = {}) {
  const out = { permisos: {}, privilegios: {} };

  // --- PERMISOS ---
  // Nuevo formato: objeto módulo -> [subs]
  if (payload.permisos && typeof payload.permisos === "object" && !Array.isArray(payload.permisos)) {
    for (const mod of Object.keys(payload.permisos)) {
      if (!moduleKeys.includes(mod)) continue;
      const subs = Array.isArray(payload.permisos[mod]) ? payload.permisos[mod] : [];
      const validSubs = subs.filter((s) => MODULES[mod].subs.includes(s));
      if (validSubs.length) out.permisos[mod] = Array.from(new Set(validSubs));
    }
  }

  // Formato viejo: array de módulos -> dar TODOS sus subs
  if (Array.isArray(payload.permisos)) {
    const mods = payload.permisos.filter((m) => moduleKeys.includes(m));
    for (const m of mods) {
      out.permisos[m] = MODULES[m].subs.slice();
    }
  }

  // --- PRIVILEGIOS ---
  // Nuevo: objeto subKey -> [acciones]
  if (payload.privilegios && typeof payload.privilegios === "object" && !Array.isArray(payload.privilegios)) {
    for (const sub of Object.keys(payload.privilegios)) {
      if (!allSubKeys.has(sub)) continue;
      const acts = Array.isArray(payload.privilegios[sub]) ? payload.privilegios[sub] : [];
      const validActs = acts.filter((a) => ACTIONS.includes(a));
      if (validActs.length) out.privilegios[sub] = Array.from(new Set(validActs));
    }
  }

  // Viejo: array global -> aplicar a todos los subprocesos habilitados
  if (Array.isArray(payload.privilegios)) {
    const acts = payload.privilegios.filter((a) => ACTIONS.includes(a));
    for (const mod of Object.keys(out.permisos)) {
      for (const sub of out.permisos[mod]) {
        out.privilegios[sub] = Array.from(new Set([...(out.privilegios[sub] || []), ...acts]));
      }
    }
  }

  return out;
}

export async function getAclForRole(idroles) {
  const map = await loadAclMap();
  const raw = map?.[idroles] || {};
  const normalized = normalizeAclPayload(raw);
  return { idroles: Number(idroles), ...normalized };
}

export async function saveAclForRole(idroles, payload) {
  const map = await loadAclMap();
  const normalized = normalizeAclPayload(payload);
  map[idroles] = normalized;
  await saveAclMap(map);
  return { idroles: Number(idroles), ...normalized };
}
