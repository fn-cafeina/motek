# Clientes y motos

Todas las rutas de este capítulo requieren un token Bearer, salvo que se indique lo contrario.

## Clientes

| Método | Ruta | Comportamiento |
|---|---|---|
| `GET` | `/api/clientes` | Lista clientes de más nuevo a más viejo. |
| `POST` | `/api/clientes` | Crea un cliente; `nombre` es obligatorio. Responde `201`. |
| `GET` | `/api/clientes/{id}` | Obtiene un cliente. Responde `404 "cliente no encontrado"` si no existe. |
| `PUT` | `/api/clientes/{id}` | Reemplaza los datos editables; `nombre` sigue siendo obligatorio. |
| `DELETE` | `/api/clientes/{id}` | Responde `204`; una factura en la cadena puede producir `409`. |

Ejemplo:

```bash
curl -X POST http://localhost:8080/api/clientes \
  -H "Authorization: Bearer <token>" \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Marcos Herrera","telefono":"11 4523-8890","email":"marcos.herrera@example.com"}'
```

Objeto de ejemplo:

```json
{"id":1,"nombre":"Marcos Herrera","telefono":"11 4523-8890","email":"marcos.herrera@example.com","direccion":"","notas":"","creado_en":"2026-09-15T10:00:00Z"}
```

La respuesta de creación incluye el recurso, pero puede no incluir el `creado_en` generado por la base. Hacé un GET si necesitás leerlo.

### Borrado y facturas

Borrar un cliente intenta eliminar en cascada sus motos y órdenes. Si alguna orden tiene una factura asociada, la base bloquea la operación y la API responde `409` con un mensaje como `no se puede eliminar: el cliente tiene facturas emitidas`. La factura puede estar cancelada: el esquema no la excluye de la restricción.

## Motos

Las motos pertenecen al cliente indicado en la ruta; el `cliente_id` no se acepta como campo libre.

| Método | Ruta | Comportamiento |
|---|---|---|
| `GET` | `/api/motos` | Lista todas las motos. |
| `GET` | `/api/clientes/{id}/motos` | Lista las motos de un cliente. |
| `POST` | `/api/clientes/{id}/motos` | Crea una moto; `marca` es obligatoria. Cliente inexistente → `404`. |
| `GET` | `/api/motos/{id}` | Obtiene una moto. |
| `PUT` | `/api/motos/{id}` | Actualiza la moto; `marca` es obligatoria. |
| `DELETE` | `/api/motos/{id}` | Responde `204`; una factura asociada puede producir `409`. |

Ejemplo:

```bash
curl -X POST http://localhost:8080/api/clientes/1/motos \
  -H "Authorization: Bearer <token>" \
  -H 'Content-Type: application/json' \
  -d '{"marca":"Honda","modelo":"Wave 110","anio":2021,"placa":"AB 123 CD"}'
```

Objeto de ejemplo:

```json
{"id":1,"cliente_id":1,"marca":"Honda","modelo":"Wave 110","anio":2021,"placa":"AB 123 CD","color":"","vin":"","kilometraje":0,"creado_en":"2026-09-15T10:00:00Z"}
```

La API no exige que la moto tenga una sola orden: puede asociarse a varias. Al crear o editar una orden, el backend valida las claves foráneas.
