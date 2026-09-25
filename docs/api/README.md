# Referencia de la API

La API usa HTTP y JSON. La URL por defecto es `http://localhost:8080`; el puerto real sale de `SERVER_PORT`.

## Autenticación y acceso

- `GET /health` es público.
- `POST /api/auth/register` y `POST /api/auth/login` son públicos.
- El resto de las rutas bajo `/api/*`, incluido `GET /api/auth/me`, requiere `Authorization: Bearer <token>`.
- Un `OPTIONS` general pasa por CORS y responde `204` antes de la autenticación.

## Convenciones

- Las solicitudes con cuerpo usan `Content-Type: application/json`.
- Las listas vacías se serializan como `[]`.
- Las creaciones responden `201`; los borrados, `204` sin cuerpo.
- Los handlers responden errores con `{"error":"mensaje"}` cuando el error pasa por sus helpers. Las respuestas 404, 405 o redirects que genera directamente `net/http.ServeMux` pueden ser texto plano y no usar ese formato.
- CORS permite cualquier origen y los métodos `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- Los importes son enteros en pesos, sin centavos.
- Las respuestas de creación de clientes, motos, repuestos y órdenes incluyen el recurso creado, pero no siempre recargan todos los timestamps generados por MySQL. Para obtener el estado completo, hacé un GET al recurso.

## Índice

1. [Autenticación](autenticacion.md) — registro, login, JWT y errores de acceso.
2. [Clientes y motos](clientes-motos.md)
3. [Órdenes y repuestos de orden](ordenes.md)
4. [Inventario y alertas](inventario.md)
5. [Facturas y pagos](facturas.md)
6. [Errores](errores.md) — formato, códigos y mensajes.

## Ejemplo mínimo

Primero registrá una cuenta y conservá el token que devuelve el login:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"taller@motek.com","password":"secreto123"}'

curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"taller@motek.com","password":"secreto123"}'
```

Después reemplazá `<token>` por el valor recibido:

```bash
curl http://localhost:8080/api/clientes \
  -H 'Authorization: Bearer <token>'
```
