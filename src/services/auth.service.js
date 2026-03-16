const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Role, RolePermiso, Modulo, Accion} = require('../models');
const { jwt: jwtConfig, bcrypt: bcryptConfig } = require('../config/security');
const { sendResetPasswordEmail } = require('../utils/mailer.util');

class AuthService {
  async register(userData) {
    const { numero_documento, tipo_documento, nombre, telefono, email, contrasena, idroles } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { email } 
    });
    
    if (existingUser) {
      const error = new Error('El email ya está registrado');
      error.statusCode = 409;
      throw error;
    }

    const existingDoc = await User.findByPk(numero_documento);
    if (existingDoc) {
      const error = new Error('El número de documento ya está registrado');
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(contrasena, bcryptConfig.saltRounds);

    // Create user
    const user = await User.create({
      numero_documento,
      tipo_documento,
      nombre,
      telefono,
      email,
      contrasena: hashedPassword,
      idroles: idroles || 2 // Default role
    });

    // Get role info
    const role = await Role.findByPk(user.idroles);

    return {
      numero_documento: user.numero_documento,
      nombre: user.nombre,
      email: user.email,
      rol: role ? role.nombrerol : null
    };
  }

  async login(email, contrasena) {
    // Find user with role
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      const error = new Error('Credenciales inválidas');
      error.statusCode = 401;
      throw error;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(contrasena, user.contrasena);
    if (!isValidPassword) {
      const error = new Error('Credenciales inválidas');
      error.statusCode = 401;
      throw error;
    }

    // Generate tokens
    // Get role info separately
    let role = null;
    try {
      role = await Role.findByPk(user.idroles);
    } catch (error) {
      console.log('Error fetching role:', error.message);
    }

    const tokenPayload = {
      numero_documento: user.numero_documento,
      email: user.email,
      nombre: user.nombre,
      idroles: user.idroles,
      nombrerol: role ? role.descripcion : null
    };

    const accessToken = jwt.sign(tokenPayload, jwtConfig.accessSecret, {
      expiresIn: jwtConfig.accessTTL
    });

    const refreshToken = jwt.sign(
      { numero_documento: user.numero_documento },
      jwtConfig.refreshSecret,
      { expiresIn: jwtConfig.refreshTTL }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: jwtConfig.accessTTL,
      user: {
        numero_documento: user.numero_documento,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        tipo_documento: user.tipo_documento,
        idroles: user.idroles,
        rol: role ? role.descripcion : null
      }
    };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
      
      const user = await User.findByPk(decoded.numero_documento);
      
      if (!user) {
        const error = new Error('Usuario no encontrado');
        error.statusCode = 401;
        throw error;
      }

      // Get role info separately
      const role = await Role.findByPk(user.idroles);

      const tokenPayload = {
        numero_documento: user.numero_documento,
        email: user.email,
        nombre: user.nombre,
        idroles: user.idroles,
        nombrerol: role ? role.descripcion : null
      };

      const newAccessToken = jwt.sign(tokenPayload, jwtConfig.accessSecret, {
        expiresIn: jwtConfig.accessTTL
      });

      const newRefreshToken = jwt.sign(
        { numero_documento: user.numero_documento },
        jwtConfig.refreshSecret,
        { expiresIn: jwtConfig.refreshTTL }
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: jwtConfig.accessTTL
      };
    } catch (error) {
      const err = new Error('Token de refresh inválido');
      err.statusCode = 401;
      throw err;
    }
  }

  async forgotPassword(email) {
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
    
      return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 3600000); // 1 hour

    await user.update({
      reset_token: resetToken,
      token_expires: tokenExpires
    });

    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    try {
      await sendResetPasswordEmail({
        to: user.email,
        resetUrl,
      });
    } catch (e) {
      // KEYWORDS: LOG_EMAIL_ERROR
      console.log("EMAIL_SEND_ERROR:", e?.message || e);
      // opcional: no revelar error al cliente por seguridad
    }

    return {
      message: "Si el email existe, recibirás instrucciones para restablecer tu contraseña",
    };
  }

  async resetPassword(token, newPassword) {
    const user = await User.findOne({
      where: {
        reset_token: token
      }
    });

    if (!user) {
      const error = new Error('Token inválido o expirado');
      error.statusCode = 400;
      throw error;
    }

    if (user.token_expires && new Date(user.token_expires) < new Date()) {
      const error = new Error('Token expirado');
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(newPassword, bcryptConfig.saltRounds);

    await user.update({
      contrasena: hashedPassword,
      reset_token: null,
      token_expires: null
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }
    // KEYWORDS: AUTH_PERMISOS_SERVICE / ROLESPERMISOS_JOIN / FLAT_CODES
  async getPermisosByRoleId(idroles) {
    if (!idroles) return [];

    const rows = await RolePermiso.findAll({
      where: { idroles, permitido: 1 },
      include: [
        { model: Modulo, as: "modulo", attributes: ["codigo"] },
        { model: Accion, as: "accion", attributes: ["codigo"] },
      ],
    });

    return rows
      .map((rp) => {
        const m = rp?.modulo?.codigo;
        const a = rp?.accion?.codigo;
        if (!m || !a) return null;
        return `${String(m).toLowerCase()}.${String(a).toLowerCase()}`;
      })
      .filter(Boolean);
  }
}

module.exports = new AuthService();
