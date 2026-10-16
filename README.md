# Calculadora Científica (fx-241)

Calculadora científica web tipo Casio, responsive y sin dependencias.
Funciona 100% en el navegador (HTML, CSS y JavaScript puro).

## Características

- Operaciones básicas: `+ − × ÷`
- Funciones científicas: `sin`, `cos`, `tan`, `log`, `ln`, `√`, `x²`, `xʸ`,
  `n!`, `%`, `1/x` (vía `^`), `π`, `e`
- **Notación científica**: `2e3` = `2000`, `1e+12`, `1e-7`; la `e` suelta sigue
  siendo la constante de Euler (`2e` = `2·e`)
- Modo de ángulo **DEG / RAD** conmutable
- Memoria de último resultado (`Ans`)
- **Memoria M1–M9**: `MC`, `MR`, `M+`, `M−`, `MS` operan sobre la ranura
  activa; el botón `M1…M9` de la cabecera cambia de ranura (indicador y
  persistencia por ranura)
- **Historial** de cálculos: clic para reutilizar el **resultado**, botón `↺` para
  reutilizar la **expresión** (persistente)
- **`%` configurable**: como **porcentaje** (`x/100`) o como **módulo** (`a % b`),
  con el botón de modo de la cabecera (indicador `MOD`)
- **Copiar resultado** al portapapeles (botón *Copiar*)
- **Fracciones** (salida): el botón `a/b` muestra el resultado como fracción
  simplificada cuando es exacta (`0.5 → 1/2`, `1.5 → 1 1/2`); si no, el decimal
- **Entrada de fracciones**: botón `Frac` abre un panel con parte entera,
  numerador y denominador; *Insertar* añade `(entero+num/den)` a la expresión
- **Variables A–F**: botón `Var` abre un panel; `STO` guarda el valor actual en
  una variable, `RCL` inserta su valor y tocar la letra la inserta en la
  expresión. (`A`–`F` en mayúscula son variables; `e` minúscula es el número de Euler.)
- **Teclas extra**: `1/x`, `|x|`, `x³`, `∛`
- **Bases numéricas**: entrada de literales `0x` (hex), `0b` (bin), `0o` (oct) y
  panel `Base` con la conversión dec/hex/oct/bin (clic en una fila inserta el literal)
- **Idiomas ES/EN**: botón en la barra; traduce textos, títulos, `aria-label` y avisos
- **Temas claro/oscuro** (detecta el sistema; conmutable y persistente)
- Evaluación segura mediante parser propio (sin `eval`)
- Soporte de teclado físico en escritorio
- Diseño adaptable a móvil
- Estado persistente con `localStorage` (memoria, historial, tema, `Ans`)

Ver `ROADMAP.md` para el plan de mejoras y correcciones pendientes.

## Uso

Abre `index.html` en cualquier navegador. No requiere instalación ni servidor.

Para servirlo en local (opcional):

```bash
python3 -m http.server 8080
# luego abre http://localhost:8080
```

## Soporte de teclado

| Tecla        | Acción            |
| ------------ | ----------------- |
| `0-9` `.`    | Escribir número   |
| `+ - ^ ( ) ! %` | Operadores     |
| `*` `/`      | Multiplicar/dividir |
| `= / Enter`  | Calcular          |
| `Backspace`  | Borrar            |
| `Esc`        | Limpiar           |
| `s` `c` `t`  | `sin(` `cos(` `tan(` |
| `l` `n`      | `log(` `ln(`      |
| `r` `p` `e`  | `√(` `π` `e`      |

Los paréntesis sin cerrar se completan automáticamente al calcular
(por ejemplo `(2+3` se evalúa como `(2+3)`). Los atajos se ignoran mientras
escribes en los campos del panel `Frac`.

## PWA (instalable y sin conexión)

La app es una PWA: se puede instalar y funciona **offline**.

- `manifest.json` define la app; `sw.js` es el *service worker* que cachea el
  shell (estrategia *stale-while-revalidate*).
- En Android/Chrome: menú → **Instalar aplicación** / **Añadir a pantalla de
  inicio**. Requiere servirse por **HTTPS** (GitHub Pages lo cumple). Abrir el
  archivo directamente con `file://` **no** habilita la PWA ni el service worker.
- Al cambiar los archivos, **sube la versión de `CACHE` en `sw.js`** (p. ej.
  `fx241-v3` → `fx241-v4`) para forzar la actualización del caché.

## Estructura

- `index.html` — interfaz y teclado
- `style.css` — apariencia tipo calculadora Casio
- `engine.js` — motor de cálculo (tokenizador + parser recursivo)
- `script.js` — lógica de la interfaz
- `i18n.js` — diccionarios de idioma (es/en)
- `manifest.json` / `sw.js` / `icon-*.png` — PWA
- `tools/gen-icons.js` — genera los iconos PNG (`node tools/gen-icons.js`)
- `test/` — pruebas (`node --test`)

## Pruebas

Requiere Node.js (solo para pruebas; la app no necesita Node).

```bash
node --test        # o: npm test
```

Cubre el motor (`test/engine.test.js`) y el arranque de la interfaz con un DOM
simulado (`test/ui.smoke.test.js`).

Prueba rápida manual del motor:

```bash
node -e 'const E=require("./engine.js"); console.log(E.evaluate("2+3*4","DEG"))'
```

## Licencia

MIT
