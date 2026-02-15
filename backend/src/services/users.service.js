const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const { bcrypt: bcryptConfig } = require('../config/security');
const { Op } = require('sequelize');

class UsersService {
  async findAll(query = {}) {
    const { q, idroles } = query;
    const where = {};

    if (q) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
        { numero_documento: { [Op.like]: `%${q}%` } }
      ];
    }

    if (idroles) {
      where.idroles = idroles;
    }

    const users = await User.findAll({
      where,
      include: [{ model: Role, as: 'rol' }],
      attributes: { exclude: ['contrasena', 'reset_token', 'token_expires'] }
    });

    return users;
  }

  async findByDocumento(numero_documento) {
    const user = await User.findByPk(numero_documento, {
      include: [{ model: Role, as: 'rol' }],
      attributes: { exclude: ['contrasena', 'reset_token', 'token_expires'] }
    });

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  async create(userData) {
    const { numero_documento, tipo_documento, nombre, telefono, email, contrasena, idroles } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
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

    const user = await User.create({
      numero_documento,
      tipo_documento,
      nombre,
      telefono,
      email,
      contrasena: hashedPassword,
      idroles
    });

    const result = await this.findByDocumento(user.numero_documento);
    return result;
  }

  async update(numero_documento, userData) {
    const user = await User.findByPk(numero_documento);

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    const updateData = { ...userData };

    // If password is being updated, hash it
    if (updateData.contrasena) {
      updateData.contrasena = await bcrypt.hash(updateData.contrasena, bcryptConfig.saltRounds);
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.numero_documento;

    await user.update(updateData);

    const result = await this.findByDocumento(numero_documento);
    return result;
  }

  async delete(numero_documento) {
    const user = await User.findByPk(numero_documento);

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    await user.destroy();
    return { message: 'Usuario eliminado exitosamente' };
  }
}

module.exports = new UsersService();
