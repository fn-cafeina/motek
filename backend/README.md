# Motek — Backend

API para taller mecánico (Go `net/http` + MySQL + JWT).

## Inicio rápido

```bash
cp .env.example .env   # completar DB_* y JWT_SECRET
# CREATE DATABASE motek;
go build . && ./motek  # http://localhost:8080
```

Migraciones se ejecutan al arrancar. `SERVER_PORT` en `.env` no se usa (hardcoded `8080` en `main.go`).

## Tests

```bash
go test ./...
go vet ./...
```

Requiere `motek_test` con credenciales de `.env`. 41 tests, `go vet` limpio.

## Autenticación

JWT HS256 24h (`JWT_SECRET` en `.env`). Header:

```
Authorization: Bearer <token>
```

Todos los endpoints bajo `/api/*` requieren token, excepto `POST /api/auth/register` y `POST /api/auth/login`. Logout es client-side (borrar token).

## Endpoints

### Auth
| Método | Ruta | Notas |
|---|---|---|
| POST | `/api/auth/register` | `{email, password}` → 201 `{id,email}`, 409 si existe |
| POST | `/api/auth/login` | `{email, password}` → 200 `{token}`, 401 si falla |
| GET | `/api/auth/me` | requiere token → 200 `User` |

### Clientes
`GET /api/clientes`, `POST /api/clientes` (`nombre!`), `GET/PUT/DELETE /api/clientes/{id}`

### Motos
`GET/POST /api/clientes/{id}/motos` (`marca!`), `GET/PUT/DELETE /api/motos/{id}`

### Órdenes
`GET /api/ordenes?estado=` (filtro), `POST /api/ordenes` (`cliente_id!`, `moto_id!`, `descripcion!`), `GET/PUT/DELETE /api/ordenes/{id}`, `PATCH /api/ordenes/{id}/estado` (`recibido|en_progreso|esperando_repuestos|terminado|entregado`)

### Inventario
`GET /api/repuestos?q=&categoria=&bajo_stock=true`, `POST /api/repuestos` (`codigo!` único), `GET/PUT/DELETE /api/repuestos/{id}`, `GET/POST/DELETE /api/ordenes/{id}/repuestos[/{rid}]` (transacción + ajuste stock), `POST /api/repuestos/{id}/stock` (delta), `GET /api/alertas/stock`

### Facturación
`GET /api/facturas?estado=`, `POST /api/facturas` (`orden_id!` → totales server-side), `GET/PUT /api/facturas/{id}`, `PATCH /api/facturas/{id}/cancelar`, `GET/POST/DELETE /api/facturas/{id}/pagos[/{pid}]` (estados `pendiente|parcial|pagada|cancelada`)

Errores: `{"error":"mensaje"}` en español. `DELETE` → `204`.

## Estructura

```
backend/
├── main.go, db.go, models.go, routes.go, middleware.go, token.go
├── handlers*.go
├── *_test.go
├── .env.example
└── .gitignore
```
