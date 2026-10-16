(function () {
  "use strict";

  var Engine = window.CalcEngine;
  var exprEl = document.getElementById("expression");
  var resEl = document.getElementById("result");
  var angleEl = document.getElementById("angle");
  var memEl = document.getElementById("mem");
  var degBtn = document.getElementById("degBtn");
  var themeBtn = document.getElementById("themeBtn");
  var historyEl = document.getElementById("history");
  var historyList = document.getElementById("historyList");

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
    ans: load("calc.ans", 0),
    angle: load("calc.angle", "DEG") === "RAD" ? "RAD" : "DEG",
    memory: load("calc.memory", 0),
    history: load("calc.history", []) || [],
    justEvaluated: false
  };
  if (!(state.ans === state.ans)) state.ans = 0;
  if (!(state.memory === state.memory)) state.memory = 0;

  function render() {
    exprEl.textContent = state.expr;
    resEl.textContent = state.result;
  }

  function updateIndicators() {
    angleEl.textContent = state.angle;
    degBtn.textContent = state.angle;
    memEl.classList.toggle("active", state.memory !== 0);
  }

  function preview() {
    if (state.expr.trim() === "") { state.result = "0"; return; }
    try { state.result = Engine.format(Engine.evaluate(state.expr, state.angle)); } catch (e) { /* mantener */ }
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

  function clearAll() {
    state.expr = "";
    state.result = "0";
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
    try { return Engine.evaluate(state.expr, state.angle); } catch (e) { return state.ans; }
  }

  function setMemory(value) {
    state.memory = isFinite(value) ? value : 0;
    persistMemory();
    updateIndicators();
  }
  function memStore() { setMemory(currentValue()); }
  function memAdd() { setMemory(state.memory + currentValue()); }
  function memSub() { setMemory(state.memory - currentValue()); }
  function memRecall() { insert(Engine.format(state.memory)); }
  function memClear() { setMemory(0); }
  function persistMemory() { save("calc.memory", state.memory); }

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
      li.appendChild(e);
      li.appendChild(r);
      li.addEventListener("click", function () { insert(item.r); });
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

  function equals() {
    if (state.expr.trim() === "") return;
    try {
      var v = Engine.evaluate(state.expr, state.angle);
      state.ans = v;
      state.result = Engine.format(v);
      save("calc.ans", state.ans);
      addHistory(state.expr, state.result);
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
  });

  themeBtn.addEventListener("click", toggleTheme);

  historyEl.addEventListener("click", function (ev) {
    if (ev.target.closest("[data-action='histclear']")) clearHistory();
  });

  document.addEventListener("keydown", function (ev) {
    var key = ev.key;
    if (/^[0-9.]$/.test(key)) { insert(key); ev.preventDefault(); }
    else if (key === "+" || key === "-" || key === "^" || key === "(" || key === ")" || key === "!" || key === "%") { insert(key); ev.preventDefault(); }
    else if (key === "*") { insert("\u00d7"); ev.preventDefault(); }
    else if (key === "/") { insert("\u00f7"); ev.preventDefault(); }
    else if (key === "Enter" || key === "=") { equals(); ev.preventDefault(); }
    else if (key === "Backspace") { backspace(); ev.preventDefault(); }
    else if (key === "Escape") { clearAll(); ev.preventDefault(); }
  });

  initTheme();
  updateIndicators();
  renderHistory();
  render();
})();
