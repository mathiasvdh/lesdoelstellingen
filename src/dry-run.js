/**
 * Dry-run: test de evaluatielogica zonder browser.
 * Simuleert Gemini-antwoorden om het evaluatie- en rapportagesysteem te valideren.
 */

const { students } = require('./students');
const { evaluateResponse } = require('./evaluator');
const { generateReport } = require('./reporter');
const path = require('path');

// Gesimuleerde Gemini-antwoorden per leerlingtype
const simulatedResponses = {
  1: `Goed geschreven, Emma! Je hebt een duidelijke stelling gekozen: de overstromingen in Spanje waren de belangrijkste gebeurtenis van 2025. Dat is een sterk onderwerp.

Wat je goed doet:
- Je noemt concrete gevolgen (mensen zijn hun huis kwijtgeraakt, overleden)
- Je legt een verband met klimaatverandering
- Je geeft je eigen mening

Tips om je argumentatie te verbeteren:
1. Probeer je stelling krachtiger te formuleren. In plaats van "ik denk dat" kun je schrijven: "De overstromingen in Spanje waren de belangrijkste gebeurtenis van 2025."
2. Voeg een tegenargument toe: sommige mensen vinden misschien dat andere gebeurtenissen belangrijker waren. Waarom is dit toch het belangrijkst?
3. Gebruik cijfers of feiten als onderbouwing: hoeveel mensen waren getroffen? In welke landen?
4. Sluit af met een sterke conclusie die terugverwijst naar je stelling.

Let ook op je spelling: "zien" moet "zien" zijn → "zien" is correct, maar "zelfs" moet "zelfs" → "zelfs" zijn. Goed bezig!`,

  2: `Hey Daan! Je hebt een interessant onderwerp gekozen - AI was inderdaad een groot thema in 2025. Laten we kijken hoe je argumentatie sterker kan worden.

Wat goed is:
- Je hebt een duidelijke mening
- Je noemt een concreet voorbeeld (je vader en banen)

Verbeterpunten:
1. Schrijf in volledige zinnen en begin met een hoofdletter. "ja dus ik vind eigenlijk" → "Ik vind dat AI de belangrijkste ontwikkeling van 2025 was."
2. Onderbouw je argument: WAAROM was AI het belangrijkst? Geef minstens twee redenen.
3. Voeg een tegenargument toe: niet iedereen vindt AI het belangrijkst. Weerleg dat.
4. Probeer woorden als "enzo" te vermijden in een argumentatieve tekst. Gebruik in plaats daarvan "en andere toepassingen."
5. Sluit af met een conclusie.

Je standpunt is goed, maar een argumentatie heeft structuur nodig: stelling → argumenten → onderbouwing → conclusie. Probeer dat eens!`,

  3: `Uitstekend werk, Fatima! Je argumentatie over het conflict in het Midden-Oosten is goed opgebouwd en laat zien dat je kunt structureren.

Sterke punten:
- Je gebruikt connectiewoorden als "ten eerste", "ten tweede" en "daarnaast"
- Je noemt meerdere argumenten op verschillende niveaus (humanitair, internationaal, nationaal)
- Je formuleert helder en formeel

Suggesties voor verbetering:
1. Je stelling is sterk, maar overweeg om ook een tegenargument te benoemen en te weerleggen. Bijvoorbeeld: "Hoewel sommigen zullen zeggen dat klimaatverandering de belangrijkste kwestie was..."
2. Voeg specifieke feiten of cijfers toe als onderbouwing van je argumenten. Bijvoorbeeld: hoeveel burgers zijn getroffen?
3. Je conclusie zou krachtiger kunnen. Probeer terug te verwijzen naar je stelling en je argumenten samen te vatten.
4. Het woord "laat zien" zou je kunnen vervangen door "toont aan" voor een formeler register.

Je bent goed op weg naar een overtuigende argumentatie!`,

  4: `Hoi Sem! Je enthousiasme is duidelijk en je hebt een sterk onderwerp gekozen. Laten we je argumentatie wat oppoetsen.

Wat je goed doet:
- Je bent duidelijk betrokken bij het onderwerp
- Je noemt verschillende perspectieven (school, TikTok, moeder, opa)

Verbeterpunten:
1. Begin met een duidelijke stelling zonder "Oké ik weet het!". Bijvoorbeeld: "De Amerikaanse verkiezingen waren de belangrijkste gebeurtenis van 2025."
2. Vermijd hoofdletters voor nadruk (ALLES). Gebruik in plaats daarvan sterkere woorden.
3. Structureer je argumenten: geef minstens twee redenen WAAROM dit zo belangrijk was, en onderbouw die met feiten.
4. Voeg een tegenargument toe: wat zouden mensen die het niet met je eens zijn, zeggen?
5. Let op spelling: "me" moet "mee" zijn, "beinvloed" moet "beïnvloedt" zijn.
6. Eindig met een conclusie die je stelling herhaalt.

Tip: probeer je argumentatie op te bouwen als een trechter: begin breed (waarom zijn verkiezingen belangrijk?) en word steeds specifieker.`,

  5: `Knap geschreven, Lisa! Je argumentatie getuigt van een hoog analytisch niveau en een breed perspectief.

Sterke punten:
- Uitstekende structuur met een heldere stelling
- Je plaatst AI in een breder maatschappelijk kader
- Je weerlegt impliciet andere mogelijke antwoorden
- Concreet voorbeeld: EU AI Act
- Sterke afsluitende zin

Suggesties ter verfijning:
1. Je zou je argumentatie nog sterker maken door expliciet een tegenargument te benoemen en te weerleggen. Je doet dit nu impliciet ("Hoewel er veel belangrijke gebeurtenissen waren..."), maar een uitgewerkte weerlegging zou je betoog krachtiger maken.
2. Overweeg om een persoonlijk of concreet voorbeeld toe te voegen naast het institutionele voorbeeld (EU AI Act). Hoe raakte AI het dagelijks leven?
3. Kleine opmerking: "gebeurtenissen" heb je correct gespeld, maar "voortvloeide" zou "voortvloeide" moeten zijn (of beter: "die hieruit voortvloeide" → "die hieruit is voortgevloeid").
4. Je conclusie is sterk. Je zou kunnen overwegen om een oproep tot actie toe te voegen.

Dit is een argumentatie van hoog niveau. Goed gedaan!`,

  6: `Hey Jayden! Je hebt een goed onderwerp gekozen en het is mooi dat je een persoonlijk voorbeeld noemt. Laten we kijken hoe je argumentatie beter kan.

Wat je goed doet:
- Je kiest een duidelijk onderwerp
- Je gebruikt een persoonlijk voorbeeld (je buurmeisje)
- Je laat zien waarom het belangrijk voor je is

Verbeterpunten:
1. Begin zinnen met een hoofdletter. Schrijf "Ik ga zeggen dat..." in plaats van "ik ga zeggen dat..."
2. Gebruik volledige zinnen: "er gingen echt heel veel mensen dood" → "Er zijn heel veel mensen om het leven gekomen."
3. Probeer je argumenten op te bouwen:
   - Argument 1: De aardbeving was heel heftig (hoeveel slachtoffers? Hoe groot was de schade?)
   - Argument 2: Het raakte ook mensen in Nederland (jouw buurmeisje)
   - Argument 3: Waarom is dit belangrijker dan andere gebeurtenissen?
4. Vermijd straattaal in een argumentatieve tekst: "niet normaal" → "verschrikkelijk" of "onvoorstelbaar"
5. Voeg een conclusie toe waarin je je stelling herhaalt.

Je persoonlijke betrokkenheid maakt je argumentatie sterk. Bouw daar verder op!`,

  7: `Prachtig geschreven, Sophie! Je hebt een heel beeldende en overtuigende stijl. Laten we kijken hoe je argumentatie nog sterker kan.

Sterke punten:
- Heel sterk begin met een retorische vraag die de lezer meteen grijpt
- Je noemt concrete voorbeelden (bosbranden, hittegolven, overstromingen)
- Emotionele betrokkenheid die overtuigt
- Mooie afsluitende zin

Suggesties:
1. Je argumentatie is nu vooral emotioneel. Probeer ook rationele argumenten toe te voegen: cijfers, feiten, wetenschappelijke onderbouwing.
2. Voeg een tegenargument toe: "Sommigen zullen zeggen dat de klimaatcrisis al langer speelt, maar 2025 was het jaar waarin..."
3. Je schrijft "niet omdat het één moment was" - dit is een sterk punt. Werk dit verder uit: welke specifieke gebeurtenissen maakten 2025 het keerpunt?
4. Overweeg een duidelijkere structuur: inleiding → stelling → argumenten → tegenargument → conclusie.
5. Je laatste zin is krachtig maar ook een beetje beschuldigend. Overweeg een constructievere afsluiting: wat KUNNEN we doen?

Je schrijftalent is duidelijk. Met wat meer structuur en onderbouwing wordt dit een topargumentatie!`,

  8: `Goed onderwerp, Mohammed! De stijgende kosten raakten inderdaad veel mensen in 2025. Laten we je argumentatie verbeteren.

Wat je goed doet:
- Je kiest een onderwerp dat veel mensen raakt
- Je noemt concrete voorbeelden (boodschappen, benzine, huizen)
- Je gebruikt een persoonlijk voorbeeld (je ouders)

Verbeterpunten:
1. Formuleer een duidelijke stelling aan het begin: "De economische crisis was de belangrijkste gebeurtenis van 2025 omdat..."
2. Structureer je argumenten beter:
   - Argument 1: Alles werd duurder (geef cijfers als je die hebt)
   - Argument 2: Het raakte iedereen, niet alleen bepaalde groepen
   - Argument 3: De politiek deed er te weinig aan
3. Je stelt een retorische vraag ("Als je niet genoeg geld hebt voor eten dan is dat toch het belangrijkste probleem?") - dit is sterk! Gebruik dit bewuster als overtuigingsmiddel.
4. Probeer een tegenargument te weerleggen: "Hoewel klimaatverandering ook een groot probleem was, raakt de economische crisis mensen direct in hun dagelijks leven."
5. Voeg een conclusie toe.

Je bent op de goede weg! Met meer structuur wordt dit een overtuigend betoog.`,

  9: `Uitstekende argumentatie, Fleur! Je laat sterke debatvaardigheden zien.

Sterke punten:
- Heldere, krachtige stelling
- Je anticipeert op tegenargumenten en weerlegt ze direct
- Logische opbouw van je redenering
- Sterk slotargument: democratie als instrument voor andere problemen

Suggesties ter verfijning:
1. Je argumentatie is sterk in de weerlegging, maar zou gebaat zijn bij meer concrete voorbeelden. Welke specifieke gebeurtenissen in 2025 bedreigden de democratie?
2. Je noemt "de VS, maar ook in Europa" - wees specifieker. Welke Europese landen? Welke gebeurtenissen?
3. Overweeg om je argument te versterken met een historisch voorbeeld: wanneer heeft het verlies van democratie eerder tot grotere problemen geleid?
4. Je conclusie is heel sterk. Je zou kunnen overwegen om een oproep tot actie toe te voegen: wat kunnen wij als burgers doen?

Dit is een argumentatie op hoog niveau. Met meer concrete onderbouwing wordt het nog overtuigender. Goed gedaan!`,

  10: `Hoi Bram! Je hebt een onderwerp gekozen dat veel besproken werd in 2025. Goed dat je een mening hebt! Laten we kijken hoe je argumentatie beter kan.

Wat je goed doet:
- Je hebt een duidelijke mening
- Je noemt wat je zelf hebt meegemaakt op school

Tips om je argumentatie te verbeteren:
1. Begin zinnen met een hoofdletter: "De belangrijkste gebeurtenis van 2025 vind ik..."
2. Probeer je argumenten te nummeren:
   - Reden 1: Er kwamen veel mensen naar Nederland
   - Reden 2: Er was niet genoeg plek
   - Reden 3: Het had invloed op scholen
3. Gebruik verbindingswoorden: "ten eerste", "daarnaast", "bovendien", "tot slot"
4. Probeer ook de andere kant te bekijken: waarom kwamen die mensen naar Nederland? Wat vinden zij ervan?
5. Eindig met een duidelijke conclusie: wat vind jij dat er moet gebeuren en waarom?

Je hebt een goed begin. Met langere zinnen en meer uitleg wordt je argumentatie veel sterker. Probeer bij elk punt te denken: WAAROM vind ik dit? Succes!`
};

