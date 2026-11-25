// B7 Ecology – Real-world note (Claude, 25 Nov 2026). Runs after "Build Output Contract".
// The fixed assumption line said "NEDC × 1.39" for every car; "Ecology calc" now uses the factor for the year the type
// was approved (same rule as B3 Costs). This node writes the factor actually used into that line. Mode: Run Once for Each Item.
const o = $json;
const car = $('Ecology calc').first().json.b7?.car ?? {};
const f = car.real_world_factor;
const txt = car.consumption_source === 'user' ? 'your value'
  : f == null ? 'WLTP × 1.19 · NEDC × 1.12 to 1.40 by approval year'
  : car.consumption_nedc_mean != null ? `NEDC × ${f} (type approved ${car.approval_year ?? 'year unknown'}; ICCT gap for that year)`
  : `WLTP × ${f}`;
const assumptions = (o.result?.assumptions ?? []).map((a) => (a.key === 'real_world' ? { ...a, value: txt } : a));
return { json: { ...o, result: o.result ? { ...o.result, assumptions } : o.result } };
