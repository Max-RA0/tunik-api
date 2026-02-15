const rolesService = require('../services/roles.service');
const response = require('../utils/response.util');

class RolesController {
  async findAll(req, res, next) {
    try {
      const roles = await rolesService.findAll();
      return response.success(res, roles);
    } catch (error) {
      next(error);
    }
  }

  async findOne(req, res, next) {
    try {
      const { idroles } = req.params;
      const role = await rolesService.findById(idroles);
      return response.success(res, role);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const role = await rolesService.create(req.body);
      return response.created(res, role, 'Rol creado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { idroles } = req.params;
      const role = await rolesService.update(idroles, req.body);
      return response.success(res, role, 'Rol actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { idroles } = req.params;
      await rolesService.delete(idroles);
      return response.success(res, null, 'Rol eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RolesController();
