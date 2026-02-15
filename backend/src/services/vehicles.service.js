const { Vehiculo, TipoVehiculo, Marca, User } = require('../models');
const { Op } = require('sequelize');

class VehiclesService {
  // Tipos de vehículos
  async findAllTipos() {
    return await TipoVehiculo.findAll();
  }

  async createTipo(data) {
    return await TipoVehiculo.create(data);
  }

  async updateTipo(idtipovehiculos, data) {
    const tipo = await TipoVehiculo.findByPk(idtipovehiculos);
    if (!tipo) {
      const error = new Error('Tipo de vehículo no encontrado');
      error.statusCode = 404;
      throw error;
    }
    await tipo.update(data);
    return tipo;
  }

  async deleteTipo(idtipovehiculos) {
    const tipo = await TipoVehiculo.findByPk(idtipovehiculos);
    if (!tipo) {
      const error = new Error('Tipo de vehículo no encontrado');
      error.statusCode = 404;
      throw error;
    }
    await tipo.destroy();
    return { message: 'Tipo de vehículo eliminado exitosamente' };
  }

  // Marcas
  async findAllMarcas() {
    return await Marca.findAll();
  }

  async createMarca(data) {
    return await Marca.create(data);
  }

  async updateMarca(idmarca, data) {
    const marca = await Marca.findByPk(idmarca);
    if (!marca) {
      const error = new Error('Marca no encontrada');
      error.statusCode = 404;
      throw error;
    }
    await marca.update(data);
    return marca;
  }

  async deleteMarca(idmarca) {
    const marca = await Marca.findByPk(idmarca);
    if (!marca) {
      const error = new Error('Marca no encontrada');
      error.statusCode = 404;
      throw error;
    }
    await marca.destroy();
    return { message: 'Marca eliminada exitosamente' };
  }

  // Vehículos
  async findAllVehiculos(query = {}) {
    const { placa, numero_documento } = query;
    const where = {};

    if (placa) {
      where.placa = { [Op.like]: `%${placa}%` };
    }

    if (numero_documento) {
      where.numero_documento = numero_documento;
    }

    return await Vehiculo.findAll({
      where,
      include: [
        { model: TipoVehiculo, as: 'tipo' },
        { model: Marca, as: 'marca' },
        { model: User, as: 'usuario', attributes: ['numero_documento', 'nombre', 'email', 'telefono'] }
      ]
    });
  }

  async findVehiculoByPlaca(placa) {
    const vehiculo = await Vehiculo.findByPk(placa, {
      include: [
        { model: TipoVehiculo, as: 'tipo' },
        { model: Marca, as: 'marca' },
        { model: User, as: 'usuario', attributes: ['numero_documento', 'nombre', 'email', 'telefono'] }
      ]
    });

    if (!vehiculo) {
      const error = new Error('Vehículo no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return vehiculo;
  }

  async createVehiculo(data) {
    const { placa } = data;

    const existing = await Vehiculo.findByPk(placa);
    if (existing) {
      const error = new Error('La placa ya está registrada');
      error.statusCode = 409;
      throw error;
    }

    const vehiculo = await Vehiculo.create(data);
    return await this.findVehiculoByPlaca(vehiculo.placa);
  }

  async updateVehiculo(placa, data) {
    const vehiculo = await Vehiculo.findByPk(placa);
    if (!vehiculo) {
      const error = new Error('Vehículo no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Don't allow changing placa
    delete data.placa;

    await vehiculo.update(data);
    return await this.findVehiculoByPlaca(placa);
  }

  async deleteVehiculo(placa) {
    const vehiculo = await Vehiculo.findByPk(placa);
    if (!vehiculo) {
      const error = new Error('Vehículo no encontrado');
      error.statusCode = 404;
      throw error;
    }
    await vehiculo.destroy();
    return { message: 'Vehículo eliminado exitosamente' };
  }
}

module.exports = new VehiclesService();
