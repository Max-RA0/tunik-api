# Información básica — Backend Icon Medellín (Estética Automotriz) desde Cero

Este documento define la **especificación técnica** para reconstruir por completo el backend del sistema de gestión para **Icon Medellín (Estética Automotriz)** desde cero, con una arquitectura **eficiente, escalable y mantenible**, lista para integrarse con un frontend en **React** (web) y un cliente móvil (consulta).

---

## 1) Descripción general del proyecto

### 1.1 Propósito del sistema
Backend para automatizar y optimizar la operación de Icon Medellín:

- Roles y permisos (administración, empleados, etc.)
- Gestión de usuarios (administradores/empleados) y clientes
- Gestión de vehículos (marcas, tipos, vehículos)
- Gestión de categorías de servicios y servicios (con personalización)
- Agendamiento de citas (con servicios y asignación de empleado)
- Órdenes de servicio (ejecución, estados, evidencias/observaciones)
- Cotizaciones
- Pagos y métodos de pago
- Inventario de productos (stock) y compras/pedidos a proveedores
- Proveedores
- Reportes (PDF/estadísticos) y evaluación de desempeño del servicio (calificaciones)

### 1.2 Planteamiento del problema que resuelve
Icon Medellín actualmente depende de procesos manuales y herramientas no diseñadas para operación interna:

- Atención al cliente y agendamiento por WhatsApp (demoras, pérdida de seguimiento, imagen poco profesional).
- Registro de servicios en papel antes de asignarlos a empleados (errores, retrasos, mala comunicación interna).
- Gestión financiera en Excel (errores humanos, falta de control, difícil trazabilidad y reportes).

El sistema busca centralizar:

- Clientes, vehículos, servicios, citas y órdenes de servicio.
- Pagos y métodos de pago.
- Inventario, pedidos y proveedores.
- Reportes e indicadores de desempeño.

### 1.3 Tipo de aplicación
- **API REST**.
- **Monolito modular** (modular monolith) con módulos por dominio.

> Nota: se elige monolito modular porque es la forma más eficiente de comenzar con arquitectura sólida. Si el producto escala, se pueden extraer dominios a microservicios sin reescribir todo.

### 1.4 Arquitectura recomendada
- **Layered Architecture** (Arquitectura por Capas) organizada por **módulos funcionales**.

Capas:

- **Presentation Layer (Controllers/Routes)**: manejo de HTTP, validación de inputs, auth/roles, respuestas.
- **Business Logic Layer (Services)**: reglas de negocio, orquestación, procesamiento de datos.
- **Data Access Layer (Repositories/Models)**: acceso a base de datos, consultas SQL, modelos de datos.
- **Infrastructure Layer**: configuración, utilidades, conexión a servicios externos.

### 1.5 Justificación técnica
- **Mantenibilidad**: módulos aislados reducen acoplamiento.
- **Testabilidad**: use cases testeables sin infraestructura.
- **Escalabilidad**: permite colas, jobs, caché y escalado horizontal.
- **Performance**: paginación, índices e idempotencia definidos desde el inicio.
- **Evolución**: proveedores externos (pagos, envíos) se cambian por adaptadores.

### 1.6 Objetivo general
Desarrollar una aplicación web/móvil que gestione los procesos de servicios y ventas según los requerimientos de Icon Medellín.

### 1.7 Objetivos específicos (resumen)
- Configurar roles y permisos según funciones del sistema.
- Gestionar servicios y categorías.
- Agendar citas y visualizar detalles.
- Actualizar datos de empleados y clientes.
- Generar cotizaciones según requerimientos.
- Gestionar pedidos (compras) e inventario.
- Evaluar el desempeño del servicio por calificación del cliente.

### 1.8 Beneficiarios
- **Clientes**: mejor atención y seguimiento de sus servicios.
- **Administración**: información financiera precisa en tiempo real y reportes.
- **Empresa**: mejor imagen, productividad y rentabilidad.

---

## 2) Stack tecnológico recomendado

### 2.1 Backend
- **Node.js + JavaScript**
- Framework: **Express.js** (recomendado por simplicidad y flexibilidad)
- Validación: `joi` o `express-validator`
- Auth: **JWT access + refresh**
- Logs: **winston** o `morgan`
- Cache / Rate limit / Jobs: **Redis** (opcional)

### 2.2 Base de datos
- **MySQL** (manteniendo compatibilidad)
- ORM: **Sequelize** (manteniendo compatibilidad)
- Migraciones: Sequelize Migrate

---

## 3) Estructura del proyecto (carpetas)

Estructura recomendada:

```text
src/
  main.js
  app.js

  config/
    database.js
    redis.js
    security.js

  controllers/
    auth.controller.js
    users.controller.js
    customers.controller.js
    vehicles.controller.js
    services.controller.js
    appointments.controller.js
    work-orders.controller.js
    quotes.controller.js
    payments.controller.js
    inventory.controller.js
    suppliers.controller.js
    purchases.controller.js
    reports.controller.js
    ratings.controller.js

  services/
    auth.service.js
    users.service.js
    customers.service.js
    vehicles.service.js
    services.service.js
    appointments.service.js
    work-orders.service.js
    quotes.service.js
    payments.service.js
    inventory.service.js
    suppliers.service.js
    purchases.service.js
    reports.service.js
    ratings.service.js

  models/
    User.js
    Role.js
    Customer.js
    Vehicle.js
    VehicleBrand.js
    VehicleType.js
    Service.js
    ServiceCategory.js
    Appointment.js
    AppointmentService.js
    WorkOrder.js
    WorkOrderItem.js
    Quote.js
    QuoteItem.js
    Payment.js
    PaymentMethod.js
    Product.js
    Supplier.js
    PurchaseOrder.js
    PurchaseOrderItem.js
    Rating.js

  middleware/
    auth.middleware.js
    validation.middleware.js
    error.middleware.js
    cors.middleware.js

  routes/
    index.js
    auth.routes.js
    users.routes.js
    customers.routes.js
    vehicles.routes.js
    services.routes.js
    appointments.routes.js
    work-orders.routes.js
    quotes.routes.js
    payments.routes.js
    inventory.routes.js
    suppliers.routes.js
    purchases.routes.js
    reports.routes.js
    ratings.routes.js

  utils/
    response.util.js
    pagination.util.js
    validation.util.js
    logger.util.js

  database/
    connection.js
    migrations/
    seeders/
```

