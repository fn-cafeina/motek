# Órdenes de trabajo

Una orden representa el trabajo de una moto en el taller y concentra el diagnóstico, la mano de obra y los repuestos consumidos.

## Abrir una orden

Tocá **Nueva orden**, elegí un cliente y después una de sus motos. La descripción es obligatoria; también podés cargar diagnóstico, total de mano de obra y notas. La orden nace en estado **Recibido** y la fecha de recepción la asigna el servidor.

La pantalla no ofrece cargar `fecha_entrega`; el campo existe en el modelo, pero no tiene un control de edición en la aplicación.

## Filtrar y editar

La lista tiene filtros **Todas** y los cinco estados: **Recibido**, **En progreso**, **Esperando repuestos**, **Terminado** y **Entregado**. El filtro se refleja en la URL, por ejemplo `/ordenes?estado=terminado`.

Cada tarjeta permite abrir el detalle, **Editar** y **Eliminar**. El formulario de edición permite cambiar descripción, diagnóstico, mano de obra y notas; el cliente, la moto y el estado no se cambian desde ese formulario.

## Ficha y estados

Tocar una tarjeta abre una hoja modal desde abajo con la orden, el cliente, la moto, el diagnóstico, las notas y los repuestos. El estado se cambia desde un selector dentro de la ficha, no desde cada fila de la lista.

| Estado | Significa |
|---|---|
| **Recibido** | Entró al taller y todavía no se ha trabajado. |
| **En progreso** | Se está trabajando. |
| **Esperando repuestos** | El trabajo está frenado por falta de un repuesto. |
| **Terminado** | El trabajo está listo para entregar. |
| **Entregado** | La moto fue devuelta. |

El estado puede cambiar directamente a cualquiera de los valores válidos; la aplicación no impone una progresión obligatoria.

## Agregar y quitar repuestos

En la ficha, elegí un repuesto y una cantidad mayor que cero para agregarlo. El servidor descuenta el stock y conserva el precio de venta del momento como precio unitario. Si no hay stock, no se agrega la línea. Quitar una línea devuelve el stock, pero el precio de venta de la orden no se recalcula.

La ficha muestra el subtotal y el total de las líneas de repuestos. La mano de obra se muestra aparte.

## Actualizar y eliminar

Deslizá hacia abajo para recargar la lista. Al eliminar una orden, la interfaz pide confirmación y avisa que se eliminará la orden. Si la orden tiene cualquier factura —también cancelada—, la interfaz la bloquea antes de llamar a la API. Cancelar esa factura no cambia esa restricción.

La pantalla muestra un error si la orden o la moto ya no existe o si el cambio fue rechazado por el servidor.
