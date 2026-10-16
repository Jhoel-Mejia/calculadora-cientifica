(function () {
  "use strict";

  var Engine = window.CalcEngine;
  var exprEl = document.getElementById("expression");
  var resEl = document.getElementById("result");
  var angleEl = document.getElementById("angle");
  var memEl = document.getElementById("mem");
  var modEl = document.getElementById("mod");
  var degBtn = document.getElementById("degBtn");
  var slotBtn = document.getElementById("slotBtn");
  var pctBtn = document.getElementById("pctBtn");
  var pctKey = document.getElementById("pctKey");
  var fracBtn = document.getElementById("fracBtn");
  var copyBtn = document.getElementById("copyBtn");
  var themeBtn = document.getElementById("themeBtn");
  var historyEl = document.getElementById("history");
  var historyList = document.getElementById("historyList");
  var toastEl = document.getElementById("toast");
  var varPanel = document.getElementById("varPanel");
  var varList = document.getElementById("varList");
  var fracPanel = document.getElementById("fracPanel");
  var fracInsertBtn = document.getElementById("fracInsertBtn");
  var fracWhole = document.getElementById("fracWhole");
  var fracNum = document.getElementById("fracNum");
  var fracDen = document.getElementById("fracDen");
  var VAR_NAMES = Engine.VARS || ["A", "B", "C", "D", "E", "F"];

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  var state = {
    expr: "",
    result: "0",
    value: 0,
    fracMode: load("calc.frac", false) === true,
    ans: load("calc.ans", 0),
    angle: load("calc.angle", "DEG") === "RAD" ? "RAD" : "DEG",
    mem: load("calc.mem", null),
    slot: (function () { var s = parseInt(load("calc.slot", 1), 10); return (s >= 1 && s <= 9) ? s : 1; })(),
    history: load("calc.history", []) || [],
    vars: load("calc.vars", null),
    percentMode: load("calc.percentMode", "percent") === "modulo" ? "modulo" : "percent",
    justEvaluated: false
  };
  if (!(state.ans === state.ans)) state.ans = 0;
  if (!state.vars || typeof state.vars !== "object") state.vars = {};
  if (!state.mem || typeof state.mem !== "object") {
    state.mem = {};
    var oldMem = load("calc.memory", null);
    if (oldMem !== null && isFinite(oldMem)) state.mem[1] = oldMem;
  }

  function displayResult() {
    if (state.fracMode && isFinite(state.value)) {
      var f = Engine.formatFraction(state.value);
      if (f) return f;
    }
    return state.result;
  }

  function render() {
    exprEl.textContent = state.expr;
    resEl.textContent = displayResult();
  }

  function updateIndicators() {
    angleEl.textContent = state.angle;
    degBtn.textContent = state.angle;
    memEl.textContent = "M" + state.slot;
    memEl.classList.toggle("active", memHas(state.slot));
    if (slotBtn) slotBtn.textContent = "M" + state.slot;
    var mod = state.percentMode === "modulo";
    modEl.classList.toggle("active", mod);
    pctBtn.textContent = mod ? "mod" : "%";
    pctBtn.classList.toggle("active", mod);
    pctKey.textContent = mod ? "mod" : "%";
    pctKey.setAttribute("aria-label", mod ? "Módulo" : "Porcentaje");
  }

  var autoClose = Engine.autoClose;

  function preview() {
    if (state.expr.trim() === "") { state.result = "0"; state.value = 0; return; }
    try {
      var v = Engine.evaluate(autoClose(state.expr), state.angle, state.percentMode, state.vars);
      state.value = v;
      state.result = Engine.format(v);
    } catch (e) { /* mantener */ }
  }

  function insert(text) {
    if (state.justEvaluated) {
      if (/^[0-9.]/.test(text) || /^[a-z\u03c0\u221a(]/.test(text)) state.expr = "";
      else state.expr = Engine.format(state.ans);
      state.justEvaluated = false;
    }
    state.expr += text;
    preview();
    render();
  }

  function insertExpr(text) {
    state.expr = text;
    state.justEvaluated = false;
    preview();
    render();
  }

  function clearAll() {
    state.expr = "";
    state.result = "0";
    state.value = 0;
    state.justEvaluated = false;
    render();
  }

  function backspace() {
    state.justEvaluated = false;
    var m = state.expr.match(/(asin\(|acos\(|atan\(|sin\(|cos\(|tan\(|log\(|ln\(|sqrt\(|\u221a\(|\*10\()$/);
    state.expr = m ? state.expr.slice(0, -m[0].length) : state.expr.slice(0, -1);
    preview();
    render();
  }

  function negate() {
    if (state.justEvaluated) { state.expr = Engine.format(state.ans); state.justEvaluated = false; }
    if (state.expr === "") state.expr = "-";
    else if (state.expr.slice(0, 2) === "-(" && state.expr.slice(-1) === ")") state.expr = state.expr.slice(2, -1);
    else state.expr = "-(" + state.expr + ")";
    preview();
    render();
  }

  function currentValue() {
    if (state.expr.trim() === "") return state.ans;
    try { return Engine.evaluate(state.expr, state.angle, state.percentMode, state.vars); } catch (e) { return state.ans; }
  }

  function memHas(n) { return typeof state.mem[n] === "number" && isFinite(state.mem[n]); }
  function persistMem() { save("calc.mem", state.mem); }
  function setSlotMemory(value) {
    state.mem[state.slot] = isFinite(value) ? value : 0;
    persistMem();
    updateIndicators();
  }
  function memStore() { setSlotMemory(currentValue()); }
  function memAdd() { setSlotMemory((memHas(state.slot) ? state.mem[state.slot] : 0) + currentValue()); }
  function memSub() { setSlotMemory((memHas(state.slot) ? state.mem[state.slot] : 0) - currentValue()); }
  function memRecall() {
    if (memHas(state.slot)) insert(Engine.format(state.mem[state.slot]));
    else showToast("M" + state.slot + " vacía");
  }
  function memClear() { delete state.mem[state.slot]; persistMem(); updateIndicators(); }
  function cycleSlot() {
    state.slot = state.slot % 9 + 1;
    save("calc.slot", state.slot);
    updateIndicators();
  }

  function renderHistory() {
    historyList.innerHTML = "";
    if (state.history.length === 0) {
      var li = document.createElement("li");
      li.className = "history-empty";
      li.textContent = "Sin cálculos aún";
      historyList.appendChild(li);
      return;
    }
    state.history.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "history-item";
      var e = document.createElement("span");
      e.className = "h-expr";
      e.textContent = item.e;
      var r = document.createElement("span");
      r.className = "h-res";
      r.textContent = "= " + item.r;
      var reuse = document.createElement("button");
      reuse.type = "button";
      reuse.className = "h-reuse";
      reuse.textContent = "\u21ba";
      reuse.title = "Reutilizar expresión";
      reuse.setAttribute("aria-label", "Reutilizar expresión " + item.e);
      reuse.addEventListener("click", function (ev) {
        ev.stopPropagation();
        insertExpr(item.e);
      });
      reuse.addEventListener("keydown", function (ev) { ev.stopPropagation(); });

      li.appendChild(e);
      li.appendChild(reuse);
      li.appendChild(r);
      li.tabIndex = 0;
      li.setAttribute("role", "button");
      li.setAttribute("aria-label", item.e + " = " + item.r);
      li.addEventListener("click", function () { insert(item.r); });
      li.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") {
          insert(item.r);
          ev.preventDefault();
          ev.stopPropagation();
        }
      });
      historyList.appendChild(li);
    });
  }

  function addHistory(expr, result) {
    state.history.unshift({ e: expr, r: result });
    if (state.history.length > 50) state.history.length = 50;
    save("calc.history", state.history);
    renderHistory();
  }

  function clearHistory() {
    state.history = [];
    save("calc.history", state.history);
    renderHistory();
  }

  function toggleHistory() {
    historyEl.classList.toggle("open");
  }

  function hasVar(n) { return typeof state.vars[n] === "number" && isFinite(state.vars[n]); }
  function persistVars() { save("calc.vars", state.vars); }
  function setVar(n, value) { state.vars[n] = isFinite(value) ? value : 0; persistVars(); renderVars(); }
  function clearVars() { state.vars = {}; persistVars(); renderVars(); }
  function toggleVars() { varPanel.classList.toggle("open"); }
  function toggleFracPanel() { fracPanel.classList.toggle("open"); }

  function renderVars() {
    if (!varList) return;
    varList.innerHTML = "";
    VAR_NAMES.forEach(function (name) {
      var li = document.createElement("li");
      li.className = "history-item var-item";

      var nm = document.createElement("button");
      nm.type = "button";
      nm.className = "v-name";
      nm.textContent = name;
      nm.title = "Insertar " + name + " en la expresión";
      nm.setAttribute("aria-label", "Insertar variable " + name);
      nm.addEventListener("click", function () { insert(name); });

      var val = document.createElement("span");
      val.className = "v-val";
      val.textContent = hasVar(name) ? Engine.format(state.vars[name]) : "\u2014";

      var sto = document.createElement("button");
      sto.type = "button";
      sto.className = "v-btn";
      sto.textContent = "STO";
      sto.title = "Guardar el valor actual en " + name;
      sto.addEventListener("click", function () { setVar(name, currentValue()); });

      var rcl = document.createElement("button");
      rcl.type = "button";
      rcl.className = "v-btn";
      rcl.textContent = "RCL";
      rcl.title = "Insertar el valor de " + name;
      rcl.addEventListener("click", function () {
        if (hasVar(name)) insert(Engine.format(state.vars[name]));
        else showToast(name + " vacía");
      });

      li.appendChild(nm);
      li.appendChild(val);
      li.appendChild(sto);
      li.appendChild(rcl);
      varList.appendChild(li);
    });
  }

  function insertFraction() {
    var expr = Engine.fractionToExpr(fracWhole.value, fracNum.value, fracDen.value);
    if (!expr) { showToast("Fracción no válida"); return; }
    insertExpr(expr);
    fracWhole.value = "";
    fracNum.value = "";
    fracDen.value = "";
    fracPanel.classList.remove("open");
  }

  function inverse() {
    var base = state.expr.trim() === "" ? Engine.format(state.ans) : state.expr;
    state.expr = "1/(" + base + ")";
    state.justEvaluated = false;
    preview();
    render();
  }

  function equals() {
    if (state.expr.trim() === "") return;
    var closed = autoClose(state.expr);
    try {
      var v = Engine.evaluate(closed, state.angle, state.percentMode, state.vars);
      state.expr = closed;
      state.value = v;
      state.ans = v;
      state.result = Engine.format(v);
      save("calc.ans", state.ans);
      addHistory(closed, state.result);
    } catch (e) {
      state.result = "Error";
    }
    state.justEvaluated = true;
    render();
  }

  function toggleAngle() {
    state.angle = state.angle === "DEG" ? "RAD" : "DEG";
    save("calc.angle", state.angle);
    updateIndicators();
    preview();
    render();
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeBtn.textContent = theme === "light" ? "\u2600\ufe0f" : "\ud83c\udf19";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#eceff3" : "#2b2f36");
  }

  function toggleTheme() {
    var cur = document.documentElement.getAttribute("data-theme") || "dark";
    var next = cur === "dark" ? "light" : "dark";
    applyTheme(next);
    save("calc.theme", next);
  }

  function initTheme() {
    var saved = load("calc.theme", null);
    if (saved === "light" || saved === "dark") { applyTheme(saved); return; }
    var prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    applyTheme(prefersLight ? "light" : "dark");
  }

  function toggleFrac() {
    state.fracMode = !state.fracMode;
    save("calc.frac", state.fracMode);
    fracBtn.classList.toggle("active", state.fracMode);
    render();
  }

  function togglePercentMode() {
    state.percentMode = state.percentMode === "percent" ? "modulo" : "percent";
    save("calc.percentMode", state.percentMode);
    updateIndicators();
    preview();
    render();
  }

  var toastTimer = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 1500);
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function copyResult() {
    var text = state.result;
    function done(ok) { showToast(ok ? "Copiado: " + text : "No se pudo copiar"); }
    if (window.navigator && window.navigator.clipboard && window.navigator.clipboard.writeText) {
      window.navigator.clipboard.writeText(text).then(
        function () { done(true); },
        function () { done(fallbackCopy(text)); }
      );
    } else {
      done(fallbackCopy(text));
    }
  }

  document.querySelector(".keys").addEventListener("click", function (ev) {
    var btn = ev.target.closest("button.key");
    if (!btn) return;
    var action = btn.getAttribute("data-action");
    var insertVal = btn.getAttribute("data-insert");
    if (insertVal !== null) insert(insertVal);
    else if (action === "clear") clearAll();
    else if (action === "back") backspace();
    else if (action === "equals") equals();
    else if (action === "angle") toggleAngle();
    else if (action === "sign") negate();
    else if (action === "ans") insert(Engine.format(state.ans));
    else if (action === "mc") memClear();
    else if (action === "mr") memRecall();
    else if (action === "mplus") memAdd();
    else if (action === "mminus") memSub();
    else if (action === "ms") memStore();
    else if (action === "hist") toggleHistory();
    else if (action === "vartoggle") toggleVars();
    else if (action === "fractoggle") toggleFracPanel();
    else if (action === "inv") inverse();
  });

  themeBtn.addEventListener("click", toggleTheme);
  slotBtn.addEventListener("click", cycleSlot);
  pctBtn.addEventListener("click", togglePercentMode);
  fracBtn.addEventListener("click", toggleFrac);
  copyBtn.addEventListener("click", copyResult);

  historyEl.addEventListener("click", function (ev) {
    if (ev.target.closest("[data-action='histclear']")) clearHistory();
  });

  varPanel.addEventListener("click", function (ev) {
    if (ev.target.closest("[data-action='varclear']")) clearVars();
  });

  fracInsertBtn.addEventListener("click", insertFraction);

  document.addEventListener("keydown", function (ev) {
    var key = ev.key;
    if (/^[0-9.]$/.test(key)) { insert(key); ev.preventDefault(); }
    else if (key === "+" || key === "-" || key === "^" || key === "(" || key === ")" || key === "!" || key === "%") { insert(key); ev.preventDefault(); }
    else if (key === "*") { insert("\u00d7"); ev.preventDefault(); }
    else if (key === "/") { insert("\u00f7"); ev.preventDefault(); }
    else if (key === "Enter" || key === "=") { equals(); ev.preventDefault(); }
    else if (key === "Backspace") { backspace(); ev.preventDefault(); }
    else if (key === "Escape") { clearAll(); ev.preventDefault(); }
    else if (key === "s") { insert("sin("); ev.preventDefault(); }
    else if (key === "c") { insert("cos("); ev.preventDefault(); }
    else if (key === "t") { insert("tan("); ev.preventDefault(); }
    else if (key === "l") { insert("log("); ev.preventDefault(); }
    else if (key === "n") { insert("ln("); ev.preventDefault(); }
    else if (key === "r") { insert("\u221a("); ev.preventDefault(); }
    else if (key === "p") { insert("\u03c0"); ev.preventDefault(); }
    else if (key === "e") { insert("e"); ev.preventDefault(); }
  });

  initTheme();
  updateIndicators();
  fracBtn.classList.toggle("active", state.fracMode);
  renderHistory();
  renderVars();
  render();

  if (window.navigator && "serviceWorker" in window.navigator) {
    window.addEventListener("load", function () {
      window.navigator.serviceWorker.register("sw.js").catch(function () { /* ignorar */ });
    });
  }
})();
