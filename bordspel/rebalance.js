#!/usr/bin/env node
// Rebalance cards.js to match Wingspan-like distribution
const fs = require('fs');

// Read and eval current cards
const code = fs.readFileSync('/home/user/lesdoelstellingen/bordspel/app/cards.js', 'utf8');
// Replace const with var so eval works in module scope
eval(code.replace('const ALL_CARDS', 'var ALL_CARDS'));

// Seeded pseudo-random for reproducibility
let seed = 42;
function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
function randInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

const cards = ALL_CARDS.map(c => ({...c, kosten: [...c.kosten], vaardigheden: [...c.vaardigheden]}));

// ========== 1. VP REBALANCING (avg 5.88 → ~4.0) ==========
// Target distribution for 170 cards
const vpTargets = {0: 5, 1: 12, 2: 20, 3: 35, 4: 38, 5: 28, 6: 15, 7: 8, 8: 5, 9: 4};
// Verify total: 5+12+20+35+38+28+15+8+5+4 = 170 ✓

// Sort cards by their "value" (cost + invloed) to assign VP appropriately
// Higher cost + higher invloed = higher VP
cards.forEach(c => { c._sortVal = c.kosten.length * 3 + c.invloed * 0.4 + (c.kracht_type === 'roze' ? 1.5 : c.kracht_type === 'wit' ? 0.5 : 0); });
const sorted = [...cards].sort((a, b) => a._sortVal - b._sortVal);

// Build VP assignment array
const vpAssignments = [];
for (const [vp, count] of Object.entries(vpTargets)) {
  for (let i = 0; i < count; i++) vpAssignments.push(parseInt(vp));
}
// Shuffle slightly within bands to add variety (shuffle within groups of 5)
for (let i = 0; i < vpAssignments.length; i += 5) {
  const end = Math.min(i + 5, vpAssignments.length);
  const slice = vpAssignments.slice(i, end);
  const shuffled = shuffle([...slice]);
  for (let j = 0; j < shuffled.length; j++) vpAssignments[i + j] = shuffled[j];
}

sorted.forEach((card, i) => { card.vp = vpAssignments[i]; });

// ========== 2. COST DIVERSIFICATION (70% 2-cost → varied) ==========
// Target: 0: 17, 1: 42, 2: 68, 3: 34, 4: 9
const ideaTypes = ['sfeer', 'passer', 'weegschaal', 'spiegel'];

function assignCosts(card, count) {
  if (count === 0) { card.kosten = []; return; }
  const types = shuffle([...ideaTypes]);
  card.kosten = types.slice(0, count);
}

// Sort by current cost count to identify which ones to change
const costTargets = {0: 17, 1: 42, 2: 68, 3: 34, 4: 9};
const costAssignments = [];
for (const [cost, count] of Object.entries(costTargets)) {
  for (let i = 0; i < count; i++) costAssignments.push(parseInt(cost));
}

// Sort cards by VP (low VP → low cost, high VP → high cost)
const byVP = [...cards].sort((a, b) => a.vp - b.vp || rand() - 0.5);
// Sort cost assignments ascending
costAssignments.sort((a, b) => a - b);

// Add some randomness within VP tiers
for (let i = 0; i < costAssignments.length; i += 8) {
  const end = Math.min(i + 8, costAssignments.length);
  const slice = costAssignments.slice(i, end);
  const shuffled = shuffle([...slice]);
  for (let j = 0; j < shuffled.length; j++) costAssignments[i + j] = shuffled[j];
}

byVP.forEach((card, i) => {
  const targetCost = costAssignments[i];
  if (card.kosten.length !== targetCost) {
    assignCosts(card, targetCost);
  }
});

