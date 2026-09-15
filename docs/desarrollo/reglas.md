# Reglas de negocio

Lo que el servidor garantiza, llame quien llame. El frontend las refleja (deshabilita, avisa, valida), pero nunca las reemplaza.

## Obligatorios y únicos

- `users`: email + password de 6+ caracteres. Email único.
- `clientes`: `nombre`. `motos`: `marca`. `repuestos`: `codigo` único (también al editar).
- `ordenes`: `cliente_id` + `moto_id` + `descripcion`. Al editar, la descripción sigue obligatoria pero cliente, moto y estado no se tocan por ese endpoint.
- `facturas`: `orden_id`, y una sola factura por orden (chequeo de aplicación, `409` si ya existe).
- `pagos`: `monto` mayor a cero.

## Estados

- **Orden** nace en `recibido`. `PATCH estado` acepta cualquier valor del enum hacia cualquier otro —no hay máquina de transiciones, solo vocabulario controlado (`recibido|en_progreso|esperando_repuestos|terminado|entregado`).
- **Factura**: `pendiente` (nada cobrado) → `parcial` → `pagada`, calculado como `pagado<=0 / pagado<total / else`. `cancelada` es terminal y se llega solo por `PATCH cancelar`: bloquea pagos nuevos y saca la factura de los totales. El `PUT` de factura solo toca notas y vencimiento.

## Dinero y stock

- Los totales de la factura se calculan al crear y no se recalculan ni se editan después.
- Agregar un repuesto a una orden congela el precio de venta vigente en la línea; quitar la línea devuelve el stock.
- El ajuste manual de stock no deja resultado negativo. Las operaciones que tocan dos tablas (línea + stock, pago + estado) van en transacción con `SELECT ... FOR UPDATE`: o se escribe todo o no se escribe nada.

## Borrados

Ver [Base de datos](base-de-datos.md#qué-pasa-al-borrar). Resumen operativo: sin factura en el camino, el borrado en cascada tiene éxito silencioso; con factura, `409` con mensaje que dice cuál. No hay borrado lógico ni papelera: lo borrado no vuelve.