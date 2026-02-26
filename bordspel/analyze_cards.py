#!/usr/bin/env python3
"""Comprehensive statistical analysis of De Academie card database - comparable to Wingspan."""

import re
import json
from collections import Counter, defaultdict

# Parse the cards.js file
with open('/home/user/lesdoelstellingen/bordspel/app/cards.js', 'r') as f:
    content = f.read()

# Extract the ALL_CARDS array content
# Convert JS object notation to JSON-parseable format
cards_match = re.search(r'const ALL_CARDS = \[(.*?)\];', content, re.DOTALL)
if not cards_match:
    print("ERROR: Could not find ALL_CARDS array")
    exit(1)

cards_text = cards_match.group(1)

# Parse each card object manually using regex
cards = []
card_pattern = re.compile(r'\{(.*?)\}', re.DOTALL)
for m in card_pattern.finditer(cards_text):
    block = m.group(1)
    card = {}

    # id
    id_m = re.search(r'id:\s*(\d+)', block)
    if id_m:
        card['id'] = int(id_m.group(1))

    # naam
    naam_m = re.search(r"naam:\s*'(.*?)'", block)
    if naam_m:
        card['naam'] = naam_m.group(1)

    # stroming
    stroming_m = re.search(r"stroming:\s*'(.*?)'", block)
    if stroming_m:
        card['stroming'] = stroming_m.group(1)

    # traditie
    traditie_m = re.search(r"traditie:\s*'(.*?)'", block)
    if traditie_m:
        card['traditie'] = traditie_m.group(1)

    # invloed
    invloed_m = re.search(r'invloed:\s*(\d+)', block)
    if invloed_m:
        card['invloed'] = int(invloed_m.group(1))

    # vaardigheden
    vaard_m = re.search(r"vaardigheden:\s*\[(.*?)\]", block)
    if vaard_m:
        card['vaardigheden'] = re.findall(r"'(\w+)'", vaard_m.group(1))

    # kosten
    kosten_m = re.search(r"kosten:\s*\[(.*?)\]", block)
    if kosten_m:
        card['kosten'] = re.findall(r"'(\w+)'", kosten_m.group(1))

    # vp
    vp_m = re.search(r'vp:\s*(\d+)', block)
    if vp_m:
        card['vp'] = int(vp_m.group(1))

    # boek_capaciteit
    boek_m = re.search(r'boek_capaciteit:\s*(\d+)', block)
    if boek_m:
        card['boek_capaciteit'] = int(boek_m.group(1))

    # kracht_type
    kt_m = re.search(r"kracht_type:\s*'(.*?)'", block)
    if kt_m:
        card['kracht_type'] = kt_m.group(1)

    # kracht
    kracht_m = re.search(r"kracht:\s*'(.*?)'", block)
    if kracht_m:
        card['kracht'] = kracht_m.group(1)

    if 'id' in card:
        cards.append(card)

N = len(cards)
print("=" * 80)
print(f"  DE ACADEMIE - COMPREHENSIVE CARD DATABASE ANALYSIS")
print(f"  Total cards: {N}")
print(f"  (Comparable to Wingspan's 170 bird cards in base game)")
print("=" * 80)

# ============================================================
# 1. POWER TYPE DISTRIBUTION (kracht_type)
# ============================================================
print("\n" + "=" * 80)
print("  1. POWER TYPE DISTRIBUTION (kracht_type)")
print("     Wingspan equivalent: Brown/Pink/White/Teal/Yellow powers")
print("=" * 80)

power_types = Counter(c.get('kracht_type', 'NONE') for c in cards)
type_labels = {
    'bruin': 'Bruin  (When Activated / Brown)',
    'roze': 'Roze   (Between Turns / Pink)',
    'wit': 'Wit    (When Played / White)',
    'groenblauw': 'Groenblauw (End of Round / Teal)',
    'geel': 'Geel   (End of Game / Yellow)',
}
for t in ['bruin', 'roze', 'wit', 'groenblauw', 'geel']:
    count = power_types.get(t, 0)
    pct = count / N * 100
    bar = '#' * int(pct / 2)
    label = type_labels.get(t, t)
    print(f"  {label:45s} {count:4d}  ({pct:5.1f}%)  {bar}")

