# Icon Medellín - Backend API

Backend API REST para el sistema de gestión de **Icon Medellín (Estética Automotriz)**.

## Stack Tecnológico

- **Node.js** + **Express.js**
- **Sequelize** ORM
- **MySQL** Database
- **JWT** Authentication
- **express-validator** para validación
- **winston** para logging

## Requisitos

- Node.js >= 18.x
- MySQL >= 8.0
- npm o yarn

## Instalación

1. **Clonar el repositorio e instalar dependencias:**

```bash
cd backend
npm install
```

2. **Configurar variables de entorno:**

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=icon_medellin
DB_USER=root
DB_PASSWORD=tu_password

# JWT
JWT_ACCESS_SECRET=tu_secret_key_segura
JWT_REFRESH_SECRET=tu_refresh_secret_key
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=2592000

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

3. **Iniciar el servidor:**

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start
```

## Estructura del Proyecto

```
src/
├── main.js                 # Entry point
├── app.js                  # Express app configuration
├── config/
│   ├── database.js         # Sequelize config
│   └── security.js         # JWT config
├── controllers/            # Request handlers
├── services/               # Business logic
├── models/                 # Sequelize models
├── routes/                 # API routes
├── middleware/             # Express middleware
├── utils/                  # Utilities
└── database/
    └── connection.js       # DB connection
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/forgot-password` - Solicitar reset de contraseña
- `POST /api/auth/reset-password` - Restablecer contraseña

### Usuarios
- `GET /api/usuarios` - Listar usuarios
- `GET /api/usuarios/:numero_documento` - Obtener usuario
- `POST /api/usuarios` - Crear usuario
- `PUT /api/usuarios/:numero_documento` - Actualizar usuario
- `DELETE /api/usuarios/:numero_documento` - Eliminar usuario

### Roles
- `GET /api/roles` - Listar roles
- `GET /api/roles/:idroles` - Obtener rol
- `POST /api/roles` - Crear rol
- `PUT /api/roles/:idroles` - Actualizar rol
- `DELETE /api/roles/:idroles` - Eliminar rol

### Vehículos
- `GET /api/tipovehiculos` - Listar tipos
- `POST /api/tipovehiculos` - Crear tipo
- `PUT /api/tipovehiculos/:idtipovehiculos` - Actualizar tipo
- `DELETE /api/tipovehiculos/:idtipovehiculos` - Eliminar tipo

- `GET /api/marcas` - Listar marcas
- `POST /api/marcas` - Crear marca
- `PUT /api/marcas/:idmarca` - Actualizar marca
- `DELETE /api/marcas/:idmarca` - Eliminar marca

- `GET /api/vehiculos` - Listar vehículos
- `GET /api/vehiculos/:placa` - Obtener vehículo
- `POST /api/vehiculos` - Crear vehículo
- `PUT /api/vehiculos/:placa` - Actualizar vehículo
- `DELETE /api/vehiculos/:placa` - Eliminar vehículo

### Servicios
- `GET /api/categoriaservicios` - Listar categorías
- `POST /api/categoriaservicios` - Crear categoría
- `PUT /api/categoriaservicios/:idcategoriaservicios` - Actualizar categoría
- `DELETE /api/categoriaservicios/:idcategoriaservicios` - Eliminar categoría

- `GET /api/servicios` - Listar servicios
- `GET /api/servicios/:idservicios` - Obtener servicio
- `POST /api/servicios` - Crear servicio
- `PUT /api/servicios/:idservicios` - Actualizar servicio
- `DELETE /api/servicios/:idservicios` - Eliminar servicio

### Agenda de Citas
- `GET /api/agendacitas` - Listar citas
- `GET /api/agendacitas/:idagendacitas` - Obtener cita
- `POST /api/agendacitas` - Crear cita
- `PUT /api/agendacitas/:idagendacitas` - Actualizar cita
- `DELETE /api/agendacitas/:idagendacitas` - Eliminar cita

- `GET /api/detalleagendacitas` - Listar detalles
- `GET /api/detalleagendacitas/agenda/:idagendacitas` - Detalles por cita
- `GET /api/detalleagendacitas/agenda/:idagendacitas/total` - Total de cita
- `POST /api/detalleagendacitas` - Crear detalle
- `PUT /api/detalleagendacitas/agenda/:idagendacitas/servicio/:idservicios` - Actualizar
- `DELETE /api/detalleagendacitas/agenda/:idagendacitas/servicio/:idservicios` - Eliminar

### Cotizaciones
- `GET /api/cotizaciones` - Listar cotizaciones
- `GET /api/cotizaciones/:idcotizaciones` - Obtener cotización
- `POST /api/cotizaciones` - Crear cotización
- `PUT /api/cotizaciones/:idcotizaciones` - Actualizar cotización
- `DELETE /api/cotizaciones/:idcotizaciones` - Eliminar cotización

- `GET /api/detallecotizaciones` - Listar detalles
- `GET /api/detallecotizaciones/cotizacion/:idcotizaciones` - Detalles por cotización
- `POST /api/detallecotizaciones` - Crear detalle
- `PUT /api/detallecotizaciones/:idcotizaciones/:idservicios` - Actualizar
- `DELETE /api/detallecotizaciones/:idcotizaciones/:idservicios` - Eliminar

### Ventas
- `GET /api/ventas` - Listar ventas
- `GET /api/ventas/:idventas` - Obtener venta
- `POST /api/ventas` - Crear venta
- `PUT /api/ventas/:idventas` - Actualizar venta
- `DELETE /api/ventas/:idventas` - Eliminar venta

- `GET /api/detalleventas` - Listar detalles
- `GET /api/detalleventas/venta/:idventas` - Detalles por venta
- `POST /api/detalleventas` - Crear detalle
- `DELETE /api/detalleventas/:iddetalleventas` - Eliminar detalle

- `GET /api/pagosventas` - Listar pagos
- `GET /api/pagosventas/venta/:idventas` - Pagos por venta
- `POST /api/pagosventas` - Registrar pago
- `DELETE /api/pagosventas/:idpagoventas` - Eliminar pago

### Métodos de Pago
- `GET /api/metodospago` - Listar métodos
- `POST /api/metodospago` - Crear método
- `PUT /api/metodospago/:idmpago` - Actualizar método
- `DELETE /api/metodospago/:idmpago` - Eliminar método

### Inventario
- `GET /api/productos` - Listar productos
- `POST /api/productos` - Crear producto
- `PUT /api/productos/:idproductos` - Actualizar producto
- `DELETE /api/productos/:idproductos` - Eliminar producto

- `GET /api/proveedores` - Listar proveedores
- `POST /api/proveedores` - Crear proveedor
- `PUT /api/proveedores/:idproveedor` - Actualizar proveedor
- `DELETE /api/proveedores/:idproveedor` - Eliminar proveedor

- `GET /api/pedidos` - Listar pedidos
- `POST /api/pedidos` - Crear pedido
- `PUT /api/pedidos/:idpedidos` - Actualizar pedido
- `DELETE /api/pedidos/:idpedidos` - Eliminar pedido

### Evaluaciones
- `GET /api/evaluaciones` - Listar evaluaciones
- `GET /api/evaluaciones/summary` - Resumen de calificaciones
- `GET /api/evaluaciones/:idevaluacionservicios` - Obtener evaluación
- `POST /api/evaluaciones` - Crear evaluación
- `PUT /api/evaluaciones/:idevaluacionservicios` - Actualizar evaluación
- `DELETE /api/evaluaciones/:idevaluacionservicios` - Eliminar evaluación

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas generales

## Autenticación

Todos los endpoints (excepto auth) requieren autenticación JWT.

**Header:**
```
Authorization: Bearer <token>
```

## Formato de Respuesta

**Éxito:**
```json
{
  "ok": true,
  "data": { },
  "msg": "Operación exitosa"
}
```

**Error:**
```json
{
  "ok": false,
  "msg": "Mensaje de error",
  "error": "Detalle técnico"
}
```

## Scripts

```bash
npm start       # Iniciar en producción
npm run dev     # Iniciar en desarrollo con nodemon
npm run db:migrate      # Ejecutar migraciones
npm run db:migrate:undo # Revertir última migración
npm run db:seed         # Ejecutar seeders
```

## Licencia

ISC
