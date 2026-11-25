// Regression checks on the preview build (390 px unless VW is set), test profile P.
const { open, FX } = require('./harness.js');
const fs = require('fs');
const OUT = process.env.OUT || '/tmp/rg/'; fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(...a);
(async () => {
  const { browser, page } = await open({ delay: 120 });
  const ev = (f, a) => page.evaluate(f, a);
  const sent = []; page.on('request', (rq) => { if (rq.url().includes('/webhook/navigator')) { try { sent.push(JSON.parse(rq.postData())); } catch { } } });
  const seed = () => ev((F) => { store.profile = sanitizeProfile(F.profile); for (const [c, resp] of Object.entries(F.fx)) { const r = JSON.parse(JSON.stringify(resp)); store.results[c] = { response: r, request_id: 'p' + c, at: Date.now(), session: c === 'B2' ? { barrier: BARRIERS[c].name, charging_interest: ['everyday', 'trips_ch', 'abroad'] } : { barrier: BARRIERS[c].name }, sig: inputSig(store.profile, c) }; } store.queue = ['B1', 'B2', 'B3']; store.visited = ['B1', 'B2', 'B3', 'B4', 'B6', 'B7']; saveResults(); saveStore(); go('home'); }, FX);
  await seed();
  // 1 saved profile: reload, open Charging, "Edit your trips" in the Abroad block
  await page.reload(); await page.waitForTimeout(500);
  await ev(() => showResult('B2')); await page.waitForTimeout(400);
  const abroadBtn = page.locator('button', { hasText: 'Edit your trips' });
  log('1 saved: abroad edit button', await abroadBtn.count());
  await ev(() => { const f = document.getElementById('fullan'); if (f) f.open = true; });
  if (await abroadBtn.count()) { await abroadBtn.first().click(); await page.waitForTimeout(400); }
  const rows = await ev(() => [...document.querySelectorAll('.trip .tl b')].map((e) => e.textContent));
  log('1 saved: trip rows in edit view', JSON.stringify(rows), 'view', await ev(() => ui.view));
  await page.screenshot({ path: OUT + '1_edit_saved.png', fullPage: true });
  // 2 edit the trip abroad
  const ix = rows.findIndex((t) => /Firenze/.test(t));
  if (ix >= 0) {
    await page.locator('.trip').nth(ix).locator('button', { hasText: 'Edit' }).click(); await page.waitForTimeout(200);
    await page.fill('#tf-place', 'Lyon, France'); await page.fill('#tf-label', 'Holiday Lyon'); await page.click('#trip-save'); await page.waitForTimeout(200);
    log('2 draft after edit', JSON.stringify(await ev(() => ui.draft.trips.map((t) => [t.label, t.dest_location, !!t.routing]))));
    const rc = page.locator('#recalc'); log('2 recalc enabled', await rc.isEnabled()); await rc.click(); await page.waitForTimeout(1500);
    log('2 profile after recalc', JSON.stringify(await ev(() => store.profile.trips.map((t) => [t.label, t.dest_location]))), 'view', await ev(() => ui.view + ' ' + ui.barrier), 'results kept', JSON.stringify(await ev(() => Object.keys(store.results))));
    log('2 last request trips', JSON.stringify((sent[sent.length - 1]?.profile?.trips || []).map((t) => t.label)));
  }
  // 3 delete the trip abroad
  await ev(() => Questions.openEdit('B2')); await page.waitForTimeout(300);
  const rows2 = await ev(() => [...document.querySelectorAll('.trip .tl b')].map((e) => e.textContent));
  const ix2 = rows2.findIndex((t) => /Lyon|Firenze/.test(t));
  log('3 rows', JSON.stringify(rows2));
  if (ix2 >= 0) { await page.locator('.trip').nth(ix2).locator('button', { hasText: 'Delete' }).click(); await page.waitForTimeout(200);
    log('3 recalc enabled', await page.locator('#recalc').isEnabled()); await page.click('#recalc'); await page.waitForTimeout(1500);
    log('3 profile after delete', JSON.stringify(await ev(() => store.profile.trips.map((t) => t.label))), 'last request trips', JSON.stringify((sent[sent.length - 1]?.profile?.trips || []).map((t) => t.label))); }
  await page.screenshot({ path: OUT + '3_after_delete.png', fullPage: false });
  // 4 reset, then refresh
  await ev(() => go('reset')); await page.waitForTimeout(300);
  await page.locator('.qnav button', { hasText: 'Delete' }).click(); await page.waitForTimeout(500);
  await page.reload(); await page.waitForTimeout(800);
  log('4 after reset+refresh', JSON.stringify(await ev(() => ({ trips: store.profile.trips.length, results: Object.keys(store.results), queue: store.queue, pc: store.profile.postal_code, ls: Object.keys(localStorage), badge: document.querySelector('.badge')?.textContent || null, yourResults: !![...document.querySelectorAll('button')].find((b) => b.textContent.includes('Your results')) }))));
  await page.screenshot({ path: OUT + '4_after_reset.png', fullPage: false });
  // 5 new profile: question "What would you like to drive?"
  await ev(() => { ui.barrier = 'B3'; store.session = { barrier: BARRIERS.B3.name }; ui.flow = { history: [], forced: null, current: null }; gotoBlock(9); }); await page.waitForTimeout(400);
  await page.screenshot({ path: OUT + '5_block9.png', fullPage: true });
  log('5 block9 next disabled before', await page.locator('#qnext').isDisabled());
  await page.locator('.chips button', { hasText: 'Medium-sized car' }).click(); await page.locator('.chips button', { hasText: 'Used' }).click(); await page.fill('#ev-price', '24000'); await page.waitForTimeout(150);
  log('5 block9 next enabled after', await page.locator('#qnext').isEnabled(), JSON.stringify(await ev(() => ui.draft.target_ev)));
  log('errors', JSON.stringify(page.errors));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
