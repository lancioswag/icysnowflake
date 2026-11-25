// B7 Ecology – Ecology calc (B7 doc 4.1–4.6)
// n8n Code node · JavaScript · Mode: Run Once for All Items
// Reads: Ecology inputs · Get vehicle classes · Get ICE reference (Supabase)
// Out  : one item { profile, session, b7 } with b7.car, b7.start, b7.variants (every valid class × both electricity products)
//
// Implementation notes vs. navigator/B7_Ecology.md:
//  - EV side uses the class table (S0–L4, carculator at the class median range) instead of the 50 km grid;
//    range slider = valid classes of the chosen size.
//  - Start class = the class the other barriers use (Module – Vehicle choice: user's selection, else the recommended option).
//    Only without trips (no class): smallest class ≥ 200 km of the size from people on weekly trips / current car / medium.
//  - Current car comes from ASTRA TAS via Module – Vehicle choice; diesel mild/full hybrids count as diesel.
//  - 25 Nov 2026 (Claude): NEDC real-world factor by the year the type was approved, the same rule as B3 Costs
//    (ICCT: about +12 % for 2005 types up to +40 % from 2015). Before, 1.39 for every NEDC car: the BMW 530xd
//    (type approved 2007, 7.0 l) got 9.73 l here and 8.26 l in Costs.

const C = {
  N_LIFE_YEARS: 16,          // BFE/INFRAS 2025
  LIFETIME_KM: 200000,       // BFE/INFRAS 2025 = carculator run setting
  EF_FUEL: { petrol: 3.03, diesel: 3.29 },          // kg CO2eq/l, carculator 1.9.6
  EF_EL: { consumer_mix: 109, renewable_product: 9.7 }, // g CO2eq/kWh, BFE/treeze 2026
  REAL_WLTP: 1.19, REAL_NEDC: 1.39,                 // ICCT, as B3 (NEDC: fallback when the approval year is unknown)
  F_DRIVE_NORMAL: 1.17, F_DRIVE_MOTORWAY: 1.45, V_MOTORWAY: 80, P_HEAT_KW: 2.0, // B4 R1 step 1 (winter)
  MIN_START_RANGE_KM: 200,
  FOOTPRINT_CH_T: 14.8,                             // BFS 2023
};
const POOL = [
  { key: 'flight_bcn', type: 'flight', label: 'return flight Zurich–Barcelona (economy)', t: 0.22 },
  { key: 'flight_cai', type: 'flight', label: 'return flight Zurich–Cairo (economy)', t: 0.69 },
  { key: 'flight_dxb', type: 'flight', label: 'return flight Zurich–Dubai (economy)', t: 1.2 },
  { key: 'flight_nyc', type: 'flight', label: 'return flight Zurich–New York (economy)', t: 1.59 },
  { key: 'flight_mia', type: 'flight', label: 'return flight Zurich–Miami (economy)', t: 1.97 },
  { key: 'flight_sin', type: 'flight', label: 'return flight Zurich–Singapore (economy)', t: 2.59 },
  { key: 'diet_veg', type: 'diet', label: 'one person switching from an average to a vegetarian diet for a year', t: 0.46 },
  { key: 'diet_vegan', type: 'diet', label: 'one person switching from an average to a vegan diet for a year', t: 0.71 },
];
const SIZE_TO_CC = { S: 'Small', M: 'Medium', L: 'Large SUV' };
const r1 = (x) => Math.round(x * 10) / 10;
const r2 = (x) => Math.round(x * 100) / 100;
const sizeFromSeats = (n) => (n === null || n === undefined ? null : n <= 4 ? 'S' : n === 5 ? 'M' : 'L');

const base = $('Ecology inputs').first().json;
const b7 = { ...base.b7, warnings: [...base.b7.warnings], missing: [...base.b7.missing] };
const classes = $('Get vehicle classes').all().map((i) => i.json).filter((c) => c.class_id);
const ice = $('Get ICE reference').all().map((i) => i.json).filter((r) => r.fuel);

// NEDC factor by approval year (same rule as B3 "7 Costs")
const cc = base.profile?.current_car ?? {};
const approvalYear = Number(cc.approval_year) || Number(String(cc.first_registration ?? '').slice(0, 4)) || null;
const nedcF = approvalYear === null ? C.REAL_NEDC : approvalYear <= 2005 ? 1.12 : approvalYear <= 2009 ? 1.18 : approvalYear <= 2012 ? 1.27 : approvalYear <= 2014 ? 1.35 : 1.40;

