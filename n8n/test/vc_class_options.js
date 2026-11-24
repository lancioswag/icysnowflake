// B4 · 5 Two cars – everyday EV (smallest class covering all must-be-EV trips) and do-everything EV
// (smallest class covering ALL trips), plus up to 3 options, driving days and the tipping point.
// Spec: B4 §4.4. Changes vs. doc (PENDING team OK):
//   - "do-everything EV" replaces the reference line "EV the size of your current car"
//   - no class in the seat size covers the must trips → statement + nearest larger class (shown, not forced)
//   - "covers ≥ 1 more trip" counted per trip × season
// 25 Nov 2026 (Claude, Simone): the type the person chose (profile.target_ev.size) wins when it is LARGER than what the
//   seats need: if you pick a minivan we never answer with a city car. A smaller choice than the seats need stays a note.
// In: trips (3), fit (4), catalogue (1), your_cars (2), profile.selected_class_id, profile.target_ev. Out: adds `two_cars`.
// Mode: Run Once for Each Item.

const input = $input.item.json;
const profile = input.profile || {};
const trips = input.trips || [];
const fit = input.fit || [];
const cat = Object.fromEntries((input.catalogue || []).map(c => [c.class_id, c]));
const valid = (input.valid_classes || []).map(id => cat[id]);
const MAX_OPTIONS = 3;
const SIZE_ORDER = ['S', 'M', 'L'];
const LEVEL = { none: 0, small: 1, large: 2 };
const TGT = SIZE_ORDER.includes(profile.target_ev && profile.target_ev.size) ? profile.target_ev.size : null;
const sizeFor = s => {
  const bySeats = s <= 4 ? 'S' : s <= 5 ? 'M' : 'L';
  return TGT && SIZE_ORDER.indexOf(TGT) > SIZE_ORDER.indexOf(bySeats) ? TGT : bySeats;
};
const canTow = (c, lvl) => lvl === 0 || (lvl === 1 ? c.towbar_available : c.towbar_large_available);
const r1 = x => Math.round(x * 10) / 10;

const rows = (tripId, classId) => fit.filter(f => f.trip_id === tripId && f.class_id === classId);
const covers = (c, list) => list.every(t => rows(t.trip_id, c.class_id).every(f => f.fits));
const failingPairs = c => fit.filter(f => f.class_id === c.class_id && !f.fits).length;

// Smallest class that covers `list`, starting at the size its seats need (or the larger type you chose), moving up only if allowed
const smallestCovering = (list, allowLarger) => {
  const seats = list.length ? Math.max(...list.map(t => t.seats)) : 4;
  const lvl = list.reduce((m, t) => Math.max(m, LEVEL[t.trailer]), 0);
  const size = sizeFor(seats);
  const ok = c => canTow(c, lvl) && covers(c, list);
  const same = valid.filter(c => c.size === size).find(ok);
  if (same || !allowLarger) return { size, lvl, cls: same || null, larger: false };
  const bigger = valid.filter(c => SIZE_ORDER.indexOf(c.size) > SIZE_ORDER.indexOf(size)).find(ok);
  return { size, lvl, cls: bigger || null, larger: !!bigger };
};

// Per class: which trips / days it covers
const describe = c => {
  let total = 0, covered = 0, evKm = 0;
  const ev_trips = [], not_covered = [];
  for (const t of trips) {
    const rs = rows(t.trip_id, c.class_id);
    const ok = rs.filter(f => f.fits).reduce((s, f) => s + f.days, 0);
    const bad = rs.filter(f => !f.fits);
    total += t.days_per_year;
    covered += ok;
    if (ok > 0) { ev_trips.push({ trip_id: t.trip_id, label: t.label, days_on_ev: r1(ok) }); evKm += ok * 2 * t.km; }
    if (bad.length) not_covered.push({
      trip_id: t.trip_id, label: t.label,
      days: r1(bad.reduce((s, f) => s + f.days, 0)), of_days: t.days_per_year,
      seasons: bad.map(f => f.season),
      need_wltp_km: Math.max(...bad.map(f => f.need_wltp_km)),
      missing: [...new Set(bad.flatMap(f => f.missing))],
    });
  }
  return {
    class_id: c.class_id, size: c.size, size_label: c.size_label, seats_max: c.seats_max,
    min_wltp_km: c.range_band_min_km, towbar_available: c.towbar_available, towbar_large_available: c.towbar_large_available,
    price_min_chf: c.price_min_chf, price_max_chf: c.price_max_chf, n_prices: c.n_prices,
    driving_days: total, days_with_this_ev: r1(covered), share: total ? Math.round((covered / total) * 100) : null,
    not_covered, ev_trips, ev_annual_km: Math.round(evKm),
  };
};

