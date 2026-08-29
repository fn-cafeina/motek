# Convenciones HTTP y Validaciones

---

## 1. Códigos de respuesta

| Código | Uso |
|---|---|
| 200 | OK (GET, PUT exitoso) |
| 201 | Created (POST exitoso) |
| 204 | No Content (DELETE exitoso) |
| 400 | Bad Request (validación fallida) |
| 401 | Unauthorized (token inválido o ausente) |
| 404 | Not Found (recurso no existe) |
| 409 | Conflict (ej: email de usuario duplicado) |
| 500 | Internal Server Error |

---

## 2. Formato de errores

```json
{
  "error": "mensaje descriptivo"
}
```

---

## 3. Paginación (listas)

Query params: `?page=1&limit=20`

Respuesta:
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

---

## 4. Autenticación

- Login retorna un token en el body
- Token se envía en header: `Authorization: Bearer <token>`
- Sin token → 401
- Token inválido → 401

---

## 5. Validaciones mínimas

| Campo | Regla |
|---|---|
| `user.email` | Requerido, formato válido, único |
| `user.password` | Requerido, mínimo 6 caracteres |
| `cliente.nombre` | Requerido, no vacío |
| `moto.marca` | Requerido |
| `orden.descripcion` | Requerido |
| `repuesto.codigo` | Requerido, único |
| `repuesto.precio_venta` | >= 0 |
| `repuesto.stock` | >= 0 |
| `pago.monto` | > 0 |
