#!/usr/bin/env python3
"""
Rebalance De Academie card database.
Reads cards.js, applies all rebalancing changes, writes new cards.js.
"""

import re
import json
import random

random.seed(42)

INPUT_PATH = '/home/user/lesdoelstellingen/bordspel/app/cards.js'
OUTPUT_PATH = '/home/user/lesdoelstellingen/bordspel/app/cards.js'

# ─── Step 0: Parse cards.js ───────────────────────────────────────────────────

def parse_cards(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    # Extract the array content between [ and ];
    m = re.search(r'const ALL_CARDS\s*=\s*\[', text)
    if not m:
        raise ValueError("Could not find ALL_CARDS array")

    cards = []
    # Use regex to extract each card object
    # Find all { ... } blocks at the top level of the array
    depth = 0
    start = None
    for i, ch in enumerate(text[m.start():], m.start()):
        if ch == '{':
            if depth == 0:
                start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and start is not None:
                card_text = text[start:i+1]
                card = parse_card_object(card_text)
                cards.append(card)
                start = None
    return cards

def parse_card_object(text):
    """Parse a JS object literal into a Python dict."""
    card = {}
    # id
    m = re.search(r'id:\s*(\d+)', text)
    card['id'] = int(m.group(1))
    # naam
    m = re.search(r"naam:\s*'((?:[^'\\]|\\.)*)'", text)
    card['naam'] = m.group(1)
    # geboren
    m = re.search(r'geboren:\s*(-?\d+)', text)
    card['geboren'] = int(m.group(1))
    # overleden
    m = re.search(r'overleden:\s*(null|-?\d+)', text)
    card['overleden'] = None if m.group(1) == 'null' else int(m.group(1))
    # stroming
    m = re.search(r"stroming:\s*'((?:[^'\\]|\\.)*)'", text)
    card['stroming'] = m.group(1)
    # traditie
    m = re.search(r"traditie:\s*'((?:[^'\\]|\\.)*)'", text)
    card['traditie'] = m.group(1)
    # invloed
    m = re.search(r'invloed:\s*(\d+)', text)
    card['invloed'] = int(m.group(1))
    # vaardigheden
    m = re.search(r'vaardigheden:\s*\[(.*?)\]', text)
    skills_str = m.group(1)
    card['vaardigheden'] = re.findall(r"'([^']*)'", skills_str)
    # kosten
    m = re.search(r'kosten:\s*\[(.*?)\]', text)
    kosten_str = m.group(1)
    card['kosten'] = re.findall(r"'([^']*)'", kosten_str)
    # vp
    m = re.search(r'vp:\s*(\d+)', text)
    card['vp'] = int(m.group(1))
    # boek_capaciteit
    m = re.search(r'boek_capaciteit:\s*(\d+)', text)
    card['boek_capaciteit'] = int(m.group(1))
    # kracht_type
    m = re.search(r"kracht_type:\s*'((?:[^'\\]|\\.)*)'", text)
    card['kracht_type'] = m.group(1)
    # kracht
    m = re.search(r"kracht:\s*'((?:[^'\\]|\\.)*)'", text)
    card['kracht'] = m.group(1)
    # citaat
    m = re.search(r"citaat:\s*'((?:[^'\\]|\\.)*)'", text)
    card['citaat'] = m.group(1)
    return card

# ─── Step 1: VP Rebalancing ──────────────────────────────────────────────────

def rebalance_vp(card):
    old_vp = card['vp']
    if old_vp <= 2:
        return old_vp
    elif old_vp == 3:
        return random.choices([1, 2, 3], weights=[1, 3, 1])[0]
    elif old_vp == 4:
        return random.choices([2, 3], weights=[1, 2])[0]
    elif old_vp == 5:
        return random.choices([3, 4], weights=[1, 2])[0]
    elif old_vp == 6:
        return random.choices([4, 5], weights=[2, 1])[0]
    elif old_vp == 7:
        return random.choices([5, 6], weights=[1, 2])[0]
    elif old_vp == 8:
        return random.choices([6, 7], weights=[1, 2])[0]
    elif old_vp == 9:
        return 7
    elif old_vp == 10:
        return 8
    elif old_vp >= 11:
        return 9
    return old_vp

# ─── Step 2: Power Type Rebalancing ──────────────────────────────────────────

# IDs for groenblauw conversion (14 cards) - cards with egg/book/scoring powers
GROENBLAUW_IDS = [
    # Cards with book-related or scoring powers
    12,   # Cicero - "Trek 1 kaart en leg 1 boek" -> end-of-round
    42,   # Diderot - "Leg 1 boek op elke filosoof" -> end-of-round
    97,   # Confucius - "Leg 1 boek op elke filosoof in deze rij" -> end-of-round
    107,  # Bentham - "Tel alle boeken. Pak 1 idee per 3 boeken" -> end-of-round
    121,  # Ibn Khaldun - "Pak 1 Oog-idee en leg 1 boek" -> end-of-round
    119,  # Christine de Pizan - "Leg 1 boek op deze kaart en trek 1 kaart" -> end-of-round
    164,  # Roger Bacon - "Pak 1 Oog-idee en leg 1 boek" -> end-of-round
    130,  # Dostojevski - "Citeer 1 kaart. Leg 1 boek" -> end-of-round
    91,   # Iris Murdoch - "Leg 1 boek en citeer 1 kaart" -> end-of-round
    127,  # Auguste Comte - "Pak 1 Oog-idee voor elke filosoof in je Lezen-rij" -> end-of-round
    100,  # Nagarjuna - "Verwijder alle ideeen van 1 type" -> end-of-round
    145,  # Alasdair MacIntyre - "Pak 1 Weegschaal-idee per filosoof dezelfde stroming" -> end-of-round
    112,  # Max Weber - "Leg 1 boek en pak 1 Weegschaal-idee" -> end-of-round
    131,  # Henri Bergson - "Pak 1 Sfeer-idee en hergooi de Bibliotheek" -> end-of-round
]

GROENBLAUW_POWERS = [
    "Einde van de ronde: Leg 1 boek op elke filosoof in deze rij met een lege boekplek.",
    "Einde van de ronde: Trek 1 kaart voor elke filosoof met contemplatief traditie.",
    "Einde van de ronde: Pak 1 idee voor elk boek in deze rij.",
    "Einde van de ronde: Refereer 1 kaart van de stapel achter deze filosoof voor elk boek op deze filosoof.",
    "Einde van de ronde: Pak 1 idee naar keuze voor elke filosoof in je Lezen-rij.",
    "Einde van de ronde: Leg 1 boek op deze filosoof voor elke 2 filosofen in je Academie.",
    "Einde van de ronde: Trek 1 kaart voor elke filosoof met empirisch traditie.",
    "Einde van de ronde: Pak 1 Oog-idee voor elk boek op deze filosoof.",
    "Einde van de ronde: Leg 1 boek op een filosoof in elke rij waar je minstens 2 filosofen hebt.",
    "Einde van de ronde: Pak 1 idee naar keuze voor elke filosoof met normatief traditie.",
    "Einde van de ronde: Verwissel tot 2 ideeen met de voorraad.",
    "Einde van de ronde: Pak 1 Weegschaal-idee voor elke filosoof in je Spreken-rij.",
    "Einde van de ronde: Leg 1 boek op elke filosoof met dialectisch traditie.",
    "Einde van de ronde: Trek 1 kaart voor elk boek dat je deze ronde hebt gelegd.",
]

# IDs for geel conversion (9 cards) - HIGH VP cards (7+)
GEEL_IDS = [
    7,    # Plato - vp 9
    8,    # Aristoteles - vp 9
    33,   # Spinoza - vp 9
    43,   # Kant - vp 12
    48,   # Hegel - vp 10
    54,   # Nietzsche - vp 9
    65,   # Bertrand Russell - vp 9
    75,   # Foucault - vp 9
    86,   # John Rawls - vp 9
]

GEEL_POWERS = [
    "Einde van het spel: +1 VP voor elke filosoof met contemplatief traditie.",
    "Einde van het spel: +1 VP voor elk boek in je Academie.",
    "Einde van het spel: +2 VP voor elke filosoof met 3+ boeken.",
    "Einde van het spel: +1 VP voor elke referentie achter deze filosoof.",
    "Einde van het spel: +1 VP voor elke filosoof met normatief traditie.",
    "Einde van het spel: +2 VP voor elke filosoof in je Spreken-rij.",
    "Einde van het spel: +1 VP voor elk boek in je Lezen-rij.",
    "Einde van het spel: +1 VP voor elke filosoof met dialectisch traditie.",
    "Einde van het spel: +1 VP voor elke filosoof met empirisch traditie.",
]

# IDs for wit conversion (20 bruin cards, prefer low-VP with simple powers)
WIT_IDS = [
    1,    # Thales - vp 3, simple power
    21,   # Peter Abelardus - vp 3, simple power
    101,  # Al-Kindi - vp 3, simple power
    113,  # Democritus - vp 3, simple power
    114,  # Empedocles - vp 3, simple power
    122,  # Anne Conway - vp 4, simple power
    129,  # Max Stirner - vp 3, simple power
    132,  # Alfred Jules Ayer - vp 4, simple power
    110,  # Henry David Thoreau - vp 3, simple power
    165,  # Tommaso Campanella - vp 4, simple power
    98,   # Laozi - vp 4, simple power
    124,  # Thomas Reid - vp 4, simple power
    148,  # Kwame Anthony Appiah - vp 5, simple power
    152,  # Gianni Vattimo - vp 5, simple power
    153,  # Richard Swinburne - vp 5, simple power
    123,  # Nicolas Malebranche - vp 5, simple power
    125,  # Condorcet - vp 5, simple power
    149,  # Luce Irigaray - vp 5, simple power
    168,  # Edith Stein - vp 5, simple power
    109,  # Ralph Waldo Emerson - vp 5, simple power
]

WIT_POWERS = [
    "Bij Aanstelling: Trek 2 kaarten van de stapel.",
    "Bij Aanstelling: Pak 1 Passer-idee uit de voorraad.",
    "Bij Aanstelling: Pak 1 Oog-idee uit de voorraad.",
    "Bij Aanstelling: Pak 1 Oog-idee uit de voorraad.",
    "Bij Aanstelling: Pak 1 willekeurig idee uit de Bibliotheek.",
    "Bij Aanstelling: Pak 1 Sfeer-idee uit de voorraad.",
    "Bij Aanstelling: Trek 1 kaart en pak 1 idee naar keuze.",
    "Bij Aanstelling: Pak 1 Passer-idee uit de voorraad.",
    "Bij Aanstelling: Pak 1 idee naar keuze uit de voorraad.",
    "Bij Aanstelling: Leg 1 boek op een filosoof in deze rij.",
    "Bij Aanstelling: Alle spelers pakken 1 idee uit de voorraad.",
    "Bij Aanstelling: Pak 1 Oog-idee en trek 1 kaart.",
    "Bij Aanstelling: Trek 2 bonuskaarten en houd er 1.",
    "Bij Aanstelling: Pak 1 Sfeer-idee en 1 Spiegel-idee.",
    "Bij Aanstelling: Pak 1 Sfeer-idee en trek 1 kaart.",
    "Bij Aanstelling: Pak 1 willekeurig idee en leg 1 boek.",
    "Bij Aanstelling: Pak 1 Passer-idee en leg 1 boek.",
    "Bij Aanstelling: Pak 1 Spiegel-idee en trek 1 kaart.",
    "Bij Aanstelling: Pak 1 Spiegel-idee uit de voorraad.",
    "Bij Aanstelling: Pak 1 Spiegel-idee en pak 1 Sfeer-idee.",
]

# ─── Step 3: Traditie Rebalancing ────────────────────────────────────────────

# Cards to move to dialectisch (increase from 19 to ~38, need ~19 more)
# Move some from contemplatief (53), normatief (47), empirisch (46)
TO_DIALECTISCH_IDS = [
    # From contemplatief (move 7)
    4,    # Heraclitus - contemplatief -> dialectisch (fits: dialectical thinker)
    47,   # Friedrich Schelling - contemplatief -> dialectisch
    49,   # Arthur Schopenhauer - contemplatief -> dialectisch
    67,   # Alfred North Whitehead - contemplatief -> dialectisch
    77,   # Gilles Deleuze - contemplatief -> dialectisch
    150,  # Julia Kristeva - contemplatief -> dialectisch
    83,   # Paul Ricoeur - contemplatief -> dialectisch
    # From normatief (move 6)
    31,   # Thomas Hobbes - normatief -> dialectisch
    45,   # Mary Wollstonecraft - normatief -> dialectisch
    128,  # Harriet Martineau - normatief -> dialectisch
    141,  # bell hooks - normatief -> dialectisch
    144,  # Charles Taylor - normatief -> dialectisch
    160,  # Kwame Nkrumah - normatief -> dialectisch (already moving via roze)
    # From empirisch (move 6)
    111,  # Georg Simmel - empirisch -> dialectisch
    56,   # William James - empirisch -> dialectisch
    158,  # Bruno Latour - empirisch -> dialectisch
    79,   # Richard Rorty - empirisch -> dialectisch
    57,   # John Dewey - empirisch -> dialectisch
    151,  # Donna Haraway - empirisch -> dialectisch
]

# Cards to move to eclectisch (increase from 5 to ~18, need ~13 more)
TO_ECLECTISCH_IDS = [
    # From contemplatief (move 5)
    29,   # Michel de Montaigne - contemplatief -> eclectisch (fits: eclectic essayist)
    46,   # Johann Gottlieb Fichte - contemplatief -> eclectisch
    84,   # Hans-Georg Gadamer - contemplatief -> eclectisch
    82,   # Emmanuel Levinas - contemplatief -> eclectisch
    169,  # Wang Yangming - contemplatief -> eclectisch
    # From normatief (move 4)
    23,   # Maimonides - normatief -> eclectisch (fits: synthesized traditions)
    52,   # John Stuart Mill - normatief -> eclectisch
    147,  # Amartya Sen - normatief -> eclectisch
    108,  # Harriet Taylor Mill - normatief -> eclectisch
    # From empirisch (move 4)
    22,   # Averroes - empirisch -> eclectisch (fits: bridged Aristotle and Islam)
    55,   # Charles Sanders Peirce - empirisch -> eclectisch
    102,  # Al-Farabi - contemplatief -> eclectisch
    167,  # Susanne Langer - empirisch -> eclectisch
]

# ─── Step 4: Cost Rebalancing ────────────────────────────────────────────────

# Cards to change to 0-cost (low VP, currently cost 2) - ~9 cards
COST_0_IDS = [
    1,    # Thales - vp 3, cost ['sfeer']... actually cost 1
    # Need cards with kosten length 2 and low vp
    129,  # Max Stirner - vp 3, cost ['spiegel'] -> already cost 1
    # Let's pick cost-2 low VP cards
    114,  # Empedocles - vp 3, cost ['sfeer'] -> cost 1...
]
# Actually, let me compute this dynamically in the main logic

# Cards to change from 2-cost to 1-cost (~25 cards to get from 70% to ~42% cost-2)
# Cards to change from 2-cost to 3-cost (high VP cards)

# ─── Step 5: Spreken access ─────────────────────────────────────────────────

# Cards with only ['L', 'S'] that should get 'Sp' added (~20 cards)
ADD_SP_IDS = [
    15,   # Marcus Aurelius
    16,   # Plotinus
    19,   # Boethius
    23,   # Maimonides
    25,   # William van Ockham
    28,   # Thomas More
    29,   # Michel de Montaigne
    30,   # Francis Bacon
    33,   # Baruch Spinoza
    37,   # George Berkeley
    41,   # Montesquieu
    47,   # Friedrich Schelling
    49,   # Arthur Schopenhauer
    51,   # Friedrich Engels
    55,   # Charles Sanders Peirce
    66,   # Gottlob Frege
    69,   # Rudolf Carnap
    81,   # Maurice Merleau-Ponty
    82,   # Emmanuel Levinas
    95,   # Antonio Gramsci
]


# ─── Main Rebalancing Logic ──────────────────────────────────────────────────

def main():
    cards = parse_cards(INPUT_PATH)
    print(f"Parsed {len(cards)} cards")

    # Print before stats
    print("\n=== BEFORE STATS ===")
    print_stats(cards)

    # ── 1. VP Rebalancing ──
    for card in cards:
        card['vp'] = rebalance_vp(card)

    # ── 2. Power Type Rebalancing ──

    # Convert to groenblauw
    for i, cid in enumerate(GROENBLAUW_IDS):
        card = find_card(cards, cid)
        card['kracht_type'] = 'groenblauw'
        card['kracht'] = GROENBLAUW_POWERS[i]

    # Convert to geel
    for i, cid in enumerate(GEEL_IDS):
        card = find_card(cards, cid)
        card['kracht_type'] = 'geel'
        card['kracht'] = GEEL_POWERS[i]

    # Convert to wit
    for i, cid in enumerate(WIT_IDS):
        card = find_card(cards, cid)
        card['kracht_type'] = 'wit'
        card['kracht'] = WIT_POWERS[i]

    # ── 3. Traditie Rebalancing ──
    for cid in TO_DIALECTISCH_IDS:
        card = find_card(cards, cid)
        card['traditie'] = 'dialectisch'

    for cid in TO_ECLECTISCH_IDS:
        card = find_card(cards, cid)
        card['traditie'] = 'eclectisch'

    # ── 4. Cost Rebalancing ──
    # Current cost distribution analysis
    cost_counts = {}
    for card in cards:
        c = len(card['kosten'])
        cost_counts[c] = cost_counts.get(c, 0) + 1

    # Target: ~9 cost-0 (5%), ~48 cost-1 (28%), ~71 cost-2 (42%), ~42 cost-3 (25%)
    # Currently most are cost 2. Need to:
    # - Create ~9 cost-0 cards from cost-1 or cost-2 (low VP)
    # - Create more cost-1 cards from cost-2
    # - Create more cost-3 cards from cost-2 (high VP)

    idea_types = ['sfeer', 'passer', 'oog', 'weegschaal', 'spiegel']

    # Convert some cost-2 to cost-0 (pick low VP cards, ~7 more beyond any already 0)
    cost_0_candidates = [c for c in cards if len(c['kosten']) == 1 and c['vp'] <= 2]
    cost_0_from_2 = [c for c in cards if len(c['kosten']) == 2 and c['vp'] <= 3]
    random.shuffle(cost_0_from_2)

    # Make ~9 total cost-0 cards
    current_0 = sum(1 for c in cards if len(c['kosten']) == 0)
    need_0 = 9 - current_0
    converted_0 = 0
    for card in cost_0_candidates[:need_0]:
        card['kosten'] = []
        converted_0 += 1
    if converted_0 < need_0:
        for card in cost_0_from_2[:need_0 - converted_0]:
            card['kosten'] = []

    # Convert some cost-2 to cost-1 (~need more cost-1)
    # Target ~48 cost-1. Currently have some.
    current_1 = sum(1 for c in cards if len(c['kosten']) == 1)
    need_more_1 = 48 - current_1
    if need_more_1 > 0:
        cost_2_to_1 = [c for c in cards if len(c['kosten']) == 2 and c['vp'] <= 4
                       and c['id'] not in COST_0_IDS]
        random.shuffle(cost_2_to_1)
        for card in cost_2_to_1[:need_more_1]:
            # Remove one random cost element
            card['kosten'] = [card['kosten'][0]]

    # Convert some cost-2 to cost-3 (high VP cards)
    current_3 = sum(1 for c in cards if len(c['kosten']) == 3)
    need_more_3 = 42 - current_3
    if need_more_3 > 0:
        cost_2_to_3 = [c for c in cards if len(c['kosten']) == 2 and c['vp'] >= 5]
        random.shuffle(cost_2_to_3)
        for card in cost_2_to_3[:need_more_3]:
            # Add one extra idea
            extra = random.choice(idea_types)
            card['kosten'].append(extra)

    # ── 5. Add 'Sp' to more cards ──
    for cid in ADD_SP_IDS:
        card = find_card(cards, cid)
        if 'Sp' not in card['vaardigheden']:
            card['vaardigheden'].append('Sp')

    # Print after stats
    print("\n=== AFTER STATS ===")
    print_stats(cards)

    # Write output
    write_cards_js(cards, OUTPUT_PATH)
    print(f"\nWrote {len(cards)} cards to {OUTPUT_PATH}")


def find_card(cards, card_id):
    for card in cards:
        if card['id'] == card_id:
            return card
    raise ValueError(f"Card with id {card_id} not found")


def print_stats(cards):
    # VP stats
    vps = [c['vp'] for c in cards]
    avg_vp = sum(vps) / len(vps)
    print(f"VP: avg={avg_vp:.2f}, min={min(vps)}, max={max(vps)}")
    vp_dist = {}
    for v in vps:
        vp_dist[v] = vp_dist.get(v, 0) + 1
    for v in sorted(vp_dist.keys()):
        print(f"  VP {v}: {vp_dist[v]} cards")

    # Power type stats
    print("\nPower type distribution:")
    kt_dist = {}
    for c in cards:
        kt = c['kracht_type']
        kt_dist[kt] = kt_dist.get(kt, 0) + 1
    for kt in sorted(kt_dist.keys()):
        pct = kt_dist[kt] / len(cards) * 100
        print(f"  {kt}: {kt_dist[kt]} ({pct:.1f}%)")

    # Traditie stats
    print("\nTraditie distribution:")
    tr_dist = {}
    for c in cards:
        tr = c['traditie']
        tr_dist[tr] = tr_dist.get(tr, 0) + 1
    for tr in sorted(tr_dist.keys()):
        pct = tr_dist[tr] / len(cards) * 100
        print(f"  {tr}: {tr_dist[tr]} ({pct:.1f}%)")

    # Cost stats
    print("\nCost distribution:")
    co_dist = {}
    for c in cards:
        co = len(c['kosten'])
        co_dist[co] = co_dist.get(co, 0) + 1
    for co in sorted(co_dist.keys()):
        pct = co_dist[co] / len(cards) * 100
        print(f"  cost {co}: {co_dist[co]} ({pct:.1f}%)")

    # Spreken stats
    sp_count = sum(1 for c in cards if 'Sp' in c['vaardigheden'])
    print(f"\nSpreken access: {sp_count}/{len(cards)} ({sp_count/len(cards)*100:.1f}%)")


def write_cards_js(cards, path):
    lines = []
    lines.append("// Auto-generated from kaarten.json")
    lines.append("const ALL_CARDS = [")
    for i, card in enumerate(cards):
        lines.append("  {")
        lines.append(f"    id: {card['id']},")
        lines.append(f"    naam: '{escape_js(card['naam'])}',")
        lines.append(f"    geboren: {card['geboren']},")
        if card['overleden'] is None:
            lines.append(f"    overleden: null,")
        else:
            lines.append(f"    overleden: {card['overleden']},")
        lines.append(f"    stroming: '{escape_js(card['stroming'])}',")
        lines.append(f"    traditie: '{escape_js(card['traditie'])}',")
        lines.append(f"    invloed: {card['invloed']},")

        # vaardigheden
        skills = ", ".join(f"'{s}'" for s in card['vaardigheden'])
        lines.append(f"    vaardigheden: [{skills}],")

        # kosten
        kosten = ", ".join(f"'{k}'" for k in card['kosten'])
        lines.append(f"    kosten: [{kosten}],")

        lines.append(f"    vp: {card['vp']},")
        lines.append(f"    boek_capaciteit: {card['boek_capaciteit']},")
        lines.append(f"    kracht_type: '{escape_js(card['kracht_type'])}',")
        lines.append(f"    kracht: '{escape_js(card['kracht'])}',")
        lines.append(f"    citaat: '{escape_js(card['citaat'])}'")

        if i < len(cards) - 1:
            lines.append("  },")
        else:
            lines.append("  }")
    lines.append("];")
    lines.append("")

    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


def escape_js(s):
    """Escape a string for use inside JS single quotes."""
    return s.replace("\\", "\\\\").replace("'", "\\'")


if __name__ == '__main__':
    main()
