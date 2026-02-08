/**
 * Evaluatiesysteem voor de output van de Gemini-app.
 * Beoordeelt of de app geschikt feedback geeft aan leerlingen
 * van verschillende niveaus.
 */

const evaluationCriteria = {
  // Past de app zijn feedback aan op het niveau van de leerling?
  niveauAanpassing: {
    naam: 'Niveau-aanpassing',
    beschrijving: 'Past de app de feedback aan op het schrijfniveau van de leerling?',
    gewicht: 3,
  },
  // Geeft de app constructieve feedback?
  constructieveFeedback: {
    naam: 'Constructieve feedback',
    beschrijving: 'Geeft de app bruikbare, constructieve feedback?',
    gewicht: 3,
  },
  // Gaat de app in op de inhoud van de argumentatie?
  inhoudelijkeFeedback: {
    naam: 'Inhoudelijke feedback',
    beschrijving: 'Gaat de app in op de specifieke inhoud en argumenten van de leerling?',
    gewicht: 2,
  },
  // Is de toon bemoedigend en passend?
  toon: {
    naam: 'Toon en benadering',
    beschrijving: 'Is de toon bemoedigend, respectvol en passend voor de leeftijdsgroep?',
    gewicht: 2,
  },
  // Geeft de app concrete verbeterpunten?
  verbeterpunten: {
    naam: 'Concrete verbeterpunten',
    beschrijving: 'Geeft de app specifieke, actionable verbeterpunten?',
    gewicht: 2,
  },
  // Is het antwoord in correct Nederlands?
  taalCorrectheit: {
    naam: 'Taalcorrectheit',
    beschrijving: 'Is het antwoord van de app in correct Nederlands?',
    gewicht: 1,
  },
  // Wordt er aandacht besteed aan argumentatiestructuur?
  argumentatieStructuur: {
    naam: 'Aandacht voor argumentatiestructuur',
    beschrijving: 'Helpt de app de leerling met het structureren van argumenten?',
    gewicht: 2,
  },
  // Is het antwoord niet te lang of te kort?
  antwoordLengte: {
    naam: 'Passende antwoordlengte',
    beschrijving: 'Is het antwoord een passende lengte (niet overweldigend, niet te kort)?',
    gewicht: 1,
  },
};

/**
 * Evalueer het antwoord van de Gemini-app voor een specifieke leerling.
 * Dit is een heuristische evaluatie op basis van tekstanalyse.
 */
function evaluateResponse(student, response) {
  if (!response) {
    return {
      student: student.naam,
      score: 0,
      maxScore: 0,
      percentage: 0,
      details: {},
      samenvatting: 'Geen antwoord ontvangen van de app.',
    };
  }

  const details = {};
  let totalScore = 0;
  let maxScore = 0;

  // 1. Antwoordlengte check
  const wordCount = response.split(/\s+/).length;
  const lengteScore = evaluateLength(wordCount, student);
  details.antwoordLengte = {
    ...evaluationCriteria.antwoordLengte,
    score: lengteScore,
    maxScore: 5,
    opmerking: `${wordCount} woorden`,
  };
  totalScore += lengteScore * evaluationCriteria.antwoordLengte.gewicht;
  maxScore += 5 * evaluationCriteria.antwoordLengte.gewicht;

  // 2. Taalcorrectheit (basis check - Nederlands?)
  const taalScore = evaluateLanguage(response);
  details.taalCorrectheit = {
    ...evaluationCriteria.taalCorrectheit,
    score: taalScore,
    maxScore: 5,
    opmerking: taalScore >= 4 ? 'Antwoord is in het Nederlands' : 'Antwoord lijkt niet (volledig) Nederlands',
  };
  totalScore += taalScore * evaluationCriteria.taalCorrectheit.gewicht;
  maxScore += 5 * evaluationCriteria.taalCorrectheit.gewicht;

  // 3. Constructieve feedback check
  const constructiefScore = evaluateConstructiveness(response);
  details.constructieveFeedback = {
    ...evaluationCriteria.constructieveFeedback,
    score: constructiefScore.score,
    maxScore: 5,
    opmerking: constructiefScore.opmerking,
  };
  totalScore += constructiefScore.score * evaluationCriteria.constructieveFeedback.gewicht;
  maxScore += 5 * evaluationCriteria.constructieveFeedback.gewicht;

  // 4. Inhoudelijke feedback
  const inhoudScore = evaluateContentRelevance(response, student);
  details.inhoudelijkeFeedback = {
    ...evaluationCriteria.inhoudelijkeFeedback,
    score: inhoudScore.score,
    maxScore: 5,
    opmerking: inhoudScore.opmerking,
  };
  totalScore += inhoudScore.score * evaluationCriteria.inhoudelijkeFeedback.gewicht;
  maxScore += 5 * evaluationCriteria.inhoudelijkeFeedback.gewicht;

  // 5. Toon check
  const toonScore = evaluateTone(response);
  details.toon = {
    ...evaluationCriteria.toon,
    score: toonScore.score,
    maxScore: 5,
    opmerking: toonScore.opmerking,
  };
  totalScore += toonScore.score * evaluationCriteria.toon.gewicht;
  maxScore += 5 * evaluationCriteria.toon.gewicht;

  // 6. Verbeterpunten
  const verbeterScore = evaluateImprovementPoints(response);
  details.verbeterpunten = {
    ...evaluationCriteria.verbeterpunten,
    score: verbeterScore.score,
    maxScore: 5,
    opmerking: verbeterScore.opmerking,
  };
  totalScore += verbeterScore.score * evaluationCriteria.verbeterpunten.gewicht;
  maxScore += 5 * evaluationCriteria.verbeterpunten.gewicht;

  // 7. Argumentatiestructuur
  const structuurScore = evaluateArgumentStructure(response);
  details.argumentatieStructuur = {
    ...evaluationCriteria.argumentatieStructuur,
    score: structuurScore.score,
    maxScore: 5,
    opmerking: structuurScore.opmerking,
  };
  totalScore += structuurScore.score * evaluationCriteria.argumentatieStructuur.gewicht;
  maxScore += 5 * evaluationCriteria.argumentatieStructuur.gewicht;

  const percentage = Math.round((totalScore / maxScore) * 100);

  return {
    student: student.naam,
    klas: student.klas,
    leeftijd: student.leeftijd,
    score: totalScore,
    maxScore,
    percentage,
    beoordeling: getOverallRating(percentage),
    details,
    samenvatting: generateSummary(student, details, percentage),
  };
}

