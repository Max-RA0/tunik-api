// server/controllers/auth.controller.js
import bcrypt from "bcrypt";
import crypto from "crypto";
import Usuarios from "../models/usuarios.js";
import sequelize from "../config/db.js";
import { QueryTypes } from "sequelize";
import { transporter } from "../config/nodemailer.js"; // <- corregido

const ROLE_ADMIN = "Administrador";
const ROLE_CLIENTE = "Cliente";

/* ---------------- Helpers roles (sin ACL) ---------------- */
async function getRoleNameById(idroles) {
  if (!idroles) return ROLE_CLIENTE;

  const rows = await sequelize.query(
    "SELECT descripcion FROM roles WHERE idroles = :idroles LIMIT 1",
    {
      replacements: { idroles },
      type: QueryTypes.SELECT,
    }
  );

  return rows?.[0]?.descripcion || ROLE_CLIENTE;
}

async function getRoleIdByName(descripcion) {
  const desc = String(descripcion || "").trim().toLowerCase();
  if (!desc) return null;

  const rows = await sequelize.query(
    "SELECT idroles FROM roles WHERE LOWER(descripcion) = :desc LIMIT 1",
    {
      replacements: { desc },
      type: QueryTypes.SELECT,
    }
  );

  const id = rows?.[0]?.idroles ?? null;
  return id != null ? Number(id) : null;
}

/* ---------------- Login ---------------- */
export const login = async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).json({ ok: false, msg: "Faltan datos" });
    }

    const usuario = await Usuarios.findOne({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!usuario) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
    }

    const passwordValida = await bcrypt.compare(
      String(contrasena),
      String(usuario.contrasena)
    );

    if (!passwordValida) {
      return res.status(401).json({ ok: false, msg: "Contraseña incorrecta" });
    }

    // ✅ Rol simple (Administrador / Cliente) desde tabla roles
    const rol = await getRoleNameById(usuario.idroles);

    return res.json({
      ok: true,
      msg: "Login exitoso",
      usuario: {
        numero_documento: usuario.numero_documento,
        nombre: usuario.nombre,
        email: usuario.email,
        idroles: usuario.idroles,
        rol, // <- "Administrador" o "Cliente"
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ ok: false, msg: "Error en el servidor" });
  }
};

/* ---------------- Util: hashear contraseñas una sola vez ---------------- */
export const hashPasswordsOnce = async (req, res) => {
  try {
    await sequelize.authenticate();

    const usuarios = await Usuarios.findAll();

    for (const user of usuarios) {
      if (typeof user.contrasena === "string" && user.contrasena.startsWith("$2"))
        continue;

      const hashedPassword = await bcrypt.hash(String(user.contrasena), 10);
      await user.update({ contrasena: hashedPassword });
    }

    return res.json({ ok: true, msg: "Contraseñas encriptadas correctamente" });
  } catch (error) {
    console.error("Error en hashPasswordsOnce:", error);
    return res
      .status(500)
      .json({ ok: false, msg: "Error al encriptar contraseñas" });
  }
};

/* ---------------- Register ---------------- */
export const register = async (req, res) => {
  try {
    let {
      numero_documento,
      tipo_documento,
      nombre,
      telefono,
      email,
      contrasena,
      idroles,
    } = req.body;

    // normaliza
    numero_documento = String(numero_documento || "").trim();
    tipo_documento = String(tipo_documento || "").trim();
    nombre = String(nombre || "").trim();
    telefono = String(telefono || "").trim();
    email = String(email || "").trim().toLowerCase();
    contrasena = String(contrasena || "");

    // valida requeridos (según tu modelo)
    if (
      !numero_documento ||
      !tipo_documento ||
      !nombre ||
      !telefono ||
      !email ||
      !contrasena
    ) {
      return res
        .status(400)
        .json({ ok: false, msg: "Faltan datos obligatorios." });
    }

    if (contrasena.length < 6) {
      return res.status(400).json({
        ok: false,
        msg: "La contraseña debe tener mínimo 6 caracteres.",
      });
    }

    // evita duplicados
    const existeEmail = await Usuarios.findOne({ where: { email } });
    if (existeEmail) {
      return res
        .status(409)
        .json({ ok: false, msg: "Ese correo ya está registrado." });
    }

    const existeDoc = await Usuarios.findByPk(numero_documento);
    if (existeDoc) {
      return res
        .status(409)
        .json({ ok: false, msg: "Ese documento ya está registrado." });
    }

    // ✅ rol por defecto: Cliente (si no mandan idroles)
    let roleId = Number(idroles || 0);
    if (!Number.isFinite(roleId) || roleId <= 0) {
      const clienteId = await getRoleIdByName(ROLE_CLIENTE);
      roleId = clienteId ?? null;
    }

    if (!roleId) {
      // fallback seguro (si tu tabla roles está vacía o no coincide el texto)
      // Ajusta este número si en tu BD el Cliente no es 2.
      roleId = 2;
    }

    // hash
    const hashed = await bcrypt.hash(contrasena, 10);

    await Usuarios.create({
      numero_documento,
      tipo_documento,
      nombre,
      telefono,
      email,
      contrasena: hashed,
      idroles: roleId,
    });

    return res.json({ ok: true, msg: "Usuario registrado correctamente." });
  } catch (error) {
    console.error("Error en register:", error);
    return res.status(500).json({ ok: false, msg: "Error en el servidor" });
  }
};

/* ---------------- Password reset ---------------- */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ ok: false, msg: "Debe enviar el correo." });

    const usuario = await Usuarios.findOne({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!usuario)
      return res.status(404).json({ ok: false, msg: "Correo no registrado." });

    // Crear token seguro
    const token = crypto.randomBytes(40).toString("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await usuario.update({
      reset_token: token,
      token_expires: expires,
    });

    const link = `http://localhost:5173/reset-password/${token}`;

    // -------- Enviar correo --------
    await transporter.sendMail({
      from: `"Soporte Tunik" <${process.env.EMAIL_USER}>`,
      to: usuario.email,
      subject: "Recuperación de contraseña",
      html: `
        <p>Hola <strong>${usuario.nombre}</strong>,</p>
        <p>Solicitaste un cambio de contraseña.</p>
        <p>Haz clic en el siguiente enlace para restablecerla:</p>
        <a href="${link}">${link}</a>
        <p><strong>El enlace expira en 15 minutos.</strong></p>
      `,
    });

    return res.json({ ok: true, msg: "Correo enviado correctamente." });
  } catch (error) {
    console.error("Error en requestPasswordReset:", error);
    return res.status(500).json({ ok: false, msg: "Error en el servidor." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { nuevaPassword } = req.body;

    if (!nuevaPassword)
      return res.status(400).json({
        ok: false,
        msg: "Debe enviar la nueva contraseña.",
      });

    const usuario = await Usuarios.findOne({ where: { reset_token: token } });

    if (!usuario)
      return res.status(404).json({ ok: false, msg: "Token inválido." });

    if (usuario.token_expires < new Date())
      return res.status(400).json({ ok: false, msg: "El token expiró." });

    const hashed = await bcrypt.hash(String(nuevaPassword), 10);

    await usuario.update({
      contrasena: hashed,
      reset_token: null,
      token_expires: null,
    });

    return res.json({ ok: true, msg: "Contraseña actualizada correctamente." });
  } catch (error) {
    console.error("Error en resetPassword:", error);
    return res.status(500).json({ ok: false, msg: "Error en el servidor." });
  }
};
