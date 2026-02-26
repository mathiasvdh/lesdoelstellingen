#!/usr/bin/env python3
"""
Rebalance De Academie cards to match Wingspan distribution.

Changes:
1. Skills (vaardigheden): from 62% all-three to ~18% all-three, ~35% two, ~47% one
2. VP curve: shift down (avg 4.3 → ~3.5)
3. Idea costs: more balanced across 5 types
"""

import json
import re
import random
import sys

random.seed(42)  # Reproducible

def parse_cards_js(path):
    """Parse cards.js into list of card dicts."""
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract the array
    match = re.search(r'const ALL_CARDS = (\[[\s\S]*?\]);', content)
    if not match:
        print("Could not find ALL_CARDS array!")
        sys.exit(1)

    arr_str = match.group(1)
    # Fix JS → JSON: unquoted keys, trailing commas, single quotes
    # Simple approach: eval-like with json
    # Actually, let's use a regex approach to extract card objects
    cards = []
    # Match each { ... } block
    card_blocks = re.findall(r'\{[^{}]+\}', arr_str)
    for block in card_blocks:
        card = {}
        # id
        m = re.search(r'id:\s*(\d+)', block)
        if m: card['id'] = int(m.group(1))
        # naam
        m = re.search(r'naam:\s*"([^"]*)"', block)
        if m: card['naam'] = m.group(1)
        # geboren
        m = re.search(r'geboren:\s*(-?\d+)', block)
        if m: card['geboren'] = int(m.group(1))
        # overleden
        m = re.search(r'overleden:\s*(-?\d+|null)', block)
        if m: card['overleden'] = None if m.group(1) == 'null' else int(m.group(1))
        # stroming
        m = re.search(r'stroming:\s*"([^"]*)"', block)
        if m: card['stroming'] = m.group(1)
        # traditie
        m = re.search(r'traditie:\s*"([^"]*)"', block)
        if m: card['traditie'] = m.group(1)
        # invloed
        m = re.search(r'invloed:\s*(\d+)', block)
        if m: card['invloed'] = int(m.group(1))
        # vaardigheden
        m = re.search(r'vaardigheden:\s*\[([^\]]*)\]', block)
        if m:
            skills_str = m.group(1)
            card['vaardigheden'] = re.findall(r'"([^"]*)"', skills_str)
        # kosten
        m = re.search(r'kosten:\s*\[([^\]]*)\]', block)
        if m:
            costs_str = m.group(1)
            card['kosten'] = re.findall(r'"([^"]*)"', costs_str)
        # vp
        m = re.search(r'vp:\s*(\d+)', block)
        if m: card['vp'] = int(m.group(1))
        # boek_capaciteit
        m = re.search(r'boek_capaciteit:\s*(\d+)', block)
        if m: card['boek_capaciteit'] = int(m.group(1))
        # kracht_type
        m = re.search(r'kracht_type:\s*"([^"]*)"', block)
        if m: card['kracht_type'] = m.group(1)
        # kracht
        m = re.search(r'kracht:\s*"([^"]*)"', block)
        if m: card['kracht'] = m.group(1)
        # citaat
        m = re.search(r'citaat:\s*"([^"]*)"', block)
        if m: card['citaat'] = m.group(1)

        if 'id' in card:
            cards.append(card)

    return cards


