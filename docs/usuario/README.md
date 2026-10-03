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
9. [Roles y permisos](roles.md) — qué ve y qué puede hacer cada cuenta.
10. [Historial](historial.md) — quién hizo qué (solo admin).

## Navegación

Las secciones visibles dependen del rol: el **Taller** ve Inicio, Órdenes, Repuestos y Alertas; **Recepción** suma Clientes y Facturas; **Admin** ve además **Historial** y **Usuarios** en el grupo Sistema. El detalle está en [Roles y permisos](roles.md).

En computadora de escritorio aparece un sidebar con esas secciones agrupadas en **Taller**, **Administración** y **Sistema**. Puede contraerse con el botón del pie.

En pantallas angostas, la barra inferior muestra hasta cinco secciones y un botón **Más** con el resto. El encabezado muestra el nombre de la sección y una campana que lleva a **Alertas**; la campana no muestra una cantidad de notificaciones.

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
