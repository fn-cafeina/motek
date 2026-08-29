# Funcionalidades y Flujo de Trabajo

---

## 1. Funcionalidades por fase

### Fase 1: Core (Auth, Clientes, Motos y Órdenes)

**Auth:**
- Login con email + password (retorna token)
- Logout
- Ver usuario actual

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
- Subtotales: mano de obra + repuestos
- Estados: `pendiente` | `parcial` | `pagada` | `cancelada`
- Registro de pagos con método (efectivo, transferencia, tarjeta)
- Historial de pagos por factura

---

## 2. Flujo de Trabajo Típico

1. **Login** → Autenticarse con email + password
2. **Registrar cliente** → Crear contacto con datos básicos
3. **Registrar moto** → Asociar moto al cliente (marca, placa, kilometraje)
4. **Crear orden de trabajo** → Seleccionar cliente + moto, describir trabajo
5. **Diagnosticar** → Agregar diagnóstico, estimar fecha de entrega
6. **Agregar repuestos** → Seleccionar piezas del inventario (auto-descuenta stock)
7. **Avanzar estado** → Recibido → En progreso → Esperando repuestos → Terminado → Entregado
8. **Facturar** → Generar factura desde la orden (calcula totales automáticamente)
9. **Cobrar** → Registrar pago(s) con método

---

## 3. Diagrama de Relaciones

```
User (1) ──── (N) Cliente
                 │
                 │
                 └──── (N) Moto
                          │
                          │
Cliente (1) ──── (N) OrdenTrabajo (N) ──── (N) OrdenRepuesto (N) ──── (1) Repuesto
                          │
                          │
                     (1) Factura (1) ──── (N) Pago
```
