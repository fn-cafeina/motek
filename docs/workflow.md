# Funcionalidades y Flujo de Trabajo

---

## 1. Funcionalidades por fase

### Fase 1: Core (Clientes, Motos y Órdenes)

**Clientes:**
- Registro completo (nombre, teléfono, email, dirección, notas)
- Historial de servicios por cliente
- Búsqueda de clientes

**Motos:**
- Registro por cliente (marca, modelo, año, placa, color, VIN)
- Kilometraje actual

**Órdenes de Trabajo:**
- Crear orden asociando cliente + moto
- Estados: `recibido` → `en_progreso` → `esperando_repuestos` → `terminado` → `entregado`
- Descripción del trabajo solicitado
- Diagnóstico del mecánico
- Fecha de recepción y fecha estimada de entrega
- Costo de mano de obra
- Notas internas

---

### Fase 2: Inventario de Repuestos

- Catálogo de piezas (código, nombre, categoría, descripción)
- Precios de compra y venta (en centavos)
- Control de stock con stock mínimo para alertas
- Ubicación física en el taller
- Asociar repuestos a órdenes (auto-descuenta stock)
- Ajustes manuales de stock (roturas, conteos físicos)

---

### Fase 3: Facturación

- Generar factura desde una orden de trabajo
- Número consecutivo: `FAC-YYYY-NNNN`
- Subtotales: mano de obra + repuestos
- Estados: `pendiente` | `parcial` | `pagada` | `cancelada`
- Registro de pagos con método (efectivo, transferencia, tarjeta)
- Historial de pagos por factura

---

### Fase 4: Agenda + Reportes

**Agenda / Citas:**
- Programar citas por fecha/hora
- Asociar cliente, moto y opcionalmente una orden existente
- Estados: `programada` | `confirmada` | `completada` | `cancelada`
- Filtros por rango de fechas y estado

**Dashboard / Reportes:**
- Resumen: órdenes del mes, ingresos, pendientes
- Órdenes por mes (conteo y estados)
- Ingresos por mes
- Servicios más solicitados
- Clientes más activos

---

## 2. Flujo de Trabajo Típico

1. **Registrar cliente** → Crear contacto con datos básicos
2. **Registrar moto** → Asociar moto al cliente (marca, placa, kilometraje)
3. **Crear orden de trabajo** → Seleccionar cliente + moto, describir trabajo
4. **Diagnosticar** → Agregar diagnóstico, estimar fecha de entrega
5. **Agregar repuestos** → Seleccionar piezas del inventario (auto-descuenta stock)
6. **Avanzar estado** → Recibido → En progreso → Esperando repuestos → Terminado → Entregado
7. **Facturar** → Generar factura desde la orden (calcula totales automáticamente)
8. **Cobrar** → Registrar pago(s) con método
9. **Consultar reportes** → Ver métricas del mes

---

## 3. Diagrama de Relaciones

```
Cliente (1) ──── (N) Moto
   │                  │
   │                  │
   └──── (N) OrdenTrabajo (N) ──── (N) OrdenRepuesto (N) ──── (1) Repuesto
              │
              │
         (1) Factura (1) ──── (N) Pago

Cliente (1) ──── (N) Cita (N) ──── (1) Moto
                      │
                      └──── (0..1) OrdenTrabajo
```
