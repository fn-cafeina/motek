# Documentación de Motek

Documentación para usar el sistema, consumir la API y trabajar en el código.

## Índice

- [Manual de usuario](usuario/README.md) — cuentas, navegación y operación diaria del taller.
- [Referencia de la API](api/README.md) — endpoints, autenticación, contratos, errores y CORS.
- [Guía de desarrollo](desarrollo/README.md) — arquitectura, configuración, base de datos, reglas, frontend, diseño y pruebas.

## Qué resuelve el sistema

Motek acompaña una orden desde que entra la moto hasta que se factura y se cobra. El cliente, la moto, los repuestos consumidos y los pagos quedan relacionados; el stock se descuenta al agregar repuestos a una orden y los totales de la factura los calcula el servidor.

## Antes de empezar

Seguí el [inicio rápido del README principal](../README.md) para levantar MySQL, la API y la aplicación Expo. La configuración de red y las variables de entorno están en [Configuración](desarrollo/configuracion.md).
