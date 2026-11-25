// 26 Nov: targeted checks for the feedback audit (Christian's slides 2-8 of 25 Nov + regressions of older feedback).
// Local, with saved n8n answers. Run from ui-loop/:
//   APP_URL=http://localhost:8765/preview/index.html FXFILE=tools/fixtures/christian_mu.json VW=390 node tools/feedback_audit.js
// Prints PASS/FAIL per check id (IDs as in ui-loop/FEEDBACK_AUDIT_PREVIEW.md).
const { open, FX } = require('./harness.js');
(async () => {
  const { browser, page } = await open({ delay: 20 });
  const ev = (f, a) => page.evaluate(f, a);
  const ok = [], bad = [];
  const check = (id, cond, info) => (cond ? ok : bad).push(id + (cond ? '' : ' → ' + String(JSON.stringify(info)).slice(0, 300)));
  const overflow = () => ev(() => document.documentElement.scrollWidth - window.innerWidth);
  const main = () => ev(() => (document.querySelector('main') || document.body).innerText);

  // ---- N-03 Start page (slide 3)
  await ev(() => { localStorage.clear(); go('landing'); }); await page.waitForTimeout(6500);
  const lp = await ev(() => document.querySelector('.landing').innerText);
  check('N-03a purpose first: question + subline', /Is now the\s+right time for me\s+to go electric\?/i.test(lp) && /Discover how an all-electric car could fit your life and budget/.test(lp), lp.slice(0, 300));
  check('N-03b CTA "Find my options"', /Find my options/.test(lp), lp);
  check('N-03c trust line small and below the CTA', await ev(() => { const b = document.querySelector('.lp-go').getBoundingClientRect(), t = document.querySelector('.lp-trust'); return !!t && t.getBoundingClientRect().top > b.bottom && parseFloat(getComputedStyle(t).fontSize) < 15; }));
  check('N-03d no "No personal data stored" claim', !/No personal data stored/i.test(lp));
  check('N-03e name Electric Car Explorer visible', /ELECTRIC CAR EXPLORER/i.test(lp));
  check('N-03f no horizontal overflow (landing)', (await overflow()) <= 1, await overflow());

  // ---- N-04 Topic screen (slide 4)
  await ev(() => { go('home'); }); await page.waitForTimeout(500);
  let t = await main();
  check('N-04a heading and instruction', /What matters most to you\?/.test(t) && /Choose the topics you.d like to explore, starting with the most important\./.test(t), t.slice(0, 200));
  const labels = await ev(() => [...document.querySelectorAll('.topicbtn .tt')].map((x) => x.textContent));
  check('N-04b Christian labels and order', JSON.stringify(labels) === JSON.stringify(['Fit with my lifestyle', 'Purchase and running costs', 'Charging options', 'Range and battery life', 'Climate impact']), labels);
  for (const name of [/Charging options/, /Purchase and running costs/, /Climate impact/]) { await page.locator('.topicbtn').filter({ hasText: name }).first().click(); await page.waitForTimeout(120); }
  const prio = await ev(() => [...document.querySelectorAll('.topicbtn')].map((b) => [b.dataset.code, b.querySelector('.prio')?.textContent || '']));
  check('N-04c tap order = priority (first tap is 1)', prio[0][0] === 'B2' && prio[0][1] === '1' && prio[1][0] === 'B3' && prio[1][1] === '2' && prio[2][0] === 'B7' && prio[2][1] === '3', prio);
  t = await main();
  check('N-04d button "Check my topics" + what happens next', /Check my topics/.test(t) && /Next: a few short questions for these 3 topics, in this order/.test(t), t.slice(0, 600));
  await page.locator('.topicbtn').filter({ hasText: /Purchase and running costs/ }).first().click(); await page.waitForTimeout(120);
  const prio2 = await ev(() => [...document.querySelectorAll('.topicbtn')].map((b) => [b.dataset.code, b.querySelector('.prio')?.textContent || '']));
  check('N-04e untapping renumbers', prio2[0][0] === 'B2' && prio2[1][0] === 'B7' && prio2[1][1] === '2', prio2);
  const q = await ev(() => { startQueue(['B3', 'B4']); const q = store.queue.slice(); ui.flow = null; go('home'); return q; });
  check('N-04f real route order: Costs picked first still asks Lifestyle first (B4 before B3)', q[0] === 'B4', q);
  check('N-04g no overflow (topics)', (await overflow()) <= 1, await overflow());

  // ---- load the saved answers of the Christian case
  await ev((F) => { store.profile = sanitizeProfile(F.profile); store.carLabels['1BB439'] = 'BMW 530xd Touring';
    for (const [c, resp] of Object.entries(F.fx)) { const x = JSON.parse(JSON.stringify(resp)); x.profile = store.profile; store.results[c] = { response: x, request_id: 'p' + c, at: Date.now(), session: { barrier: BARRIERS[c].name }, sig: inputSig(store.profile, c) }; }
    store.queue = ['B4', 'B3']; store.visited = ['B1', 'B2', 'B3', 'B4', 'B6', 'B7']; saveResults(); saveStore(); }, FX);

  // ---- N-05 Lifestyle fit question (slide 5)
  await ev(() => editAnswer(9)); await page.waitForTimeout(500);
  t = await main();
  check('N-05a question and multi-select instruction', /What type of car would suit your needs\?/.test(t) && /Select all that could work for you/.test(t), t.slice(0, 200));
  const chips = await ev(() => [...document.querySelectorAll('.qpart')][0].innerText);
  check('N-05b seven categories incl. Not sure yet', ['Small car', 'Medium-sized car', 'Large car', 'Small SUV / Crossover', 'Medium / Large SUV', 'Van', 'Not sure yet'].every((x) => chips.includes(x)), chips);
  await page.locator('.chips button', { hasText: /^Small car$/ }).click(); await page.waitForTimeout(150);
  await page.locator('.chips button', { hasText: /^Medium \/ Large SUV$/ }).click(); await page.waitForTimeout(150);
  const d1 = await ev(() => ({ types: ui.draft.target_ev.types, size: ui.draft.target_ev.size, hint: document.querySelector('.qpart .hint')?.textContent }));
  check('N-05c several types kept, smallest size used, said on screen', d1.types.includes('small') && d1.types.includes('suv') && d1.types.includes('medium') && d1.size === 'S' && /smallest/.test(d1.hint || ''), d1);
  await page.locator('.chips button', { hasText: /^Not sure yet$/ }).click(); await page.waitForTimeout(150);
  const d2 = await ev(() => ({ types: ui.draft.target_ev.types, size: ui.draft.target_ev.size }));
  check('N-05d Not sure yet clears the others', d2.types.length === 0 && d2.size === 'any', d2);
  // pick only Medium / Large SUV and save: the name follows to the result, Summary and PDF
  await page.locator('.chips button', { hasText: /^Medium \/ Large SUV$/ }).click(); await page.waitForTimeout(150);
  await ev(() => { store.profile.target_ev = clone(ui.draft.target_ev); saveStore(); ui.editOpen = null; ui.flow = null; showResult('B4'); }); await page.waitForTimeout(600);
  t = await main();
  check('N-05e result names the category (Medium / Large SUV)', /Medium \/ Large SUV/.test(t), t.slice(0, 300));
  check('N-05f New price around + Used example + illustrative note', /New price\s*around CHF/.test(t) && /Used example[\s\S]{0,60}around CHF/.test(t) && /Illustrative purchase price/.test(t), (t.match(/Type[\s\S]{0,400}/) || [''])[0]);
  check('N-05g no overflow (Lifestyle)', (await overflow()) <= 1, await overflow());
  await ev(() => go('summary')); await page.waitForTimeout(700); t = await main();
  check('N-05h Summary keeps category + used + price', /Medium \/ Large SUV[\s\S]{0,40}used, about CHF.20.000/.test(t), (t.match(/Electric car you are looking at[\s\S]{0,90}/) || [''])[0]);
  const pdf = await ev(() => JSON.stringify(Report.doc(['B3', 'B4'])));
  check('N-05i PDF keeps the category', /medium or large SUV|Medium \/ Large SUV/.test(pdf));
  await ev(() => { store.profile.target_ev.types = null; saveStore(); });

  // ---- N-06/07 mismatch Costs vs Summary/PDF (slides 6-7): a what-if on the Costs page must not leak
  await ev(() => { ui.b3N = 6; showResult('B3'); }); await page.waitForTimeout(700);
  const saved = await ev(() => { const v = overallVerdict(); return { lines: v.lines.join(' '), title: v.title }; });
  await page.getByRole('button', { name: /^New$/ }).first().click(); await page.waitForTimeout(700);
  t = await main();
  const leak = await ev(() => { const v = overallVerdict(); return { lines: v.lines.join(' '), title: v.title, pdf: JSON.stringify(Report.doc(['B3'])).match(/upfront[^"]{0,80}/g) }; });
  check('N-06a page shows the what-if (new) and says so', /What-if, only on this page/.test(t) && /23.960/.test(t), (t.match(/Cash you need today[\s\S]{0,60}/) || [''])[0]);
  check('N-06b verdict keeps the saved car (used, cash 5000) during what-if', leak.lines === saved.lines && /used/.test(leak.lines) && /5.000 upfront/.test(leak.lines), { saved, leak });
  await ev(() => go('summary')); await page.waitForTimeout(700); t = await main();
  check('N-06c Summary verdict = saved choice', /used electric medium-sized car[\s\S]{0,120}you pay CHF.5.000 upfront/.test(t), (t.match(/OUR VERDICT[\s\S]{0,300}/) || [''])[0]);
  await ev(() => { ui.b3Cls = null; store.session.ev_purchase = null; });

  // ---- N-08 Other transport (slide 8): synthetic rental on the used line to check the wording
  await ev(() => { const r = store.results.B3.response.result; const l = r.lines.find((x) => x.kind === 'option' && x.purchase === 'used' && x.class_id === 'M1');
    l.bridging = [{ trip_id: 1, label: 'Weekend away', key: 'rental', category: 'car', days: 8, cost_per_trip_chf: 141, cost_per_year_chf: 1128,
      why: { missing: ['range'], need_km: 486, class_km: 250, seasons: ['winter'], frequency: '8× per year', km_one_way: 216.3, charge_at_dest: true, stops_counted: true, need_basis: 'special_trip_with_charging_stops' } }];
    l.years.forEach((y) => { y.items.bridging = 1128; }); ui.b3N = 6; showResult('B3'); }); await page.waitForTimeout(700);
  t = await main();
  check('N-08a row named "Rental car or train for long trips" with the trip under it', /Rental car or train for long trips\s*Weekend away: rental car, 8 days a year/.test(t), (t.match(/Rental car or train[\s\S]{0,120}/) || [''])[0]);
  check('N-08b no "Other transport" label left', !/Other transport/.test(t));
  check('N-08c why: trip length, rated range, 2.5 h rule, no false "stops counted"', /216\s*km one way; that needs about 486\s*km of rated range \(WLTP\) in winter/.test(t.replace(/\u00a0/g, ' ')) && /only after 2\.5\s*hours/.test(t.replace(/\u00a0/g, ' ')) && !/charging stops on the way are counted/.test(t), (t.match(/Why:[\s\S]{0,300}/) || [''])[0]);
  check('N-08d no overflow (Costs)', (await overflow()) <= 1, await overflow());

  console.log('PASS', ok.length); ok.forEach((x) => console.log('  ✓ ' + x));
  console.log('FAIL', bad.length); bad.forEach((x) => console.log('  ✗ ' + x));
  console.log('errors', JSON.stringify(page.errors));
  await browser.close();
})();
