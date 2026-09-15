# Facturas y pagos

## Facturar una orden

Botón **Nueva factura**. Elegís la orden —solo aparecen las que todavía no tienen factura, porque cada orden se factura una sola vez— y listo: los totales vienen calculados solos (mano de obra de la orden más los repuestos que consumió). No hay que tipear ningún importe.

Después se pueden editar las notas y la fecha de vencimiento, pero nunca los importes: salen siempre del sistema.

## Los estados

| Estado | Significa |
|---|---|
| **Pendiente** | Emitida, sin ningún pago registrado. |
| **Parcial** | Tiene al menos un pago pero resta saldo. |
| **Pagada** | Cobrada en su totalidad. |
| **Cancelada** | Anulada. No se puede cobrar ni editar. |

El estado lo calcula el sistema a partir de los pagos: no se cambia a mano. El filtro de arriba muestra solo las de un estado.

## Registrar pagos

Tocando la factura se abre su ficha, con el desglose (mano de obra, repuestos, total), lo ya pagado y el saldo. Para cobrar, se ingresa el monto —no puede superar el saldo— y el método (efectivo, transferencia o tarjeta). Se pueden registrar varios pagos parciales hasta saldarla; cada pago suma y el estado se actualiza solo. Un pago cargado por error se puede eliminar y el estado vuelve atrás.

## Cancelar

**Cancelar factura** la anula de forma definitiva: no se puede deshacer, no acepta más pagos y deja de contar en lo facturado del mes. Pide confirmación antes.