# Check for any others
for t in power_types:
    if t not in type_labels:
        print(f"  {t:45s} {power_types[t]:4d}")

# ============================================================
# 2. TRADITIE DISTRIBUTION
# ============================================================
print("\n" + "=" * 80)
print("  2. TRADITIE DISTRIBUTION (nest type equivalent)")
print("     Wingspan equivalent: Bowl/Cavity/Ground/Platform/Wild nests")
print("=" * 80)

tradities = Counter(c.get('traditie', 'NONE') for c in cards)
traditie_labels = {
    'contemplatief': 'Contemplatief (inner reflection)',
    'empirisch': 'Empirisch     (observation/science)',
    'dialectisch': 'Dialectisch   (debate/synthesis)',
    'normatief': 'Normatief     (ethics/politics)',
    'eclectisch': 'Eclectisch    (wild/all)',
}
for t in ['contemplatief', 'empirisch', 'dialectisch', 'normatief', 'eclectisch']:
    count = tradities.get(t, 0)
    pct = count / N * 100
    bar = '#' * int(pct / 2)
    label = traditie_labels.get(t, t)
    print(f"  {label:42s} {count:4d}  ({pct:5.1f}%)  {bar}")

# ============================================================
# 3. VP DISTRIBUTION
# ============================================================
print("\n" + "=" * 80)
print("  3. VP (Victory Points) DISTRIBUTION")
print("     Wingspan equivalent: Bird point values")
print("=" * 80)

vps = [c.get('vp', 0) for c in cards]
vp_counts = Counter(vps)
print(f"  Min VP:     {min(vps)}")
print(f"  Max VP:     {max(vps)}")
print(f"  Average VP: {sum(vps)/len(vps):.2f}")
print(f"  Median VP:  {sorted(vps)[len(vps)//2]}")
print(f"  Total VP across all cards: {sum(vps)}")
print()
print(f"  {'VP Value':10s} {'Count':6s} {'%':7s} Distribution")
print(f"  {'-'*10} {'-'*6} {'-'*7} {'-'*40}")
for vp_val in sorted(vp_counts.keys()):
    count = vp_counts[vp_val]
    pct = count / N * 100
    bar = '#' * int(pct)
    print(f"  {vp_val:10d} {count:6d} {pct:6.1f}%  {bar}")

# ============================================================
# 4. BOEK_CAPACITEIT DISTRIBUTION
# ============================================================
print("\n" + "=" * 80)
print("  4. BOEK_CAPACITEIT (Book/Egg Capacity) DISTRIBUTION")
print("     Wingspan equivalent: Egg capacity per bird")
print("=" * 80)

boeks = [c.get('boek_capaciteit', 0) for c in cards]
boek_counts = Counter(boeks)
print(f"  Min Boek Capaciteit:     {min(boeks)}")
print(f"  Max Boek Capaciteit:     {max(boeks)}")
print(f"  Average Boek Capaciteit: {sum(boeks)/len(boeks):.2f}")
print(f"  Total Boek Capaciteit across all cards: {sum(boeks)}")
print()
print(f"  {'Capacity':10s} {'Count':6s} {'%':7s} Distribution")
print(f"  {'-'*10} {'-'*6} {'-'*7} {'-'*40}")
for val in sorted(boek_counts.keys()):
    count = boek_counts[val]
    pct = count / N * 100
    bar = '#' * int(pct)
    print(f"  {val:10d} {count:6d} {pct:6.1f}%  {bar}")

# ============================================================
# 5. IDEA COST DISTRIBUTION
# ============================================================
print("\n" + "=" * 80)
print("  5. IDEA COST DISTRIBUTION (kosten)")
print("     Wingspan equivalent: Food cost to play a bird")
print("=" * 80)

total_costs = [len(c.get('kosten', [])) for c in cards]
cost_counts = Counter(total_costs)
print(f"  Min total idea cost: {min(total_costs)}")
print(f"  Max total idea cost: {max(total_costs)}")
print(f"  Average idea cost:   {sum(total_costs)/len(total_costs):.2f}")
print()
print(f"  {'Total Cost':10s} {'Count':6s} {'%':7s} Distribution")
print(f"  {'-'*10} {'-'*6} {'-'*7} {'-'*40}")
for val in sorted(cost_counts.keys()):
    count = cost_counts[val]
    pct = count / N * 100
    bar = '#' * int(pct)
    print(f"  {val:10d} {count:6d} {pct:6.1f}%  {bar}")

