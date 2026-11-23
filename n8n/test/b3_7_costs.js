// B3 · 7 Costs – total cost of ownership (TCO) per line for N = 1…8 years, payback, cash need today.
// Rework 23 Nov 2026 (Claude, Christian's TCO method):
//   - Your current car: its value TODAY counts (your answer current_car.value_today_chf, else an estimate) and it keeps
//     losing value every year (declining balance). Cost per year = value loss + interest on the money tied up + running costs.
//   - Electric car: value loss (price today − value after N years), not the full price; NEW or USED (about 4 years old).
//   - Lines: every class option + one size up (e.g. a used medium car for a small budget) × new / used.
//   - Energy detail per line (km × consumption × price) and payback year (up to 12 years).
// TEST copy, 23 Nov 2026 (v3): years 1–12; three blocks per line (upfront, running costs, depreciation); residual value
// bands (wider where the value curve is extrapolated); saving with a lower / higher residual; battery warranty and a
// separate replacement scenario (not part of the residual value). Additive fields only.
// Returns contract v2 (03_Output_Contract §6 B3). Mode: Run Once for All Items.

const input = $input.first().json;
const profile = input.profile ?? {};
const ca = profile.cost_assumptions ?? {};
const cc = profile.current_car ?? {};
const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const r0 = (x) => (x === null || x === undefined ? null : Math.round(x));
const r100 = (x) => Math.round(x / 100) * 100;
const fmt = (x) => Math.abs(x).toLocaleString('en-US');
const NS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const NS_PAYBACK = NS;
const START_N = 6;
const SIZE_WORD = { S: 'Small', M: 'Medium', L: 'Large' };
const NEXT_SIZE = { S: 'M', M: 'L' };
const tables = input.tables ?? {};
const pick = (rows) => {
  if (!rows.length) return null;
  const real = rows.filter((r) => r.is_dummy !== true);
  return [...(real.length ? real : rows)].sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))[0];
};
const constant = (key) => pick((tables.constants ?? []).filter((r) => r.key === key));

// ---------- status ----------
const trips = input.trips ?? [];
const missing = [];
if (!trips.length) missing.push('trips');
const carId = String(cc.targa_id ?? '').trim();
const carPicked = carId !== '' && !['skipped', 'none', 'null'].includes(carId.toLowerCase());
if (carPicked) {
  if (!cc.first_registration) missing.push('current_car.first_registration');
  if (num(cc.odometer_km) === null) missing.push('current_car.odometer_km');
}
if (missing.length) return [{ json: { contract_version: '2.0', barrier: 'B3', status: 'incomplete', missing, profile, result: null } }];

// ---------- constants ----------
const C = {
  r: (num(ca.interest_rate) ?? 1.25) / 100,
  r_user: num(ca.interest_rate) !== null,
  REAL: { WLTP: 1.19, NEDC: 1.39 },
  TRAILER: { none: 1, small: 1.08, large: 1.54 },
  ICE_NEW: { S: 24890, M: 40827, L: 51114 },
  // current car: value estimate when you give none, and value loss from today on (declining balance)
  EST_YEAR: 0.85,        // value ≈ new price × 0.85^age (typical Swiss used-car curve, Eurotax / TCS)
  EST_KM_PP: 1,          // −1 % of the new price per 10,000 km above 15,000 km a year
  EST_FLOOR: 0.05,       // never below 5 % of the new price
  KEEP_YEAR: 0.82,       // from today: −18 % of the remaining value per year
  KEEP_KM_PP: 2,         // and −2 % per 10,000 km above 15,000 km a year
  OLD_REPAIR: 0.05, OLD_REPAIR_FROM: 5, OLD_REPAIR_MAX: 1.6,  // repairs grow with age: +5 % per year above 5 years, at most +60 %
  S_SERVICE: { S: 792, M: 814, L: 838 },
  TYRE_KM: { S: 0.0123, M: 0.0179, L: 0.0155 },
  EV_SERVICE: { S: 0.6, M: 0.6, L: 0.8 },
  TYRE_CHANGE_CHF: 80,
  tyre_changes: num(ca.tyre_changes_per_year) ?? 2,
  INSTALL: { min: 2000, max: 3500 },
  // EV value as % of the new price by age (BFE/EBP 2023, Figure 2); beyond 8 years −20 % per year
  RW: { small: [62.4, 52.4, 45.8, 39, 32.4, 27.7, 22.7, 17.7], mid: [62.6, 55.1, 47.3, 40.9, 34.7, 28.6, 23.6, 18.6] },
  RW_LATER: 0.8,
  RW_BASE_KM: 15000, RW_KM_PP: 2,
  USED_AGE: Math.min(8, Math.max(1, num(profile.ev_used_age_years) ?? 4)),
  // residual value uncertainty: ± share of the value; wider where the curve is extrapolated (EV age > 8, any car beyond 8 years from today)
  BAND_TABLE: 0.15, BAND_EXTRA: 0.30, BAND_CAR: 0.20,
  // battery: typical warranty and a replacement scenario (Nissan list prices reported by Auto Bild / t-online: Leaf 40 kWh EUR 10,306, 62 kWh EUR 15,516 ≈ CHF 250 per kWh incl. fitting)
  WARRANTY_YEARS: 8, WARRANTY_KM: 160000, BATTERY_CHF_KWH: 250,
};
const rwAt = (size, age) => {
  const t = C.RW[size === 'S' ? 'small' : 'mid'];
  if (age <= 0) return 100;
  if (age <= 8) return t[Math.round(age) - 1];
  return t[7] * C.RW_LATER ** (age - 8);
};

