// Validate the hand-transcribed source JSON and derive the published callouts.
// No stats are synthesized here; all callouts are reducible to src/data/wz2.json.
import fs from 'node:fs';
const root = new URL('..', import.meta.url);
const read = name => JSON.parse(fs.readFileSync(new URL(`../src/data/${name}.json`, import.meta.url), 'utf8'));
const wz2 = read('wz2');
const wz1 = read('wz1');
const assert = (value, message) => { if (!value) throw new Error(message); };
assert(wz1.captureDate === '2026-11-05' && wz2.captureDate === '2026-11-05', 'Capture date must remain Nov 5, 2026');
assert(wz2.players.length === 11, 'WZ2 must have exactly 11 unique players');
assert(new Set(wz2.players.map(p => p.name)).size === 11, 'WZ2 names must be unique');
assert(wz2.players.filter(p => p.isJack).length === 1, 'Exactly one Jack row');
for (const mode of ['br', 'res']) {
  for (const tab of ['career', 'eliminations', 'placements']) {
    assert(wz2.players.filter(p => p[mode]?.[tab]).length === 10, `${mode}/${tab} must have 10 visible source entries`);
  }
  for (const p of wz2.players) {
    const e = p[mode]?.eliminations;
    if (e) assert(Math.abs(e.elims / e.deaths - e.ed) < 0.01, `${mode}/${p.name}: E/D does not match raw elims and deaths`);
  }
}
assert(!wz2.players.find(p => p.name === 'DRHOUSE9054').br.career, 'DRHOUSE9054 is placements-only in BR');
assert(wz1.seasons.br.reduce((sum, row) => sum + row.matches, 0) === wz1.modes.br.processedMatches, 'BR season total must match 10,841');
assert(wz1.seasons.res.reduce((sum, row) => sum + row.matches, 0) === wz1.modes.res.matches, 'Resurgence season total must match 188');
assert(wz1.seasons.plunder.reduce((sum, row) => sum + row.matches, 0) === wz1.modes.plunder.processedMatches, 'Plunder season total must match 102');
const numberFormat = new Intl.NumberFormat('en-US');
const leaders = (mode, tab, key, decimals = 0) => {
  const rows = wz2.players.filter(p => p[mode]?.[tab]?.[key] != null);
  const best = Math.max(...rows.map(p => p[mode][tab][key]));
  return { names: rows.filter(p => p[mode][tab][key] === best).map(p => p.name), value: best, display: decimals ? best.toFixed(decimals) : numberFormat.format(best) };
};
const callouts = {};
for (const mode of ['br', 'res']) callouts[mode] = {
  score: { label: 'Highest score', ...leaders(mode, 'career', 'score') },
  wins: { label: 'Most wins', ...leaders(mode, 'placements', 'wins') },
  ed: { label: 'Best E/D', ...leaders(mode, 'eliminations', 'ed', 2) },
  elims: { label: 'Most eliminations', ...leaders(mode, 'eliminations', 'elims') }
};
fs.writeFileSync(new URL('../src/data/callouts.json', import.meta.url), JSON.stringify({ captureDate: wz2.captureDate, derivation: 'maximum values from src/data/wz2.json; ties retain every player', modes: callouts }, null, 2) + '\n');
fs.mkdirSync(new URL('../public', import.meta.url), { recursive: true });

console.log('Validated WZ1 seasons and all 60 WZ2 source rows; callouts:', JSON.stringify(callouts));
