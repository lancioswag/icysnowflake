const { open, FX } = require('./harness.js');
(async () => {
  const { browser, page } = await open({ delay: 50 });
  const out = await page.evaluate((F) => {
    const base = JSON.parse(JSON.stringify(F.fx.B3.result));
    const run = (mut, label) => { const r = JSON.parse(JSON.stringify(base)); mut(r); store.session.ev_purchase = 'new'; ui.b3Cls = 'S1'; ui.b3Fuel = 1; ui.b3N = 10; const M = b3Model(r); return { label, payback: M.payback, gaps: M.gapYears, last: M.lastYear, saving10: M.saving == null ? null : Math.round(M.saving), H: M.H }; };
    const ev = (r) => r.lines.find((l) => l.class_id === 'S1' && l.purchase === 'new');
    return [
      run(() => {}, 'as delivered (n8n payback 10)'),
      run((r) => { delete ev(r).payback_year; }, 'no payback from n8n: frontend search to 12'),
      run((r) => { delete ev(r).payback_year; ev(r).years.find((y) => y.n === 9).saving_vs_current = null; }, 'year 9 missing'),
      run((r) => { delete ev(r).payback_year; ev(r).years.find((y) => y.n === 12).saving_vs_current = { min: null, max: null }; }, 'year 12 missing'),
      run((r) => { delete ev(r).payback_year; for (const l of r.lines) l.years = l.years.filter((y) => y.n <= 8); }, 'old 8-year result'),
      run((r) => { ev(r).payback_year = 10; ui.b3Fuel = 1.3; }, 'petrol +30 %'),
    ];
  }, FX);
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
