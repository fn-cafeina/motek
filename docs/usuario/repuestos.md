# Repuestos

La pantalla de repuestos administra el inventario, los precios y el control de stock.

## Cargar o editar un repuesto

Tocá **Nuevo** o el ícono de edición de una tarjeta. La aplicación exige **código** y **nombre**; el código debe ser único. También podés cargar descripción, categoría, ubicación, precio de compra, precio de venta, stock y stock mínimo. El valor inicial de stock mínimo es 5.

El código se usa para identificar el repuesto. El nombre y la categoría aparecen en la tarjeta; la descripción y el resto de los datos se cargan en el formulario.

## Buscar y filtrar

El buscador filtra por nombre, código o categoría. **Solo stock bajo** limita la lista a los repuestos cuyo stock es menor o igual a su mínimo. La pantalla muestra `resultados de total` y tiene un botón **Actualizar** para recargar.

Cuando la búsqueda o el filtro deja la lista vacía, aparece **Limpiar filtros** dentro del estado vacío. No es un botón permanente junto al buscador.

## Ajustar stock

El ícono de paquete abre el ajuste de stock. Ingresá una cantidad distinta de cero:

- Positiva: suma unidades.
- Negativa: descuenta unidades.

El endpoint de ajuste no acepta un resultado negativo y muestra `stock no puede ser negativo`. La pantalla de edición, en cambio, permite escribir el campo `stock` directamente y lo reemplaza al guardar; revisá el valor antes de confirmar cambios.

El consumo normal de una orden se registra desde la [ficha de la orden](ordenes.md) y descuenta stock automáticamente.

## Precios

Cada tarjeta muestra el precio de venta y el stock actual frente al mínimo. El precio de compra queda disponible en el formulario como referencia de costo. El precio que se usa al agregar un repuesto a una orden es el precio de venta vigente en ese momento.

## Eliminar

El ícono de papelera pide confirmación. Si el repuesto ya fue usado en alguna orden, el backend lo rechaza para no romper el historial y muestra `repuesto en uso`.

Deslizá hacia abajo para recargar la lista.