// ---- Everyday EV and options (B4 §4.4 steps 2–3) ----
const must = trips.filter(t => t.coverage === 'must_ev');
const base = smallestCovering(must, false);
const options = [];
if (trips.length && base.cls) {
  options.push(base.cls);
  let best = failingPairs(base.cls);
  for (const c of valid.filter(c => c.size === base.size && canTow(c, base.lvl) && c.range_band_min_km > base.cls.range_band_min_km)) {
    if (options.length >= MAX_OPTIONS) break;
    const n = failingPairs(c);
    if (n < best) { options.push(c); best = n; }
  }
}
// Option C: nothing in the seat size → nearest larger class (shown, not selected)
const fallback = trips.length && !base.cls ? smallestCovering(must, true) : null;

const classOptions = options.map(describe);
const recommended = classOptions.length ? classOptions[0].class_id : null;
const selected = classOptions.some(o => o.class_id === profile.selected_class_id) ? profile.selected_class_id : recommended;

// ---- Do-everything EV: smallest class covering ALL trips ----
const all = smallestCovering(trips, true);
let doEverything = null;
if (trips.length) {
  if (all.cls) doEverything = { ...describe(all.cls), exists: true };
  else {
    const closest = valid.filter(c => SIZE_ORDER.indexOf(c.size) >= SIZE_ORDER.indexOf(all.size) && canTow(c, all.lvl))
      .sort((a, b) => failingPairs(a) - failingPairs(b))[0];
    doEverything = closest ? { ...describe(closest), exists: false } : { exists: false, class_id: null };
  }
}

// ---- Tipping point (nearest one): the most frequent rare trip – what if the EV had to do it every time? ----
const sel = classOptions.find(o => o.class_id === selected) || null;
let tipping = null;
if (sel && sel.not_covered.length) {
  const cand = sel.not_covered.map(n => trips.find(t => t.trip_id === n.trip_id))
    .sort((a, b) => b.days_per_year - a.days_per_year)[0];
  const res = smallestCovering([...must, cand], true);
  tipping = { trip_id: cand.trip_id, label: cand.label, frequency: cand.frequency,
    class_id: res.cls ? res.cls.class_id : null, larger_size: res.cls ? res.cls.size !== sel.size : null };
}

// ---- Anchor (block 7): current car vs. everyday EV seats ----
let anchor = null;
const cur = (input.your_cars || {}).current || {};
if (sel && cur.found && cur.seats > sel.seats_max) {
  const days = trips.filter(t => t.seats > sel.seats_max).reduce((s, t) => s + t.days_per_year, 0);
  anchor = { current_seats: cur.seats, days_needing_more_seats: r1(days), everyday_seats: sel.seats_max };
}

return {
  json: {
    ...input,
    two_cars: {
      must_size: base.size,
      chosen_size: TGT,
      trailer_level_must: Object.keys(LEVEL)[base.lvl],
      class_options: classOptions,
      recommended_class_id: recommended,
      selected_class_id: selected,
      fallback: fallback && fallback.cls ? { ...describe(fallback.cls), note: `larger than your seats need (${base.size})` } : null,
      do_everything: doEverything,
      tipping_point: tipping,
      anchor,
    },
  },
};
