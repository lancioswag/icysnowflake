const { chromium } = require('playwright');
const fs = require('fs');
const FX = JSON.parse(fs.readFileSync(process.env.FXFILE || (__dirname + '/fixtures/stgallen.json'), 'utf8'));
const NAME2CODE = { 'B1 Range': 'B1', 'B2 Charging': 'B2', 'B4 Choosing the car': 'B4', 'B3 Costs': 'B3', 'B6 Battery & resale': 'B6', 'B7 Ecology': 'B7' };
async function open(opts = {}) {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: Number(process.env.VW || 390), height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) page.errors.push('console: ' + m.text()); });
  await page.route('**/*', async (route) => {
    const u = route.request().url();
    if (u.startsWith('http://localhost')) return route.continue();
    if (u.includes('pdfmake.min.js')) return route.fulfill({ path: '/tmp/pdfm/package/build/pdfmake.min.js', contentType: 'application/javascript' });
    if (u.includes('vfs_fonts.js')) return route.fulfill({ path: '/tmp/pdfm/package/build/vfs_fonts.js', contentType: 'application/javascript' });
    if (u.includes('leaflet.js')) return route.fulfill({ path: process.env.LEAFLET_JS, contentType: 'application/javascript' });
    if (u.includes('/webhook/navigator')) {
      const b = JSON.parse(route.request().postData() || '{}');
      const code = NAME2CODE[b.session?.barrier];
      const r = JSON.parse(JSON.stringify((code === 'B6' && b.session?.battery_entry === 'used_car' ? FX.fx_used : FX.fx[code]) || {}));
      if (code) { r.profile = b.profile; }
      await new Promise((ok) => setTimeout(ok, opts.delay || 150));
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(r) });
    }
    if (u.includes('/webhook/summary') && process.env.AI === 'off') return route.fulfill({ status: 503, body: 'down' });
    if (u.includes('/webhook/summary') && (process.env.AI === 'slow' || !FX.summary)) { await new Promise((ok) => setTimeout(ok, 25000)); return route.fulfill({ status: 504, body: 'timeout' }); }
    if (u.includes('/webhook/summary')) { const b = JSON.parse(route.request().postData() || '{}'); await new Promise((ok) => setTimeout(ok, opts.sdelay || 300)); return route.fulfill({ contentType: 'application/json', body: JSON.stringify(FX.summary[b.style] || FX.summary.simple) }); }
    if (u.includes('wmts.geo.admin.ch')) return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#eef1ec"/><path d="M0 128H256M128 0V256" stroke="#dde3da" stroke-width="6"/></svg>' });
    return route.abort();
  });
  await page.addInitScript((p) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('bevnav.v1', JSON.stringify({ profile: p, queue: [], visited: [], carLabels: {}, settings: {} })); sessionStorage.setItem('seeded', '1'); } }, FX.profile);
  await page.goto(process.env.APP_URL || 'http://localhost:8765/index.html');
  await page.waitForTimeout(400);
  return { browser, page };
}
const shot = (page, name, full = true) => page.screenshot({ path: (process.env.OUT || '/tmp/') + name + '.png', fullPage: full });
module.exports = { open, shot, FX };