### 3.1 Responsabilidades por capa (reglas)
- **Controller**:
  - Manejo de requests y responses HTTP
  - Validación de inputs con middleware
  - Enviar datos al service layer
- **Service**:
  - Contener la lógica de negocio principal
  - Procesamiento y transformación de datos
  - Coordinar múltiples repositories si es necesario
- **Repository**:
  - Consultas directas a la base de datos
  - Abstracción del acceso a datos
  - Manejo de transacciones si aplica
- **Infrastructure**:
  - Configuración de la app
  - Conexión a servicios externos
  - Utilidades compartidas

### 3.2 Flujo completo de una request HTTP
1. Request entra al servidor.
2. Middleware de parsing (body-parser, CORS).
3. Middleware de autenticación (JWT).
4. Middleware de validación de inputs.
5. Controller procesa el request.
6. Service ejecuta la lógica de negocio.
7. Repository ejecuta la consulta a DB.
8. Response se envía al cliente.
9. Middleware de error maneja excepciones.

---

## 4) Base de datos y conexión

### 4.1 Tecnología
- DB: **MySQL** (manteniendo compatibilidad)
- ORM: **Sequelize** (manteniendo compatibilidad)

### 4.2 Conexión a la base de datos (desde cero)

#### 4.2.1 Requisitos
- MySQL accesible (local o remoto).
- Variable `DATABASE_URL` configurada.

Formato recomendado de `DATABASE_URL`:

```text
mysql://USER:PASSWORD@HOST:PORT/DBNAME
```

#### 4.2.2 Flujo recomendado (Sequelize)

1. Instalar dependencias del backend (en el proyecto del servidor).
2. Crear y aplicar migraciones en desarrollo:

```text
npx sequelize-cli db:migrate
```

3. Aplicar migraciones en entornos remotos (staging/producción):

```text
npx sequelize-cli db:migrate
```

4. Verificar conexión:

```text
npx sequelize-cli db:migrate:status
```

#### 4.2.3 Buenas prácticas
- No hardcodear credenciales en el repositorio.
- En producción usar un usuario de DB con permisos mínimos.
- Siempre usar migraciones versionadas.

#### 4.2.4 Conectar a base de datos existente
**Usar la misma base de datos actual. No crear una nueva ni migrar datos.**

Si ya tienes una base de datos con tablas (la actual de Icon Medellín), sigue estos pasos para que el nuevo backend la use:

1. **Configura `DATABASE_URL`** apuntando a esa base de datos existente.
2. **Usa los modelos Sequelize existentes** o genera nuevos modelos basados en las tablas.
3. **Revisa y ajusta los modelos** si es necesario (relaciones, validaciones, etc.).
4. **Valida la conexión**:
   ```text
   npx sequelize-cli db:migrate:status
   ```
   o simplemente inicia el backend y verifica que no haya errores al conectar.

Importante:
- Si vas a **modificar tablas** o crear nuevas, usa migraciones (`sequelize-cli db:migrate`).
- Si solo quieres **leer las tablas existentes** sin cambios, el flujo anterior es suficiente.

