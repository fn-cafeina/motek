# Referencia de la API

Base: `http://localhost:8080`. Todo bajo `/api/*` requiere token, salvo registro y login.

## Índice

1. [Autenticación](autenticacion.md) — registro, login, token JWT y errores 401.
2. [Clientes y motos](clientes-motos.md)
3. [Órdenes y repuestos de orden](ordenes.md)
4. [Inventario y alertas](inventario.md)
5. [Facturas y pagos](facturas.md)
6. [Errores](errores.md) — formato, códigos y mensajes.

## Convenciones

- Todo el contenido es JSON (`Content-Type: application/json`).
- Las listas vacías devuelven `[]`, nunca `null`.
- Crear devuelve `201` con el recurso; borrar devuelve `204` sin cuerpo.
- Los errores devuelven `{"error":"mensaje"}` en español (ver [Errores](errores.md)).
- Los montos son enteros en pesos, sin centavos.

## Ejemplo mínimo

```bash
TOKEN=$(curl -s http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"taller@motek.com","password":"secreto123"}' | cut -d'"' -f4)

curl http://localhost:8080/api/clientes \
  -H "Authorization: Bearer $TOKEN"
```