// ---------- prices, canton ----------
const pr = input.prices ?? {};
const pHome = num(pr.p_home?.value);
const pAC = num(pr.p_public_ac?.value);
const pDC = num(pr.p_dc?.value);
const everyday = pr.everyday ?? { value: 'private_ac', source: 'calc' };
const pEvery = { private_ac: pHome, public_ac: pAC, public_dc: pDC }[everyday.value] ?? null;
const warnings = [];
const missingInputs = [];
if (pEvery === null) { warnings.push('everyday_price_unavailable'); missingInputs.push('everyday_price'); }
const canton = input.location?.canton ?? null;
if (!canton) warnings.push('canton_unknown');

const taxRow = (drive, key) => (canton ? pick((tables.tax ?? []).filter((r) => r.canton === canton && r.drive === drive && (drive === 'bev' ? r.class_id === key : r.size === key))) : null);
const taxPerYear = (row, N) => {
  if (!row) return 0;
  const full = num(row.tax_full_chf_year) ?? 0;
  const during = num(row.tax_during_rebate_chf_year);
  const yrs = num(row.ev_rebate_years);
  if (during === null || yrs === null) return full;
  return (during * Math.min(N, yrs) + full * Math.max(0, N - yrs)) / N;
};
const insRow = (drive, key) => pick((tables.insurance ?? []).filter((r) => r.drive === drive && (drive === 'bev' ? r.class_id === key : r.size === key)));
const maint = (size, ev, km, ageFactor = 1) => {
  const s = C.S_SERVICE[size] * (ev ? C.EV_SERVICE[size] : 1);
  return (0.5 * s + C.tyre_changes * C.TYRE_CHANGE_CHF + ((0.5 * s) / 15000 + C.TYRE_KM[size]) * km) * ageFactor;
};

