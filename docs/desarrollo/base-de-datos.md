# Base de datos

Motek usa MySQL y ejecuta ocho `CREATE TABLE IF NOT EXISTS` al abrir el backend. El backend no crea la base: la base configurada en `DB_NAME` debe existir y ser accesible antes de arrancar.

## Tablas

- **users** — `id`, `email` único, `password` (hash bcrypt) y `creado_en`.
- **clientes** — `id`, `nombre`, datos de contacto, `notas` y `creado_en`.
- **motos** — datos de la moto, `cliente_id` con `ON DELETE CASCADE` y `creado_en`.
- **ordenes_trabajo** — `cliente_id`, `moto_id`, `descripcion`, `diagnostico`, `estado`, `fecha_recibido`, `fecha_entrega`, `total_mano_obra`, `notas` y timestamps. `fecha_entrega` existe en el esquema, pero ninguna ruta actual la escribe.
- **repuestos** — `codigo` único, descripción, categoría, precios, `stock`, `stock_minimo`, ubicación y timestamps.
- **orden_repuestos** — relación entre orden y repuesto, cantidad, `precio_unitario` congelado al agregar y subtotal.
- **facturas** — `orden_id`, subtotales, total, estado, emisión, vencimiento, notas y timestamps. La unicidad de una factura por orden se verifica en la aplicación; la tabla no tiene una restricción `UNIQUE` sobre `orden_id`.
- **pagos** — `factura_id`, monto, método, fecha, notas y `creado_en`.

Los importes son enteros en pesos. La base usa `DATETIME` para fechas y timestamps; los campos `*_en` pueden llegar como fechas ISO en JSON.

## Relaciones y borrados

```text
clientes ──CASCADE──► motos ──CASCADE──► ordenes_trabajo ──CASCADE──► orden_repuestos
    │                       │                         │
    └───────────────────────┴─────────────────────────┘
                                              ╳ RESTRICT
                                      facturas ─┘
facturas ──CASCADE──► pagos
orden_repuestos ──RESTRICT──► repuestos
```

- Borrar un cliente intenta borrar también motos, órdenes, líneas y pagos asociados.
- `facturas.orden_id` usa `ON DELETE RESTRICT`: una factura, incluso cancelada, impide borrar la orden y la cadena de cliente o moto que la contiene.
- `orden_repuestos.repuesto_id` no tiene cascada: un repuesto usado en una orden no se puede borrar.
- Los pagos se borran en cascada al borrar su factura, pero la API no ofrece borrar una factura directamente; se cancela.
- No hay borrado lógico ni papelera.

## Migraciones

`Store.Migrate()` crea las tablas y columnas que todavía no existen. No hay tabla de versiones ni mecanismo para transformar automáticamente un esquema existente. Si cambiás una tabla, revisá y aplicá la migración manualmente en cada entorno.
