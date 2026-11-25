// 25 Nov: Christian's check 2 – Medium + used survives from the answers to Lifestyle match, Costs, Summary and both PDFs;
// vehicle price (20,000) and sale (15,000) give a cash need of 5,000. Also M02: reorder topics with Alt + arrow keys.
// Run: FXFILE=fixtures/christian_mu.json node e2e_medium_used.js
const { open, FX } = require('./harness.js');
(async () => {
  const { browser, page } = await open({ delay: 60 });
  const ev = (f, a) => page.evaluate(f, a);
  const ok = []; const bad = []; const check = (name, cond, info) => (cond ? ok : bad).push(name + (cond ? '' : ' → ' + JSON.stringify(info)));
  await ev((F) => { store.profile = sanitizeProfile(F.profile); store.carLabels['1BB439'] = 'BMW 530XD (diesel)';
    for (const [c, resp] of Object.entries(F.fx)) { const r = JSON.parse(JSON.stringify(resp)); r.profile = store.profile; store.results[c] = { response: r, request_id: 'p' + c, at: Date.now(), session: { barrier: BARRIERS[c].name }, sig: inputSig(store.profile, c) }; }
    store.queue = ['B4', 'B3']; store.visited = ['B1', 'B2', 'B3', 'B4', 'B6', 'B7']; saveResults(); saveStore(); }, FX);
  // Lifestyle match: the chosen type is the headline even if the trips would need a smaller one
  await ev(() => showResult('B4')); await page.waitForTimeout(600);
  const b4 = await ev(() => document.querySelector('.bigfig')?.innerText || '');
  check('Lifestyle match headline is the chosen type', /Mid-size car/.test(b4), b4);
  // Costs: used line, price and cash need
  await ev(() => { ui.b3N = 5; showResult('B3'); }); await page.waitForTimeout(700);
  const b3 = await ev(() => document.querySelector('main').innerText);
  check('Costs: line is used', /used/i.test(b3), b3.slice(0, 300));
  check('Costs: cash you need today 5,000', /Cash you need today[\s\S]{0,80}5[’',]000/.test(b3), (b3.match(/Cash you need today[\s\S]{0,80}/) || [])[0]);
  check('Costs: price 20,000', /20[’',]000/.test(b3), null);
  check('Costs: sale 15,000', /15[’',]000/.test(b3), null);
  // Summary
  await ev(() => go('summary')); await page.waitForTimeout(800);
  const sm = await ev(() => document.querySelector('main').innerText);
  check('Summary: chosen car line', /Mid-size car, used, about CHF.20[’',]000/.test(sm), (sm.match(/Electric car you are looking at[\s\S]{0,80}/) || [])[0]);
  // PDF (full report) and one-pager: the document definitions as text
  const pdf = await ev(() => JSON.stringify(Report.doc(['B3', 'B4'])));
  check('PDF: used electric mid-size car', /used/.test(pdf) && /mid-size car/i.test(pdf), null);
  check('PDF: cash 5,000', /5[’',]000/.test(pdf), null);
  check('PDF: payback wording', /Pays off in year|Does not pay off within|Not enough data to estimate payback/.test(pdf), null);
  const one = await ev(() => { try { return JSON.stringify(Report.onePager(Summary.model ? Summary.model() : {})); } catch (e) { return 'ERR ' + e.message; } });
  check('One-pager builds', !/^ERR/.test(one), one.slice(0, 120));
  // M02: Alt + arrow keys change the order before any topic is picked
  await ev(() => { ui.topicSel = []; ui.topicOrder = null; go('home'); }); await page.waitForTimeout(500);
  const before = await ev(() => [...document.querySelectorAll('.topicbtn')].map((b) => b.dataset.code));
  await page.focus(`.topicbtn[data-code="${before[2]}"]`); await page.keyboard.down('Alt'); await page.keyboard.press('ArrowUp'); await page.keyboard.up('Alt'); await page.waitForTimeout(300);
  const after = await ev(() => [...document.querySelectorAll('.topicbtn')].map((b) => b.dataset.code));
  const focus = await ev(() => document.activeElement?.dataset?.code);
  check('Keyboard: Alt+Up moves the third topic to second', after[1] === before[2], { before, after });
  check('Keyboard: focus stays on the moved topic', focus === before[2], focus);
  console.log('PASS', ok.length, ok); console.log('FAIL', bad.length, bad); console.log('errors', page.errors);
  await browser.close();
})();