// ---------- current car (reference line) ----------
const car = input.your_cars?.current ?? {};
const FUEL_OF = { petrol: 'petrol', diesel: 'diesel', hybrid_petrol: 'petrol', hybrid_diesel: 'diesel' };
let noRef = null;
let ref = null;
if (!carPicked) noRef = 'no_current_car';
else if (!car.found || !FUEL_OF[car.fuel]) noRef = 'out_of_scope';
if (!noRef) {
  const fuel = FUEL_OF[car.fuel];
  const consUser = num(cc.consumption);
  const cons = consUser ?? (num(car.consumption) !== null ? car.consumption * (C.REAL[car.cycle] ?? C.REAL.WLTP) : null);
  const fuelRow = constant(`fuel_${fuel}_chf_l`);
  const fuelUser = num(ca.fuel_price_chf_l);
  const fuelPrice = fuelUser ?? num(fuelRow?.value);
  if (cons === null || fuelPrice === null) noRef = 'out_of_scope';
  else {
    const seats = num(car.seats);
    const size = seats === null ? 'M' : seats <= 4 ? 'S' : seats === 5 ? 'M' : 'L';
    const K = num(cc.new_price_chf) ?? C.ICE_NEW[size];
    const [fy, fm] = String(cc.first_registration).split('-').map(Number);
    const now = new Date();
    const age0 = Math.max(0, now.getFullYear() + now.getMonth() / 12 - (fy + ((fm || 1) - 1) / 12));
    const km0 = num(cc.odometer_km) ?? 0;
    const annual = trips.reduce((s, t) => s + t.days_per_year * 2 * t.km, 0) || input.annual_km;
    const vUser = num(cc.value_today_chf);
    const vEst = Math.max(K * C.EST_FLOOR, K * C.EST_YEAR ** age0 - (K * C.EST_KM_PP / 100) * Math.max(0, km0 - C.RW_BASE_KM * age0) / 10000);
    const V0 = vUser ?? vEst;
    const kmLoss = Math.max(0, annual - C.RW_BASE_KM) / 10000 * (C.KEEP_KM_PP / 100);
    const value = (t) => Math.max(0, V0 * C.KEEP_YEAR ** t * Math.max(0.3, 1 - kmLoss * t));
    const energy = trips.reduce((s, t) => s + t.days_per_year * 2 * t.km * (cons / 100) * (C.TRAILER[t.trailer] ?? 1) * fuelPrice, 0);
    const repairF = Math.min(C.OLD_REPAIR_MAX, 1 + C.OLD_REPAIR * Math.max(0, age0 - C.OLD_REPAIR_FROM));
    ref = { fuel, cons, cons_user: consUser !== null, fuelPrice, fuelRow, fuel_user: fuelUser !== null, size, K, K_user: num(cc.new_price_chf) !== null,
      V0, V0_user: vUser !== null, age0, km0, annual, value, energy, repairF, tax: taxRow('ice', size), ins: insRow('ice', size), name: car.label || 'current car' };
  }
}

// ---------- EV classes: options + one size up ----------
const tc = input.two_cars ?? {};
let opts = tc.class_options ?? [];
if (!opts.length && tc.fallback) opts = [tc.fallback];
const fit = input.fit ?? [];
const tripById = Object.fromEntries(trips.map((t) => [t.trip_id, t]));
const rare = input.rare_days ?? {};
const catalogue = input.catalogue ?? [];
const selId = tc.selected_class_id ?? opts[0]?.class_id ?? null;
const selOpt = opts.find((o) => o.class_id === selId) ?? opts[0] ?? null;
const classes = opts.map((o) => ({ ...o, extra: null }));
if (selOpt && NEXT_SIZE[selOpt.size]) {
  const up = catalogue.filter((c) => c.valid !== false && c.size === NEXT_SIZE[selOpt.size] && c.range_band_min_km >= selOpt.min_wltp_km)
    .sort((a, b) => a.range_band_min_km - b.range_band_min_km)[0]
    ?? catalogue.filter((c) => c.size === NEXT_SIZE[selOpt.size]).sort((a, b) => b.range_band_min_km - a.range_band_min_km)[0];
  if (up && !classes.some((c) => c.class_id === up.class_id)) {
    const fits = fit.filter((f) => f.class_id === up.class_id && f.fits);
    const evKm = fits.reduce((s, f) => s + f.days * 2 * (tripById[f.trip_id]?.km ?? 0), 0);
    classes.push({ class_id: up.class_id, size: up.size, min_wltp_km: up.range_band_min_km, price_min_chf: up.price_min_chf, price_max_chf: up.price_max_chf,
      ev_annual_km: Math.round(evKm), extra: 'size_up' });
  }
}
// Energy: B4 energy per trip × EV days; special trips with stops: first leg at the everyday price, rest DC (B3 §4.2)
const evEnergy = (classId) => {
  let chf = 0, kwh = 0;
  for (const f of fit.filter((x) => x.class_id === classId && x.fits)) {
    const t = tripById[f.trip_id];
    if (!t) continue;
    const k = f.days * 2 * f.kwh_one_way;
    const dcShare = t.legs_calc ? Math.max(0, 1 - t.legs_calc.first_leg_km / (2 * t.km)) : 0;
    chf += k * (1 - dcShare) * (pEvery ?? 0) + k * dcShare * (pDC ?? 0);
    kwh += k;
  }
  return { chf, kwh };
};
// Rare trips this class cannot do → other transport. Size-up class: same items as the selected option, minus the trips it can do.
const bridgingOf = (cls) => {
  let items = rare[cls.class_id]?.items;
  if (!items && cls.extra === 'size_up') {
    const canDo = (tripId) => { const fs = fit.filter((f) => f.class_id === cls.class_id && String(f.trip_id) === String(tripId)); return fs.length > 0 && fs.every((f) => f.fits); };
    items = (rare[selId]?.items ?? []).filter((it) => !canDo(it.trip_id));
  }
  return items ?? [];
};
const installs = everyday.value === 'private_ac' && profile.home_charging_status !== 'yes';
let bridgingPending = false;
const v0 = ref ? ref.V0 : 0;

