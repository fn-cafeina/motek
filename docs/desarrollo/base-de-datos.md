# Base de datos

Motek usa MySQL. Al abrir el backend se aplican migraciones SQL versionadas (ver [Migraciones](#migraciones)); el backend no crea la base: la base configurada en `DB_NAME` debe existir y ser accesible antes de arrancar.

## Tablas

- **users** — `id`, `email` único, `nombre`, `rol` (`admin`, `recepcionista`, `tecnico`, con `CHECK`), `activo`, `password` (hash bcrypt) y `creado_en`.
- **clientes** — `id`, `nombre`, datos de contacto, `notas` y `creado_en`.
- **motos** — datos de la moto, `cliente_id` con `ON DELETE CASCADE` y `creado_en`.
- **ordenes_trabajo** — `cliente_id`, `moto_id`, `tecnico_id` (FK opcional a `users`), `descripcion`, `diagnostico`, `estado` (con `CHECK`), `fecha_recibido`, `fecha_entrega`, `total_mano_obra`, `notas` y timestamps. `fecha_entrega` existe en el esquema, pero ninguna ruta actual la escribe.
- **repuestos** — `codigo` único, descripción, categoría, precios, `stock`, `stock_minimo`, ubicación y timestamps.
- **orden_repuestos** — relación entre orden y repuesto, cantidad, `precio_unitario` congelado al agregar y subtotal.
- **facturas** — `orden_id` con `UNIQUE` (una factura por orden, reforzado también en la aplicación), subtotales, total, estado (con `CHECK`), emisión, vencimiento, notas y timestamps.
- **pagos** — `factura_id`, monto, método, fecha, notas y `creado_en`.
- **auditoria** — `usuario_id` (FK a `users`, puede ser `NULL`), `tabla`, `registro_id`, `accion` (`crear`, `editar`, `borrar`, con `CHECK`), `datos_antes`, `datos_despues` (JSON) y `fecha`. La escriben los triggers de auditoría.

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

Las migraciones son archivos `.sql` dentro de `backend/internal/store/migrations/`, embebidos en el binario y aplicados en orden al abrir el store. La tabla `schema_migrations` registra la versión, el nombre y la fecha de cada archivo aplicado; re-arrancar no re-aplica nada.

| Versión | Contenido |
|---|---|
| `0001_esquema_inicial` | Las ocho tablas originales (baseline idempotente). |
| `0002_roles_usuarios` | `users.nombre/rol/activo`, `ordenes_trabajo.tecnico_id` y el `CHECK` de rol. El usuario más antiguo queda como admin. |
| `0003_auditoria` | Tabla `auditoria` y 21 triggers (`AFTER INSERT/UPDATE/DELETE` sobre siete tablas). |
| `0004_restricciones_indices` | `UNIQUE (orden_id)` en facturas, `CHECK` de estados, trigger de `entregado` terminal e índices de rendimiento. |
| `0005_vistas_reportes` | Vistas `v_ordenes_estado`, `v_facturacion_mensual`, `v_ingresos_mensuales`, `v_top_repuestos` y `v_ranking_tecnicos`. |

Para agregar una migración nueva, creá `0006_nombre.sql`. Las sentencias del archivo se separan con una línea que contiene exactamente `-- ;;` (los cuerpos de los triggers usan `;` internos y no sirven de separador).

## Auditoría

Los triggers de `0003_auditoria` insertan una fila por cada alta, cambio o baja de `clientes`, `motos`, `ordenes_trabajo`, `orden_repuestos`, `repuestos`, `facturas` y `pagos`. El usuario sale de `@motek_usuario_id`, que `Store.withTx` publica al inicio de cada transacción; si la escritura no tiene usuario (tests, mantenimiento) queda `NULL`. `datos_antes` y `datos_despues` guardan las columnas en JSON.

Las cascadas de claves foráneas de InnoDB no disparan triggers: el borrado en cascada de una moto u orden no genera filas de auditoría propias. Los deletes de la suite de tests dejan filas con `usuario_id` `NULL` antes de limpiar la tabla.

## Vistas

Las vistas de `0005_vistas_reportes` alimentan `GET /api/reportes/tablero`: conteo de órdenes por estado, facturación mensual de facturas no canceladas, ingresos mensuales de pagos, top de repuestos por unidades y monto, y ranking de técnicos.

## Restricciones e índices

- `users.rol`, `ordenes_trabajo.estado`, `facturas.estado` y `auditoria.accion` tienen restricciones `CHECK`.
- `facturas.orden_id` es `UNIQUE`; `users.email` y `repuestos.codigo` ya lo eran.
- Un trigger `BEFORE UPDATE` sobre `ordenes_trabajo` impide salir de `entregado` con `SIGNAL SQLSTATE '45000'`.
- Índices explícitos: `ordenes_trabajo(estado)`, `facturas(estado)`, `facturas(fecha_emision)`, `pagos(fecha)`, `repuestos(categoria)`, `clientes(nombre)`, `auditoria(tabla, registro_id)` y `auditoria(fecha)`.
