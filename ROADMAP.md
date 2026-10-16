# ROADMAP — Calculadora Científica (fx-241)

Plan de futuras mejoras y corrección de errores.
Última actualización: 2026-10-16.

## Estado actual

Implementado y funcionando:

- Operaciones básicas `+ − × ÷`, paréntesis, `x²`, `xʸ`, `√`, `n!`, `%`, `EXP`.
- Funciones `sin`, `cos`, `tan`, `log`, `ln` y constantes `π`, `e`.
- Modo de ángulo DEG/RAD.
- `Ans` (último resultado) persistente.
- **Memoria M**: `MC`, `MR`, `M+`, `M−`, `MS` (persistente).
- **Historial** de cálculos (hasta 50, persistente, clic para reutilizar).
- **Temas** claro/oscuro con detección del sistema y persistencia.
- Motor de evaluación propio, sin `eval` (`engine.js`), validado con pruebas en Node.
- Soporte de teclado físico.

---

## Corrección de errores (bugs)

### B1 — `tan(90°)` no detecta el valor indefinido — Prioridad: media
`tan(90)` (y `90 + 180k`) devuelve un número enorme (~1.6e16) por precisión de
punto flotante, en lugar de "Error"/indefinido.
- **Arreglo propuesto:** en `engine.js`, si el resultado de `tan` excede un umbral
  (p. ej. `1e15`), lanzar error de "indefinido". Solo para `tan`.
- **Criterio:** `tan(90)`, `tan(270)`, `tan(-90)` → `Error`.

### B2 — Paréntesis sin cerrar no se autocierran — Prioridad: media
`(2+3` al pulsar `=` da "Error" en vez de asumir `(2+3)`.
- **Arreglo propuesto:** al evaluar en `equals()`, contar paréntesis abiertos y
  cerrarlos automáticamente (o avisar). Aplicar también al `preview`.
- **Criterio:** `(2+3` y `sin(30` se evalúan correctamente.

### B3 — Pulsos rápidos pueden dejar estado inconsistente — Prioridad: baja
No hay bloqueo durante la animación del botón; en la práctica es despreciable.
- **Arreglo propuesto:** revisar y, si procede, ignorar eventos duplicados.

### B4 — Historial no accesible por teclado — Prioridad: baja
Los elementos del historial son `<li>` con `click` pero sin `tabindex`/rol.
- **Arreglo propuesto:** añadir `tabindex="0"`, `role="button"` y manejar
  `Enter`/`Space`.

### B5 — Precisión de números grandes/pequeños — Prioridad: baja
Los cálculos usan `double` de JavaScript; no se pueden representar enteros
grandes exactos.
- **Arreglo propuesto:** documentarlo; opcionalmente evaluar `BigInt` para
  enteros si surge la necesidad.

---

## Mejoras futuras (features)

Ordenadas por prioridad.

### Alta
1. **`%` configurable**: hoy `%` = "por ciento" (`x/100`). Añadir opción de
   `%` como **módulo** (`a mod b`) o porcentaje contextual (`200+10%`).
   - Criterio: botón o ajuste que cambie el comportamiento y se documente.
2. **Autocierre de paréntesis** (relacionado con B2).
3. **Reutilizar la expresión desde el historial** (además del resultado).
4. **Copiar el resultado** al portapapeles con un toque.

### Media
5. **Multi-memoria / variables** (`M1`–`M9`, `A`, `B`…) y `STO`/`RCL`.
6. **Más funciones**: `sinh`, `cosh`, `tanh`, `x^(1/y)`, `gcd`, `lcm`,
   `mod`, `⌊x⌋`, redondeos.
7. **Fracciones y decimales**: entrada/salida en fracción, conversión.
8. **Conversión de bases**: decimal ⇄ bin ⇄ oct ⇄ hex.
9. **Pruebas automatizadas** del motor con `node:test` (sin dependencias) en
   `npm test`/script, y pruebas de UI manuales documentadas.
10. **Precisión configurable** (nº de decimales, notación científica forzada).
11. **3 estados de tema**: claro / oscuro / automático (seguir sistema).

### Baja
12. **PWA**: instalable y funcional sin conexión (`manifest.json` + service worker).
13. **Atajos de teclado para funciones** (`s` = sin, `c` = cos…).
14. **Separador de miles** y agrupación visual.
15. **i18n** (es/en).
16. **Exportar historial** (texto/JSON).
17. **Tests de accesibilidad** y contraste AA.

---

## Deuda técnica / calidad

- No hay lint configurado. Opción sin dependencias: `node --check` en un script
  de verificación; opcionalmente `eslint` si se autoriza.
- Extraer pruebas del motor a `test/engine.test.js` con `node:test`.
- Revisar `ROADMAP` tras cada release y mover lo completado al README.

## Cómo verificar los cambios

```bash
# Sintaxis
node --check engine.js && node --check script.js
# Pruebas del motor
node -e 'const E=require("./engine.js"); console.log(E.evaluate("2+3*4","DEG"))'
# Servir en local
python3 -m http.server 8080
```
