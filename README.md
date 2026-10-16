# Calculadora Científica (fx-241)

Calculadora científica web tipo Casio, responsive y sin dependencias.
Funciona 100% en el navegador (HTML, CSS y JavaScript puro).

## Características

- Operaciones básicas: `+ − × ÷`
- Funciones científicas: `sin`, `cos`, `tan`, `log`, `ln`, `√`, `x²`, `xʸ`,
  `n!`, `%`, `1/x` (vía `^`), `π`, `e`
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
(por ejemplo `(2+3` se evalúa como `(2+3)`).

## Estructura

- `index.html` — interfaz y teclado
- `style.css` — apariencia tipo calculadora Casio
- `engine.js` — motor de cálculo (tokenizador + parser recursivo)
- `script.js` — lógica de la interfaz

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
