"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function sdRoundRect(u, v, cx, cy, hw, hh, r) {
  const qx = Math.abs(u - cx) - (hw - r);
  const qy = Math.abs(v - cy) - (hh - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

const BG = [35, 38, 44];
const BODY = [59, 64, 72];
const SCREEN = [199, 227, 192];
const KEY = [77, 84, 94];
const OP = [242, 139, 32];
const EQ = [47, 158, 107];

function sample(u, v) {
  if (sdRoundRect(u, v, 0.5, 0.5, 0.5, 0.5, 0.22) > 0) return null;
  let col = BG;
  if (sdRoundRect(u, v, 0.5, 0.5, 0.44, 0.44, 0.16) <= 0) col = BODY;
  if (sdRoundRect(u, v, 0.5, 0.30, 0.32, 0.115, 0.035) <= 0) col = SCREEN;
  const yRows = [0.55, 0.69, 0.82];
  const xCols = [0.24, 0.41, 0.59, 0.76];
  for (let r = 0; r < yRows.length; r++) {
    for (let c = 0; c < xCols.length; c++) {
      const d = Math.hypot(u - xCols[c], v - yRows[r]);
      if (d <= 0.058) {
        if (c === 3) col = r === 2 ? EQ : OP;
        else col = KEY;
      }
    }
  }
  return col;
}

function render(size) {
  const ss = 4;
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const u = (x + (sx + 0.5) / ss) / size;
          const v = (y + (sy + 0.5) / ss) / size;
          const c = sample(u, v);
          if (c) { r += c[0]; g += c[1]; b += c[2]; a += 1; }
        }
      }
      const n = ss * ss;
      const i = (y * size + x) * 4;
      if (a > 0) {
        buf[i] = Math.round(r / a);
        buf[i + 1] = Math.round(g / a);
        buf[i + 2] = Math.round(b / a);
        buf[i + 3] = Math.round((a / n) * 255);
      }
    }
  }
  return buf;
}

function main() {
  const out = path.join(__dirname, "..");
  [192, 512].forEach((size) => {
    const file = path.join(out, "icon-" + size + ".png");
    fs.writeFileSync(file, encodePng(size, size, render(size)));
    console.log("escrito " + file);
  });
}

main();