# Breakdown by idea type
print("\n  Idea type frequency in costs:")
idea_type_costs = Counter()
for c in cards:
    for k in c.get('kosten', []):
        idea_type_costs[k] += 1
total_idea_cost_items = sum(idea_type_costs.values())
for idea_type in ['weegschaal', 'oog', 'spiegel', 'passer', 'sfeer']:
    count = idea_type_costs.get(idea_type, 0)
    pct = count / total_idea_cost_items * 100 if total_idea_cost_items > 0 else 0
    bar = '#' * int(pct / 2)
    print(f"    {idea_type:15s} {count:4d}  ({pct:5.1f}%)  {bar}")

# ============================================================
# 6. VAARDIGHEDEN (Habitat/Skill) DISTRIBUTION
# ============================================================
print("\n" + "=" * 80)
print("  6. VAARDIGHEDEN (Skills/Habitat) DISTRIBUTION")
print("     Wingspan equivalent: Habitat icons (Forest/Grassland/Wetland)")
print("     L=Lezen(Read), S=Schrijven(Write), Sp=Spreken(Speak)")
print("=" * 80)

vaard_combos = Counter(tuple(sorted(c.get('vaardigheden', []))) for c in cards)
print(f"\n  {'Combination':25s} {'Count':6s} {'%':7s} Distribution")
print(f"  {'-'*25} {'-'*6} {'-'*7} {'-'*40}")
for combo in sorted(vaard_combos.keys(), key=lambda x: (-vaard_combos[x], x)):
    count = vaard_combos[combo]
    pct = count / N * 100
    bar = '#' * int(pct / 2)
    label = '+'.join(combo) if combo else '(none)'
    print(f"  {label:25s} {count:6d} {pct:6.1f}%  {bar}")

# Individual skill counts
print("\n  Individual skill coverage:")
for skill in ['L', 'S', 'Sp']:
    count = sum(1 for c in cards if skill in c.get('vaardigheden', []))
    pct = count / N * 100
    print(f"    {skill:5s}: {count:4d} cards ({pct:5.1f}%)")

# ============================================================
# 7. STROMING DISTRIBUTION
# ============================================================
print("\n" + "=" * 80)
print("  7. STROMING (Movement/Era) DISTRIBUTION")
print("     Wingspan equivalent: Wingspan / Bonus card categories")
print("=" * 80)

stromingen = Counter(c.get('stroming', 'NONE') for c in cards)
print(f"\n  {'Stroming':30s} {'Count':6s} {'%':7s} Distribution")
print(f"  {'-'*30} {'-'*6} {'-'*7} {'-'*40}")
for stroming, count in stromingen.most_common():
    pct = count / N * 100
    bar = '#' * int(pct)
    print(f"  {stroming:30s} {count:6d} {pct:6.1f}%  {bar}")

# ============================================================
# 8. INVLOED DISTRIBUTION
# ============================================================
print("\n" + "=" * 80)
print("  8. INVLOED (Influence/Wingspan) DISTRIBUTION")
print("     Wingspan equivalent: Wingspan measurement")
print("=" * 80)

invloeds = [c.get('invloed', 0) for c in cards]
invloed_counts = Counter(invloeds)
print(f"  Min Invloed:     {min(invloeds)}")
print(f"  Max Invloed:     {max(invloeds)}")
print(f"  Average Invloed: {sum(invloeds)/len(invloeds):.2f}")
print()
print(f"  {'Invloed':10s} {'Count':6s} {'%':7s} Distribution")
print(f"  {'-'*10} {'-'*6} {'-'*7} {'-'*40}")
for val in sorted(invloed_counts.keys()):
    count = invloed_counts[val]
    pct = count / N * 100
    bar = '#' * int(pct)
    print(f"  {val:10d} {count:6d} {pct:6.1f}%  {bar}")

