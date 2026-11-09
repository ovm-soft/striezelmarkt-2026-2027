// Generates public/og-image.png (1200x630) with the days counter for TODAY (Europe/Warsaw)
// and stamps a cache-busting ?v=<date> on og:image in index.html. Runs before every build.
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

const START = "2026-11-25", END = "2026-12-24";
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw" }).format(new Date());
const utc = (iso) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d); };
const DAY = 86400000, t = utc(today);
const word = (n) => (n === 1 ? "dzień" : "dni");

let big, size, line;
if (t < utc(START)) { const n = (utc(START) - t) / DAY; big = String(n); size = 280; line = `${word(n)} do Striezelmarktu`; }
else if (t < utc(END)) { const n = (utc(END) - t) / DAY; big = String(n); size = 280; line = `${word(n)} do końca Striezelmarktu`; }
else if (t === utc(END)) { big = "Dziś"; size = 190; line = "ostatni dzień Striezelmarktu!"; }
else { big = "Do zobaczenia"; size = 110; line = "za rok!"; }

const tree = `<svg x="740" y="70" width="380" height="507" viewBox="0 0 60 80">
  <rect fill="#7a4a24" x="25.500" y="62" width="9" height="15"/>
  <polygon fill="#2e8b57" points="30,12 12,38 48,38"/><polygon fill="#2e8b57" points="30,24 8,54 52,54"/>
  <polygon fill="#2e8b57" points="30,36 4,70 56,70"/>
  <polygon fill="#fff" points="30,12 22,26 26,24 30,28 34,24 38,26"/><polygon fill="#fff" points="30,24 19,40 25,37 30,42 35,37 41,40"/>
  <polygon fill="#fff" points="30,36 14,58 22,54 30,60 38,54 46,58"/>
  <circle fill="#e63946" cx="22" cy="46" r="2.3"/><circle fill="#ffd24a" cx="38" cy="50" r="2.3"/><circle fill="#3a86ff" cx="30" cy="34" r="2.1"/>
  <circle fill="#ffd24a" cx="16" cy="62" r="2.3"/><circle fill="#e63946" cx="44" cy="63" r="2.3"/>
  <polygon fill="#ffd24a" points="30,2 32,8 38,8 33,12 35,18 30,14 25,18 27,12 22,8 28,8"/>
  <ellipse fill="#fff" cx="30" cy="77" rx="26" ry="3"/></svg>`;
const flakes = Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 197) % 1200}" cy="${(i * 113) % 630}" r="${2 + (i % 4)}" fill="#fff" opacity=".7"/>`).join("");
let badge = "", tx = 70;
try {
  const r = await fetch("https://tmaps.one/wp-content/uploads/2026/10/threads-logo-black-scaled.png");
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const png = await sharp(Buffer.from(await r.arrayBuffer())).resize(40, 40, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toBuffer();
  badge = `<circle cx="96" cy="58" r="28" fill="#fff"/><image x="76" y="38" width="40" height="40" href="data:image/png;base64,${png.toString("base64")}"/>`;
  tx = 140;
} catch (e) { console.warn("Threads icon unavailable, using text only:", e.message); }
const F = `font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-weight="700"`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00622e"/><stop offset="1" stop-color="#0b7a3d"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>${flakes}${tree}
  ${badge}<text x="${tx}" y="70" ${F} font-size="34" fill="#fff">@pl.guide<tspan font-size="27" dx="18" fill="#ffd24a" stroke="#b07a00" stroke-width="1" paint-order="stroke"> · nieoficjalna strona</tspan></text>
  <text x="70" y="135" ${F} font-size="28" fill="#fcf5d8" letter-spacing="2">592. DRESDNER STRIEZELMARKT · DREZNO</text>
  <text x="64" y="${190 + size * 0.75}" ${F} font-size="${size}" fill="#ffd24a" stroke="#b07a00" stroke-width="3">${big}</text>
  <text x="70" y="${190 + size * 0.75 + 80}" ${F} font-size="58" fill="#fff">${line}</text></svg>`;

await sharp(Buffer.from(svg)).png().toFile("public/og-image.png");
const html = readFileSync("index.html", "utf8").replace(/og-image\.png\?v=[^"]*/g, `og-image.png?v=${today}`);
writeFileSync("index.html", html);
console.log(`og-image for ${today}: ${big} / ${line}`);
