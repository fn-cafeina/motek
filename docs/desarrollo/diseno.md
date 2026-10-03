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

Los breakpoints son los por defecto de Tailwind: `sm` 640, `md` 768, `lg` 1024 y `xl` 1280 px. El estilo responsivo se escribe con clases de UniWind (`md:px-6`, `lg:justify-center`), que en nativo se resuelven contra el ancho de pantalla. Lo que no se puede resolver con clases —montar sidebar o barra inferior, `numColumns`, `animationType`— sale de `app/src/lib/breakpoints.ts`, que exporta `BP` y `useBreakpoint()` con esos mismos umbrales.

- El shell cambia a sidebar a partir de 1024 px (`lg`).
- El contenido del shell vive en un contenedor de `max-w-[1360px]` centrado, con padding horizontal de 16 px que sube a 24 px (`md:px-6`) y 32 px (`xl:px-8`). El padding horizontal se administra en el shell; las pantallas solo manejan el vertical.
- El encabezado del shell mide 52 px y usa el mismo contenedor centrado; el sidebar expandido usa `w-56` y el colapsado `w-16`.
- Clientes, Repuestos, Facturas y Alertas pasan a 2 columnas (`numColumns`) a partir de `md`; Órdenes, Usuarios e Historial quedan en una sola.
- Las fichas de orden y factura y el selector de `SelectField` son bottom sheets en móvil y diálogos centrados (`lg:justify-center`, `max-w-2xl`) en escritorio. `Dialog` se centra en todos los tamaños y se ensancha con `lg:max-w-lg`.
- Las pantallas usan `FlatList`, `ScrollView`, `Dialog` y modales; el contenido de las fichas se limita con `max-h-[92%]` (`lg:max-h-[85%]` en escritorio) o `max-h-[85vh]`.
- `BarChart` mide su contenedor con `onLayout` y dibuja en píxeles reales para que el texto no se escale; `DonutChart` recibe `size` según el breakpoint.
- No hay una tabla web global.
- La barra inferior móvil usa `flex-row`, iconos de 19 px y etiquetas de 10 px con `numberOfLines={1}`; no es una altura fija global.

## Convenciones para componentes

1. Usá tokens semánticos y respetá el contraste entre `fg`, `muted` y `subtle`.
2. Revisá la variante clara y la oscura cuando agregues un color o una separación.
3. Conservá etiquetas visibles para acciones de ícono; los estados no deben depender exclusivamente del color.
4. Usá `Button` para acciones principales y `Dialog`/`Modal` para formularios y fichas.
5. Mantené el diseño mobile-first: probá el ancho pequeño, el área segura y el desplazamiento de listas largas.

La primitiva `Field` contiene actualmente un color literal para el placeholder (`#9ca3af`), por lo que la regla de “solo tokens” es una convención para los nuevos estilos y no una garantía automática de todos los componentes.
