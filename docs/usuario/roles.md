# Roles y permisos

Cada cuenta del taller tiene un rol. La aplicación muestra u oculta secciones y acciones según el rol, y el servidor verifica lo mismo en cada pedido.

## Los tres roles

| Rol | Ve | Puede |
|---|---|---|
| **Admin** | Todo, incluidos **Historial** y **Usuarios** | Gestionar usuarios, ver el historial, cancelar facturas, eliminar pagos, crear y editar repuestos, ajustar stock. |
| **Recepción** | Inicio, Órdenes, Clientes, Repuestos, Facturas y Alertas | Clientes, motos, órdenes, facturación y pagos. No puede gestionar usuarios ni repuestos, ni cancelar facturas o eliminar pagos. |
| **Taller** | Inicio (Mi taller), Órdenes, Repuestos y Alertas | Operar sus órdenes asignadas: estado, diagnóstico y repuestos consumidos. |

Los permisos se aplican de punta a punta: si una acción no corresponde al rol, la aplicación no la muestra y el servidor la rechaza con `403` aunque se llame directamente a la API.

La primera cuenta que se registra en una base vacía queda como **Admin**; el registro público crea cuentas de **Recepción**. Los roles se gestionan después desde **Usuarios**.

## Gestionar usuarios (admin)

En **Usuarios**, tocá **+ Nuevo** para crear una cuenta (email, nombre, contraseña y rol). En cada tarjeta, el lápiz abre la edición: nombre, rol y el interruptor **Acceso activo**.

- Un usuario desactivado no puede iniciar sesión y, si tenía una sesión abierta, deja de poder operar en el siguiente pedido.
- No podés cambiar tu propio rol ni desactivar tu cuenta.
- Los cambios de rol tienen efecto inmediato al recargar o volver a entrar.

## Historial (admin)

El rol admin ve además la pantalla **Historial**, con todos los cambios registrados por la base. Ver [Historial](historial.md).
