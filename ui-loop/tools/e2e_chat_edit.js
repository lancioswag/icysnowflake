// 25 Nov (Amos brief, 1): the BMW–Mégane path starting from the chat, then a change of the selling price in Your answers.
// The chat answer is the real one from C – Assist (/assist-claude, n8n execution 16757); B3 is computed with the code deployed to
// T – B3 (n8n/test/b3_7_costs.js) on the captured inputs, with the profile the app sends; B4 comes from fixtures/christian_mu.json.
// Run (server on :8765): APP_URL=http://localhost:8765/preview/index.html FXFILE=fixtures/christian_mu.json node e2e_chat_edit.js
const fs = require('fs'), path = require('path');
const { open, FX } = require('./harness.js');
const CHAT = { status: 'ok', answer: 'I can check how the car and costs may fit your situation; I’ll ask a few short questions here in the chat.', sources: [], proposed_change: null, start_check: ['B3', 'B4'],
  patch: { postal_code: '8001', car_brand: 'BMW', car_model: '530xd', car_fuel: 'diesel', car_mileage_km: 150000, car_first_registration_year: 2015, car_sale_price_chf: 15000, ev_size: 'medium', ev_purchase: 'used', ev_price_chf: 20000 }, model_used: 'openai:gpt-6-luna' };