### 4.3 Variables de entorno
Variables mínimas:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL_SECONDS` (ej. 900)
- `JWT_REFRESH_TTL_SECONDS` (ej. 2592000)
- `REDIS_URL`
- `CORS_ORIGINS` (CSV)
- `PORT`
- `NODE_ENV`
- `LOG_LEVEL`
- `PAYMENTS_PROVIDER` (STRIPE/MERCADOPAGO/etc)
- `PAYMENTS_SECRET_KEY`
- `PAYMENTS_WEBHOOK_SECRET`

### 4.4 Migraciones
- Todas las migraciones deben vivir en `migrations/` y versionarse.
- Regla: **no modificar** migraciones ya aplicadas en producción.
- Usar `sequelize-cli` para gestionar migraciones.

### 4.5 Repositorios (patrón)
- Definir modelos Sequelize: `User`, `Product`, `Order`, etc.
- Implementar métodos de consulta en los modelos o en archivos de repository separados.
- Usar scopes de Sequelize para consultas comunes.

### 4.6 Pooling y performance
- Sequelize maneja el pool de conexiones internamente.
- Configurar pool size según necesidades.
- Evitar N+1: usar `include` de Sequelize con control.
- Paginación obligatoria en listados.

---

## 5) Convenciones de API

### 5.1 Respuesta estándar (para React)
Éxito:

```json
{
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-01-01T00:00:00.000Z"
  }
}
```

Error:

```json
{
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "Mensaje legible",
    "details": {}
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-01-01T00:00:00.000Z"
  }
}
```

### 5.2 Paginación
- `page` (>=1)
- `pageSize` (1..100)
- `sort` ejemplo: `createdAt:desc`

Meta de paginación:

```json
{
  "page": 1,
  "pageSize": 20,
  "total": 123,
  "totalPages": 7
}
```

### 5.3 Autenticación
Header:

- `Authorization: Bearer <accessToken>`

Roles sugeridos:
- `CUSTOMER`
- `SELLER`
- `ADMIN`

### 5.4 Códigos HTTP estándar
- `200` OK
- `201` Created
- `204` No Content
- `400` Validation error
- `401` Unauthorized
- `403` Forbidden
- `404` Not found
- `409` Conflict
- `422` Unprocessable Entity
- `429` Too Many Requests
- `500` Unexpected

### 5.5 Headers HTTP (qué se envía y qué se recibe)

#### 5.5.1 Headers mínimos en requests JSON
- `Content-Type: application/json`
- `Accept: application/json`

#### 5.5.2 Headers de autenticación
- `Authorization: Bearer <accessToken>`

Aplica a todos los endpoints marcados como **Auth: Sí**.

#### 5.5.3 Headers recomendados de trazabilidad
- `X-Request-Id: <uuid>` (opcional si el backend lo genera)

El backend debe:
- Generar un `requestId` si no llega.
- Devolverlo en respuesta.

#### 5.5.4 Headers en responses
- `Content-Type: application/json; charset=utf-8`
- `X-Request-Id: <uuid>`

#### 5.5.5 Headers especiales por caso
- **Webhooks de pagos**: el proveedor suele enviar un header de firma (ej. `Stripe-Signature`). El endpoint `/payments/webhook` debe validar esa firma con `PAYMENTS_WEBHOOK_SECRET`.

---

## 6) Catálogo de endpoints (detallado)

> Todos los endpoints devuelven respuesta estándar con `data/meta` o `error/meta`.

### 6.1 Auth

#### POST `/auth/register`
- **Auth**: No
- **Descripción**: Registra un usuario del sistema. Recomendado: este endpoint puede quedar restringido a `ADMIN` en producción si prefieres que el alta de empleados sea controlada.
- **Body**:
```json
{
  "email": "user@mail.com",
  "password": "StrongPass!123",
  "fullName": "Juan Pérez",
  "phone": "+57..."
}
```
- **Validaciones**:
  - email válido y único
  - password >= 8 con complejidad
  - fullName requerido
- **Reglas de negocio**:
  - hash de password (Argon2 recomendado)
  - status inicial `ACTIVE` o `PENDING_EMAIL_VERIFICATION`
- **Errores**:
  - `409 EMAIL_ALREADY_EXISTS`
- **Respuesta 201**:
```json
{
  "data": {
    "userId": "uuid",
    "email": "user@mail.com",
    "role": "ADMIN"
  },
  "meta": {}
}
```
- **DB**: `users` insert

#### POST `/auth/login`
- **Auth**: No
- **Descripción**: Autentica y retorna tokens.
- **Body**:
```json
{ "email": "user@mail.com", "password": "StrongPass!123" }
```
- **Validaciones**: requeridos
- **Reglas**:
  - comparar hash
  - registrar `lastLoginAt`
- **Errores**:
  - `401 AUTH_INVALID_CREDENTIALS`
  - `403 USER_DISABLED`
- **Respuesta 200**:
```json
{
  "data": {
    "accessToken": "jwt",
    "refreshToken": "jwt",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "email": "user@mail.com",
      "role": "CUSTOMER"
    }
  },
  "meta": {}
}
```
- **DB**: `users` select, `sessions` insert

#### POST `/auth/refresh`
- **Auth**: No (usa refresh)
- **Body**:
```json
{ "refreshToken": "jwt" }
```
- **Reglas**:
  - rotación de refresh
  - revocar anterior
- **Errores**:
  - `401 AUTH_REFRESH_INVALID`
- **DB**: `sessions` select/update

#### POST `/auth/logout`
- **Auth**: Sí
- **Body**:
```json
{ "refreshToken": "jwt" }
```
- **Respuesta**: `204`
- **DB**: `sessions` revoke

---

### 6.2 Usuarios / Perfil

#### GET `/me`
- **Auth**: Sí
- **Descripción**: perfil del usuario autenticado.
- **Errores**: `401`
- **DB**: `users` select

#### PATCH `/me`
- **Auth**: Sí
- **Body**:
```json
{ "fullName": "Nuevo Nombre", "phone": "+57..." }
```
- **Validaciones**:
  - formatos y longitudes
- **Errores**:
  - `422 INVALID_PHONE`
- **DB**: `users` update

---

### 6.3 Roles y permisos

#### GET `/roles`
- **Auth**: Sí (`ADMIN`)
- **Descripción**: lista roles existentes.
- **DB**: `roles` select

#### POST `/roles`
- **Auth**: Sí (`ADMIN`)
- **Descripción**: crea rol.
- **Body**:
```json
{ "name": "RECEPCION", "description": "Agenda y atención al cliente" }
```
- **Validaciones**: name único
- **DB**: `roles` insert

#### PUT `/roles/:roleId/permissions`
- **Auth**: Sí (`ADMIN`)
- **Descripción**: asigna permisos a un rol.
- **Body**:
```json
{ "permissions": ["APPOINTMENT_CREATE", "APPOINTMENT_UPDATE", "CUSTOMER_READ"] }
```
- **DB**: `role_permissions` replace

---

### 6.4 Usuarios del sistema (empleados/admin)

#### POST `/users`
- **Auth**: Sí (`ADMIN`)
- **Descripción**: crea usuario empleado/admin.
- **Body**:
```json
{
  "email": "empleado@mail.com",
  "fullName": "Empleado",
  "phone": "+57...",
  "roleId": "uuid",
  "password": "StrongPass!123"
}
```
- **Validaciones**: email único, roleId existe
- **DB**: `users` insert

#### GET `/users`
- **Auth**: Sí (`ADMIN`)
- **Query**: `q`, `roleId`, paginación
- **DB**: `users` select

#### PATCH `/users/:userId`
- **Auth**: Sí (`ADMIN`)
- **Descripción**: actualiza datos y rol.
- **DB**: `users` update

---

### 6.5 Clientes

#### POST `/customers`
- **Auth**: Sí
- **Descripción**: registra cliente.
- **Body**:
```json
{
  "documentType": "CC",
  "documentNumber": "123456",
  "fullName": "Cliente",
  "email": "cliente@mail.com",
  "phone": "+57..."
}
```
- **Validaciones**: documento o email único (según política)
- **DB**: `customers` insert

#### GET `/customers`
- **Auth**: Sí
- **Query**: `q`, paginación
- **DB**: `customers` select

#### GET `/customers/:customerId`
- **Auth**: Sí
- **DB**: `customers` select

---

### 6.6 Vehículos

#### GET `/vehicle-brands`
- **Auth**: Sí
- **DB**: `vehicle_brands` select

#### GET `/vehicle-types`
- **Auth**: Sí
- **DB**: `vehicle_types` select

#### POST `/vehicles`
- **Auth**: Sí
- **Descripción**: crea vehículo asociado a cliente.
- **Body**:
```json
{
  "customerId": "uuid",
  "brandId": "uuid",
  "typeId": "uuid",
  "plate": "ABC123",
  "model": "2020",
  "color": "Negro"
}
```
- **Validaciones**: plate única
- **DB**: `vehicles` insert

#### GET `/vehicles`
- **Auth**: Sí
- **Query**: `customerId`, `plate`, paginación
- **DB**: `vehicles` select

---

### 6.7 Servicios

#### POST `/service-categories`
- **Auth**: Sí (`ADMIN`)
- **Descripción**: crea categoría.
- **Body**:
```json
{ "name": "Tratamiento cerámico", "active": true }
```
- **DB**: `service_categories` insert

#### GET `/service-categories`
- **Auth**: Sí
- **DB**: `service_categories` select

#### POST `/services`
- **Auth**: Sí (`ADMIN`)
- **Descripción**: crea servicio.
- **Body**:
```json
{
  "categoryId": "uuid",
  "name": "Lavado premium",
  "estimatedMinutes": 60,
  "basePrice": 80000,
  "active": true
}
```
- **Validaciones**: categoryId existe, precio > 0
- **DB**: `services` insert

#### GET `/services`
- **Auth**: Sí
- **Query**: `categoryId`, `q`, paginación
- **DB**: `services` select

---

### 6.8 Citas (Agendamiento)

#### POST `/appointments`
- **Auth**: Sí
- **Descripción**: agenda una cita para un cliente/vehículo con uno o más servicios.
- **Body**:
```json
{
  "customerId": "uuid",
  "vehicleId": "uuid",
  "startsAt": "2026-02-14T15:00:00.000Z",
  "employeeId": "uuid",
  "services": [
    { "serviceId": "uuid", "notes": "Enfoque en interior" }
  ],
  "notes": "Cliente solicita prioridad"
}
```
- **Validaciones**:
  - startsAt futuro
  - employeeId existe
  - sin solapamiento de agenda (según política)
- **Reglas de negocio**:
  - calcular `estimatedEndAt` según servicios
  - estado inicial `SCHEDULED`
- **Errores**:
  - `409 EMPLOYEE_NOT_AVAILABLE`
- **DB**: `appointments`, `appointment_services`

#### GET `/appointments`
- **Auth**: Sí
- **Query**: `from`, `to`, `employeeId`, `status`, paginación
- **DB**: `appointments` select

#### PATCH `/appointments/:appointmentId`
- **Auth**: Sí
- **Descripción**: reprograma o cambia estado.
- **Body** (ejemplo):
```json
{ "startsAt": "2026-02-14T16:00:00.000Z", "employeeId": "uuid" }
```
- **Errores**: `409 EMPLOYEE_NOT_AVAILABLE`

---

### 6.9 Órdenes de servicio (Ejecución)

#### POST `/work-orders`
- **Auth**: Sí
- **Descripción**: crea orden de servicio desde una cita o manual.
- **Body**:
```json
{
  "appointmentId": "uuid",
  "notes": "Revisar rayones",
  "customizations": [
    { "label": "Protección extra", "price": 20000 }
  ]
}
```
- **Reglas**:
  - estado inicial `OPEN`
  - total = suma servicios + personalizaciones
- **DB**: `work_orders`, `work_order_items`

#### PATCH `/work-orders/:workOrderId/status`
- **Auth**: Sí
- **Descripción**: cambia estado de la orden.
- **Body**:
```json
{ "status": "IN_PROGRESS" }
```
- **Reglas**: validar transición de estados

#### GET `/work-orders`
- **Auth**: Sí
- **Query**: `status`, `employeeId`, `customerId`, fechas, paginación

---

### 6.10 Cotizaciones

#### POST `/quotes`
- **Auth**: Sí
- **Descripción**: genera cotización por requerimientos.
- **Body**:
```json
{
  "customerId": "uuid",
  "vehicleId": "uuid",
  "items": [
    { "description": "Latonería", "quantity": 1, "unitPrice": 300000 }
  ],
  "notes": "Incluye materiales"
}
```
- **DB**: `quotes`, `quote_items`

#### GET `/quotes`
- **Auth**: Sí
- **Query**: `status`, fechas, paginación

---

### 6.11 Pagos y métodos de pago

#### GET `/payment-methods`
- **Auth**: Sí
- **Descripción**: lista métodos vigentes.
- **DB**: `payment_methods` select

#### POST `/payments`
- **Auth**: Sí
- **Descripción**: registra pago asociado a una orden de servicio.
- **Body**:
```json
{
  "workOrderId": "uuid",
  "paymentMethodId": "uuid",
  "amount": 150000,
  "paidAt": "2026-02-14T15:30:00.000Z",
  "reference": "REC-0001"
}
```
- **Reglas**:
  - amount > 0
  - no exceder saldo pendiente
- **Errores**:
  - `409 PAYMENT_EXCEEDS_BALANCE`
- **DB**: `payments` insert, `work_orders` update balance

---

### 6.12 Inventario (productos) y proveedores

#### POST `/products`
- **Auth**: Sí (`ADMIN`)
- **Descripción**: crea producto de inventario (insumos).
- **Body**:
```json
{ "name": "Shampoo PH neutro", "sku": "SH-001", "stock": 10, "unitCost": 25000 }
```
- **Validaciones**: sku único
- **DB**: `products` insert

#### PATCH `/products/:productId/stock`
- **Auth**: Sí (`ADMIN`)
- **Body**:
```json
{ "delta": 5, "reason": "PURCHASE" }
```
- **DB**: `products` update, `stock_movements` insert

#### POST `/suppliers`
- **Auth**: Sí (`ADMIN`)
- **Body**:
```json
{ "name": "Proveedor 1", "phone": "+57...", "email": "proveedor@mail.com" }
```
- **DB**: `suppliers` insert

---

### 6.13 Pedidos (compras)

#### POST `/purchase-orders`
- **Auth**: Sí (`ADMIN`)
- **Descripción**: registra pedido a proveedor.
- **Body**:
```json
{
  "supplierId": "uuid",
  "items": [
    { "productId": "uuid", "quantity": 5, "unitCost": 20000 }
  ],
  "expectedAt": "2026-02-20T00:00:00.000Z"
}
```
- **Reglas**:
  - estado inicial `CREATED`
- **DB**: `purchase_orders`, `purchase_order_items`

#### PATCH `/purchase-orders/:purchaseOrderId/status`
- **Auth**: Sí (`ADMIN`)
- **Body**:
```json
{ "status": "CONFIRMED" }
```
- **Reglas**:
  - al marcar `RECEIVED` incrementar stock

---

### 6.14 Evaluación del servicio (calificaciones)

#### POST `/ratings`
- **Auth**: Sí
- **Descripción**: registra calificación de una orden de servicio.
- **Body**:
```json
{ "workOrderId": "uuid", "score": 5, "comment": "Excelente" }
```
- **Validaciones**: score 1..5
- **DB**: `ratings` insert

#### GET `/ratings/summary`
- **Auth**: Sí (`ADMIN`)
- **Descripción**: resumen para gráficos (barras/tendencia).
- **Query**: `from`, `to`, `serviceId` opcional
- **DB**: agregaciones sobre `ratings`, `work_orders`, `appointments`

---

## 7) Reglas de negocio críticas

### 7.1 Reglas clave
- **Agendamiento**:
  - una cita no debe solaparse para el mismo empleado (según la política de agenda).
  - `startsAt` debe estar en el futuro al crear/reprogramar.
- **Órdenes de servicio**:
  - el total se calcula en backend (servicios + personalizaciones).
  - transiciones de estado controladas (no saltar de `OPEN` a `DELIVERED` sin pasar por estados intermedios).
- **Pagos**:
  - no permitir que un pago exceda el saldo pendiente.
  - registrar método de pago y referencia.
- **Inventario/Compras**:
  - stock se incrementa al recibir pedidos.
  - movimientos de stock siempre auditables.
- **Permisos**:
  - endpoints sensibles (roles, usuarios, inventario, compras) restringidos a `ADMIN`.

### 7.2 Estados recomendados

Estados de cita (`appointments.status`):
- `SCHEDULED`
- `CONFIRMED`
- `CANCELLED`
- `NO_SHOW`
- `COMPLETED`

Estados de orden de servicio (`work_orders.status`):
- `OPEN`
- `IN_PROGRESS`
- `WAITING_PARTS` (opcional)
- `DONE`
- `DELIVERED`
- `CANCELLED`

---

## 8) Seguridad

### 8.1 Autenticación
- Access token corto (10–20 min)
- Refresh token largo (7–30 días)
- Rotación de refresh tokens por sesión

### 8.2 Autorización
- Guard de JWT + guard de roles
- Policies por recurso (owner checks)

### 8.3 Hardening
- CORS restrictivo
- Helmet
- Rate limiting
- Body size limit
- Sanitización de inputs donde aplique

### 8.4 Manejo global de errores
- Un filtro global traduce errores a:
  - `error.code` estable
  - `error.message` legible
  - `error.details` opcional

---

## 9) Optimización y escalabilidad

- Paginación obligatoria.
- Índices en campos de búsqueda/filtro/orden.
- Redis para cache (catálogo) y rate-limit.
- Jobs/colas para:
  - emails
  - recordatorios de citas
  - generación de reportes PDF
  - procesamiento de imágenes (si aplica)
- Logging estructurado con `requestId`.

---

## 10) Integración con React (recomendaciones)

- Respuesta estándar `data/meta`.
- Errores estándar `error.code` para manejar UI.
- Contratos estables (DTOs versionados si cambia mucho).
- Paginación y filtros consistentes.

---

## 11) Despliegue en Clever Cloud (guía base)

### 11.1 Conectar repositorio desde GitHub
Puedes conectar Clever Cloud a un repositorio de GitHub.

Identificación proporcionada para tu setup:
- **Max-RA0**
- **Brayanycesar2006**

Importante:
- No guardar **contraseñas**, **tokens** o **PAT** en este README ni en el repositorio.
- Para autenticar Git con GitHub usa uno de estos métodos:
  - **SSH** (recomendado).
  - **GitHub Personal Access Token (PAT)** como contraseña, guardado en el gestor de credenciales del sistema o configurado como secreto del proveedor.

### 11.2 Variables de entorno en Clever Cloud
Configura en Clever Cloud (Environment Variables) como mínimo:

- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `REDIS_URL` (si aplica)
- `CORS_ORIGINS`

Opcionales (solo si integras pasarela de pagos con webhooks):

- `PAYMENTS_PROVIDER`
- `PAYMENTS_SECRET_KEY`
- `PAYMENTS_WEBHOOK_SECRET`

### 11.3 Migraciones en despliegue
En producción usa:

```text
npx sequelize-cli db:migrate
```

Y evita `npx sequelize-cli db:migrate --undo` en producción a menos que sea necesario.

### 11.4 Checklist de producción
- CORS restringido a dominios del frontend.
- Rate limiting habilitado.
- Logs estructurados (JSON) habilitados.
- Webhook secret configurado.

---

## 12) Decisiones adoptadas (baseline compatible con el frontend existente)

Como indicas que el frontend ya estaba hecho y funcionaba con el backend anterior, se adopta el siguiente baseline para reconstruir un backend **mejor organizado**, pero **compatible** con el comportamiento esperado. Estas decisiones se pueden ajustar luego, pero sirven como configuración inicial.

1. **Política de agenda**
   - No se permiten solapes para el mismo `employeeId`.
   - Se define una tolerancia de **0 minutos** (si se requiere buffer, se podrá configurar luego).
   - Regla de validación: al crear o reprogramar una cita se valida que el rango `[startsAt, estimatedEndAt)` no choque con otra cita `SCHEDULED` o `CONFIRMED` del mismo empleado.

2. **Confirmación de citas**
   - La cita se crea como `SCHEDULED`.
   - Se permite pasar a `CONFIRMED` manualmente (recepción/admin).
   - Si el frontend ya asumía “confirmada al crear”, se puede configurar para que el endpoint cree directamente en `CONFIRMED` sin cambiar el contrato (solo configuración de negocio).

3. **Flujo de orden de servicio (work order)**
   - Estados: `OPEN` → `IN_PROGRESS` → `DONE` → `DELIVERED`.
   - Estados opcionales: `WAITING_PARTS`, `CANCELLED`.
   - Permisos recomendados:
     - `ADMIN`: cualquier transición.
     - Empleado asignado: `OPEN`→`IN_PROGRESS`→`DONE`.
     - Recepción: `DONE`→`DELIVERED`.

4. **Pagos**
   - Se permiten **pagos parciales** y **anticipos**.
   - Se calcula `balance = total - sum(payments.amount)`.
   - Regla: no permitir `amount` que exceda `balance`.
   - Consecutivo/recibo:
     - Se guarda un `reference` (string) y puede ser generado por el sistema (ej. `REC-000001`) si el frontend no lo envía.

5. **Inventario**
   - Control de stock por producto (insumo) con movimientos (`stock_movements`).
   - Costeo inicial: **último costo** (simplifica y es compatible con operación pequeña).
   - Consumo por servicio:
     - Baseline: **no se descuenta automáticamente** inventario por ejecución del servicio.
     - Mejorable: añadir “recetas/consumos por servicio” más adelante.

6. **Reportes PDF (mínimos obligatorios)**
   - Categorías de servicios más solicitadas + rendimiento mensual.
   - Ingresos por servicio en rango de fechas.
   - Reporte de pedidos/órdenes de compra confirmados/recibidos.
   - Resumen de calificaciones (promedio por servicio/periodo).

7. **App móvil (solo consulta)**
   - Módulos visibles:
     - Citas (calendario + filtros por fecha/estado/empleado).
     - Pedidos del administrador (purchase orders).
     - Productos disponibles (inventario y stock).
     - Usuarios (consulta).
     - Servicios y categorías (consulta).
     - Cotizaciones (consulta).
     - Proveedores (consulta).
   - Sin edición desde móvil (solo lectura), como fue definido en el alcance.

---

## 13) Compatibilidad con backend/frontend/DB existente

**IMPORTANTE**: Como el nuevo backend se desarrollará en una carpeta separada sin acceso al código actual, esta sección documenta **TODO** lo necesario para conectarse correctamente al frontend y base de datos existente.

### 13.1 Stack real del backend actual

- **Framework**: Express.js
- **ORM**: Sequelize
- **Base de datos**: MySQL (no PostgreSQL)
- **Autenticación**: JWT (Bearer token)
- **CORS**: habilitado para todos los orígenes (ajustar en producción)
- **Body limit**: 2MB

### 13.2 Base URL y estructura de rutas

**Base URL actual**: `https://tunik-api.onrender.com/api`

