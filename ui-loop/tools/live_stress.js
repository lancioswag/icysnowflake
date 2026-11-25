/* 25 Nov 2026 – live stress test for the BEV Navigator preview (/preview/, TEST copy of n8n).
   Runs INSIDE the page (built-in browser):  const m = await import('/preview/stress.js'); await m.run('S1');
   Every scenario uses synthetic profiles only. Results go to window.STRESS and sessionStorage 'stress.log'.
   No secrets, no personal data. */
// App objects (store, ui, CONFIG, …) are global lexical names of the page script: modules see them by name.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const txt = () => document.querySelector('main')?.innerText || '';
const until = async (f, ms = 90000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (f()) return true; } catch { } await sleep(400); } return false; };
const resp = (c) => store.results[c]?.response || null;
const lineOf = (r, pred) => (r?.result?.lines || []).find(pred) || null;
const yearN = (l, n) => l?.years?.find((y) => y.n === n) || null;
const mid = (b) => (b ? (b.min + b.max) / 2 : null);
const fmtA = (x) => fmt.n(Math.round(x / 10) * 10);            // same rounding as the cost blocks (CHF 10)
const noNaN = () => !/NaN|undefined|\[object Object\]|null null/.test(txt());
const overflow = () => document.documentElement.scrollWidth - innerWidth;
const log = (name, checks, info = {}) => {
  const rec = { name, at: new Date().toISOString(), viewport: `${innerWidth}x${innerHeight}`, pass: checks.filter((c) => c[1]).length, fail: checks.filter((c) => !c[1]).map((c) => c[0] + (c[2] !== undefined ? ` → ${JSON.stringify(c[2]).slice(0, 300)}` : '')), info };
  const all = JSON.parse(sessionStorage.getItem('stress.log') || '[]'); all.push(rec); sessionStorage.setItem('stress.log', JSON.stringify(all));
  (window.STRESS = window.STRESS || {})[name] = rec; return rec;
};
const fresh = () => { resetAll(); try { localStorage.removeItem(CONFIG.storageKey); localStorage.removeItem(CONFIG.storageKey + '.results'); } catch { } go('home'); };
const runAllQ = async (codes) => { const b = await runAll(codes, { quiet: true }); return b; };
const show = async (c) => { showResult(c); await sleep(700); document.querySelectorAll('main details').forEach((d) => { d.open = true; }); await sleep(250); return txt(); };
const pdfText = () => JSON.stringify(Report.doc(Summary.codes()));
const carId = (keyRe, yearWanted) => {   // a version from cars.json, closest approval to the year
  const k = Object.keys(CARS.data).find((x) => keyRe.test(x)); if (!k) return null;
  const vs = CARS.data[k]; const y = (l) => Number((String(l).match(/approved (\d{4})/) || [])[1] || 0);
  const best = vs.slice().sort((a, b) => Math.abs(y(a[0]) - yearWanted) - Math.abs(y(b[0]) - yearWanted))[0];
  return { key: k, id: best[1], label: best[0] };
};

