// C – Assist (Claude copy, 25 Nov): + car_sale_price_chf, ev_size, ev_purchase, ev_price_chf, ev_extra_cash_chf in FIELDS.
// Contract assist-2.0 (BEV Navigator UI): { mode: 'chat' | 'intake', model?, request_id, message, history[], context, intake? }
const b = $input.first().json.body || {};
const clean = (t, n) => String(t ?? '').replace(/[\u0000-\u0008\u000B-\u001F]/g, '').trim().slice(0, n);
const message = clean(b.message, 500);
if (!['chat', 'intake'].includes(b.mode) || !message) return [{ json: { skip: true, response: { status: 'off', answer: null } } }];
const mode = b.mode;

// MODEL SELECTOR: change DEFAULT_MODEL to switch the model for everyone; the page may also send { model: '<key>' }.
const DEFAULT_MODEL = 'openai';
const MODELS = {
  openai: { provider: 'openai', model: 'gpt-6-luna' },
  groq: { provider: 'groq', model: 'openai/gpt-oss-120b' },
  gemini: { provider: 'gemini', model: 'gemini-3.8-flash' },
  anthropic: { provider: 'anthropic', model: 'claude-haiku-5-5' },
};
const key = MODELS[b.model] ? b.model : DEFAULT_MODEL;
const pick = MODELS[key];