**Rutas API completas** (el frontend las consume exactamente así):

```
GET  /
GET  /health

# Auth
POST /api/auth/login
POST /api/auth/register
POST /api/auth/forgot-password
POST /api/auth/reset-password

# Usuarios y Roles
GET    /api/usuarios
GET    /api/usuarios/:numero_documento
POST   /api/usuarios
PUT    /api/usuarios/:numero_documento
DELETE /api/usuarios/:numero_documento

GET    /api/roles
GET    /api/roles/:idroles
POST   /api/roles
PUT    /api/roles/:idroles
DELETE /api/roles/:idroles

# Dashboard
GET /api/dashboard/stats

# Vehículos
GET    /api/tipovehiculos
POST   /api/tipovehiculos
PUT    /api/tipovehiculos/:idtipovehiculos
DELETE /api/tipovehiculos/:idtipovehiculos

GET    /api/vehiculos
GET    /api/vehiculos/:placa
POST   /api/vehiculos
PUT    /api/vehiculos/:placa
DELETE /api/vehiculos/:placa

GET    /api/marcas
POST   /api/marcas
PUT    /api/marcas/:idmarca
DELETE /api/marcas/:idmarca

# Servicios
GET    /api/categoriaservicios
POST   /api/categoriaservicios
PUT    /api/categoriaservicios/:idcategoriaservicios
DELETE /api/categoriaservicios/:idcategoriaservicios

GET    /api/servicios
GET    /api/servicios/:idservicios
POST   /api/servicios
PUT    /api/servicios/:idservicios
DELETE /api/servicios/:idservicios

# Agenda de Citas
GET    /api/agendacitas
GET    /api/agendacitas/:idagendacitas
POST   /api/agendacitas
PUT    /api/agendacitas/:idagendacitas
DELETE /api/agendacitas/:idagendacitas

GET    /api/detalleagendacitas
GET    /api/detalleagendacitas/test
GET    /api/detalleagendacitas/agenda/:idagendacitas
GET    /api/detalleagendacitas/agenda/:idagendacitas/total
POST   /api/detalleagendacitas
PUT    /api/detalleagendacitas/agenda/:idagendacitas/servicio/:idservicios
DELETE /api/detalleagendacitas/agenda/:idagendacitas/servicio/:idservicios

# Cotizaciones
GET    /api/cotizaciones
GET    /api/cotizaciones/:idcotizaciones
POST   /api/cotizaciones
PUT    /api/cotizaciones/:idcotizaciones
DELETE /api/cotizaciones/:idcotizaciones

GET    /api/detallecotizaciones
GET    /api/detallecotizaciones/cotizacion/:idcotizaciones
POST   /api/detallecotizaciones
PUT    /api/detallecotizaciones/:idcotizaciones/:idservicios
DELETE /api/detallecotizaciones/:idcotizaciones/:idservicios

# Ventas
GET    /api/ventas
GET    /api/ventas/:idventas
POST   /api/ventas
PUT    /api/ventas/:idventas
DELETE /api/ventas/:idventas

GET    /api/detalleventas
GET    /api/detalleventas/venta/:idventas
POST   /api/detalleventas
DELETE /api/detalleventas/:iddetalleventas

GET    /api/pagosventas
GET    /api/pagosventas/venta/:idventas
POST   /api/pagosventas
DELETE /api/pagosventas/:idpagoventas

# Métodos de Pago
GET    /api/metodospago
POST   /api/metodospago
PUT    /api/metodospago/:idmpago
DELETE /api/metodospago/:idmpago

# Compras
GET    /api/pedidos
POST   /api/pedidos
PUT    /api/pedidos/:idpedidos
DELETE /api/pedidos/:idpedidos

GET    /api/proveedores
POST   /api/proveedores
PUT    /api/proveedores/:idproveedor
DELETE /api/proveedores/:idproveedor

GET    /api/productos
POST   /api/productos
PUT    /api/productos/:idproductos
DELETE /api/productos/:idproductos

# Evaluaciones
GET    /api/evaluaciones
GET    /api/evaluaciones/:idevaluacionservicios
POST   /api/evaluaciones
PUT    /api/evaluaciones/:idevaluacionservicios
DELETE /api/evaluaciones/:idevaluacionservicios
```

