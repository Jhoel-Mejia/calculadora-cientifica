(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CalcEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var FUNCS = ["sin", "cos", "tan", "asin", "acos", "atan", "log", "ln", "sqrt", "abs", "cbrt"];
  var VARS = ["A", "B", "C", "D", "E", "F"];

  function tokenize(src, vars) {
    var s = src.replace(/\u00d7/g, "*").replace(/\u00f7/g, "/").replace(/\u2212/g, "-");
    var tokens = [];
    var i = 0;
    var n = s.length;
    function isDigit(c) { return c >= "0" && c <= "9"; }
    function isAlpha(c) { return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z"); }
    while (i < n) {
      var c = s[i];
      if (c === " ") { i++; continue; }
      if (c === "0" && i + 1 < n && "xXbBoO".indexOf(s[i + 1]) !== -1) {
        var pref = s[i + 1].toLowerCase();
        var base = pref === "x" ? 16 : pref === "o" ? 8 : 2;
        var d0 = i + 2;
        var d1 = d0;
        while (d1 < n && digitVal(s[d1]) < base) d1++;
        var lit = s.slice(d0, d1);
        if (lit === "") throw new Error("Numero invalido");
        tokens.push({ t: "num", v: parseInt(lit, base) });
        i = d1;
        continue;
      }
      if (isDigit(c) || c === ".") {
        var j = i;
        while (j < n && (isDigit(s[j]) || s[j] === ".")) j++;
        if (j < n && (s[j] === "e" || s[j] === "E")) {
          var ex = j + 1;
          if (ex < n && (s[ex] === "+" || s[ex] === "-")) ex++;
          var dstart = ex;
          while (ex < n && isDigit(s[ex])) ex++;
          if (ex > dstart) j = ex;
        }
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
        var raw = s.slice(i, k);
        var name = raw.toLowerCase();
        if (name === "pi") tokens.push({ t: "const", v: Math.PI });
        else if (raw === "e") tokens.push({ t: "const", v: Math.E });
        else if (FUNCS.indexOf(name) !== -1) tokens.push({ t: "func", v: name });
        else if (raw.length === 1 && VARS.indexOf(raw) !== -1) tokens.push({ t: "var", v: raw });
        else throw new Error("Desconocido: " + raw);
        i = k;
        continue;
      }
      if ("+-*/^!%()".indexOf(c) !== -1) { tokens.push({ t: "op", v: c }); i++; continue; }
      throw new Error("Caracter invalido");
    }
    return tokens;
  }

  function digitVal(c) {
    if (c >= "0" && c <= "9") return c.charCodeAt(0) - 48;
    var l = c.toLowerCase();
    if (l >= "a" && l <= "f") return l.charCodeAt(0) - 87;
    return 99;
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
        case "tan": {
          var t = Math.tan(toRad(x));
          if (Math.abs(t) > 1e15) throw new Error("Indefinido");
          return t;
        }
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

  function evaluate(src, angle, percentMode, vars) {
    angle = angle || "DEG";
    percentMode = percentMode === "modulo" ? "modulo" : "percent";
    vars = vars || {};
    var applyFunc = makeApplyFunc(angle);
    var tokens = tokenize(src, vars);
    var pos = 0;
    function peek() { return tokens[pos]; }
    function next() { return tokens[pos++]; }
    function isOp(v) { var t = peek(); return t && t.t === "op" && t.v === v; }
    function startsValue() {
      var t = peek();
      if (!t) return false;
      return t.t === "num" || t.t === "const" || t.t === "var" || t.t === "func" || (t.t === "op" && t.v === "(");
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
      var left = parseUnary();
      while (true) {
        var t = peek();
        var isMul = t && t.t === "op" && (t.v === "*" || t.v === "/" || (percentMode === "modulo" && t.v === "%"));
        if (isMul) {
          var op = next().v;
          var right = parseUnary();
          if (op === "*") left = left * right;
          else if (op === "/") left = left / right;
          else left = left % right;
        } else if (startsValue()) {
          left = left * parseUnary();
        } else break;
      }
      return left;
    }

    function parseUnary() {
      if (peek() && peek().t === "op" && (peek().v === "-" || peek().v === "+")) {
        var op = next().v;
        var v = parseUnary();
        return op === "-" ? -v : v;
      }
      return parsePower();
    }

    function parsePower() {
      var base = parsePostfix();
      if (isOp("^")) {
        next();
        base = Math.pow(base, parseUnary());
      }
      return base;
    }

    function parsePostfix() {
      var v = parsePrimary();
      while (peek() && peek().t === "op" && (peek().v === "!" || (percentMode === "percent" && peek().v === "%"))) {
        v = next().v === "!" ? factorial(v) : v / 100;
      }
      return v;
    }

    function parsePrimary() {
      var t = peek();
      if (!t) throw new Error("Expresion incompleta");
      if (t.t === "num") { next(); return t.v; }
      if (t.t === "const") { next(); return t.v; }
      if (t.t === "var") {
        next();
        if (typeof vars[t.v] !== "number" || !isFinite(vars[t.v])) throw new Error("Variable " + t.v + " vacia");
        return vars[t.v];
      }
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

  function autoClose(expr) {
    var open = 0;
    for (var i = 0; i < expr.length; i++) {
      if (expr[i] === "(") open++;
      else if (expr[i] === ")") open = Math.max(0, open - 1);
    }
    var s = expr;
    while (open-- > 0) s += ")";
    return s;
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

  function toFraction(x, maxDen) {
    maxDen = maxDen || 1000000;
    if (typeof x !== "number" || !isFinite(x)) return null;
    if (Math.floor(x) === x) return { n: x, d: 1 };
    var sign = x < 0 ? -1 : 1;
    var v = Math.abs(x);
    var h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = v;
    for (var i = 0; i < 40; i++) {
      var a = Math.floor(b);
      var h2 = a * h1 + h0; h0 = h1; h1 = h2;
      var k2 = a * k1 + k0; k0 = k1; k1 = k2;
      if (Math.abs(v - h1 / k1) < 1e-11) break;
      b = 1 / (b - a);
      if (k1 > maxDen) return null;
    }
    if (k1 > maxDen) return null;
    return { n: sign * h1, d: k1 };
  }

  function formatFraction(x, maxDen) {
    var f = toFraction(x, maxDen);
    if (!f) return null;
    if (format(f.n / f.d) !== format(x)) return null;
    if (f.d === 1) return String(f.n);
    var sign = f.n < 0 ? "-" : "";
    var num = Math.abs(f.n);
    if (num >= f.d) {
      return sign + Math.floor(num / f.d) + " " + (num % f.d) + "/" + f.d;
    }
    return sign + num + "/" + f.d;
  }

  function toBase(n, base) {
    if (typeof n !== "number" || !isFinite(n)) return "\u2014";
    var neg = n < 0;
    var x = Math.floor(Math.abs(n));
    var s = x.toString(base).toUpperCase();
    return (neg ? "-" : "") + s;
  }

  function fractionToExpr(whole, num, den) {
    whole = whole === "" || whole === null || whole === undefined ? 0 : Number(whole);
    num = Number(num);
    den = Number(den);
    if (!isFinite(whole) || !isFinite(num) || !isFinite(den)) return null;
    if (den === 0) return null;
    if (Math.floor(whole) !== whole || Math.floor(num) !== num || Math.floor(den) !== den) return null;
    var frac = "(" + num + "/" + den + ")";
    if (whole === 0) return frac;
    return "(" + whole + "+" + frac + ")";
  }

  return {
    evaluate: evaluate,
    format: format,
    tokenize: tokenize,
    autoClose: autoClose,
    toFraction: toFraction,
    formatFraction: formatFraction,
    fractionToExpr: fractionToExpr,
    toBase: toBase,
    VARS: VARS.slice()
  };
});