// ---------- current car (ASTRA TAS, read by Module – Vehicle choice) ----------
const tas = base.tas_car ?? {};
let car = { status: 'none' };
if (tas.found) {
  const f = String(tas.fuel ?? '');
  const drive = f === 'petrol' ? 'petrol' : f === 'diesel' ? 'diesel' : f === 'electric' ? 'bev' : f.startsWith('phev') ? 'phev'
    : f === 'hybrid_petrol' ? 'hybrid_petrol' : f === 'hybrid_diesel' ? 'hybrid_diesel' : 'other';
  const fuel = ['diesel', 'hybrid_diesel'].includes(drive) ? 'diesel' : ['petrol', 'hybrid_petrol'].includes(drive) ? 'petrol' : null;
  const raw = Number(tas.consumption) > 0 ? Number(tas.consumption) : null;
  let consumption = null;
  let consSource = null;
  if (b7.consumption_override > 0) { consumption = b7.consumption_override; consSource = 'user'; }
  else if (raw && tas.cycle === 'WLTP') { consumption = raw * C.REAL_WLTP; consSource = 'tas_wltp_x1.19'; }
  else if (raw && tas.cycle === 'NEDC') { consumption = raw * nedcF; consSource = `tas_nedc_x${nedcF}`; }
  car = {
    status: 'found',
    tas_id: tas.targa_id,
    name: tas.label ?? '',
    drive,
    fuel,
    seats: tas.seats ?? null,
    size: sizeFromSeats(tas.seats),
    consumption_l_100km: consumption === null ? null : r2(consumption),
    consumption_source: consSource,
    consumption_wltp_mean: tas.cycle === 'WLTP' ? raw : null,
    consumption_nedc_mean: tas.cycle === 'NEDC' ? raw : null,
    real_world_factor: consSource === 'user' ? null : tas.cycle === 'NEDC' ? nedcF : tas.cycle === 'WLTP' ? C.REAL_WLTP : null,
    approval_year: approvalYear,
  };
  if (fuel && consumption === null) b7.warnings.push('current_car_consumption_missing');
}

// Block routing (doc 4.1 step 4)
const block2 = car.fuel && car.consumption_l_100km ? '2a' : '2b';
const refFuel = car.fuel === 'diesel' ? 'diesel' : 'petrol';

// ---------- EV start values ----------
const weekly = b7.trips.filter((t) => t.weekly);
const bySize = (s) => classes.filter((c) => c.size === s).sort((a, b) => a.range_band_min_km - b.range_band_min_km);
let startClass = classes.find((c) => c.class_id === b7.class_choice?.class_id) ?? null;
let size;
let sizeSource;
let startNote = null;
if (startClass) {
  size = startClass.size;
  sizeSource = `class_choice_${b7.class_choice.source}`;
} else {
  size = sizeFromSeats(b7.seats_weekly) ?? car.size ?? 'M';
  sizeSource = sizeFromSeats(b7.seats_weekly) ? 'weekly_trips' : car.size ? 'current_car_seats' : 'default_medium';
  const sc = bySize(size);
  startClass = sc.find((c) => c.range_band_min_km >= C.MIN_START_RANGE_KM) ?? sc[0] ?? null;
  if (b7.trips.length) startNote = 'no_class_from_vehicle_choice';
}
const needWltp = (trip, cls) => {
  const c = cls.c_wltp_kwh_100km / 100;
  const v = trip.dist_km / trip.drive_time_h;
  const f = v > C.V_MOTORWAY ? C.F_DRIVE_MOTORWAY : C.F_DRIVE_NORMAL;
  return trip.range_need_b1_km * (f + (C.P_HEAT_KW * trip.drive_time_h) / (trip.dist_km * c));
};
const weeklyNeeds = startClass ? weekly.filter((t) => t.range_need_b1_km != null).map((t) => ({
  trip_id: t.trip_id,
  label: t.label,
  range_need_b1_km: t.range_need_b1_km,
  wltp_need_km_start_class: Math.round(needWltp(t, startClass)),
})) : [];
if (startClass && weeklyNeeds.some((w) => w.wltp_need_km_start_class > startClass.range_band_min_km)) startNote = 'weekly_trips_exceed_largest_class';

// ---------- calculation per class × electricity (doc 4.3) ----------
const km = b7.annual_km;
const iceRow = (fuel, ccSize) => ice.find((r) => r.fuel === fuel && r.carculator_size === ccSize);
const stagesOf = (r) => ({
  vehicle_production: r.co2_vehicle_production_g_km,
  battery: r.co2_battery_g_km,
  operation: r.co2_operation_carculator_g_km,
  maintenance: r.co2_maintenance_g_km,
  road: r.co2_road_g_km,
  disposal: r.co2_disposal_g_km,
});
const sum = (o) => Object.values(o).reduce((s, x) => s + x, 0);