const B3CODE = fs.readFileSync(path.join(__dirname, '../../n8n/test/b3_7_costs.js'), 'utf8');
const INP = JSON.parse(fs.readFileSync(path.join(__dirname, 'b3local/input_christian.json'), 'utf8'));
const b3For = (profile) => { const inp = JSON.parse(JSON.stringify(INP)); inp.profile = JSON.parse(JSON.stringify(profile)); return new Function('$input', B3CODE)({ first: () => ({ json: inp }) })[0].json; };
(async () => {
  const { browser, page } = await open({ delay: 30 });
  const calls = []; const ok = []; const bad = [];
  const check = (name, cond, info) => (cond ? ok : bad).push(name + (cond ? '' : ' → ' + JSON.stringify(info)));
  await page.route('**/webhook/assist-claude', (r) => { calls.push('assist-claude'); r.fulfill({ contentType: 'application/json', body: JSON.stringify(CHAT) }); });
  await page.route('**/webhook/assist-v2', (r) => { calls.push('assist-v2'); r.fulfill({ status: 500, body: 'not used' }); });
  await page.route('**/webhook/navigator*', async (r) => {
    const b = JSON.parse(r.request().postData() || '{}'); calls.push(new URL(r.request().url()).pathname + ' ' + b.session?.barrier);
    const res = b.session?.barrier === 'B3 Costs' ? b3For(b.profile) : JSON.parse(JSON.stringify(FX.fx.B4));
    res.profile = b.profile; r.fulfill({ contentType: 'application/json', body: JSON.stringify(res) });
  });
  const ev = (f, a) => page.evaluate(f, a);
  const paths = await ev(() => ({ ...CONFIG.paths, storageKey: CONFIG.storageKey }));
  check('preview calls /navigator-test (T – copy) and /assist-claude', paths.navigator === '/navigator-test' && paths.assist === '/assist-claude', paths);
  // 1. chat
  await ev(async () => { resetAll(); Assistant.open(); await Assistant.send('I drive a 2015 BMW 530xd diesel with 150000 km and live in 8001 Zurich. I could sell it for 15000. I am looking at a used medium electric car for about 20000 and drive about 10000 km a year.'); });
  await page.waitForTimeout(1500);
  const chat = await ev(() => ({ noted: Assistant.msgs.find((m) => /^Noted:/.test(m.text || ''))?.text || '', p: store.profile, saved: JSON.parse(localStorage.getItem(CONFIG.storageKey) || '{}').profile }));
  check('chat confirms what it understood', /selling price CHF.15’000/.test(chat.noted.replace(/ /g, ' ')) && /Mid-size car, used, about CHF.20’000/.test(chat.noted.replace(/ /g, ' ')), chat.noted);
  check('chat fields in the answers', chat.p.current_car.value_today_chf === 15000 && chat.p.current_car.odometer_km === 150000 && chat.p.target_ev.size === 'M' && chat.p.target_ev.purchase === 'used' && chat.p.target_ev.price_chf === 20000, { cc: chat.p.current_car, ev: chat.p.target_ev });
  check('chat fields saved in the browser', chat.saved?.current_car?.value_today_chf === 15000 && chat.saved?.target_ev?.price_chf === 20000, chat.saved?.current_car);
  // 2. result. The chat then asks for trips and charging; those answers of the example are set directly (house owner, charging at home:
  // no installation). Before them the app assumes a wallbox is needed (CHF 2'750 installation, shown as its own row).
  await ev(async () => { const p = clone(store.profile); const X = Example.profile(false); p.trips = X.trips; for (const k of ['home_charging_status', 'fixed_parking', 'housing_type', 'charging_at_work', 'everyday_charging']) p[k] = X[k]; store.profile = sanitizeProfile(p); store.carLabels[p.current_car.targa_id] = store.carLabels[p.current_car.targa_id] || 'BMW 530xd'; saveStore(); Assistant.close && Assistant.close(); ui.assistantOpen = false; store.yearsKept = 5; await runAll(['B4', 'B3'], { quiet: true }); showResult('B3'); });
  await page.waitForTimeout(1500);
  const txt = () => ev(() => document.querySelector('main').innerText.replace(/ /g, ' '));
  let c = await txt();
  check('Costs: price 20’000, sale 15’000, cash 5’000', /20’000/.test(c) && /−15’000/.test(c) && /Cash you need today[\s\S]{0,80}5’000/.test(c), (c.match(/Cash you need today[\s\S]{0,80}/) || [])[0]);
  check('Costs: no installation (charging at home)', /Other upfront costs[\s\S]{0,30}none[\s\S]{0,10}0\s*0/.test(c), (c.match(/Other upfront costs[\s\S]{0,40}/) || [])[0]);
  // 3. change the selling price in Your answers
  await ev(() => go('answers')); await page.waitForTimeout(400);
  await page.locator('.ansrow', { hasText: 'Your car' }).click(); await page.waitForTimeout(400);
  await page.locator('.qnav .btn.primary').first().click(); await page.waitForTimeout(400);   // block 7: the car stays
  await page.fill('#cc-val', '12000'); await page.waitForTimeout(200);
  await page.locator('.qnav .btn.primary').first().click(); await page.waitForTimeout(2500);  // block 8: recalculates stale topics
  const after = await ev(() => ({ v: store.profile.current_car.value_today_chf, view: ui.view, res: Object.keys(store.results) }));
  check('selling price changed to 12’000', after.v === 12000, after);
  await ev(() => showResult('B3')); await page.waitForTimeout(800); c = await txt();
  check('Costs: sale 12’000, cash 8’000', /−12’000/.test(c) && /Cash you need today[\s\S]{0,80}8’000/.test(c), (c.match(/Cash you need today[\s\S]{0,80}/) || [])[0]);
  await ev(() => go('summary')); await page.waitForTimeout(800); const s = await txt();
  check('Summary: CHF 8’000 upfront', /you pay CHF 8’000 upfront/.test(s), (s.match(/Over 5 years[^\n]*/) || [])[0]);
  const pdf = await ev(() => JSON.stringify(Report.doc(Summary.codes())) + JSON.stringify(Report.onePager(null)));
  check('PDFs: sale 12’000 and cash 8’000', /12’000/.test(pdf) && /8’000/.test(pdf), null);
  check('requests went to the copies', calls.includes('assist-claude') && calls.some((x) => x.startsWith('/webhook/navigator-test')) && !calls.includes('assist-v2'), calls);
  console.log('PASS', ok.length, ok); console.log('FAIL', bad.length, bad); console.log('errors', page.errors);
  await browser.close();
})();
