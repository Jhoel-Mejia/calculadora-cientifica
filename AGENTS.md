# AGENTS.md

Instrucciones del proyecto para OpenCode.

## Proyecto

Calculadora científica web (tipo Casio fx-241). Sitio estático:
HTML + CSS + JavaScript puro, sin dependencias ni build.

## Comandos

- Servir en local: `python3 -m http.server 8080`
- Probar el motor: `node -e 'const E=require("./engine.js"); console.log(E.evaluate("2+3*4","DEG"))'`
- No hay lint/test configurado.

## Estructura

- `index.html` — interfaz y botones
- `style.css` — estilos
- `engine.js` — motor de cálculo (parser). Funciones puras, testeable en Node.
- `script.js` — lógica de la interfaz (DOM)

## Convenciones

- No introducir dependencias ni frameworks.
- Mantener `engine.js` libre de acceso al DOM (funciones puras).
- No usar `eval`; toda evaluación pasa por el parser de `engine.js`.