def assign_skills(cards):
    """
    Reassign skills based on philosopher's historical profile.
    Target: ~30 all-three (18%), ~60 two (35%), ~80 one (47%)
    Each skill appears in ~83 cards total.
    """
    # Categorize philosophers by their primary activity
    # Sp (Spreken) = known orators, debaters, public intellectuals
    # S (Schrijven) = prolific writers, systematic authors
    # L (Lezen) = scholars, researchers, commentators, analysts

    # Primary skill mapping by stroming - balanced for L≈S≈Sp≈83
    stroming_primary = {
        'Oudheid': {'primary': 'Sp', 'secondary': 'L'},      # Oral tradition dominant
        'Middeleeuwen': {'primary': 'L', 'secondary': 'S'},   # Scholarly study
        'Renaissance': {'primary': 'S', 'secondary': 'Sp'},   # Humanist writing + rhetoric
        'Rationalisme': {'primary': 'S', 'secondary': 'L'},   # Systematic treatises
        'Empirisme': {'primary': 'L', 'secondary': 'Sp'},     # Research/observation + teaching
        'Verlichting': {'primary': 'Sp', 'secondary': 'S'},   # Public intellectuals
        'Duits Idealisme': {'primary': 'S', 'secondary': 'L'},# Dense systematic writing
        'Kritische Theorie': {'primary': 'Sp', 'secondary': 'S'}, # Activism + writing
        'Existentialisme': {'primary': 'Sp', 'secondary': 'S'},   # Lecture + literary
        'Pragmatisme': {'primary': 'Sp', 'secondary': 'L'},      # Teaching + research
        'Fenomenologie': {'primary': 'L', 'secondary': 'S'},     # Deep analysis
        'Analytische Filosofie': {'primary': 'L', 'secondary': 'S'}, # Logic/analysis
        'Postmodernisme': {'primary': 'S', 'secondary': 'Sp'},   # Writing + discourse
        'Feminisme': {'primary': 'Sp', 'secondary': 'S'},        # Activism + writing
    }

    # Known speakers (force Sp)
    speakers = {
        'Socrates', 'Diogenes van Sinope', 'Epictetus', 'Protagoras', 'Gorgias',
        'Confucius', 'Martin Luther King Jr.', 'Voltaire', 'Cicero',
        'Cornel West', 'Seneca', 'Buddha'
    }

    # Known primarily writers (force S)
    writers = {
        'Plato', 'Aristoteles', 'Thomas van Aquino', 'René Descartes',
        'Immanuel Kant', 'Georg Wilhelm Friedrich Hegel', 'Karl Marx',
        'Friedrich Nietzsche', 'Simone de Beauvoir', 'Jean-Paul Sartre',
        'Michel Foucault', 'Jacques Derrida', 'Albert Camus',
        'Arthur Schopenhauer', 'John Locke', 'David Hume', 'Baruch Spinoza',
        'Thomas Hobbes', 'Jean-Jacques Rousseau'
    }

    # Known primarily readers/researchers (force L)
    readers = {
        'Gottlob Frege', 'Bertrand Russell', 'Ludwig Wittgenstein',
        'Rudolf Carnap', 'W.V.O. Quine', 'Karl Popper', 'Thomas Kuhn',
        'Avicenna', 'Averroes', 'Maimonides', 'Al-Kindi',
        'Edmund Husserl', 'Hans-Georg Gadamer'
    }

    # Target counts
    target_all3 = 30    # 18%
    target_two = 60     # 35%
    target_one = 80     # 47%
    total = len(cards)   # 170

    # Track skill counts for balance
    skill_counts = {'L': 0, 'S': 0, 'Sp': 0}
    target_per_skill = 83  # Each skill should appear ~83 times

    # Step 1: Assign primary skill to each card
    primary_skills = {}
    for card in cards:
        naam = card['naam']
        stroming = card.get('stroming', '')

        if naam in speakers:
            primary_skills[card['id']] = 'Sp'
        elif naam in writers:
            primary_skills[card['id']] = 'S'
        elif naam in readers:
            primary_skills[card['id']] = 'L'
        elif stroming in stroming_primary:
            primary_skills[card['id']] = stroming_primary[stroming]['primary']
        else:
            primary_skills[card['id']] = random.choice(['L', 'S', 'Sp'])

    # Step 2: Determine skill count per card
    # Sort cards by VP (high VP = more likely to have 1 skill, like Wingspan)
    sorted_cards = sorted(cards, key=lambda c: c.get('vp', 0), reverse=True)

    skill_assignments = {}
    all3_count = 0
    two_count = 0
    one_count = 0

    for card in sorted_cards:
        cid = card['id']
        vp = card.get('vp', 0)
        primary = primary_skills[cid]
        stroming = card.get('stroming', '')

        # High VP cards (7-9) → usually 1 skill
        # Medium VP (4-6) → mix of 1-2 skills
        # Low VP (0-3) → more likely 2-3 skills (engine builders)

        if vp >= 7 and one_count < target_one:
            num_skills = 1
        elif vp >= 5 and one_count < target_one:
            # 70% chance 1 skill, 30% chance 2 skills
            num_skills = 1 if random.random() < 0.65 else 2
        elif vp >= 3:
            # Mix: 30% one, 50% two, 20% three
            r = random.random()
            if r < 0.25 and one_count < target_one:
                num_skills = 1
            elif r < 0.75 and two_count < target_two:
                num_skills = 2
            elif all3_count < target_all3:
                num_skills = 3
            elif two_count < target_two:
                num_skills = 2
            else:
                num_skills = 1
        else:
            # Low VP: engine builders, more likely 2-3 skills
            r = random.random()
            if r < 0.15 and one_count < target_one:
                num_skills = 1
            elif r < 0.55 and two_count < target_two:
                num_skills = 2
            elif all3_count < target_all3:
                num_skills = 3
            elif two_count < target_two:
                num_skills = 2
            else:
                num_skills = 1

        # Ensure we don't exceed targets
        if num_skills == 3 and all3_count >= target_all3:
            num_skills = 2
        if num_skills == 2 and two_count >= target_two:
            num_skills = 1 if one_count < target_one else 3
        if num_skills == 1 and one_count >= target_one:
            num_skills = 2 if two_count < target_two else 3

        # Assign skills
        all_skills = ['L', 'S', 'Sp']
        if num_skills == 1:
            skills = [primary]
            one_count += 1
        elif num_skills == 2:
            secondary_map = stroming_primary.get(stroming, {})
            secondary = secondary_map.get('secondary', None)
            if secondary and secondary != primary:
                skills = [primary, secondary]
            else:
                others = [s for s in all_skills if s != primary]
                skills = [primary, random.choice(others)]
            two_count += 1
        else:
            skills = ['L', 'S', 'Sp']
            all3_count += 1

        # Sort skills in canonical order
        skill_order = {'L': 0, 'S': 1, 'Sp': 2}
        skills.sort(key=lambda s: skill_order[s])

        skill_assignments[cid] = skills
        for s in skills:
            skill_counts[s] += 1

    # Post-processing: balance skill counts closer to 83 each
    print(f"  Before post-processing: L={skill_counts['L']}, S={skill_counts['S']}, Sp={skill_counts['Sp']}")
    swaps = 0
    for _ in range(500):  # Multiple passes
        # Total skill slots = 80*1 + 60*2 + 30*3 = 290. Target per skill ≈ 97
        over = [s for s in ['L', 'S', 'Sp'] if skill_counts[s] > 99]
        under = [s for s in ['L', 'S', 'Sp'] if skill_counts[s] < 94]
        if not over or not under:
            break

        over_skill = max(over, key=lambda s: skill_counts[s])
        under_skill = min(under, key=lambda s: skill_counts[s])

        # Try 2-skill cards first
        candidates = [cid for cid, skills in skill_assignments.items()
                       if len(skills) == 2 and over_skill in skills and under_skill not in skills]

        # Also try 1-skill cards (swap their only skill)
        if not candidates:
            candidates = [cid for cid, skills in skill_assignments.items()
                           if len(skills) == 1 and skills[0] == over_skill]

        if not candidates:
            break

        cid = random.choice(candidates)
        old_skills = skill_assignments[cid]
        new_skills = [under_skill if s == over_skill else s for s in old_skills]
        skill_order = {'L': 0, 'S': 1, 'Sp': 2}
        new_skills.sort(key=lambda s: skill_order[s])
        skill_assignments[cid] = new_skills
        skill_counts[over_skill] -= 1
        skill_counts[under_skill] += 1
        swaps += 1

    print(f"  After post-processing ({swaps} swaps): L={skill_counts['L']}, S={skill_counts['S']}, Sp={skill_counts['Sp']}")

    # Print stats
    print(f"\nSkill distribution:")
    print(f"  1 skill: {one_count} ({one_count*100//total}%)")
    print(f"  2 skills: {two_count} ({two_count*100//total}%)")
    print(f"  3 skills: {all3_count} ({all3_count*100//total}%)")
    print(f"  Per skill: L={skill_counts['L']}, S={skill_counts['S']}, Sp={skill_counts['Sp']}")

    # Apply
    for card in cards:
        card['vaardigheden'] = skill_assignments[card['id']]

    return cards


