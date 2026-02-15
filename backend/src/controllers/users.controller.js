const usersService = require('../services/users.service');
const response = require('../utils/response.util');

class UsersController {
  async findAll(req, res, next) {
    try {
      const users = await usersService.findAll(req.query);
      return response.success(res, users);
    } catch (error) {
      next(error);
    }
  }

  async findOne(req, res, next) {
    try {
      const { numero_documento } = req.params;
      const user = await usersService.findByDocumento(numero_documento);
      return response.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const user = await usersService.create(req.body);
      return response.created(res, user, 'Usuario creado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { numero_documento } = req.params;
      const user = await usersService.update(numero_documento, req.body);
      return response.success(res, user, 'Usuario actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { numero_documento } = req.params;
      await usersService.delete(numero_documento);
      return response.success(res, null, 'Usuario eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UsersController();
