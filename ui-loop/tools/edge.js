// Missing tariff, AI slow, enlarged text (VW=260 ~ 150 % text at 390 px).
const { open, FX } = require('./harness.js');
const fs = require('fs');
const OUT = process.env.OUT || '/tmp/edge/'; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { browser, page } = await open({ delay: 120, sdelay: 25000 });
  const ev = (f, a) => page.evaluate(f, a);
  await ev((F) => { store.profile = sanitizeProfile(F.profile); for (const [c, resp] of Object.entries(F.fx)) { const r = JSON.parse(JSON.stringify(resp)); store.results[c] = { response: r, request_id: 'e' + c, at: Date.now(), session: { barrier: BARRIERS[c].name }, sig: inputSig(store.profile, c) }; }
    const b2 = store.results.B2.response.result; b2.ranking.find((x) => x.option === 'home').cost_per_100km_chf = null; if (b2.home?.costs) b2.home.costs.running = null;
    const b3 = store.results.B3.response.result; b3.missing_inputs = ['everyday_price']; b3.assumptions.find((a) => a.key === 'p_home').value = null;
    store.visited = ['B1', 'B2', 'B3', 'B4', 'B6', 'B7']; saveResults(); saveStore(); go('home'); }, FX);
  const t0 = Date.now();
  await ev(() => showResult('B2')); await ev(() => { const f = document.getElementById('fullan'); if (f) f.open = true; }); await page.waitForTimeout(600);
  console.log('charging no price data:', (await ev(() => document.querySelector('main').innerText)).match(/No price data/g)?.length || 0);
  await page.screenshot({ path: OUT + 'charging_noprice.png', fullPage: true });
  await ev(() => { ui.b3N = 6; showResult('B3'); }); await page.waitForTimeout(600);
  const c = await ev(() => document.querySelector('main').innerText); console.log('costs gap note:', /No price data: the electricity price/.test(c));
  await page.screenshot({ path: OUT + 'costs_noprice.png', fullPage: false });
  await ev(() => go('summary')); await page.waitForTimeout(700);
  const s = await ev(() => ({ verdict: document.querySelector('.keycard.verdict .keystat')?.textContent, why: document.querySelector('.keycard.verdict .keydetail')?.textContent, aiSkeleton: !!document.querySelector('.aibox .skel') }));
  console.log('summary with AI still loading after', Date.now() - t0, 'ms:', JSON.stringify(s));
  await page.screenshot({ path: OUT + 'summary_ai_slow.png', fullPage: false });
  const n = await ev(async () => { const pm = await loadPdfLib(); const blob = await new Promise((ok) => pm.createPdf(Report.onePager(Summary.get('simple'))).getBlob(ok)); return blob.size; });
  console.log('one-page PDF while AI pending, bytes:', n);
  // overflow check
  const ov = await ev(() => { const W = document.documentElement.clientWidth; return [...document.querySelectorAll('main *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > W + 1; }).slice(0, 5).map((e) => e.tagName + '.' + e.className); });
  console.log('overflow on summary:', JSON.stringify(ov));
  for (const code of ['B2', 'B3']) { await ev((cd) => showResult(cd), code); await ev(() => { const f = document.getElementById('fullan'); if (f) f.open = true; const hc = document.querySelector('.howcalc'); if (hc) hc.open = true; }); await page.waitForTimeout(500);
    const ov2 = await ev(() => { const W = document.documentElement.clientWidth; const clipped = (e) => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { if (/(hidden|clip|auto|scroll)/.test(getComputedStyle(p).overflowX)) return true; } return false; }; return [...document.querySelectorAll('main *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > W + 1 && !clipped(e); }).slice(0, 5).map((e) => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right)); });
    console.log('overflow', code, JSON.stringify(ov2)); await page.screenshot({ path: OUT + code + '_w' + (process.env.VW || 390) + '.png', fullPage: true }); }
  await ev(() => go('home')); await page.waitForTimeout(400); await page.screenshot({ path: OUT + 'home_w' + (process.env.VW || 390) + '.png', fullPage: false });
  console.log('errors', JSON.stringify(page.errors));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
