# Alertas de stock

La pantalla muestra los repuestos que necesitan reposición. Un repuesto aparece cuando `stock` es menor o igual que `stock_minimo`; el backend los ordena de menor a mayor stock.

## Buscar y actualizar

El buscador filtra por código o nombre. La pantalla muestra la cantidad de resultados o de alertas y tiene **Actualizar**. También podés deslizar hacia abajo para recargar.

La campana del encabezado es un acceso directo a esta pantalla, pero no muestra un contador de alertas.

## Ajustar desde una alerta

En cada tarjeta, tocá **Surtir** para abrir el ajuste. Ingresá una cantidad distinta de cero:

- Positiva: agrega unidades al stock.
- Negativa: descuenta unidades.

Después de aplicar el cambio, la lista se actualiza y el repuesto sale de las alertas si supera su mínimo. Si el ajuste intenta dejar el stock negativo, el servidor rechaza la operación.

Cuando no hay repuestos en alerta, la pantalla muestra **Todo en stock**. Si la búsqueda no encuentra coincidencias, ofrece limpiar la búsqueda.
