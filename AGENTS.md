# AGENTS.md

Instrucciones del proyecto para OpenCode.

## Proyecto

Calculadora científica web (tipo Casio fx-241). Sitio estático:
HTML + CSS + JavaScript puro, sin dependencias ni build.

## Comandos

- Servir en local: `python3 -m http.server 8080`
- Pruebas: `node --test` (o `npm test`). Cubren motor y arranque de UI.
- Verificar sintaxis: `node --check engine.js && node --check script.js && node --check sw.js`
- Regenerar iconos PWA: `node tools/gen-icons.js`
- No hay lint configurado.

## Convenciones del motor

- Variables: `A`–`F` en **mayúscula**; `e` (minúscula) es el número de Euler y
  `pi`/`π` la constante pi. `evaluate(src, angle, percentMode, vars)`.
- Bases: literales `0x` (hex), `0b` (bin), `0o` (oct). `toBase(n, base)`.
- Notación científica `NeM` pegada a un número (`2e3` = 2000, `1e-7`); la `e`
  suelta sigue siendo la constante de Euler (`2e` = `2·e`).

## i18n

- Idiomas en `i18n.js` (`window.I18N.get(lang, key)`). El HTML usa atributos
  `data-i18n`, `data-i18n-title`, `data-i18n-aria`, `data-i18n-ph`.
- Toda clave nueva debe existir en **es y en**; hay una prueba que lo verifica.

## PWA

- Al modificar `index.html`, `style.css`, `engine.js` o `script.js`, subir la
  versión de `CACHE` en `sw.js` para invalidar el caché del service worker.

## Estructura

- `index.html` — interfaz y botones
- `style.css` — estilos
- `engine.js` — motor de cálculo (parser). Funciones puras, testeable en Node.
- `script.js` — lógica de la interfaz (DOM)

## Convenciones

- No introducir dependencias ni frameworks.
- Mantener `engine.js` libre de acceso al DOM (funciones puras).
- No usar `eval`; toda evaluación pasa por el parser de `engine.js`.