const batteryKwh = (classId) => { const c = catalogue.find((x) => x.class_id === classId); const v = c && num(c.c_wltp_kwh_100km) && num(c.wltp_range_median_km) ? (c.c_wltp_kwh_100km * c.wltp_range_median_km) / 100 : null; return v ? Math.round(v) : null; };
const lines = [];
for (const purchase of ['new', 'used']) {
  classes.forEach((o, i) => {
    const size = o.size;
    const newMin = num(o.price_min_chf) ?? num(o.price_max_chf) ?? 0;
    const newMax = num(o.price_max_chf) ?? newMin;
    const age = purchase === 'used' ? C.USED_AGE : 0;
    const buyF = rwAt(size, age) / 100;
    const pMin = newMin * buyF;
    const pMax = newMax * buyF;
    const en = evEnergy(o.class_id);
    const tax = taxRow('bev', o.class_id);
    const ins = insRow('bev', o.class_id);
    const insV = num(ins?.liability_chf_year) ?? 0;
    const mnt = maint(size, true, o.ev_annual_km, purchase === 'used' ? 1.1 : 1);
    const bridging = bridgingOf(o).map((it) => {
      const alt = (it.alternatives || []).find((a) => a.key === it.assigned) || {};
      if (it.cost_per_year_chf == null) bridgingPending = true;
      return { trip_id: Number(String(it.trip_id).replace('trip_', '')) - 1, label: it.label, key: it.assigned, category: alt.category ?? null, days: it.days, cost_per_year_chf: it.cost_per_year_chf ?? null };
    });
    const bridgingSum = bridging.reduce((s, b) => s + (b.cost_per_year_chf ?? 0), 0);
    const yearOf = (N) => {
      // mileage adjustment: high mileage lowers the value (at most to 40 % of the typical value), low mileage raises it
      // (at most +25 %); the value never rises with time (fix 23 Nov: low-mileage bonus made old EVs gain value)
      const rwAdj = (n) => { const typ = rwAt(size, age + n); const kmPP = (C.RW_KM_PP * (o.ev_annual_km - C.RW_BASE_KM) * n) / 10000; return Math.min(typ * 1.25, Math.max(typ * 0.4, typ - kmPP)); };
      let rwMin = Infinity; for (let n = 1; n <= N; n++) rwMin = Math.min(rwMin, rwAdj(n));
      const rwPct = rwMin / 100;
      const veh = (P0) => { const RW = (P0 / buyF) * rwPct; return { loss: (P0 - RW) / N, interest: (C.r * (P0 + RW)) / 2, rw: RW }; };
      const extrapolated = age + N > 8;
      const band = extrapolated ? C.BAND_EXTRA : C.BAND_TABLE;
      const evKm = o.ev_annual_km * N + (purchase === 'used' ? C.RW_BASE_KM * age : 0);
      const a = veh(pMin), b = veh(pMax);
      const taxV = taxPerYear(tax, N);
      const iMin = installs ? C.INSTALL.min / N : 0;
      const iMax = installs ? C.INSTALL.max / N : 0;
      const rest = en.chf + taxV + insV + mnt + bridgingSum;
      const tMin = a.loss + a.interest + iMin + rest;
      const tMax = b.loss + b.interest + iMax + rest;
      return {
        n: N,
        items: { vehicle: r0((a.loss + b.loss) / 2), interest: r0((a.interest + b.interest) / 2), energy: r0(en.chf), tax: r0(taxV), insurance: r0(insV), maintenance: r0(mnt), installation: r0((iMin + iMax) / 2), bridging: r0(bridgingSum) },
        value_after: { min: r0(a.rw), max: r0(b.rw) },
        value_after_band: { low: r0(((a.rw + b.rw) / 2) * (1 - band)), high: r0(((a.rw + b.rw) / 2) * (1 + band)), share: band, extrapolated },
        running_per_year: r0(rest),
        total_per_year: { min: r0(tMin), max: r0(tMax) },
        total_over_n: { min: r0(tMin * N), max: r0(tMax * N) },
        saving_vs_current: null,
        battery: { age_at_end: age + N, km_at_end: Math.round(evKm), warranty_over: age + N > C.WARRANTY_YEARS || evKm > C.WARRANTY_KM },
      };
    };
    const kwh = batteryKwh(o.class_id);
    lines.push({
      line_id: `option_${i + 1}_${purchase}`,
      kind: 'option',
      label: `Option ${i + 1}`,
      class_id: o.class_id,
      size_label: SIZE_WORD[size],
      min_wltp_km: o.min_wltp_km ?? null,
      purchase,
      used_age_years: purchase === 'used' ? C.USED_AGE : 0,
      extra: o.extra,
      selected: o.class_id === selId,
      price_today_chf: { min: r0(pMin), max: r0(pMax) },
      upfront: { price: { min: r0(pMin), max: r0(pMax) }, installation: installs ? { min: C.INSTALL.min, max: C.INSTALL.max } : { min: 0, max: 0 }, subsidy: 0, sale_of_current_car: ref ? r0(v0) : 0,
        net: { min: r0(pMin + (installs ? C.INSTALL.min : 0) - v0), max: r0(pMax + (installs ? C.INSTALL.max : 0) - v0) } },
      battery: { gross_kwh: kwh, replacement_chf: kwh ? r100(kwh * C.BATTERY_CHF_KWH) : null, warranty_years: C.WARRANTY_YEARS, warranty_km: C.WARRANTY_KM, age_today: age },
      cash_need_today_chf: { min: r0(pMin + (installs ? C.INSTALL.min : 0) - v0), max: r0(pMax + (installs ? C.INSTALL.max : 0) - v0) },
      energy_detail: { kind: 'electricity', km_per_year: o.ev_annual_km, kwh_per_100km: o.ev_annual_km ? Math.round((en.kwh / o.ev_annual_km) * 1000) / 10 : null,
        chf_per_kwh: en.kwh ? Math.round((en.chf / en.kwh) * 100) / 100 : pEvery, everyday: everyday.value },
      years: NS.map(yearOf),
      _payback: NS_PAYBACK.map(yearOf),
      bridging,
      _tax: tax,
      _ins: ins,
    });
  });
}
if (lines.length && !lines.some((l) => l.selected)) lines.forEach((l) => { if (l.class_id === lines[0].class_id) l.selected = true; });