// --- Hulpfuncties voor evaluatie ---

function evaluateLength(wordCount, student) {
  // Ideale lengte hangt af van het niveau
  const isLagerNiveau = student.klas.includes('vmbo') || student.leeftijd <= 14;
  const idealMin = isLagerNiveau ? 100 : 150;
  const idealMax = isLagerNiveau ? 300 : 500;

  if (wordCount >= idealMin && wordCount <= idealMax) return 5;
  if (wordCount >= idealMin * 0.7 && wordCount <= idealMax * 1.3) return 4;
  if (wordCount >= 50 && wordCount <= 700) return 3;
  if (wordCount >= 20) return 2;
  return 1;
}

function evaluateLanguage(response) {
  const dutchWords = [
    'de', 'het', 'een', 'van', 'en', 'is', 'dat', 'voor', 'met', 'zijn',
    'maar', 'ook', 'niet', 'nog', 'wel', 'kan', 'zou', 'omdat', 'deze',
    'goed', 'feedback', 'argumentatie', 'punt', 'verbeteren',
  ];
  const words = response.toLowerCase().split(/\s+/);
  const dutchCount = words.filter(w => dutchWords.includes(w)).length;
  const ratio = dutchCount / words.length;

  if (ratio > 0.15) return 5;
  if (ratio > 0.10) return 4;
  if (ratio > 0.05) return 3;
  return 1;
}

function evaluateConstructiveness(response) {
  const lower = response.toLowerCase();
  const positiveIndicators = [
    'goed', 'sterk', 'mooi', 'prima', 'knap', 'helder', 'duidelijk',
    'interessant', 'goed bezig', 'goede start', 'sterk punt',
  ];
  const improvementIndicators = [
    'tip', 'verbeter', 'probeer', 'zou je kunnen', 'overweeg',
    'denk na over', 'voeg toe', 'misschien', 'suggestie',
    'let op', 'aandachtspunt', 'werk aan',
  ];

  const hasPositive = positiveIndicators.some(w => lower.includes(w));
  const hasImprovement = improvementIndicators.some(w => lower.includes(w));

  if (hasPositive && hasImprovement) {
    return { score: 5, opmerking: 'Bevat zowel positieve feedback als verbeterpunten' };
  }
  if (hasPositive || hasImprovement) {
    return { score: 3, opmerking: hasPositive ? 'Alleen positief, mist verbeterpunten' : 'Alleen verbeterpunten, mist positieve feedback' };
  }
  return { score: 1, opmerking: 'Geen duidelijke constructieve feedback gevonden' };
}