// ========== 3. TRADITIE REBALANCING ==========
// Target: contemplatief 43, empirisch 43, normatief 34, dialectisch 34, eclectisch 16
const traditieTargets = {contemplatief: 43, empirisch: 43, normatief: 34, dialectisch: 34, eclectisch: 16};
const traditieAssignments = [];
for (const [t, count] of Object.entries(traditieTargets)) {
  for (let i = 0; i < count; i++) traditieAssignments.push(t);
}
shuffle(traditieAssignments);

// Only change cards that are overrepresented
const currentTraditieCounts = {};
cards.forEach(c => { currentTraditieCounts[c.traditie] = (currentTraditieCounts[c.traditie] || 0) + 1; });

// Find cards that need to change traditie
const overrepresented = ['contemplatief', 'empirisch', 'normatief'];
const underrepresented = ['dialectisch', 'eclectisch'];
const needsChange = [];

for (const trad of overrepresented) {
  const target = traditieTargets[trad];
  const current = currentTraditieCounts[trad] || 0;
  const excess = current - target;
  if (excess > 0) {
    const cardsOfTrad = shuffle(cards.filter(c => c.traditie === trad));
    for (let i = 0; i < excess && i < cardsOfTrad.length; i++) {
      needsChange.push(cardsOfTrad[i]);
    }
  }
}

// Assign underrepresented tradities to those cards
const newTradAssignments = [];
for (const trad of underrepresented) {
  const target = traditieTargets[trad];
  const current = currentTraditieCounts[trad] || 0;
  const deficit = target - current;
  for (let i = 0; i < deficit; i++) newTradAssignments.push(trad);
}
shuffle(newTradAssignments);

needsChange.forEach((card, i) => {
  if (i < newTradAssignments.length) {
    card.traditie = newTradAssignments[i];
  }
});

// ========== 4. POWER TYPE REBALANCING ==========
// Target: bruin 106, wit 32, roze 9, groenblauw 14, geel 9 = 170
// Use DETERMINISTIC assignment by card ID to avoid shuffle bugs

const groenblauwPowers = [
  'Einde van de ronde: Pak 1 idee naar keuze uit de voorraad.',
  'Einde van de ronde: Trek 1 kaart van de stapel.',
  'Einde van de ronde: Leg 1 boek op deze filosoof.',
  'Einde van de ronde: Pak 1 Sfeer-idee uit de voorraad.',
  'Einde van de ronde: Pak 1 Passer-idee uit de voorraad.',
  'Einde van de ronde: Pak 1 Spiegel-idee uit de voorraad.',
  'Einde van de ronde: Pak 1 Weegschaal-idee uit de voorraad.',
  'Einde van de ronde: Trek 2 kaarten van de stapel.',
  'Einde van de ronde: Pak 2 ideeën naar keuze uit de voorraad.',
  'Einde van de ronde: Leg 1 boek op een filosoof naar keuze.',
  'Einde van de ronde: Pak 1 willekeurig idee uit de Bibliotheek.',
  'Einde van de ronde: Hergooi alle dobbelstenen in de Bibliotheek.',
  'Einde van de ronde: Trek 1 kaart en pak 1 willekeurig idee.',
  'Einde van de ronde: Leg 2 boeken op deze filosoof.',
];

const geelPowers = [
  'Einde van het spel: 1 VP per filosoof in de rij Lezen.',
  'Einde van het spel: 1 VP per 2 boeken op je bord.',
  'Einde van het spel: 1 VP per filosoof met dezelfde traditie als deze kaart.',
  'Einde van het spel: 1 VP per 3 ideeën in je bezit.',
  'Einde van het spel: 2 VP als je minstens 1 filosoof in elke rij hebt.',
  'Einde van het spel: 1 VP per filosoof in de rij Schrijven.',
  'Einde van het spel: 1 VP per filosoof in de rij Spreken.',
  'Einde van het spel: 1 VP per 2 referenties op je bord.',
  'Einde van het spel: 2 VP als je 4+ filosofen van dezelfde traditie hebt.',
];

