# Autenticación

JWT HS256 con 24 horas de vigencia. El secreto vive en `JWT_SECRET` (ver [Configuración](../desarrollo/configuracion.md)). El logout es del lado del cliente: borrar el token.

## Registrar

```http
POST /api/auth/register
Content-Type: application/json

{"email": "taller@motek.com", "password": "secreto123"}
```

→ `201 {"id": 1, "email": "taller@motek.com"}`

La contraseña se guarda con bcrypt, nunca en texto plano. Mínimo 6 caracteres (`400 "password debe tener al menos 6 caracteres"`). Si el email ya existe, `409 "email ya existe"`.

## Entrar

```http
POST /api/auth/login
Content-Type: application/json

{"email": "taller@motek.com", "password": "secreto123"}
```

→ `200 {"token": "eyJhbGciOi..."}`

Credenciales incorrectas (o usuario inexistente, a propósito sin distinguir): `401 "credenciales invalidas"`.

## Usar el token

En cada request a `/api/*`:

```http
Authorization: Bearer <token>
```

| Situación | Respuesta |
|---|---|
| Sin header | `401 "token requerido"` |
| Header sin formato `Bearer` | `401 "formato de token invalido"` |
| Token vencido, firmado con otro secreto o malformado | `401 "token invalido"` |

## Quién soy

```http
GET /api/auth/me
```

→ `200 {"id": 1, "email": "taller@motek.com", "creado_en": "..."}` (nunca incluye la contraseña).