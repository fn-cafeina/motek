# Historial (admin)

La pantalla **Historial** muestra quién hizo qué en el taller. Cada cambio en clientes, motos, órdenes, repuestos, facturas y pagos queda registrado automáticamente por la base de datos.

## Qué muestra

Cada tarjeta indica:

- Quién hizo el cambio (nombre o email) y cuándo.
- La acción: **creó**, **editó** o **borró**.
- El registro afectado, por ejemplo `orden #16`.
- En las ediciones, los campos que cambiaron con su valor anterior y nuevo (`estado: recibido → en_progreso`).

Los eventos se agrupan por día, del más reciente al más antiguo.

## Filtros

- **Tabla**: órdenes, clientes, motos, repuestos, facturas, pagos o repuestos de orden.
- **Usuario**: una cuenta puntual.
- **7 días / 30 días / 90 días / Todo**: ventana de tiempo.

Si llegaste desde **Ver historial de la orden**, aparece una etiqueta con el registro filtrado que podés quitar con la X.

## Cómo llegar

- Desde el menú lateral, **Historial** (solo admin).
- Desde la ficha de una orden: **Ver historial de la orden**.

Deslizá hacia abajo para recargar la lista.