// ---------- reference line "keep your current car" ----------
let refYears = null;
if (ref) {
  const insV = num(ref.ins?.liability_chf_year) ?? 0;
  const mnt = maint(ref.size, false, ref.annual, ref.repairF);
  const yearOf = (N) => {
    const P = ref.value(0);
    const RW = ref.value(N);
    const loss = (P - RW) / N;
    const interest = (C.r * (P + RW)) / 2;
    const taxV = taxPerYear(ref.tax, N);
    const t = loss + interest + ref.energy + taxV + insV + mnt;
    const band = N > 8 ? C.BAND_EXTRA : C.BAND_CAR;
    return {
      n: N,
      items: { vehicle: r0(loss), interest: r0(interest), energy: r0(ref.energy), tax: r0(taxV), insurance: r0(insV), maintenance: r0(mnt), installation: 0, bridging: 0 },
      value_after: { min: r0(RW), max: r0(RW) },
      value_after_band: { low: r0(RW * (1 - band)), high: r0(RW * (1 + band)), share: band, extrapolated: N > 8 },
      running_per_year: r0(ref.energy + taxV + insV + mnt),
      total_per_year: { min: r0(t), max: r0(t) },
      total_over_n: { min: r0(t * N), max: r0(t * N) },
      saving_vs_current: null,
    };
  };
  const years = NS.map(yearOf);
  refYears = NS_PAYBACK.map(yearOf);
  for (const l of lines) {
    const apply = (y, k) => { const cur = refYears[k].total_over_n.min; y.saving_vs_current = { min: cur - y.total_over_n.max, max: cur - y.total_over_n.min }; };
    l.years.forEach(apply);
    l._payback.forEach(apply);
    // residual value uncertainty: EV worth less + your car worth more (low) / the other way round (high)
    l.years.forEach((y, k) => {
      if (!y.saving_vs_current || !y.value_after_band) return;
      const R = years[k], f = 1 - (C.r * y.n) / 2, s0 = (y.saving_vs_current.min + y.saving_vs_current.max) / 2;
      const evMid = (y.value_after.min + y.value_after.max) / 2, refMid = R.value_after.min;
      const low = s0 - (evMid - y.value_after_band.low) * f - (R.value_after_band.high - refMid) * f;
      const high = s0 + (y.value_after_band.high - evMid) * f + (refMid - R.value_after_band.low) * f;
      y.saving_residual_scenarios = { low: r0(low), mid: r0(s0), high: r0(high), flips: (low < 0) !== (high < 0) };
    });
  }
  lines.push({ line_id: 'current_car', kind: 'current_car', label: ref.name, class_id: null, size_label: SIZE_WORD[ref.size], min_wltp_km: null, selected: false,
    value_today_chf: r0(ref.V0), value_today_source: ref.V0_user ? 'user' : 'estimate', age_years: Math.round(ref.age0 * 10) / 10,
    cash_need_today_chf: null,
    energy_detail: { kind: ref.fuel, km_per_year: ref.annual, l_per_100km: ref.annual ? Math.round((ref.energy / ref.fuelPrice / ref.annual) * 1000) / 10 : null, chf_per_l: ref.fuelPrice },
    years, bridging: [] });
}