### 13.3 Estructura de tablas MySQL (nombres exactos y campos)

#### Tabla: `usuarios`
```sql
CREATE TABLE usuarios (
  numero_documento VARCHAR(20) PRIMARY KEY,
  tipo_documento VARCHAR(20) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL,
  contrasena VARCHAR(100) NOT NULL,
  idroles INT NOT NULL,
  reset_token VARCHAR(255),
  token_expires DATETIME,
  FOREIGN KEY (idroles) REFERENCES roles(idroles)
);
```

#### Tabla: `roles`
```sql
CREATE TABLE roles (
  idroles INT AUTO_INCREMENT PRIMARY KEY,
  nombrerol VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255)
);
```

#### Tabla: `vehiculos`
```sql
CREATE TABLE vehiculos (
  placa VARCHAR(10) PRIMARY KEY,
  modelo VARCHAR(50) NOT NULL,
  color VARCHAR(30) NOT NULL,
  idtipovehiculos INT NOT NULL,
  idmarca INT NOT NULL,
  numero_documento VARCHAR(20) NOT NULL,
  FOREIGN KEY (idtipovehiculos) REFERENCES tipovehiculos(idtipovehiculos),
  FOREIGN KEY (idmarca) REFERENCES marcas(idmarca),
  FOREIGN KEY (numero_documento) REFERENCES usuarios(numero_documento)
);
```

