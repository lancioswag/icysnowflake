// TEST copy only: compact check of every navigator-test answer (read in n8n executions, never sent to the app).
const j = $input.first().json; const r = j.result || {};
const m = (b) => (b && b.min != null ? Math.round((b.min + (b.max ?? b.min)) / 2) : null);
const out = { barrier: j.barrier, status: j.status, missing: j.missing, result_keys: Object.keys(r) };
if (j.barrier === 'B3' && r.lines) {
  out.b3 = { method: r.method, missing_inputs: r.missing_inputs, default_purchase: r.default_purchase, no_ref: r.no_reference,
    asm: (r.assumptions || []).filter((a) => ['current_car_consumption','fuel_price','insurance','motor_vehicle_tax','interest_rate','p_home','current_car_value_today'].includes(a.key)).map((a) => [a.key, a.value, a.unit]),
    lines: r.lines.filter((l) => l.kind !== 'option' || l.selected).map((l) => ({ id: l.line_id, cls: l.class_id, buy: l.purchase, pb: l.payback_year, price: m(l.price_today_chf), price_src: l.price_source, net: m(l.upfront && l.upfront.net), v0: l.value_today_chf, v0src: l.value_today_source,
      y: Object.fromEntries((l.years || []).filter((y) => [3, 5, 8, 10, 12].includes(y.n)).map((y) => [y.n, [m(y.saving_vs_current), m(y.value_after), y.saving_residual_scenarios && y.saving_residual_scenarios.flips ? 'FLIP' : '', y.value_after_band && y.value_after_band.extrapolated ? 'X' : '', y.battery && y.battery.warranty_over ? 'W' : '']])),
      y5: (() => { const y = (l.years || []).find((q) => q.n === 5); return y ? { items: y.items, run: y.running_per_year, tpy: m(y.total_per_year), va: m(y.value_after) } : null; })(), ed: l.energy_detail, nulls: l.kind === 'option' ? (l.years || []).filter((y) => !y.saving_vs_current || y.saving_vs_current.min == null).map((y) => y.n) : [], ny: (l.years || []).length })) };
}
return [{ json: out }];
