// Test profile P (St. Gallen tenant, VW Golf 2020, 40 km commute + Florence): real n8n TEST-copy results, 390 px.
const { open, FX } = require('./harness.js');
const fs = require('fs');
const OUT = process.env.OUT || '/tmp/pt/'; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { browser, page } = await open({ delay: 150 });
  const ev = (f, a) => page.evaluate(f, a);
  const cap = async (id, full = true) => { await page.waitForTimeout(900); await page.screenshot({ path: OUT + id + '.png', fullPage: full }); };
  const text = () => ev(() => document.querySelector('main')?.innerText || '');
  await ev((F) => { store.profile = sanitizeProfile(F.profile); for (const [c, resp] of Object.entries(F.fx)) { const r = JSON.parse(JSON.stringify(resp)); store.results[c] = { response: r, request_id: 'p' + c, at: Date.now(), session: { barrier: BARRIERS[c].name }, sig: inputSig(store.profile, c) }; } store.queue = ['B1', 'B2', 'B3']; store.visited = ['B1', 'B2', 'B3', 'B4', 'B6', 'B7']; saveResults(); saveStore(); go('home'); }, FX);
  await cap('start', false); await cap('start_full');
  await ev(() => { document.querySelector('details.datasrc').open = true; }); await cap('start_sources');
  await ev(() => showResult('B2')); await cap('charging');
  await ev(() => { ui.b3N = 6; showResult('B3'); }); await cap('costs_6');
  fs.writeFileSync(OUT + 'costs_6.txt', await text());
  await ev(() => { ui.b3N = 10; render(); }); await cap('costs_10'); fs.writeFileSync(OUT + 'costs_10.txt', await text());
  await ev(() => { document.getElementById('fullan').open = true; document.querySelector('.howcalc').open = true; }); await cap('costs_10_full'); fs.writeFileSync(OUT + 'costs_10_full.txt', await text());
  await ev(() => go('summary')); await page.waitForTimeout(1500); await cap('summary'); fs.writeFileSync(OUT + 'summary.txt', await text());
  const pdf = async (name, fn) => { const b64 = await ev(async (k) => { const pm = await loadPdfLib(); const doc = k === 'one' ? Report.onePager(Summary.get('simple')) : Report.doc(pdfCodes(ORDER.filter((c) => store.results[c]))); const blob = await new Promise((ok) => pm.createPdf(doc).getBlob(ok)); const buf = await blob.arrayBuffer(); let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }, fn); fs.writeFileSync(OUT + name, Buffer.from(b64, 'base64')); };
  await pdf('one_page.pdf', 'one'); await pdf('full_report.pdf', 'full');
  console.log('errors:', JSON.stringify(page.errors));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