#### Tabla: `tipovehiculos`
```sql
CREATE TABLE tipovehiculos (
  idtipovehiculos INT AUTO_INCREMENT PRIMARY KEY,
  nombretipovehiculo VARCHAR(50) NOT NULL
);
```

#### Tabla: `marcas`
```sql
CREATE TABLE marcas (
  idmarca INT AUTO_INCREMENT PRIMARY KEY,
  nombremarca VARCHAR(50) NOT NULL
);
```

#### Tabla: `servicios`
```sql
CREATE TABLE servicios (
  idservicios INT AUTO_INCREMENT PRIMARY KEY,
  nombreservicios VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  idcategoriaservicios INT NOT NULL,
  preciounitario DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (idcategoriaservicios) REFERENCES categoriaservicios(idcategoriaservicios)
);
```

#### Tabla: `categoriaservicios`
```sql
CREATE TABLE categoriaservicios (
  idcategoriaservicios INT AUTO_INCREMENT PRIMARY KEY,
  nombrecategoriaservicio VARCHAR(100) NOT NULL
);
```

#### Tabla: `agendacitas`
```sql
CREATE TABLE agendacitas (
  idagendacitas INT AUTO_INCREMENT PRIMARY KEY,
  placa VARCHAR(10) NOT NULL,
  fecha DATETIME NOT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
  FOREIGN KEY (placa) REFERENCES vehiculos(placa)
);
```

