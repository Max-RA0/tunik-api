const vehiclesService = require('../services/vehicles.service');
const response = require('../utils/response.util');

class VehiclesController {
  // Tipos de vehículos
  async findAllTipos(req, res, next) {
    try {
      const tipos = await vehiclesService.findAllTipos();
      return response.success(res, tipos);
    } catch (error) {
      next(error);
    }
  }

  async createTipo(req, res, next) {
    try {
      const tipo = await vehiclesService.createTipo(req.body);
      return response.created(res, tipo, 'Tipo de vehículo creado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async updateTipo(req, res, next) {
    try {
      const { idtipovehiculos } = req.params;
      const tipo = await vehiclesService.updateTipo(idtipovehiculos, req.body);
      return response.success(res, tipo, 'Tipo de vehículo actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async deleteTipo(req, res, next) {
    try {
      const { idtipovehiculos } = req.params;
      await vehiclesService.deleteTipo(idtipovehiculos);
      return response.success(res, null, 'Tipo de vehículo eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  // Marcas
  async findAllMarcas(req, res, next) {
    try {
      const marcas = await vehiclesService.findAllMarcas();
      return response.success(res, marcas);
    } catch (error) {
      next(error);
    }
  }

  async createMarca(req, res, next) {
    try {
      const marca = await vehiclesService.createMarca(req.body);
      return response.created(res, marca, 'Marca creada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async updateMarca(req, res, next) {
    try {
      const { idmarca } = req.params;
      const marca = await vehiclesService.updateMarca(idmarca, req.body);
      return response.success(res, marca, 'Marca actualizada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async deleteMarca(req, res, next) {
    try {
      const { idmarca } = req.params;
      await vehiclesService.deleteMarca(idmarca);
      return response.success(res, null, 'Marca eliminada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  // Vehículos
  async findAllVehiculos(req, res, next) {
    try {
      const vehiculos = await vehiclesService.findAllVehiculos(req.query);
      return response.success(res, vehiculos);
    } catch (error) {
      next(error);
    }
  }

  async findVehiculoByPlaca(req, res, next) {
    try {
      const { placa } = req.params;
      const vehiculo = await vehiclesService.findVehiculoByPlaca(placa);
      return response.success(res, vehiculo);
    } catch (error) {
      next(error);
    }
  }

  async createVehiculo(req, res, next) {
    try {
      const vehiculo = await vehiclesService.createVehiculo(req.body);
      return response.created(res, vehiculo, 'Vehículo creado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async updateVehiculo(req, res, next) {
    try {
      const { placa } = req.params;
      const vehiculo = await vehiclesService.updateVehiculo(placa, req.body);
      return response.success(res, vehiculo, 'Vehículo actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async deleteVehiculo(req, res, next) {
    try {
      const { placa } = req.params;
      await vehiclesService.deleteVehiculo(placa);
      return response.success(res, null, 'Vehículo eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VehiclesController();
