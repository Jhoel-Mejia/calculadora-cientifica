(function () {
  "use strict";

  var Engine = window.CalcEngine;
  var exprEl = document.getElementById("expression");
  var resEl = document.getElementById("result");
  var angleEl = document.getElementById("angle");
  var degBtn = document.getElementById("degBtn");

  var state = {
    expr: "",
    result: "0",
    ans: 0,
    angle: "DEG",
    justEvaluated: false
  };

  function render() {
    exprEl.textContent = state.expr;
    resEl.textContent = state.result;
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

  function equals() {
    if (state.expr.trim() === "") return;
    try {
      var v = Engine.evaluate(state.expr, state.angle);
      state.ans = v;
      state.result = Engine.format(v);
    } catch (e) {
      state.result = "Error";
    }
    state.justEvaluated = true;
    render();
  }

  function toggleAngle() {
    state.angle = state.angle === "DEG" ? "RAD" : "DEG";
    angleEl.textContent = state.angle;
    degBtn.textContent = state.angle;
    preview();
    render();
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

  render();
})();