#### Tabla: `detalleagendacitas`
```sql
CREATE TABLE detalleagendacitas (
  iddetalleagenda INT AUTO_INCREMENT PRIMARY KEY,
  idagendacitas INT NOT NULL,
  idservicios INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (idagendacitas) REFERENCES agendacitas(idagendacitas) ON DELETE CASCADE,
  FOREIGN KEY (idservicios) REFERENCES servicios(idservicios)
);
```

#### Tabla: `cotizaciones`
```sql
CREATE TABLE cotizaciones (
  idcotizaciones INT AUTO_INCREMENT PRIMARY KEY,
  placa VARCHAR(10) NOT NULL,
  idmpago INT NOT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
  fecha DATE NOT NULL,
  idagendacitas INT,
  FOREIGN KEY (placa) REFERENCES vehiculos(placa),
  FOREIGN KEY (idmpago) REFERENCES metodospago(idmpago),
  FOREIGN KEY (idagendacitas) REFERENCES agendacitas(idagendacitas)
);
```

#### Tabla: `detallecotizaciones`
```sql
CREATE TABLE detallecotizaciones (
  idcotizaciones INT NOT NULL,
  idservicios INT NOT NULL,
  preciochange DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (idcotizaciones, idservicios),
  FOREIGN KEY (idcotizaciones) REFERENCES cotizaciones(idcotizaciones) ON DELETE CASCADE,
  FOREIGN KEY (idservicios) REFERENCES servicios(idservicios)
);
```