// ---------- payback and key statements ----------
const optLines = lines.filter((l) => l.kind === 'option');
const mid = (b) => (b.min + b.max) / 2;
const payback = (l) => {
  if (!ref) return null;
  let p = null;
  for (let k = NS_PAYBACK.length - 1; k >= 0; k--) {
    if (l._payback[k].saving_vs_current && mid(l._payback[k].saving_vs_current) >= 0) p = NS_PAYBACK[k];
    else break;
  }
  return p;
};
for (const l of optLines) { l.payback_year = payback(l); }
const payNote = 'payback_year = first year from which the saving stays at or above zero up to year 12; null = not within 12 years';
const defaultPurchase = ['new', 'used'].includes(profile.ev_purchase) ? profile.ev_purchase : 'new';
const yrs = (N) => `${N} year${N === 1 ? '' : 's'}`;
const shown = optLines.filter((l) => l.purchase === defaultPurchase);
const statements = NS.map((N) => {
  const k = N - 1;
  if (ref) {
    const parts = shown.map((l, i) => {
      const s = r100(mid(l.years[k].saving_vs_current));
      const what = s >= 0 ? `saves you about CHF ${fmt(s)}` : `costs about CHF ${fmt(s)} more`;
      return `Option ${i + 1} (${l.class_id}, ${l.purchase}) ${what} (${l.payback_year ? `pays off after about ${yrs(l.payback_year)}` : 'does not pay off within 12 years'})`;
    });
    return { n: N, text: `Kept for ${yrs(N)}, ${parts.join('; ')} compared with keeping your ${ref.name}.` };
  }
  const parts = shown.map((l, i) => {
    const b = l.years[k].total_over_n;
    const a = r100(b.min);
    const c = r100(b.max);
    return `Option ${i + 1} (${l.class_id}, ${l.purchase}) costs about CHF ${a === c ? fmt(a) : `${fmt(a)}–${fmt(c)}`}`;
  });
  return { n: N, text: `Kept for ${yrs(N)}, ${parts.join('; ')} in total.` };
});

