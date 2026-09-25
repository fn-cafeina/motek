# Motek — Backend

API HTTP en Go `net/http` para Motek. Usa MySQL, JWT HS256 y bcrypt.

Documentación relacionada: [guía de desarrollo](../docs/desarrollo/README.md) y [referencia de la API](../docs/api/README.md).

## Requisitos

- Go `1.26.5`.
- MySQL con una base creada previamente.
- Un `JWT_SECRET` para el proceso normal.

## Inicio rápido

```bash
mysql -u root -p -e "CREATE DATABASE motek;"
cp .env.example .env
```

Editá `.env` con las credenciales de MySQL y un secreto JWT. Después:

```bash
go run ./cmd/motek
```

El servidor escucha en `SERVER_PORT`, que por defecto es `8080`. `GET /health` es público y responde `200 {"status":"ok"}`.

El proceso carga `.env` con `godotenv`, abre la base configurada, ejecuta las ocho migraciones `CREATE TABLE IF NOT EXISTS`, configura timeouts HTTP y se apaga de forma controlada ante `SIGINT` o `SIGTERM`.

## Variables de entorno

`DB_HOST` y `DB_PORT` tienen defaults `127.0.0.1` y `3306`; `DB_USER`, `DB_PASSWORD` y `DB_NAME` no tienen defaults en el código. `JWT_SECRET` es obligatorio. `SERVER_PORT` tiene default `8080`.

## API

JWT se genera con HS256 y dura 24 horas. Todas las rutas bajo `/api/*` requieren `Authorization: Bearer <token>`, excepto `POST /api/auth/register` y `POST /api/auth/login`. `GET /api/auth/me` sí requiere token. CORS permite cualquier origen y los métodos `GET, POST, PUT, PATCH, DELETE, OPTIONS`; los preflight responden `204`.

No existe logout en el servidor: el cliente borra el token. Las listas vacías se serializan como `[]` y los handlers usan errores JSON `{"error":"mensaje"}`; las respuestas 404, 405 o redirects del `ServeMux` pueden tener otro formato.

Consultá [Referencia de la API](../docs/api/README.md) para las rutas, cuerpos, validaciones y errores.

## Tests

```bash
go test ./...
go vet ./...
```

La suite usa el router real y MySQL, no mocks ni SQLite. `TestMain` lee `backend/.env`, usa `TEST_DB_NAME` o `motek_test`, abre esa base y ejecuta migraciones. Los helpers ejecutan `DELETE` sobre las ocho tablas.

**No apuntes `TEST_DB_NAME` a una base de producción ni a datos que quieras conservar.** Los tests pueden modificar y limpiar el contenido de la base configurada.

## Estructura

```text
backend/
├── cmd/motek/main.go       # carga de configuración, wiring y servidor
├── internal/
│   ├── config/             # lectura del entorno y DSN
│   ├── auth/               # JWT y bcrypt
│   ├── api/                # router, middleware y handlers
│   └── store/              # modelos, SQL, errores y migraciones
├── .env.example
├── go.mod
└── go.sum
```
