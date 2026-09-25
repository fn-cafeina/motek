# Facturas y pagos

Las facturas tienen estados `pendiente`, `parcial`, `pagada` y `cancelada`. No existe un endpoint para borrar una factura.

## Facturas

| Método | Ruta | Comportamiento |
|---|---|---|
| `GET` | `/api/facturas?estado=` | Lista facturas; el filtro es exacto y opcional. |
| `POST` | `/api/facturas` | Crea una factura para `orden_id`. |
| `GET` | `/api/facturas/{id}` | Obtiene una factura. |
| `PUT` | `/api/facturas/{id}` | Actualiza `notas` y `fecha_vencimiento`. |
| `PATCH` | `/api/facturas/{id}/cancelar` | Cambia el estado a `cancelada`. |

Al crear, el servidor suma la mano de obra de la orden y los subtotales de sus repuestos. La factura nace `pendiente`. El servidor comprueba que la orden exista y que no haya otra factura para ella; esa unicidad es un chequeo de aplicación y no una restricción `UNIQUE` de la base.

```bash
curl -X POST http://localhost:8080/api/facturas \
  -H "Authorization: Bearer <token>" \
  -H 'Content-Type: application/json' \
  -d '{"orden_id":16}'
```

Ejemplo:

```json
{"id":9,"orden_id":16,"subtotal_mano_obra":78000,"subtotal_repuestos":46900,"total":124900,"estado":"pendiente","fecha_emision":"2026-09-15T10:00:00Z","fecha_vencimiento":null,"notas":"","creado_en":"2026-09-15T10:00:00Z","actualizado_en":"2026-09-15T10:00:00Z"}
```

Una segunda factura para la misma orden devuelve `409 "ya existe una factura para esta orden"`. Una factura con total cero queda `pendiente`; no puede recibir un pago positivo.

`PUT` no cambia los importes. La implementación actual tampoco bloquea la edición por estado: una factura `cancelada` puede recibir cambios de notas o vencimiento. La interfaz ofrece la acción **Editar** para todos los estados.

## Pagos

| Método | Ruta | Comportamiento |
|---|---|---|
| `GET` | `/api/facturas/{id}/pagos` | Lista los pagos de una factura. |
| `POST` | `/api/facturas/{id}/pagos` | Registra `monto`, `metodo` y `notas`. |
| `DELETE` | `/api/facturas/{id}/pagos/{pid}` | Elimina un pago y recalcula el estado. |

Ejemplo:

```http
POST /api/facturas/9/pagos
Content-Type: application/json

{"monto":50000,"metodo":"transferencia","notas":"Transferencia bancaria"}
```

Reglas:

- `monto` debe ser mayor que cero.
- La suma de pagos no puede superar el total.
- No se puede pagar una factura `cancelada`.
- `metodo` vacío se convierte en `efectivo`.
- El backend no restringe `metodo` a un enum: acepta cualquier string no vacío hasta el límite de la columna. La interfaz ofrece `efectivo`, `transferencia` y `tarjeta`.

Crear un pago y actualizar el estado de la factura se hace en una transacción con bloqueo de la factura. Borrar un pago también recalcula el estado, incluso si la factura estaba cancelada; por eso una factura cancelada puede volver a `pendiente`, `parcial` o `pagada` después de borrar pagos.

`DELETE /pagos/{pid}` devuelve `204`. La factura sigue siendo la misma: cancelar no elimina pagos ni habilita una segunda factura para la orden.