// ---------- assumptions & sources ----------
const A = (key, label, value, unit, source, url, profile_field = null, is_user_value = false) => ({ key, label, value, unit, source, url, profile_field, is_user_value });
const BFE_EBP = 'https://pubdb.bfe.admin.ch/de/publication/download/11314';
const t0 = optLines[0]?._tax ?? null;
const i0 = optLines[0]?._ins ?? null;
const assumptions = [];
if (ref) {
  assumptions.push(A('current_car_value_today', 'What your current car is worth today', r0(ref.V0), 'CHF',
    ref.V0_user ? 'your value' : `estimate: new price × 0.85 per year of age, minus 1 % of the new price per 10,000 km above 15,000 km a year`, null, 'current_car.value_today_chf', ref.V0_user));
  assumptions.push(A('current_car_consumption', 'Consumption of your current car', Math.round(ref.cons * 10) / 10, 'l/100 km',
    ref.cons_user ? 'your value' : 'ASTRA TAS type approval × real-world factor (ICCT: WLTP ×1.19, NEDC ×1.39)', null, 'current_car.consumption', ref.cons_user));
  if (!ref.V0_user) assumptions.push(A('current_car_new_price', 'New price of your current car (only for the value estimate)', ref.K, 'CHF',
    ref.K_user ? 'your value' : `Typical new price of a ${SIZE_WORD[ref.size].toLowerCase()} combustion car (BFE/EBP 2023, Table 4)`, ref.K_user ? null : BFE_EBP, 'current_car.new_price_chf', ref.K_user));
  assumptions.push(A('fuel_price', ref.fuel === 'diesel' ? 'Diesel price' : 'Petrol price', ref.fuelPrice, 'CHF/l',
    ref.fuel_user ? 'your value' : (ref.fuelRow?.source ?? 'BFS'), ref.fuel_user ? null : (ref.fuelRow?.url ?? null), 'cost_assumptions.fuel_price_chf_l', ref.fuel_user));
  assumptions.push(A('depreciation_current_car', 'Value loss of your current car from today', '18 % of its value per year, plus 2 % per 10,000 km above 15,000 km a year', null, 'our assumption, close to Eurotax-type used-car curves', null));
  assumptions.push(A('repairs_current_car', 'Repairs of an older car', `+5 % per year of age above 5 years (yours: ×${Math.round(ref.repairF * 100) / 100})`, null, 'BFE/EBP 2023 service costs; age uplift is our assumption', BFE_EBP));
}
assumptions.push(A('interest_rate', 'Interest on the money tied up in the car', Math.round(C.r * 10000) / 100, '%', C.r_user ? 'your value' : 'BVG minimum interest rate (Federal Council)', null, 'cost_assumptions.interest_rate', C.r_user));
assumptions.push(A('p_home', 'Electricity price at home', pHome, 'CHF/kWh', pr.p_home ? `${pr.p_home.source}, ${pr.p_home.as_of}${pr.p_home.municipality ? `, ${pr.p_home.municipality}` : ''}` : null, 'https://www.strompreis.elcom.admin.ch'));
assumptions.push(A('p_public_ac', 'Public AC charging price', pAC, 'CHF/kWh', pr.p_public_ac?.source ?? null, pr.p_public_ac?.url ?? null));
assumptions.push(A('p_dc', 'Fast charging (DC) price', pDC, 'CHF/kWh', pr.p_dc?.source ?? null, pr.p_dc?.url ?? null, 'cost_assumptions.p_dc_chf_kwh', pr.p_dc?.user === true));
assumptions.push(A('tyre_changes', 'Tyre changes per year (summer / winter)', C.tyre_changes, null, num(ca.tyre_changes_per_year) !== null ? 'your value' : 'BFE/EBP 2023; TCS (CHF 80 per change)', null, 'cost_assumptions.tyre_changes_per_year', num(ca.tyre_changes_per_year) !== null));
assumptions.push(A('motor_vehicle_tax', `Motor vehicle tax, electric car (estimate, canton ${canton ?? 'unknown'})`, t0 ? r0(taxPerYear(t0, START_N)) : null, 'CHF/yr', t0?.source ?? null, t0?.url ?? null));
assumptions.push(A('insurance', 'Insurance, liability only (estimate)', i0 ? num(i0.liability_chf_year) : null, 'CHF/yr', i0?.source ?? null, i0?.url ?? null));
assumptions.push(A('maintenance', 'Maintenance incl. tyres (estimate)', 'service and tyre costs per size; EV service ×0.6 (small, medium) / ×0.8 (large); used EV +10 %', null, 'BFE/EBP 2023, Tables 12–14', BFE_EBP));
assumptions.push(A('ev_resale', 'Value of the electric car', 'share of the new price by age (after 4 years about 40 %), data for ages 1\u20138, extrapolated after; 2 % per 10,000 km above or below 15,000 km a year', null, 'BFE/EBP 2023, Figure 2 (Eurotax retail values)', BFE_EBP));
assumptions.push(A('ev_used', 'Used electric car', `about ${C.USED_AGE} years old, price = new price × value share at that age`, null, 'BFE/EBP 2023, Figure 2', BFE_EBP, 'ev_used_age_years'));
assumptions.push(A('battery_warranty', 'Battery warranty (typical)', `${C.WARRANTY_YEARS} years / ${C.WARRANTY_KM.toLocaleString('en-US')} km`, null, 'our assumption; most makers, check your offer', null));
assumptions.push(A('battery_replacement', 'Battery replacement, only as a separate scenario', C.BATTERY_CHF_KWH, 'CHF per kWh', 'Nissan list prices (Leaf 40 / 62 kWh) reported by Auto Bild and t-online', 'https://www.t-online.de/mobilitaet/e-autos/id_89687372/elektroauto-so-teuer-ist-der-akku-tausch-.html'));
assumptions.push(A('installation', 'Home charging installation (one-off)', installs ? '2,000–3,500' : 0, 'CHF', 'Leitfaden Ladeinfrastruktur im Stockwerkeigentum; TCS wallbox test (2024)', null));
assumptions.push(A('ev_subsidy', 'Purchase subsidy for the EV', 0, 'CHF', 'not included yet', null));

