const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

function makeEl(id) {
  return {
    id: id || "",
    textContent: "",
    innerHTML: "",
    _attrs: {},
    classList: {
      _s: new Set(),
      toggle(c, f) { f ? this._s.add(c) : this._s.delete(c); },
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); }
    },
    setAttribute(k, v) { this._attrs[k] = v; },
    getAttribute(k) { return k in this._attrs ? this._attrs[k] : null; },
    addEventListener() {},
    appendChild() {},
    closest() { return null; }
  };
}

test("script.js arranca sin errores y aplica estado inicial", () => {
  const els = {};
  ["expression", "result", "angle", "mem", "degBtn", "themeBtn", "history", "historyList"]
    .forEach((id) => { els[id] = makeEl(id); });
  const meta = makeEl("meta");

  global.window = { matchMedia: () => ({ matches: false }), localStorage: null };
  global.localStorage = {
    _d: {},
    getItem(k) { return k in this._d ? this._d[k] : null; },
    setItem(k, v) { this._d[k] = v; }
  };
  window.localStorage = global.localStorage;
  global.document = {
    documentElement: {
      _attrs: {},
      setAttribute(k, v) { this._attrs[k] = v; },
      getAttribute(k) { return this._attrs[k] || null; }
    },
    getElementById: (id) => els[id] || makeEl(id),
    querySelector: (sel) => (sel.indexOf("theme-color") !== -1 ? meta : makeEl("keys")),
    createElement: () => makeEl(),
    addEventListener() {}
  };

  window.CalcEngine = require(path.join(__dirname, "..", "engine.js"));

  assert.doesNotThrow(() => require(path.join(__dirname, "..", "script.js")));
  assert.strictEqual(els.result.textContent, "0");
  assert.strictEqual(global.document.documentElement.getAttribute("data-theme"), "dark");
  assert.strictEqual(els.mem.classList.contains("active"), false);
});