def rebalance_vp(cards):
    """
    Shift VP curve down. Target avg ~3.5 (from 4.3).
    Strategy: reduce high VP cards, increase low VP cards.
    """
    # Current: avg 4.3, target 3.5
    # Reduce cards with 6+ VP, increase 0-2 VP
    for card in cards:
        vp = card['vp']
        if vp >= 8:
            card['vp'] = vp - 2  # 8→6, 9→7
        elif vp >= 6:
            card['vp'] = vp - 1  # 6→5, 7→6
        elif vp == 5:
            # 50% chance to reduce by 1
            if random.random() < 0.4:
                card['vp'] = 4

    # Verify
    avg = sum(c['vp'] for c in cards) / len(cards)
    print(f"\nVP distribution after rebalance: avg={avg:.1f}")
    vp_dist = {}
    for c in cards:
        vp_dist[c['vp']] = vp_dist.get(c['vp'], 0) + 1
    for vp in sorted(vp_dist.keys()):
        print(f"  {vp} VP: {vp_dist[vp]} cards")

    return cards


def rebalance_costs(cards):
    """
    Balance idea types in costs more evenly.
    Current: weegschaal=81, oog=42, rest ~75. Target: ~60-70 each.
    """
    idea_types = ['weegschaal', 'oog', 'spiegel', 'passer', 'sfeer']

    # Count current
    counts = {t: 0 for t in idea_types}
    for card in cards:
        for c in card.get('kosten', []):
            counts[c] = counts.get(c, 0) + 1

    print(f"\nCost distribution before: {counts}")

    # For cards with costs, redistribute to even out
    # Main issue: oog is underrepresented, weegschaal is overrepresented
    # Strategy: for each cost symbol, randomly swap overrepresented → underrepresented

    total_costs = sum(counts.values())
    target_per = total_costs // 5  # Should be ~69 each

    for card in cards:
        new_costs = []
        for cost in card.get('kosten', []):
            # If this type is overrepresented, maybe swap
            if counts[cost] > target_per + 5:
                # Find underrepresented type
                under = [t for t in idea_types if counts[t] < target_per - 5]
                if under and random.random() < 0.4:
                    new_type = random.choice(under)
                    counts[cost] -= 1
                    counts[new_type] += 1
                    new_costs.append(new_type)
                    continue
            new_costs.append(cost)
        card['kosten'] = new_costs

    # Final counts
    counts2 = {t: 0 for t in idea_types}
    for card in cards:
        for c in card.get('kosten', []):
            counts2[c] = counts2.get(c, 0) + 1
    print(f"Cost distribution after: {counts2}")

    return cards