# ============================================================
# 9. POWER CATEGORIES / THEMES
# ============================================================
print("\n" + "=" * 80)
print("  9. POWER CATEGORIES / THEMES (kracht text analysis)")
print("     Grouping powers by common patterns")
print("=" * 80)

# Define patterns to search for
categories = {
    'Gain specific idea(s)': r'[Pp]ak \d+ \w+-idee',
    'Gain random/choice idea(s)': r'[Pp]ak \d+ (willekeurig|naar keuze|idee)',
    'Gain ideas (conditional)': r'[Pp]ak \d+.*(als|per|voor elke|minstens)',
    'Draw card(s)': r'[Tt]rek \d+ kaart',
    'Place book(s)': r'[Ll]eg \d+ boek',
    'Cite/Tuck card(s)': r'[Cc]iteer \d+ kaart',
    'Reroll Library': r'[Hh]ergooi',
    'Swap/Exchange': r'[Vv]erwissel|[Vv]erplaats',
    'Remove from open row': r'[Vv]erwijder \d+ (kaart|filosoof) uit de open',
    'Affect opponents': r'medespeler|alle spelers',
    'Look at deck cards': r'[Kk]ijk naar.*(kaart|stapel)',
    'Conditional bonus': r'[Aa]ls (je|het|Marx|Adorno|Husserl|Wittgenstein|Confucius|Anselmus|J\.S\. Mill)',
}

# First, classify by kracht_type prefix
print("\n  --- By activation timing ---")
timing_counts = Counter()
for c in cards:
    kracht = c.get('kracht', '')
    if kracht.startswith('Tijdens de beurt'):
        timing_counts['Tijdens de beurt (When Activated)'] += 1
    elif kracht.startswith('Tijdgeest'):
        timing_counts['Tijdgeest (Between Turns)'] += 1
    elif kracht.startswith('Bij Aanstelling'):
        timing_counts['Bij Aanstelling (When Played)'] += 1
    elif kracht.startswith('Einde ronde'):
        timing_counts['Einde ronde (End of Round)'] += 1
    elif kracht.startswith('Einde spel'):
        timing_counts['Einde spel (End of Game)'] += 1
    else:
        timing_counts[f'Other: {kracht[:40]}'] += 1

for timing, count in timing_counts.most_common():
    print(f"    {timing:45s} {count:4d}")

# Detailed pattern analysis
print("\n  --- By effect type (cards may match multiple categories) ---")
effect_counts = defaultdict(list)
for c in cards:
    kracht = c.get('kracht', '')
    matched = False

    # Check for gain ideas
    if re.search(r'[Pp]ak', kracht, re.IGNORECASE):
        if re.search(r'(Weegschaal|Oog|Spiegel|Passer|Sfeer)-idee', kracht):
            effect_counts['Gain SPECIFIC idea type(s)'].append(c['naam'])
        elif re.search(r'willekeurig', kracht, re.IGNORECASE):
            effect_counts['Gain RANDOM idea(s)'].append(c['naam'])
        elif re.search(r'naar keuze', kracht, re.IGNORECASE):
            effect_counts['Gain idea(s) of CHOICE'].append(c['naam'])
        elif re.search(r'(per|voor elke)', kracht, re.IGNORECASE):
            effect_counts['Gain ideas SCALING (per X)'].append(c['naam'])
        else:
            effect_counts['Gain ideas (other)'].append(c['naam'])
        matched = True

    if re.search(r'[Tt]rek \d+ kaart', kracht):
        effect_counts['DRAW card(s)'].append(c['naam'])
        matched = True

    if re.search(r'[Ll]eg \d+ boek', kracht):
        effect_counts['PLACE book(s)'].append(c['naam'])
        matched = True

    if re.search(r'[Cc]iteer', kracht, re.IGNORECASE):
        effect_counts['CITE/TUCK card(s)'].append(c['naam'])
        matched = True

    if re.search(r'[Hh]ergooi', kracht):
        effect_counts['REROLL Library'].append(c['naam'])
        matched = True

    if re.search(r'[Vv]erwissel', kracht):
        effect_counts['SWAP/EXCHANGE'].append(c['naam'])
        matched = True

    if re.search(r'[Vv]erplaats', kracht):
        effect_counts['MOVE philosopher'].append(c['naam'])
        matched = True

    if re.search(r'[Vv]erwijder.*(open|aanbod)', kracht):
        effect_counts['REMOVE from open row'].append(c['naam'])
        matched = True

    if re.search(r'medespeler', kracht, re.IGNORECASE):
        effect_counts['AFFECTS opponents'].append(c['naam'])
        matched = True

    if re.search(r'[Kk]ijk naar', kracht):
        effect_counts['PEEK at deck'].append(c['naam'])
        matched = True

    if re.search(r'[Vv]erwijder \d+ (idee|van je)', kracht):
        effect_counts['SACRIFICE idea for benefit'].append(c['naam'])
        matched = True

    if not matched:
        effect_counts['UNCATEGORIZED'].append(c['naam'])