const witPowers = [
  'Bij Aanstelling: Trek 2 kaarten uit de stapel.',
  'Bij Aanstelling: Pak 2 ideeën naar keuze uit de voorraad.',
  'Bij Aanstelling: Leg 1 boek op elke filosoof in dezelfde rij.',
  'Bij Aanstelling: Hergooi alle dobbelstenen in de Bibliotheek en pak 2.',
  'Bij Aanstelling: Bekijk de top 3 kaarten van de stapel en trek 1.',
  'Bij Aanstelling: Pak 3 ideeën van één type naar keuze.',
  'Bij Aanstelling: Trek 1 kaart per filosoof in je kortste rij.',
  'Bij Aanstelling: Pak 1 idee van elk type dat je al bezit.',
  'Bij Aanstelling: Trek kaarten tot je er 5 in hand hebt.',
  'Bij Aanstelling: Leg 2 boeken op deze filosoof.',
  'Bij Aanstelling: Pak 1 Sfeer en 1 Spiegel idee.',
  'Bij Aanstelling: Pak 1 idee per filosoof met dezelfde traditie op je bord.',
  'Bij Aanstelling: Pak 1 Passer en 1 Weegschaal idee.',
  'Bij Aanstelling: Trek 3 kaarten, houd 1 en leg de rest terug.',
  'Bij Aanstelling: Leg 1 boek op elke filosoof met boek-capaciteit 2+.',
];

// Build target type assignment: specific card IDs for each type
// Use modular arithmetic on card ID for deterministic, spread assignment
const typeOrder = [];
// 106 bruin, 32 wit, 14 groenblauw, 9 geel, 9 roze = 170
for (let i = 0; i < 106; i++) typeOrder.push('bruin');
for (let i = 0; i < 32; i++) typeOrder.push('wit');
for (let i = 0; i < 14; i++) typeOrder.push('groenblauw');
for (let i = 0; i < 9; i++) typeOrder.push('geel');
for (let i = 0; i < 9; i++) typeOrder.push('roze');

// Spread assignments evenly across card IDs using a simple hash
const typeAssignment = new Array(170);
const indices = Array.from({length: 170}, (_, i) => i);
// Shuffle the indices for spread
shuffle(indices);
for (let i = 0; i < 170; i++) {
  typeAssignment[indices[i]] = typeOrder[i];
}

// Apply type assignments and fix power texts
let gbIdx = 0, geIdx = 0, wiIdx = 0;
cards.forEach((card, i) => {
  const newType = typeAssignment[i];
  if (newType === card.kracht_type) return; // No change needed

  card.kracht_type = newType;
  if (newType === 'groenblauw') {
    card.kracht = groenblauwPowers[gbIdx % groenblauwPowers.length];
    gbIdx++;
  } else if (newType === 'geel') {
    card.kracht = geelPowers[geIdx % geelPowers.length];
    geIdx++;
  } else if (newType === 'wit') {
    card.kracht = witPowers[wiIdx % witPowers.length];
    wiIdx++;
  } else if (newType === 'bruin' && !card.kracht.toLowerCase().includes('tijdens de beurt')) {
    // If it was a non-bruin card that needs to become bruin, give it a standard power
    const bruinOpts = [
      'Tijdens de beurt: Pak 1 idee naar keuze uit de voorraad.',
      'Tijdens de beurt: Trek 1 kaart van de stapel.',
      'Tijdens de beurt: Leg 1 boek op deze filosoof.',
      'Tijdens de beurt: Pak 1 willekeurig idee uit de Bibliotheek.',
      'Tijdens de beurt: Hergooi alle dobbelstenen in de Bibliotheek.',
      'Tijdens de beurt: Pak 1 Sfeer-idee uit de voorraad.',
      'Tijdens de beurt: Pak 1 Passer-idee uit de voorraad.',
      'Tijdens de beurt: Pak 1 Spiegel-idee uit de voorraad.',
    ];
    card.kracht = bruinOpts[card.id % bruinOpts.length];
  } else if (newType === 'roze' && !card.kracht.toLowerCase().includes('tijdgeest')) {
    const rozeOpts = [
      'Tijdgeest: Wanneer een medespeler een filosoof aanspeelt, mag jij 1 kaart trekken.',
      'Tijdgeest: Wanneer een medespeler een idee pakt, pak jij ook 1 willekeurig idee.',
      'Tijdgeest: Wanneer een medespeler een boek plaatst, leg jij ook 1 boek.',
    ];
    card.kracht = rozeOpts[card.id % rozeOpts.length];
  }
});

