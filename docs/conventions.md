# Convenciones HTTP y Validaciones

---

## 1. Códigos de respuesta

| Código | Uso |
|---|---|
| 200 | OK (GET, PUT exitoso) |
| 201 | Created (POST exitoso) |
| 204 | No Content (DELETE exitoso) |
| 400 | Bad Request (validación fallida) |
| 404 | Not Found (recurso no existe) |
| 409 | Conflict (ej: código de repuesto duplicado) |
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

## 4. Generación de números consecutivos

Tabla `counters` (ver [schema.md](schema.md)):
```sql
CREATE TABLE IF NOT EXISTS counters (
    anio         INTEGER NOT NULL,
    consecutivo  INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (anio)
);
```

Formato: `FAC-YYYY-NNNN` (ej: FAC-2026-0001)

---

## 5. Validaciones mínimas

| Campo | Regla |
|---|---|
| `cliente.nombre` | Requerido, no vacío |
| `moto.marca` | Requerido |
| `orden.descripcion` | Requerido |
| `repuesto.codigo` | Requerido, único |
| `repuesto.precio_venta` | >= 0 |
| `repuesto.stock` | >= 0 |
| `factura.numero` | Requerido, único |
| `pago.monto` | > 0 |
