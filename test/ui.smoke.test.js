const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

function makeEl(id) {
  const el = {
    id: id || "",
    textContent: "",
    value: "",
    style: {},
    children: [],
    _attrs: {},
    _handlers: {},
    classList: {
      _s: new Set(),
      toggle(c, f) {
        if (f === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); }
        else { f ? this._s.add(c) : this._s.delete(c); }
      },
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); }
    },
    setAttribute(k, v) { this._attrs[k] = v; },
    getAttribute(k) { return k in this._attrs ? this._attrs[k] : null; },
    addEventListener(type, fn) { (el._handlers[type] = el._handlers[type] || []).push(fn); },
    appendChild(child) { el.children.push(child); },
    closest() { return null; },
    click() { (el._handlers.click || []).forEach((fn) => fn(fakeEvent())); }
  };
  Object.defineProperty(el, "innerHTML", { get() { return ""; }, set() { el.children.length = 0; } });
  return el;
}

function fakeEvent() {
  return { preventDefault() {}, stopPropagation() {}, target: { closest() { return null; } } };
}

function setup() {
  const els = {};
  ["expression", "result", "angle", "mem", "mod", "degBtn", "slotBtn", "pctBtn", "pctKey",
    "baseBtn", "langBtn", "basePanel", "baseList", "fracBtn", "copyBtn", "themeBtn",
    "history", "historyList", "toast", "histBtn", "varToggleBtn", "fracToggleBtn",
    "varPanel", "varList", "fracPanel", "fracInsertBtn", "fracWhole", "fracNum", "fracDen"]
    .forEach((id) => { els[id] = makeEl(id); });
  const meta = makeEl("meta");
  const keys = makeEl("keys");
  const docHandlers = {};

  global.window = { matchMedia: () => ({ matches: false }), localStorage: null, navigator: null };
  global.localStorage = {
    _d: {},
    getItem(k) { return k in this._d ? this._d[k] : null; },
    setItem(k, v) { this._d[k] = v; }
  };
  window.localStorage = global.localStorage;
  global.setTimeout = global.setTimeout || (() => 0);
  global.document = {
    body: makeEl("body"),
    documentElement: {
      _attrs: {},
      setAttribute(k, v) { this._attrs[k] = v; },
      getAttribute(k) { return this._attrs[k] || null; }
    },
    getElementById: (id) => els[id] || makeEl(id),
    querySelector: (sel) => (sel.indexOf("theme-color") !== -1 ? meta : keys),
    createElement: () => makeEl(),
    addEventListener(type, fn) { (docHandlers[type] = docHandlers[type] || []).push(fn); }
  };

  window.I18N = require(path.join(__dirname, "..", "i18n.js")).I18N;
  window.CalcEngine = require(path.join(__dirname, "..", "engine.js"));
  const scriptPath = path.join(__dirname, "..", "script.js");
  delete require.cache[require.resolve(scriptPath)];
  require(scriptPath);

  const press = (key) => (docHandlers.keydown || []).forEach((fn) => fn({ key, preventDefault() {}, stopPropagation() {} }));
  const type = (str) => str.split("").forEach(press);
  const pressOn = (target, key) => (docHandlers.keydown || []).forEach((fn) => fn({ key, target, preventDefault() {}, stopPropagation() {} }));
  const clickKey = (action) => {
    const btn = { getAttribute: (k) => (k === "data-action" ? action : null) };
    (keys._handlers.click || []).forEach((fn) => fn({ target: { closest: () => btn } }));
  };
  const clickInsert = (text) => {
    const btn = { getAttribute: (k) => (k === "data-insert" ? text : null) };
    (keys._handlers.click || []).forEach((fn) => fn({ target: { closest: () => btn } }));
  };
  return { els, press, type, pressOn, clickKey, clickInsert };
}

test("arranque: estado inicial", () => {
  const { els } = setup();
  assert.strictEqual(els.result.textContent, "0");
  assert.strictEqual(global.document.documentElement.getAttribute("data-theme"), "dark");
  assert.strictEqual(els.mem.classList.contains("active"), false);
  assert.strictEqual(els.mod.classList.contains("active"), false);
});

test("teclado: calculo basico y autocierre de parentesis", () => {
  const { els, press, type } = setup();
  type("5+3");
  press("Enter");
  assert.strictEqual(els.result.textContent, "8");

  press("Escape");
  type("(2+3");
  press("Enter");
  assert.strictEqual(els.expression.textContent, "(2+3)");
  assert.strictEqual(els.result.textContent, "5");
});

test("toggle a/b muestra el resultado como fraccion", () => {
  const { els, press, type } = setup();
  type("1/2");
  press("Enter");
  assert.strictEqual(els.result.textContent, "0.5");
  els.fracBtn.click();
  assert.strictEqual(els.fracBtn.classList.contains("active"), true);
  assert.strictEqual(els.result.textContent, "1/2");
});

test("multi-memoria M1-M9 y cambio de ranura", () => {
  const { els, press, type, clickKey } = setup();
  type("5");
  press("Enter");
  clickKey("ms");
  assert.strictEqual(els.mem.textContent, "M1");
  assert.strictEqual(els.mem.classList.contains("active"), true);

  els.slotBtn.click();
  assert.strictEqual(els.slotBtn.textContent, "M2");
  assert.strictEqual(els.mem.classList.contains("active"), false);

  press("Escape");
  type("7");
  press("Enter");
  clickKey("mplus");
  assert.strictEqual(els.mem.classList.contains("active"), true);

  press("Escape");
  clickKey("mr");
  assert.strictEqual(els.expression.textContent, "7");
});

