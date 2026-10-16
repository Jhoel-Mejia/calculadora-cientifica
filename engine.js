(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CalcEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var FUNCS = ["sin", "cos", "tan", "asin", "acos", "atan", "log", "ln", "sqrt", "abs", "cbrt"];

  function tokenize(src) {
    var s = src.replace(/\u00d7/g, "*").replace(/\u00f7/g, "/").replace(/\u2212/g, "-");
    var tokens = [];
    var i = 0;
    var n = s.length;
    function isDigit(c) { return c >= "0" && c <= "9"; }
    function isAlpha(c) { return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z"); }
    while (i < n) {
      var c = s[i];
      if (c === " ") { i++; continue; }
      if (isDigit(c) || c === ".") {
        var j = i;
        while (j < n && (isDigit(s[j]) || s[j] === ".")) j++;
        var numStr = s.slice(i, j);
        if ((numStr.match(/\./g) || []).length > 1) throw new Error("Numero invalido");
        tokens.push({ t: "num", v: parseFloat(numStr) });
        i = j;
        continue;
      }
      if (c === "\u03c0") { tokens.push({ t: "const", v: Math.PI }); i++; continue; }
      if (c === "\u221a") { tokens.push({ t: "func", v: "sqrt" }); i++; continue; }
      if (isAlpha(c)) {
        var k = i;
        while (k < n && isAlpha(s[k])) k++;
        var name = s.slice(i, k).toLowerCase();
        if (name === "pi") tokens.push({ t: "const", v: Math.PI });
        else if (name === "e") tokens.push({ t: "const", v: Math.E });
        else if (FUNCS.indexOf(name) !== -1) tokens.push({ t: "func", v: name });
        else throw new Error("Desconocido: " + name);
        i = k;
        continue;
      }
      if ("+-*/^!%()".indexOf(c) !== -1) { tokens.push({ t: "op", v: c }); i++; continue; }
      throw new Error("Caracter invalido");
    }
    return tokens;
  }

  function factorial(x) {
    if (x < 0 || Math.floor(x) !== x) throw new Error("Factorial invalido");
    if (x > 170) return Infinity;
    var r = 1;
    for (var i = 2; i <= x; i++) r *= i;
    return r;
  }

  function makeApplyFunc(angle) {
    function toRad(x) { return angle === "DEG" ? x * Math.PI / 180 : x; }
    function fromRad(x) { return angle === "DEG" ? x * 180 / Math.PI : x; }
    return function (name, x) {
      switch (name) {
        case "sin": return Math.sin(toRad(x));
        case "cos": return Math.cos(toRad(x));
        case "tan": return Math.tan(toRad(x));
        case "asin": return fromRad(Math.asin(x));
        case "acos": return fromRad(Math.acos(x));
        case "atan": return fromRad(Math.atan(x));
        case "log": return Math.log10(x);
        case "ln": return Math.log(x);
        case "sqrt": return Math.sqrt(x);
        case "abs": return Math.abs(x);
        case "cbrt": return Math.cbrt(x);
        default: throw new Error("Funcion invalida");
      }
    };
  }

  function evaluate(src, angle) {
    angle = angle || "DEG";
    var applyFunc = makeApplyFunc(angle);
    var tokens = tokenize(src);
    var pos = 0;
    function peek() { return tokens[pos]; }
    function next() { return tokens[pos++]; }
    function isOp(v) { var t = peek(); return t && t.t === "op" && t.v === v; }
    function startsValue() {
      var t = peek();
      if (!t) return false;
      return t.t === "num" || t.t === "const" || t.t === "func" || (t.t === "op" && t.v === "(");
    }

    function parseExpr() {
      var left = parseTerm();
      while (peek() && peek().t === "op" && (peek().v === "+" || peek().v === "-")) {
        var op = next().v;
        var right = parseTerm();
        left = op === "+" ? left + right : left - right;
      }
      return left;
    }

    function parseTerm() {
      var left = parseFactor();
      while (true) {
        if (peek() && peek().t === "op" && (peek().v === "*" || peek().v === "/")) {
          var op = next().v;
          var right = parseFactor();
          left = op === "*" ? left * right : left / right;
        } else if (startsValue()) {
          left = left * parseFactor();
        } else break;
      }
      return left;
    }

    function parseFactor() {
      var base = parseUnary();
      if (isOp("^")) {
        next();
        base = Math.pow(base, parseFactor());
      }
      return base;
    }

    function parseUnary() {
      if (peek() && peek().t === "op" && (peek().v === "-" || peek().v === "+")) {
        var op = next().v;
        var v = parseUnary();
        return op === "-" ? -v : v;
      }
      return parsePostfix();
    }

    function parsePostfix() {
      var v = parsePrimary();
      while (peek() && peek().t === "op" && (peek().v === "!" || peek().v === "%")) {
        v = next().v === "!" ? factorial(v) : v / 100;
      }
      return v;
    }

    function parsePrimary() {
      var t = peek();
      if (!t) throw new Error("Expresion incompleta");
      if (t.t === "num") { next(); return t.v; }
      if (t.t === "const") { next(); return t.v; }
      if (t.t === "func") {
        var name = next().v;
        if (!isOp("(")) throw new Error("Falta (");
        next();
        var arg = parseExpr();
        if (!isOp(")")) throw new Error("Falta )");
        next();
        return applyFunc(name, arg);
      }
      if (t.t === "op" && t.v === "(") {
        next();
        var inner = parseExpr();
        if (!isOp(")")) throw new Error("Falta )");
        next();
        return inner;
      }
      throw new Error("Sintaxis");
    }

    var result = parseExpr();
    if (pos < tokens.length) throw new Error("Sintaxis");
    return result;
  }

  function format(n) {
    if (typeof n !== "number" || !isFinite(n)) throw new Error("No finito");
    if (n === 0) return "0";
    var a = Math.abs(n);
    if (a >= 1e12 || a < 1e-9) {
      return n.toExponential(8).replace(/(\.\d*?)0+e/, "$1e").replace(/\.e/, "e");
    }
    return String(parseFloat(n.toPrecision(12)));
  }

  return { evaluate: evaluate, format: format, tokenize: tokenize };
});
