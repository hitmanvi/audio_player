import { protocol as Qe, app as W, ipcMain as E, dialog as ce, BrowserWindow as le, net as _t } from "electron";
import g from "node:path";
import b from "node:fs";
import { fileURLToPath as X, pathToFileURL as Rt } from "node:url";
import { TextDecoder as de } from "node:util";
import { open as Mt } from "node:fs/promises";
import Bt from "tty";
import Ft from "util";
const Dt = "End-Of-Stream";
let P = class extends Error {
  constructor() {
    super(Dt), this.name = "EndOfStreamError";
  }
}, et = class {
  /**
   * Constructor
   * @param options Tokenizer options
   * @protected
   */
  constructor(e) {
    this.numBuffer = new Uint8Array(8), this.position = 0, this.onClose = e == null ? void 0 : e.onClose, e != null && e.abortSignal && e.abortSignal.addEventListener("abort", () => {
      this.abort();
    });
  }
  /**
   * Read a token from the tokenizer-stream
   * @param token - The token to read
   * @param position - If provided, the desired position in the tokenizer-stream
   * @returns Promise with token data
   */
  async readToken(e, t = this.position) {
    const r = new Uint8Array(e.len);
    if (await this.readBuffer(r, { position: t }) < e.len)
      throw new P();
    return e.get(r, 0);
  }
  /**
   * Peek a token from the tokenizer-stream.
   * @param token - Token to peek from the tokenizer-stream.
   * @param position - Offset where to begin reading within the file. If position is null, data will be read from the current file position.
   * @returns Promise with token data
   */
  async peekToken(e, t = this.position) {
    const r = new Uint8Array(e.len);
    if (await this.peekBuffer(r, { position: t }) < e.len)
      throw new P();
    return e.get(r, 0);
  }
  /**
   * Read a numeric token from the stream
   * @param token - Numeric token
   * @returns Promise with number
   */
  async readNumber(e) {
    if (await this.readBuffer(this.numBuffer, { length: e.len }) < e.len)
      throw new P();
    return e.get(this.numBuffer, 0);
  }
  /**
   * Read a numeric token from the stream
   * @param token - Numeric token
   * @returns Promise with number
   */
  async peekNumber(e) {
    if (await this.peekBuffer(this.numBuffer, { length: e.len }) < e.len)
      throw new P();
    return e.get(this.numBuffer, 0);
  }
  /**
   * Ignore number of bytes, advances the pointer in under tokenizer-stream.
   * @param length - Number of bytes to ignore
   * @return resolves the number of bytes ignored, equals length if this available, otherwise the number of bytes available
   */
  async ignore(e) {
    if (this.fileInfo.size !== void 0) {
      const t = this.fileInfo.size - this.position;
      if (e > t)
        return this.position += t, t;
    }
    return this.position += e, e;
  }
  async close() {
    var e;
    await this.abort(), await ((e = this.onClose) == null ? void 0 : e.call(this));
  }
  normalizeOptions(e, t) {
    if (!this.supportsRandomAccess() && t && t.position !== void 0 && t.position < this.position)
      throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
    return {
      mayBeLess: !1,
      offset: 0,
      length: e.length,
      position: this.position,
      ...t
    };
  }
  abort() {
    return Promise.resolve();
  }
}, Ot = class extends et {
  /**
   * Construct BufferTokenizer
   * @param uint8Array - Uint8Array to tokenize
   * @param options Tokenizer options
   */
  constructor(e, t) {
    super(t), this.uint8Array = e, this.fileInfo = { ...(t == null ? void 0 : t.fileInfo) ?? {}, size: e.length };
  }
  /**
   * Read buffer from tokenizer
   * @param uint8Array - Uint8Array to tokenize
   * @param options - Read behaviour options
   * @returns {Promise<number>}
   */
  async readBuffer(e, t) {
    t != null && t.position && (this.position = t.position);
    const r = await this.peekBuffer(e, t);
    return this.position += r, r;
  }
  /**
   * Peek (read ahead) buffer from tokenizer
   * @param uint8Array
   * @param options - Read behaviour options
   * @returns {Promise<number>}
   */
  async peekBuffer(e, t) {
    const r = this.normalizeOptions(e, t), n = Math.min(this.uint8Array.length - r.position, r.length);
    if (!r.mayBeLess && n < r.length)
      throw new P();
    return e.set(this.uint8Array.subarray(r.position, r.position + n)), n;
  }
  close() {
    return super.close();
  }
  supportsRandomAccess() {
    return !0;
  }
  setPosition(e) {
    this.position = e;
  }
};
function Fe(i, e) {
  return new Ot(i, e);
}
class Se extends et {
  /**
   * Create tokenizer from provided file path
   * @param sourceFilePath File path
   */
  static async fromFile(e) {
    const t = await Mt(e, "r"), r = await t.stat();
    return new Se(t, { fileInfo: { path: e, size: r.size } });
  }
  constructor(e, t) {
    super(t), this.fileHandle = e, this.fileInfo = t.fileInfo;
  }
  /**
   * Read buffer from file
   * @param uint8Array - Uint8Array to write result to
   * @param options - Read behaviour options
   * @returns Promise number of bytes read
   */
  async readBuffer(e, t) {
    const r = this.normalizeOptions(e, t);
    if (this.position = r.position, r.length === 0)
      return 0;
    const n = await this.fileHandle.read(e, 0, r.length, r.position);
    if (this.position += n.bytesRead, n.bytesRead < r.length && (!t || !t.mayBeLess))
      throw new P();
    return n.bytesRead;
  }
  /**
   * Peek buffer from file
   * @param uint8Array - Uint8Array (or Buffer) to write data to
   * @param options - Read behaviour options
   * @returns Promise number of bytes read
   */
  async peekBuffer(e, t) {
    const r = this.normalizeOptions(e, t), n = await this.fileHandle.read(e, 0, r.length, r.position);
    if (!r.mayBeLess && n.bytesRead < r.length)
      throw new P();
    return n.bytesRead;
  }
  async close() {
    return await this.fileHandle.close(), super.close();
  }
  setPosition(e) {
    this.position = e;
  }
  supportsRandomAccess() {
    return !0;
  }
}
const Pt = Se.fromFile;
function Lt(i) {
  return i && i.__esModule && Object.prototype.hasOwnProperty.call(i, "default") ? i.default : i;
}
var we = { exports: {} }, Z = { exports: {} }, he, De;
function Nt() {
  if (De) return he;
  De = 1;
  var i = 1e3, e = i * 60, t = e * 60, r = t * 24, n = r * 7, a = r * 365.25;
  he = function(m, u) {
    u = u || {};
    var l = typeof m;
    if (l === "string" && m.length > 0)
      return s(m);
    if (l === "number" && isFinite(m))
      return u.long ? c(m) : o(m);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(m)
    );
  };
  function s(m) {
    if (m = String(m), !(m.length > 100)) {
      var u = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        m
      );
      if (u) {
        var l = parseFloat(u[1]), f = (u[2] || "ms").toLowerCase();
        switch (f) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return l * a;
          case "weeks":
          case "week":
          case "w":
            return l * n;
          case "days":
          case "day":
          case "d":
            return l * r;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return l * t;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return l * e;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return l * i;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return l;
          default:
            return;
        }
      }
    }
  }
  function o(m) {
    var u = Math.abs(m);
    return u >= r ? Math.round(m / r) + "d" : u >= t ? Math.round(m / t) + "h" : u >= e ? Math.round(m / e) + "m" : u >= i ? Math.round(m / i) + "s" : m + "ms";
  }
  function c(m) {
    var u = Math.abs(m);
    return u >= r ? p(m, u, r, "day") : u >= t ? p(m, u, t, "hour") : u >= e ? p(m, u, e, "minute") : u >= i ? p(m, u, i, "second") : m + " ms";
  }
  function p(m, u, l, f) {
    var h = u >= l * 1.5;
    return Math.round(m / l) + " " + f + (h ? "s" : "");
  }
  return he;
}
var xe, Oe;
function tt() {
  if (Oe) return xe;
  Oe = 1;
  function i(e) {
    r.debug = r, r.default = r, r.coerce = p, r.disable = o, r.enable = a, r.enabled = c, r.humanize = Nt(), r.destroy = m, Object.keys(e).forEach((u) => {
      r[u] = e[u];
    }), r.names = [], r.skips = [], r.formatters = {};
    function t(u) {
      let l = 0;
      for (let f = 0; f < u.length; f++)
        l = (l << 5) - l + u.charCodeAt(f), l |= 0;
      return r.colors[Math.abs(l) % r.colors.length];
    }
    r.selectColor = t;
    function r(u) {
      let l, f = null, h, x;
      function w(...k) {
        if (!w.enabled)
          return;
        const B = w, Y = Number(/* @__PURE__ */ new Date()), Ct = Y - (l || Y);
        B.diff = Ct, B.prev = l, B.curr = Y, l = Y, k[0] = r.coerce(k[0]), typeof k[0] != "string" && k.unshift("%O");
        let K = 0;
        k[0] = k[0].replace(/%([a-zA-Z%])/g, (fe, At) => {
          if (fe === "%%")
            return "%";
          K++;
          const Be = r.formatters[At];
          if (typeof Be == "function") {
            const Et = k[K];
            fe = Be.call(B, Et), k.splice(K, 1), K--;
          }
          return fe;
        }), r.formatArgs.call(B, k), (B.log || r.log).apply(B, k);
      }
      return w.namespace = u, w.useColors = r.useColors(), w.color = r.selectColor(u), w.extend = n, w.destroy = r.destroy, Object.defineProperty(w, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => f !== null ? f : (h !== r.namespaces && (h = r.namespaces, x = r.enabled(u)), x),
        set: (k) => {
          f = k;
        }
      }), typeof r.init == "function" && r.init(w), w;
    }
    function n(u, l) {
      const f = r(this.namespace + (typeof l > "u" ? ":" : l) + u);
      return f.log = this.log, f;
    }
    function a(u) {
      r.save(u), r.namespaces = u, r.names = [], r.skips = [];
      const l = (typeof u == "string" ? u : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const f of l)
        f[0] === "-" ? r.skips.push(f.slice(1)) : r.names.push(f);
    }
    function s(u, l) {
      let f = 0, h = 0, x = -1, w = 0;
      for (; f < u.length; )
        if (h < l.length && (l[h] === u[f] || l[h] === "*"))
          l[h] === "*" ? (x = h, w = f, h++) : (f++, h++);
        else if (x !== -1)
          h = x + 1, w++, f = w;
        else
          return !1;
      for (; h < l.length && l[h] === "*"; )
        h++;
      return h === l.length;
    }
    function o() {
      const u = [
        ...r.names,
        ...r.skips.map((l) => "-" + l)
      ].join(",");
      return r.enable(""), u;
    }
    function c(u) {
      for (const l of r.skips)
        if (s(u, l))
          return !1;
      for (const l of r.names)
        if (s(u, l))
          return !0;
      return !1;
    }
    function p(u) {
      return u instanceof Error ? u.stack || u.message : u;
    }
    function m() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return r.enable(r.load()), r;
  }
  return xe = i, xe;
}
var Pe;
function zt() {
  return Pe || (Pe = 1, function(i, e) {
    e.formatArgs = r, e.save = n, e.load = a, e.useColors = t, e.storage = s(), e.destroy = /* @__PURE__ */ (() => {
      let c = !1;
      return () => {
        c || (c = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), e.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function t() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let c;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (c = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(c[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function r(c) {
      if (c[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + c[0] + (this.useColors ? "%c " : " ") + "+" + i.exports.humanize(this.diff), !this.useColors)
        return;
      const p = "color: " + this.color;
      c.splice(1, 0, p, "color: inherit");
      let m = 0, u = 0;
      c[0].replace(/%[a-zA-Z%]/g, (l) => {
        l !== "%%" && (m++, l === "%c" && (u = m));
      }), c.splice(u, 0, p);
    }
    e.log = console.debug || console.log || (() => {
    });
    function n(c) {
      try {
        c ? e.storage.setItem("debug", c) : e.storage.removeItem("debug");
      } catch {
      }
    }
    function a() {
      let c;
      try {
        c = e.storage.getItem("debug") || e.storage.getItem("DEBUG");
      } catch {
      }
      return !c && typeof process < "u" && "env" in process && (c = process.env.DEBUG), c;
    }
    function s() {
      try {
        return localStorage;
      } catch {
      }
    }
    i.exports = tt()(e);
    const { formatters: o } = i.exports;
    o.j = function(c) {
      try {
        return JSON.stringify(c);
      } catch (p) {
        return "[UnexpectedJSONParseError]: " + p.message;
      }
    };
  }(Z, Z.exports)), Z.exports;
}
var J = { exports: {} }, Le;
function Ut() {
  return Le || (Le = 1, function(i, e) {
    const t = Bt, r = Ft;
    e.init = m, e.log = o, e.formatArgs = a, e.save = c, e.load = p, e.useColors = n, e.destroy = r.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), e.colors = [6, 2, 3, 4, 5, 1];
    try {
      const l = require("supports-color");
      l && (l.stderr || l).level >= 2 && (e.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    e.inspectOpts = Object.keys(process.env).filter((l) => /^debug_/i.test(l)).reduce((l, f) => {
      const h = f.substring(6).toLowerCase().replace(/_([a-z])/g, (w, k) => k.toUpperCase());
      let x = process.env[f];
      return /^(yes|on|true|enabled)$/i.test(x) ? x = !0 : /^(no|off|false|disabled)$/i.test(x) ? x = !1 : x === "null" ? x = null : x = Number(x), l[h] = x, l;
    }, {});
    function n() {
      return "colors" in e.inspectOpts ? !!e.inspectOpts.colors : t.isatty(process.stderr.fd);
    }
    function a(l) {
      const { namespace: f, useColors: h } = this;
      if (h) {
        const x = this.color, w = "\x1B[3" + (x < 8 ? x : "8;5;" + x), k = `  ${w};1m${f} \x1B[0m`;
        l[0] = k + l[0].split(`
`).join(`
` + k), l.push(w + "m+" + i.exports.humanize(this.diff) + "\x1B[0m");
      } else
        l[0] = s() + f + " " + l[0];
    }
    function s() {
      return e.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function o(...l) {
      return process.stderr.write(r.formatWithOptions(e.inspectOpts, ...l) + `
`);
    }
    function c(l) {
      l ? process.env.DEBUG = l : delete process.env.DEBUG;
    }
    function p() {
      return process.env.DEBUG;
    }
    function m(l) {
      l.inspectOpts = {};
      const f = Object.keys(e.inspectOpts);
      for (let h = 0; h < f.length; h++)
        l.inspectOpts[f[h]] = e.inspectOpts[f[h]];
    }
    i.exports = tt()(e);
    const { formatters: u } = i.exports;
    u.o = function(l) {
      return this.inspectOpts.colors = this.useColors, r.inspect(l, this.inspectOpts).split(`
`).map((f) => f.trim()).join(" ");
    }, u.O = function(l) {
      return this.inspectOpts.colors = this.useColors, r.inspect(l, this.inspectOpts);
    };
  }(J, J.exports)), J.exports;
}
typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? we.exports = zt() : we.exports = Ut();
var Xt = we.exports;
const q = /* @__PURE__ */ Lt(Xt), Gt = "End-Of-Stream";
class I extends Error {
  constructor() {
    super(Gt);
  }
}
class jt {
  constructor() {
    this.maxStreamReadSize = 1 * 1024 * 1024, this.endOfStream = !1, this.peekQueue = [];
  }
  async peek(e, t, r) {
    const n = await this.read(e, t, r);
    return this.peekQueue.push(e.subarray(t, t + n)), n;
  }
  async read(e, t, r) {
    if (r === 0)
      return 0;
    let n = this.readFromPeekBuffer(e, t, r);
    if (n += await this.readRemainderFromStream(e, t + n, r - n), n === 0)
      throw new I();
    return n;
  }
  /**
   * Read chunk from stream
   * @param buffer - Target Uint8Array (or Buffer) to store data read from stream in
   * @param offset - Offset target
   * @param length - Number of bytes to read
   * @returns Number of bytes read
   */
  readFromPeekBuffer(e, t, r) {
    let n = r, a = 0;
    for (; this.peekQueue.length > 0 && n > 0; ) {
      const s = this.peekQueue.pop();
      if (!s)
        throw new Error("peekData should be defined");
      const o = Math.min(s.length, n);
      e.set(s.subarray(0, o), t + a), a += o, n -= o, o < s.length && this.peekQueue.push(s.subarray(o));
    }
    return a;
  }
  async readRemainderFromStream(e, t, r) {
    let n = r, a = 0;
    for (; n > 0 && !this.endOfStream; ) {
      const s = Math.min(n, this.maxStreamReadSize), o = await this.readFromStream(e, t + a, s);
      if (o === 0)
        break;
      a += o, n -= o;
    }
    return a;
  }
}
class Wt extends jt {
  constructor(e) {
    super(), this.reader = e.getReader({ mode: "byob" });
  }
  async readFromStream(e, t, r) {
    if (this.endOfStream)
      throw new I();
    const n = await this.reader.read(new Uint8Array(r));
    return n.done && (this.endOfStream = n.done), n.value ? (e.set(n.value, t), n.value.byteLength) : 0;
  }
  abort() {
    return this.reader.cancel();
  }
  async close() {
    await this.abort(), this.reader.releaseLock();
  }
}
class it {
  /**
   * Constructor
   * @param options Tokenizer options
   * @protected
   */
  constructor(e) {
    this.numBuffer = new Uint8Array(8), this.position = 0, this.onClose = e == null ? void 0 : e.onClose, e != null && e.abortSignal && e.abortSignal.addEventListener("abort", () => {
      this.abort();
    });
  }
  /**
   * Read a token from the tokenizer-stream
   * @param token - The token to read
   * @param position - If provided, the desired position in the tokenizer-stream
   * @returns Promise with token data
   */
  async readToken(e, t = this.position) {
    const r = new Uint8Array(e.len);
    if (await this.readBuffer(r, { position: t }) < e.len)
      throw new I();
    return e.get(r, 0);
  }
  /**
   * Peek a token from the tokenizer-stream.
   * @param token - Token to peek from the tokenizer-stream.
   * @param position - Offset where to begin reading within the file. If position is null, data will be read from the current file position.
   * @returns Promise with token data
   */
  async peekToken(e, t = this.position) {
    const r = new Uint8Array(e.len);
    if (await this.peekBuffer(r, { position: t }) < e.len)
      throw new I();
    return e.get(r, 0);
  }
  /**
   * Read a numeric token from the stream
   * @param token - Numeric token
   * @returns Promise with number
   */
  async readNumber(e) {
    if (await this.readBuffer(this.numBuffer, { length: e.len }) < e.len)
      throw new I();
    return e.get(this.numBuffer, 0);
  }
  /**
   * Read a numeric token from the stream
   * @param token - Numeric token
   * @returns Promise with number
   */
  async peekNumber(e) {
    if (await this.peekBuffer(this.numBuffer, { length: e.len }) < e.len)
      throw new I();
    return e.get(this.numBuffer, 0);
  }
  /**
   * Ignore number of bytes, advances the pointer in under tokenizer-stream.
   * @param length - Number of bytes to ignore
   * @return resolves the number of bytes ignored, equals length if this available, otherwise the number of bytes available
   */
  async ignore(e) {
    if (this.fileInfo.size !== void 0) {
      const t = this.fileInfo.size - this.position;
      if (e > t)
        return this.position += t, t;
    }
    return this.position += e, e;
  }
  async close() {
    var e;
    await this.abort(), await ((e = this.onClose) == null ? void 0 : e.call(this));
  }
  normalizeOptions(e, t) {
    if (t && t.position !== void 0 && t.position < this.position)
      throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
    return t ? {
      mayBeLess: t.mayBeLess === !0,
      offset: t.offset ? t.offset : 0,
      length: t.length ? t.length : e.length - (t.offset ? t.offset : 0),
      position: t.position ? t.position : this.position
    } : {
      mayBeLess: !1,
      offset: 0,
      length: e.length,
      position: this.position
    };
  }
  abort() {
    return Promise.resolve();
  }
}
const qt = 256e3;
class $t extends it {
  /**
   * Constructor
   * @param streamReader stream-reader to read from
   * @param options Tokenizer options
   */
  constructor(e, t) {
    super(t), this.streamReader = e, this.fileInfo = (t == null ? void 0 : t.fileInfo) ?? {};
  }
  /**
   * Read buffer from tokenizer
   * @param uint8Array - Target Uint8Array to fill with data read from the tokenizer-stream
   * @param options - Read behaviour options
   * @returns Promise with number of bytes read
   */
  async readBuffer(e, t) {
    const r = this.normalizeOptions(e, t), n = r.position - this.position;
    if (n > 0)
      return await this.ignore(n), this.readBuffer(e, t);
    if (n < 0)
      throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
    if (r.length === 0)
      return 0;
    const a = await this.streamReader.read(e, r.offset, r.length);
    if (this.position += a, (!t || !t.mayBeLess) && a < r.length)
      throw new I();
    return a;
  }
  /**
   * Peek (read ahead) buffer from tokenizer
   * @param uint8Array - Uint8Array (or Buffer) to write data to
   * @param options - Read behaviour options
   * @returns Promise with number of bytes peeked
   */
  async peekBuffer(e, t) {
    const r = this.normalizeOptions(e, t);
    let n = 0;
    if (r.position) {
      const a = r.position - this.position;
      if (a > 0) {
        const s = new Uint8Array(r.length + a);
        return n = await this.peekBuffer(s, { mayBeLess: r.mayBeLess }), e.set(s.subarray(a), r.offset), n - a;
      }
      if (a < 0)
        throw new Error("Cannot peek from a negative offset in a stream");
    }
    if (r.length > 0) {
      try {
        n = await this.streamReader.peek(e, r.offset, r.length);
      } catch (a) {
        if (t != null && t.mayBeLess && a instanceof I)
          return 0;
        throw a;
      }
      if (!r.mayBeLess && n < r.length)
        throw new I();
    }
    return n;
  }
  async ignore(e) {
    const t = Math.min(qt, e), r = new Uint8Array(t);
    let n = 0;
    for (; n < e; ) {
      const a = e - n, s = await this.readBuffer(r, { length: Math.min(t, a) });
      if (s < 0)
        return s;
      n += s;
    }
    return n;
  }
  abort() {
    return this.streamReader.abort();
  }
  supportsRandomAccess() {
    return !1;
  }
}
class Ht extends it {
  /**
   * Construct BufferTokenizer
   * @param uint8Array - Uint8Array to tokenize
   * @param options Tokenizer options
   */
  constructor(e, t) {
    super(t), this.uint8Array = e, this.fileInfo = { ...(t == null ? void 0 : t.fileInfo) ?? {}, size: e.length };
  }
  /**
   * Read buffer from tokenizer
   * @param uint8Array - Uint8Array to tokenize
   * @param options - Read behaviour options
   * @returns {Promise<number>}
   */
  async readBuffer(e, t) {
    if (t != null && t.position) {
      if (t.position < this.position)
        throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
      this.position = t.position;
    }
    const r = await this.peekBuffer(e, t);
    return this.position += r, r;
  }
  /**
   * Peek (read ahead) buffer from tokenizer
   * @param uint8Array
   * @param options - Read behaviour options
   * @returns {Promise<number>}
   */
  async peekBuffer(e, t) {
    const r = this.normalizeOptions(e, t), n = Math.min(this.uint8Array.length - r.position, r.length);
    if (!r.mayBeLess && n < r.length)
      throw new I();
    return e.set(this.uint8Array.subarray(r.position, r.position + n), r.offset), n;
  }
  close() {
    return super.close();
  }
  supportsRandomAccess() {
    return !0;
  }
  setPosition(e) {
    this.position = e;
  }
}
function Vt(i, e) {
  return new $t(new Wt(i), e);
}
function Yt(i, e) {
  return new Ht(i, e);
}
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
var ue = function(i, e, t, r, n) {
  var a, s, o = n * 8 - r - 1, c = (1 << o) - 1, p = c >> 1, m = -7, u = t ? n - 1 : 0, l = t ? -1 : 1, f = i[e + u];
  for (u += l, a = f & (1 << -m) - 1, f >>= -m, m += o; m > 0; a = a * 256 + i[e + u], u += l, m -= 8)
    ;
  for (s = a & (1 << -m) - 1, a >>= -m, m += r; m > 0; s = s * 256 + i[e + u], u += l, m -= 8)
    ;
  if (a === 0)
    a = 1 - p;
  else {
    if (a === c)
      return s ? NaN : (f ? -1 : 1) * (1 / 0);
    s = s + Math.pow(2, r), a = a - p;
  }
  return (f ? -1 : 1) * s * Math.pow(2, a - r);
}, me = function(i, e, t, r, n, a) {
  var s, o, c, p = a * 8 - n - 1, m = (1 << p) - 1, u = m >> 1, l = n === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, f = r ? 0 : a - 1, h = r ? 1 : -1, x = e < 0 || e === 0 && 1 / e < 0 ? 1 : 0;
  for (e = Math.abs(e), isNaN(e) || e === 1 / 0 ? (o = isNaN(e) ? 1 : 0, s = m) : (s = Math.floor(Math.log(e) / Math.LN2), e * (c = Math.pow(2, -s)) < 1 && (s--, c *= 2), s + u >= 1 ? e += l / c : e += l * Math.pow(2, 1 - u), e * c >= 2 && (s++, c /= 2), s + u >= m ? (o = 0, s = m) : s + u >= 1 ? (o = (e * c - 1) * Math.pow(2, n), s = s + u) : (o = e * Math.pow(2, u - 1) * Math.pow(2, n), s = 0)); n >= 8; i[t + f] = o & 255, f += h, o /= 256, n -= 8)
    ;
  for (s = s << n | o, p += n; p > 0; i[t + f] = s & 255, f += h, s /= 256, p -= 8)
    ;
  i[t + f - h] |= x * 128;
};
const rt = {
  128: "€",
  130: "‚",
  131: "ƒ",
  132: "„",
  133: "…",
  134: "†",
  135: "‡",
  136: "ˆ",
  137: "‰",
  138: "Š",
  139: "‹",
  140: "Œ",
  142: "Ž",
  145: "‘",
  146: "’",
  147: "“",
  148: "”",
  149: "•",
  150: "–",
  151: "—",
  152: "˜",
  153: "™",
  154: "š",
  155: "›",
  156: "œ",
  158: "ž",
  159: "Ÿ"
};
for (const [i, e] of Object.entries(rt))
  ;
let Q;
function Kt() {
  if (!(typeof globalThis.TextDecoder > "u"))
    return Q ?? (Q = new globalThis.TextDecoder("utf-8"));
}
const N = 32 * 1024;
function Zt(i, e = "utf-8") {
  switch (e.toLowerCase()) {
    case "utf-8":
    case "utf8": {
      const t = Kt();
      return t ? t.decode(i) : Jt(i);
    }
    case "utf-16le":
      return Qt(i);
    case "us-ascii":
    case "ascii":
      return ei(i);
    case "latin1":
    case "iso-8859-1":
      return ti(i);
    case "windows-1252":
      return ii(i);
    default:
      throw new RangeError(`Encoding '${e}' not supported`);
  }
}
function Jt(i) {
  const e = [];
  let t = "", r = 0;
  for (; r < i.length; ) {
    const n = i[r++];
    if (n < 128)
      t += String.fromCharCode(n);
    else if (n < 224) {
      const a = i[r++] & 63;
      t += String.fromCharCode((n & 31) << 6 | a);
    } else if (n < 240) {
      const a = i[r++] & 63, s = i[r++] & 63;
      t += String.fromCharCode((n & 15) << 12 | a << 6 | s);
    } else {
      const a = i[r++] & 63, s = i[r++] & 63, o = i[r++] & 63;
      let c = (n & 7) << 18 | a << 12 | s << 6 | o;
      c -= 65536, t += String.fromCharCode(55296 + (c >> 10 & 1023), 56320 + (c & 1023));
    }
    t.length >= N && (e.push(t), t = "");
  }
  return t && e.push(t), e.join("");
}
function Qt(i) {
  const e = i.length & -2;
  if (e === 0)
    return "";
  const t = [], r = N;
  for (let n = 0; n < e; ) {
    const a = Math.min(r, e - n >> 1), s = new Array(a);
    for (let o = 0; o < a; o++, n += 2)
      s[o] = i[n] | i[n + 1] << 8;
    t.push(String.fromCharCode.apply(null, s));
  }
  return t.join("");
}
function ei(i) {
  const e = [];
  for (let t = 0; t < i.length; t += N) {
    const r = Math.min(i.length, t + N), n = new Array(r - t);
    for (let a = t, s = 0; a < r; a++, s++)
      n[s] = i[a] & 127;
    e.push(String.fromCharCode.apply(null, n));
  }
  return e.join("");
}
function ti(i) {
  const e = [];
  for (let t = 0; t < i.length; t += N) {
    const r = Math.min(i.length, t + N), n = new Array(r - t);
    for (let a = t, s = 0; a < r; a++, s++)
      n[s] = i[a];
    e.push(String.fromCharCode.apply(null, n));
  }
  return e.join("");
}
function ii(i) {
  const e = [];
  let t = "";
  for (let r = 0; r < i.length; r++) {
    const n = i[r], a = n >= 128 && n <= 159 ? rt[n] : void 0;
    t += a ?? String.fromCharCode(n), t.length >= N && (e.push(t), t = "");
  }
  return t && e.push(t), e.join("");
}
function d(i) {
  return new DataView(i.buffer, i.byteOffset);
}
const L = {
  len: 1,
  get(i, e) {
    return d(i).getUint8(e);
  },
  put(i, e, t) {
    return d(i).setUint8(e, t), e + 1;
  }
}, R = {
  len: 2,
  get(i, e) {
    return d(i).getUint16(e, !0);
  },
  put(i, e, t) {
    return d(i).setUint16(e, t, !0), e + 2;
  }
}, j = {
  len: 2,
  get(i, e) {
    return d(i).getUint16(e);
  },
  put(i, e, t) {
    return d(i).setUint16(e, t), e + 2;
  }
}, nt = {
  len: 3,
  get(i, e) {
    const t = d(i);
    return t.getUint8(e) + (t.getUint16(e + 1, !0) << 8);
  },
  put(i, e, t) {
    const r = d(i);
    return r.setUint8(e, t & 255), r.setUint16(e + 1, t >> 8, !0), e + 3;
  }
}, at = {
  len: 3,
  get(i, e) {
    const t = d(i);
    return (t.getUint16(e) << 8) + t.getUint8(e + 2);
  },
  put(i, e, t) {
    const r = d(i);
    return r.setUint16(e, t >> 8), r.setUint8(e + 2, t & 255), e + 3;
  }
}, T = {
  len: 4,
  get(i, e) {
    return d(i).getUint32(e, !0);
  },
  put(i, e, t) {
    return d(i).setUint32(e, t, !0), e + 4;
  }
}, ae = {
  len: 4,
  get(i, e) {
    return d(i).getUint32(e);
  },
  put(i, e, t) {
    return d(i).setUint32(e, t), e + 4;
  }
}, be = {
  len: 1,
  get(i, e) {
    return d(i).getInt8(e);
  },
  put(i, e, t) {
    return d(i).setInt8(e, t), e + 1;
  }
}, ri = {
  len: 2,
  get(i, e) {
    return d(i).getInt16(e);
  },
  put(i, e, t) {
    return d(i).setInt16(e, t), e + 2;
  }
}, ni = {
  len: 2,
  get(i, e) {
    return d(i).getInt16(e, !0);
  },
  put(i, e, t) {
    return d(i).setInt16(e, t, !0), e + 2;
  }
}, ai = {
  len: 3,
  get(i, e) {
    const t = nt.get(i, e);
    return t > 8388607 ? t - 16777216 : t;
  },
  put(i, e, t) {
    const r = d(i);
    return r.setUint8(e, t & 255), r.setUint16(e + 1, t >> 8, !0), e + 3;
  }
}, si = {
  len: 3,
  get(i, e) {
    const t = at.get(i, e);
    return t > 8388607 ? t - 16777216 : t;
  },
  put(i, e, t) {
    const r = d(i);
    return r.setUint16(e, t >> 8), r.setUint8(e + 2, t & 255), e + 3;
  }
}, st = {
  len: 4,
  get(i, e) {
    return d(i).getInt32(e);
  },
  put(i, e, t) {
    return d(i).setInt32(e, t), e + 4;
  }
}, oi = {
  len: 4,
  get(i, e) {
    return d(i).getInt32(e, !0);
  },
  put(i, e, t) {
    return d(i).setInt32(e, t, !0), e + 4;
  }
}, ot = {
  len: 8,
  get(i, e) {
    return d(i).getBigUint64(e, !0);
  },
  put(i, e, t) {
    return d(i).setBigUint64(e, t, !0), e + 8;
  }
}, ci = {
  len: 8,
  get(i, e) {
    return d(i).getBigInt64(e, !0);
  },
  put(i, e, t) {
    return d(i).setBigInt64(e, t, !0), e + 8;
  }
}, li = {
  len: 8,
  get(i, e) {
    return d(i).getBigUint64(e);
  },
  put(i, e, t) {
    return d(i).setBigUint64(e, t), e + 8;
  }
}, ui = {
  len: 8,
  get(i, e) {
    return d(i).getBigInt64(e);
  },
  put(i, e, t) {
    return d(i).setBigInt64(e, t), e + 8;
  }
}, mi = {
  len: 2,
  get(i, e) {
    return ue(i, e, !1, 10, this.len);
  },
  put(i, e, t) {
    return me(i, t, e, !1, 10, this.len), e + this.len;
  }
}, pi = {
  len: 2,
  get(i, e) {
    return ue(i, e, !0, 10, this.len);
  },
  put(i, e, t) {
    return me(i, t, e, !0, 10, this.len), e + this.len;
  }
}, fi = {
  len: 4,
  get(i, e) {
    return d(i).getFloat32(e);
  },
  put(i, e, t) {
    return d(i).setFloat32(e, t), e + 4;
  }
}, di = {
  len: 4,
  get(i, e) {
    return d(i).getFloat32(e, !0);
  },
  put(i, e, t) {
    return d(i).setFloat32(e, t, !0), e + 4;
  }
}, hi = {
  len: 8,
  get(i, e) {
    return d(i).getFloat64(e);
  },
  put(i, e, t) {
    return d(i).setFloat64(e, t), e + 8;
  }
}, xi = {
  len: 8,
  get(i, e) {
    return d(i).getFloat64(e, !0);
  },
  put(i, e, t) {
    return d(i).setFloat64(e, t, !0), e + 8;
  }
}, gi = {
  len: 10,
  get(i, e) {
    return ue(i, e, !1, 63, this.len);
  },
  put(i, e, t) {
    return me(i, t, e, !1, 63, this.len), e + this.len;
  }
}, wi = {
  len: 10,
  get(i, e) {
    return ue(i, e, !0, 63, this.len);
  },
  put(i, e, t) {
    return me(i, t, e, !0, 63, this.len), e + this.len;
  }
};
class bi {
  /**
   * @param len number of bytes to ignore
   */
  constructor(e) {
    this.len = e;
  }
  // ToDo: don't read, but skip data
  get(e, t) {
  }
}
class ct {
  constructor(e) {
    this.len = e;
  }
  get(e, t) {
    return e.subarray(t, t + this.len);
  }
}
class y {
  constructor(e, t) {
    this.len = e, this.encoding = t;
  }
  get(e, t = 0) {
    const r = e.subarray(t, t + this.len);
    return Zt(r, this.encoding);
  }
}
class Ti extends y {
  constructor(e) {
    super(e, "windows-1252");
  }
}
const Cn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  AnsiStringType: Ti,
  Float16_BE: mi,
  Float16_LE: pi,
  Float32_BE: fi,
  Float32_LE: di,
  Float64_BE: hi,
  Float64_LE: xi,
  Float80_BE: gi,
  Float80_LE: wi,
  INT16_BE: ri,
  INT16_LE: ni,
  INT24_BE: si,
  INT24_LE: ai,
  INT32_BE: st,
  INT32_LE: oi,
  INT64_BE: ui,
  INT64_LE: ci,
  INT8: be,
  IgnoreType: bi,
  StringType: y,
  UINT16_BE: j,
  UINT16_LE: R,
  UINT24_BE: at,
  UINT24_LE: nt,
  UINT32_BE: ae,
  UINT32_LE: T,
  UINT64_BE: li,
  UINT64_LE: ot,
  UINT8: L,
  Uint8ArrayType: ct
}, Symbol.toStringTag, { value: "Module" })), yi = Object.prototype.toString, ki = "[object Uint8Array]", Ii = "[object ArrayBuffer]";
function lt(i, e, t) {
  return i ? i.constructor === e ? !0 : yi.call(i) === t : !1;
}
function ut(i) {
  return lt(i, Uint8Array, ki);
}
function vi(i) {
  return lt(i, ArrayBuffer, Ii);
}
function Si(i) {
  return ut(i) || vi(i);
}
function Ci(i) {
  if (!ut(i))
    throw new TypeError(`Expected \`Uint8Array\`, got \`${typeof i}\``);
}
function Ai(i) {
  if (!Si(i))
    throw new TypeError(`Expected \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof i}\``);
}
const ee = {
  utf8: new globalThis.TextDecoder("utf8")
};
function mt(i, e = "utf8") {
  return Ai(i), ee[e] ?? (ee[e] = new globalThis.TextDecoder(e)), ee[e].decode(i);
}
function pt(i) {
  if (typeof i != "string")
    throw new TypeError(`Expected \`string\`, got \`${typeof i}\``);
}
const Ei = new globalThis.TextEncoder();
function _i(i) {
  return pt(i), Ei.encode(i);
}
const Ri = Array.from({ length: 256 }, (i, e) => e.toString(16).padStart(2, "0"));
function An(i) {
  Ci(i);
  let e = "";
  for (let t = 0; t < i.length; t++)
    e += Ri[i[t]];
  return e;
}
const Ne = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  a: 10,
  b: 11,
  c: 12,
  d: 13,
  e: 14,
  f: 15,
  A: 10,
  B: 11,
  C: 12,
  D: 13,
  E: 14,
  F: 15
};
function En(i) {
  if (pt(i), i.length % 2 !== 0)
    throw new Error("Invalid Hex string length.");
  const e = i.length / 2, t = new Uint8Array(e);
  for (let r = 0; r < e; r++) {
    const n = Ne[i[r * 2]], a = Ne[i[r * 2 + 1]];
    if (n === void 0 || a === void 0)
      throw new Error(`Invalid Hex character encountered at position ${r * 2}`);
    t[r] = n << 4 | a;
  }
  return t;
}
function ze(i) {
  const { byteLength: e } = i;
  if (e === 6)
    return i.getUint16(0) * 2 ** 32 + i.getUint32(2);
  if (e === 5)
    return i.getUint8(0) * 2 ** 32 + i.getUint32(1);
  if (e === 4)
    return i.getUint32(0);
  if (e === 3)
    return i.getUint8(0) * 2 ** 16 + i.getUint16(1);
  if (e === 2)
    return i.getUint16(0);
  if (e === 1)
    return i.getUint8(0);
}
function ft(i, e) {
  const t = i.length, r = e.length;
  if (r === 0 || r > t)
    return -1;
  const n = t - r;
  for (let a = 0; a <= n; a++) {
    let s = !0;
    for (let o = 0; o < r; o++)
      if (i[a + o] !== e[o]) {
        s = !1;
        break;
      }
    if (s)
      return a;
  }
  return -1;
}
function Mi(i, e) {
  return ft(i, e) !== -1;
}
function Bi(i) {
  return [...i].map((e) => e.charCodeAt(0));
}
function Fi(i, e = 0) {
  const t = Number.parseInt(new y(6).get(i, 148).replace(/\0.*$/, "").trim(), 8);
  if (Number.isNaN(t))
    return !1;
  let r = 8 * 32;
  for (let n = e; n < e + 148; n++)
    r += i[n];
  for (let n = e + 156; n < e + 512; n++)
    r += i[n];
  return t === r;
}
const Di = {
  get: (i, e) => i[e + 3] & 127 | i[e + 2] << 7 | i[e + 1] << 14 | i[e] << 21,
  len: 4
}, Oi = [
  "jpg",
  "png",
  "apng",
  "gif",
  "webp",
  "flif",
  "xcf",
  "cr2",
  "cr3",
  "orf",
  "arw",
  "dng",
  "nef",
  "rw2",
  "raf",
  "tif",
  "bmp",
  "icns",
  "jxr",
  "psd",
  "indd",
  "zip",
  "tar",
  "rar",
  "gz",
  "bz2",
  "7z",
  "dmg",
  "mp4",
  "mid",
  "mkv",
  "webm",
  "mov",
  "avi",
  "mpg",
  "mp2",
  "mp3",
  "m4a",
  "oga",
  "ogg",
  "ogv",
  "opus",
  "flac",
  "wav",
  "spx",
  "amr",
  "pdf",
  "epub",
  "elf",
  "macho",
  "exe",
  "swf",
  "rtf",
  "wasm",
  "woff",
  "woff2",
  "eot",
  "ttf",
  "otf",
  "ico",
  "flv",
  "ps",
  "xz",
  "sqlite",
  "nes",
  "crx",
  "xpi",
  "cab",
  "deb",
  "ar",
  "rpm",
  "Z",
  "lz",
  "cfb",
  "mxf",
  "mts",
  "blend",
  "bpg",
  "docx",
  "pptx",
  "xlsx",
  "3gp",
  "3g2",
  "j2c",
  "jp2",
  "jpm",
  "jpx",
  "mj2",
  "aif",
  "qcp",
  "odt",
  "ods",
  "odp",
  "xml",
  "mobi",
  "heic",
  "cur",
  "ktx",
  "ape",
  "wv",
  "dcm",
  "ics",
  "glb",
  "pcap",
  "dsf",
  "lnk",
  "alias",
  "voc",
  "ac3",
  "m4v",
  "m4p",
  "m4b",
  "f4v",
  "f4p",
  "f4b",
  "f4a",
  "mie",
  "asf",
  "ogm",
  "ogx",
  "mpc",
  "arrow",
  "shp",
  "aac",
  "mp1",
  "it",
  "s3m",
  "xm",
  "ai",
  "skp",
  "avif",
  "eps",
  "lzh",
  "pgp",
  "asar",
  "stl",
  "chm",
  "3mf",
  "zst",
  "jxl",
  "vcf",
  "jls",
  "pst",
  "dwg",
  "parquet",
  "class",
  "arj",
  "cpio",
  "ace",
  "avro",
  "icc",
  "fbx",
  "vsdx",
  "vtt",
  "apk"
], Pi = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/flif",
  "image/x-xcf",
  "image/x-canon-cr2",
  "image/x-canon-cr3",
  "image/tiff",
  "image/bmp",
  "image/vnd.ms-photo",
  "image/vnd.adobe.photoshop",
  "application/x-indesign",
  "application/epub+zip",
  "application/x-xpinstall",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-tar",
  "application/x-rar-compressed",
  "application/gzip",
  "application/x-bzip2",
  "application/x-7z-compressed",
  "application/x-apple-diskimage",
  "application/x-apache-arrow",
  "video/mp4",
  "audio/midi",
  "video/x-matroska",
  "video/webm",
  "video/quicktime",
  "video/vnd.avi",
  "audio/wav",
  "audio/qcelp",
  "audio/x-ms-asf",
  "video/x-ms-asf",
  "application/vnd.ms-asf",
  "video/mpeg",
  "video/3gpp",
  "audio/mpeg",
  "audio/mp4",
  // RFC 4337
  "video/ogg",
  "audio/ogg",
  "audio/ogg; codecs=opus",
  "application/ogg",
  "audio/x-flac",
  "audio/ape",
  "audio/wavpack",
  "audio/amr",
  "application/pdf",
  "application/x-elf",
  "application/x-mach-binary",
  "application/x-msdownload",
  "application/x-shockwave-flash",
  "application/rtf",
  "application/wasm",
  "font/woff",
  "font/woff2",
  "application/vnd.ms-fontobject",
  "font/ttf",
  "font/otf",
  "image/x-icon",
  "video/x-flv",
  "application/postscript",
  "application/eps",
  "application/x-xz",
  "application/x-sqlite3",
  "application/x-nintendo-nes-rom",
  "application/x-google-chrome-extension",
  "application/vnd.ms-cab-compressed",
  "application/x-deb",
  "application/x-unix-archive",
  "application/x-rpm",
  "application/x-compress",
  "application/x-lzip",
  "application/x-cfb",
  "application/x-mie",
  "application/mxf",
  "video/mp2t",
  "application/x-blender",
  "image/bpg",
  "image/j2c",
  "image/jp2",
  "image/jpx",
  "image/jpm",
  "image/mj2",
  "audio/aiff",
  "application/xml",
  "application/x-mobipocket-ebook",
  "image/heif",
  "image/heif-sequence",
  "image/heic",
  "image/heic-sequence",
  "image/icns",
  "image/ktx",
  "application/dicom",
  "audio/x-musepack",
  "text/calendar",
  "text/vcard",
  "text/vtt",
  "model/gltf-binary",
  "application/vnd.tcpdump.pcap",
  "audio/x-dsf",
  // Non-standard
  "application/x.ms.shortcut",
  // Invented by us
  "application/x.apple.alias",
  // Invented by us
  "audio/x-voc",
  "audio/vnd.dolby.dd-raw",
  "audio/x-m4a",
  "image/apng",
  "image/x-olympus-orf",
  "image/x-sony-arw",
  "image/x-adobe-dng",
  "image/x-nikon-nef",
  "image/x-panasonic-rw2",
  "image/x-fujifilm-raf",
  "video/x-m4v",
  "video/3gpp2",
  "application/x-esri-shape",
  "audio/aac",
  "audio/x-it",
  "audio/x-s3m",
  "audio/x-xm",
  "video/MP1S",
  "video/MP2P",
  "application/vnd.sketchup.skp",
  "image/avif",
  "application/x-lzh-compressed",
  "application/pgp-encrypted",
  "application/x-asar",
  "model/stl",
  "application/vnd.ms-htmlhelp",
  "model/3mf",
  "image/jxl",
  "application/zstd",
  "image/jls",
  "application/vnd.ms-outlook",
  "image/vnd.dwg",
  "application/x-parquet",
  "application/java-vm",
  "application/x-arj",
  "application/x-cpio",
  "application/x-ace-compressed",
  "application/avro",
  "application/vnd.iccprofile",
  "application/x.autodesk.fbx",
  // Invented by us
  "application/vnd.visio",
  "application/vnd.android.package-archive"
], Ue = 4100;
async function dt(i) {
  return new Li().fromBuffer(i);
}
function A(i, e, t) {
  t = {
    offset: 0,
    ...t
  };
  for (const [r, n] of e.entries())
    if (t.mask) {
      if (n !== (t.mask[r] & i[r + t.offset]))
        return !1;
    } else if (n !== i[r + t.offset])
      return !1;
  return !0;
}
class Li {
  constructor(e) {
    this.detectors = e == null ? void 0 : e.customDetectors, this.tokenizerOptions = {
      abortSignal: e == null ? void 0 : e.signal
    }, this.fromTokenizer = this.fromTokenizer.bind(this), this.fromBuffer = this.fromBuffer.bind(this), this.parse = this.parse.bind(this);
  }
  async fromTokenizer(e) {
    const t = e.position;
    for (const r of this.detectors || []) {
      const n = await r(e);
      if (n)
        return n;
      if (t !== e.position)
        return;
    }
    return this.parse(e);
  }
  async fromBuffer(e) {
    if (!(e instanceof Uint8Array || e instanceof ArrayBuffer))
      throw new TypeError(`Expected the \`input\` argument to be of type \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof e}\``);
    const t = e instanceof Uint8Array ? e : new Uint8Array(e);
    if ((t == null ? void 0 : t.length) > 1)
      return this.fromTokenizer(Yt(t, this.tokenizerOptions));
  }
  async fromBlob(e) {
    return this.fromStream(e.stream());
  }
  async fromStream(e) {
    const t = await Vt(e, this.tokenizerOptions);
    try {
      return await this.fromTokenizer(t);
    } finally {
      await t.close();
    }
  }
  async toDetectionStream(e, t) {
    const { sampleSize: r = Ue } = t;
    let n, a;
    const s = e.getReader({ mode: "byob" });
    try {
      const { value: p, done: m } = await s.read(new Uint8Array(r));
      if (a = p, !m && p)
        try {
          n = await this.fromBuffer(p.slice(0, r));
        } catch (u) {
          if (!(u instanceof I))
            throw u;
          n = void 0;
        }
      a = p;
    } finally {
      s.releaseLock();
    }
    const o = new TransformStream({
      async start(p) {
        p.enqueue(a);
      },
      transform(p, m) {
        m.enqueue(p);
      }
    }), c = e.pipeThrough(o);
    return c.fileType = n, c;
  }
  check(e, t) {
    return A(this.buffer, e, t);
  }
  checkString(e, t) {
    return this.check(Bi(e), t);
  }
  async parse(e) {
    if (this.buffer = new Uint8Array(Ue), e.fileInfo.size === void 0 && (e.fileInfo.size = Number.MAX_SAFE_INTEGER), this.tokenizer = e, await e.peekBuffer(this.buffer, { length: 12, mayBeLess: !0 }), this.check([66, 77]))
      return {
        ext: "bmp",
        mime: "image/bmp"
      };
    if (this.check([11, 119]))
      return {
        ext: "ac3",
        mime: "audio/vnd.dolby.dd-raw"
      };
    if (this.check([120, 1]))
      return {
        ext: "dmg",
        mime: "application/x-apple-diskimage"
      };
    if (this.check([77, 90]))
      return {
        ext: "exe",
        mime: "application/x-msdownload"
      };
    if (this.check([37, 33]))
      return await e.peekBuffer(this.buffer, { length: 24, mayBeLess: !0 }), this.checkString("PS-Adobe-", { offset: 2 }) && this.checkString(" EPSF-", { offset: 14 }) ? {
        ext: "eps",
        mime: "application/eps"
      } : {
        ext: "ps",
        mime: "application/postscript"
      };
    if (this.check([31, 160]) || this.check([31, 157]))
      return {
        ext: "Z",
        mime: "application/x-compress"
      };
    if (this.check([199, 113]))
      return {
        ext: "cpio",
        mime: "application/x-cpio"
      };
    if (this.check([96, 234]))
      return {
        ext: "arj",
        mime: "application/x-arj"
      };
    if (this.check([239, 187, 191]))
      return this.tokenizer.ignore(3), this.parse(e);
    if (this.check([71, 73, 70]))
      return {
        ext: "gif",
        mime: "image/gif"
      };
    if (this.check([73, 73, 188]))
      return {
        ext: "jxr",
        mime: "image/vnd.ms-photo"
      };
    if (this.check([31, 139, 8]))
      return {
        ext: "gz",
        mime: "application/gzip"
      };
    if (this.check([66, 90, 104]))
      return {
        ext: "bz2",
        mime: "application/x-bzip2"
      };
    if (this.checkString("ID3")) {
      await e.ignore(6);
      const t = await e.readToken(Di);
      return e.position + t > e.fileInfo.size ? {
        ext: "mp3",
        mime: "audio/mpeg"
      } : (await e.ignore(t), this.fromTokenizer(e));
    }
    if (this.checkString("MP+"))
      return {
        ext: "mpc",
        mime: "audio/x-musepack"
      };
    if ((this.buffer[0] === 67 || this.buffer[0] === 70) && this.check([87, 83], { offset: 1 }))
      return {
        ext: "swf",
        mime: "application/x-shockwave-flash"
      };
    if (this.check([255, 216, 255]))
      return this.check([247], { offset: 3 }) ? {
        ext: "jls",
        mime: "image/jls"
      } : {
        ext: "jpg",
        mime: "image/jpeg"
      };
    if (this.check([79, 98, 106, 1]))
      return {
        ext: "avro",
        mime: "application/avro"
      };
    if (this.checkString("FLIF"))
      return {
        ext: "flif",
        mime: "image/flif"
      };
    if (this.checkString("8BPS"))
      return {
        ext: "psd",
        mime: "image/vnd.adobe.photoshop"
      };
    if (this.checkString("WEBP", { offset: 8 }))
      return {
        ext: "webp",
        mime: "image/webp"
      };
    if (this.checkString("MPCK"))
      return {
        ext: "mpc",
        mime: "audio/x-musepack"
      };
    if (this.checkString("FORM"))
      return {
        ext: "aif",
        mime: "audio/aiff"
      };
    if (this.checkString("icns", { offset: 0 }))
      return {
        ext: "icns",
        mime: "image/icns"
      };
    if (this.check([80, 75, 3, 4])) {
      try {
        for (; e.position + 30 < e.fileInfo.size; ) {
          await e.readBuffer(this.buffer, { length: 30 });
          const t = new DataView(this.buffer.buffer), r = {
            compressedSize: t.getUint32(18, !0),
            uncompressedSize: t.getUint32(22, !0),
            filenameLength: t.getUint16(26, !0),
            extraFieldLength: t.getUint16(28, !0)
          };
          if (r.filename = await e.readToken(new y(r.filenameLength, "utf-8")), await e.ignore(r.extraFieldLength), /classes\d*\.dex/.test(r.filename))
            return {
              ext: "apk",
              mime: "application/vnd.android.package-archive"
            };
          if (r.filename === "META-INF/mozilla.rsa")
            return {
              ext: "xpi",
              mime: "application/x-xpinstall"
            };
          if (r.filename.endsWith(".rels") || r.filename.endsWith(".xml"))
            switch (r.filename.split("/")[0]) {
              case "_rels":
                break;
              case "word":
                return {
                  ext: "docx",
                  mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                };
              case "ppt":
                return {
                  ext: "pptx",
                  mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                };
              case "xl":
                return {
                  ext: "xlsx",
                  mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                };
              case "visio":
                return {
                  ext: "vsdx",
                  mime: "application/vnd.visio"
                };
              default:
                break;
            }
          if (r.filename.startsWith("xl/"))
            return {
              ext: "xlsx",
              mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            };
          if (r.filename.startsWith("3D/") && r.filename.endsWith(".model"))
            return {
              ext: "3mf",
              mime: "model/3mf"
            };
          if (r.filename === "mimetype" && r.compressedSize === r.uncompressedSize) {
            let n = await e.readToken(new y(r.compressedSize, "utf-8"));
            switch (n = n.trim(), n) {
              case "application/epub+zip":
                return {
                  ext: "epub",
                  mime: "application/epub+zip"
                };
              case "application/vnd.oasis.opendocument.text":
                return {
                  ext: "odt",
                  mime: "application/vnd.oasis.opendocument.text"
                };
              case "application/vnd.oasis.opendocument.spreadsheet":
                return {
                  ext: "ods",
                  mime: "application/vnd.oasis.opendocument.spreadsheet"
                };
              case "application/vnd.oasis.opendocument.presentation":
                return {
                  ext: "odp",
                  mime: "application/vnd.oasis.opendocument.presentation"
                };
              default:
            }
          }
          if (r.compressedSize === 0) {
            let n = -1;
            for (; n < 0 && e.position < e.fileInfo.size; )
              await e.peekBuffer(this.buffer, { mayBeLess: !0 }), n = ft(this.buffer, new Uint8Array([80, 75, 3, 4])), await e.ignore(n >= 0 ? n : this.buffer.length);
          } else
            await e.ignore(r.compressedSize);
        }
      } catch (t) {
        if (!(t instanceof I))
          throw t;
      }
      return {
        ext: "zip",
        mime: "application/zip"
      };
    }
    if (this.checkString("OggS")) {
      await e.ignore(28);
      const t = new Uint8Array(8);
      return await e.readBuffer(t), A(t, [79, 112, 117, 115, 72, 101, 97, 100]) ? {
        ext: "opus",
        mime: "audio/ogg; codecs=opus"
      } : A(t, [128, 116, 104, 101, 111, 114, 97]) ? {
        ext: "ogv",
        mime: "video/ogg"
      } : A(t, [1, 118, 105, 100, 101, 111, 0]) ? {
        ext: "ogm",
        mime: "video/ogg"
      } : A(t, [127, 70, 76, 65, 67]) ? {
        ext: "oga",
        mime: "audio/ogg"
      } : A(t, [83, 112, 101, 101, 120, 32, 32]) ? {
        ext: "spx",
        mime: "audio/ogg"
      } : A(t, [1, 118, 111, 114, 98, 105, 115]) ? {
        ext: "ogg",
        mime: "audio/ogg"
      } : {
        ext: "ogx",
        mime: "application/ogg"
      };
    }
    if (this.check([80, 75]) && (this.buffer[2] === 3 || this.buffer[2] === 5 || this.buffer[2] === 7) && (this.buffer[3] === 4 || this.buffer[3] === 6 || this.buffer[3] === 8))
      return {
        ext: "zip",
        mime: "application/zip"
      };
    if (this.checkString("ftyp", { offset: 4 }) && this.buffer[8] & 96) {
      const t = new y(4, "latin1").get(this.buffer, 8).replace("\0", " ").trim();
      switch (t) {
        case "avif":
        case "avis":
          return { ext: "avif", mime: "image/avif" };
        case "mif1":
          return { ext: "heic", mime: "image/heif" };
        case "msf1":
          return { ext: "heic", mime: "image/heif-sequence" };
        case "heic":
        case "heix":
          return { ext: "heic", mime: "image/heic" };
        case "hevc":
        case "hevx":
          return { ext: "heic", mime: "image/heic-sequence" };
        case "qt":
          return { ext: "mov", mime: "video/quicktime" };
        case "M4V":
        case "M4VH":
        case "M4VP":
          return { ext: "m4v", mime: "video/x-m4v" };
        case "M4P":
          return { ext: "m4p", mime: "video/mp4" };
        case "M4B":
          return { ext: "m4b", mime: "audio/mp4" };
        case "M4A":
          return { ext: "m4a", mime: "audio/x-m4a" };
        case "F4V":
          return { ext: "f4v", mime: "video/mp4" };
        case "F4P":
          return { ext: "f4p", mime: "video/mp4" };
        case "F4A":
          return { ext: "f4a", mime: "audio/mp4" };
        case "F4B":
          return { ext: "f4b", mime: "audio/mp4" };
        case "crx":
          return { ext: "cr3", mime: "image/x-canon-cr3" };
        default:
          return t.startsWith("3g") ? t.startsWith("3g2") ? { ext: "3g2", mime: "video/3gpp2" } : { ext: "3gp", mime: "video/3gpp" } : { ext: "mp4", mime: "video/mp4" };
      }
    }
    if (this.checkString("MThd"))
      return {
        ext: "mid",
        mime: "audio/midi"
      };
    if (this.checkString("wOFF") && (this.check([0, 1, 0, 0], { offset: 4 }) || this.checkString("OTTO", { offset: 4 })))
      return {
        ext: "woff",
        mime: "font/woff"
      };
    if (this.checkString("wOF2") && (this.check([0, 1, 0, 0], { offset: 4 }) || this.checkString("OTTO", { offset: 4 })))
      return {
        ext: "woff2",
        mime: "font/woff2"
      };
    if (this.check([212, 195, 178, 161]) || this.check([161, 178, 195, 212]))
      return {
        ext: "pcap",
        mime: "application/vnd.tcpdump.pcap"
      };
    if (this.checkString("DSD "))
      return {
        ext: "dsf",
        mime: "audio/x-dsf"
        // Non-standard
      };
    if (this.checkString("LZIP"))
      return {
        ext: "lz",
        mime: "application/x-lzip"
      };
    if (this.checkString("fLaC"))
      return {
        ext: "flac",
        mime: "audio/x-flac"
      };
    if (this.check([66, 80, 71, 251]))
      return {
        ext: "bpg",
        mime: "image/bpg"
      };
    if (this.checkString("wvpk"))
      return {
        ext: "wv",
        mime: "audio/wavpack"
      };
    if (this.checkString("%PDF")) {
      try {
        await e.ignore(1350);
        const t = 10 * 1024 * 1024, r = new Uint8Array(Math.min(t, e.fileInfo.size));
        if (await e.readBuffer(r, { mayBeLess: !0 }), Mi(r, new TextEncoder().encode("AIPrivateData")))
          return {
            ext: "ai",
            mime: "application/postscript"
          };
      } catch (t) {
        if (!(t instanceof I))
          throw t;
      }
      return {
        ext: "pdf",
        mime: "application/pdf"
      };
    }
    if (this.check([0, 97, 115, 109]))
      return {
        ext: "wasm",
        mime: "application/wasm"
      };
    if (this.check([73, 73])) {
      const t = await this.readTiffHeader(!1);
      if (t)
        return t;
    }
    if (this.check([77, 77])) {
      const t = await this.readTiffHeader(!0);
      if (t)
        return t;
    }
    if (this.checkString("MAC "))
      return {
        ext: "ape",
        mime: "audio/ape"
      };
    if (this.check([26, 69, 223, 163])) {
      async function t() {
        const o = await e.peekNumber(L);
        let c = 128, p = 0;
        for (; !(o & c) && c !== 0; )
          ++p, c >>= 1;
        const m = new Uint8Array(p + 1);
        return await e.readBuffer(m), m;
      }
      async function r() {
        const o = await t(), c = await t();
        c[0] ^= 128 >> c.length - 1;
        const p = Math.min(6, c.length), m = new DataView(o.buffer), u = new DataView(c.buffer, c.length - p, p);
        return {
          id: ze(m),
          len: ze(u)
        };
      }
      async function n(o) {
        for (; o > 0; ) {
          const c = await r();
          if (c.id === 17026)
            return (await e.readToken(new y(c.len))).replaceAll(/\00.*$/g, "");
          await e.ignore(c.len), --o;
        }
      }
      const a = await r();
      switch (await n(a.len)) {
        case "webm":
          return {
            ext: "webm",
            mime: "video/webm"
          };
        case "matroska":
          return {
            ext: "mkv",
            mime: "video/x-matroska"
          };
        default:
          return;
      }
    }
    if (this.check([82, 73, 70, 70])) {
      if (this.check([65, 86, 73], { offset: 8 }))
        return {
          ext: "avi",
          mime: "video/vnd.avi"
        };
      if (this.check([87, 65, 86, 69], { offset: 8 }))
        return {
          ext: "wav",
          mime: "audio/wav"
        };
      if (this.check([81, 76, 67, 77], { offset: 8 }))
        return {
          ext: "qcp",
          mime: "audio/qcelp"
        };
    }
    if (this.checkString("SQLi"))
      return {
        ext: "sqlite",
        mime: "application/x-sqlite3"
      };
    if (this.check([78, 69, 83, 26]))
      return {
        ext: "nes",
        mime: "application/x-nintendo-nes-rom"
      };
    if (this.checkString("Cr24"))
      return {
        ext: "crx",
        mime: "application/x-google-chrome-extension"
      };
    if (this.checkString("MSCF") || this.checkString("ISc("))
      return {
        ext: "cab",
        mime: "application/vnd.ms-cab-compressed"
      };
    if (this.check([237, 171, 238, 219]))
      return {
        ext: "rpm",
        mime: "application/x-rpm"
      };
    if (this.check([197, 208, 211, 198]))
      return {
        ext: "eps",
        mime: "application/eps"
      };
    if (this.check([40, 181, 47, 253]))
      return {
        ext: "zst",
        mime: "application/zstd"
      };
    if (this.check([127, 69, 76, 70]))
      return {
        ext: "elf",
        mime: "application/x-elf"
      };
    if (this.check([33, 66, 68, 78]))
      return {
        ext: "pst",
        mime: "application/vnd.ms-outlook"
      };
    if (this.checkString("PAR1"))
      return {
        ext: "parquet",
        mime: "application/x-parquet"
      };
    if (this.check([207, 250, 237, 254]))
      return {
        ext: "macho",
        mime: "application/x-mach-binary"
      };
    if (this.check([79, 84, 84, 79, 0]))
      return {
        ext: "otf",
        mime: "font/otf"
      };
    if (this.checkString("#!AMR"))
      return {
        ext: "amr",
        mime: "audio/amr"
      };
    if (this.checkString("{\\rtf"))
      return {
        ext: "rtf",
        mime: "application/rtf"
      };
    if (this.check([70, 76, 86, 1]))
      return {
        ext: "flv",
        mime: "video/x-flv"
      };
    if (this.checkString("IMPM"))
      return {
        ext: "it",
        mime: "audio/x-it"
      };
    if (this.checkString("-lh0-", { offset: 2 }) || this.checkString("-lh1-", { offset: 2 }) || this.checkString("-lh2-", { offset: 2 }) || this.checkString("-lh3-", { offset: 2 }) || this.checkString("-lh4-", { offset: 2 }) || this.checkString("-lh5-", { offset: 2 }) || this.checkString("-lh6-", { offset: 2 }) || this.checkString("-lh7-", { offset: 2 }) || this.checkString("-lzs-", { offset: 2 }) || this.checkString("-lz4-", { offset: 2 }) || this.checkString("-lz5-", { offset: 2 }) || this.checkString("-lhd-", { offset: 2 }))
      return {
        ext: "lzh",
        mime: "application/x-lzh-compressed"
      };
    if (this.check([0, 0, 1, 186])) {
      if (this.check([33], { offset: 4, mask: [241] }))
        return {
          ext: "mpg",
          // May also be .ps, .mpeg
          mime: "video/MP1S"
        };
      if (this.check([68], { offset: 4, mask: [196] }))
        return {
          ext: "mpg",
          // May also be .mpg, .m2p, .vob or .sub
          mime: "video/MP2P"
        };
    }
    if (this.checkString("ITSF"))
      return {
        ext: "chm",
        mime: "application/vnd.ms-htmlhelp"
      };
    if (this.check([202, 254, 186, 190]))
      return {
        ext: "class",
        mime: "application/java-vm"
      };
    if (this.check([253, 55, 122, 88, 90, 0]))
      return {
        ext: "xz",
        mime: "application/x-xz"
      };
    if (this.checkString("<?xml "))
      return {
        ext: "xml",
        mime: "application/xml"
      };
    if (this.check([55, 122, 188, 175, 39, 28]))
      return {
        ext: "7z",
        mime: "application/x-7z-compressed"
      };
    if (this.check([82, 97, 114, 33, 26, 7]) && (this.buffer[6] === 0 || this.buffer[6] === 1))
      return {
        ext: "rar",
        mime: "application/x-rar-compressed"
      };
    if (this.checkString("solid "))
      return {
        ext: "stl",
        mime: "model/stl"
      };
    if (this.checkString("AC")) {
      const t = new y(4, "latin1").get(this.buffer, 2);
      if (t.match("^d*") && t >= 1e3 && t <= 1050)
        return {
          ext: "dwg",
          mime: "image/vnd.dwg"
        };
    }
    if (this.checkString("070707"))
      return {
        ext: "cpio",
        mime: "application/x-cpio"
      };
    if (this.checkString("BLENDER"))
      return {
        ext: "blend",
        mime: "application/x-blender"
      };
    if (this.checkString("!<arch>"))
      return await e.ignore(8), await e.readToken(new y(13, "ascii")) === "debian-binary" ? {
        ext: "deb",
        mime: "application/x-deb"
      } : {
        ext: "ar",
        mime: "application/x-unix-archive"
      };
    if (this.checkString("WEBVTT") && // One of LF, CR, tab, space, or end of file must follow "WEBVTT" per the spec (see `fixture/fixture-vtt-*.vtt` for examples). Note that `\0` is technically the null character (there is no such thing as an EOF character). However, checking for `\0` gives us the same result as checking for the end of the stream.
    [`
`, "\r", "	", " ", "\0"].some((t) => this.checkString(t, { offset: 6 })))
      return {
        ext: "vtt",
        mime: "text/vtt"
      };
    if (this.check([137, 80, 78, 71, 13, 10, 26, 10])) {
      await e.ignore(8);
      async function t() {
        return {
          length: await e.readToken(st),
          type: await e.readToken(new y(4, "latin1"))
        };
      }
      do {
        const r = await t();
        if (r.length < 0)
          return;
        switch (r.type) {
          case "IDAT":
            return {
              ext: "png",
              mime: "image/png"
            };
          case "acTL":
            return {
              ext: "apng",
              mime: "image/apng"
            };
          default:
            await e.ignore(r.length + 4);
        }
      } while (e.position + 8 < e.fileInfo.size);
      return {
        ext: "png",
        mime: "image/png"
      };
    }
    if (this.check([65, 82, 82, 79, 87, 49, 0, 0]))
      return {
        ext: "arrow",
        mime: "application/x-apache-arrow"
      };
    if (this.check([103, 108, 84, 70, 2, 0, 0, 0]))
      return {
        ext: "glb",
        mime: "model/gltf-binary"
      };
    if (this.check([102, 114, 101, 101], { offset: 4 }) || this.check([109, 100, 97, 116], { offset: 4 }) || this.check([109, 111, 111, 118], { offset: 4 }) || this.check([119, 105, 100, 101], { offset: 4 }))
      return {
        ext: "mov",
        mime: "video/quicktime"
      };
    if (this.check([73, 73, 82, 79, 8, 0, 0, 0, 24]))
      return {
        ext: "orf",
        mime: "image/x-olympus-orf"
      };
    if (this.checkString("gimp xcf "))
      return {
        ext: "xcf",
        mime: "image/x-xcf"
      };
    if (this.check([73, 73, 85, 0, 24, 0, 0, 0, 136, 231, 116, 216]))
      return {
        ext: "rw2",
        mime: "image/x-panasonic-rw2"
      };
    if (this.check([48, 38, 178, 117, 142, 102, 207, 17, 166, 217])) {
      async function t() {
        const r = new Uint8Array(16);
        return await e.readBuffer(r), {
          id: r,
          size: Number(await e.readToken(ot))
        };
      }
      for (await e.ignore(30); e.position + 24 < e.fileInfo.size; ) {
        const r = await t();
        let n = r.size - 24;
        if (A(r.id, [145, 7, 220, 183, 183, 169, 207, 17, 142, 230, 0, 192, 12, 32, 83, 101])) {
          const a = new Uint8Array(16);
          if (n -= await e.readBuffer(a), A(a, [64, 158, 105, 248, 77, 91, 207, 17, 168, 253, 0, 128, 95, 92, 68, 43]))
            return {
              ext: "asf",
              mime: "audio/x-ms-asf"
            };
          if (A(a, [192, 239, 25, 188, 77, 91, 207, 17, 168, 253, 0, 128, 95, 92, 68, 43]))
            return {
              ext: "asf",
              mime: "video/x-ms-asf"
            };
          break;
        }
        await e.ignore(n);
      }
      return {
        ext: "asf",
        mime: "application/vnd.ms-asf"
      };
    }
    if (this.check([171, 75, 84, 88, 32, 49, 49, 187, 13, 10, 26, 10]))
      return {
        ext: "ktx",
        mime: "image/ktx"
      };
    if ((this.check([126, 16, 4]) || this.check([126, 24, 4])) && this.check([48, 77, 73, 69], { offset: 4 }))
      return {
        ext: "mie",
        mime: "application/x-mie"
      };
    if (this.check([39, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], { offset: 2 }))
      return {
        ext: "shp",
        mime: "application/x-esri-shape"
      };
    if (this.check([255, 79, 255, 81]))
      return {
        ext: "j2c",
        mime: "image/j2c"
      };
    if (this.check([0, 0, 0, 12, 106, 80, 32, 32, 13, 10, 135, 10]))
      switch (await e.ignore(20), await e.readToken(new y(4, "ascii"))) {
        case "jp2 ":
          return {
            ext: "jp2",
            mime: "image/jp2"
          };
        case "jpx ":
          return {
            ext: "jpx",
            mime: "image/jpx"
          };
        case "jpm ":
          return {
            ext: "jpm",
            mime: "image/jpm"
          };
        case "mjp2":
          return {
            ext: "mj2",
            mime: "image/mj2"
          };
        default:
          return;
      }
    if (this.check([255, 10]) || this.check([0, 0, 0, 12, 74, 88, 76, 32, 13, 10, 135, 10]))
      return {
        ext: "jxl",
        mime: "image/jxl"
      };
    if (this.check([254, 255]))
      return this.check([0, 60, 0, 63, 0, 120, 0, 109, 0, 108], { offset: 2 }) ? {
        ext: "xml",
        mime: "application/xml"
      } : void 0;
    if (this.check([0, 0, 1, 186]) || this.check([0, 0, 1, 179]))
      return {
        ext: "mpg",
        mime: "video/mpeg"
      };
    if (this.check([0, 1, 0, 0, 0]))
      return {
        ext: "ttf",
        mime: "font/ttf"
      };
    if (this.check([0, 0, 1, 0]))
      return {
        ext: "ico",
        mime: "image/x-icon"
      };
    if (this.check([0, 0, 2, 0]))
      return {
        ext: "cur",
        mime: "image/x-icon"
      };
    if (this.check([208, 207, 17, 224, 161, 177, 26, 225]))
      return {
        ext: "cfb",
        mime: "application/x-cfb"
      };
    if (await e.peekBuffer(this.buffer, { length: Math.min(256, e.fileInfo.size), mayBeLess: !0 }), this.check([97, 99, 115, 112], { offset: 36 }))
      return {
        ext: "icc",
        mime: "application/vnd.iccprofile"
      };
    if (this.checkString("**ACE", { offset: 7 }) && this.checkString("**", { offset: 12 }))
      return {
        ext: "ace",
        mime: "application/x-ace-compressed"
      };
    if (this.checkString("BEGIN:")) {
      if (this.checkString("VCARD", { offset: 6 }))
        return {
          ext: "vcf",
          mime: "text/vcard"
        };
      if (this.checkString("VCALENDAR", { offset: 6 }))
        return {
          ext: "ics",
          mime: "text/calendar"
        };
    }
    if (this.checkString("FUJIFILMCCD-RAW"))
      return {
        ext: "raf",
        mime: "image/x-fujifilm-raf"
      };
    if (this.checkString("Extended Module:"))
      return {
        ext: "xm",
        mime: "audio/x-xm"
      };
    if (this.checkString("Creative Voice File"))
      return {
        ext: "voc",
        mime: "audio/x-voc"
      };
    if (this.check([4, 0, 0, 0]) && this.buffer.length >= 16) {
      const t = new DataView(this.buffer.buffer).getUint32(12, !0);
      if (t > 12 && this.buffer.length >= t + 16)
        try {
          const r = new TextDecoder().decode(this.buffer.slice(16, t + 16));
          if (JSON.parse(r).files)
            return {
              ext: "asar",
              mime: "application/x-asar"
            };
        } catch {
        }
    }
    if (this.check([6, 14, 43, 52, 2, 5, 1, 1, 13, 1, 2, 1, 1, 2]))
      return {
        ext: "mxf",
        mime: "application/mxf"
      };
    if (this.checkString("SCRM", { offset: 44 }))
      return {
        ext: "s3m",
        mime: "audio/x-s3m"
      };
    if (this.check([71]) && this.check([71], { offset: 188 }))
      return {
        ext: "mts",
        mime: "video/mp2t"
      };
    if (this.check([71], { offset: 4 }) && this.check([71], { offset: 196 }))
      return {
        ext: "mts",
        mime: "video/mp2t"
      };
    if (this.check([66, 79, 79, 75, 77, 79, 66, 73], { offset: 60 }))
      return {
        ext: "mobi",
        mime: "application/x-mobipocket-ebook"
      };
    if (this.check([68, 73, 67, 77], { offset: 128 }))
      return {
        ext: "dcm",
        mime: "application/dicom"
      };
    if (this.check([76, 0, 0, 0, 1, 20, 2, 0, 0, 0, 0, 0, 192, 0, 0, 0, 0, 0, 0, 70]))
      return {
        ext: "lnk",
        mime: "application/x.ms.shortcut"
        // Invented by us
      };
    if (this.check([98, 111, 111, 107, 0, 0, 0, 0, 109, 97, 114, 107, 0, 0, 0, 0]))
      return {
        ext: "alias",
        mime: "application/x.apple.alias"
        // Invented by us
      };
    if (this.checkString("Kaydara FBX Binary  \0"))
      return {
        ext: "fbx",
        mime: "application/x.autodesk.fbx"
        // Invented by us
      };
    if (this.check([76, 80], { offset: 34 }) && (this.check([0, 0, 1], { offset: 8 }) || this.check([1, 0, 2], { offset: 8 }) || this.check([2, 0, 2], { offset: 8 })))
      return {
        ext: "eot",
        mime: "application/vnd.ms-fontobject"
      };
    if (this.check([6, 6, 237, 245, 216, 29, 70, 229, 189, 49, 239, 231, 254, 116, 183, 29]))
      return {
        ext: "indd",
        mime: "application/x-indesign"
      };
    if (await e.peekBuffer(this.buffer, { length: Math.min(512, e.fileInfo.size), mayBeLess: !0 }), Fi(this.buffer))
      return {
        ext: "tar",
        mime: "application/x-tar"
      };
    if (this.check([255, 254]))
      return this.check([60, 0, 63, 0, 120, 0, 109, 0, 108, 0], { offset: 2 }) ? {
        ext: "xml",
        mime: "application/xml"
      } : this.check([255, 14, 83, 0, 107, 0, 101, 0, 116, 0, 99, 0, 104, 0, 85, 0, 112, 0, 32, 0, 77, 0, 111, 0, 100, 0, 101, 0, 108, 0], { offset: 2 }) ? {
        ext: "skp",
        mime: "application/vnd.sketchup.skp"
      } : void 0;
    if (this.checkString("-----BEGIN PGP MESSAGE-----"))
      return {
        ext: "pgp",
        mime: "application/pgp-encrypted"
      };
    if (this.buffer.length >= 2 && this.check([255, 224], { offset: 0, mask: [255, 224] })) {
      if (this.check([16], { offset: 1, mask: [22] }))
        return this.check([8], { offset: 1, mask: [8] }) ? {
          ext: "aac",
          mime: "audio/aac"
        } : {
          ext: "aac",
          mime: "audio/aac"
        };
      if (this.check([2], { offset: 1, mask: [6] }))
        return {
          ext: "mp3",
          mime: "audio/mpeg"
        };
      if (this.check([4], { offset: 1, mask: [6] }))
        return {
          ext: "mp2",
          mime: "audio/mpeg"
        };
      if (this.check([6], { offset: 1, mask: [6] }))
        return {
          ext: "mp1",
          mime: "audio/mpeg"
        };
    }
  }
  async readTiffTag(e) {
    const t = await this.tokenizer.readToken(e ? j : R);
    switch (this.tokenizer.ignore(10), t) {
      case 50341:
        return {
          ext: "arw",
          mime: "image/x-sony-arw"
        };
      case 50706:
        return {
          ext: "dng",
          mime: "image/x-adobe-dng"
        };
    }
  }
  async readTiffIFD(e) {
    const t = await this.tokenizer.readToken(e ? j : R);
    for (let r = 0; r < t; ++r) {
      const n = await this.readTiffTag(e);
      if (n)
        return n;
    }
  }
  async readTiffHeader(e) {
    const t = (e ? j : R).get(this.buffer, 2), r = (e ? ae : T).get(this.buffer, 4);
    if (t === 42) {
      if (r >= 6) {
        if (this.checkString("CR", { offset: 8 }))
          return {
            ext: "cr2",
            mime: "image/x-canon-cr2"
          };
        if (r >= 8 && (this.check([28, 0, 254, 0], { offset: 8 }) || this.check([31, 0, 11, 0], { offset: 8 })))
          return {
            ext: "nef",
            mime: "image/x-nikon-nef"
          };
      }
      return await this.tokenizer.ignore(r), await this.readTiffIFD(e) ?? {
        ext: "tif",
        mime: "image/tiff"
      };
    }
    if (t === 43)
      return {
        ext: "tif",
        mime: "image/tiff"
      };
  }
}
new Set(Oi);
new Set(Pi);
var Ce = {};
/*!
 * content-type
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
var Xe = /; *([!#$%&'*+.^_`|~0-9A-Za-z-]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'*+.^_`|~0-9A-Za-z-]+) */g, Ni = /^[\u000b\u0020-\u007e\u0080-\u00ff]+$/, ht = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/, zi = /\\([\u000b\u0020-\u00ff])/g, Ui = /([\\"])/g, xt = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
Ce.format = Xi;
Ce.parse = Gi;
function Xi(i) {
  if (!i || typeof i != "object")
    throw new TypeError("argument obj is required");
  var e = i.parameters, t = i.type;
  if (!t || !xt.test(t))
    throw new TypeError("invalid type");
  var r = t;
  if (e && typeof e == "object")
    for (var n, a = Object.keys(e).sort(), s = 0; s < a.length; s++) {
      if (n = a[s], !ht.test(n))
        throw new TypeError("invalid parameter name");
      r += "; " + n + "=" + Wi(e[n]);
    }
  return r;
}
function Gi(i) {
  if (!i)
    throw new TypeError("argument string is required");
  var e = typeof i == "object" ? ji(i) : i;
  if (typeof e != "string")
    throw new TypeError("argument string is required to be a string");
  var t = e.indexOf(";"), r = t !== -1 ? e.slice(0, t).trim() : e.trim();
  if (!xt.test(r))
    throw new TypeError("invalid media type");
  var n = new qi(r.toLowerCase());
  if (t !== -1) {
    var a, s, o;
    for (Xe.lastIndex = t; s = Xe.exec(e); ) {
      if (s.index !== t)
        throw new TypeError("invalid parameter format");
      t += s[0].length, a = s[1].toLowerCase(), o = s[2], o.charCodeAt(0) === 34 && (o = o.slice(1, -1), o.indexOf("\\") !== -1 && (o = o.replace(zi, "$1"))), n.parameters[a] = o;
    }
    if (t !== e.length)
      throw new TypeError("invalid parameter format");
  }
  return n;
}
function ji(i) {
  var e;
  if (typeof i.getHeader == "function" ? e = i.getHeader("content-type") : typeof i.headers == "object" && (e = i.headers && i.headers["content-type"]), typeof e != "string")
    throw new TypeError("content-type header is missing from object");
  return e;
}
function Wi(i) {
  var e = String(i);
  if (ht.test(e))
    return e;
  if (e.length > 0 && !Ni.test(e))
    throw new TypeError("invalid parameter value");
  return '"' + e.replace(Ui, "\\$1") + '"';
}
function qi(i) {
  this.parameters = /* @__PURE__ */ Object.create(null), this.type = i;
}
/*!
 * media-typer
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */
var $i = /^ *([A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126})\/([A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}) *$/, Hi = Vi;
function Vi(i) {
  if (!i)
    throw new TypeError("argument string is required");
  if (typeof i != "string")
    throw new TypeError("argument string is required to be a string");
  var e = $i.exec(i.toLowerCase());
  if (!e)
    throw new TypeError("invalid media type");
  var t = e[1], r = e[2], n, a = r.lastIndexOf("+");
  return a !== -1 && (n = r.substr(a + 1), r = r.substr(0, a)), new Yi(t, r, n);
}
function Yi(i, e, t) {
  this.type = i, this.subtype = e, this.suffix = t;
}
var Ge;
(function(i) {
  i[i.shot = 10] = "shot", i[i.scene = 20] = "scene", i[i.track = 30] = "track", i[i.part = 40] = "part", i[i.album = 50] = "album", i[i.edition = 60] = "edition", i[i.collection = 70] = "collection";
})(Ge || (Ge = {}));
var Te;
(function(i) {
  i[i.video = 1] = "video", i[i.audio = 2] = "audio", i[i.complex = 3] = "complex", i[i.logo = 4] = "logo", i[i.subtitle = 17] = "subtitle", i[i.button = 18] = "button", i[i.control = 32] = "control";
})(Te || (Te = {}));
const $ = (i) => class extends Error {
  constructor(t) {
    super(t), this.name = i;
  }
};
class Ki extends $("CouldNotDetermineFileTypeError") {
}
class Zi extends $("UnsupportedFileTypeError") {
}
class Ji extends $("UnexpectedFileContentError") {
  constructor(e, t) {
    super(t), this.fileType = e;
  }
  // Override toString to include file type information.
  toString() {
    return `${this.name} (FileType: ${this.fileType}): ${this.message}`;
  }
}
class Ae extends $("FieldDecodingError") {
}
class gt extends $("InternalParserError") {
}
const Qi = (i) => class extends Ji {
  constructor(e) {
    super(i, e);
  }
};
function G(i, e, t) {
  return (i[e] & 1 << t) !== 0;
}
function je(i, e, t, r) {
  let n = e;
  if (r === "utf-16le") {
    for (; i[n] !== 0 || i[n + 1] !== 0; ) {
      if (n >= t)
        return t;
      n += 2;
    }
    return n;
  }
  for (; i[n] !== 0; ) {
    if (n >= t)
      return t;
    n++;
  }
  return n;
}
function er(i) {
  const e = i.indexOf("\0");
  return e === -1 ? i : i.substr(0, e);
}
function tr(i) {
  const e = i.length;
  if (e & 1)
    throw new Ae("Buffer length must be even");
  for (let t = 0; t < e; t += 2) {
    const r = i[t];
    i[t] = i[t + 1], i[t + 1] = r;
  }
  return i;
}
function ye(i, e) {
  if (i[0] === 255 && i[1] === 254)
    return ye(i.subarray(2), e);
  if (e === "utf-16le" && i[0] === 254 && i[1] === 255) {
    if (i.length & 1)
      throw new Ae("Expected even number of octets for 16-bit unicode string");
    return ye(tr(i), e);
  }
  return new y(i.length, e).get(i, 0);
}
function Rn(i) {
  return i = i.replace(/^\x00+/g, ""), i = i.replace(/\x00+$/g, ""), i;
}
function wt(i, e, t, r) {
  const n = e + ~~(t / 8), a = t % 8;
  let s = i[n];
  s &= 255 >> a;
  const o = 8 - a, c = r - o;
  return c < 0 ? s >>= 8 - a - r : c > 0 && (s <<= c, s |= wt(i, e, t + o, c)), s;
}
function Mn(i, e, t) {
  return wt(i, e, t, 1) === 1;
}
function ir(i) {
  const e = [];
  for (let t = 0, r = i.length; t < r; t++) {
    const n = Number(i.charCodeAt(t)).toString(16);
    e.push(n.length === 1 ? `0${n}` : n);
  }
  return e.join(" ");
}
function rr(i) {
  return 10 * Math.log10(i);
}
function nr(i) {
  return 10 ** (i / 10);
}
function ar(i) {
  const e = i.split(" ").map((t) => t.trim().toLowerCase());
  if (e.length >= 1) {
    const t = Number.parseFloat(e[0]);
    return e.length === 2 && e[1] === "db" ? {
      dB: t,
      ratio: nr(t)
    } : {
      dB: rr(t),
      ratio: t
    };
  }
}
var We;
(function(i) {
  i[i.Other = 0] = "Other", i[i["32x32 pixels 'file icon' (PNG only)"] = 1] = "32x32 pixels 'file icon' (PNG only)", i[i["Other file icon"] = 2] = "Other file icon", i[i["Cover (front)"] = 3] = "Cover (front)", i[i["Cover (back)"] = 4] = "Cover (back)", i[i["Leaflet page"] = 5] = "Leaflet page", i[i["Media (e.g. label side of CD)"] = 6] = "Media (e.g. label side of CD)", i[i["Lead artist/lead performer/soloist"] = 7] = "Lead artist/lead performer/soloist", i[i["Artist/performer"] = 8] = "Artist/performer", i[i.Conductor = 9] = "Conductor", i[i["Band/Orchestra"] = 10] = "Band/Orchestra", i[i.Composer = 11] = "Composer", i[i["Lyricist/text writer"] = 12] = "Lyricist/text writer", i[i["Recording Location"] = 13] = "Recording Location", i[i["During recording"] = 14] = "During recording", i[i["During performance"] = 15] = "During performance", i[i["Movie/video screen capture"] = 16] = "Movie/video screen capture", i[i["A bright coloured fish"] = 17] = "A bright coloured fish", i[i.Illustration = 18] = "Illustration", i[i["Band/artist logotype"] = 19] = "Band/artist logotype", i[i["Publisher/Studio logotype"] = 20] = "Publisher/Studio logotype";
})(We || (We = {}));
var ke;
(function(i) {
  i[i.other = 0] = "other", i[i.lyrics = 1] = "lyrics", i[i.text = 2] = "text", i[i.movement_part = 3] = "movement_part", i[i.events = 4] = "events", i[i.chord = 5] = "chord", i[i.trivia_pop = 6] = "trivia_pop";
})(ke || (ke = {}));
var Ie;
(function(i) {
  i[i.notSynchronized0 = 0] = "notSynchronized0", i[i.mpegFrameNumber = 1] = "mpegFrameNumber", i[i.milliseconds = 2] = "milliseconds";
})(Ie || (Ie = {}));
const sr = {
  get: (i, e) => i[e + 3] & 127 | i[e + 2] << 7 | i[e + 1] << 14 | i[e] << 21,
  len: 4
}, Bn = {
  len: 10,
  get: (i, e) => ({
    // ID3v2/file identifier   "ID3"
    fileIdentifier: new y(3, "ascii").get(i, e),
    // ID3v2 versionIndex
    version: {
      major: be.get(i, e + 3),
      revision: be.get(i, e + 4)
    },
    // ID3v2 flags
    flags: {
      // Unsynchronisation
      unsynchronisation: G(i, e + 5, 7),
      // Extended header
      isExtendedHeader: G(i, e + 5, 6),
      // Experimental indicator
      expIndicator: G(i, e + 5, 5),
      footer: G(i, e + 5, 4)
    },
    size: sr.get(i, e + 6)
  })
}, Fn = {
  len: 10,
  get: (i, e) => ({
    // Extended header size
    size: ae.get(i, e),
    // Extended Flags
    extendedFlags: j.get(i, e + 4),
    // Size of padding
    sizeOfPadding: ae.get(i, e + 6),
    // CRC data present
    crcDataPresent: G(i, e + 4, 31)
  })
}, or = {
  len: 1,
  get: (i, e) => {
    switch (i[e]) {
      case 0:
        return { encoding: "latin1" };
      case 1:
        return { encoding: "utf-16le", bom: !0 };
      case 2:
        return { encoding: "utf-16le", bom: !1 };
      case 3:
        return { encoding: "utf8", bom: !1 };
      default:
        return { encoding: "utf8", bom: !1 };
    }
  }
}, cr = {
  len: 4,
  get: (i, e) => ({
    encoding: or.get(i, e),
    language: new y(3, "latin1").get(i, e + 1)
  })
}, Dn = {
  len: 6,
  get: (i, e) => {
    const t = cr.get(i, e);
    return {
      encoding: t.encoding,
      language: t.language,
      timeStampFormat: L.get(i, e + 4),
      contentType: L.get(i, e + 5)
    };
  }
}, se = {
  year: { multiple: !1 },
  track: { multiple: !1 },
  disk: { multiple: !1 },
  title: { multiple: !1 },
  artist: { multiple: !1 },
  artists: { multiple: !0, unique: !0 },
  albumartist: { multiple: !1 },
  album: { multiple: !1 },
  date: { multiple: !1 },
  originaldate: { multiple: !1 },
  originalyear: { multiple: !1 },
  releasedate: { multiple: !1 },
  comment: { multiple: !0, unique: !1 },
  genre: { multiple: !0, unique: !0 },
  picture: { multiple: !0, unique: !0 },
  composer: { multiple: !0, unique: !0 },
  lyrics: { multiple: !0, unique: !1 },
  albumsort: { multiple: !1, unique: !0 },
  titlesort: { multiple: !1, unique: !0 },
  work: { multiple: !1, unique: !0 },
  artistsort: { multiple: !1, unique: !0 },
  albumartistsort: { multiple: !1, unique: !0 },
  composersort: { multiple: !1, unique: !0 },
  lyricist: { multiple: !0, unique: !0 },
  writer: { multiple: !0, unique: !0 },
  conductor: { multiple: !0, unique: !0 },
  remixer: { multiple: !0, unique: !0 },
  arranger: { multiple: !0, unique: !0 },
  engineer: { multiple: !0, unique: !0 },
  producer: { multiple: !0, unique: !0 },
  technician: { multiple: !0, unique: !0 },
  djmixer: { multiple: !0, unique: !0 },
  mixer: { multiple: !0, unique: !0 },
  label: { multiple: !0, unique: !0 },
  grouping: { multiple: !1 },
  subtitle: { multiple: !0 },
  discsubtitle: { multiple: !1 },
  totaltracks: { multiple: !1 },
  totaldiscs: { multiple: !1 },
  compilation: { multiple: !1 },
  rating: { multiple: !0 },
  bpm: { multiple: !1 },
  mood: { multiple: !1 },
  media: { multiple: !1 },
  catalognumber: { multiple: !0, unique: !0 },
  tvShow: { multiple: !1 },
  tvShowSort: { multiple: !1 },
  tvSeason: { multiple: !1 },
  tvEpisode: { multiple: !1 },
  tvEpisodeId: { multiple: !1 },
  tvNetwork: { multiple: !1 },
  podcast: { multiple: !1 },
  podcasturl: { multiple: !1 },
  releasestatus: { multiple: !1 },
  releasetype: { multiple: !0 },
  releasecountry: { multiple: !1 },
  script: { multiple: !1 },
  language: { multiple: !1 },
  copyright: { multiple: !1 },
  license: { multiple: !1 },
  encodedby: { multiple: !1 },
  encodersettings: { multiple: !1 },
  gapless: { multiple: !1 },
  barcode: { multiple: !1 },
  isrc: { multiple: !0 },
  asin: { multiple: !1 },
  musicbrainz_recordingid: { multiple: !1 },
  musicbrainz_trackid: { multiple: !1 },
  musicbrainz_albumid: { multiple: !1 },
  musicbrainz_artistid: { multiple: !0 },
  musicbrainz_albumartistid: { multiple: !0 },
  musicbrainz_releasegroupid: { multiple: !1 },
  musicbrainz_workid: { multiple: !1 },
  musicbrainz_trmid: { multiple: !1 },
  musicbrainz_discid: { multiple: !1 },
  acoustid_id: { multiple: !1 },
  acoustid_fingerprint: { multiple: !1 },
  musicip_puid: { multiple: !1 },
  musicip_fingerprint: { multiple: !1 },
  website: { multiple: !1 },
  "performer:instrument": { multiple: !0, unique: !0 },
  averageLevel: { multiple: !1 },
  peakLevel: { multiple: !1 },
  notes: { multiple: !0, unique: !1 },
  key: { multiple: !1 },
  originalalbum: { multiple: !1 },
  originalartist: { multiple: !1 },
  discogs_artist_id: { multiple: !0, unique: !0 },
  discogs_release_id: { multiple: !1 },
  discogs_label_id: { multiple: !1 },
  discogs_master_release_id: { multiple: !1 },
  discogs_votes: { multiple: !1 },
  discogs_rating: { multiple: !1 },
  replaygain_track_peak: { multiple: !1 },
  replaygain_track_gain: { multiple: !1 },
  replaygain_album_peak: { multiple: !1 },
  replaygain_album_gain: { multiple: !1 },
  replaygain_track_minmax: { multiple: !1 },
  replaygain_album_minmax: { multiple: !1 },
  replaygain_undo: { multiple: !1 },
  description: { multiple: !0 },
  longDescription: { multiple: !1 },
  category: { multiple: !0 },
  hdVideo: { multiple: !1 },
  keywords: { multiple: !0 },
  movement: { multiple: !1 },
  movementIndex: { multiple: !1 },
  movementTotal: { multiple: !1 },
  podcastId: { multiple: !1 },
  showMovement: { multiple: !1 },
  stik: { multiple: !1 }
};
function lr(i) {
  return se[i] && !se[i].multiple;
}
function ur(i) {
  return !se[i].multiple || se[i].unique || !1;
}
class v {
  static toIntOrNull(e) {
    const t = Number.parseInt(e, 10);
    return Number.isNaN(t) ? null : t;
  }
  // TODO: a string of 1of1 would fail to be converted
  // converts 1/10 to no : 1, of : 10
  // or 1 to no : 1, of : 0
  static normalizeTrack(e) {
    const t = e.toString().split("/");
    return {
      no: Number.parseInt(t[0], 10) || null,
      of: Number.parseInt(t[1], 10) || null
    };
  }
  constructor(e, t) {
    this.tagTypes = e, this.tagMap = t;
  }
  /**
   * Process and set common tags
   * write common tags to
   * @param tag Native tag
   * @param warnings Register warnings
   * @return common name
   */
  mapGenericTag(e, t) {
    e = { id: e.id, value: e.value }, this.postMap(e, t);
    const r = this.getCommonName(e.id);
    return r ? { id: r, value: e.value } : null;
  }
  /**
   * Convert native tag key to common tag key
   * @param tag Native header tag
   * @return common tag name (alias)
   */
  getCommonName(e) {
    return this.tagMap[e];
  }
  /**
   * Handle post mapping exceptions / correction
   * @param tag Tag e.g. {"©alb", "Buena Vista Social Club")
   * @param warnings Used to register warnings
   */
  postMap(e, t) {
  }
}
v.maxRatingScore = 1;
const mr = {
  title: "title",
  artist: "artist",
  album: "album",
  year: "year",
  comment: "comment",
  track: "track",
  genre: "genre"
};
class pr extends v {
  constructor() {
    super(["ID3v1"], mr);
  }
}
class H extends v {
  constructor(e, t) {
    const r = {};
    for (const n of Object.keys(t))
      r[n.toUpperCase()] = t[n];
    super(e, r);
  }
  /**
   * @tag  Native header tag
   * @return common tag name (alias)
   */
  getCommonName(e) {
    return this.tagMap[e.toUpperCase()];
  }
}
const fr = {
  // id3v2.3
  TIT2: "title",
  TPE1: "artist",
  "TXXX:Artists": "artists",
  TPE2: "albumartist",
  TALB: "album",
  TDRV: "date",
  // [ 'date', 'year' ] ToDo: improve 'year' mapping
  /**
   * Original release year
   */
  TORY: "originalyear",
  TPOS: "disk",
  TCON: "genre",
  APIC: "picture",
  TCOM: "composer",
  USLT: "lyrics",
  TSOA: "albumsort",
  TSOT: "titlesort",
  TOAL: "originalalbum",
  TSOP: "artistsort",
  TSO2: "albumartistsort",
  TSOC: "composersort",
  TEXT: "lyricist",
  "TXXX:Writer": "writer",
  TPE3: "conductor",
  // 'IPLS:instrument': 'performer:instrument', // ToDo
  TPE4: "remixer",
  "IPLS:arranger": "arranger",
  "IPLS:engineer": "engineer",
  "IPLS:producer": "producer",
  "IPLS:DJ-mix": "djmixer",
  "IPLS:mix": "mixer",
  TPUB: "label",
  TIT1: "grouping",
  TIT3: "subtitle",
  TRCK: "track",
  TCMP: "compilation",
  POPM: "rating",
  TBPM: "bpm",
  TMED: "media",
  "TXXX:CATALOGNUMBER": "catalognumber",
  "TXXX:MusicBrainz Album Status": "releasestatus",
  "TXXX:MusicBrainz Album Type": "releasetype",
  /**
   * Release country as documented: https://picard.musicbrainz.org/docs/mappings/#cite_note-0
   */
  "TXXX:MusicBrainz Album Release Country": "releasecountry",
  /**
   * Release country as implemented // ToDo: report
   */
  "TXXX:RELEASECOUNTRY": "releasecountry",
  "TXXX:SCRIPT": "script",
  TLAN: "language",
  TCOP: "copyright",
  WCOP: "license",
  TENC: "encodedby",
  TSSE: "encodersettings",
  "TXXX:BARCODE": "barcode",
  "TXXX:ISRC": "isrc",
  TSRC: "isrc",
  "TXXX:ASIN": "asin",
  "TXXX:originalyear": "originalyear",
  "UFID:http://musicbrainz.org": "musicbrainz_recordingid",
  "TXXX:MusicBrainz Release Track Id": "musicbrainz_trackid",
  "TXXX:MusicBrainz Album Id": "musicbrainz_albumid",
  "TXXX:MusicBrainz Artist Id": "musicbrainz_artistid",
  "TXXX:MusicBrainz Album Artist Id": "musicbrainz_albumartistid",
  "TXXX:MusicBrainz Release Group Id": "musicbrainz_releasegroupid",
  "TXXX:MusicBrainz Work Id": "musicbrainz_workid",
  "TXXX:MusicBrainz TRM Id": "musicbrainz_trmid",
  "TXXX:MusicBrainz Disc Id": "musicbrainz_discid",
  "TXXX:ACOUSTID_ID": "acoustid_id",
  "TXXX:Acoustid Id": "acoustid_id",
  "TXXX:Acoustid Fingerprint": "acoustid_fingerprint",
  "TXXX:MusicIP PUID": "musicip_puid",
  "TXXX:MusicMagic Fingerprint": "musicip_fingerprint",
  WOAR: "website",
  // id3v2.4
  // ToDo: In same sequence as defined at http://id3.org/id3v2.4.0-frames
  TDRC: "date",
  // date YYYY-MM-DD
  TYER: "year",
  TDOR: "originaldate",
  // 'TMCL:instrument': 'performer:instrument',
  "TIPL:arranger": "arranger",
  "TIPL:engineer": "engineer",
  "TIPL:producer": "producer",
  "TIPL:DJ-mix": "djmixer",
  "TIPL:mix": "mixer",
  TMOO: "mood",
  // additional mappings:
  SYLT: "lyrics",
  TSST: "discsubtitle",
  TKEY: "key",
  COMM: "comment",
  TOPE: "originalartist",
  // Windows Media Player
  "PRIV:AverageLevel": "averageLevel",
  "PRIV:PeakLevel": "peakLevel",
  // Discogs
  "TXXX:DISCOGS_ARTIST_ID": "discogs_artist_id",
  "TXXX:DISCOGS_ARTISTS": "artists",
  "TXXX:DISCOGS_ARTIST_NAME": "artists",
  "TXXX:DISCOGS_ALBUM_ARTISTS": "albumartist",
  "TXXX:DISCOGS_CATALOG": "catalognumber",
  "TXXX:DISCOGS_COUNTRY": "releasecountry",
  "TXXX:DISCOGS_DATE": "originaldate",
  "TXXX:DISCOGS_LABEL": "label",
  "TXXX:DISCOGS_LABEL_ID": "discogs_label_id",
  "TXXX:DISCOGS_MASTER_RELEASE_ID": "discogs_master_release_id",
  "TXXX:DISCOGS_RATING": "discogs_rating",
  "TXXX:DISCOGS_RELEASED": "date",
  "TXXX:DISCOGS_RELEASE_ID": "discogs_release_id",
  "TXXX:DISCOGS_VOTES": "discogs_votes",
  "TXXX:CATALOGID": "catalognumber",
  "TXXX:STYLE": "genre",
  "TXXX:REPLAYGAIN_TRACK_PEAK": "replaygain_track_peak",
  "TXXX:REPLAYGAIN_TRACK_GAIN": "replaygain_track_gain",
  "TXXX:REPLAYGAIN_ALBUM_PEAK": "replaygain_album_peak",
  "TXXX:REPLAYGAIN_ALBUM_GAIN": "replaygain_album_gain",
  "TXXX:MP3GAIN_MINMAX": "replaygain_track_minmax",
  "TXXX:MP3GAIN_ALBUM_MINMAX": "replaygain_album_minmax",
  "TXXX:MP3GAIN_UNDO": "replaygain_undo",
  MVNM: "movement",
  MVIN: "movementIndex",
  PCST: "podcast",
  TCAT: "category",
  TDES: "description",
  TDRL: "releasedate",
  TGID: "podcastId",
  TKWD: "keywords",
  WFED: "podcasturl",
  GRP1: "grouping"
};
class Ee extends H {
  static toRating(e) {
    return {
      source: e.email,
      rating: e.rating > 0 ? (e.rating - 1) / 254 * v.maxRatingScore : void 0
    };
  }
  constructor() {
    super(["ID3v2.3", "ID3v2.4"], fr);
  }
  /**
   * Handle post mapping exceptions / correction
   * @param tag to post map
   * @param warnings Wil be used to register (collect) warnings
   */
  postMap(e, t) {
    switch (e.id) {
      case "UFID":
        {
          const r = e.value;
          r.owner_identifier === "http://musicbrainz.org" && (e.id += `:${r.owner_identifier}`, e.value = ye(r.identifier, "latin1"));
        }
        break;
      case "PRIV":
        {
          const r = e.value;
          switch (r.owner_identifier) {
            case "AverageLevel":
            case "PeakValue":
              e.id += `:${r.owner_identifier}`, e.value = r.data.length === 4 ? T.get(r.data, 0) : null, e.value === null && t.addWarning("Failed to parse PRIV:PeakValue");
              break;
            default:
              t.addWarning(`Unknown PRIV owner-identifier: ${r.data}`);
          }
        }
        break;
      case "POPM":
        e.value = Ee.toRating(e.value);
        break;
    }
  }
}
const dr = {
  Title: "title",
  Author: "artist",
  "WM/AlbumArtist": "albumartist",
  "WM/AlbumTitle": "album",
  "WM/Year": "date",
  // changed to 'year' to 'date' based on Picard mappings; ToDo: check me
  "WM/OriginalReleaseTime": "originaldate",
  "WM/OriginalReleaseYear": "originalyear",
  Description: "comment",
  "WM/TrackNumber": "track",
  "WM/PartOfSet": "disk",
  "WM/Genre": "genre",
  "WM/Composer": "composer",
  "WM/Lyrics": "lyrics",
  "WM/AlbumSortOrder": "albumsort",
  "WM/TitleSortOrder": "titlesort",
  "WM/ArtistSortOrder": "artistsort",
  "WM/AlbumArtistSortOrder": "albumartistsort",
  "WM/ComposerSortOrder": "composersort",
  "WM/Writer": "lyricist",
  "WM/Conductor": "conductor",
  "WM/ModifiedBy": "remixer",
  "WM/Engineer": "engineer",
  "WM/Producer": "producer",
  "WM/DJMixer": "djmixer",
  "WM/Mixer": "mixer",
  "WM/Publisher": "label",
  "WM/ContentGroupDescription": "grouping",
  "WM/SubTitle": "subtitle",
  "WM/SetSubTitle": "discsubtitle",
  // 'WM/PartOfSet': 'totaldiscs',
  "WM/IsCompilation": "compilation",
  "WM/SharedUserRating": "rating",
  "WM/BeatsPerMinute": "bpm",
  "WM/Mood": "mood",
  "WM/Media": "media",
  "WM/CatalogNo": "catalognumber",
  "MusicBrainz/Album Status": "releasestatus",
  "MusicBrainz/Album Type": "releasetype",
  "MusicBrainz/Album Release Country": "releasecountry",
  "WM/Script": "script",
  "WM/Language": "language",
  Copyright: "copyright",
  LICENSE: "license",
  "WM/EncodedBy": "encodedby",
  "WM/EncodingSettings": "encodersettings",
  "WM/Barcode": "barcode",
  "WM/ISRC": "isrc",
  "MusicBrainz/Track Id": "musicbrainz_recordingid",
  "MusicBrainz/Release Track Id": "musicbrainz_trackid",
  "MusicBrainz/Album Id": "musicbrainz_albumid",
  "MusicBrainz/Artist Id": "musicbrainz_artistid",
  "MusicBrainz/Album Artist Id": "musicbrainz_albumartistid",
  "MusicBrainz/Release Group Id": "musicbrainz_releasegroupid",
  "MusicBrainz/Work Id": "musicbrainz_workid",
  "MusicBrainz/TRM Id": "musicbrainz_trmid",
  "MusicBrainz/Disc Id": "musicbrainz_discid",
  "Acoustid/Id": "acoustid_id",
  "Acoustid/Fingerprint": "acoustid_fingerprint",
  "MusicIP/PUID": "musicip_puid",
  "WM/ARTISTS": "artists",
  "WM/InitialKey": "key",
  ASIN: "asin",
  "WM/Work": "work",
  "WM/AuthorURL": "website",
  "WM/Picture": "picture"
};
class _e extends v {
  static toRating(e) {
    return {
      rating: Number.parseFloat(e + 1) / 5
    };
  }
  constructor() {
    super(["asf"], dr);
  }
  postMap(e) {
    switch (e.id) {
      case "WM/SharedUserRating": {
        const t = e.id.split(":");
        e.value = _e.toRating(e.value), e.id = t[0];
        break;
      }
    }
  }
}
const hr = {
  TT2: "title",
  TP1: "artist",
  TP2: "albumartist",
  TAL: "album",
  TYE: "year",
  COM: "comment",
  TRK: "track",
  TPA: "disk",
  TCO: "genre",
  PIC: "picture",
  TCM: "composer",
  TOR: "originaldate",
  TOT: "originalalbum",
  TXT: "lyricist",
  TP3: "conductor",
  TPB: "label",
  TT1: "grouping",
  TT3: "subtitle",
  TLA: "language",
  TCR: "copyright",
  WCP: "license",
  TEN: "encodedby",
  TSS: "encodersettings",
  WAR: "website",
  PCS: "podcast",
  TCP: "compilation",
  TDR: "date",
  TS2: "albumartistsort",
  TSA: "albumsort",
  TSC: "composersort",
  TSP: "artistsort",
  TST: "titlesort",
  WFD: "podcasturl",
  TBP: "bpm"
};
class xr extends H {
  constructor() {
    super(["ID3v2.2"], hr);
  }
}
const gr = {
  Title: "title",
  Artist: "artist",
  Artists: "artists",
  "Album Artist": "albumartist",
  Album: "album",
  Year: "date",
  Originalyear: "originalyear",
  Originaldate: "originaldate",
  Releasedate: "releasedate",
  Comment: "comment",
  Track: "track",
  Disc: "disk",
  DISCNUMBER: "disk",
  // ToDo: backwards compatibility', valid tag?
  Genre: "genre",
  "Cover Art (Front)": "picture",
  "Cover Art (Back)": "picture",
  Composer: "composer",
  Lyrics: "lyrics",
  ALBUMSORT: "albumsort",
  TITLESORT: "titlesort",
  WORK: "work",
  ARTISTSORT: "artistsort",
  ALBUMARTISTSORT: "albumartistsort",
  COMPOSERSORT: "composersort",
  Lyricist: "lyricist",
  Writer: "writer",
  Conductor: "conductor",
  // 'Performer=artist (instrument)': 'performer:instrument',
  MixArtist: "remixer",
  Arranger: "arranger",
  Engineer: "engineer",
  Producer: "producer",
  DJMixer: "djmixer",
  Mixer: "mixer",
  Label: "label",
  Grouping: "grouping",
  Subtitle: "subtitle",
  DiscSubtitle: "discsubtitle",
  Compilation: "compilation",
  BPM: "bpm",
  Mood: "mood",
  Media: "media",
  CatalogNumber: "catalognumber",
  MUSICBRAINZ_ALBUMSTATUS: "releasestatus",
  MUSICBRAINZ_ALBUMTYPE: "releasetype",
  RELEASECOUNTRY: "releasecountry",
  Script: "script",
  Language: "language",
  Copyright: "copyright",
  LICENSE: "license",
  EncodedBy: "encodedby",
  EncoderSettings: "encodersettings",
  Barcode: "barcode",
  ISRC: "isrc",
  ASIN: "asin",
  musicbrainz_trackid: "musicbrainz_recordingid",
  musicbrainz_releasetrackid: "musicbrainz_trackid",
  MUSICBRAINZ_ALBUMID: "musicbrainz_albumid",
  MUSICBRAINZ_ARTISTID: "musicbrainz_artistid",
  MUSICBRAINZ_ALBUMARTISTID: "musicbrainz_albumartistid",
  MUSICBRAINZ_RELEASEGROUPID: "musicbrainz_releasegroupid",
  MUSICBRAINZ_WORKID: "musicbrainz_workid",
  MUSICBRAINZ_TRMID: "musicbrainz_trmid",
  MUSICBRAINZ_DISCID: "musicbrainz_discid",
  Acoustid_Id: "acoustid_id",
  ACOUSTID_FINGERPRINT: "acoustid_fingerprint",
  MUSICIP_PUID: "musicip_puid",
  Weblink: "website",
  REPLAYGAIN_TRACK_GAIN: "replaygain_track_gain",
  REPLAYGAIN_TRACK_PEAK: "replaygain_track_peak",
  MP3GAIN_MINMAX: "replaygain_track_minmax",
  MP3GAIN_UNDO: "replaygain_undo"
};
class wr extends H {
  constructor() {
    super(["APEv2"], gr);
  }
}
const br = {
  "©nam": "title",
  "©ART": "artist",
  aART: "albumartist",
  /**
   * ToDo: Album artist seems to be stored here while Picard documentation says: aART
   */
  "----:com.apple.iTunes:Band": "albumartist",
  "©alb": "album",
  "©day": "date",
  "©cmt": "comment",
  "©com": "comment",
  trkn: "track",
  disk: "disk",
  "©gen": "genre",
  covr: "picture",
  "©wrt": "composer",
  "©lyr": "lyrics",
  soal: "albumsort",
  sonm: "titlesort",
  soar: "artistsort",
  soaa: "albumartistsort",
  soco: "composersort",
  "----:com.apple.iTunes:LYRICIST": "lyricist",
  "----:com.apple.iTunes:CONDUCTOR": "conductor",
  "----:com.apple.iTunes:REMIXER": "remixer",
  "----:com.apple.iTunes:ENGINEER": "engineer",
  "----:com.apple.iTunes:PRODUCER": "producer",
  "----:com.apple.iTunes:DJMIXER": "djmixer",
  "----:com.apple.iTunes:MIXER": "mixer",
  "----:com.apple.iTunes:LABEL": "label",
  "©grp": "grouping",
  "----:com.apple.iTunes:SUBTITLE": "subtitle",
  "----:com.apple.iTunes:DISCSUBTITLE": "discsubtitle",
  cpil: "compilation",
  tmpo: "bpm",
  "----:com.apple.iTunes:MOOD": "mood",
  "----:com.apple.iTunes:MEDIA": "media",
  "----:com.apple.iTunes:CATALOGNUMBER": "catalognumber",
  tvsh: "tvShow",
  tvsn: "tvSeason",
  tves: "tvEpisode",
  sosn: "tvShowSort",
  tven: "tvEpisodeId",
  tvnn: "tvNetwork",
  pcst: "podcast",
  purl: "podcasturl",
  "----:com.apple.iTunes:MusicBrainz Album Status": "releasestatus",
  "----:com.apple.iTunes:MusicBrainz Album Type": "releasetype",
  "----:com.apple.iTunes:MusicBrainz Album Release Country": "releasecountry",
  "----:com.apple.iTunes:SCRIPT": "script",
  "----:com.apple.iTunes:LANGUAGE": "language",
  cprt: "copyright",
  "©cpy": "copyright",
  "----:com.apple.iTunes:LICENSE": "license",
  "©too": "encodedby",
  pgap: "gapless",
  "----:com.apple.iTunes:BARCODE": "barcode",
  "----:com.apple.iTunes:ISRC": "isrc",
  "----:com.apple.iTunes:ASIN": "asin",
  "----:com.apple.iTunes:NOTES": "comment",
  "----:com.apple.iTunes:MusicBrainz Track Id": "musicbrainz_recordingid",
  "----:com.apple.iTunes:MusicBrainz Release Track Id": "musicbrainz_trackid",
  "----:com.apple.iTunes:MusicBrainz Album Id": "musicbrainz_albumid",
  "----:com.apple.iTunes:MusicBrainz Artist Id": "musicbrainz_artistid",
  "----:com.apple.iTunes:MusicBrainz Album Artist Id": "musicbrainz_albumartistid",
  "----:com.apple.iTunes:MusicBrainz Release Group Id": "musicbrainz_releasegroupid",
  "----:com.apple.iTunes:MusicBrainz Work Id": "musicbrainz_workid",
  "----:com.apple.iTunes:MusicBrainz TRM Id": "musicbrainz_trmid",
  "----:com.apple.iTunes:MusicBrainz Disc Id": "musicbrainz_discid",
  "----:com.apple.iTunes:Acoustid Id": "acoustid_id",
  "----:com.apple.iTunes:Acoustid Fingerprint": "acoustid_fingerprint",
  "----:com.apple.iTunes:MusicIP PUID": "musicip_puid",
  "----:com.apple.iTunes:fingerprint": "musicip_fingerprint",
  "----:com.apple.iTunes:replaygain_track_gain": "replaygain_track_gain",
  "----:com.apple.iTunes:replaygain_track_peak": "replaygain_track_peak",
  "----:com.apple.iTunes:replaygain_album_gain": "replaygain_album_gain",
  "----:com.apple.iTunes:replaygain_album_peak": "replaygain_album_peak",
  "----:com.apple.iTunes:replaygain_track_minmax": "replaygain_track_minmax",
  "----:com.apple.iTunes:replaygain_album_minmax": "replaygain_album_minmax",
  "----:com.apple.iTunes:replaygain_undo": "replaygain_undo",
  // Additional mappings:
  gnre: "genre",
  // ToDo: check mapping
  "----:com.apple.iTunes:ALBUMARTISTSORT": "albumartistsort",
  "----:com.apple.iTunes:ARTISTS": "artists",
  "----:com.apple.iTunes:ORIGINALDATE": "originaldate",
  "----:com.apple.iTunes:ORIGINALYEAR": "originalyear",
  "----:com.apple.iTunes:RELEASEDATE": "releasedate",
  // '----:com.apple.iTunes:PERFORMER': 'performer'
  desc: "description",
  ldes: "longDescription",
  "©mvn": "movement",
  "©mvi": "movementIndex",
  "©mvc": "movementTotal",
  "©wrk": "work",
  catg: "category",
  egid: "podcastId",
  hdvd: "hdVideo",
  keyw: "keywords",
  shwm: "showMovement",
  stik: "stik",
  rate: "rating"
}, Tr = "iTunes";
class qe extends H {
  constructor() {
    super([Tr], br);
  }
  postMap(e, t) {
    switch (e.id) {
      case "rate":
        e.value = {
          source: void 0,
          rating: Number.parseFloat(e.value) / 100
        };
        break;
    }
  }
}
const yr = {
  TITLE: "title",
  ARTIST: "artist",
  ARTISTS: "artists",
  ALBUMARTIST: "albumartist",
  "ALBUM ARTIST": "albumartist",
  ALBUM: "album",
  DATE: "date",
  ORIGINALDATE: "originaldate",
  ORIGINALYEAR: "originalyear",
  RELEASEDATE: "releasedate",
  COMMENT: "comment",
  TRACKNUMBER: "track",
  DISCNUMBER: "disk",
  GENRE: "genre",
  METADATA_BLOCK_PICTURE: "picture",
  COMPOSER: "composer",
  LYRICS: "lyrics",
  ALBUMSORT: "albumsort",
  TITLESORT: "titlesort",
  WORK: "work",
  ARTISTSORT: "artistsort",
  ALBUMARTISTSORT: "albumartistsort",
  COMPOSERSORT: "composersort",
  LYRICIST: "lyricist",
  WRITER: "writer",
  CONDUCTOR: "conductor",
  // 'PERFORMER=artist (instrument)': 'performer:instrument', // ToDo
  REMIXER: "remixer",
  ARRANGER: "arranger",
  ENGINEER: "engineer",
  PRODUCER: "producer",
  DJMIXER: "djmixer",
  MIXER: "mixer",
  LABEL: "label",
  GROUPING: "grouping",
  SUBTITLE: "subtitle",
  DISCSUBTITLE: "discsubtitle",
  TRACKTOTAL: "totaltracks",
  DISCTOTAL: "totaldiscs",
  COMPILATION: "compilation",
  RATING: "rating",
  BPM: "bpm",
  KEY: "key",
  MOOD: "mood",
  MEDIA: "media",
  CATALOGNUMBER: "catalognumber",
  RELEASESTATUS: "releasestatus",
  RELEASETYPE: "releasetype",
  RELEASECOUNTRY: "releasecountry",
  SCRIPT: "script",
  LANGUAGE: "language",
  COPYRIGHT: "copyright",
  LICENSE: "license",
  ENCODEDBY: "encodedby",
  ENCODERSETTINGS: "encodersettings",
  BARCODE: "barcode",
  ISRC: "isrc",
  ASIN: "asin",
  MUSICBRAINZ_TRACKID: "musicbrainz_recordingid",
  MUSICBRAINZ_RELEASETRACKID: "musicbrainz_trackid",
  MUSICBRAINZ_ALBUMID: "musicbrainz_albumid",
  MUSICBRAINZ_ARTISTID: "musicbrainz_artistid",
  MUSICBRAINZ_ALBUMARTISTID: "musicbrainz_albumartistid",
  MUSICBRAINZ_RELEASEGROUPID: "musicbrainz_releasegroupid",
  MUSICBRAINZ_WORKID: "musicbrainz_workid",
  MUSICBRAINZ_TRMID: "musicbrainz_trmid",
  MUSICBRAINZ_DISCID: "musicbrainz_discid",
  ACOUSTID_ID: "acoustid_id",
  ACOUSTID_ID_FINGERPRINT: "acoustid_fingerprint",
  MUSICIP_PUID: "musicip_puid",
  // 'FINGERPRINT=MusicMagic Fingerprint {fingerprint}': 'musicip_fingerprint', // ToDo
  WEBSITE: "website",
  NOTES: "notes",
  TOTALTRACKS: "totaltracks",
  TOTALDISCS: "totaldiscs",
  // Discogs
  DISCOGS_ARTIST_ID: "discogs_artist_id",
  DISCOGS_ARTISTS: "artists",
  DISCOGS_ARTIST_NAME: "artists",
  DISCOGS_ALBUM_ARTISTS: "albumartist",
  DISCOGS_CATALOG: "catalognumber",
  DISCOGS_COUNTRY: "releasecountry",
  DISCOGS_DATE: "originaldate",
  DISCOGS_LABEL: "label",
  DISCOGS_LABEL_ID: "discogs_label_id",
  DISCOGS_MASTER_RELEASE_ID: "discogs_master_release_id",
  DISCOGS_RATING: "discogs_rating",
  DISCOGS_RELEASED: "date",
  DISCOGS_RELEASE_ID: "discogs_release_id",
  DISCOGS_VOTES: "discogs_votes",
  CATALOGID: "catalognumber",
  STYLE: "genre",
  //
  REPLAYGAIN_TRACK_GAIN: "replaygain_track_gain",
  REPLAYGAIN_TRACK_PEAK: "replaygain_track_peak",
  REPLAYGAIN_ALBUM_GAIN: "replaygain_album_gain",
  REPLAYGAIN_ALBUM_PEAK: "replaygain_album_peak",
  // To Sure if these (REPLAYGAIN_MINMAX, REPLAYGAIN_ALBUM_MINMAX & REPLAYGAIN_UNDO) are used for Vorbis:
  REPLAYGAIN_MINMAX: "replaygain_track_minmax",
  REPLAYGAIN_ALBUM_MINMAX: "replaygain_album_minmax",
  REPLAYGAIN_UNDO: "replaygain_undo"
};
class oe extends v {
  static toRating(e, t, r) {
    return {
      source: e ? e.toLowerCase() : void 0,
      rating: Number.parseFloat(t) / r * v.maxRatingScore
    };
  }
  constructor() {
    super(["vorbis"], yr);
  }
  postMap(e) {
    if (e.id === "RATING")
      e.value = oe.toRating(void 0, e.value, 100);
    else if (e.id.indexOf("RATING:") === 0) {
      const t = e.id.split(":");
      e.value = oe.toRating(t[1], e.value, 1), e.id = t[0];
    }
  }
}
const kr = {
  IART: "artist",
  // Artist
  ICRD: "date",
  // DateCreated
  INAM: "title",
  // Title
  TITL: "title",
  IPRD: "album",
  // Product
  ITRK: "track",
  IPRT: "track",
  // Additional tag for track index
  COMM: "comment",
  // Comments
  ICMT: "comment",
  // Country
  ICNT: "releasecountry",
  GNRE: "genre",
  // Genre
  IWRI: "writer",
  // WrittenBy
  RATE: "rating",
  YEAR: "year",
  ISFT: "encodedby",
  // Software
  CODE: "encodedby",
  // EncodedBy
  TURL: "website",
  // URL,
  IGNR: "genre",
  // Genre
  IENG: "engineer",
  // Engineer
  ITCH: "technician",
  // Technician
  IMED: "media",
  // Original Media
  IRPD: "album"
  // Product, where the file was intended for
};
class Ir extends v {
  constructor() {
    super(["exif"], kr);
  }
}
const vr = {
  "segment:title": "title",
  "album:ARTIST": "albumartist",
  "album:ARTISTSORT": "albumartistsort",
  "album:TITLE": "album",
  "album:DATE_RECORDED": "originaldate",
  "album:DATE_RELEASED": "releasedate",
  "album:PART_NUMBER": "disk",
  "album:TOTAL_PARTS": "totaltracks",
  "track:ARTIST": "artist",
  "track:ARTISTSORT": "artistsort",
  "track:TITLE": "title",
  "track:PART_NUMBER": "track",
  "track:MUSICBRAINZ_TRACKID": "musicbrainz_recordingid",
  "track:MUSICBRAINZ_ALBUMID": "musicbrainz_albumid",
  "track:MUSICBRAINZ_ARTISTID": "musicbrainz_artistid",
  "track:PUBLISHER": "label",
  "track:GENRE": "genre",
  "track:ENCODER": "encodedby",
  "track:ENCODER_OPTIONS": "encodersettings",
  "edition:TOTAL_PARTS": "totaldiscs",
  picture: "picture"
};
class Sr extends H {
  constructor() {
    super(["matroska"], vr);
  }
}
const Cr = {
  NAME: "title",
  AUTH: "artist",
  "(c) ": "copyright",
  ANNO: "comment"
};
class Ar extends v {
  constructor() {
    super(["AIFF"], Cr);
  }
}
class Er {
  constructor() {
    this.tagMappers = {}, [
      new pr(),
      new xr(),
      new Ee(),
      new qe(),
      new qe(),
      new oe(),
      new wr(),
      new _e(),
      new Ir(),
      new Sr(),
      new Ar()
    ].forEach((e) => {
      this.registerTagMapper(e);
    });
  }
  /**
   * Convert native to generic (common) tags
   * @param tagType Originating tag format
   * @param tag     Native tag to map to a generic tag id
   * @param warnings
   * @return Generic tag result (output of this function)
   */
  mapTag(e, t, r) {
    if (this.tagMappers[e])
      return this.tagMappers[e].mapGenericTag(t, r);
    throw new gt(`No generic tag mapper defined for tag-format: ${e}`);
  }
  registerTagMapper(e) {
    for (const t of e.tagTypes)
      this.tagMappers[t] = e;
  }
}
function _r(i) {
  const e = i.split(`
`), t = [], r = /\[(\d{2}):(\d{2})\.(\d{2})\]/;
  for (const n of e) {
    const a = n.match(r);
    if (a) {
      const s = Number.parseInt(a[1], 10), o = Number.parseInt(a[2], 10), c = Number.parseInt(a[3], 10), p = (s * 60 + o) * 1e3 + c * 10, m = n.replace(r, "").trim();
      t.push({ timestamp: p, text: m });
    }
  }
  return {
    contentType: ke.lyrics,
    timeStampFormat: Ie.milliseconds,
    syncText: t
  };
}
const F = q("music-metadata:collector"), Rr = ["matroska", "APEv2", "vorbis", "ID3v2.4", "ID3v2.3", "ID3v2.2", "exif", "asf", "iTunes", "AIFF", "ID3v1"];
class Mr {
  constructor(e) {
    this.opts = e, this.format = {
      tagTypes: [],
      trackInfo: []
    }, this.native = {}, this.common = {
      track: { no: null, of: null },
      disk: { no: null, of: null },
      movementIndex: { no: null, of: null }
    }, this.quality = {
      warnings: []
    }, this.commonOrigin = {}, this.originPriority = {}, this.tagMapper = new Er();
    let t = 1;
    for (const r of Rr)
      this.originPriority[r] = t++;
    this.originPriority.artificial = 500, this.originPriority.id3v1 = 600;
  }
  /**
   * @returns {boolean} true if one or more tags have been found
   */
  hasAny() {
    return Object.keys(this.native).length > 0;
  }
  addStreamInfo(e) {
    F(`streamInfo: type=${e.type ? Te[e.type] : "?"}, codec=${e.codecName}`), this.format.trackInfo.push(e);
  }
  setFormat(e, t) {
    var r;
    F(`format: ${e} = ${t}`), this.format[e] = t, (r = this.opts) != null && r.observer && this.opts.observer({ metadata: this, tag: { type: "format", id: e, value: t } });
  }
  async addTag(e, t, r) {
    F(`tag ${e}.${t} = ${r}`), this.native[e] || (this.format.tagTypes.push(e), this.native[e] = []), this.native[e].push({ id: t, value: r }), await this.toCommon(e, t, r);
  }
  addWarning(e) {
    this.quality.warnings.push({ message: e });
  }
  async postMap(e, t) {
    switch (t.id) {
      case "artist":
        if (this.commonOrigin.artist === this.originPriority[e])
          return this.postMap("artificial", { id: "artists", value: t.value });
        this.common.artists || this.setGenericTag("artificial", { id: "artists", value: t.value });
        break;
      case "artists":
        if ((!this.common.artist || this.commonOrigin.artist === this.originPriority.artificial) && (!this.common.artists || this.common.artists.indexOf(t.value) === -1)) {
          const r = (this.common.artists || []).concat([t.value]), a = { id: "artist", value: Br(r) };
          this.setGenericTag("artificial", a);
        }
        break;
      case "picture":
        return this.postFixPicture(t.value).then((r) => {
          r !== null && (t.value = r, this.setGenericTag(e, t));
        });
      case "totaltracks":
        this.common.track.of = v.toIntOrNull(t.value);
        return;
      case "totaldiscs":
        this.common.disk.of = v.toIntOrNull(t.value);
        return;
      case "movementTotal":
        this.common.movementIndex.of = v.toIntOrNull(t.value);
        return;
      case "track":
      case "disk":
      case "movementIndex": {
        const r = this.common[t.id].of;
        this.common[t.id] = v.normalizeTrack(t.value), this.common[t.id].of = r ?? this.common[t.id].of;
        return;
      }
      case "bpm":
      case "year":
      case "originalyear":
        t.value = Number.parseInt(t.value, 10);
        break;
      case "date": {
        const r = Number.parseInt(t.value.substr(0, 4), 10);
        Number.isNaN(r) || (this.common.year = r);
        break;
      }
      case "discogs_label_id":
      case "discogs_release_id":
      case "discogs_master_release_id":
      case "discogs_artist_id":
      case "discogs_votes":
        t.value = typeof t.value == "string" ? Number.parseInt(t.value, 10) : t.value;
        break;
      case "replaygain_track_gain":
      case "replaygain_track_peak":
      case "replaygain_album_gain":
      case "replaygain_album_peak":
        t.value = ar(t.value);
        break;
      case "replaygain_track_minmax":
        t.value = t.value.split(",").map((r) => Number.parseInt(r, 10));
        break;
      case "replaygain_undo": {
        const r = t.value.split(",").map((n) => Number.parseInt(n, 10));
        t.value = {
          leftChannel: r[0],
          rightChannel: r[1]
        };
        break;
      }
      case "gapless":
      case "compilation":
      case "podcast":
      case "showMovement":
        t.value = t.value === "1" || t.value === 1;
        break;
      case "isrc": {
        const r = this.common[t.id];
        if (r && r.indexOf(t.value) !== -1)
          return;
        break;
      }
      case "comment":
        typeof t.value == "string" && (t.value = { text: t.value }), t.value.descriptor === "iTunPGAP" && this.setGenericTag(e, { id: "gapless", value: t.value.text === "1" });
        break;
      case "lyrics":
        typeof t.value == "string" && (t.value = _r(t.value));
        break;
    }
    t.value !== null && this.setGenericTag(e, t);
  }
  /**
   * Convert native tags to common tags
   * @returns {IAudioMetadata} Native + common tags
   */
  toCommonMetadata() {
    return {
      format: this.format,
      native: this.native,
      quality: this.quality,
      common: this.common
    };
  }
  /**
   * Fix some common issues with picture object
   * @param picture Picture
   */
  async postFixPicture(e) {
    if (e.data && e.data.length > 0) {
      if (!e.format) {
        const t = await dt(Uint8Array.from(e.data));
        if (t)
          e.format = t.mime;
        else
          return null;
      }
      switch (e.format = e.format.toLocaleLowerCase(), e.format) {
        case "image/jpg":
          e.format = "image/jpeg";
      }
      return e;
    }
    return this.addWarning("Empty picture tag found"), null;
  }
  /**
   * Convert native tag to common tags
   */
  async toCommon(e, t, r) {
    const n = { id: t, value: r }, a = this.tagMapper.mapTag(e, n, this);
    a && await this.postMap(e, a);
  }
  /**
   * Set generic tag
   */
  setGenericTag(e, t) {
    var a;
    F(`common.${t.id} = ${t.value}`);
    const r = this.commonOrigin[t.id] || 1e3, n = this.originPriority[e];
    if (lr(t.id))
      if (n <= r)
        this.common[t.id] = t.value, this.commonOrigin[t.id] = n;
      else
        return F(`Ignore native tag (singleton): ${e}.${t.id} = ${t.value}`);
    else if (n === r)
      !ur(t.id) || this.common[t.id].indexOf(t.value) === -1 ? this.common[t.id].push(t.value) : F(`Ignore duplicate value: ${e}.${t.id} = ${t.value}`);
    else if (n < r)
      this.common[t.id] = [t.value], this.commonOrigin[t.id] = n;
    else
      return F(`Ignore native tag (list): ${e}.${t.id} = ${t.value}`);
    (a = this.opts) != null && a.observer && this.opts.observer({ metadata: this, tag: { type: "common", id: t.id, value: t.value } });
  }
}
function Br(i) {
  return i.length > 2 ? `${i.slice(0, i.length - 1).join(", ")} & ${i[i.length - 1]}` : i.join(" & ");
}
const Fr = {
  parserType: "mpeg",
  extensions: [".mp2", ".mp3", ".m2a", ".aac", "aacp"],
  async load(i, e, t) {
    return new (await import("./MpegParser-C3T_tUQL.js")).MpegParser(i, e, t);
  }
}, Dr = {
  parserType: "apev2",
  extensions: [".ape"],
  async load(i, e, t) {
    return new (await Promise.resolve().then(() => Zr)).APEv2Parser(i, e, t);
  }
}, Or = {
  parserType: "asf",
  extensions: [".asf"],
  async load(i, e, t) {
    return new (await import("./AsfParser-BOal4w1I.js")).AsfParser(i, e, t);
  }
}, Pr = {
  parserType: "dsdiff",
  extensions: [".dff"],
  async load(i, e, t) {
    return new (await import("./DsdiffParser-BegJ-oag.js")).DsdiffParser(i, e, t);
  }
}, Lr = {
  parserType: "aiff",
  extensions: [".aif", "aiff", "aifc"],
  async load(i, e, t) {
    return new (await import("./AiffParser-BkQkq6Tc.js")).AIFFParser(i, e, t);
  }
}, Nr = {
  parserType: "dsf",
  extensions: [".dsf"],
  async load(i, e, t) {
    return new (await import("./DsfParser-CsVTMkEN.js")).DsfParser(i, e, t);
  }
}, zr = {
  parserType: "flac",
  extensions: [".flac"],
  async load(i, e, t) {
    return new (await import("./FlacParser-D17YE08n.js")).FlacParser(i, e, t);
  }
}, Ur = {
  parserType: "matroska",
  extensions: [".mka", ".mkv", ".mk3d", ".mks", "webm"],
  async load(i, e, t) {
    return new (await import("./MatroskaParser-BcLMTYAi.js")).MatroskaParser(i, e, t);
  }
}, Xr = {
  parserType: "mp4",
  extensions: [".mp4", ".m4a", ".m4b", ".m4pa", "m4v", "m4r", "3gp"],
  async load(i, e, t) {
    return new (await import("./MP4Parser-CLzyxokt.js")).MP4Parser(i, e, t);
  }
}, Gr = {
  parserType: "musepack",
  extensions: [".mpc"],
  async load(i, e, t) {
    return new (await import("./MusepackParser-DIF2WUTa.js")).MusepackParser(i, e, t);
  }
}, jr = {
  parserType: "ogg",
  extensions: [".ogg", ".ogv", ".oga", ".ogm", ".ogx", ".opus", ".spx"],
  async load(i, e, t) {
    return new (await import("./OggParser-DKKxowje.js")).OggParser(i, e, t);
  }
}, Wr = {
  parserType: "wavpack",
  extensions: [".wv", ".wvp"],
  async load(i, e, t) {
    return new (await import("./WavPackParser-BI4KqIDx.js")).WavPackParser(i, e, t);
  }
}, qr = {
  parserType: "riff",
  extensions: [".wav", "wave", ".bwf"],
  async load(i, e, t) {
    return new (await import("./WaveParser-CsibUipQ.js")).WaveParser(i, e, t);
  }
}, O = q("music-metadata:parser:factory");
function $r(i) {
  const e = Ce.parse(i), t = Hi(e.type);
  return {
    type: t.type,
    subtype: t.subtype,
    suffix: t.suffix,
    parameters: e.parameters
  };
}
class Hr {
  constructor() {
    this.parsers = [], [
      zr,
      Fr,
      Dr,
      Xr,
      Ur,
      qr,
      jr,
      Or,
      Lr,
      Wr,
      Gr,
      Nr,
      Pr
    ].forEach((e) => this.registerParser(e));
  }
  registerParser(e) {
    this.parsers.push(e);
  }
  async parse(e, t, r) {
    if (e.supportsRandomAccess() ? (O("tokenizer supports random-access, scanning for appending headers"), await rn(e, r)) : O("tokenizer does not support random-access, cannot scan for appending headers"), !t) {
      const s = new Uint8Array(4100);
      if (e.fileInfo.mimeType && (t = this.findLoaderForType($e(e.fileInfo.mimeType))), !t && e.fileInfo.path && (t = this.findLoaderForExtension(e.fileInfo.path)), !t) {
        O("Guess parser on content..."), await e.peekBuffer(s, { mayBeLess: !0 });
        const o = await dt(s);
        if (!o || !o.mime)
          throw new Ki("Failed to determine audio format");
        if (O(`Guessed file type is mime=${o.mime}, extension=${o.ext}`), t = this.findLoaderForType($e(o.mime)), !t)
          throw new Zi(`Guessed MIME-type not supported: ${o.mime}`);
      }
    }
    O(`Loading ${t.parserType} parser...`);
    const n = new Mr(r), a = await t.load(n, e, r ?? {});
    return O(`Parser ${t.parserType} loaded`), await a.parse(), n.toCommonMetadata();
  }
  /**
   * @param filePath - Path, filename or extension to audio file
   * @return Parser submodule name
   */
  findLoaderForExtension(e) {
    if (!e)
      return;
    const t = Vr(e).toLocaleLowerCase() || e;
    return this.parsers.find((r) => r.extensions.indexOf(t) !== -1);
  }
  findLoaderForType(e) {
    return e ? this.parsers.find((t) => t.parserType === e) : void 0;
  }
}
function Vr(i) {
  const e = i.lastIndexOf(".");
  return e === -1 ? "" : i.slice(e);
}
function $e(i) {
  let e;
  if (!i)
    return;
  try {
    e = $r(i);
  } catch {
    O(`Invalid HTTP Content-Type header value: ${i}`);
    return;
  }
  const t = e.subtype.indexOf("x-") === 0 ? e.subtype.substring(2) : e.subtype;
  switch (e.type) {
    case "audio":
      switch (t) {
        case "mp3":
        case "mpeg":
          return "mpeg";
        case "aac":
        case "aacp":
          return "mpeg";
        case "flac":
          return "flac";
        case "ape":
        case "monkeys-audio":
          return "apev2";
        case "mp4":
        case "m4a":
          return "mp4";
        case "ogg":
        case "opus":
        case "speex":
          return "ogg";
        case "ms-wma":
        case "ms-wmv":
        case "ms-asf":
          return "asf";
        case "aiff":
        case "aif":
        case "aifc":
          return "aiff";
        case "vnd.wave":
        case "wav":
        case "wave":
          return "riff";
        case "wavpack":
          return "wavpack";
        case "musepack":
          return "musepack";
        case "matroska":
        case "webm":
          return "matroska";
        case "dsf":
          return "dsf";
        case "amr":
          return "amr";
      }
      break;
    case "video":
      switch (t) {
        case "ms-asf":
        case "ms-wmv":
          return "asf";
        case "m4v":
        case "mp4":
          return "mp4";
        case "ogg":
          return "ogg";
        case "matroska":
        case "webm":
          return "matroska";
      }
      break;
    case "application":
      switch (t) {
        case "vnd.ms-asf":
          return "asf";
        case "ogg":
          return "ogg";
      }
      break;
  }
}
class bt {
  /**
   * Initialize parser with output (metadata), input (tokenizer) & parsing options (options).
   * @param {INativeMetadataCollector} metadata Output
   * @param {ITokenizer} tokenizer Input
   * @param {IOptions} options Parsing options
   */
  constructor(e, t, r) {
    this.metadata = e, this.tokenizer = t, this.options = r;
  }
}
const Yr = /^[\x21-\x7e©][\x20-\x7e\x00()]{3}/, Tt = {
  len: 4,
  get: (i, e) => {
    const t = mt(i.slice(e, e + Tt.len), "latin1");
    if (!t.match(Yr))
      throw new Ae(`FourCC contains invalid characters: ${ir(t)} "${t}"`);
    return t;
  },
  put: (i, e, t) => {
    const r = _i(t);
    if (r.length !== 4)
      throw new gt("Invalid length");
    return i.set(r, e), e + 4;
  }
};
var U;
(function(i) {
  i[i.text_utf8 = 0] = "text_utf8", i[i.binary = 1] = "binary", i[i.external_info = 2] = "external_info", i[i.reserved = 3] = "reserved";
})(U || (U = {}));
const He = {
  len: 52,
  get: (i, e) => ({
    // should equal 'MAC '
    ID: Tt.get(i, e),
    // versionIndex number * 1000 (3.81 = 3810) (remember that 4-byte alignment causes this to take 4-bytes)
    version: T.get(i, e + 4) / 1e3,
    // the number of descriptor bytes (allows later expansion of this header)
    descriptorBytes: T.get(i, e + 8),
    // the number of header APE_HEADER bytes
    headerBytes: T.get(i, e + 12),
    // the number of header APE_HEADER bytes
    seekTableBytes: T.get(i, e + 16),
    // the number of header data bytes (from original file)
    headerDataBytes: T.get(i, e + 20),
    // the number of bytes of APE frame data
    apeFrameDataBytes: T.get(i, e + 24),
    // the high order number of APE frame data bytes
    apeFrameDataBytesHigh: T.get(i, e + 28),
    // the terminating data of the file (not including tag data)
    terminatingDataBytes: T.get(i, e + 32),
    // the MD5 hash of the file (see notes for usage... it's a little tricky)
    fileMD5: new ct(16).get(i, e + 36)
  })
}, Kr = {
  len: 24,
  get: (i, e) => ({
    // the compression level (see defines I.E. COMPRESSION_LEVEL_FAST)
    compressionLevel: R.get(i, e),
    // any format flags (for future use)
    formatFlags: R.get(i, e + 2),
    // the number of audio blocks in one frame
    blocksPerFrame: T.get(i, e + 4),
    // the number of audio blocks in the final frame
    finalFrameBlocks: T.get(i, e + 8),
    // the total number of frames
    totalFrames: T.get(i, e + 12),
    // the bits per sample (typically 16)
    bitsPerSample: R.get(i, e + 16),
    // the number of channels (1 or 2)
    channel: R.get(i, e + 18),
    // the sample rate (typically 44100)
    sampleRate: T.get(i, e + 20)
  })
}, S = {
  len: 32,
  get: (i, e) => ({
    // should equal 'APETAGEX'
    ID: new y(8, "ascii").get(i, e),
    // equals CURRENT_APE_TAG_VERSION
    version: T.get(i, e + 8),
    // the complete size of the tag, including this footer (excludes header)
    size: T.get(i, e + 12),
    // the number of fields in the tag
    fields: T.get(i, e + 16),
    // reserved for later use (must be zero),
    flags: yt(T.get(i, e + 20))
  })
}, ge = {
  len: 8,
  get: (i, e) => ({
    // Length of assigned value in bytes
    size: T.get(i, e),
    // reserved for later use (must be zero),
    flags: yt(T.get(i, e + 4))
  })
};
function yt(i) {
  return {
    containsHeader: te(i, 31),
    containsFooter: te(i, 30),
    isHeader: te(i, 29),
    readOnly: te(i, 0),
    dataType: (i & 6) >> 1
  };
}
function te(i, e) {
  return (i & 1 << e) !== 0;
}
const D = q("music-metadata:parser:APEv2"), Ve = "APEv2", Ye = "APETAGEX";
class ne extends Qi("APEv2") {
}
class M extends bt {
  constructor() {
    super(...arguments), this.ape = {};
  }
  static tryParseApeHeader(e, t, r) {
    return new M(e, t, r).tryParseApeHeader();
  }
  /**
   * Calculate the media file duration
   * @param ah ApeHeader
   * @return {number} duration in seconds
   */
  static calculateDuration(e) {
    let t = e.totalFrames > 1 ? e.blocksPerFrame * (e.totalFrames - 1) : 0;
    return t += e.finalFrameBlocks, t / e.sampleRate;
  }
  /**
   * Calculates the APEv1 / APEv2 first field offset
   * @param tokenizer
   * @param offset
   */
  static async findApeFooterOffset(e, t) {
    const r = new Uint8Array(S.len), n = e.position;
    await e.readBuffer(r, { position: t - S.len }), e.setPosition(n);
    const a = S.get(r, 0);
    if (a.ID === "APETAGEX")
      return a.flags.isHeader ? D(`APE Header found at offset=${t - S.len}`) : (D(`APE Footer found at offset=${t - S.len}`), t -= a.size), { footer: a, offset: t };
  }
  static parseTagFooter(e, t, r) {
    const n = S.get(t, t.length - S.len);
    if (n.ID !== Ye)
      throw new ne("Unexpected APEv2 Footer ID preamble value");
    return Fe(t), new M(e, Fe(t), r).parseTags(n);
  }
  /**
   * Parse APEv1 / APEv2 header if header signature found
   */
  async tryParseApeHeader() {
    if (this.tokenizer.fileInfo.size && this.tokenizer.fileInfo.size - this.tokenizer.position < S.len) {
      D("No APEv2 header found, end-of-file reached");
      return;
    }
    const e = await this.tokenizer.peekToken(S);
    if (e.ID === Ye)
      return await this.tokenizer.ignore(S.len), this.parseTags(e);
    if (D(`APEv2 header not found at offset=${this.tokenizer.position}`), this.tokenizer.fileInfo.size) {
      const t = this.tokenizer.fileInfo.size - this.tokenizer.position, r = new Uint8Array(t);
      return await this.tokenizer.readBuffer(r), M.parseTagFooter(this.metadata, r, this.options);
    }
  }
  async parse() {
    const e = await this.tokenizer.readToken(He);
    if (e.ID !== "MAC ")
      throw new ne("Unexpected descriptor ID");
    this.ape.descriptor = e;
    const t = e.descriptorBytes - He.len, r = await (t > 0 ? this.parseDescriptorExpansion(t) : this.parseHeader());
    return await this.tokenizer.ignore(r.forwardBytes), this.tryParseApeHeader();
  }
  async parseTags(e) {
    const t = new Uint8Array(256);
    let r = e.size - S.len;
    D(`Parse APE tags at offset=${this.tokenizer.position}, size=${r}`);
    for (let n = 0; n < e.fields; n++) {
      if (r < ge.len) {
        this.metadata.addWarning(`APEv2 Tag-header: ${e.fields - n} items remaining, but no more tag data to read.`);
        break;
      }
      const a = await this.tokenizer.readToken(ge);
      r -= ge.len + a.size, await this.tokenizer.peekBuffer(t, { length: Math.min(t.length, r) });
      let s = je(t, 0, t.length);
      const o = await this.tokenizer.readToken(new y(s, "ascii"));
      switch (await this.tokenizer.ignore(1), r -= o.length + 1, a.flags.dataType) {
        case U.text_utf8: {
          const p = (await this.tokenizer.readToken(new y(a.size, "utf8"))).split(/\x00/g);
          await Promise.all(p.map((m) => this.metadata.addTag(Ve, o, m)));
          break;
        }
        case U.binary:
          if (this.options.skipCovers)
            await this.tokenizer.ignore(a.size);
          else {
            const c = new Uint8Array(a.size);
            await this.tokenizer.readBuffer(c), s = je(c, 0, c.length);
            const p = mt(c.slice(0, s)), m = c.slice(s + 1);
            await this.metadata.addTag(Ve, o, {
              description: p,
              data: m
            });
          }
          break;
        case U.external_info:
          D(`Ignore external info ${o}`), await this.tokenizer.ignore(a.size);
          break;
        case U.reserved:
          D(`Ignore external info ${o}`), this.metadata.addWarning(`APEv2 header declares a reserved datatype for "${o}"`), await this.tokenizer.ignore(a.size);
          break;
      }
    }
  }
  async parseDescriptorExpansion(e) {
    return await this.tokenizer.ignore(e), this.parseHeader();
  }
  async parseHeader() {
    const e = await this.tokenizer.readToken(Kr);
    if (this.metadata.setFormat("lossless", !0), this.metadata.setFormat("container", "Monkey's Audio"), this.metadata.setFormat("bitsPerSample", e.bitsPerSample), this.metadata.setFormat("sampleRate", e.sampleRate), this.metadata.setFormat("numberOfChannels", e.channel), this.metadata.setFormat("duration", M.calculateDuration(e)), !this.ape.descriptor)
      throw new ne("Missing APE descriptor");
    return {
      forwardBytes: this.ape.descriptor.seekTableBytes + this.ape.descriptor.headerDataBytes + this.ape.descriptor.apeFrameDataBytes + this.ape.descriptor.terminatingDataBytes
    };
  }
}
const Zr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  APEv2Parser: M,
  ApeContentError: ne
}, Symbol.toStringTag, { value: "Module" })), ie = q("music-metadata:parser:ID3v1"), Ke = [
  "Blues",
  "Classic Rock",
  "Country",
  "Dance",
  "Disco",
  "Funk",
  "Grunge",
  "Hip-Hop",
  "Jazz",
  "Metal",
  "New Age",
  "Oldies",
  "Other",
  "Pop",
  "R&B",
  "Rap",
  "Reggae",
  "Rock",
  "Techno",
  "Industrial",
  "Alternative",
  "Ska",
  "Death Metal",
  "Pranks",
  "Soundtrack",
  "Euro-Techno",
  "Ambient",
  "Trip-Hop",
  "Vocal",
  "Jazz+Funk",
  "Fusion",
  "Trance",
  "Classical",
  "Instrumental",
  "Acid",
  "House",
  "Game",
  "Sound Clip",
  "Gospel",
  "Noise",
  "Alt. Rock",
  "Bass",
  "Soul",
  "Punk",
  "Space",
  "Meditative",
  "Instrumental Pop",
  "Instrumental Rock",
  "Ethnic",
  "Gothic",
  "Darkwave",
  "Techno-Industrial",
  "Electronic",
  "Pop-Folk",
  "Eurodance",
  "Dream",
  "Southern Rock",
  "Comedy",
  "Cult",
  "Gangsta Rap",
  "Top 40",
  "Christian Rap",
  "Pop/Funk",
  "Jungle",
  "Native American",
  "Cabaret",
  "New Wave",
  "Psychedelic",
  "Rave",
  "Showtunes",
  "Trailer",
  "Lo-Fi",
  "Tribal",
  "Acid Punk",
  "Acid Jazz",
  "Polka",
  "Retro",
  "Musical",
  "Rock & Roll",
  "Hard Rock",
  "Folk",
  "Folk/Rock",
  "National Folk",
  "Swing",
  "Fast-Fusion",
  "Bebob",
  "Latin",
  "Revival",
  "Celtic",
  "Bluegrass",
  "Avantgarde",
  "Gothic Rock",
  "Progressive Rock",
  "Psychedelic Rock",
  "Symphonic Rock",
  "Slow Rock",
  "Big Band",
  "Chorus",
  "Easy Listening",
  "Acoustic",
  "Humour",
  "Speech",
  "Chanson",
  "Opera",
  "Chamber Music",
  "Sonata",
  "Symphony",
  "Booty Bass",
  "Primus",
  "Porn Groove",
  "Satire",
  "Slow Jam",
  "Club",
  "Tango",
  "Samba",
  "Folklore",
  "Ballad",
  "Power Ballad",
  "Rhythmic Soul",
  "Freestyle",
  "Duet",
  "Punk Rock",
  "Drum Solo",
  "A Cappella",
  "Euro-House",
  "Dance Hall",
  "Goa",
  "Drum & Bass",
  "Club-House",
  "Hardcore",
  "Terror",
  "Indie",
  "BritPop",
  "Negerpunk",
  "Polsk Punk",
  "Beat",
  "Christian Gangsta Rap",
  "Heavy Metal",
  "Black Metal",
  "Crossover",
  "Contemporary Christian",
  "Christian Rock",
  "Merengue",
  "Salsa",
  "Thrash Metal",
  "Anime",
  "JPop",
  "Synthpop",
  "Abstract",
  "Art Rock",
  "Baroque",
  "Bhangra",
  "Big Beat",
  "Breakbeat",
  "Chillout",
  "Downtempo",
  "Dub",
  "EBM",
  "Eclectic",
  "Electro",
  "Electroclash",
  "Emo",
  "Experimental",
  "Garage",
  "Global",
  "IDM",
  "Illbient",
  "Industro-Goth",
  "Jam Band",
  "Krautrock",
  "Leftfield",
  "Lounge",
  "Math Rock",
  "New Romantic",
  "Nu-Breakz",
  "Post-Punk",
  "Post-Rock",
  "Psytrance",
  "Shoegaze",
  "Space Rock",
  "Trop Rock",
  "World Music",
  "Neoclassical",
  "Audiobook",
  "Audio Theatre",
  "Neue Deutsche Welle",
  "Podcast",
  "Indie Rock",
  "G-Funk",
  "Dubstep",
  "Garage Rock",
  "Psybient"
], re = {
  len: 128,
  /**
   * @param buf Buffer possibly holding the 128 bytes ID3v1.1 metadata header
   * @param off Offset in buffer in bytes
   * @returns ID3v1.1 header if first 3 bytes equals 'TAG', otherwise null is returned
   */
  get: (i, e) => {
    const t = new z(3).get(i, e);
    return t === "TAG" ? {
      header: t,
      title: new z(30).get(i, e + 3),
      artist: new z(30).get(i, e + 33),
      album: new z(30).get(i, e + 63),
      year: new z(4).get(i, e + 93),
      comment: new z(28).get(i, e + 97),
      // ID3v1.1 separator for track
      zeroByte: L.get(i, e + 127),
      // track: ID3v1.1 field added by Michael Mutschler
      track: L.get(i, e + 126),
      genre: L.get(i, e + 127)
    } : null;
  }
};
class z {
  constructor(e) {
    this.len = e, this.stringType = new y(e, "latin1");
  }
  get(e, t) {
    let r = this.stringType.get(e, t);
    return r = er(r), r = r.trim(), r.length > 0 ? r : void 0;
  }
}
class kt extends bt {
  constructor(e, t, r) {
    super(e, t, r), this.apeHeader = r.apeHeader;
  }
  static getGenre(e) {
    if (e < Ke.length)
      return Ke[e];
  }
  async parse() {
    if (!this.tokenizer.fileInfo.size) {
      ie("Skip checking for ID3v1 because the file-size is unknown");
      return;
    }
    this.apeHeader && (this.tokenizer.ignore(this.apeHeader.offset - this.tokenizer.position), await new M(this.metadata, this.tokenizer, this.options).parseTags(this.apeHeader.footer));
    const e = this.tokenizer.fileInfo.size - re.len;
    if (this.tokenizer.position > e) {
      ie("Already consumed the last 128 bytes");
      return;
    }
    const t = await this.tokenizer.readToken(re, e);
    if (t) {
      ie("ID3v1 header found at: pos=%s", this.tokenizer.fileInfo.size - re.len);
      const r = ["title", "artist", "album", "comment", "track", "year"];
      for (const a of r)
        t[a] && t[a] !== "" && await this.addTag(a, t[a]);
      const n = kt.getGenre(t.genre);
      n && await this.addTag("genre", n);
    } else
      ie("ID3v1 header not found at: pos=%s", this.tokenizer.fileInfo.size - re.len);
  }
  async addTag(e, t) {
    await this.metadata.addTag("ID3v1", e, t);
  }
}
async function Jr(i) {
  if (i.fileInfo.size >= 128) {
    const e = new Uint8Array(3), t = i.position;
    return await i.readBuffer(e, { position: i.fileInfo.size - 128 }), i.setPosition(t), new TextDecoder("latin1").decode(e) === "TAG";
  }
  return !1;
}
const Qr = "LYRICS200";
async function en(i) {
  const e = i.fileInfo.size;
  if (e >= 143) {
    const t = new Uint8Array(15), r = i.position;
    await i.readBuffer(t, { position: e - 143 }), i.setPosition(r);
    const n = new TextDecoder("latin1").decode(t);
    if (n.slice(6) === Qr)
      return Number.parseInt(n.slice(0, 6), 10) + 15;
  }
  return 0;
}
function tn(i) {
  return i ? i.reduce((e, t) => t.name && t.name.toLowerCase() in ["front", "cover", "cover (front)"] ? t : e) : null;
}
async function rn(i, e = {}) {
  let t = i.fileInfo.size;
  if (await Jr(i)) {
    t -= 128;
    const r = await en(i);
    t -= r;
  }
  e.apeHeader = await M.findApeFooterOffset(i, t);
}
const Ze = q("music-metadata:parser");
async function nn(i, e = {}) {
  Ze(`parseFile: ${i}`);
  const t = await Pt(i), r = new Hr();
  try {
    const n = r.findLoaderForExtension(i);
    return n || Ze(" Parser could not be determined by file extension"), await r.parse(t, n, e);
  } finally {
    await t.close();
  }
}
function It(i) {
  try {
    const e = new de("utf-8", { fatal: !0 }).decode(i);
    if (!e.includes("�")) return e;
  } catch {
  }
  try {
    return new de("gbk").decode(i);
  } catch {
  }
  return new de("utf-8", { fatal: !1 }).decode(i);
}
const an = /* @__PURE__ */ new Set([".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"]), sn = /* @__PURE__ */ new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"]), on = ["cover", "folder", "album", "front", "artwork", "albumart", ".folder"], cn = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".lrc": "text/plain; charset=utf-8"
};
Qe.registerSchemesAsPrivileged([
  { scheme: "local-file", privileges: { bypassCSP: !0, supportFetchAPI: !0 } }
]);
function C(i) {
  return Rt(g.resolve(i)).href.replace(/^file:\/\//, "local-file://");
}
function V(i) {
  const e = g.dirname(i), t = g.basename(i, g.extname(i)), r = g.join(e, `${t}.lrc`);
  try {
    if (b.existsSync(r)) return r;
  } catch (n) {
    console.error("findLrcForFile error:", n);
  }
  return null;
}
function ln(i) {
  const e = g.dirname(i), t = g.basename(i, g.extname(i)), r = g.join(e, `${t}.cue`);
  try {
    if (b.existsSync(r)) return r;
  } catch (n) {
    console.error("findCueForFile error:", n);
  }
  return null;
}
function un(i) {
  const e = String(i).trim().split(":");
  if (e.length < 3) return 0;
  const t = parseInt(e[0], 10) || 0, r = parseInt(e[1], 10) || 0, n = parseInt(e[2], 10) || 0;
  return t * 60 + r + n / 75;
}
function mn(i) {
  try {
    const e = b.readFileSync(i), r = It(e).split(/\r?\n/), n = [];
    let a = null, s = "", o = "", c = !1;
    for (const p of r) {
      const m = p.trim();
      if (!m) continue;
      const u = m.match(/^(\w+)\s+(.+)$/);
      if (!u) continue;
      const [, l, f] = u, h = l.toUpperCase();
      if (h === "FILE") {
        if (c) {
          a && n.push(a);
          break;
        }
        c = !0;
      } else if (h === "TRACK" && c) {
        a && n.push(a);
        const x = parseInt(f.split(/\s+/)[0], 10);
        a = {
          number: x,
          title: o || `曲目 ${x}`,
          performer: s,
          start: 0
        };
      } else if (h === "TITLE") {
        const x = f.match(/^"([^"]*)"$/), w = x ? x[1] : f.replace(/^"|"$/g, "");
        a ? a.title = w : o = w;
      } else if (h === "PERFORMER") {
        const x = f.match(/^"([^"]*)"$/), w = x ? x[1] : f.replace(/^"|"$/g, "");
        a ? a.performer = w : s = w;
      } else if (h === "INDEX" && a) {
        const x = f.split(/\s+/);
        x[0] === "01" && x[1] && (a.start = un(x[1]), n.push(a), a = null);
      }
    }
    a && n.push(a);
    for (let p = 0; p < n.length; p++)
      n[p].end = p < n.length - 1 ? n[p + 1].start : 1 / 0;
    return n;
  } catch (e) {
    return console.error("parseCueFile error:", e), [];
  }
}
function Re(i) {
  try {
    const t = b.readdirSync(i, { withFileTypes: !0 }).filter((r) => r.isFile() && sn.has(g.extname(r.name).toLowerCase())).map((r) => ({ name: r.name, path: g.join(i, r.name) }));
    for (const r of on) {
      const n = r.toLowerCase(), a = t.find((s) => {
        const o = g.basename(s.name, g.extname(s.name)).toLowerCase();
        return o === n || o === n.replace(/^\./, "");
      });
      if (a) return a.path;
    }
    if (t.length > 0) return t[0].path;
  } catch (e) {
    console.error("findCoverInDir error:", e);
  }
  return null;
}
function Me(i) {
  const e = [];
  try {
    const t = b.readdirSync(i, { withFileTypes: !0 });
    for (const r of t) {
      const n = g.join(i, r.name);
      r.isDirectory() ? e.push(...Me(n)) : r.isFile() && an.has(g.extname(r.name).toLowerCase()) && e.push(n);
    }
  } catch (t) {
    console.error("scanDirForAudio error:", t);
  }
  return e.sort(
    (t, r) => g.basename(t).localeCompare(g.basename(r), void 0, { numeric: !0 })
  );
}
const vt = g.dirname(X(import.meta.url));
process.env.APP_ROOT = g.join(vt, "../..");
const ve = g.join(W.getPath("userData"), "config.json");
function pe() {
  try {
    const i = b.readFileSync(ve, "utf-8");
    return JSON.parse(i);
  } catch {
    return {};
  }
}
function pn(i) {
  try {
    b.mkdirSync(g.dirname(ve), { recursive: !0 }), b.writeFileSync(ve, JSON.stringify(i, null, 2));
  } catch (e) {
    console.error("saveConfig error:", e);
  }
}
const fn = g.join(process.env.APP_ROOT, "dist"), Je = process.env.VITE_DEV_SERVER_URL;
let _ = null;
async function St() {
  _ = new le({
    width: 900,
    height: 520,
    minWidth: 640,
    minHeight: 400,
    title: "Audio Player",
    webPreferences: {
      preload: g.join(vt, "../preload/index.mjs"),
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), Je ? await _.loadURL(Je) : await _.loadFile(g.join(fn, "index.html")), _.on("closed", () => {
    _ = null;
  });
}
E.handle("open-audio-file", async () => {
  const i = await ce.showOpenDialog(_, {
    properties: ["openFile"],
    filters: [
      { name: "音频文件", extensions: ["mp3", "wav", "ogg", "m4a", "flac", "aac"] },
      { name: "所有文件", extensions: ["*"] }
    ]
  });
  if (!i.canceled && i.filePaths.length > 0) {
    const e = i.filePaths[0], t = g.dirname(e), r = Re(t), n = V(e);
    return {
      url: C(e),
      coverUrl: r ? C(r) : null,
      lrcUrl: n ? C(n) : null
    };
  }
  return null;
});
E.handle("open-lrc-file", async () => {
  const i = _ ?? le.getFocusedWindow(), e = await ce.showOpenDialog(i, {
    properties: ["openFile"],
    filters: [{ name: "LRC 歌词", extensions: ["lrc"] }]
  });
  return !e.canceled && e.filePaths.length > 0 ? C(e.filePaths[0]) : null;
});
E.handle("open-audio-folder", async () => {
  const i = await ce.showOpenDialog(_, {
    properties: ["openDirectory"]
  });
  if (!i.canceled && i.filePaths.length > 0) {
    const e = i.filePaths[0], t = Me(e), r = Re(e), n = t.map((a) => {
      const s = V(a);
      return s ? C(s) : null;
    });
    return {
      urls: t.map((a) => C(a)),
      coverUrl: r ? C(r) : null,
      lrcUrls: n
    };
  }
  return null;
});
E.handle("get-cue-tracks", async (i, e) => {
  try {
    const t = X(e.replace(/^local-file:/, "file:")), r = ln(t);
    return r ? mn(r) : [];
  } catch (t) {
    return console.error("get-cue-tracks error:", t), [];
  }
});
E.handle("get-audio-metadata", async (i, e) => {
  var t, r;
  try {
    const n = X(e.replace(/^local-file:/, "file:"));
    if (!b.existsSync(n)) return null;
    const s = (await nn(n)).common || {}, o = tn(s.picture) || ((t = s.picture) == null ? void 0 : t[0]);
    let c = null;
    if (o != null && o.data) {
      const p = Buffer.from(o.data).toString("base64");
      c = `data:${o.format || "image/jpeg"};base64,${p}`;
    }
    return {
      title: s.title,
      artist: s.artist,
      album: s.album,
      year: s.year,
      genre: (r = s.genre) == null ? void 0 : r[0],
      picture: c
    };
  } catch (n) {
    return console.error("get-audio-metadata error:", n), null;
  }
});
E.handle("get-favorites-folder", async () => pe().favoritesFolder || null);
E.handle("set-favorites-folder", async () => {
  const i = _ ?? le.getFocusedWindow(), e = await ce.showOpenDialog(i, {
    properties: ["openDirectory", "createDirectory"],
    title: "选择收藏文件夹"
  });
  if (!e.canceled && e.filePaths.length > 0) {
    const t = e.filePaths[0], r = pe();
    return r.favoritesFolder = t, pn(r), t;
  }
  return null;
});
E.handle("add-to-favorites", async (i, e) => {
  const r = pe().favoritesFolder;
  if (!r || !b.existsSync(r))
    return { ok: !1, error: "请先设置收藏文件夹" };
  try {
    const n = X(e.replace(/^local-file:/, "file:"));
    if (!b.existsSync(n)) return { ok: !1, error: "文件不存在" };
    const a = g.basename(n);
    let s = g.join(r, a), o = 1;
    for (; b.existsSync(s); ) {
      const p = g.extname(a), m = g.basename(a, p);
      s = g.join(r, `${m}_${o}${p}`), o++;
    }
    b.copyFileSync(n, s);
    const c = V(n);
    if (c && b.existsSync(c)) {
      const p = g.basename(c), m = g.join(r, p);
      b.existsSync(m) || b.copyFileSync(c, m);
    }
    return { ok: !0, url: C(s) };
  } catch (n) {
    return console.error("add-to-favorites error:", n), { ok: !1, error: n.message };
  }
});
E.handle("get-favorites-list", async () => {
  const e = pe().favoritesFolder;
  if (!e || !b.existsSync(e)) return [];
  const t = Me(e), r = Re(e);
  return t.map((n) => {
    const a = V(n);
    return {
      url: C(n),
      name: g.basename(n),
      coverUrl: r ? C(r) : null,
      lrcUrl: a ? C(a) : null
    };
  });
});
E.handle("remove-from-favorites", async (i, e) => {
  try {
    const t = X(e.replace(/^local-file:/, "file:"));
    if (b.existsSync(t)) {
      b.unlinkSync(t);
      const r = V(t);
      r && b.existsSync(r) && b.unlinkSync(r);
    }
    return { ok: !0 };
  } catch (t) {
    return console.error("remove-from-favorites error:", t), { ok: !1, error: t.message };
  }
});
W.whenReady().then(async () => {
  Qe.handle("local-file", async (i) => {
    const e = i.url.replace(/^local-file:/, "file:"), t = X(e), r = g.extname(t).toLowerCase();
    if (r === ".lrc")
      try {
        const s = b.readFileSync(t), o = It(s);
        return new Response(o, {
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      } catch (s) {
        return console.error("read lrc error:", s), new Response("", { status: 500 });
      }
    const n = await _t.fetch(e), a = cn[r] || "application/octet-stream";
    return new Response(n.body, {
      status: n.status,
      headers: { "Content-Type": a }
    });
  }), await St();
});
W.on("window-all-closed", () => {
  process.platform !== "darwin" && W.quit();
});
W.on("activate", () => {
  le.getAllWindows().length === 0 && St();
});
export {
  We as A,
  bt as B,
  be as C,
  Cn as D,
  P as E,
  Tt as F,
  mt as G,
  Ke as H,
  ri as I,
  M as J,
  Bn as K,
  kt as L,
  er as M,
  nt as N,
  or as O,
  je as P,
  cr as Q,
  Dn as R,
  y as S,
  Te as T,
  ae as U,
  Fn as V,
  sr as W,
  j as a,
  L as b,
  ct as c,
  q as d,
  ye as e,
  T as f,
  wt as g,
  En as h,
  Mn as i,
  ot as j,
  R as k,
  G as l,
  Qi as m,
  ui as n,
  Fe as o,
  ci as p,
  oi as q,
  at as r,
  Rn as s,
  hi as t,
  An as u,
  fi as v,
  li as w,
  Ge as x,
  st as y,
  si as z
};
