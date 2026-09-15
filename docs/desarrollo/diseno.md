# Sistema visual

Vive en `frontend/src/index.css` (tokens y escalas), `buttonStyles.ts` e `inputStyles.ts`. La regla madre: **los tokens se declaran por rol, no por color** (`surface`, `primary`, `accent`), y el tema oscuro los reescribe. Los componentes nunca hardcodean un hexadecimal.

## Significado de los colores

Azul = "esto se toca", naranja = "esto requiere que mires", gris = "esto ya está". El naranja nunca supera ~10% de la superficie; si todo es urgente, nada es urgente.

| Rol | Claro | Oscuro | Uso |
|---|---|---|---|
| `primary` | `#1e4e8c` | `#5695e0` | Acciones, links, seleccionado. |
| `accent` | `#b23c0b` | `#fb923c` | Stock bajo, alertas, "esperando repuestos". Reservado a lo que exige atención. |
| `ok` | `#0f6b32` | `#3fb950` | Pagada, terminado, éxito. |
| `danger` | `#b91c1c` | `#f85149` | Borrar, errores. |
| `info` | `#0b6ba8` | `#4aa8d8` | Recibido, parcial, avisos neutros. |
| `canvas/surface/raised` | `#f6f7f9/#fff/#f1f3f7` | `#0e1116/#161b22/#1c222b` | Fondo, tarjetas, hundidos. |

Cada tono tiene su variante `soft` (fondo de chip) y los textos son `fg/muted/subtle` (principal, secundario, terciario). Las etiquetas de estado llevan punto además de color: nunca solo color.

## Escalas

Escritas como norma en `index.css`. Lo que no está en la lista es un error, no una decisión: si hace falta un valor nuevo, se agrega primero acá.

- **Espaciado**: 2 (gaps densos) · 6 (chips, botones de fila) · 8 (controles) · 12 (filas, toolbars) · 16 (padding de superficie, ritmo entre bloques) · 24 (secciones).
- **Radios**: 6px controles (`rounded-md`) · 10px superficies (`rounded-lg`) · `full` solo puntos e indicadores.
- **Iconos**: 14px acciones en filas · 16px botones, avisos y vacíos · 20px navegación y topbar.
- **Tipografía**: 12 · 13 · 15 · 20 · 26. La micro (10–11px) solo donde no hay espacio (etiqueta de grupo del sidebar, barra móvil).

Shell: header 52px, sidebar 14rem (4rem colapsado), barra móvil 64px, contenido máximo 1360px. Capas: header 10, diálogos 50, toasts 100. Foco global único (`:focus-visible` con outline de 2px); los componentes no dibujan anillo propio.

## Temas

Claro/Oscuro/Según el sistema, con persistencia en `localStorage` (`motek_theme`) y un script pre-pintado en `index.html` que evita el destello. Se cambia desde el menú de cuenta del topbar.

## Agregar un componente

1. Usá tokens (`bg-surface`, `text-muted`, `border-border`), nunca valores literales.
2. Respetá las escalas: si el padding que querés no está en la lista, probablemente el diseño está mal, no la lista.
3. Toda tabla necesita su `MobileList`; todo color de estado necesita su punto o icono; todo icono necesita su `aria-label` o `aria-hidden`.
4. Revisá en oscuro antes de darlo por hecho: si agregaste un tono nuevo, agregalo en los dos temas.