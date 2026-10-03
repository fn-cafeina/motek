# Reglas de negocio

Estas son las validaciones y comportamientos que define el servidor. La interfaz los refleja o anticipa, pero el backend sigue siendo la fuente de verdad.

Cada cuenta tiene un rol (`admin`, `recepcionista`, `tecnico`) y las rutas aplican permisos; la matriz completa está en [Usuarios y roles](../api/usuarios.md).

## Obligatorios y únicos

- **Registro:** `email` y `password` no vacíos; la contraseña debe tener al menos 6 caracteres. `nombre` es opcional. La primera cuenta de una base vacía queda como `admin`; el resto como `recepcionista`. El email es único, pero el backend solo comprueba que no esté vacío: no valida su formato.
- **Clientes:** `nombre` obligatorio.
- **Motos:** `marca` obligatoria y siempre pertenecen al cliente de la ruta.
- **Repuestos:** `codigo` obligatorio y único. La aplicación además exige `nombre` al crear o editar.
- **Órdenes:** `cliente_id`, `moto_id` y `descripcion` son obligatorios al crear. En una actualización solo se modifican descripción, diagnóstico, mano de obra y notas; cliente, moto y estado permanecen.
- **Facturas:** `orden_id` es obligatorio. El servidor rechaza una segunda factura para la misma orden y la base lo refuerza con un `UNIQUE` sobre `orden_id`.
- **Pagos:** `monto` debe ser mayor que cero.

## Estados

### Órdenes

Una orden nace en `recibido`. `PATCH /api/ordenes/{id}/estado` acepta cualquiera de estos valores:

`recibido` · `en_progreso` · `esperando_repuestos` · `terminado` · `entregado`

No hay una máquina de transiciones: el endpoint valida el vocabulario (reforzado con un `CHECK` en la base), no una progresión obligatoria. La única excepción es `entregado`, que es terminal: la base rechaza salir de ese estado con un trigger y la API responde `409 "una orden entregada no puede cambiar de estado"`. El rol `tecnico` solo puede cambiar el estado de sus órdenes asignadas.

### Facturas

Los estados son `pendiente`, `parcial`, `pagada` y `cancelada`. Para una factura no cancelada, el servidor recalcula `pendiente`, `parcial` o `pagada` a partir del total pagado. `cancelada` se solicita con `PATCH /cancelar` y bloquea pagos nuevos.

Hay dos límites que conviene tener presentes en el comportamiento actual:

- La interfaz y el diálogo presentan la cancelación como irreversible, pero `DELETE` de un pago recalcula el estado de la factura y puede cambiar una cancelada a pendiente, parcial o pagada.
- La edición de notas y vencimiento (`PUT`) no verifica el estado, por lo que también puede aplicarse a una factura cancelada.

## Permisos por rol

- `admin`: todo el sistema, incluidos usuarios, historial, facturación completa y repuestos.
- `recepcionista`: clientes, motos, órdenes, facturas y pagos; sin usuarios, repuestos, cancelaciones ni borrado de pagos.
- `tecnico`: solo sus órdenes asignadas (estado, diagnóstico y repuestos consumidos) y lectura del resto del taller.

Un pedido fuera del alcance del rol devuelve `403 "no tenes permisos para esta accion"`. El detalle está en [Usuarios y roles](../api/usuarios.md).

## Dinero y stock

- Los totales de una factura se calculan al crearla y no se recalculan al modificar la orden o sus repuestos.
- Al agregar un repuesto a una orden se congela el precio de venta vigente en `precio_unitario`; quitar la línea devuelve el stock.
- Agregar una línea valida stock y precio dentro de una transacción, con bloqueo `FOR UPDATE` sobre el repuesto.
- Quitar una línea también es transaccional, pero su consulta no usa `FOR UPDATE`.
- El ajuste manual `POST /api/repuestos/{id}/stock` rechaza un resultado negativo con `stock no puede ser negativo`.
- `PUT /api/repuestos/{id}` reemplaza directamente el campo `stock` y no aplica esa validación adicional. Usalo con cuidado.
- La API permite cualquier string no vacío como método de pago; la interfaz ofrece `efectivo`, `transferencia` y `tarjeta`.
- El **saldo por cobrar** del tablero se calcula como `SUM(total - pagos)` de las facturas no canceladas, no como el total facturado.

## Facturas y pagos

Crear un pago y recalcular el estado se escriben juntos dentro de una transacción con `FOR UPDATE` sobre la factura. El monto no puede superar el saldo. Una factura con total cero queda `pendiente` y no admite un pago positivo.

Borrar un pago también recalcula el estado dentro de una transacción. No hay una protección de terminalidad para `cancelada` en esa operación. Cancelar facturas y borrar pagos requiere rol `admin`; registrar pagos está disponible para `admin` y `recepcionista`.

## Borrados

La política de cascadas y `RESTRICT` está en [Base de datos](base-de-datos.md). En resumen:

- Sin facturas en la cadena, los borrados en cascada pueden eliminar datos relacionados.
- Una factura vigente o cancelada protege la orden y las entidades que la contienen.
- Un repuesto usado en una orden no se puede eliminar.
- No existe una papelera: los borrados exitosos no se pueden deshacer desde la API.
