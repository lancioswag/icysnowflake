// Screenshots of Costs and Summary for the Christian case (same seed as pdf_christian.js). VW=1366 or 390.
const fs = require('fs');
const { chromium } = require('playwright');
const { open, FX } = require('./harness.js');
(async () => {
  const b3 = JSON.parse(fs.readFileSync(process.env.B3FILE || '/tmp/b3_word.json', 'utf8'));
  const fx = { B4: FX.fx.B4, B6: FX.fx.B6, B3: b3 };
  const { browser, page } = await open({ delay: 30 });
  const vw = Number(process.env.VW || 390);
  if (vw > 800) await page.setViewportSize({ width: vw, height: 900 });
  await page.evaluate(async (F) => {
    const p = Example.profile(true);
    store.profile = sanitizeProfile(p); store.carLabels['1BB439'] = 'BMW 530XD (diesel)'; store.yearsKept = 5;
    for (const [c, resp] of Object.entries(F)) { const r = JSON.parse(JSON.stringify(resp)); r.profile = store.profile; store.results[c] = { response: r, request_id: 'p' + c, at: Date.now(), session: { barrier: BARRIERS[c].name }, sig: inputSig(store.profile, c) }; }
    store.visited = ['B3', 'B4', 'B6']; saveResults(); saveStore();
  }, fx);
  for (const [name, fn] of [['b3', () => showResult('B3')], ['sum', () => go('summary')], ['b4', () => showResult('B4')]]) {
    await page.evaluate(fn); await page.waitForTimeout(1200);
    await page.screenshot({ path: `/tmp/sh_${name}_${vw}.png`, fullPage: true });
  }
  console.log(JSON.stringify(page.errors));
  await browser.close();
})();