for (const l of lines) { delete l._tax; delete l._ins; delete l._payback; }
if (bridgingPending) warnings.push('bridging_prices_pending');

return [{
  json: {
    contract_version: '2.0',
    barrier: 'B3',
    status: 'ok',
    missing: [],
    profile,
    result: {
      method: 'tco_v3',
      missing_inputs: missingInputs,   // decisive inputs we have no data for (e.g. no electricity tariff): energy then counts as 0, so the comparison is not reliable
      horizon_max_years: 12,
      payback_rule: payNote,
      depreciation_curve: {
        ev: 'BFE/EBP 2023, Figure 2 (Eurotax retail values of EVs, share of new price), ages 1–8 for small and medium cars; large cars use the medium curve; beyond 8 years extrapolated with −20 % per year; ±2 percentage points per 10,000 km above or below 15,000 km a year, at most down to 40 % and up to 125 % of the typical value; the value never rises with time',
        ev_used: `used EV bought at age ${C.USED_AGE}: price = new price × value share at that age; its value later = new price × share at age ${C.USED_AGE} + years kept (so from about ${8 - C.USED_AGE + 1} years kept the curve is extrapolated)`,
        current_car: 'your value today (or estimate: new price × 0.85 per year of age, minus 1 % of the new price per 10,000 km above 15,000 km a year, at least 5 %); from today −18 % per year (our assumption, close to Eurotax-type curves), plus −2 % per 10,000 km above 15,000 km a year',
        uncertainty: `residual value band ±${C.BAND_TABLE * 100} % where the EV curve is data, ±${C.BAND_EXTRA * 100} % where it is extrapolated or beyond 8 years; your car ±${C.BAND_CAR * 100} % (±${C.BAND_EXTRA * 100} % beyond 8 years)`,
        battery: `warranty assumed ${C.WARRANTY_YEARS} years / ${C.WARRANTY_KM.toLocaleString('en-US')} km (typical, check your offer); replacement scenario CHF ${C.BATTERY_CHF_KWH} per kWh gross capacity (Nissan list prices 2022 via Auto Bild / t-online), shown separately: the residual values are market prices of cars with their original battery and do not include a replacement`,
      },
      statements,
      start_years: START_N,
      default_purchase: defaultPurchase,
      used_age_years: C.USED_AGE,
      lines,
      everyday_charging: everyday,
      no_reference: noRef,
      assumptions,
    },
    debug: {
      warnings,
      canton,
      annual_km: input.annual_km,
      prices: { p_home: pHome, p_public_ac: pAC, p_dc: pDC, everyday: everyday.value },
      payback_years: optLines.map((l) => ({ class_id: l.class_id, purchase: l.purchase, payback: l.payback_year })),
      trip_errors: input.trip_errors ?? [],
    },
  },
}];
