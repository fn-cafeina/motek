# Repuestos

El inventario del taller: qué hay, cuánto vale y cuánto queda.

## Cargar un repuesto

Botón **Nuevo repuesto**. Lo único obligatorio es el **código** (por ejemplo `FIL-001`): tiene que ser único, no puede haber dos repuestos con el mismo código. Además se cargan nombre, categoría, ubicación en el taller (por ejemplo `Estante A1`), precio de compra, precio de venta, stock inicial y **stock mínimo** (por defecto 5).

El stock mínimo es el que dispara las [alertas](alertas.md): cuando el stock llega a ese número o baja más, el repuesto aparece como crítico.

## Buscar y filtrar

El buscador filtra por nombre o código. El botón **Stock bajo** muestra solo los que están en el mínimo o por debajo; se puede combinar con la búsqueda. **Limpiar filtros** vuelve a mostrar todo.

## Ajustar el stock

Cada fila tiene un botón para ajustar el stock (el del paquete). Sirve para la entrada de mercadería o para corregir diferencias del conteo: se ingresa una cantidad **positiva para sumar** o **negativa para restar**. El sistema no deja que el stock quede en negativo.

Ojo: esto es movimiento manual. El consumo normal —un repuesto usado en una orden— descuenta solo, desde la [ficha de la orden](ordenes.md#la-ficha-de-la-orden).

## Precios

La tabla muestra el **precio de venta**. El de compra sirve para conocer el costo, pero lo que se cobra en una factura sale del precio de venta vigente al momento de agregar el repuesto a la orden.

## Eliminar

Un repuesto que ya se usó en alguna orden no se puede eliminar (aparece "repuesto en uso"). Es para no romper el historial de las órdenes que lo consumieron.