#### Tabla: `ventas`
```sql
CREATE TABLE ventas (
  idventas INT AUTO_INCREMENT PRIMARY KEY,
  origen VARCHAR(20) NOT NULL,
  idorigen INT NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  total DECIMAL(12,2) NOT NULL DEFAULT 0
);
```

#### Tabla: `detalleventas`
```sql
CREATE TABLE detalleventas (
  iddetalleventas INT AUTO_INCREMENT PRIMARY KEY,
  idventas INT NOT NULL,
  idservicios INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (idventas) REFERENCES ventas(idventas) ON DELETE CASCADE,
  FOREIGN KEY (idservicios) REFERENCES servicios(idservicios)
);
```

#### Tabla: `pagosventas`
```sql
CREATE TABLE pagosventas (
  idpagoventas INT AUTO_INCREMENT PRIMARY KEY,
  idventas INT NOT NULL,
  idmpago INT NOT NULL,
  valor DECIMAL(12,2) NOT NULL DEFAULT 0,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  comprobante VARCHAR(255),
  FOREIGN KEY (idventas) REFERENCES ventas(idventas) ON DELETE CASCADE,
  FOREIGN KEY (idmpago) REFERENCES metodospago(idmpago)
);
```

#### Tabla: `metodospago`
```sql
CREATE TABLE metodospago (
  idmpago INT AUTO_INCREMENT PRIMARY KEY,
  nombrempago VARCHAR(50) NOT NULL
);
```

#### Tabla: `productos`
```sql
CREATE TABLE productos (
  idproductos INT AUTO_INCREMENT PRIMARY KEY,
  nombreproducto VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255),
  stock INT NOT NULL DEFAULT 0,
  precio DECIMAL(10,2) NOT NULL
);
```

#### Tabla: `proveedores`
```sql
CREATE TABLE proveedores (
  idproveedor INT AUTO_INCREMENT PRIMARY KEY,
  nombreproveedor VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100)
);
```

#### Tabla: `pedidos`
```sql
CREATE TABLE pedidos (
  idpedidos INT AUTO_INCREMENT PRIMARY KEY,
  idproveedor INT NOT NULL,
  idproductos INT NOT NULL,
  cantidad INT NOT NULL,
  fecha DATE NOT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
  FOREIGN KEY (idproveedor) REFERENCES proveedores(idproveedor),
  FOREIGN KEY (idproductos) REFERENCES productos(idproductos)
);
```

#### Tabla: `evaluacionservicios`
```sql
CREATE TABLE evaluacionservicios (
  idevaluacionservicios INT AUTO_INCREMENT PRIMARY KEY,
  idventas INT NOT NULL,
  calificacion INT NOT NULL,
  comentario TEXT,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idventas) REFERENCES ventas(idventas)
);
```

### 13.4 Formato de request/response que el frontend espera

#### Autenticación (headers)
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Respuesta exitosa (estándar)
```json
{
  "ok": true,
  "data": { },
  "msg": "Operación exitosa"
}
```

O simplemente el array/objeto directo:
```json
[
  { "id": 1, "nombre": "..." }
]
```

#### Respuesta de error (estándar)
```json
{
  "ok": false,
  "msg": "Mensaje de error",
  "error": "Detalle técnico opcional"
}
```

#### Paginación (si aplica)
El frontend NO usa paginación actualmente en la mayoría de endpoints. Retorna arrays completos.

### 13.5 Convenciones críticas

1. **IDs como primary keys**:
   - Usuarios: `numero_documento` (VARCHAR, no INT)
   - Vehículos: `placa` (VARCHAR)
   - Resto: auto-increment INT

2. **Nombres de campos**:
   - Snake_case en DB: `numero_documento`, `precio_unitario`
   - Sequelize mapea automáticamente a camelCase en JSON (el frontend espera ambos)

3. **Estados**:
   - Citas: `"Pendiente"`, `"Confirmada"`, `"Cancelada"`
   - Ventas: `"pendiente"`, `"pagada"`, `"anulada"`
   - Pedidos: `"Pendiente"`, `"Confirmado"`, `"Recibido"`

4. **Relaciones (includes)**:
   - El frontend espera objetos anidados con `as` de Sequelize:
     - `vehiculo.usuario`, `vehiculo.tipo`, `vehiculo.marca`
     - `agendacita.vehiculo`, `agendacita.detalles`
     - `cotizacion.vehiculo`, `cotizacion.metodoPago`, `cotizacion.detalles`

5. **Fechas**:
   - DB almacena en UTC o local según configuración MySQL
   - Frontend parsea con lógica custom (ver `parseServerToLocalDate` en agendaCitas.jsx)
   - Formato esperado: `YYYY-MM-DD HH:mm:ss` o ISO con timezone

### 13.6 Migración con Sequelize/MySQL (manteniendo compatibilidad)

Como el nuevo backend usará el mismo stack tecnológico:

1. **Reutilizar los modelos Sequelize existentes** o crear nuevos basados en las tablas.
2. **Mantener los mismos nombres de campos** y relaciones.
3. **Replicar las mismas validaciones** y métodos de los modelos.
4. **Mantener los mismos nombres de rutas** (`/api/agendacitas`, etc.).
5. **Mantener el formato de respuesta** (arrays/objetos directos o `{ok, data, msg}`).
6. **Probar con el frontend existente** antes de desplegar.

### 13.7 Checklist de compatibilidad para el nuevo backend

- [ ] Rutas API coinciden exactamente con las documentadas en 13.2
- [ ] Nombres de tablas y campos coinciden con 13.3
- [ ] Formato de respuesta compatible con 13.4
- [ ] Headers de autenticación (Bearer token) funcionan
- [ ] Relaciones (includes) retornan objetos anidados con los mismos alias
- [ ] Estados usan los mismos strings exactos
- [ ] CORS habilitado para el dominio del frontend
- [ ] Conexión a la misma base de datos MySQL (no crear nueva)
- [ ] Probado con frontend existente en local antes de deploy
