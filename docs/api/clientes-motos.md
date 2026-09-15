# Clientes y motos

## Clientes

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/clientes` | Lista todo, del más nuevo al más viejo. |
| POST | `/api/clientes` | `nombre` obligatorio → `400 "nombre es requerido"`. |
| GET | `/api/clientes/{id}` | `404 "cliente no encontrado"`. |
| PUT | `/api/clientes/{id}` | Reemplaza todos los campos; `nombre` obligatorio. |
| DELETE | `/api/clientes/{id}` | `204`. Si tiene facturas emitidas → `409`. |

```bash
curl -X POST http://localhost:8080/api/clientes \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"nombre":"Marcos Herrera","telefono":"11 4523-8890","email":"marcos.herrera@gmail.com"}'
# → 201 {"id":1,"nombre":"Marcos Herrera",...}
```

Un cliente:

```json
{"id":1,"nombre":"Marcos Herrera","telefono":"11 4523-8890","email":"marcos.herrera@gmail.com","direccion":"","notas":"","creado_en":"2026-09-15T10:00:00Z"}
```

### Por qué a veces no se puede borrar

Borrar un cliente borra en cascada sus motos y sus órdenes. Pero si alguna de esas órdenes tiene factura emitida, la base lo frena y la API devuelve `409 "no se puede eliminar: el cliente tiene facturas emitidas"`. Es intencional: una factura es un documento y no puede quedar colgando de nada. El [modelo de datos](../desarrollo/base-de-datos.md) explica las cascadas exactas.

## Motos

Las motos siempre pertenecen a un cliente: el `cliente_id` sale de la ruta, no del cuerpo.

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/motos` | Todas las motos. |
| GET | `/api/clientes/{id}/motos` | Las de un cliente. |
| POST | `/api/clientes/{id}/motos` | `marca` obligatoria → `400 "marca es requerida"`. Cliente inexistente → `404`. |
| GET | `/api/motos/{id}` | `404 "moto no encontrada"`. |
| PUT | `/api/motos/{id}` | `marca` obligatoria. |
| DELETE | `/api/motos/{id}` | `204`. Si tiene facturas emitidas → `409 "no se puede eliminar: la moto tiene facturas emitidas"`. |

```bash
curl -X POST http://localhost:8080/api/clientes/1/motos \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"marca":"Honda","modelo":"Wave 110","anio":2021,"placa":"AB 123 CD"}'
```

Una moto:

```json
{"id":1,"cliente_id":1,"marca":"Honda","modelo":"Wave 110","anio":2021,"placa":"AB 123 CD","color":"","vin":"","kilometraje":0,"creado_en":"2026-09-15T10:00:00Z"}
```