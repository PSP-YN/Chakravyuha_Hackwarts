const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const filename = path.resolve(__dirname, '../lib/domain.ts');
const compiled = ts.transpile(fs.readFileSync(filename, 'utf8'), { module: ts.ModuleKind.CommonJS });
const domain = new Module(filename, module);
domain.filename = filename;
domain.paths = Module._nodeModulePaths(path.dirname(filename));
domain._compile(compiled, filename);
const { money, netPaise, toPaise } = domain.exports;

test('rupee amounts convert to integer paise without floating point drift', () => {
  assert.equal(toPaise('2400'), 240000);
  assert.equal(toPaise('0.1'), 10);
  assert.equal(toPaise('19.99'), 1999);
});

test('invalid negative and non-finite amounts are rejected', () => {
  assert.throws(() => toPaise('-1'));
  assert.throws(() => toPaise('NaN'));
  assert.throws(() => toPaise('Infinity'));
});

test('formats rupee amounts using Indian grouping', () => {
  assert.equal(money(1795000), '₹17,950');
});

test('net realisation subtracts farmer-borne costs from gross offer value', () => {
  const offer = {
    id: 'test', listing_id: 'listing', buyer_id: 'buyer', owner_id: 'seller',
    offered_price_paise: 240000, accepted_quantity: 8,
    transport_cost_paise: 50000, handling_cost_paise: 25000,
    commission_cost_paise: 30000, other_cost_paise: 20000,
    status: 'completed', created_at: new Date(0).toISOString(),
  };
  assert.equal(netPaise(offer), 1795000);
});
