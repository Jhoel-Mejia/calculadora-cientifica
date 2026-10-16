const test = require("node:test");
const assert = require("node:assert");
const E = require("../engine.js");

function ev(expr, angle, vars) {
  return E.format(E.evaluate(expr, angle || "DEG", "percent", vars));
}

test("operaciones basicas", () => {
  assert.strictEqual(ev("2+3*4"), "14");
  assert.strictEqual(ev("(2+3)*4"), "20");
  assert.strictEqual(ev("10/4"), "2.5");
  assert.strictEqual(ev("2(3)"), "6");
  assert.strictEqual(ev("2sin(30)"), "1");
});

test("precedencia unaria y potencia", () => {
  assert.strictEqual(ev("-2^2"), "-4");
  assert.strictEqual(ev("(-2)^2"), "4");
  assert.strictEqual(ev("-3!"), "-6");
  assert.strictEqual(ev("2^-3"), "0.125");
  assert.strictEqual(ev("2^3^2"), "512");
});

test("trigonometria", () => {
  assert.strictEqual(ev("sin(30)"), "0.5");
  assert.strictEqual(ev("cos(60)"), "0.5");
  assert.strictEqual(ev("tan(45)"), "1");
  assert.throws(() => ev("tan(90)"), "tan indefinido");
  assert.throws(() => ev("tan(270)"), "tan indefinido");
});

test("factorial, raiz y porcentaje", () => {
  assert.strictEqual(ev("5!"), "120");
  assert.strictEqual(ev("0!"), "1");
  assert.strictEqual(ev("√(16)"), "4");
  assert.strictEqual(ev("100%"), "1");
  assert.throws(() => ev("5.5!"), "factorial no entero");
});

test("constantes y formato", () => {
  assert.strictEqual(ev("2π"), "6.28318530718");
  assert.strictEqual(ev("0.1+0.2"), "0.3");
  assert.strictEqual(ev("1000000000000"), "1e+12");
});

test("errores", () => {
  assert.throws(() => ev("1/0"), "no finito");
  assert.throws(() => ev("0/0"), "no finito");
  assert.throws(() => ev("√(-1)"), "raiz de negativo");
  assert.throws(() => ev("2..3"), "numero invalido");
  assert.throws(() => ev(""), "vacio");
  assert.throws(() => ev("2+"), "incompleta");
  assert.throws(() => ev("()"), "vacio dentro de parentesis");
});

test("significado de % : porcentaje vs modulo", () => {
  assert.strictEqual(E.format(E.evaluate("10%3", "DEG", "percent")), "0.3");
  assert.strictEqual(E.format(E.evaluate("10%3", "DEG", "modulo")), "1");
  assert.strictEqual(E.format(E.evaluate("7%4", "DEG", "modulo")), "3");
  assert.strictEqual(E.format(E.evaluate("50%", "DEG", "percent")), "0.5");
  assert.throws(() => E.evaluate("100%", "DEG", "modulo"), "modulo sin operando derecho");
});

test("fracciones (exactas; null si no lo son)", () => {
  assert.strictEqual(E.formatFraction(0.5), "1/2");
  assert.strictEqual(E.formatFraction(1.5), "1 1/2");
  assert.strictEqual(E.formatFraction(-0.75), "-3/4");
  assert.strictEqual(E.formatFraction(1 / 3), "1/3");
  assert.strictEqual(E.formatFraction(1 / 7), "1/7");
  assert.strictEqual(E.formatFraction(7), "7");
  assert.strictEqual(E.formatFraction(Math.PI), null);
  assert.strictEqual(E.formatFraction(Math.SQRT2), null);
});

test("variables A-F (E mayuscula = variable; e minuscula = Euler)", () => {
  assert.strictEqual(ev("A+1", "DEG", { A: 2 }), "3");
  assert.strictEqual(ev("2A", "DEG", { A: 3 }), "6");
  assert.strictEqual(ev("A*B", "DEG", { A: 2, B: 5 }), "10");
  assert.strictEqual(ev("E", "DEG", { E: 5 }), "5");
  assert.strictEqual(ev("e", "DEG", {}), "2.71828182846");
  assert.throws(() => E.evaluate("B+1", "DEG", "percent", {}), "variable vacia");
});

test("fractionToExpr construye la expresion de fraccion", () => {
  assert.strictEqual(E.fractionToExpr(0, 3, 4), "(3/4)");
  assert.strictEqual(E.fractionToExpr(1, 3, 4), "(1+(3/4))");
  assert.strictEqual(E.fractionToExpr("", 3, 4), "(3/4)");
  assert.strictEqual(E.fractionToExpr(0, 3, 0), null);
  assert.strictEqual(E.fractionToExpr(0, 1.5, 2), null);
  assert.strictEqual(ev(E.fractionToExpr(1, 3, 4), "DEG"), "1.75");
});

test("entrada en bases 0x/0b/0o y toBase", () => {
  assert.strictEqual(ev("0x1F"), "31");
  assert.strictEqual(ev("0b1010"), "10");
  assert.strictEqual(ev("0o17"), "15");
  assert.strictEqual(ev("0xFF+1"), "256");
  assert.strictEqual(E.toBase(255, 16), "FF");
  assert.strictEqual(E.toBase(10, 2), "1010");
  assert.strictEqual(E.toBase(-255, 16), "-FF");
  assert.strictEqual(E.toBase(8, 8), "10");
  assert.throws(() => E.evaluate("0b2", "DEG"), "digito invalido");
});

test("notacion cientifica NeM (e/E con exponente)", () => {
  assert.strictEqual(ev("2e3"), "2000");
  assert.strictEqual(ev("1.5e2"), "150");
  assert.strictEqual(ev("2E3"), "2000");
  assert.strictEqual(ev("6e-2"), "0.06");
  assert.strictEqual(ev("1e+12"), "1e+12");
  assert.strictEqual(ev("1e-7"), "1e-7");
  assert.strictEqual(ev("e"), "2.71828182846");
  assert.strictEqual(ev("2e"), "5.43656365692");
  assert.strictEqual(ev("0x1e3"), "483");
  assert.throws(() => ev("1e309"), "fuera de rango");
});

test("i18n: diccionarios es/en con fallback", () => {
  const I18N = require("../i18n.js").I18N;
  assert.strictEqual(I18N.get("es", "copy.label"), "Copiar");
  assert.strictEqual(I18N.get("en", "copy.label"), "Copy");
  assert.strictEqual(I18N.get("fr", "copy.label"), "Copiar");
});

test("i18n: claves de index.html presentes en es y en", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const I18N = require("../i18n.js").I18N;
  const keys = new Set();
  const re = /data-i18n(?:-title|-aria|-ph)?="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) keys.add(m[1]);
  assert.ok(keys.size > 0, "sin claves i18n en index.html");
  for (const k of keys) {
    assert.notStrictEqual(I18N.get("es", k), k, "falta traduccion es: " + k);
    assert.notStrictEqual(I18N.get("en", k), k, "falta traduccion en: " + k);
  }
});

test("autoClose equilibra parentesis", () => {
  assert.strictEqual(E.autoClose("(2+3"), "(2+3)");
  assert.strictEqual(E.autoClose("sin(30"), "sin(30)");
  assert.strictEqual(E.autoClose("(2+(3"), "(2+(3))");
  assert.strictEqual(E.autoClose("(2+3)"), "(2+3)");
  assert.strictEqual(E.autoClose("2)("), "2)()");
  assert.strictEqual(E.autoClose(""), "");
});
