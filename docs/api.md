# API (Endpoints)

Ver [conventions.md](conventions.md) para códigos HTTP, formato de errores y paginación.

---

## Fase 1: Core

```
# Health
GET    /health

# Clientes
GET    /api/clientes              # Listar (?q=busqueda)
POST   /api/clientes              # Crear
GET    /api/clientes/{id}         # Ver uno + sus motos
PUT    /api/clientes/{id}         # Editar
DELETE /api/clientes/{id}         # Eliminar (cascade motos)

# Motos
GET    /api/clientes/{id}/motos   # Motos de un cliente
POST   /api/clientes/{id}/motos   # Agregar moto a cliente
GET    /api/motos/{id}            # Ver una moto + dueño
PUT    /api/motos/{id}            # Editar moto
DELETE /api/motos/{id}            # Eliminar moto

# Órdenes de Trabajo
GET    /api/ordenes               # Listar (?estado=recibido&desde=...&hasta=...)
POST   /api/ordenes               # Crear (requiere cliente_id + moto_id)
GET    /api/ordenes/{id}          # Ver una (con cliente + moto)
PUT    /api/ordenes/{id}          # Editar detalles
PATCH  /api/ordenes/{id}/estado   # Cambiar estado (1 click)
DELETE /api/ordenes/{id}          # Eliminar
```

---

## Fase 2: Inventario

```
# Repuestos
GET    /api/repuestos                    # Listar (?q=...&categoria=...&bajo_stock=true)
POST   /api/repuestos                    # Crear
GET    /api/repuestos/{id}               # Ver uno
PUT    /api/repuestos/{id}               # Editar
DELETE /api/repuestos/{id}               # Eliminar (solo si no está en órdenes)

# Repuestos en órdenes
GET    /api/ordenes/{id}/repuestos       # Repuestos de una orden
POST   /api/ordenes/{id}/repuestos       # Agregar repuesto (auto-descuenta stock)
DELETE /api/ordenes/{id}/repuestos/{rid} # Quitar repuesto (auto-restaura stock)

# Gestión de stock
POST   /api/repuestos/{id}/stock         # Ajustar stock (?cantidad=+5 o -2)
GET    /api/alertas/stock                # Alertas de stock bajo
```

---

## Fase 3: Facturación

```
# Facturas
GET    /api/facturas                     # Listar (?estado=pendiente&desde=...&hasta=...)
POST   /api/facturas                     # Crear desde orden_id (calcula totales)
GET    /api/facturas/{id}                # Ver una (con pagos + detalles de orden)
PUT    /api/facturas/{id}                # Editar notas/fechas
PATCH  /api/facturas/{id}/cancelar       # Cancelar factura

# Pagos
GET    /api/facturas/{id}/pagos          # Listar pagos de una factura
POST   /api/facturas/{id}/pagos          # Registrar pago
DELETE /api/facturas/{id}/pagos/{pid}    # Anular pago

# Resumen
GET    /api/cobros/resumen               # Saldos pendientes
```

---

## Fase 4: Agenda + Reportes

```
# Citas
GET    /api/citas                        # Listar (?desde=...&hasta=...&estado=programada)
POST   /api/citas                        # Crear
GET    /api/citas/{id}                   # Ver una
PUT    /api/citas/{id}                   # Editar
PATCH  /api/citas/{id}/estado            # Cambiar estado
DELETE /api/citas/{id}                   # Eliminar

# Reportes (solo lectura)
GET    /api/reportes/dashboard           # Resumen general
GET    /api/reportes/ordenes-mes         # Órdenes por mes (?mes=2026-08)
GET    /api/reportes/ingresos-mes        # Ingresos por mes (?mes=2026-08)
GET    /api/reportes/servicios-top       # Servicios más solicitados (top 10)
GET    /api/reportes/clientes-activos    # Clientes con más órdenes
```
