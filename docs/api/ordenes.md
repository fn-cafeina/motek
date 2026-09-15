# Órdenes y repuestos de orden

## Órdenes

Estados posibles: `recibido` · `en_progreso` · `esperando_repuestos` · `terminado` · `entregado`. Toda orden nace en `recibido`.

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/ordenes?estado=` | Filtro exacto opcional por estado. |
| POST | `/api/ordenes` | `cliente_id`, `moto_id` y `descripcion` obligatorios. |
| GET | `/api/ordenes/{id}` | `404 "orden no encontrada"`. |
| PUT | `/api/ordenes/{id}` | Solo toca `descripcion`, `diagnostico`, `total_mano_obra` y `notas`: el cliente, la moto y el estado no se cambian por acá. |
| PATCH | `/api/ordenes/{id}/estado` | `{"estado":"en_progreso"}`. Estado inválido → `400 "estado invalido"`. |
| DELETE | `/api/ordenes/{id}` | `204`. Si tiene factura emitida → `409 "no se puede eliminar: la orden tiene una factura emitida"`. |

```bash
curl -X POST http://localhost:8080/api/ordenes \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"cliente_id":1,"moto_id":1,"descripcion":"Service 20.000 km","total_mano_obra":78000}'
# → 201 {...,"estado":"recibido",...}
```

Una orden:

```json
{"id":16,"cliente_id":1,"moto_id":1,"descripcion":"Service 20.000 km","diagnostico":"","estado":"recibido","fecha_recibido":"2026-09-15T10:00:00Z","fecha_entrega":null,"total_mano_obra":78000,"notas":"","creado_en":"2026-09-15T10:00:00Z","actualizado_en":"2026-09-15T10:00:00Z"}
```

## Repuestos de una orden

El consumo de repuestos vive acá, no en el inventario: agregar descuenta stock, quitar lo devuelve. El precio unitario se fija al momento de agregar (el precio de venta vigente), así un cambio de precio posterior no reescribe la historia.

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/ordenes/{id}/repuestos` | Las líneas de la orden. |
| POST | `/api/ordenes/{id}/repuestos` | `{"repuesto_id":3,"cantidad":2}`. Sin stock → `400 "stock insuficiente"`. |
| DELETE | `/api/ordenes/{id}/repuestos/{rid}` | Quita la línea y devuelve el stock. |

```bash
curl -X POST http://localhost:8080/api/ordenes/16/repuestos \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"repuesto_id":3,"cantidad":2}'
# → 201 {"id":5,"orden_id":16,"repuesto_id":3,"cantidad":2,"precio_unitario":11500,"subtotal":23000}
```

Las dos escrituras son transaccionales: si algo falla a mitad de camino, no queda ni la línea ni el descuento a medias.