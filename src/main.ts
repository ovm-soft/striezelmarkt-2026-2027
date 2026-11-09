import { EVENTS, END, START, GRID_START, KIND_LABEL, hoursFor, isPre } from "./data";
import { DAYS, IKZE_URL, LANGS, LANG_BTN, fill, tr, type Lang } from "./i18n";

const DAY = 86400000;
const utc = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d); };
const todayIso = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw" }).format(new Date());
const $ = (id: string) => document.getElementById(id)!;

function initialLang(): Lang {
  const q = new URLSearchParams(location.search).get("lang")?.toLowerCase().replace("cz", "cs") ?? null; // ?lang=cz also works
  let saved: string | null = null;
  try { saved = localStorage.getItem("lang"); } catch { /* storage blocked */ }
  const pick = [q, saved].find(l => l && (LANGS as string[]).includes(l));
  return (pick as Lang) ?? "pl";
}
let lang: Lang = initialLang();

const tree = `<svg class="tree" viewBox="0 0 60 80" aria-hidden="true">
  <polygon class="g" points="30,12 12,38 48,38"/><polygon class="g" points="30,24 8,54 52,54"/>
  <polygon class="g" points="30,36 4,70 56,70"/><rect class="t" x="26" y="68" width="8" height="8"/>
  <polygon class="s" points="30,12 22,26 26,24 30,28 34,24 38,26"/>
  <polygon class="s" points="30,24 19,40 25,37 30,42 35,37 41,40"/>
  <polygon class="s" points="30,36 14,58 22,54 30,60 38,54 46,58"/>
  <circle class="o o1" cx="22" cy="46" r="2.3"/><circle class="o o2" cx="38" cy="50" r="2.3"/>
  <circle class="o o3" cx="30" cy="34" r="2.1"/><circle class="o o2" cx="16" cy="62" r="2.3"/><circle class="o o1" cx="44" cy="63" r="2.3"/>
  <polygon class="star" points="30,2 32,8 38,8 33,12 35,18 30,14 25,18 27,12 22,8 28,8"/>
  <ellipse class="s" cx="30" cy="77" rx="26" ry="3"/></svg>`;

// days before the opening (21–24 Nov): the same tree, lights off
const preTree = tree.replace('class="tree"', 'class="tree dim"');

function renderHeader(today: string) {
  const t = utc(today), s = utc(START), e = utc(END), total = Math.round((e - s) / DAY) + 1;
  const fmt = new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  $("kicker").textContent = tr("kicker", lang);
  $("sub").textContent = `${fmt.format(s)} – ${fmt.format(e)}`;
  $("legend").textContent = tr("legend", lang);
  $("note").textContent = tr("note", lang);
  document.documentElement.lang = lang;
  $("facts-list").innerHTML = ["f_old", "f_huts", "f_records", "f_toffel", "f_wheel"].map(k => `<li>${tr(k, lang)}</li>`).join("") + `<li class="striezeln">${tr("f_striezeln", lang)}</li>`;
  ($("ad-ikze") as HTMLAnchorElement).href = IKZE_URL[lang];
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach(el => { el.textContent = tr(el.dataset.i18n!, lang); });
  if (t < s) {
    const n = Math.round((s - t) / DAY);
    const w = DAYS[lang][new Intl.PluralRules(lang).select(n)] ?? DAYS[lang].other;
    $("counter").innerHTML = `<span class="num">${n}</span><span class="lbl">${w} ${tr("toFair", lang)}</span>`;
  } else if (t <= e) {
    const n = Math.round((t - s) / DAY) + 1;
    $("counter").innerHTML = `<span class="lbl big">${tr("running", lang)}</span><span class="lbl">${tr("dayOf", lang).replace("{n}", String(n)).replace("{t}", String(total))}</span>`;
  } else $("counter").innerHTML = `<span class="lbl big">${tr("farewell", lang)}</span>`;
  $("langs").innerHTML = LANGS.map(l => `<button data-l="${l}" class="${l === lang ? "on" : ""}">${LANG_BTN[l]}</button>`).join("");
}