export const SCEN = {
  // Christian's TCO Word, every input as a user value: must give 41'090 / 29'950 / 11'140 and CHF 5'000 cash
  async S1() {
    fresh(); store.profile = sanitizeProfile(Example.profile(true)); store.carLabels['1BB439'] = 'BMW 530xd'; store.example = 'bmw-megane'; store.yearsKept = 5; store.queue = ['B4', 'B3']; saveStore();
    const b = await runAllQ(['B4', 'B3']);
    const r = resp('B3'); const cur = lineOf(r, (l) => l.kind === 'current_car'); const ev = lineOf(r, (l) => l.kind === 'option' && l.price_source === 'user');
    const yc = yearN(cur, 5), ye = yearN(ev, 5);
    const costs = await show('B3'); const b4 = await show('B4');
    go('summary'); await sleep(1500); const sum = txt(); const pdf = pdfText();
    return log('S1 Christian Word inputs', [
      ['n8n ok B4+B3', b && !b.need.length, b?.need],
      ['payload BMW 5-year TCO 41090', mid(yc?.total_over_n) === 41090, yc?.total_over_n],
      ['payload Mégane 5-year TCO 29950', mid(ye?.total_over_n) === 29950, ye?.total_over_n],
      ['payload difference 11140', mid(ye?.saving_vs_current) === 11140, ye?.saving_vs_current],
      ['payload cash 5000', mid(ev?.cash_need_today_chf) === 5000, ev?.cash_need_today_chf],
      ['payload per year 8218 / 5990', mid(yc?.total_per_year) === 8218 && mid(ye?.total_per_year) === 5990, [yc?.total_per_year, ye?.total_per_year]],
      ['Costs shows 41’090 and 29’950', costs.includes('41’090') && costs.includes('29’950')],
      ['Costs shows CHF 11’140 less', /CHF.11’140 less/.test(costs)],
      ['Costs shows cash 5’000', /Cash you need today[\s\S]{0,80}5’000/.test(costs)],
      ['Costs energy formula with units', /10’000 km a year at 8\.6 l per 100 km and CHF.2\.30 per litre/.test(costs) && /18(\.0)? kWh per 100 km and CHF.0\.35 per kWh/.test(costs)],
      ['Costs payback answer', /Pays off in year 1/.test(costs)],
      ['Lifestyle match is the chosen type', /Sedan or estate/.test(b4.slice(0, 200))],
      ['Summary same horizon and amount', /Over 5 years[^.]*CHF.11’140 less/.test(sum), sum.slice(0, 600)],
      ['Summary keeps Medium + used + price', /Sedan or estate, used, about CHF.20’000/.test(sum)],
      ['PDF same figures', pdf.includes('41’090') && pdf.includes('29’950') && pdf.includes('11’140') && pdf.includes('5’000')],
      ['PDF same payback wording', pdf.includes('Pays off in year 1')],
      ['no NaN / null text', noNaN()],
      ['no horizontal overflow', overflow() <= 1, overflow()],
    ], { cur: yc?.items, ev: ye?.items });
  },
  // Same cars with the app's own data: report each line next to Christian's
  async S2() {
    fresh(); store.profile = sanitizeProfile(Example.profile(false)); store.carLabels['1BB439'] = 'BMW 530xd'; store.yearsKept = 5; store.queue = ['B4', 'B3']; saveStore();
    const b = await runAllQ(['B4', 'B3']);
    const r = resp('B3'); const cur = lineOf(r, (l) => l.kind === 'current_car'); const ev = lineOf(r, (l) => l.kind === 'option' && l.price_source === 'user');
    const yc = yearN(cur, 5), ye = yearN(ev, 5); const costs = await show('B3');
    const wordC = { vehicle: 2000, interest: 300, energy: 1978, tax: 600, insurance: 900, maintenance: 2400, vignette: 40 }, wordE = { vehicle: 2400, interest: 420, energy: 630, tax: 300, insurance: 1000, maintenance: 1200, vignette: 40 };
    const rows = Object.keys(wordC).map((k) => ({ item: k, bmw_word: wordC[k], bmw_app: yc?.items?.[k], megane_word: wordE[k], megane_app: ye?.items?.[k] }));
    return log('S2 Same cars, app data', [
      ['n8n ok', b && !b.need.length, b?.need],
      ['payload has both lines', !!yc && !!ye],
      ['cash 5000 (same prices)', mid(ev?.cash_need_today_chf) === 5000, ev?.cash_need_today_chf],
      ['Costs shows a difference', /Difference over 5 years/.test(costs)],
      ['no NaN / null text', noNaN()],
    ], { rows, totals: { bmw: mid(yc?.total_over_n), megane: mid(ye?.total_over_n), diff: mid(ye?.saving_vs_current) }, energy: { bmw: cur?.energy_detail, ev: ev?.energy_detail } });
  },
  // Petrol regression, all five topics in one go (multiple selection), then each topic page
  async S3() {
    fresh(); await CARS.versions('VOLKSWAGEN', 'GOLF'); await until(() => CARS.data, 20000);
    const golf = carId(/^VOLKSWAGEN\|GOLF \(petrol\)$/i, 2019) || carId(/^VOLKSWAGEN\|GOLF/i, 2019);
    const p = emptyProfile();
    Object.assign(p, { postal_code: '9000', charging_at_work: 'parking_no_charger', work_postal_code: '8400', home_charging_status: 'no', fixed_parking: 'yes', housing_type: 'tenant' });
    p.current_car = { ...p.current_car, targa_id: golf?.id, first_registration: '2019-04', odometer_km: 90000 };
    p.target_ev = { ...p.target_ev, size: 'M', purchase: 'new' };
    p.trips = [{ trip_type: 'commute', label: 'Commute', freq_n: 4, freq_unit: 'week' }, { trip_type: 'other', label: 'Grandparents in Lugano', dest_location: '6900 Lugano', freq_n: 6, freq_unit: 'year', seats_needed: 4, trailer: 'none' }];
    store.profile = sanitizeProfile(p); store.carLabels[golf?.id] = 'VW Golf'; store.queue = ['B1', 'B2', 'B3', 'B4', 'B7']; saveStore();
    const b = await runAllQ(['B1', 'B2', 'B3', 'B4', 'B7']);
    const pages = {}; for (const c of ['B1', 'B2', 'B3', 'B4', 'B7']) pages[c] = resp(c) ? (await show(c)).slice(0, 200) : null;
    const cur = lineOf(resp('B3'), (l) => l.kind === 'current_car');
    go('summary'); await sleep(1500); const sum = txt();
    let blobOk = false; try { const bl = await Report.blob(Summary.codes()); blobOk = bl && bl.size > 20000; } catch (e) { blobOk = String(e); }
    return log('S3 Petrol regression, five topics', [
      ['car found in cars.json', !!golf, golf],
      ['all five topics ok', b && !b.need.length, b?.need],
      ['B3 reference is petrol', cur?.energy_detail?.kind === 'petrol', cur?.energy_detail],
      ['every topic page renders', Object.values(pages).every((t) => t && !/could not be shown/.test(t)), pages],
      ['Summary lists five topics', ['Range', 'Charging', 'Costs', 'Lifestyle', 'Climate'].every((k) => sum.includes(k))],
      ['full PDF builds (>20 KB)', blobOk === true, blobOk],
      ['no NaN / null text', noNaN()],
      ['no horizontal overflow', overflow() <= 1, overflow()],
    ], { golf, payback: resp('B3')?.result?.lines?.filter((l) => l.kind === 'option').map((l) => [l.line_id, l.payback_year]) });
  },
  // Budget that no used sedan or estate can meet: the limit and the reason must be explained
  async S4() {
    fresh(); const p = Example.profile(false); p.target_ev = { size: 'M', purchase: 'used', price_chf: 25000, extra_cash_chf: 0 }; p.current_car.value_today_chf = 6000;
    store.profile = sanitizeProfile(p); store.carLabels['1BB439'] = 'BMW 530xd'; store.yearsKept = 5; store.queue = ['B4', 'B3']; saveStore();
    const b = await runAllQ(['B4', 'B3']); const b4 = await show('B4'); const costs = await show('B3');
    const B = budget();
    return log('S4 Incompatible budget', [
      ['n8n ok', b && !b.need.length, b?.need],
      ['budget = sale + extra cash (6000)', B.max === 6000 && B.by === 'cash', B],
      ['Lifestyle match explains the limit', /Your budget today: CHF.6’000[\s\S]{0,200}none of our cars of this type fits/.test(b4), b4.slice(0, 700)],
      ['Costs shows extra cash short', /Extra cash you can add[\s\S]{0,60}short/.test(costs)],
      ['no NaN / null text', noNaN()],
    ]);
  },
  // Missing data: no postal code and no mileage → the app asks, it does not calculate with 0
  async S5() {
    fresh(); const p = Example.profile(false); p.postal_code = null; p.current_car.odometer_km = null;
    store.profile = sanitizeProfile(p); store.carLabels['1BB439'] = 'BMW 530xd'; saveStore();
    calculate('B3'); await until(() => ui.view !== 'loading', 90000); await sleep(600);
    const t = txt();
    return log('S5 Missing data', [
      ['no error page', ui.view !== 'error', ui.view],
      ['asks for the missing answer', ui.view === 'question' || /postal code|Where do you live|mileage/i.test(t), ui.view + ' ' + t.slice(0, 300)],
      ['no result with zero', !store.results.B3],
    ]);
  },
  // Scenario change in Costs: what-if first, then "Make this my choice" updates Summary
  async S6() {
    await SCEN.S1(); showResult('B3'); await sleep(600);
    const other = b3Model(resp('B3').result).P.classes.find((c) => c[0] === 'L');
    ui.b3Cls = other; render(); await sleep(500); const t1 = txt();
    const before = evChoiceText();
    const btn = [...document.querySelectorAll('main button')].find((x) => /Make this my choice/.test(x.textContent)); btn?.click();
    await until(() => ui.view === 'result' && ui.barrier === 'B3' && store.profile.target_ev?.size === 'L', 90000); await sleep(800);
    go('summary'); await sleep(1200); const sum = txt();
    return log('S6 Scenario change in Costs', [
      ['size-up class offered', !!other, b3Model(resp('B3').result).P.classes],
      ['what-if label shown', /What-if, only on this page/.test(t1)],
      ['Summary unchanged during what-if', before.startsWith('Sedan or estate')],
      ['Make this my choice saves it', store.profile.target_ev?.size === 'L', store.profile.target_ev],
      ['Summary shows the new choice', /Minivan/.test(sum)],
    ]);
  },
  // Foreign trip: add, change, delete; dependent results follow
  async S7() {
    fresh(); const p = Example.profile(false);
    p.trips.push({ trip_type: 'other', label: 'Holiday in Paris', dest_location: 'Paris, France', freq_n: 2, freq_unit: 'year', seats_needed: 4, trailer: 'none' });
    store.profile = sanitizeProfile(p); store.carLabels['1BB439'] = 'BMW 530xd'; store.queue = ['B1', 'B3']; saveStore();
    const b = await runAllQ(['B1', 'B3']);
    const trips0 = resp('B1')?.result?.trips?.length ?? resp('B1')?.result?.rows?.length;
    const br0 = lineOf(resp('B3'), (l) => l.kind === 'option' && l.selected)?.bridging || [];
    const sig0 = store.results.B3?.sig;
    showResult('B3'); await sleep(400);
    setField('trips.1.freq_n', 5); await until(() => ui.view === 'result' && store.results.B3?.sig !== sig0, 90000); await sleep(600);
    const br1 = lineOf(resp('B3'), (l) => l.kind === 'option' && l.selected)?.bridging || [];
    const costs1 = txt();
    const sig1 = store.results.B3?.sig;
    ui.barrier = 'B3';
    const t = clone(store.profile); t.trips = t.trips.filter((x) => !/Paris/.test(x.label)); store.profile = sanitizeProfile(t); dropStaleResults(); saveStore();
    const staleGone = !store.results.B3 || store.results.B3.sig !== sig1;
    await calculate('B3'); await until(() => ui.view === 'result', 90000); await sleep(500);
    const br2 = lineOf(resp('B3'), (l) => l.kind === 'option' && l.selected)?.bridging || [];
    return log('S7 Foreign trip added, changed, deleted', [
      ['n8n ok', b && !b.need.length, b?.need],
      ['trip routed (B1 has the trip)', JSON.stringify(resp('B1')?.result || {}).includes('Paris')],
      ['change recalculated Costs', sig1 !== sig0],
      ['bridging follows the frequency', JSON.stringify(br1) !== JSON.stringify(br0) || br0.length === 0, { br0, br1 }],
      ['bridging explains why', br1.length === 0 || (br1[0].why && br1[0].why.frequency), br1[0]?.why],
      ['Costs page lists the trip', br1.length === 0 || /Trips by other transport[\s\S]{0,400}Paris/.test(costs1)],
      ['delete drops the old result', staleGone],
      ['after delete no Paris bridging', !JSON.stringify(br2).includes('Paris'), br2],
    ], { br0, br1, br2 });
  },
  // Back keeps answers; refresh keeps answers (two calls: S9a before reload, S9b after); reset clears
  async S8() {
    fresh(); startBarrier('B2'); await sleep(500); const first = ui.flow?.current;
    ui.draft.postal_code = '8001'; render(); await sleep(200);
    const next = document.querySelector('main .btn.primary.block');
    next?.click(); await sleep(900); const second = ui.flow?.current;
    appBack(); await sleep(900);
    const kept = (ui.draft || store.profile).postal_code;
    return log('S8 Back keeps answers', [
      ['moved forward', second !== first, [first, second]],
      ['back to first question', ui.flow?.current === first, ui.flow?.current],
      ['answer kept', kept === '8001', kept],
    ]);
  },
  async S9a() { await SCEN.S1(); sessionStorage.setItem('stress.s9', JSON.stringify({ q: store.queue, res: Object.keys(store.results), y: store.yearsKept })); return 'reload now'; },
  async S9b() {
    const was = JSON.parse(sessionStorage.getItem('stress.s9') || '{}'); await sleep(500);
    const ok1 = JSON.stringify(Object.keys(store.results).sort()) === JSON.stringify((was.res || []).sort());
    go('summary'); await sleep(1200); const sum = txt();
    const r1 = log('S9 Refresh keeps answers and results', [['results restored', ok1, [Object.keys(store.results), was.res]], ['years kept restored', store.yearsKept === was.y, store.yearsKept], ['Summary same amount', /CHF.11’140 less/.test(sum)]]);
    resetAll(); await sleep(300);
    const r2 = log('S10 Reset clears', [['no results', !Object.keys(store.results).length], ['no answers', !store.profile.postal_code && !store.profile.current_car.targa_id], ['storage empty', !localStorage.getItem(CONFIG.storageKey + '.results') || localStorage.getItem(CONFIG.storageKey + '.results') === '{}']]);
    return [r1, r2];
  },
  // AI unavailable: guided path, verdict and PDF still work
  async S11() {
    const keep = { ...CONFIG.paths }; CONFIG.paths.assist = '/assist-off-test'; CONFIG.paths.summary = '/summary-off-test';
    try {
      await SCEN.S1(); Summary.cache = {}; go('summary'); await sleep(2500); const sum = txt();
      let chat = ''; try { Assistant.open(); await sleep(300); await Assistant.send('What does Lifestyle match mean?'); await sleep(1500); chat = Assistant.msgs.map((m) => m.text || '').join(' | '); } catch (e) { chat = 'ERR ' + e.message; }
      let blobOk = false; try { const bl = await Report.blob(Summary.codes()); blobOk = bl && bl.size > 20000; } catch (e) { blobOk = String(e); }
      ui.assistantOpen = false; render();
      return log('S11 AI unavailable', [['verdict without AI', /Calculated from your results, without AI/.test(sum)], ['amount still there', /CHF.11’140 less/.test(sum)], ['chat says it cannot answer, no crash', !/^ERR/.test(chat) && chat.length > 0, chat.slice(-300)], ['PDF builds', blobOk === true, blobOk]]);
    } finally { Object.assign(CONFIG.paths, keep); }
  },
  // Recoverable error: the topic fails, Try again works
  async S12() {
    const keep = CONFIG.paths.navigator; fresh(); store.profile = sanitizeProfile(Example.profile(false)); store.carLabels['1BB439'] = 'BMW 530xd'; saveStore();
    CONFIG.paths.navigator = '/navigator-off-test'; calculate('B2'); await until(() => ui.view !== 'loading', 90000); await sleep(400);
    const errView = ui.view, errTxt = txt();
    CONFIG.paths.navigator = keep;
    const again = [...document.querySelectorAll('main button')].find((x) => /Try again/.test(x.textContent)); again?.click();
    await until(() => ui.view === 'result', 90000);
    return log('S12 Error and retry', [['error view', errView === 'error', errView], ['says what happened', errTxt.length > 20, errTxt.slice(0, 200)], ['Try again button', !!again], ['retry gives the result', ui.view === 'result' && !!store.results.B2]]);
  },
  // PDF download without account: full report and one page
  async S13() {
    await SCEN.S1();
    let full = 0, one = 0, err = null;
    try { full = (await Report.blob(Summary.codes())).size; } catch (e) { err = e.message; }
    try { const pm = await loadPdfLib(); one = (await new Promise((ok, ko) => { try { pm.createPdf(Report.onePager(Summary.get('simple') || null)).getBlob(ok); } catch (e) { ko(e); } })).size; } catch (e) { err = (err || '') + ' ' + e.message; }
    return log('S13 PDF without account', [['not logged in', !Account?.user], ['full report > 20 KB', full > 20000, full], ['one page > 10 KB', one > 10000, one], ['no error', !err, err]]);
  },
};

