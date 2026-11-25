// Runs n8n/test/b3_7_costs.js locally on a captured "Cost inputs" item. Usage: node run.js input.json '{"cost_assumptions":{...}}'
const fs = require('fs'), path = require('path');
const inp = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const patch = process.argv[3] ? JSON.parse(process.argv[3]) : {};
const deep = (a, b) => { for (const k of Object.keys(b)) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') deep(a[k], b[k]); else a[k] = b[k]; } return a; };
deep(inp.profile, patch);
const code = fs.readFileSync(path.join(__dirname, '../../../n8n/test/b3_7_costs.js'), 'utf8');
const $input = { first: () => ({ json: inp }) };
const out = new Function('$input', code)($input);
process.stdout.write(JSON.stringify(out[0].json));
