const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

function makeEl(id) {
  return {
    id: id || "",
    textContent: "",
    innerHTML: "",
    value: "",
    style: {},
    _attrs: {},
    _handlers: {},
    classList: {
      _s: new Set(),
      toggle(c, f) { f ? this._s.add(c) : this._s.delete(c); },
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); }
    },
    setAttribute(k, v) { this._attrs[k] = v; },
    getAttribute(k) { return k in this._attrs ? this._attrs[k] : null; },
    addEventListener(type, fn) { (this._handlers[type] = this._handlers[type] || []).push(fn); },
    appendChild() {},
    closest() { return null; },
    click() { (this._handlers.click || []).forEach((fn) => fn(fakeEvent())); }
  };
}

function fakeEvent() {
  return { preventDefault() {}, stopPropagation() {}, target: { closest() { return null; } } };
}

function setup() {
  const els = {};
  ["expression", "result", "angle", "mem", "mod", "degBtn", "pctBtn", "pctKey",
    "copyBtn", "themeBtn", "history", "historyList", "toast"].forEach((id) => { els[id] = makeEl(id); });
  const meta = makeEl("meta");
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
    querySelector: (sel) => (sel.indexOf("theme-color") !== -1 ? meta : makeEl("keys")),
    createElement: () => makeEl(),
    addEventListener(type, fn) { (docHandlers[type] = docHandlers[type] || []).push(fn); }
  };

  window.CalcEngine = require(path.join(__dirname, "..", "engine.js"));
  const scriptPath = path.join(__dirname, "..", "script.js");
  delete require.cache[require.resolve(scriptPath)];
  require(scriptPath);

  const press = (key) => (docHandlers.keydown || []).forEach((fn) => fn({ key, preventDefault() {}, stopPropagation() {} }));
  const type = (str) => str.split("").forEach(press);
  return { els, press, type };
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
