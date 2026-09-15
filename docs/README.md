# Documentación de Motek

Guías para usar el sistema, consumir la API y trabajar en el código.

## Índice

- [Manual de usuario](usuario/README.md) — cómo se usa cada pantalla: tablero, órdenes, clientes, repuestos, facturas y alertas.
- [Referencia de la API](api/README.md) — endpoints, autenticación, errores y ejemplos.
- [Guía de desarrollo](desarrollo/README.md) — arquitectura, base de datos, decisiones de diseño y cómo extender el sistema.

## El sistema en una frase

Motek gestiona el taller de punta a punta: el cliente trae la moto, se abre una orden de trabajo, se cargan los repuestos que consume (el stock baja solo), se emite la factura con los totales ya calculados y se registran los pagos hasta saldarla.

Cada parte vive en su propia guía: si algo no está explicado acá, está explicado allá.