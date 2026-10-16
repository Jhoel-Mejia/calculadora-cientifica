# Calculadora Científica (fx-241)

Calculadora científica web tipo Casio, responsive y sin dependencias.
Funciona 100% en el navegador (HTML, CSS y JavaScript puro).

## Características

- Operaciones básicas: `+ − × ÷`
- Funciones científicas: `sin`, `cos`, `tan`, `log`, `ln`, `√`, `x²`, `xʸ`,
  `n!`, `%`, `1/x` (vía `^`), `π`, `e`
- Modo de ángulo **DEG / RAD** conmutable
- Memoria de último resultado (`Ans`)
- **Memoria M**: `MC`, `MR`, `M+`, `M−`, `MS` (con indicador y persistencia)
- **Historial** de cálculos (clic para reutilizar el resultado)
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

## Estructura

- `index.html` — interfaz y teclado
- `style.css` — apariencia tipo calculadora Casio
- `engine.js` — motor de cálculo (tokenizador + parser recursivo)
- `script.js` — lógica de la interfaz

## Pruebas del motor

```bash
node -e 'const E=require("./engine.js"); console.log(E.evaluate("2+3*4","DEG"))'
```

## Licencia

MIT