// ========== 5. ADD Sp TO MORE CARDS ==========
// Current: 91 with Sp → target ~119
const withoutSp = shuffle(cards.filter(c => !c.vaardigheden.includes('Sp')));
let spAdded = 0;
for (let i = 0; i < withoutSp.length && spAdded < 28; i++) {
  withoutSp[i].vaardigheden.push('Sp');
  spAdded++;
}

// ========== CLEANUP ==========
cards.forEach(c => { delete c._sortVal; });

// ========== VERIFY STATISTICS ==========
const stats = {
  total: cards.length,
  vpAvg: (cards.reduce((s, c) => s + c.vp, 0) / cards.length).toFixed(2),
  vpDist: {},
  powerTypes: {},
  tradities: {},
  costs: {},
  spAccess: cards.filter(c => c.vaardigheden.includes('Sp')).length,
};

cards.forEach(c => {
  stats.vpDist[c.vp] = (stats.vpDist[c.vp] || 0) + 1;
  stats.powerTypes[c.kracht_type] = (stats.powerTypes[c.kracht_type] || 0) + 1;
  stats.tradities[c.traditie] = (stats.tradities[c.traditie] || 0) + 1;
  stats.costs[c.kosten.length] = (stats.costs[c.kosten.length] || 0) + 1;
});

console.log('=== REBALANCED STATISTICS ===');
console.log('Total cards:', stats.total);
console.log('VP average:', stats.vpAvg);
console.log('VP distribution:', stats.vpDist);
console.log('Power types:', stats.powerTypes);
console.log('Tradities:', stats.tradities);
console.log('Cost distribution:', stats.costs);
console.log('Sp access:', stats.spAccess, `(${(stats.spAccess/stats.total*100).toFixed(1)}%)`);

// ========== WRITE OUTPUT ==========
let output = '// Auto-generated from kaarten.json - Rebalanced v3.0 (Wingspan-inspired)\nconst ALL_CARDS = [\n';
cards.forEach((card, i) => {
  output += '  {\n';
  output += `    id: ${card.id},\n`;
  output += `    naam: ${JSON.stringify(card.naam)},\n`;
  output += `    geboren: ${card.geboren},\n`;
  output += `    overleden: ${card.overleden},\n`;
  output += `    stroming: ${JSON.stringify(card.stroming)},\n`;
  output += `    traditie: ${JSON.stringify(card.traditie)},\n`;
  output += `    invloed: ${card.invloed},\n`;
  output += `    vaardigheden: ${JSON.stringify(card.vaardigheden)},\n`;
  output += `    kosten: ${JSON.stringify(card.kosten)},\n`;
  output += `    vp: ${card.vp},\n`;
  output += `    boek_capaciteit: ${card.boek_capaciteit},\n`;
  output += `    kracht_type: ${JSON.stringify(card.kracht_type)},\n`;
  output += `    kracht: ${JSON.stringify(card.kracht)},\n`;
  output += `    citaat: ${JSON.stringify(card.citaat)}\n`;
  output += '  }' + (i < cards.length - 1 ? ',' : '') + '\n';
});
output += '];\n';

fs.writeFileSync('/home/user/lesdoelstellingen/bordspel/app/cards.js', output);
console.log('\n✓ Written rebalanced cards.js');