print(f"\n  {'Effect Category':40s} {'Count':6s} Example cards")
print(f"  {'-'*40} {'-'*6} {'-'*50}")
for cat in sorted(effect_counts.keys(), key=lambda x: -len(effect_counts[x])):
    names = effect_counts[cat]
    examples = ', '.join(names[:3])
    if len(names) > 3:
        examples += f' ... (+{len(names)-3} more)'
    print(f"  {cat:40s} {len(names):6d} {examples}")

# ============================================================
# GAME ENGINE CONSTANTS
# ============================================================
print("\n\n" + "=" * 80)
print("  GAME ENGINE CONSTANTS (from game.js)")
print("=" * 80)

print("\n  --- LEZEN_BENEFITS (Forest/Gain Food equivalent) ---")
print("  Row: Lezen (Read) - Gain ideas from the Library")
print("  Philosophers | Ideas | Conversion")
print("  -------------|-------|-----------------------------")
lezen = [
    (0, 1, False), (1, 1, True), (2, 2, False),
    (3, 2, True), (4, 3, False), (5, 3, True)
]
for phil, ideas, conv in lezen:
    conv_str = "Discard 1 card -> +1 idea" if conv else "-"
    print(f"  {phil:13d} | {ideas:5d} | {conv_str}")

print("\n  --- SCHRIJVEN_BENEFITS (Grassland/Lay Eggs equivalent) ---")
print("  Row: Schrijven (Write) - Place books on philosophers")
print("  Philosophers | Books | Conversion")
print("  -------------|-------|-----------------------------")
schrijven = [
    (0, 2, False), (1, 2, True), (2, 3, False),
    (3, 3, True), (4, 4, False), (5, 4, True)
]
for phil, books, conv in schrijven:
    conv_str = "Pay 1 idea -> +1 book" if conv else "-"
    print(f"  {phil:13d} | {books:5d} | {conv_str}")

print("\n  --- SPREKEN_BENEFITS (Wetland/Draw Cards equivalent) ---")
print("  Row: Spreken (Speak) - Draw philosopher cards")
print("  Philosophers | Cards | Conversion")
print("  -------------|-------|-----------------------------")
spreken = [
    (0, 1, False), (1, 1, True), (2, 2, False),
    (3, 2, True), (4, 3, False), (5, 3, True)
]
for phil, crds, conv in spreken:
    conv_str = "Discard 1 book -> +1 card" if conv else "-"
    print(f"  {phil:13d} | {crds:5d} | {conv_str}")

print("\n  --- BOOK_COST_PER_COLUMN (Egg cost to play birds) ---")
print("  Column:  1st  2nd  3rd  4th  5th")
print("  Cost:     0    1    1    2    2")

print("\n  --- TURNS_PER_ROUND ---")
print("  Round 1 (De Oudheid):       8 turns")
print("  Round 2 (De Middeleeuwen):  7 turns")
print("  Round 3 (De Verlichting):   6 turns")
print("  Round 4 (De Moderne Tijd):  5 turns")
print("  Total actions per game:    26 turns")

