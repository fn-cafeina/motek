# Base de datos

MySQL. Ocho tablas, creadas con `CREATE TABLE IF NOT EXISTS` cada vez que arranca el backend (`Store.Migrate()` dentro de `Open()`). No hay sistema de versiones de migraciones: si cambia el esquema, hay que alterar la tabla a mano o recrearla.

## Tablas

- **users** — `id`, `email` único, `password` (hash bcrypt), `creado_en`.
- **clientes** — `id`, `nombre`, `telefono`, `email`, `direccion`, `notas`, `creado_en`.
- **motos** — `id`, `cliente_id` → clientes, `marca`, `modelo`, `anio`, `placa`, `color`, `vin`, `kilometraje`, `creado_en`.
- **ordenes_trabajo** — `id`, `cliente_id` → clientes, `moto_id` → motos, `descripcion`, `diagnostico`, `estado` (default `recibido`), `fecha_recibido`, `fecha_entrega` (nullable), `total_mano_obra`, `notas`, timestamps.
- **repuestos** — `id`, `codigo` único, `nombre`, `descripcion`, `categoria`, `precio_compra`, `precio_venta`, `stock` (default 0), `stock_minimo` (default 5), `ubicacion`, timestamps.
- **orden_repuestos** — `id`, `orden_id` → ordenes, `repuesto_id` → repuestos, `cantidad`, `precio_unitario` (foto del precio al agregar), `subtotal`.
- **facturas** — `id`, `orden_id` → ordenes, `subtotal_mano_obra`, `subtotal_repuestos`, `total`, `estado` (default `pendiente`), `fecha_emision`, `fecha_vencimiento` (nullable), `notas`, timestamps.
- **pagos** — `id`, `factura_id` → facturas, `monto`, `metodo` (default `efectivo`), `fecha`, `notas`, `creado_en`.

Montos en enteros (pesos sin centavos). Timestamps en `DATETIME`.

## Qué pasa al borrar

Dos comportamientos, y la diferencia es toda la historia de los 409:

```
clientes ──CASCADE──► motos ──CASCADE──► ordenes_trabajo ──CASCADE──► orden_repuestos
   │                                                          │
   └──────────────────CASCADE────────────────────────────────┘
                                                              ╳ RESTRICT
                                                     facturas ─┴──► ordenes_trabajo
                                                     pagos ──CASCADE──► facturas
   orden_repuestos ──RESTRICT──► repuestos (sin cascada: "repuesto en uso")
```

- **CASCADE**: borrar un cliente borra sus motos, sus órdenes, las líneas y los pagos. Silencioso y total.
- **RESTRICT** (`facturas.orden_id → ordenes`): si la cadena de borrado toca una orden facturada, MySQL frena todo con el error 1451 y la API responde `409 "no se puede eliminar: ..."`. Nada se borra a medias: o cae todo o no cae nada.
- **Sin cascada** (`orden_repuestos.repuesto_id → repuestos`): un repuesto usado en cualquier orden no se puede borrar (`409 "repuesto en uso"`), aunque la orden ya esté entregada.

El frontend avisa antes de confirmar (cuenta motos y órdenes asociadas), pero la garantía real está acá: aunque alguien llame a la API directo, la factura protege la historia.