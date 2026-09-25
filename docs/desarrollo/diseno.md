# Sistema visual

Los estilos viven en `app/src/global.css`, que importa Tailwind CSS y UniWind. `app/metro.config.js` conecta ese archivo con Metro.

## Tokens

`global.css` define variantes `light` y `dark` para los roles principales:

| Rol | Claro | Oscuro | Uso típico |
|---|---|---|---|
| `canvas` | `#f6f7f9` | `#0e1116` | Fondo de la pantalla. |
| `surface` | `#ffffff` | `#161b22` | Tarjetas, diálogos y superficies. |
| `raised` | `#f1f3f7` | `#1c222b` | Estados presionados y superficies secundarias. |
| `primary` | `#1e4e8c` | `#5695e0` | Acciones y navegación activa. |
| `accent` | `#b23c0b` | `#fb923c` | Stock bajo y situaciones que requieren atención. |
| `ok` | `#0f6b32` | `#3fb950` | Éxito y estados terminales positivos. |
| `danger` | `#b91c1c` | `#f85149` | Errores y acciones destructivas. |
| `info` | `#0b6ba8` | `#4aa8d8` | Estados informativos. |
| `fg` / `muted` / `subtle` | `#12161c` / `#4d5563` / `#656d7a` | `#e6eaf0` / `#a5b0bf` / `#808b9a` | Jerarquía de texto. |

Los roles tienen variantes `soft` para fondos, además de `border` y `border-strong`. Las pantallas suelen usar clases como `bg-canvas`, `bg-surface`, `text-fg`, `text-muted` y `text-accent` en lugar de elegir colores directamente.

## Tema

La aplicación fuerza el tema del sistema:

- `app/src/app/_layout.tsx` llama `Uniwind.setTheme("system")`.
- `app.json` declara `userInterfaceStyle: "automatic"`.
- No hay selector claro/oscuro, clave `motek_theme` ni script de prepintado web.

Cuando agregues un color, definí el comportamiento de los dos temas y usá el rol semántico correspondiente. Evitá depender de una captura de pantalla de una sola variante.

## Responsive y capas

- El shell cambia a sidebar a partir de 900 px de ancho.
- El encabezado del shell mide 52 px; el sidebar expandido usa `w-56` y el colapsado `w-16`.
- Las pantallas usan `FlatList`, `ScrollView`, `Dialog` y modales; el contenido de las fichas se limita con `max-h-[92%]` o `max-h-[85vh]`.
- No hay una tabla web global ni una regla de ancho máximo de 1360 px en el shell.
- La barra inferior móvil usa `flex-row`, iconos de 19 px y etiquetas de 10 px; no es una altura fija global.

## Convenciones para componentes

1. Usá tokens semánticos y respetá el contraste entre `fg`, `muted` y `subtle`.
2. Revisá la variante clara y la oscura cuando agregues un color o una separación.
3. Conservá etiquetas visibles para acciones de ícono; los estados no deben depender exclusivamente del color.
4. Usá `Button` para acciones principales y `Dialog`/`Modal` para formularios y fichas.
5. Mantené el diseño mobile-first: probá el ancho pequeño, el área segura y el desplazamiento de listas largas.

La primitiva `Field` contiene actualmente un color literal para el placeholder (`#9ca3af`), por lo que la regla de “solo tokens” es una convención para los nuevos estilos y no una garantía automática de todos los componentes.
