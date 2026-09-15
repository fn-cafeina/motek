# Órdenes de trabajo

El corazón del sistema: todo lo que entra al taller pasa por una orden.

## Abrir una orden

Botón **Nueva orden**. Elegís el cliente y, una vez elegido, su moto (la lista se filtra sola). Completás la descripción del trabajo —lo único obligatorio además del cliente y la moto— y opcionalmente el diagnóstico, la mano de obra estimada y notas. La orden nace en estado **Recibido**.

## Los estados

Una orden avanza por estos estados, en este orden habitual:

| Estado | Significa |
|---|---|
| **Recibido** | Entró al taller, todavía no se tocó. |
| **En progreso** | Se está trabajando. |
| **Esperando repuestos** | Frenada porque falta un repuesto. |
| **Terminado** | El trabajo está hecho, listo para entregar. |
| **Entregado** | Se devolvió la moto. Fin del recorrido. |

El estado se cambia desde la lista (el desplegable de cada fila) o desde la ficha. El filtro de arriba —que también vive en la dirección, por ejemplo `/ordenes?estado=terminado`— muestra solo las de un estado.

## La ficha de la orden

Tocando el trabajo se abre la ficha lateral con todo: cliente, moto, mano de obra, diagnóstico, notas y **los repuestos**. Acá se agregan los repuestos que consume el trabajo: elegís el repuesto y la cantidad, y el sistema descuenta del stock en el acto (al precio de venta actual, que queda fijo en la orden aunque el precio cambie después). Si no hay stock, avisa y no deja agregarlo. Quitar un repuesto de la orden devuelve el stock.

Abajo se ve el **total de repuestos** sumado automáticamente.

## Eliminar

Eliminar una orden pide confirmación. Si ya tiene factura emitida, no se puede eliminar —igual que los clientes— y el sistema lo explica en el momento.