function renderGrid(today: string) {
  const t = utc(today);
  const mon = new Intl.DateTimeFormat(lang, { month: "short", timeZone: "UTC" });
  const wd = new Intl.DateTimeFormat(lang, { weekday: "short", timeZone: "UTC" });
  let html = "";
  for (let ms = utc(GRID_START); ms <= utc(END); ms += DAY) {
    const d = new Date(ms), iso = d.toISOString().slice(0, 10), ev = EVENTS[iso];
    const cls = ["day", ms < t ? "past" : "", ms === t ? "today" : "", ev ? "special " + ev.kind : "", isPre(iso) ? "pre" : ""].join(" ");
    html += `<button class="${cls}" data-iso="${iso}" ${ev ? "" : 'tabindex="-1"'} aria-label="${d.getUTCDate()} ${mon.format(d)}${ev ? ", " + fill(ev.title, lang) : ""}">
      <span class="date"><b>${d.getUTCDate()}</b> ${mon.format(d)} <i>${wd.format(d)}</i></span>
      <span class="glyph">${ev ? `<span class="icon">${ev.icon}</span>` : isPre(iso) ? preTree : tree}</span>
      <span class="hours">${fill(hoursFor(iso), lang)}</span></button>`;
  }
  $("grid").innerHTML = html;
}

// ---- tooltip: mouse = hover, touch/keyboard = click (first tap shows) ----
const tip = $("tip");
let current: HTMLElement | null = null, via = "";
const hide = () => { tip.hidden = true; current = null; };
function show(btn: HTMLElement, how: string) {
  const ev = EVENTS[btn.dataset.iso!];
  if (!ev) return hide();
  tip.innerHTML = `<h3>${tr(KIND_LABEL[ev.kind], lang)}</h3><strong>${ev.icon} ${fill(ev.title, lang)}</strong><ul>${ev.lines.map(l => `<li>${fill(l, lang)}</li>`).join("")}</ul>`;
  tip.hidden = false; current = btn; via = how;
  const r = btn.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  const x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8);
  const y = r.top - h - 10 > 8 ? r.top - h - 10 : r.bottom + 10;
  tip.style.left = `${x + scrollX}px`; tip.style.top = `${y + scrollY}px`;
}
const grid = $("grid");
const special = (e: Event) => (e.target as HTMLElement).closest<HTMLElement>(".special");
grid.addEventListener("pointerover", e => { const b = special(e); if (b && (e as PointerEvent).pointerType === "mouse") show(b, "hover"); });
grid.addEventListener("pointerout", e => { if (special(e) && (e as PointerEvent).pointerType === "mouse") hide(); });
grid.addEventListener("focusin", e => { const b = special(e); if (b?.matches(":focus-visible")) show(b, "focus"); });
grid.addEventListener("focusout", hide);
grid.addEventListener("click", e => {
  const b = special(e); if (!b) return;
  e.stopPropagation();
  if (current === b && !tip.hidden && via === "click") hide(); else show(b, "click"); // first tap always shows
});
document.addEventListener("click", hide);

// ---- christmas spirit: garland lights + snowfall ----
function lights() {
  const cols = ["#ff4d4d", "#ffd24a", "#4dd2ff", "#7dff7d"];
  const n = Math.max(8, Math.floor(innerWidth / 26)); // one bulb per ~26px, so they never get squeezed
  $("lights").innerHTML = Array.from({ length: n }, (_, i) =>
    `<i style="--c:${cols[i % 4]};animation-delay:${(i % 5) * 0.35}s"></i>`).join("");
}
let lightsW = innerWidth;
addEventListener("resize", () => { if (Math.abs(innerWidth - lightsW) > 40) { lightsW = innerWidth; lights(); } });
function snow() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = $("snow") as HTMLCanvasElement, x = c.getContext("2d")!;
  let w = 0, h = 0;
  const fit = () => { w = c.width = innerWidth; h = c.height = innerHeight; };
  fit(); addEventListener("resize", fit);
  const f = Array.from({ length: 90 }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: 1 + Math.random() * 3, v: 0.4 + Math.random() * 1.2, p: Math.random() * 6 }));
  (function loop() {
    x.clearRect(0, 0, w, h); x.fillStyle = "rgba(255,255,255,.9)";
    for (const s of f) {
      s.y += s.v; s.p += 0.01; s.x += Math.sin(s.p) * 0.5;
      if (s.y > h) { s.y = -5; s.x = Math.random() * w; }
      x.beginPath(); x.arc(s.x, s.y, s.r, 0, 7); x.fill();
    }
    requestAnimationFrame(loop);
  })();
}

function render() { const today = todayIso(); hide(); renderHeader(today); renderGrid(today); }
$("langs").addEventListener("click", e => {
  const l = (e.target as HTMLElement).dataset.l as Lang | undefined;
  if (!l) return;
  lang = l;
  try { localStorage.setItem("lang", l); } catch { /* ignore */ }
  render();
});
render(); lights(); snow();

// the QR block hides itself until public/qr.png exists
($("qr").querySelector("img") as HTMLImageElement).addEventListener("error", () => { $("qr").hidden = true; });
