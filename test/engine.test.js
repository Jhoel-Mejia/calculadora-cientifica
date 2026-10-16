const test = require("node:test");
const assert = require("node:assert");
const E = require("../engine.js");

function ev(expr, angle) {
  return E.format(E.evaluate(expr, angle || "DEG"));
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

test("autoClose equilibra parentesis", () => {
  assert.strictEqual(E.autoClose("(2+3"), "(2+3)");
  assert.strictEqual(E.autoClose("sin(30"), "sin(30)");
  assert.strictEqual(E.autoClose("(2+(3"), "(2+(3))");
  assert.strictEqual(E.autoClose("(2+3)"), "(2+3)");
  assert.strictEqual(E.autoClose("2)("), "2)()");
  assert.strictEqual(E.autoClose(""), "");
});