def write_cards_js(cards, path):
    """Write cards back to cards.js format."""
    lines = ['// Auto-generated from kaarten.json - Rebalanced v3.1 (Wingspan-accurate)\nconst ALL_CARDS = [']

    for i, card in enumerate(cards):
        # Format each card
        kosten_str = ', '.join(f'"{c}"' for c in card.get('kosten', []))
        skills_str = ', '.join(f'"{s}"' for s in card.get('vaardigheden', []))
        geboren = str(card.get('geboren', 0))
        overleden = 'null' if card.get('overleden') is None else str(card['overleden'])

        # Escape quotes in strings
        naam = card.get('naam', '').replace('"', '\\"')
        stroming = card.get('stroming', '').replace('"', '\\"')
        traditie = card.get('traditie', '').replace('"', '\\"')
        kracht = card.get('kracht', '').replace('"', '\\"')
        citaat = card.get('citaat', '').replace('"', '\\"')

        line = '  {\n'
        line += f'    id: {card["id"]},\n'
        line += f'    naam: "{naam}",\n'
        line += f'    geboren: {geboren},\n'
        line += f'    overleden: {overleden},\n'
        line += f'    stroming: "{stroming}",\n'
        line += f'    traditie: "{traditie}",\n'
        line += f'    invloed: {card.get("invloed", 5)},\n'
        line += f'    vaardigheden: [{skills_str}],\n'
        line += f'    kosten: [{kosten_str}],\n'
        line += f'    vp: {card["vp"]},\n'
        line += f'    boek_capaciteit: {card.get("boek_capaciteit", 2)},\n'
        line += f'    kracht_type: "{card.get("kracht_type", "bruin")}",\n'
        line += f'    kracht: "{kracht}",\n'
        line += f'    citaat: "{citaat}"\n'
        line += '  }'
        if i < len(cards) - 1:
            line += ','
        lines.append(line)

    lines.append('];')

    # Add the constants that were after ALL_CARDS
    lines.append('')
    lines.append('// Levenswerk data is in game.js (ALL_LEVENSWERK)')
    lines.append('// Round goals are in game.js (ALL_ROUND_GOALS)')

    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')


def main():
    path = 'cards.js'
    if len(sys.argv) > 1:
        path = sys.argv[1]

    print(f"Reading {path}...")
    cards = parse_cards_js(path)
    print(f"Parsed {len(cards)} cards")

    # Print current stats
    skill_counts = {1: 0, 2: 0, 3: 0}
    for c in cards:
        n = len(c.get('vaardigheden', []))
        skill_counts[n] = skill_counts.get(n, 0) + 1
    print(f"\nCurrent skill distribution: {skill_counts}")

    vp_avg = sum(c.get('vp', 0) for c in cards) / len(cards)
    print(f"Current VP avg: {vp_avg:.1f}")

    # Apply rebalancing
    cards = assign_skills(cards)
    cards = rebalance_vp(cards)
    cards = rebalance_costs(cards)

    # Write back
    out_path = path  # Overwrite
    print(f"\nWriting to {out_path}...")
    write_cards_js(cards, out_path)
    print("Done!")


if __name__ == '__main__':
    main()