async function dryRun() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  DRY RUN - Evaluatiesysteem Test                       ║');
  console.log('║  Gebruikt gesimuleerde Gemini-antwoorden               ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  const testResults = [];
  const evaluations = [];

  for (const student of students) {
    console.log(`\n▸ ${student.naam} (${student.klas}, ${student.leeftijd} jaar)`);

    const simulatedResponse = simulatedResponses[student.id];
    const result = {
      student: student.naam,
      input: student.input,
      output: simulatedResponse,
      success: true,
    };
    testResults.push(result);

    const evaluation = evaluateResponse(student, simulatedResponse);
    evaluations.push(evaluation);

    console.log(`  Score: ${evaluation.percentage}% - ${evaluation.beoordeling}`);

    for (const [key, detail] of Object.entries(evaluation.details)) {
      const bar = '█'.repeat(detail.score) + '░'.repeat(detail.maxScore - detail.score);
      console.log(`    ${detail.naam.padEnd(35)} ${bar} ${detail.score}/${detail.maxScore}`);
    }
  }

  // Genereer rapport
  const reportDir = path.join(__dirname, '..', 'reports');
  const reportPaths = generateReport(evaluations, testResults, reportDir);

  // Samenvatting
  const avgScore = Math.round(evaluations.reduce((sum, e) => sum + e.percentage, 0) / evaluations.length);
  console.log('\n');
  console.log(`Gemiddelde score: ${avgScore}%`);
  console.log(`Rapporten: ${reportPaths.htmlPath}`);
}

dryRun().catch(console.error);
