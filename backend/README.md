# Motek — Backend

API para taller mecánico (Go `net/http` + MySQL + JWT).

Documentación: [guía de desarrollo](../docs/desarrollo/README.md) ([arquitectura](../docs/desarrollo/arquitectura.md), [base de datos](../docs/desarrollo/base-de-datos.md), [reglas](../docs/desarrollo/reglas.md), [configuración](../docs/desarrollo/configuracion.md), [tests](../docs/desarrollo/tests.md)) y [referencia de la API](../docs/api/README.md).

## Inicio rápido

```bash
cp .env.example .env   # completar DB_* y JWT_SECRET
# CREATE DATABASE motek;  # debe coincidir con DB_NAME
go run ./cmd/motek     # http://localhost:8080
```

Migraciones (`CREATE TABLE IF NOT EXISTS` ×8) se ejecutan al arrancar. `JWT_SECRET` es requerido. Salud pública: `GET /health` → `200 {"status":"ok"}`.

## Tests

```bash
go test ./...
go vet ./...
```

Requieren MySQL + base de tests `motek_test` (o `TEST_DB_NAME`) con las credenciales de `.env`. Son route-level (`internal/api`) contra el router real con token.

## API

JWT HS256 24h (`Authorization: Bearer <token>`). Todo `/api/*` requiere token, salvo `POST /api/auth/register` y `POST /api/auth/login`. Logout es client-side (borrar token).

Endpoints, errores y ejemplos en la [referencia de la API](../docs/api/README.md). Convenciones: JSON, listas vacías → `[]`, crear → `201`, borrar → `204` sin body, errores → `{"error":"mensaje"}` en español.

## Estructura

```
backend/
├── cmd/motek/main.go          # wiring + graceful shutdown
├── internal/
│   ├── config/                # Config desde env
│   ├── store/                 # SQL por dominio + migrate + modelos
│   ├── auth/                  # JWT + bcrypt
│   └── api/                   # Server, rutas, middleware, handlers
├── .env.example
└── .gitignore
```