test("paneles Var/Frac y tecla 1/x", () => {
  const { els, press, type, clickKey } = setup();
  clickKey("vartoggle");
  assert.strictEqual(els.varPanel.classList.contains("open"), true);
  clickKey("fractoggle");
  assert.strictEqual(els.fracPanel.classList.contains("open"), true);
  type("5");
  press("Enter");
  clickKey("inv");
  assert.strictEqual(els.expression.textContent, "1/(5)");
  assert.strictEqual(els.result.textContent, "0.2");
});

test("variables: STO y RCL desde el panel", () => {
  const { els, press, type } = setup();
  type("5");
  press("Enter");
  els.varList.children[0].children[2].click();
  assert.strictEqual(els.varList.children[0].children[1].textContent, "5");
  press("Escape");
  els.varList.children[0].children[3].click();
  assert.strictEqual(els.expression.textContent, "5");
});

test("entrada de fraccion inserta la expresion", () => {
  const { els } = setup();
  els.fracWhole.value = "1";
  els.fracNum.value = "3";
  els.fracDen.value = "4";
  els.fracInsertBtn.click();
  assert.strictEqual(els.expression.textContent, "(1+(3/4))");
  assert.strictEqual(els.result.textContent, "1.75");
});

test("panel de bases muestra dec/hex/oct/bin", () => {
  const { els, press, type } = setup();
  type("255");
  press("Enter");
  assert.strictEqual(els.baseList.children[1].children[1].textContent, "FF");
  assert.strictEqual(els.baseList.children[2].children[1].textContent, "377");
  assert.strictEqual(els.baseList.children[3].children[1].textContent, "11111111");
});

test("cambio de idioma ES/EN", () => {
  const { els } = setup();
  assert.strictEqual(global.document.documentElement.lang, "es");
  assert.strictEqual(els.langBtn.textContent, "ES");
  els.langBtn.click();
  assert.strictEqual(global.document.documentElement.lang, "en");
  assert.strictEqual(els.langBtn.textContent, "EN");
});

test("toggle de % cambia entre porcentaje y modulo", () => {
  const { els, press, type } = setup();
  type("10%3");
  press("Enter");
  assert.strictEqual(els.result.textContent, "0.3");

  els.pctBtn.click();
  assert.strictEqual(els.mod.classList.contains("active"), true);
  assert.strictEqual(els.pctKey.textContent, "mod");

  press("Escape");
  type("10%3");
  press("Enter");
  assert.strictEqual(els.result.textContent, "1");
});

test("backspace elimina funciones compuestas abs( y cbrt(", () => {
  const { els, press, clickInsert } = setup();
  clickInsert("abs(");
  assert.strictEqual(els.expression.textContent, "abs(");
  press("Backspace");
  assert.strictEqual(els.expression.textContent, "");
  clickInsert("cbrt(");
  press("Backspace");
  assert.strictEqual(els.expression.textContent, "");
});

test("el teclado no interviene en campos de texto", () => {
  const { els, pressOn } = setup();
  pressOn({ tagName: "INPUT" }, "5");
  pressOn({ tagName: "INPUT" }, "Enter");
  assert.strictEqual(els.expression.textContent, "");
  assert.strictEqual(els.result.textContent, "0");
});

test("Enter en boton fuera del teclado no evalua; en teclado si", () => {
  const { els, press, type } = setup();
  type("2+3");
  global.document.activeElement = { tagName: "BUTTON", closest: () => null };
  press("Enter");
  assert.strictEqual(els.historyList.children[0].className, "history-empty");
  global.document.activeElement = { tagName: "BUTTON", closest: (s) => (s === ".keys" ? {} : null) };
  press("Enter");
  assert.strictEqual(els.historyList.children[0].className, "history-item");
});

test("panel Base no muestra ni inserta Error", () => {
  const { els, press, type } = setup();
  type("2+");
  press("Enter");
  assert.strictEqual(els.result.textContent, "Error");
  assert.strictEqual(els.baseList.children[0].children[1].textContent, "\u2014");
  els.baseList.children[0].click();
  assert.strictEqual(els.expression.textContent, "2+");
});

test("insertar variable tras evaluar inicia expresion nueva", () => {
  const { els, press, type } = setup();
  type("5");
  press("Enter");
  els.varList.children[0].children[0].click();
  assert.strictEqual(els.expression.textContent, "A");
});

test("aria-label de la tecla % se traduce (ES/EN)", () => {
  const { els } = setup();
  assert.strictEqual(els.pctKey.getAttribute("aria-label"), "Porcentaje");
  els.langBtn.click();
  assert.strictEqual(els.pctKey.getAttribute("aria-label"), "Percent");
});

test("aria-expanded refleja la apertura de paneles", () => {
  const { els, clickKey } = setup();
  clickKey("hist");
  assert.strictEqual(els.histBtn.getAttribute("aria-expanded"), "true");
  assert.strictEqual(els.history.classList.contains("open"), true);
  clickKey("hist");
  assert.strictEqual(els.histBtn.getAttribute("aria-expanded"), "false");
  clickKey("vartoggle");
  assert.strictEqual(els.varToggleBtn.getAttribute("aria-expanded"), "true");
  clickKey("fractoggle");
  assert.strictEqual(els.fracToggleBtn.getAttribute("aria-expanded"), "true");
});

test("aria-pressed alterna en %/mod y a/b", () => {
  const { els } = setup();
  assert.strictEqual(els.pctBtn.getAttribute("aria-pressed"), "false");
  els.pctBtn.click();
  assert.strictEqual(els.pctBtn.getAttribute("aria-pressed"), "true");
  els.fracBtn.click();
  assert.strictEqual(els.fracBtn.getAttribute("aria-pressed"), "true");
});

test("porcentaje contextual en la interfaz", () => {
  const { els, press, type } = setup();
  type("200+10%");
  press("Enter");
  assert.strictEqual(els.result.textContent, "220");
});
