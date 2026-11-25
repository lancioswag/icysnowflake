// 25 Nov: synthetic PDF of Christian's case (BMW 530xd 2015 vs used Mégane, Word inputs, 5 years).
// B3 comes from the current n8n code run locally (b3local/run.js with christian.json); B4/B6 from fixtures/christian_mu.json.
// Run: node b3local/run.js b3local/input_christian.json "$(cat b3local/christian.json)" > /tmp/b3_word.json
//      APP_URL=http://localhost:8765/preview/index.html FXFILE=fixtures/christian_mu.json node pdf_christian.js /tmp/out.pdf
const fs = require('fs');
const { open, FX } = require('./harness.js');
(async () => {
  const b3 = JSON.parse(fs.readFileSync('/tmp/b3_word.json', 'utf8'));
  const R = process.env.B4B6 ? JSON.parse(fs.readFileSync(process.env.B4B6, 'utf8')) : null;
  const fx = { B4: R ? R.B4 : FX.fx.B4, B6: R ? R.B6 : FX.fx.B6, B3: b3 };
  const { browser, page } = await open({ delay: 30 });
  const out = await page.evaluate(async (F) => {
    const p = Example.profile(true);
    store.profile = sanitizeProfile(p); store.carLabels['1BB439'] = 'BMW 530XD (diesel)'; store.yearsKept = 5;
    for (const [c, resp] of Object.entries(F)) { const r = JSON.parse(JSON.stringify(resp)); r.profile = store.profile; store.results[c] = { response: r, request_id: 'p' + c, at: Date.now(), session: c === 'B6' ? { barrier: BARRIERS[c].name, battery_entry: 'forecast' } : { barrier: BARRIERS[c].name }, sig: inputSig(store.profile, c) }; }
    store.visited = ['B3', 'B4', 'B6']; saveResults(); saveStore();
    showResult('B3'); await new Promise((r) => setTimeout(r, 800));
    const costs = document.querySelector('main').innerText.replace(/ /g, ' ');
    go('summary'); await new Promise((r) => setTimeout(r, 900));
    const sum = document.querySelector('main').innerText.replace(/ /g, ' ');
    const doc = JSON.stringify(Report.doc(Summary.codes()));
    const b = await Report.blob(Summary.codes());
    const u = new Uint8Array(await b.arrayBuffer()); let s = ''; for (const c of u) s += String.fromCharCode(c);
    const pm = await loadPdfLib(); const ob = await new Promise((ok) => pm.createPdf(Report.onePager(Summary.get('simple') || null)).getBlob(ok));
    const u2 = new Uint8Array(await ob.arrayBuffer()); let s2 = ''; for (const c of u2) s2 += String.fromCharCode(c);
    return { b64: btoa(s), one: btoa(s2), costs, sum, doc };
  }, fx);
  fs.writeFileSync(process.argv[2] || '/tmp/christian.pdf', Buffer.from(out.b64, 'base64'));
  fs.writeFileSync((process.argv[2] || '/tmp/christian.pdf').replace(/\.pdf$/, '_one-page.pdf'), Buffer.from(out.one, 'base64'));
  const pick = (t, re) => (t.match(re) || [])[0];
  console.log(JSON.stringify({
    errors: page.errors,
    costs_cash: pick(out.costs, /Cash you need today[\s\S]{0,60}/), costs_5y: pick(out.costs, /41[’',]090|29[’',]950|11[’',]140[^\n]*/g),
    sum_line: pick(out.sum, /[^\n]*11[’',]140[^\n]*/), pdf_has: ['41’090', '29’950', '11’140', '5’000'].filter((x) => out.doc.includes(x)),
  }, null, 1));
  await browser.close();
})();
