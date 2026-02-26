/**
 * De Academie - Playtest Feedback
 *
 * Google Apps Script om het feedbackformulier automatisch aan te maken.
 *
 * GEBRUIK:
 * 1. Ga naar https://script.google.com
 * 2. Maak een nieuw project aan
 * 3. Plak deze code
 * 4. Klik op "Uitvoeren" (play-knop) > kies "createPlaytestForm"
 * 5. Geef toestemming als Google erom vraagt
 * 6. Het formulier verschijnt in je Google Drive
 */

function createPlaytestForm() {
  var form = FormApp.create('De Academie - Playtest Feedback');
  form.setDescription(
    'Bedankt voor het spelen van De Academie! ' +
    'Vul dit formulier zo eerlijk mogelijk in. Er zijn geen foute antwoorden — ' +
    'jouw mening helpt het spel beter te maken.\n\n' +
    'Invultijd: ~5 minuten'
  );
  form.setConfirmationMessage('Bedankt voor je feedback! 🎓');
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);

  // ============================================================
  // SECTIE 1: Algemeen
  // ============================================================
  form.addSectionHeaderItem()
    .setTitle('Algemeen')
    .setHelpText('Basisinformatie over jouw speelervaring.');

  form.addTextItem()
    .setTitle('Naam (of bijnaam)')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Hoe heb je gespeeld?')
    .setChoiceValues([
      'Solo (alleen)',
      'Multiplayer (met 2 spelers)',
      'Multiplayer (met 3 spelers)',
      'Multiplayer (met 4 spelers)'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Heb je het spel helemaal uitgespeeld?')
    .setChoiceValues([
      'Ja, alle 4 de rondes',
      'Nee, gestopt na ronde 1 of 2',
      'Nee, gestopt na ronde 3',
      'Nee, het spel crashte/werkte niet'
    ])
    .setRequired(true);

  // ============================================================
  // SECTIE 2: Eerste indruk & duidelijkheid
  // ============================================================
  form.addSectionHeaderItem()
    .setTitle('Eerste indruk & duidelijkheid')
    .setHelpText('Hoe was je eerste ervaring met het spel?');

  form.addScaleItem()
    .setTitle('Hoe makkelijk was het om te begrijpen wat je moest doen?')
    .setBounds(1, 5)
    .setLabels('Heel moeilijk', 'Heel makkelijk')
    .setRequired(true);

  form.addScaleItem()
    .setTitle('Hoe duidelijk was het setup-scherm (kaarten + idee\u00ebn kiezen)?')
    .setBounds(1, 5)
    .setLabels('Heel onduidelijk', 'Heel duidelijk')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Was er iets dat je niet begreep of waar je lang over moest nadenken?')
    .setHelpText('Bijv. een knop, een symbool, een regel, een kracht...')
    .setRequired(false);

  // ============================================================
  // SECTIE 3: Gameplay & spelplezier
  // ============================================================
  form.addSectionHeaderItem()
    .setTitle('Gameplay & spelplezier')
    .setHelpText('Hoe voelde het spel aan tijdens het spelen?');

  form.addScaleItem()
    .setTitle('Hoe leuk vond je het spel?')
    .setBounds(1, 5)
    .setLabels('Niet leuk', 'Heel leuk')
    .setRequired(true);

  form.addScaleItem()
    .setTitle('Hoe goed was de balans? (Voelde het eerlijk / niet te makkelijk of moeilijk?)')
    .setBounds(1, 5)
    .setLabels('Heel ongebalanceerd', 'Perfect gebalanceerd')
    .setRequired(true);

  form.addScaleItem()
    .setTitle('Had je het gevoel dat je keuzes maakte die ertoe deden? (strategisch?)')
    .setBounds(1, 5)
    .setLabels('Geen strategie', 'Veel strategie')
    .setRequired(true);

  form.addScaleItem()
    .setTitle('Hoe was het tempo?')
    .setBounds(1, 5)
    .setLabels('Te traag / saai', 'Te snel / stressvol')
    .setHelpText('3 = precies goed')
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('Welke actie vond je het leukst?')
    .setChoiceValues([
      'Filosoof plaatsen',
      'Lezen (idee\u00ebn pakken)',
      'Schrijven (boeken plaatsen)',
      'Spreken (kaarten trekken)',
      'Geen van bovenstaande / weet niet'
    ])
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Was er een moment dat je dacht "dit is cool!" of juist "dit is frustrerend"?')
    .setRequired(false);

  // ============================================================
  // SECTIE 4: Kaarten & krachten
  // ============================================================
  form.addSectionHeaderItem()
    .setTitle('Kaarten & krachten')
    .setHelpText('Over de filosoofkaarten en hun speciale krachten.');

  form.addScaleItem()
    .setTitle('Hoe duidelijk waren de krachten op de kaarten?')
    .setBounds(1, 5)
    .setLabels('Heel onduidelijk', 'Heel duidelijk')
    .setRequired(true);

  form.addScaleItem()
    .setTitle('Hoe leuk vond je het filosofie-thema? (Filosoofnamen, stromingen, citaten)')
    .setBounds(1, 5)
    .setLabels('Niet leuk', 'Heel leuk')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Waren er kaarten die je niet begreep of die te sterk/zwak leken?')
    .setHelpText('Noem de naam van de filosoof als je die nog weet.')
    .setRequired(false);

  // ============================================================
  // SECTIE 5: Uiterlijk & interface
  // ============================================================
  form.addSectionHeaderItem()
    .setTitle('Uiterlijk & interface')
    .setHelpText('Over hoe het spel eruitziet en aanvoelt.');

  form.addScaleItem()
    .setTitle('Hoe vond je het uiterlijk (kleuren, lettertype, layout)?')
    .setBounds(1, 5)
    .setLabels('Lelijk', 'Prachtig')
    .setRequired(true);

  form.addScaleItem()
    .setTitle('Hoe makkelijk was het om te vinden wat je nodig had op het scherm?')
    .setBounds(1, 5)
    .setLabels('Heel moeilijk', 'Heel makkelijk')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Was er iets op het scherm dat je miste, niet kon vinden, of dat je anders zou doen?')
    .setRequired(false);

  // ============================================================
  // SECTIE 6: Bugs & problemen
  // ============================================================
  form.addSectionHeaderItem()
    .setTitle('Bugs & problemen')
    .setHelpText('Heb je fouten of technische problemen gevonden?');

  form.addMultipleChoiceItem()
    .setTitle('Heb je bugs (fouten) gevonden tijdens het spelen?')
    .setChoiceValues([
      'Nee, alles werkte goed',
      'Ja, kleine foutjes (maar ik kon doorspelen)',
      'Ja, serieuze bugs (ik kon niet verder)'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Beschrijf de bug(s) die je tegenkwam')
    .setHelpText('Wat deed je? Wat gebeurde er? Wat had er moeten gebeuren?')
    .setRequired(false);

  form.addCheckboxItem()
    .setTitle('Welke onderdelen werkten NIET goed? (als die er waren)')
    .setChoiceValues([
      'Multiplayer verbinding',
      'Filosoof plaatsen',
      'Idee\u00ebn pakken (Lezen)',
      'Boeken plaatsen (Schrijven)',
      'Kaarten trekken (Spreken)',
      'Setup-scherm',
      'Krachten gingen niet af',
      'Scoring klopte niet',
      'Scherm was rommelig / paste niet',
      'Niets, alles werkte!'
    ])
    .setRequired(false);

  // ============================================================
  // SECTIE 7: Multiplayer
  // ============================================================
  form.addSectionHeaderItem()
    .setTitle('Multiplayer')
    .setHelpText('Alleen invullen als je multiplayer hebt gespeeld. Anders mag je deze sectie overslaan.');

  form.addScaleItem()
    .setTitle('Hoe goed werkte de multiplayer-verbinding?')
    .setBounds(1, 5)
    .setLabels('Heel slecht', 'Zonder problemen')
    .setRequired(false);

  form.addScaleItem()
    .setTitle('Was het duidelijk wanneer jij aan de beurt was?')
    .setBounds(1, 5)
    .setLabels('Heel onduidelijk', 'Heel duidelijk')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Wat vond je van het wachten op andere spelers?')
    .setRequired(false);

  // ============================================================
  // SECTIE 8: Educatieve waarde
  // ============================================================
  form.addSectionHeaderItem()
    .setTitle('Educatieve waarde')
    .setHelpText('Over wat je geleerd hebt over filosofie.');

  form.addScaleItem()
    .setTitle('Heb je iets geleerd over filosofen of filosofische stromingen door het spel?')
    .setBounds(1, 5)
    .setLabels('Nee, niks', 'Ja, veel!')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Welke filosoof of stroming onthoud je van het spel?')
    .setRequired(false);

  // ============================================================
  // SECTIE 9: Eindscore & afsluiting
  // ============================================================
  form.addSectionHeaderItem()
    .setTitle('Eindscore & afsluiting');

  form.addScaleItem()
    .setTitle('Totaalscore: Hoe beoordeel je De Academie als geheel?')
    .setBounds(1, 10)
    .setLabels('Slecht', 'Geweldig')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Zou je het spel nog een keer willen spelen?')
    .setChoiceValues([
      'Ja, zeker!',
      'Misschien, als het verbeterd wordt',
      'Nee, niet echt'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Wat is het BESTE aan het spel?')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Wat zou je als EERSTE veranderen?')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Overige opmerkingen of suggesties')
    .setHelpText('Alles wat je nog kwijt wilt!')
    .setRequired(false);

  // ============================================================
  // LOG
  // ============================================================
  Logger.log('Formulier aangemaakt!');
  Logger.log('URL: ' + form.getEditUrl());
  Logger.log('Invul-URL: ' + form.getPublishedUrl());

  // Toon een popup met de URL
  var ui = SpreadsheetApp.getUi ? SpreadsheetApp.getUi() : null;
  if (ui) {
    ui.alert('Formulier aangemaakt!\n\n' + form.getPublishedUrl());
  }
}
