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

### B1 — `tan(90°)` no detecta el valor indefinido — ✅ Resuelto
`tan(90)` (y `90 + 180k`) devolvía un número enorme (~1.6e16). Ahora, si
`|tan| > 1e15`, el motor lanza "Indefinido" → la app muestra `Error`.
- **Criterio:** `tan(90)`, `tan(270)`, `tan(-90)` → `Error`. (probado)

### B2 — Paréntesis sin cerrar no se autocierran — ✅ Resuelto
`(2+3` al pulsar `=` da "Error". Ahora `Engine.autoClose()` los completa antes de
evaluar (también en la previsualización), y la expresión se muestra cerrada.
- **Criterio:** `(2+3`, `sin(30`, `(2+(3` se evalúan correctamente. (probado)

### B3 — Pulsos rápidos pueden dejar estado inconsistente — Prioridad: baja
No hay bloqueo durante la animación del botón; en la práctica es despreciable.
- **Arreglo propuesto:** revisar y, si procede, ignorar eventos duplicados.

### B4 — Historial no accesible por teclado — ✅ Resuelto
Cada entrada tiene `tabindex="0"`, `role="button"`, `aria-label` y responde a
`Enter`/`Espacio` (con `stopPropagation` para no chocar con el atajo global).

### B5 — Precisión de números grandes/pequeños — Prioridad: baja
Los cálculos usan `double` de JavaScript; no se pueden representar enteros
grandes exactos.
- **Arreglo propuesto:** documentarlo; opcionalmente evaluar `BigInt` para
  enteros si surge la necesidad.

### B6 — Precedencia incorrecta: `-2^2` daba `4` — ✅ Resuelto
La negación unaria tenía más prioridad que la potencia; se corrigió la gramática
(`unary → power → postfix`) para que `-2^2 = -4` y `2^-3 = 0.125`.
- **Criterio:** `-2^2` = `-4`, `(-2)^2` = `4`, `2^-3` = `0.125`. (probado)

### B7 — `e` como constante vs. notación científica — Documentado (no bug)
`1e3` se interpreta como `1 × e × 3` (constante de Euler), **no** como `1000`.
Para exponentes usa el botón **EXP** (`×10^(`).
- **Posible mejora:** detectar notación `NeM` cuando no haya ambigüedad.

---

## Mejoras futuras (features)

Ordenadas por prioridad.

### Alta
1. ✅ **`%` configurable**: botón `%`/`mod` en la cabecera alterna entre
   porcentaje (`x/100`) y módulo (`a % b`); indicador `MOD`, persistente.
   Pendiente: porcentaje contextual (`200+10%`) y `mod` como función.
2. ✅ **Autocierre de paréntesis** (B2, hecho).
3. ✅ **Reutilizar la expresión desde el historial** (botón `↺` por entrada).
4. ✅ **Copiar el resultado** al portapapeles (con aviso tipo *toast*).

### Media
5. ◻ **Multi-memoria / variables**: ✅ **M1–M9** (ranura activa seleccionable en
   la cabecera, persistencia por ranura). Pendiente: **variables** `A`–`F` y
   `STO`/`RCL`.
6. **Más funciones**: `sinh`, `cosh`, `tanh`, `x^(1/y)`, `gcd`, `lcm`,
   `mod`, `⌊x⌋`, redondeos.
7. ◻ **Fracciones y decimales**: ✅ **salida** como fracción simplificada
   (botón `a/b`, con verificación de exactitud para no inventar fracciones de
   irracionales). Pendiente: entrada en fracción mixta y conversión inversa.
8. **Conversión de bases**: decimal ⇄ bin ⇄ oct ⇄ hex.
9. ✅ **Pruebas automatizadas** con `node:test` en `npm test`
   (`test/engine.test.js` + `test/ui.smoke.test.js`, 14 pruebas).
10. **Precisión configurable** (nº de decimales, notación científica forzada).
11. **3 estados de tema**: claro / oscuro / automático (seguir sistema).

### Baja
12. **PWA**: instalable y funcional sin conexión (`manifest.json` + service worker).
13. ◻ **Atajos de teclado para funciones**: `s` `c` `t` `l` `n` `r` `p` `e`
    añadidos; pendiente el resto y mostrarlos en la UI.
14. **Separador de miles** y agrupación visual.
15. **i18n** (es/en).
16. **Exportar historial** (texto/JSON).
17. **Tests de accesibilidad** y contraste AA.

Leyenda: ✅ hecho · ◻ parcial

---

## Deuda técnica / calidad

- No hay lint configurado. Verificación de sintaxis: `node --check` en
  `engine.js` y `script.js`; opcionalmente `eslint` si se autoriza.
- ✅ Pruebas extraídas a `test/` con `node:test` (`npm test`).
- Revisar `ROADMAP` tras cada release y mover lo completado al README.

## Cómo verificar los cambios

```bash
# Sintaxis
node --check engine.js && node --check script.js
# Pruebas (motor + UI)
node --test        # o: npm test
# Servir en local
python3 -m http.server 8080
```
