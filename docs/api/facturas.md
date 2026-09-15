# Facturas y pagos

Estados: `pendiente` · `parcial` · `pagada` · `cancelada`. El estado lo calcula el servidor a partir de los pagos; no se escribe a mano. No existe borrar factura: se cancela.

## Facturas

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/facturas?estado=` | Filtro exacto opcional. |
| POST | `/api/facturas` | `{"orden_id":16}`. Una sola factura por orden → `409 "ya existe una factura para esta orden"`. |
| GET | `/api/facturas/{id}` | `404 "factura no encontrada"`. |
| PUT | `/api/facturas/{id}` | Solo `notas` y `fecha_vencimiento`. Los importes no se editan: salen del sistema. |
| PATCH | `/api/facturas/{id}/cancelar` | La anula. Si ya estaba cancelada → `400 "la factura ya esta cancelada"`. |

Al crear, el servidor calcula: mano de obra de la orden + suma de las líneas de repuestos = total. La factura nace `pendiente`.

```bash
curl -X POST http://localhost:8080/api/facturas \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"orden_id":16}'
# → 201 {"id":9,...,"subtotal_mano_obra":78000,"subtotal_repuestos":46900,"total":124900,"estado":"pendiente",...}
```

## Pagos

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/facturas/{id}/pagos` | Los pagos de la factura. |
| POST | `/api/facturas/{id}/pagos` | `{"monto":50000,"metodo":"transferencia"}`. Monto mayor a cero; si excede el saldo → `400 "el pago excede el total de la factura"`. En cancelada → `400 "no se puede pagar una factura cancelada"`. |
| DELETE | `/api/facturas/{id}/pagos/{pid}` | Elimina el pago y el estado retrocede (de pagada a parcial, de parcial a pendiente). |

El `metodo` por defecto es `efectivo`. Los métodos en uso: `efectivo`, `transferencia`, `tarjeta`.

```bash
curl -X POST http://localhost:8080/api/facturas/9/pagos \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"monto":50000,"metodo":"transferencia"}'
# → 201 {"id":4,"factura_id":9,"monto":50000,...}
# la factura pasa a "parcial"
```

Crear y borrar pagos son transaccionales: el pago y el nuevo estado de la factura se escriben juntos o no se escribe nada.