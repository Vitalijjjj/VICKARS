// Captures every page of the local site, section by section, for the design board (design/board).
// usage: node design/capture.mjs [baseUrl]   — needs headless Chrome with --remote-debugging-port=9333
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] || 'http://localhost:4321';
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'board', 'shots');
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const targets = await (await fetch('http://127.0.0.1:9333/json')).json();
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send('Page.enable');

// final states of the scroll reveals, so a still frame shows the finished design
const FORCE = `[data-up]{opacity:1!important;transform:none!important}[data-words] .w{opacity:1!important}
.v2-about .m>span{transform:none!important}.v2-about__frame{clip-path:none!important}.v2-about__badge{transform:none!important}
.v2-bleed__txt{opacity:1!important}`;
const NOHEAD = `body > header, .lgh{visibility:hidden!important}`; // fixed header only in hero frames

const DEVICES = { desktop: { w: 1440, h: 900, dpr: 1 }, mobile: { w: 375, h: 812, dpr: 2 } };
const manifest = [];

async function shot(page, device, key, name, clip) {
  const d = DEVICES[device];
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82, captureBeyondViewport: !!clip, clip: clip ? { ...clip, scale: 1 } : undefined });
  const file = `${page}-${device}-${key}.jpg`;
  writeFileSync(join(OUT, file), Buffer.from(r.result.data, 'base64'));
  manifest.push({ page, device, key, name, file, w: d.w, h: Math.round(clip ? clip.height : d.h) });
  console.log('saved', file);
}

async function open(url, device) {
  const d = DEVICES[device];
  await send('Emulation.setDeviceMetricsOverride', { width: d.w, height: d.h, deviceScaleFactor: d.dpr, mobile: device === 'mobile' });
  await send('Page.navigate', { url });
  await sleep(6500); // intro video + fonts
}
const scrollTo = async (y, wait = 1800) => { await ev(`window.scrollTo({top:${y},behavior:'instant'})`); await sleep(wait); };
const force = () => ev(`(()=>{if(document.getElementById('cap-force'))return 1;const s=document.createElement('style');s.id='cap-force';s.textContent=${JSON.stringify(FORCE + NOHEAD)};document.head.append(s);return 1})()`);
const rects = (sel) => ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].map(e=>{const r=e.getBoundingClientRect();return {y:r.top+scrollY,h:r.height,cls:[...e.classList].find(c=>/^(v2-feature|v2-about|v2-bleed|v2-sec|v2-quote|ft|lvl__)/.test(c)&&c!=='v2-sec')||e.classList[0],id:e.id}})`);

const HOME_NAMES = {
  'v2-about': 'Про нас', 'v2-bleed': 'Ручна мийка — банер', services: 'Послуги — три рівні', 'v2-feature': 'Детейлінг-студія',
  'v2-bleed--quote': 'Лаунж — цитата', process: 'Як проходить візит', benefits: 'Чому VIK Cars', pricing: 'Ціни + запис',
  contacts: 'Контакти', ft: 'Футер',
};

for (const device of Object.keys(DEVICES)) {
  const d = DEVICES[device];
  // ---------------- home
  await open(`${BASE}/`, device);
  await shot('home', device, '01-hero', 'Герой — кінець інтро');
  const cin = await rects('[data-cinema]');
  const pinLen = (await ev('document.querySelector(".v2").getBoundingClientRect().top+scrollY')) - d.h;
  await scrollTo(Math.round(pinLen * 0.35), 2600);
  await shot('home', device, '02-building', 'Будівля — наближення');
  await scrollTo(Math.round(pinLen * 0.92), 2600);
  await shot('home', device, '03-building-end', 'Будівля — рівні');
  const secs = await rects('.v2 > section, footer.ft');
  let n = 4;
  for (const s of secs) {
    await scrollTo(Math.round(s.y), 2200);
    await force(); await sleep(400);
    const key = s.id || (s.cls === 'v2-bleed' && n > 6 ? 'v2-bleed--quote' : s.cls);
    const name = HOME_NAMES[s.id] || HOME_NAMES[key] || key;
    await shot('home', device, `${String(n).padStart(2, '0')}-${s.id || s.cls}`, name, { x: 0, y: s.y, width: d.w, height: s.h });
    n++;
  }
  void cin;
  // ---------------- level pages
  for (const slug of ['car-wash', 'detailing-studio', 'lounge-showroom']) {
    await open(`${BASE}/levels/${slug}/`, device);
    await shot(slug, device, '01-hero', 'Герой — слайдер');
    const body = await rects('.lvl__intro, .lvl__cta, footer.ft');
    let m = 2;
    for (const s of body) {
      await scrollTo(Math.round(s.y), 1800);
      await force(); await sleep(300);
      await shot(slug, device, `${String(m).padStart(2, '0')}-${s.cls}`, { 'lvl__intro': 'Вступ + факти', 'lvl__cta': 'Інші рівні + CTA', ft: 'Футер' }[s.cls] || s.cls, { x: 0, y: s.y, width: d.w, height: s.h });
      m++;
    }
  }
}
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log('done', manifest.length);
ws.close();
