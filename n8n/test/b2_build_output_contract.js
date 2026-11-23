// B2 Charging – Build Output Contract (v1.1)
// v1.1 adds: household-socket hint in home.notes, home running cost, public DC cost in the ranking,
//            the static charging-time knowledge item, and shared.location (municipality, canton).
// n8n Code node · Language: JavaScript · Mode: Run Once for Each Item
// Input : one item from "Merge" = profile + session + charging + home block + work block
//         (+ optional lookups.* written by lanes that are not built yet)
// Output: the B2 contract v1.0 (see b2_output_contract.md). Only this node knows the contract shape.
//
// Lanes still to build write their results to $json.lookups.* and need no change here:
//   lookups.p_home, lookups.p_public_AC -> { value, unit, source, as_of }
//   lookups.subsidy                     -> { amount_chf, programmes[] }
//   lookups.public                      -> { status: 'ok', home: { ac, dc }, work: { ac, dc }, operators[] }
//   info_b, info_c                      -> static info blocks (top level of the item)

const charging = $json.charging ?? {};
const show = charging.show ?? { everyday: false, info_b: false, info_c: false };
const lookups = $json.lookups ?? {};
const everyday = show.everyday === true;

const pub = lookups.public ?? null;
let home = everyday ? ($json.home ?? null) : null;
const work = everyday ? ($json.work ?? null) : null;

// ---- constants (single place) ----
const KWH_PER_100KM = 17;
const INSTALLATION = {
  min: 2000,
  max: 3500,
  unit: 'CHF',
  source: 'Leitfaden Ladeinfrastruktur im Stockwerkeigentum; TCS wallbox test',
  as_of: '2024',
};
const valueObj = (v, unit) => v ?? { value: null, unit, source: null, as_of: null };
const per100 = (price) =>
  typeof price === 'number' ? Math.round(price * KWH_PER_100KM * 100) / 100 : null;

// ---- shared values for B3 and B6 ----
const pHome = valueObj(lookups.p_home, 'CHF/kWh');
const pPublicAC = valueObj(lookups.p_public_AC, 'CHF/kWh');

// public DC price: cheapest no-subscription DC plan of the nearest priced DC site near home (power tier by site power)
const dcPlanOf = (site) => {
  const tier = (site.max_power_kw ?? 0) >= 100
    ? (o) => o.dc_100plus_max_chf_kwh ?? o.dc_100plus_min_chf_kwh ?? o.dc_23_99_max_chf_kwh ?? o.dc_23_99_min_chf_kwh
    : (o) => o.dc_23_99_max_chf_kwh ?? o.dc_23_99_min_chf_kwh;
  const priced = (site.tariff_options ?? []).filter((o) => o.tariff_scope !== 'ad_hoc' && typeof tier(o) === 'number');
  const current = priced.filter((o) => o.availability_status === 'current-check-app');
  const pool = current.length ? current : priced;
  if (!pool.length) return null;
  pool.sort((a, b) => (a.subscription_fee_chf_month ?? 0) - (b.subscription_fee_chf_month ?? 0) || tier(a) - tier(b));
  return { value: tier(pool[0]), plan: pool[0], site };
};
let pDC = null;
for (const site of pub?.home?.dc?.nearest ?? []) { pDC = dcPlanOf(site); if (pDC) break; }
// 23 Nov: no priced DC site near home -> same flat default as Module Charging (used by Costs), so Charging and Costs agree
const SHELL_DC = { value: 0.52, plan: { plan_name: 'Shell Recharge e-Deal (flat default)', source_url: 'https://www.shell.ch/de_ch/laden/ladetarife-fuer-ihr-elektroauto.html' }, site: null, flat: true };
if (!pDC) pDC = SHELL_DC;

// home block: household-socket hint (doc 4.1) and running cost (doc 4.3)
if (home) {
  const notes = [...(home.notes ?? [])];
  if (charging.household_socket_hint) notes.unshift('A household socket is not suitable for regular charging.');
  const costs = { ...(home.costs ?? {}) };
  if (typeof pHome.value === 'number') {
    costs.running = {
      chf_per_100km: per100(pHome.value),
      p_home_chf_kwh: pHome.value,
      rp_per_kwh: pHome.detail?.rp_per_kwh ?? Math.round(pHome.value * 10000) / 100,
      kwh_per_100km: KWH_PER_100KM,
      source: pHome.source,
      as_of: pHome.as_of,
    };
  }
  home = { ...home, notes, costs };
}

