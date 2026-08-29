# Motek

Sistema para taller mecánico especializado en motocicletas.

## Tech Stack

- Go (`net/http` stdlib, bcrypt, JWT)
- MySQL

## Inicio rápido

1. Clonar el repositorio
2. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales de MySQL y JWT_SECRET
   ```
3. Crear la base de datos:
   ```sql
   CREATE DATABASE motek;
   ```
4. Compilar y ejecutar:
   ```bash
   cd backend
   go build . && ./motek
   ```
   El servidor inicia en `http://localhost:8080` (migraciones y conexión a MySQL se ejecutan al arrancar).

## Tests

```bash
cd backend
go test ./...
```

Requiere una base `motek_test` accesible con las mismas credenciales de `.env`. 41 tests (auth, clientes, motos, órdenes, inventario, facturación), `go vet` limpio.

## Endpoints

### Auth
- `POST /api/auth/register` - Crear usuario
- `POST /api/auth/login` - Login (retorna JWT)
- `GET /api/auth/me` - Usuario actual (requiere token)

### Clientes
- `GET /api/clientes` - Listar
- `POST /api/clientes` - Crear
- `GET /api/clientes/{id}` - Ver uno
- `PUT /api/clientes/{id}` - Editar
- `DELETE /api/clientes/{id}` - Eliminar

### Motos
- `GET /api/clientes/{id}/motos` - Motos de un cliente
- `POST /api/clientes/{id}/motos` - Agregar moto
- `GET /api/motos/{id}` - Ver una moto
- `PUT /api/motos/{id}` - Editar moto
- `DELETE /api/motos/{id}` - Eliminar moto

### Órdenes de trabajo
- `GET /api/ordenes` - Listar (?estado=recibido)
- `POST /api/ordenes` - Crear
- `GET /api/ordenes/{id}` - Ver una
- `PUT /api/ordenes/{id}` - Editar
- `PATCH /api/ordenes/{id}/estado` - Cambiar estado
- `DELETE /api/ordenes/{id}` - Eliminar

### Inventario
- `GET /api/repuestos` - Listar (?q=...&categoria=...&bajo_stock=true)
- `POST /api/repuestos` - Crear
- `GET /api/repuestos/{id}` - Ver uno
- `PUT /api/repuestos/{id}` - Editar
- `DELETE /api/repuestos/{id}` - Eliminar
- `GET /api/ordenes/{id}/repuestos` - Repuestos de una orden
- `POST /api/ordenes/{id}/repuestos` - Agregar repuesto a orden (auto-descuenta stock)
- `DELETE /api/ordenes/{id}/repuestos/{rid}` - Quitar repuesto
- `POST /api/repuestos/{id}/stock` - Ajustar stock
- `GET /api/alertas/stock` - Alertas de stock bajo

### Facturación
- `GET /api/facturas` - Listar (?estado=pendiente)
- `POST /api/facturas` - Crear desde orden
- `GET /api/facturas/{id}` - Ver una
- `PUT /api/facturas/{id}` - Editar
- `PATCH /api/facturas/{id}/cancelar` - Cancelar
- `GET /api/facturas/{id}/pagos` - Listar pagos
- `POST /api/facturas/{id}/pagos` - Registrar pago
- `DELETE /api/facturas/{id}/pagos/{pid}` - Anular pago

## Autenticación

Todos los endpoints (excepto login y register) requieren header:
```
Authorization: Bearer <token>
```
Logout es client-side: borrar el token (JWT stateless).

## Estructura del proyecto

```
.
├── backend/
│   ├── main.go                      # Entry point
│   ├── db.go                        # Conexión y migraciones
│   ├── models.go                    # Structs
│   ├── routes.go                    # Rutas HTTP
│   ├── middleware.go                # Auth y CORS
│   ├── token.go                     # JWT
│   ├── handlers.go                  # Handlers comunes
│   ├── handlers_auth.go             # Auth
│   ├── handlers_clientes.go         # Clientes CRUD
│   ├── handlers_motos.go            # Motos CRUD
│   ├── handlers_ordenes.go          # Órdenes
│   ├── handlers_inventario.go       # Inventario
│   └── handlers_facturacion.go      # Facturación
├── .env.example
├── .gitignore
└── README.md
```
