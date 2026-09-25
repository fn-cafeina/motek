# Clientes y motos

## Registrar un cliente

En **Clientes**, tocá **+ Nuevo**. El nombre es obligatorio. También podés cargar teléfono, email, dirección y notas; los campos no obligatorios pueden completarse o editarse más tarde.

## Buscar clientes

El buscador filtra la lista por nombre, teléfono o email mientras escribís. No hay un contador de resultados ni un botón de limpieza junto al campo: para volver a ver todos, borrá el texto o actualizá la pantalla.

## Ver y administrar motos

Tocá cualquier fila de cliente para expandirla. La fila muestra la cantidad de motos y permite abrir la lista de vehículos. Dentro, **Editar cliente** y **Eliminar cliente** aparecen al final; también podés editar o eliminar cada moto.

Para sumar una moto, tocá **Agregar**. El formulario permite cargar marca, modelo, año, placa, color, VIN y kilometraje. La marca es el único campo que la aplicación exige para guardar. La lista resumida muestra marca, modelo y los datos disponibles de placa, color y año; el VIN y el kilometraje se cargan o ven en el formulario.

Un cliente puede tener varias motos. Cada orden nueva se asocia a una moto puntual; al editar una orden, el cliente y la moto quedan fijados.

## Actualizar

Deslizá la lista hacia abajo para volver a cargar clientes y motos. El botón **+ Nuevo** sigue disponible durante la actualización.

## Eliminar

Eliminar un cliente o una moto pide confirmación. Sin facturas en la cadena, el backend puede eliminar también motos, órdenes y líneas relacionadas.

Si existe cualquier factura asociada a la orden, incluso una factura cancelada, el backend rechaza el borrado para proteger el historial. En ese caso la interfaz muestra el error; cancelar la factura no libera el borrado y no hay una acción de “resolver facturas” que lo haga.

No hay una papelera: un borrado exitoso no se puede recuperar desde la aplicación.