print("\n  --- ALL_ROUND_GOALS (Paradigmaverschuivingen / End-of-Round Goals) ---")
print(f"  Total goals defined: 12 (4 randomly selected per game)")
round_goals = [
    ('rg1', 'Het Grote Debat', 'Most philosophers in Spreken row'),
    ('rg2', 'De Encyclopedie', 'Most books on the board'),
    ('rg3', 'De Analytische School', 'Most Empirical philosophers with books'),
    ('rg4', 'De Contemplatieve Traditie', 'Most Contemplative philosophers with books'),
    ('rg5', 'De Dialoog der Tradities', 'Most philosophers in Lezen row'),
    ('rg6', 'Het Oeuvre', 'Most citations (tucked cards)'),
    ('rg7', 'De Polymath', 'Most philosophers in Schrijven row'),
    ('rg8', 'Intellectueel Kapitaal', 'Most cached ideas on philosophers'),
    ('rg9', 'Kritische Massa', 'Most Dialectical philosophers with books'),
    ('rg10', 'De Ethische School', 'Most Normative philosophers with books'),
    ('rg11', 'De Brede Academie', 'Philosophers in all 3 rows (count smallest)'),
    ('rg12', 'De Invloedrijken', 'Most philosophers with influence >= 5'),
]
for gid, naam, desc in round_goals:
    print(f"    {gid:5s}  {naam:30s}  {desc}")

print("\n  --- ALL_LEVENSWERK (Bonus Cards / Personal Goals) ---")
print(f"  Total levenswerk defined: 14 (player chooses 1 from 4 random)")
levenswerk = [
    ('lw1', 'Stichter van een School', '4+ philosophers same traditie', '5 VP'),
    ('lw2', 'Meester-Lezer', '4+ philosophers in Lezen row', '5 VP'),
    ('lw3', 'De Synthese', '1+ of each traditie (excl. eclectisch)', '7 VP'),
    ('lw4', 'Bibliothecaris', '8+ books on board', '5 VP'),
    ('lw5', 'Kroniekschrijver', '5+ citations', '5 VP'),
    ('lw6', 'Universeel Genie', '3+ philosophers in each row', '8 VP'),
    ('lw7', 'De Verzamelaar', '4+ philosophers with 0 idea cost', '4 VP'),
    ('lw8', 'Diep Denken', '3+ philosophers with 3+ idea cost', '7 VP'),
    ('lw9', 'Meester-Schrijver', '4+ philosophers in Schrijven row', '5 VP'),
    ('lw10', 'Redenaar', '4+ philosophers in Spreken row', '5 VP'),
    ('lw11', 'De Empirist', '3+ Empirical philosophers', '5 VP'),
    ('lw12', 'De Dialecticus', '3+ Dialectical philosophers', '5 VP'),
    ('lw13', 'Intellectueel Kapitalist', '4+ cached ideas', '5 VP'),
    ('lw14', 'De Boekenplank', '3+ philosophers at full book capacity', '5 VP'),
]
for lid, naam, desc, reward in levenswerk:
    print(f"    {lid:5s}  {naam:30s}  {desc:50s}  {reward}")

print("\n  --- HELP_DATA Topics ---")
help_topics = [
    ('overzicht', 'General game overview'),
    ('filosoof_plaatsen', 'How to place a philosopher'),
    ('lezen', 'Lezen (Read) action details'),
    ('schrijven', 'Schrijven (Write) action details'),
    ('spreken', 'Spreken (Speak) action details'),
    ('krachten', 'Power types explained'),
    ('tradities', 'Philosophical traditions explained'),
    ('scoring', 'Final scoring breakdown'),
]
for topic, desc in help_topics:
    print(f"    {topic:25s}  {desc}")

# ============================================================
# CROSS-ANALYSIS / DESIGN INSIGHTS
# ============================================================
print("\n\n" + "=" * 80)
print("  CROSS-ANALYSIS: VP vs COST (Value Efficiency)")
print("=" * 80)

print(f"\n  {'Cost':6s} {'Cards':6s} {'Avg VP':8s} {'Min VP':8s} {'Max VP':8s}")
print(f"  {'-'*6} {'-'*6} {'-'*8} {'-'*8} {'-'*8}")
for cost_val in sorted(set(total_costs)):
    subset = [c for c in cards if len(c.get('kosten', [])) == cost_val]
    vp_vals = [c['vp'] for c in subset]
    print(f"  {cost_val:6d} {len(subset):6d} {sum(vp_vals)/len(vp_vals):8.2f} {min(vp_vals):8d} {max(vp_vals):8d}")

