# Órdenes y repuestos de orden

## Órdenes

Estados válidos: `recibido`, `en_progreso`, `esperando_repuestos`, `terminado` y `entregado`. Toda orden nace en `recibido`.

| Método | Ruta | Comportamiento |
|---|---|---|
| `GET` | `/api/ordenes?estado=` | Lista órdenes de más nueva a más vieja. El filtro es opcional y exacto. |
| `POST` | `/api/ordenes` | Crea una orden; `cliente_id`, `moto_id` y `descripcion` son obligatorios. |
| `GET` | `/api/ordenes/{id}` | Obtiene una orden. |
| `PUT` | `/api/ordenes/{id}` | Actualiza descripción, diagnóstico, mano de obra y notas. |
| `PATCH` | `/api/ordenes/{id}/estado` | Actualiza el estado con `{"estado":"en_progreso"}`. |
| `DELETE` | `/api/ordenes/{id}` | Responde `204`; una factura asociada puede producir `409`. |

El filtro `estado` no se valida contra una lista en el endpoint: un valor desconocido simplemente no encuentra coincidencias y devuelve `[]`.

Crear una orden con un cliente o moto inexistente devuelve `404 "cliente o moto no encontrado"`. La respuesta de creación puede no recargar todos los timestamps de la base.

```bash
curl -X POST http://localhost:8080/api/ordenes \
  -H "Authorization: Bearer <token>" \
  -H 'Content-Type: application/json' \
  -d '{"cliente_id":1,"moto_id":1,"descripcion":"Service 20.000 km","total_mano_obra":78000}'
```

Ejemplo de orden:

```json
{"id":16,"cliente_id":1,"moto_id":1,"descripcion":"Service 20.000 km","diagnostico":"","estado":"recibido","fecha_recibido":"2026-09-15T10:00:00Z","fecha_entrega":null,"total_mano_obra":78000,"notas":"","creado_en":"2026-09-15T10:00:00Z","actualizado_en":"2026-09-15T10:00:00Z"}
```

`fecha_entrega` forma parte del esquema y del JSON, pero actualmente no tiene una ruta que la escriba. El estado se puede cambiar a cualquier valor válido, sin una máquina de transiciones. `PATCH` responde solo el nuevo estado:

```json
{"estado":"en_progreso"}
```

## Repuestos de una orden

Agregar un repuesto descuenta stock y guarda el precio de venta vigente como `precio_unitario`. Quitar la línea devuelve el stock. El precio queda congelado aunque cambie el precio del inventario.

| Método | Ruta | Comportamiento |
|---|---|---|
| `GET` | `/api/ordenes/{id}/repuestos` | Lista las líneas de la orden. |
| `POST` | `/api/ordenes/{id}/repuestos` | Agrega `{"repuesto_id":3,"cantidad":2}`. |
| `DELETE` | `/api/ordenes/{id}/repuestos/{rid}` | Quita una línea identificada por `repuesto_id`. |

`{rid}` es el ID del repuesto, no el ID de la línea. No hay una restricción de unicidad para `(orden_id, repuesto_id)`: se pueden agregar varias líneas del mismo repuesto. El DELETE busca la primera coincidencia para esa orden y repuesto.

Al agregar, `cantidad` debe ser mayor que cero. Si falta un ID o la cantidad no es positiva, la API responde `400 "repuesto_id y cantidad son requeridos"`. Si no hay stock, responde `400 "stock insuficiente"`. Si el repuesto o la orden no existen, responde `404`.

La operación de agregar usa una transacción y bloquea el repuesto con `SELECT ... FOR UPDATE`. La operación de quitar también es transaccional, pero su consulta no usa ese bloqueo explícito.

```bash
curl -X POST http://localhost:8080/api/ordenes/16/repuestos \
  -H "Authorization: Bearer <token>" \
  -H 'Content-Type: application/json' \
  -d '{"repuesto_id":3,"cantidad":2}'
```
