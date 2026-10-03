# Facturas y pagos

Las facturas tienen estados `pendiente`, `parcial`, `pagada` y `cancelada`. No existe un endpoint para borrar una factura.

## Facturas

| Método | Ruta | Comportamiento |
|---|---|---|
| `GET` | `/api/facturas?estado=` | Lista facturas; el filtro es exacto y opcional. |
| `POST` | `/api/facturas` | Crea una factura para `orden_id`. |
| `GET` | `/api/facturas/{id}` | Obtiene una factura. |
| `PUT` | `/api/facturas/{id}` | Actualiza `notas` y `fecha_vencimiento`. |
| `PATCH` | `/api/facturas/{id}/cancelar` | Cambia el estado a `cancelada`. Solo `admin`. |
| `GET` | `/api/facturas/{id}/pdf` | Devuelve la factura en PDF. |

Al crear, el servidor suma la mano de obra de la orden y los subtotales de sus repuestos. La factura nace `pendiente`. El servidor comprueba que la orden exista y que no haya otra factura para ella, y la base refuerza la misma regla con una restricción `UNIQUE` sobre `orden_id`: dos pedidos concurrentes no pueden crear facturas duplicadas.

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

`PUT` no cambia los importes. La implementación actual tampoco bloquea la edición por estado: una factura `cancelada` puede recibir cambios de notas o vencimiento. La interfaz ofrece la acción **Editar** para admin y recepción en todos los estados.

Crear facturas, editar notas y registrar pagos corresponde a `admin` y `recepcionista`. Cancelar facturas y eliminar pagos es solo para `admin` (`403 "no tenes permisos para esta accion"` para el resto de los roles).

## PDF

```http
GET /api/facturas/{id}/pdf
Authorization: Bearer <token>
```

Devuelve `application/pdf` con `Content-Disposition: inline; filename="factura-{id}.pdf"`. El documento incluye el encabezado del taller, los datos del cliente y la moto, la orden, una línea por concepto (mano de obra y repuestos actuales de la orden), los totales, lo pagado y el saldo. Si la factura está cancelada, el PDF lo indica.

**Nota:** las líneas de repuestos del PDF son las líneas actuales de la orden, mientras que los subtotales y el total son los congelados al emitir la factura. Si la orden se modificó después de facturar, el detalle puede no coincidir con los totales; es el mismo comportamiento documentado en [Reglas](../desarrollo/reglas.md).

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
