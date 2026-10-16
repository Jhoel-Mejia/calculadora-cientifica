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
