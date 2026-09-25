# Facturas y pagos

## Crear una factura

Tocá **Nueva factura**. El selector ofrece únicamente órdenes en estado **Entregado** que todavía no tienen ninguna factura asociada, incluso si una factura anterior fue cancelada.

El servidor calcula los importes: suma la mano de obra de la orden y el subtotal de sus repuestos. No se escriben a mano los importes de la factura.

## Editar y filtrar

Desde la tarjeta de una factura se puede abrir **Editar**. Solo se modifican las notas y la fecha de vencimiento; los importes y el estado no se escriben desde ese formulario. La fecha de vencimiento se carga como texto con formato `AAAA-MM-DD`.

Los filtros **Todas**, **Pendiente**, **Parcial**, **Pagada** y **Cancelada** se aplican en la pantalla. Deslizá hacia abajo para recargar.

## Estados

| Estado | Significa |
|---|---|
| **Pendiente** | No tiene pagos registrados. |
| **Parcial** | Tiene pagos, pero el total pagado es menor al total. |
| **Pagada** | El total pagado alcanza el total de la factura. |
| **Cancelada** | La factura fue anulada desde la pantalla. |

El estado se recalcula después de registrar o borrar pagos. El total de una factura con valor cero queda pendiente y no puede recibir un pago positivo.

## Registrar y eliminar pagos

Abrí una factura para ver mano de obra, repuestos, total, pagado y saldo. Para cobrar, ingresá un monto mayor que cero y elegí **efectivo**, **transferencia** o **tarjeta**. El monto no puede superar el saldo. Se pueden registrar varios pagos parciales.

Cada pago se puede eliminar desde el detalle. La pantalla vuelve a consultar la factura y su lista de pagos después de la operación.

## Cancelar

**Cancelar factura** pide confirmación y cambia el estado a `cancelada`. No se ofrece una eliminación de facturas y una factura cancelada sigue contando como existente para el orden: no se puede volver a facturar esa misma orden.

**Limitación actual:** el diálogo describe la cancelación como irreversible, pero el backend y la interfaz todavía permiten editar notas/vencimiento y eliminar pagos de una factura cancelada. Eliminar un pago recalcula el estado y puede dejarla nuevamente pendiente, parcial o pagada. No dependas de la cancelación como una operación irreversible hasta que el comportamiento cambie.

Después de una cancelación, la factura queda excluida del cálculo de **Facturado este mes** y del resumen de facturas pendientes o parciales, salvo que una operación posterior vuelva a cambiar su estado.