function evaluateContentRelevance(response, student) {
  const lower = response.toLowerCase();
  const inputWords = student.input.toLowerCase().split(/\s+/)
    .filter(w => w.length > 4)
    .filter(w => !['denk', 'vind', 'omdat', 'wordt', 'waren', 'heeft', 'wordt'].includes(w));

  const uniqueInputWords = [...new Set(inputWords)];
  const referencedWords = uniqueInputWords.filter(w => lower.includes(w));
  const ratio = referencedWords.length / Math.max(uniqueInputWords.length, 1);

  if (ratio > 0.4) return { score: 5, opmerking: `Gaat in op specifieke inhoud (${referencedWords.length} inhoudelijke woorden teruggevonden)` };
  if (ratio > 0.25) return { score: 4, opmerking: 'Verwijst naar de meeste inhoudelijke punten' };
  if (ratio > 0.15) return { score: 3, opmerking: 'Verwijst naar enkele inhoudelijke punten' };
  if (ratio > 0.05) return { score: 2, opmerking: 'Beperkte inhoudelijke verwijzingen' };
  return { score: 1, opmerking: 'Gaat nauwelijks in op de specifieke inhoud' };
}

function evaluateTone(response) {
  const lower = response.toLowerCase();
  const encouragingWords = [
    'goed', 'mooi', 'knap', 'fijn', 'prima', 'sterk',
    'interessant', 'origineel', 'dapper', 'slim', 'creatief',
  ];
  const harshWords = [
    'fout', 'slecht', 'verkeerd', 'onzin', 'dom', 'belachelijk',
    'waardeloos', 'zwak', 'onvoldoende',
  ];

  const encouragingCount = encouragingWords.filter(w => lower.includes(w)).length;
  const harshCount = harshWords.filter(w => lower.includes(w)).length;

  if (encouragingCount >= 2 && harshCount === 0) {
    return { score: 5, opmerking: 'Bemoedigende, respectvolle toon' };
  }
  if (encouragingCount >= 1 && harshCount === 0) {
    return { score: 4, opmerking: 'Over het algemeen positieve toon' };
  }
  if (harshCount > 0) {
    return { score: 2, opmerking: `Bevat mogelijk harde bewoordingen (${harshCount} gevonden)` };
  }
  return { score: 3, opmerking: 'Neutrale toon' };
}

function evaluateImprovementPoints(response) {
  // Zoek naar genummerde lijsten of opsommingen
  const hasNumberedList = /\d+[\.\)]\s/.test(response);
  const hasBullets = /[•\-\*]\s/.test(response);
  const hasStructuredFeedback = hasNumberedList || hasBullets;

  const lower = response.toLowerCase();
  const actionWords = ['probeer', 'voeg toe', 'gebruik', 'denk na', 'overweeg', 'zorg dat', 'let op'];
  const actionCount = actionWords.filter(w => lower.includes(w)).length;

  if (hasStructuredFeedback && actionCount >= 2) {
    return { score: 5, opmerking: `Gestructureerde verbeterpunten met ${actionCount} concrete acties` };
  }
  if (hasStructuredFeedback || actionCount >= 2) {
    return { score: 4, opmerking: 'Verbeterpunten aanwezig maar niet volledig gestructureerd' };
  }
  if (actionCount >= 1) {
    return { score: 3, opmerking: 'Enkele verbeterpunten gevonden' };
  }
  return { score: 1, opmerking: 'Geen concrete verbeterpunten gevonden' };
}

function evaluateArgumentStructure(response) {
  const lower = response.toLowerCase();
  const structureWords = [
    'stelling', 'argument', 'onderbouwing', 'conclusie', 'inleiding',
    'standpunt', 'bewijs', 'voorbeeld', 'structuur', 'opbouw',
    'these', 'antithese', 'weerlegging', 'tegenargument',
  ];

  const count = structureWords.filter(w => lower.includes(w)).length;

  if (count >= 4) return { score: 5, opmerking: `Uitgebreide aandacht voor argumentatiestructuur (${count} termen)` };
  if (count >= 2) return { score: 4, opmerking: 'Aandacht voor argumentatiestructuur' };
  if (count >= 1) return { score: 3, opmerking: 'Beperkte aandacht voor argumentatiestructuur' };
  return { score: 1, opmerking: 'Geen aandacht voor argumentatiestructuur' };
}

function getOverallRating(percentage) {
  if (percentage >= 85) return 'Uitstekend';
  if (percentage >= 70) return 'Goed';
  if (percentage >= 55) return 'Voldoende';
  if (percentage >= 40) return 'Matig';
  return 'Onvoldoende';
}

function generateSummary(student, details, percentage) {
  const strengths = [];
  const weaknesses = [];

  for (const [key, detail] of Object.entries(details)) {
    if (detail.score >= 4) {
      strengths.push(detail.naam);
    } else if (detail.score <= 2) {
      weaknesses.push(detail.naam);
    }
  }

  let summary = `De app scoort ${percentage}% voor leerling ${student.naam} (${student.klas}).`;
  if (strengths.length > 0) {
    summary += ` Sterke punten: ${strengths.join(', ')}.`;
  }
  if (weaknesses.length > 0) {
    summary += ` Verbeterpunten: ${weaknesses.join(', ')}.`;
  }
  return summary;
}

module.exports = { evaluateResponse, evaluationCriteria };