const history = (Array.isArray(b.history) ? b.history : []).slice(-6).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: clean(m.text, 600) })).filter((m) => m.content);
let ctx = b.context && typeof b.context === 'object' ? b.context : {};
let ctxText = JSON.stringify(ctx);
if (ctxText.length > 14000) { ctx = { ...ctx, result: ctx.result ? { facts: ctx.result.facts, sources: (ctx.result.sources || []).slice(0, 25) } : null }; ctxText = JSON.stringify(ctx).slice(0, 14000); }
const intake = b.intake && typeof b.intake === 'object' ? b.intake : {};
const allowed = { charging_at_work: ['charger_available', 'parking_no_charger', 'no_parking', 'no_car_commute'], home_charging_status: ['yes', 'no', 'unknown'], fixed_parking: ['yes', 'no'], housing_type: ['house_owner', 'condo_owner', 'tenant'], everyday_charging: ['private_ac', 'public_ac', 'public_dc'], electricity_product: ['consumer_mix', 'renewable_product'] };
const FIELDS = {
  postal_code: '4-digit Swiss postal code of home', home_place: 'town of home if no postal code is given',
  charging_at_work: allowed.charging_at_work.join(' | ') + ' (does the person drive to work, and can they park / charge there)',
  work_postal_code: '4-digit postal code of the workplace', work_place: 'town of the workplace', commute_km: 'one-way km to work (number)', commute_days: 'days a week driving to work (1-7)',
  trips_add: 'array of other regular trips: [{ label, km_one_way, times, per: week | month | year }]',
  home_charging_status: 'yes | no | unknown (can charge at home)', fixed_parking: 'yes | no', housing_type: 'house_owner | condo_owner | tenant',
  car_brand: 'brand of the current car', car_model: 'model of the current car', car_fuel: 'petrol | diesel | electric | petrol hybrid | diesel hybrid', no_car: 'true if the person has no car',
  car_mileage_km: 'mileage of the current car (number)', car_first_registration_year: 'year (number)',
  second_car: 'none (if no other car stays in the household)', people: 'people in the car on most trips (1-7)', trailer: 'none | small | large',
  car_sale_price_chf: 'price the person expects or was offered for selling the current car, CHF (number)',
  ev_size: 'type of electric car wanted: small (city car) | medium (sedan or estate) | large (minivan, 6-7 seats)',
  ev_purchase: 'new | used (electric car wanted)',
  ev_price_chf: 'price of the electric car the person looks at, CHF (number); not the cash budget',
  ev_extra_cash_chf: 'cash the person can add on top of the sale of the current car, CHF (number)', charging_interest: 'array of everyday | trips_ch | abroad', battery_entry: 'forecast | used_car',
};
const system = [
  'You are the assistant of the BEV Navigator: a free, neutral check built by a student team of the University of St. Gallen (HSG) with partners. It helps private persons in Switzerland find out whether an electric car fits their life.',
  'Topics and codes: B1 Range & battery life, B2 Charging access, B3 Costs & resale value, B4 Which car fits me, B7 Climate impact.',
  'DATA (use when asked about privacy or storage): answers are stored in the browser on this device; only with an account are they also saved in the Navigator database, linked to that account. To calculate, answers are sent to the Navigator server; they are not sold or shared with advertisers. "Delete my answers" on the start page removes them.',
  'Rules:',
  '1. Answer in the language of the user (English if unclear). Keep it short: 1 or 2 plain sentences, at most 45 words, unless the user asks for more. No lists, tables or markdown.',
  '2. Use only the figures, results and sources in CONTEXT and DATA. Never invent numbers, prices, car models, subsidies or sources.',
  '3. Explain trade-offs; never give blanket advice such as "buy an EV" or "do not buy an EV". Stay neutral: no brand, dealer or provider recommendations.',
  '4. Do not ask for personal data beyond the Navigator questions and do not repeat addresses or e-mail addresses.',
  '5. PATCH: put facts the user clearly states into "patch", using only the keys of FIELDS. Never guess values the user did not say. Use null for no patch.',
  mode === 'chat'
    ? '6. If the user wants a personal result that the Navigator has not calculated yet (e.g. which car fits, costs, charging, range or climate for them), set "start_check" to the topic codes that answer it and say in one sentence that you will ask a few short questions here in the chat. Otherwise start_check is null. If the user clearly wants to change one existing answer, you may propose one change from ALLOWED_CHANGES in "proposed_change" (the page asks to confirm).'
    : '6. The user is answering CURRENT_QUESTION inside the chat check. Fill "patch" with every fact in the message, also facts for later questions (the page uses them and skips those questions). A town name goes into home_place / work_place, the page finds the postal code. In "answer" write one short sentence that confirms what you understood; only if the message does not answer CURRENT_QUESTION, ask it again in simpler words. Never ask for a postal code when a town is given. Do not ask the next question yourself, the page does that. start_check and proposed_change are null.',
  'Reply with JSON only: {"answer": string, "source_ids": array of up to 3 ids from CONTEXT.result.sources, "proposed_change": null or {"field", "value", "label"}, "start_check": null or array of codes, "patch": null or object}.',
  'FIELDS: ' + JSON.stringify(FIELDS),
  'ALLOWED_CHANGES: ' + JSON.stringify(allowed),
].join('\n');
const extra = mode === 'intake' ? '\nCURRENT_QUESTION: ' + JSON.stringify(intake.current_question || null) + '\nANSWERS_SO_FAR: ' + JSON.stringify(intake.answers || null) : '';
const msgs = [...history, { role: 'user', content: message }];
let request;
if (pick.provider === 'anthropic') request = { model: pick.model, max_tokens: 700, system: system + '\nCONTEXT: ' + ctxText + extra, messages: msgs };
else if (pick.provider === 'gemini') request = { systemInstruction: { parts: [{ text: system + '\nCONTEXT: ' + ctxText + extra }] }, contents: msgs.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })), generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 4000 } };
else {
  request = { model: pick.model, messages: [{ role: 'system', content: system }, { role: 'system', content: 'CONTEXT: ' + ctxText + extra }, ...msgs], response_format: { type: 'json_object' } };
  if (pick.provider === 'openai') { request.max_completion_tokens = 700; request.reasoning_effort = 'none'; } else request.max_tokens = 700;
}
return [{ json: { skip: false, mode, model_key: key, provider: pick.provider, model: pick.model, ctx, allowed, fields: Object.keys(FIELDS), request } }];
