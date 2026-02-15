const { Role } = require('../models');

class RolesService {
  async findAll() {
    const roles = await Role.findAll();
    return roles;
  }

  async findById(idroles) {
    const role = await Role.findByPk(idroles);

    if (!role) {
      const error = new Error('Rol no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return role;
  }

  async create(roleData) {
    const { nombrerol, descripcion } = roleData;

    const role = await Role.create({
      nombrerol,
      descripcion
    });

    return role;
  }

  async update(idroles, roleData) {
    const role = await Role.findByPk(idroles);

    if (!role) {
      const error = new Error('Rol no encontrado');
      error.statusCode = 404;
      throw error;
    }

    await role.update(roleData);
    return role;
  }

  async delete(idroles) {
    const role = await Role.findByPk(idroles);

    if (!role) {
      const error = new Error('Rol no encontrado');
      error.statusCode = 404;
      throw error;
    }

    await role.destroy();
    return { message: 'Rol eliminado exitosamente' };
  }
}

module.exports = new RolesService();
