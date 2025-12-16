// server/server.js
import "dotenv/config"; 
import express from "express";
import cors from "cors";
import sequelize from "./config/db.js";
import tipovehiculosRoutes from "./routes/tipovehiculos.routes.js";
import categoriaserviciosRoutes from "./routes/categoriaservicios.routes.js";
import rolesRoutes from "./routes/roles.routes.js";
import vehiculosRoutes from "./routes/vehiculos.routes.js";
import marcasRoutes from "./routes/marcas.routes.js";
import metodospagoRoutes from "./routes/metodospago.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import serviciosRoutes from "./routes/servicios.routes.js";
import authRoutes from "./routes/auth.routes.js";
import proveedorRoutes from "./routes/proveedor.routes.js";
import evaluacionesRoutes from "./routes/evaluacionservicios.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import cotizacionesRoutes, {
  detalleCotizacionesRouter,
} from "./routes/cotizaciones.routes.js";
import agendacitasRouter, { detalleAgendacitasRouter } from "./routes/agendacitas.routes.js";
import pedidosRoutes from "./routes/pedidos.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();
app.set("trust proxy", 1);

const PORT = Number(process.env.PORT) || 3000;
app.use(cors());

app.use(
  express.json({
    type: ["application/json", "application/*+json"],
    limit: "2mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf?.toString?.() || "";
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "tunik-api", status: "up" });
});
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});


try {
  await sequelize.authenticate();
  console.log("✅ Conectado a MySQL correctamente.");
} catch (error) {
  console.error("❌ Error al conectar a MySQL:", error?.message || error);
}

// Usuarios & Roles
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/auth", authRoutes);

// Dashboard
app.use("/api/dashboard", dashboardRoutes);

// Vehículos
app.use("/api/tipovehiculos", tipovehiculosRoutes);
app.use("/api/vehiculos", vehiculosRoutes);
app.use("/api/marcas", marcasRoutes);

// Servicios
app.use("/api/categoriaservicios", categoriaserviciosRoutes);
app.use("/api/servicios", serviciosRoutes);

// Ventas
app.use("/api/metodospago", metodospagoRoutes);
app.use("/api/cotizaciones", cotizacionesRoutes);
app.use("/api/detallecotizaciones", detalleCotizacionesRouter);

// Compras
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/proveedores", proveedorRoutes);
app.use("/api/productos", productosRoutes);

// Evaluación
app.use("/api/evaluaciones", evaluacionesRoutes);

// Agenda
app.use("/api/agendacitas", agendacitasRouter);
app.use("/api/detalleagendacitas", detalleAgendacitasRouter);

// ✅ Manejo de errores (evita “crash silencioso”)
app.use((err, _req, res, _next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ ok: false, msg: "Error interno del servidor" });
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ unhandledRejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("❌ uncaughtException:", err);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API corriendo en puerto ${PORT}`);
});
