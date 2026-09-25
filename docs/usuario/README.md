# Manual de usuario

Motek acompaña el trabajo diario de un taller de motocicletas: clientes, motos, órdenes, repuestos, facturas y pagos.

## Índice

1. [Entrar al sistema](cuentas.md) — crear una cuenta, iniciar sesión y cerrarla.
2. [Navegación](#navegación) — encontrar las secciones en escritorio y móvil.
3. [Tablero](tablero.md) — el estado del taller de un vistazo.
4. [Clientes y motos](clientes.md) — directorio y vehículos.
5. [Órdenes de trabajo](ordenes.md) — seguimiento de cada trabajo.
6. [Repuestos](repuestos.md) — inventario, precios y ajustes.
7. [Facturas y pagos](facturas.md) — emitir, cobrar y cancelar.
8. [Alertas de stock](alertas.md) — reposición de repuestos.

## Navegación

En computadora de escritorio aparece un sidebar con las secciones **Inicio**, **Órdenes**, **Clientes**, **Repuestos**, **Facturas** y **Alertas**. Puede contraerse con el botón del pie.

En pantallas angostas, las mismas seis secciones aparecen en una barra inferior. El encabezado muestra el nombre de la sección y una campana que lleva a **Alertas**; la campana no muestra una cantidad de notificaciones.

## El recorrido típico

```text
Cliente nuevo → se registra con su moto
      ↓
Se abre una orden (recibido)
      ↓
Se diagnostica y se avanza (en progreso)
      ↓
Se agregan repuestos (el stock baja)
      ↓
Se termina y se entrega (terminado → entregado)
      ↓
Se factura una orden entregada (pendiente → parcial → pagada)
```

Los estados visibles dependen de la pantalla y de los pagos registrados. El servidor conserva el historial de las operaciones; algunas acciones tienen restricciones documentadas en cada capítulo.