print("\n" + "=" * 80)
print("  CROSS-ANALYSIS: STROMING vs TRADITIE")
print("=" * 80)

# Build cross-table
all_stromingen = sorted(set(c.get('stroming', '') for c in cards))
all_tradities = ['contemplatief', 'empirisch', 'dialectisch', 'normatief', 'eclectisch']

header = f"  {'Stroming':25s}" + "".join(f" {t[:6]:>7s}" for t in all_tradities) + "  Total"
print(header)
print("  " + "-" * (25 + 8 * len(all_tradities) + 7))
for s in all_stromingen:
    subset = [c for c in cards if c.get('stroming') == s]
    row = f"  {s:25s}"
    total = 0
    for t in all_tradities:
        cnt = sum(1 for c in subset if c.get('traditie') == t)
        row += f" {cnt:7d}"
        total += cnt
    row += f"  {total:5d}"
    print(row)

# Totals row
print("  " + "-" * (25 + 8 * len(all_tradities) + 7))
row = f"  {'TOTAL':25s}"
grand_total = 0
for t in all_tradities:
    cnt = sum(1 for c in cards if c.get('traditie') == t)
    row += f" {cnt:7d}"
    grand_total += cnt
row += f"  {grand_total:5d}"
print(row)

print("\n" + "=" * 80)
print("  CROSS-ANALYSIS: KRACHT_TYPE vs STROMING")
print("=" * 80)
all_kracht_types = ['bruin', 'roze', 'wit', 'groenblauw', 'geel']
header = f"  {'Stroming':25s}" + "".join(f" {t[:6]:>7s}" for t in all_kracht_types) + "  Total"
print(header)
print("  " + "-" * (25 + 8 * len(all_kracht_types) + 7))
for s in all_stromingen:
    subset = [c for c in cards if c.get('stroming') == s]
    row = f"  {s:25s}"
    total = 0
    for kt in all_kracht_types:
        cnt = sum(1 for c in subset if c.get('kracht_type') == kt)
        row += f" {cnt:7d}"
        total += cnt
    row += f"  {total:5d}"
    print(row)

# ============================================================
# DESIGN COMPARISON SUMMARY
# ============================================================
print("\n\n" + "=" * 80)
print("  DESIGN COMPARISON: DE ACADEMIE vs WINGSPAN")
print("=" * 80)
print(f"""
  Feature                  | De Academie             | Wingspan (base)
  -------------------------|-------------------------|---------------------------
  Total cards              | {N:4d} philosophers       | 170 birds
  Rows/Habitats            | 3 (L/S/Sp)              | 3 (Forest/Grassland/Wetland)
  Columns per row          | 5                       | 5
  Rounds                   | 4                       | 4
  Turns per round          | 8/7/6/5 = 26            | 8/7/6/5 = 26
  Resource types           | 5 idea types + wild     | 5 food types (invertebrate etc)
  Power types              | 5 (bruin/roze/wit/gb/g) | 4 (brown/pink/white/teal)
  Card cost currency       | Ideas (5 types)         | Food (5 types)
  Column placement cost    | Books (0/1/1/2/2)       | Eggs (0/1/1/2/2)
  Bonus objectives         | 14 Levenswerk           | ~25+ Bonus cards
  Round goals              | 12 Paradigmaverschuiv.  | ~15+ End-of-round goals
  VP range                 | {min(vps)}-{max(vps)} (avg {sum(vps)/len(vps):.1f})         | 0-9 (avg ~3.6)
  Book/Egg capacity range  | {min(boeks)}-{max(boeks)} (avg {sum(boeks)/len(boeks):.1f})         | 0-6 (avg ~2.3)
  Wild nest/traditie       | Eclectisch              | Star/Wild nest
  Unique: era/time scope   | Philosophers span -624  | Birds by continent/habitat
                           |   BCE to present day    |
  Unique: influence stat   | 3-9 invloed per card    | Wingspan measurement (cm)
""")

print("=" * 80)
print("  ANALYSIS COMPLETE")
print("=" * 80)
