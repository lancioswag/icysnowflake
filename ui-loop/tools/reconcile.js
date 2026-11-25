// 25 Nov: numeric reconciliation of Costs for a B3 answer (B3FILE): rows add up to their totals, TCO = value loss + interest + running costs,
// the bridge (net outlay + end values + running + interest) equals the difference, and payback uses the TCO difference only (no upfront cash added).
const fs = require('fs');
const { open, FX } = require('./harness.js');
(async () => {
  const b3 = JSON.parse(fs.readFileSync(process.env.B3FILE || '/tmp/b3_word.json', 'utf8'));
  const { browser, page } = await open({ delay: 30 });
  const out = await page.evaluate((B3) => {
    const p = Example.profile(B3.profile?.cost_assumptions?.residual_ev_chf != null);
    store.profile = sanitizeProfile(p); store.carLabels['1BB439'] = 'BMW 530xd'; store.yearsKept = 5;
    const r = JSON.parse(JSON.stringify(B3)); r.profile = store.profile;
    store.results.B3 = { response: r, request_id: 'pB3', at: Date.now(), session: { barrier: BARRIERS.B3.name }, sig: inputSig(store.profile, 'B3') };
    const M = b3Model(r.result); const res = [];
    const ok = (name, a, b, tol = 2) => res.push([name, Math.abs(a - b) <= tol, Math.round(a), Math.round(b)]);
    const N = M.N, e = M.e, c = M.c;
    const items = (y) => y.items;
    const lossEv = M.price - M.evEnd, lossRef = M.sale - M.refEnd;
    ok('BMW: running per year = sum of rows', M.refRun, ['energy', 'tax', 'insurance', 'maintenance', 'vignette', 'bridging'].reduce((a, k) => a + (c.items[k] || 0), 0));
    ok('BMW: TCO = value loss + interest + running', M.refTot, lossRef + M.refInt + M.refRun * N, 10);
    ok('EV: TCO = value loss + interest + running + installation', M.evTot, lossEv + M.evInt + M.evRun * N + M.install, 10);
    ok('difference = TCO BMW - TCO EV', M.saving, M.refTot - M.evTot, 10);
    ok('bridge (net outlay + end values + running + interest) = difference', M.bridge.sum, M.saving, 10);
    ok('net outlay = price + installation - sale', M.net, M.price + M.install - M.sale, 0);
    // payback: the first year from which the TCO difference stays >= 0; adding the cash outlay again would change it
    const svAt = (n) => { const y = M.ev.years.find((q) => q.n === n); return y?.saving_vs_current ? (y.saving_vs_current.min + y.saving_vs_current.max) / 2 : null; };
    const byTco = (() => { let p = null; for (let n = 8; n >= 1; n--) { const v = svAt(n); if (v == null || v < 0) break; p = n; } return p; })();
    const byCash = (() => { let p = null; for (let n = 8; n >= 1; n--) { const v = svAt(n); if (v == null || v - M.net < 0) break; p = n; } return p; })();
    res.push(['payback = TCO rule (not TCO minus cash again)', M.payback === byTco, M.payback, byTco, 'with cash counted twice it would be ' + byCash]);
    const f = (x) => Math.round(x);
    return { res, nums: { N, price: M.price, sale: M.sale, net: M.net, install: M.install, evEnd: M.evEnd, refEnd: M.refEnd, lossEv, lossRef, evInt: f(M.evInt), refInt: f(M.refInt), evRun: M.evRun, refRun: M.refRun, evTot: M.evTot, refTot: M.refTot, saving: M.saving, bridge: M.bridge, payback: M.payback, energy: [energyFormula(M.ref)?.calc, energyFormula(M.ev)?.calc] } };
  }, b3);
  console.log(JSON.stringify(out, null, 1));
  console.log(page.errors.length ? page.errors : 'no errors');
  await browser.close();
})();