// Chat: same BMW–Mégane profile in words; the chat must note what it understood, ask what is missing and take a correction.
// Parity: the same message to the team's /assist-v2 and to our copy /assist-claude gives the same shared fields.
Object.assign(SCEN, {
  async S14() {
    fresh(); Assistant.msgs = []; Assistant.count = 0; Assistant.last = 0; Assistant.open(); await sleep(300);
    const msg = 'I drive a 2015 BMW 530xd diesel with 150000 km and live in 8001 Zurich. I could sell it for 15000. I am looking at a used medium electric car for about 20000 and drive about 10000 km a year.';
    await Assistant.send(msg); await until(() => !Assistant.busy, 40000); await sleep(800);
    const p1 = clone(store.profile); const noted = Assistant.msgs.find((m) => /^Noted:/.test(m.text || ''))?.text || '';
    const asked = Assistant.msgs.filter((m) => m.block != null).map((m) => m.text);
    // correction while the check runs
    Assistant.last = 0; await Assistant.send('Sorry, the selling price is 14000, not 15000.'); await until(() => !Assistant.busy && !ChatNav.busy, 40000); await sleep(800);
    const p2 = clone(store.profile);
    // parity of the two chat workflows (shared fields only)
    const call = (path) => fetch(CONFIG.apiBase + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'chat', request_id: 'p' + Date.now(), message: msg, history: [], context: {} }) }).then((r) => r.json()).catch((e) => ({ error: String(e) }));
    const [a, b] = await Promise.all([call('/assist-v2'), call('/assist-claude')]);
    const shared = ['postal_code', 'car_brand', 'car_model', 'car_fuel', 'car_first_registration_year', 'car_mileage_km'];
    const same = shared.filter((k) => a.patch?.[k] != null || b.patch?.[k] != null).every((k) => String(a.patch?.[k]).toLowerCase() === String(b.patch?.[k]).toLowerCase());
    try { ChatNav.stop && ChatNav.stop(); } catch { } ui.assistantOpen = false; render();
    return log('S14 Chat with the BMW–Mégane profile', [
      ['notes what it understood', /selling price CHF.15’000/.test(noted) && /electric car: Sedan or estate, used, about CHF.20’000/.test(noted), noted],
      ['car and year taken', /^1BB/.test(p1.current_car.targa_id || '') && p1.current_car.first_registration?.startsWith('2015'), p1.current_car],
      ['EV class, used, price taken', p1.target_ev.size === 'M' && p1.target_ev.purchase === 'used' && p1.target_ev.price_chf === 20000, p1.target_ev],
      ['asks for missing data', asked.length > 0, asked],
      ['takes a correction (14000)', p2.current_car.value_today_chf === 14000, p2.current_car.value_today_chf],
      ['copy returns the new fields', b.patch?.car_sale_price_chf === 15000 && b.patch?.ev_size && b.patch?.ev_price_chf === 20000, b.patch],
      ['same shared fields as /assist-v2', same, { v2: a.patch, claude: b.patch }],
    ], { noted, asked });
  },
});
export async function run(name) { const f = SCEN[name]; if (!f) return 'unknown ' + name; try { return await f(); } catch (e) { return log(name + ' CRASH', [['no exception', false, e.stack || e.message]]); } }
export function results() { return JSON.parse(sessionStorage.getItem('stress.log') || '[]'); }
