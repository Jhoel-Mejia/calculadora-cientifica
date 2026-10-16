const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(path.join(__dirname, "..", "style.css"), "utf8");

function block(selector) {
  const re = new RegExp(selector.replace(/[[\]"=]/g, "\\$&") + "\\s*\\{([^}]*)\\}");
  const m = css.match(re);
  const out = {};
  if (!m) return out;
  m[1].replace(/--([\w-]+)\s*:\s*([^;]+);/g, (_, name, value) => {
    out["--" + name] = value.trim();
    return "";
  });
  return out;
}

const root = block(":root");
const light = Object.assign({}, root, block('[data-theme="light"]'));

function hex(s) {
  s = s.replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
}
function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function lum(v) { const [r, g, b] = hex(v); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); }
function ratio(a, b) { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }

const PAIRS = [
  ["texto / tecla", "--text", "--key"],
  ["texto / tecla función", "--text", "--key-fn"],
  ["texto / tecla número", "--text", "--key-num"],
  ["texto / tecla memoria", "--text", "--key-mem"],
  ["muted / fondo", "--muted", "--body"],
  ["tinta / tecla operador", "--key-op-ink", "--key-op"],
  ["tinta / tecla igual", "--key-eq-ink", "--key-eq"],
  ["pantalla / pantalla", "--screen-ink", "--screen"],
  ["pantalla / pantalla-2", "--screen-ink", "--screen-2"],
  ["indicadores / pantalla", "--ind-ink", "--screen"],
  ["acento / fondo", "--accent", "--body"]
];

for (const [themeName, vars] of [["oscuro", root], ["claro", light]]) {
  test(`contraste WCAG AA (tema ${themeName})`, () => {
    for (const [label, fg, bg] of PAIRS) {
      assert.ok(vars[fg] && vars[bg], `variable ausente: ${fg} o ${bg}`);
      assert.match(vars[fg], /^#/, `${fg} no es un color hex`);
      assert.match(vars[bg], /^#/, `${bg} no es un color hex`);
      const r = ratio(vars[fg], vars[bg]);
      assert.ok(r >= 4.5, `${label} (${themeName}) = ${r.toFixed(2)} < 4.5`);
    }
  });
}
