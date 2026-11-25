// 25 Nov (Amos brief, 3 and 4): checks that need control over the network or the device, run on the preview build with
// answers recorded from the n8n copy. Covers: reorder before selecting (touch drag and keyboard), selling price empty / zero /
// estimate, the AutoScout line, the data date on Start, the chat launcher over the main buttons (390 and 1366 px), a slow and a
// missing workflow answer, a missing chat answer, and payback present / absent / not computable.
// Run: APP_URL=http://localhost:8765/preview/index.html FXFILE=fixtures/christian_mu.json node e2e_stress_local.js
const fs = require('fs'), path = require('path');
const { open, FX } = require('./harness.js');
const B3CODE = fs.readFileSync(path.join(__dirname, '../../n8n/test/b3_7_costs.js'), 'utf8');
const INP = JSON.parse(fs.readFileSync(path.join(__dirname, 'b3local/input_christian.json'), 'utf8'));
const b3For = (profile) => { const inp = JSON.parse(JSON.stringify(INP)); inp.profile = JSON.parse(JSON.stringify(profile)); return new Function('$input', B3CODE)({ first: () => ({ json: inp }) })[0].json; };
const ok = [], bad = [], skipped = [];
const check = (name, cond, info) => (cond ? ok : bad).push(name + (cond ? '' : ' → ' + JSON.stringify(info)));
async function session(vw, mode = {}) {
  const { browser, page } = await open({ delay: 30 });
  if (vw > 800) await page.setViewportSize({ width: vw, height: 900 });
  await page.route('**/webhook/navigator*', async (r) => {
    const b = JSON.parse(r.request().postData() || '{}');
    if (mode.fail) return r.fulfill({ status: 502, body: 'bad gateway' });
    if (mode.slow) await new Promise((ok2) => setTimeout(ok2, mode.slow));
    const res = b.session?.barrier === 'B3 Costs' ? b3For(b.profile) : JSON.parse(JSON.stringify(FX.fx.B4));
    res.profile = b.profile; r.fulfill({ contentType: 'application/json', body: JSON.stringify(res) });
  });
  await page.route('**/webhook/assist-claude', (r) => (mode.chatDown ? r.abort('failed') : r.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'ok', answer: 'ok', patch: {} }) })));
  await page.evaluate(() => { window.seed = (word, patch) => { const p = Example.profile(word); if (patch) patch(p); store.profile = sanitizeProfile(p); store.carLabels['1BB439'] = 'BMW 530xd'; store.yearsKept = 5; store.session = { barrier: BARRIERS.B3.name }; saveStore(); }; });
  return { browser, page, ev: (f, a) => page.evaluate(f, a) };
}
(async () => {
  // ---------- 1. reorder before selecting: touch drag on the grip, then keyboard ----------
  { const { browser, page, ev } = await session(390);
    await ev(() => { resetAll(); ui.topicSel = []; go('topics'); }); await page.waitForTimeout(500);
    const before = await ev(() => [...document.querySelectorAll('.topicbtn')].map((b) => b.dataset.code));
    const grip = await page.locator('.topicbtn').nth(2).locator('.grip').boundingBox();
    const first = await page.locator('.topicbtn').nth(0).boundingBox();
    const cdp = await page.context().newCDPSession(page);
    const x = grip.x + grip.width / 2, y0 = grip.y + grip.height / 2, y1 = first.y + first.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
    for (let k = 1; k <= 8; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + (y1 - y0) * k / 8 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(500);
    const afterTouch = await ev(() => ({ ord: [...document.querySelectorAll('.topicbtn')].map((b) => b.dataset.code), sel: ui.topicSel }));
    check('touch: drag the 3rd topic to the top before selecting anything', afterTouch.ord[0] === before[2], { before, after: afterTouch.ord });
    check('touch: the dragged topic becomes the first choice', afterTouch.sel?.[0] === before[2], afterTouch.sel);
    await page.locator('.topicbtn').nth(3).focus(); await page.keyboard.press('Alt+ArrowUp'); await page.waitForTimeout(300);
    const afterKey = await ev(() => [...document.querySelectorAll('.topicbtn')].map((b) => b.dataset.code));
    check('keyboard: Alt+Up moves the 4th topic to 3rd', afterKey[2] === afterTouch.ord[3], { afterTouch: afterTouch.ord, afterKey });
    await browser.close(); }
  // ---------- 2. selling price: empty (estimate), zero, own value; AutoScout line; Start ----------
  { const { browser, page, ev } = await session(390);
    const cash = async (val) => {
      await ev((v) => { seed(true, (p) => { p.current_car.value_today_chf = v; p.cost_assumptions.residual_current_chf = null; }); }, val);
      await ev(async () => { await runAll(['B3'], { quiet: true }); showResult('B3'); }); await page.waitForTimeout(800);
      return ev(() => { const r = store.results.B3.response.result; const c = r.lines.find((l) => l.kind === 'current_car'); const t = document.querySelector('main').innerText.replace(/ /g, ' ');
        return { v0: c.value_today_chf, src: c.value_today_source, sale: (t.match(/Sale of your current car\n([^\n]*)/) || [])[1], cash: (t.match(/Cash you need today\n[^\n]*\n[^\n]*\n([^\n]*)\n/) || [])[1] }; });
    };
    const e = await cash(null), z = await cash(0), u = await cash(15000);
    check('empty price: our estimate, labelled', e.src === 'estimate' && /estimate/i.test(e.sale || ''), e);
    check('zero: kept as 0, your value, cash = full price', z.v0 === 0 && z.src === 'user' && /your value/.test(z.sale || '') && z.cash === '20’000', z);
    check('own value 15’000: your value, cash 5’000', u.v0 === 15000 && u.src === 'user' && u.cash === '5’000', u);
    await ev(() => { resetAll(); startBarrier('B3'); }); await page.waitForTimeout(300);
    const q8 = await ev(async () => { store.profile.current_car.targa_id = '1BB439'; ui.flow = { history: [], forced: [8], current: null, single: true }; ui.barrier = 'EDIT'; gotoBlock(8); await new Promise((r) => setTimeout(r, 300)); return document.querySelector('main').innerText; });
    check('AutoScout: says not available, no estimate shown as AutoScout', /AutoScout24 estimate: not available/.test(q8) && !/AutoScout24 estimate: (about )?CHF/.test(q8), (q8.match(/AutoScout[^\n]*/) || [])[0]);
    await ev(() => { resetAll(); go('landing'); }); await page.waitForTimeout(7500);
    const start = await ev(() => ({ t: document.querySelector('.landing')?.textContent || '', why: !!document.querySelector('.lp-why'), modal: !!document.querySelector('[role="dialog"], .modal') }));
    check('Start: no "Recurring monthly update", tables date shown', !/Recurring monthly update/i.test(start.t) && /Tables last checked: 23 Nov 2026/.test(start.t), start.t.slice(-400));
    check('Start: chatbot comparison only behind its button', start.why && !start.modal, start);
    await page.screenshot({ path: '/tmp/start_390.png', fullPage: true });
    await browser.close(); }
  // ---------- 3. chat launcher over the main buttons ----------
  for (const vw of [390, 1366]) {
    const { browser, page, ev } = await session(vw);
    await ev(() => seed(true)); await ev(async () => { await runAll(['B4', 'B3'], { quiet: true }); });
    const views = { home: () => go('home'), topics: () => go('topics'), question: () => startBarrier('B1'), costs: () => showResult('B3'), summary: () => go('summary') };
    const hits = {};
    for (const [k, f] of Object.entries(views)) {
      await ev(f); await page.waitForTimeout(700);
      // scroll through the page; at each position no visible main control may sit under the launcher
      hits[k] = await ev(async () => {
        const L = document.querySelector('.bubble'); if (!L) return 'no launcher';
        const sel = '.btn.primary, .qnav .btn, .lp-go, .sharebtn, .endnav .btn, .topicbtn, .seg button, .chip, input, select';
        const bad2 = []; const shown = window.__shown = window.__shown || { on: 0, total: 0 }; const H = document.documentElement.scrollHeight;
        for (let y = 0; y <= H; y += Math.round(innerHeight * 0.5)) {
          scrollTo(0, y); await new Promise((r) => setTimeout(r, 400));
          shown.total++; if (L.classList.contains('cover') || L.classList.contains('tuck')) continue; shown.on++;
          const l = L.getBoundingClientRect();
          for (const el of document.querySelectorAll(sel)) { const r = el.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
            const ix = Math.max(0, Math.min(r.right, l.right) - Math.max(r.left, l.left)), iy = Math.max(0, Math.min(r.bottom, l.bottom) - Math.max(r.top, l.top));
            // a control is blocked when the launcher covers its centre or more than a third of it
            const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
            if ((cx > l.left && cx < l.right && cy > l.top && cy < l.bottom) || ix * iy > (r.width * r.height) / 3) bad2.push(`${(el.innerText || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30)} @${y}`); } }
        scrollTo(0, 0); return [...new Set(bad2)];
      });
    }
    const blocked = Object.entries(hits).filter(([, v]) => v !== 'no launcher' && v.length);
    console.log('launcher visible at', vw, 'px:', JSON.stringify(await ev(() => window.__shown)));
    check(`launcher leaves the main controls free at ${vw} px`, !blocked.length, hits);
    await browser.close();
  }
  // ---------- 4. slow, missing and failing answers ----------
  { const { browser, page, ev } = await session(390, { slow: 12000 });
    await ev(() => seed(true)); const t0 = Date.now();
    await ev(() => { calculate('B3'); }); await page.waitForTimeout(1500);
    const mid = await ev(() => ({ view: ui.view, txt: document.querySelector('main')?.innerText.slice(0, 200) }));
    check('slow workflow (12 s): a loading screen, no error', mid.view === 'loading', mid);
    await page.waitForFunction(() => ui.view === 'result', null, { timeout: 40000 }).catch(() => {});
    check('slow workflow: the result arrives', (await ev(() => ui.view)) === 'result', Date.now() - t0);
    await browser.close(); }
  { const { browser, page, ev } = await session(390, { fail: true });
    await ev(() => seed(true)); await ev(() => calculate('B3')); await page.waitForTimeout(3000);
    const st = await ev(() => ({ view: ui.view, txt: document.querySelector('main')?.innerText.replace(/\s+/g, ' ').slice(0, 300), retry: [...document.querySelectorAll('button')].some((b) => /try again|retry/i.test(b.innerText)) }));
    check('workflow error: error page with retry, answers kept', st.view === 'error' && st.retry, st);
    check('workflow error: answers still there', await ev(() => store.profile.current_car.value_today_chf === 15000), null);
    await browser.close(); }
  { const { browser, page, ev } = await session(390, { chatDown: true });
    await ev(async () => { resetAll(); Assistant.open(); await Assistant.send('I drive a BMW'); }); await page.waitForTimeout(1500);
    const m = await ev(() => ({ last: Assistant.msgs.slice(-1)[0]?.text || '', busy: Assistant.busy }));
    check('chat down: says so and the guided questions stay available', !m.busy && /not available|try again|questions/i.test(m.last), m);
    await browser.close(); }
  // ---------- 5. payback present, absent, not computable ----------
  { const { browser, page, ev } = await session(390);
    const pb = async (patch) => { await ev((pt) => { seed(true, (p) => Object.assign(p.cost_assumptions, pt)); }, patch); await ev(async () => { await runAll(['B3'], { quiet: true }); showResult('B3'); }); await page.waitForTimeout(700);
      return ev(() => ({ row: (document.querySelector('main').innerText.replace(/ /g, ' ').match(/When does it pay off\?\n([^\n]*)/) || [])[1], M: b3Model(store.results.B3.response.result).payback })); };
    const yes = await pb({}), no = await pb({ residual_ev_chf: 1000, maintenance_ev_chf_year: 4000, insurance_ev_chf_year: 3000 });
    check('payback present: "in year 1"', /in year 1/.test(yes.row || ''), yes);
    check('payback absent: "not within N years"', /not within \d+ years/.test(no.row || '') && no.M == null, no);
    const nd = await ev(() => { const r = JSON.parse(JSON.stringify(store.results.B3.response.result)); for (const l of r.lines) for (const y of l.years) if (y.n > 2) y.saving_vs_current = null; return { p: b3Model(r).payback, gaps: b3Model(r).gapYears }; });
    check('payback not computable: no year, years without data listed', nd.p == null && nd.gaps.length > 0, nd);
    await browser.close(); }
  console.log('PASS', ok.length); ok.forEach((x) => console.log('  ok  ', x));
  console.log('FAIL', bad.length); bad.forEach((x) => console.log('  FAIL', x));
})();