function pickComparison(saving) {
  if (!(saving > 0)) return null;
  let best = null;
  for (const ref of POOL) {
    const ratio = saving / ref.t;
    for (const k of [1, 2, 3]) {
      const dev = Math.abs(ratio - k) / k;
      if (dev <= 0.2 && (!best || dev < best.dev)) best = { ...ref, k, dev };
    }
  }
  if (best) return { type: best.type, key: best.key, multiple: best.k, reference_t: best.t, text: `≈ ${best.k} × ${best.label}` };
  const pct = Math.round((saving / C.FOOTPRINT_CH_T) * 100);
  return { type: 'footprint', key: 'footprint_ch', multiple: null, reference_t: C.FOOTPRINT_CH_T, text: `${pct} % of the annual footprint of a person in Switzerland` };
}

const variants = [];
for (const cls of classes) {
  const ccSize = cls.carculator_size;
  const ref = iceRow(refFuel, ccSize);
  if (!ref) { b7.warnings.push(`ice_reference_missing: ${refFuel} ${ccSize}`); continue; }
  const evSt = stagesOf(cls);
  const refSt = stagesOf(ref);
  const evTot = sum(evSt);
  const refTot = sum(refSt);
  const block1 = {
    ev_total_g_km: r1(evTot),
    ref_total_g_km: r1(refTot),
    ev_share_pct: Math.round((evTot / refTot) * 100),
    ev_stages_pct_of_ref: Object.fromEntries(Object.entries(evSt).map(([k, v]) => [k, r1((v / refTot) * 100)])),
    ref_stages_pct_of_ref: Object.fromEntries(Object.entries(refSt).map(([k, v]) => [k, r1((v / refTot) * 100)])),
  };
  const info1 = {
    battery_gross_kwh: cls.carculator_battery_gross_kwh,
    battery_share_pct: Math.round((cls.co2_battery_g_km / evTot) * 100),
  };

  for (const el of ['consumer_mix', 'renewable_product']) {
    const evOp = el === 'consumer_mix' ? cls.co2_operation_ch_mix_g_km : cls.co2_operation_renewable_g_km;
    const evVarGkm = evOp + cls.co2_maintenance_road_g_km;
    const evOneoffYear = cls.co2_oneoff_production_disposal_t / C.N_LIFE_YEARS;
    const eSwitch = evOneoffYear + (km * evVarGkm) / 1e6;
    let block;
    if (block2 === '2a') {
      const sCar = car.size ?? cls.size;
      const mRef = iceRow(car.fuel, SIZE_TO_CC[sCar])?.co2_maintenance_road_g_km ?? ref.co2_maintenance_road_g_km;
      const eKeep = (km * (car.consumption_l_100km / 100) * C.EF_FUEL[car.fuel]) / 1000 + (km * mRef) / 1e6;
      const saving = eKeep - eSwitch;
      block = {
        type: '2a',
        keep_t_per_year: r2(eKeep),
        switch_t_per_year: r2(eSwitch),
        saving_t_per_year: r2(saving),
        verdict: saving > 0 ? 'switch_pays_off' : 'no_climate_benefit',
      };
    } else {
      const pet = iceRow('petrol', ccSize);
      const petVar = pet.co2_operation_carculator_g_km + pet.co2_maintenance_road_g_km;
      const saving = (pet.co2_oneoff_production_disposal_t - cls.co2_oneoff_production_disposal_t) / C.N_LIFE_YEARS + (km * (petVar - evVarGkm)) / 1e6;
      block = {
        type: '2b',
        petrol_t_per_year: r2(pet.co2_oneoff_production_disposal_t / C.N_LIFE_YEARS + (km * petVar) / 1e6),
        ev_t_per_year: r2(eSwitch),
        saving_t_per_year: r2(saving),
        verdict: saving > 0 ? 'ev_saves' : 'no_climate_benefit',
      };
    }
    variants.push({
      class_id: cls.class_id,
      size: cls.size,
      carculator_size: ccSize,
      range_band_min_km: cls.range_band_min_km,
      wltp_range_median_km: cls.wltp_range_median_km,
      electricity_product: el,
      reference_fuel: refFuel,
      block1,
      info1,
      block2: block,
      comparison: pickComparison(block.saving_t_per_year),
    });
  }
}

b7.car = car;
b7.block2_type = block2;
b7.start = {
  size,
  size_source: sizeSource,
  class_id: startClass?.class_id ?? null,
  note: startNote,
  weekly_needs: weeklyNeeds,
  slider_classes: bySize(size).map((c) => c.class_id),
};
b7.variants = variants;
b7.constants = { ...C, REAL_NEDC_USED: nedcF };

return [{ json: { profile: base.profile, session: base.session, b7 } }];
