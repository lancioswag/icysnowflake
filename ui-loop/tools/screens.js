const { open, FX } = require('./harness.js');
const fs = require('fs');
const OUT = (process.env.OUT || '/tmp/screens/'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { browser, page } = await open({ delay: 200 });
  const log = []; const overflow = [];
  const cap = async (id, wait = 500) => { await page.waitForTimeout(wait); await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(150);
    await page.screenshot({ path: OUT + id + '.v.png' }); await page.screenshot({ path: OUT + id + '.f.png', fullPage: true }); fs.writeFileSync(OUT + id + '.txt', await page.evaluate(() => (document.querySelector('.nav .navt')?.innerText || '') + '\n' + (document.querySelector('main')?.innerText || ''))); log.push(id);
    const ov = await page.evaluate(() => { const W = document.documentElement.clientWidth; const clipped = (e) => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p); if (/(hidden|clip|auto|scroll)/.test(o.overflowX)) return true; } return false; };
      return [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > W + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed' && !clipped(e); }).slice(0, 4).map((e) => e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0] + ' ' + Math.round(e.getBoundingClientRect().right)); });
    if (ov.length) overflow.push(id + ': ' + ov.join(', ')); };
  const seed = () => page.evaluate((F) => {
    const S = { B2: { barrier: BARRIERS.B2.name, charging_interest: ['everyday', 'trips_ch', 'abroad'] }, B6: { barrier: BARRIERS.B6.name, battery_entry: 'forecast' } };
    for (const [c, resp] of Object.entries(F.fx)) { const r = JSON.parse(JSON.stringify(resp)); r.profile = store.profile; store.results[c] = { response: r, request_id: 'fx' + c, at: F.at, session: S[c] || { barrier: BARRIERS[c].name }, sig: inputSig(store.profile, c) }; }
    store.visited = ['B1', 'B2', 'B3', 'B6', 'B7', 'B4']; store.queue = ['B2', 'B1', 'B3']; saveResults(); saveStore();
  }, FX);
  const ev = (f, a) => page.evaluate(f, a);
  // ---- start
  await ev(() => { store.queue = []; ui.topicSel = []; go('home'); }); await cap('home-empty');
  await ev(() => { ui.topicSel = ['B2', 'B1', 'B3']; render(); }); await cap('home-picked');
  await ev(() => Assistant.open()); await cap('assistant', 900); await ev(() => { ui.assistantOpen = false; render(); });
  // ---- questions (each block as asked)
  const Q = { 1: 'B1', 2: 'B1', 3: 'B3', 4: 'B1', 5: 'B2', 6: 'B2', 7: 'B3', 8: 'B3', 9: 'B3', 10: 'B3', 11: 'B6', 12: 'B6', 13: 'B4' };
  for (const [b, code] of Object.entries(Q)) {
    await ev(([b, code]) => { ui.barrier = code; store.session = { barrier: BARRIERS[code].name, ...(+b === 12 ? { battery_entry: 'used_car' } : {}) }; ui.flow = { history: [], ownTrips: false, forced: null, current: null, entry: +b === 12 ? 'used_car' : null }; gotoBlock(+b); }, [b, code]);
    await cap('q' + b, 400);
  }
  await ev(() => { ui.barrier = 'B3'; store.session = { barrier: BARRIERS.B3.name }; ui.flow = { history: [], ownTrips: false, forced: [8], current: null, afterMissing: true }; gotoBlock(8); }); await cap('q-missing');
  // ---- loading / batch / error
  await ev(() => { ui.barrier = 'B2'; ui.view = 'loading'; render(); }); await cap('loading', 300);
  await ev(() => { ui.batch = { codes: ['B2', 'B1', 'B3', 'B6'], done: ['B2'], need: [] }; ui.view = 'batch'; render(); }); await cap('batch', 300);
  await ev(() => { ui.error = { message: 'The Navigator service could not be reached.', code: 'network', retryable: true, barrier: 'B2' }; ui.view = 'error'; render(); }); await cap('error', 200);
  // ---- results
  await seed();
  for (const c of ['B2', 'B1', 'B3', 'B7', 'B4']) {
    await ev((c) => { ui.deep = {}; showResult(c); }, c); await cap('r-' + c, 900);
    if (await page.locator('#fullan').count()) { await page.click('#fullan > summary'); await cap('r-' + c + '-full', 900); }
  }
  // B2 details: write email, site tapped, near work, action panel email
  await ev(() => { ui.deep = { B2: true }; showResult('B2'); }); await page.waitForTimeout(900);
  const mk = page.locator('.leaflet-marker-icon.mk.dc'); if (await mk.count()) await mk.first().click({ force: true });
  await cap('r-B2-email-site', 400);
  await ev(() => Questions.openEdit('B2')); await cap('r-B2-edit', 900);
  await ev(() => { const r = store.results.B2.response.result; openMail(r.home.email, { title: 'Write email' }); }); await cap('mail', 500);
  // B6 forecast page and used-car check
  await ev(() => { ui.deep = {}; showResult('B6'); }); await cap('r-B6', 900);
  await ev(() => startB6('used_car')); await page.waitForTimeout(500);
  await page.fill('input[type="month"], #ul-reg, input[id^="ul"]', '2021-03').catch(() => {});
  await ev(() => { store.profile.used_listing.first_registration = '2021-03'; store.profile.used_listing.odometer_km = 68000; saveStore(); calculate('B6'); }); await cap('r-B6-used', 1200);
  await ev(() => { delete store.results.B6; }); await seed();
  // ---- summary
  await ev(() => { Summary.cache = {}; Summary.style = 'simple'; go('summary'); }); await page.waitForTimeout(80); await page.screenshot({ path: OUT + 'summary-loading.v.png' }); await page.screenshot({ path: OUT + 'summary-loading.f.png', fullPage: true }); log.push('summary-loading');
  await cap('summary', 900);
  await ev(() => { Summary.style = 'numbers'; render(); }); await cap('summary-numbers', 900);
  await ev(() => { Summary.style = 'simple'; render(); });
  await ev(() => go('home')); await ev(() => { ui.topicSel = null; render(); }); await cap('home-results');
  // ---- answers, one answer, account, settings, reset
  await ev(() => go('answers')); await cap('answers');
  await ev(() => editAnswer(1)); await cap('answer-edit');
  await ev(() => { Account.form = null; go('account'); }); await cap('account-create');
  await page.click('.pillswitch button >> nth=1'); await cap('account-login', 200);
  await ev(() => { Account.user = { email: 'simone@example.ch' }; render(); }); await cap('account-in', 200); await ev(() => { Account.user = null; });
  await ev(() => go('reset')); await cap('reset', 200);
  fs.writeFileSync(OUT + 'list.json', JSON.stringify(log));
  console.log('overflow', overflow);
  console.log(log.length, 'screens; errors', page.errors);
  await browser.close();
})();
