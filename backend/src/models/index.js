const { sequelize } = require('../database/connection');

// Import models
const Role = require('./Role');
const User = require('./User');
const TipoVehiculo = require('./TipoVehiculo');
const Marca = require('./Marca');
const Vehiculo = require('./Vehiculo');
const CategoriaServicio = require('./CategoriaServicio');
const Servicio = require('./Servicio');
const AgendaCita = require('./AgendaCita');
const DetalleAgendaCita = require('./DetalleAgendaCita');
const MetodoPago = require('./MetodoPago');
const Cotizacion = require('./Cotizacion');
const DetalleCotizacion = require('./DetalleCotizacion');
const Venta = require('./Venta');
const DetalleVenta = require('./DetalleVenta');
const PagoVenta = require('./PagoVenta');
const Producto = require('./Producto');
const Proveedor = require('./Proveedor');
const Pedido = require('./Pedido');
const EvaluacionServicio = require('./EvaluacionServicio');

// Define associations

// User - Role
User.belongsTo(Role, { foreignKey: 'idroles', as: 'rol' });
Role.hasMany(User, { foreignKey: 'idroles', as: 'usuarios' });

// Vehiculo - TipoVehiculo
Vehiculo.belongsTo(TipoVehiculo, { foreignKey: 'idtipovehiculos', as: 'tipo' });
TipoVehiculo.hasMany(Vehiculo, { foreignKey: 'idtipovehiculos', as: 'vehiculos' });

// Vehiculo - Marca
Vehiculo.belongsTo(Marca, { foreignKey: 'idmarca', as: 'marca' });
Marca.hasMany(Vehiculo, { foreignKey: 'idmarca', as: 'vehiculos' });

// Vehiculo - User (propietario)
Vehiculo.belongsTo(User, { foreignKey: 'numero_documento', as: 'usuario' });
User.hasMany(Vehiculo, { foreignKey: 'numero_documento', as: 'vehiculos' });

// Servicio - CategoriaServicio
Servicio.belongsTo(CategoriaServicio, { foreignKey: 'idcategoriaservicios', as: 'categoria' });
CategoriaServicio.hasMany(Servicio, { foreignKey: 'idcategoriaservicios', as: 'servicios' });

// AgendaCita - Vehiculo
AgendaCita.belongsTo(Vehiculo, { foreignKey: 'placa', as: 'vehiculo' });
Vehiculo.hasMany(AgendaCita, { foreignKey: 'placa', as: 'citas' });

// DetalleAgendaCita - AgendaCita
DetalleAgendaCita.belongsTo(AgendaCita, { foreignKey: 'idagendacitas', as: 'agendaCita' });
AgendaCita.hasMany(DetalleAgendaCita, { foreignKey: 'idagendacitas', as: 'detalles' });

// DetalleAgendaCita - Servicio
DetalleAgendaCita.belongsTo(Servicio, { foreignKey: 'idservicios', as: 'servicio' });
Servicio.hasMany(DetalleAgendaCita, { foreignKey: 'idservicios', as: 'detallesAgenda' });

// Cotizacion - Vehiculo
Cotizacion.belongsTo(Vehiculo, { foreignKey: 'placa', as: 'vehiculo' });
Vehiculo.hasMany(Cotizacion, { foreignKey: 'placa', as: 'cotizaciones' });

// Cotizacion - MetodoPago
Cotizacion.belongsTo(MetodoPago, { foreignKey: 'idmpago', as: 'metodoPago' });
MetodoPago.hasMany(Cotizacion, { foreignKey: 'idmpago', as: 'cotizaciones' });

// Cotizacion - AgendaCita
Cotizacion.belongsTo(AgendaCita, { foreignKey: 'idagendacitas', as: 'agendaCita' });
AgendaCita.hasMany(Cotizacion, { foreignKey: 'idagendacitas', as: 'cotizaciones' });

// DetalleCotizacion - Cotizacion
DetalleCotizacion.belongsTo(Cotizacion, { foreignKey: 'idcotizaciones', as: 'cotizacion' });
Cotizacion.hasMany(DetalleCotizacion, { foreignKey: 'idcotizaciones', as: 'detalles' });

// DetalleCotizacion - Servicio
DetalleCotizacion.belongsTo(Servicio, { foreignKey: 'idservicios', as: 'servicio' });
Servicio.hasMany(DetalleCotizacion, { foreignKey: 'idservicios', as: 'detallesCotizacion' });

// DetalleVenta - Venta
DetalleVenta.belongsTo(Venta, { foreignKey: 'idventas', as: 'venta' });
Venta.hasMany(DetalleVenta, { foreignKey: 'idventas', as: 'detalles' });

// DetalleVenta - Servicio
DetalleVenta.belongsTo(Servicio, { foreignKey: 'idservicios', as: 'servicio' });
Servicio.hasMany(DetalleVenta, { foreignKey: 'idservicios', as: 'detallesVenta' });

// PagoVenta - Venta
PagoVenta.belongsTo(Venta, { foreignKey: 'idventas', as: 'venta' });
Venta.hasMany(PagoVenta, { foreignKey: 'idventas', as: 'pagos' });

// PagoVenta - MetodoPago
PagoVenta.belongsTo(MetodoPago, { foreignKey: 'idmpago', as: 'metodoPago' });
MetodoPago.hasMany(PagoVenta, { foreignKey: 'idmpago', as: 'pagos' });

// Pedido - Proveedor
Pedido.belongsTo(Proveedor, { foreignKey: 'idproveedor', as: 'proveedor' });
Proveedor.hasMany(Pedido, { foreignKey: 'idproveedor', as: 'pedidos' });

// Pedido - Producto
Pedido.belongsTo(Producto, { foreignKey: 'idproductos', as: 'producto' });
Producto.hasMany(Pedido, { foreignKey: 'idproductos', as: 'pedidos' });

// EvaluacionServicio - Venta
EvaluacionServicio.belongsTo(Venta, { foreignKey: 'idventas', as: 'venta' });
Venta.hasMany(EvaluacionServicio, { foreignKey: 'idventas', as: 'evaluaciones' });

module.exports = {
  sequelize,
  Role,
  User,
  TipoVehiculo,
  Marca,
  Vehiculo,
  CategoriaServicio,
  Servicio,
  AgendaCita,
  DetalleAgendaCita,
  MetodoPago,
  Cotizacion,
  DetalleCotizacion,
  Venta,
  DetalleVenta,
  PagoVenta,
  Producto,
  Proveedor,
  Pedido,
  EvaluacionServicio
};