const acCount = pub?.home?.ac?.count_within_500m;
const acNear = typeof acCount === 'number' ? acCount > 0 : null; // null = unknown
const dcList = pub?.home?.dc?.nearest;
const dcNear = Array.isArray(dcList) ? dcList.length > 0 : null;

const homeNode = charging.home_node ?? null;
const installs = ['H1', 'H2', 'H3'].includes(homeNode); // catalogue: all housing types

let everydayCalc = null; // catalogue rule; the user override is applied by the consumer
if (everyday && charging.status === 'ok') {
  if (homeNode === 'H0' || installs) everydayCalc = 'private_ac';
  else if (homeNode === 'HX') everydayCalc = acNear === null ? null : acNear ? 'public_ac' : 'public_dc';
}

const shared = {
  p_home: pHome,
  p_public_AC: pPublicAC,
  installation_cost: installs
    ? { applies: true, ...INSTALLATION }
    : { applies: false, min: 0, max: 0, unit: 'CHF', source: null, as_of: null },
  installation_subsidy: {
    amount_chf: lookups.subsidy?.amount_chf ?? null,
    programmes: lookups.subsidy?.programmes ?? [],
  },
  public_ac_within_500m: { value: acNear, radius_m: 500 },
  everyday_charging_calc: everydayCalc,
  location: lookups.location ?? { municipality: null, bfs_number: null, canton: null },
};

// ---- ranking: home, work, public AC, public DC (B2 doc 4.6) ----
const options = [];
if (everyday && charging.status === 'ok') {
  if (home && homeNode !== 'HX') {
    options.push({ option: 'home', node: homeNode, available_now: homeNode === 'H0', cost_per_100km_chf: per100(pHome.value) });
  }
  if (work && work.node !== 'not_relevant') {
    options.push({ option: 'work', node: work.node, available_now: work.node === 'W0', cost_per_100km_chf: null });
  }
  options.push({ option: 'public_ac', node: null, available_now: acNear, cost_per_100km_chf: per100(pPublicAC.value) });
  options.push({ option: 'public_dc', node: null, available_now: dcNear, cost_per_100km_chf: pDC ? per100(pDC.value) : null, price_chf_kwh: pDC ? pDC.value : null, price_source: pDC ? (pDC.flat ? 'Shell Recharge e-Deal, fast charging (DC) 100 kW or more, as of 3 Nov 2026 (flat default)' : pDC.plan?.plan_name ?? null) : null, price_url: pDC?.plan?.source_url ?? null, price_flat: !!pDC?.flat });
}
const ranking = options.map((o, i) => ({ rank: i + 1, ...o }));

// ---- warnings and status ----
const warnings = [];
if (everyday && charging.status === 'ok') {
  if (pub?.status !== 'ok') warnings.push('public_charging_unavailable');
  if (!lookups.p_home) warnings.push('home_tariff_unavailable');
}
if (charging.status === 'ok') {
  if (show.info_b && !$json.info_b) warnings.push('info_b_unavailable');
  if (show.info_c && !$json.info_c) warnings.push('info_c_unavailable');
}
const status = charging.status !== 'ok' ? 'incomplete' : warnings.length ? 'partial' : 'ok';

// ---- contract ----
return {
  json: {
    contract_version: '1.0',
    barrier: $json.session?.barrier ?? 'B2 Charging',
    status,
    missing: charging.missing ?? [],
    interest: charging.interest ?? [],
    result: {
      home,
      work,
      public: everyday ? pub : null,
      ranking,
      cost_basis: { kwh_per_100km: KWH_PER_100KM },
      charging_time: everyday
        ? {
            home_ac: 'With a home wallbox (11 kW AC) one overnight session covers several days of typical use: charge 1-2 times per week overnight.',
            public_ac: 'At a public AC point the car stays several hours, for example overnight or during work.',
            public_dc: 'Fast charging (DC) takes about 20-30 minutes for a typical weekly need: charge while shopping.',
          }
        : null,
      info_b: show.info_b ? ($json.info_b ?? null) : null,
      info_c: show.info_c ? ($json.info_c ?? null) : null,
    },
    shared,
    inputs_used: everyday
      ? ['postal_code', 'home_address', 'home_charging_status', 'fixed_parking', 'housing_type', 'charging_at_work', 'work_postal_code', 'work_address']
      : [],
    next: { recommended: 'B3', alternatives: show.info_b || show.info_c ? ['B1', 'B4'] : ['B1'] },
    warnings,
  },
};