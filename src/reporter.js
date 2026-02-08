const fs = require('fs');
const path = require('path');

/**
 * Genereer een uitgebreid rapport van alle testresultaten.
 */
function generateReport(evaluations, testResults, reportDir) {
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // 1. JSON rapport (ruwe data)
  const jsonPath = path.join(reportDir, `rapport-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({ evaluations, testResults }, null, 2));

  // 2. Leesbaar tekstrapport
  const textReport = generateTextReport(evaluations, testResults);
  const textPath = path.join(reportDir, `rapport-${timestamp}.txt`);
  fs.writeFileSync(textPath, textReport);

  // 3. HTML rapport
  const htmlReport = generateHtmlReport(evaluations, testResults);
  const htmlPath = path.join(reportDir, `rapport-${timestamp}.html`);
  fs.writeFileSync(htmlPath, htmlReport);

  console.log(`\n📊 Rapporten gegenereerd:`);
  console.log(`   JSON: ${jsonPath}`);
  console.log(`   Tekst: ${textPath}`);
  console.log(`   HTML:  ${htmlPath}`);

  return { jsonPath, textPath, htmlPath };
}

function generateTextReport(evaluations, testResults) {
  const lines = [];
  const divider = '═'.repeat(70);
  const subDivider = '─'.repeat(70);

  lines.push(divider);
  lines.push('  TESTRAPPORT - GEMINI ARGUMENTATIE-APP');
  lines.push(`  Datum: ${new Date().toLocaleString('nl-NL')}`);
  lines.push(`  Aantal leerlingen getest: ${evaluations.length}`);
  lines.push(divider);
  lines.push('');

  // Samenvatting
  const avgScore = evaluations.reduce((sum, e) => sum + e.percentage, 0) / evaluations.length;
  const successCount = testResults.filter(r => r.success).length;

  lines.push('SAMENVATTING');
  lines.push(subDivider);
  lines.push(`Gemiddelde score:       ${Math.round(avgScore)}%`);
  lines.push(`Geslaagde tests:        ${successCount}/${testResults.length}`);
  lines.push(`Algemene beoordeling:   ${getOverallVerdict(avgScore)}`);
  lines.push('');

  // Score-overzicht tabel
  lines.push('SCORES PER LEERLING');
  lines.push(subDivider);
  lines.push(padRight('Naam', 25) + padRight('Klas', 12) + padRight('Score', 10) + 'Beoordeling');
  lines.push('─'.repeat(60));

  for (const ev of evaluations) {
    lines.push(
      padRight(ev.student, 25) +
      padRight(ev.klas, 12) +
      padRight(`${ev.percentage}%`, 10) +
      ev.beoordeling
    );
  }
  lines.push('');

  // Gedetailleerde resultaten per leerling
  lines.push('GEDETAILLEERDE RESULTATEN');
  lines.push(divider);

  for (const ev of evaluations) {
    lines.push('');
    lines.push(`▸ ${ev.student} (${ev.klas}, ${ev.leeftijd} jaar)`);
    lines.push(subDivider);
    lines.push(`  Totaalscore: ${ev.percentage}% - ${ev.beoordeling}`);
    lines.push('');

    for (const [key, detail] of Object.entries(ev.details)) {
      const bar = createBar(detail.score, detail.maxScore);
      lines.push(`  ${padRight(detail.naam, 35)} ${bar} ${detail.score}/${detail.maxScore}`);
      lines.push(`    ${detail.opmerking}`);
    }

    lines.push('');
    lines.push(`  Samenvatting: ${ev.samenvatting}`);
    lines.push('');
  }

  // Aanbevelingen
  lines.push(divider);
  lines.push('AANBEVELINGEN VOOR DE APP');
  lines.push(subDivider);
  const recommendations = generateRecommendations(evaluations);
  recommendations.forEach((rec, i) => {
    lines.push(`${i + 1}. ${rec}`);
  });
  lines.push('');
  lines.push(divider);

  return lines.join('\n');
}

function generateHtmlReport(evaluations, testResults) {
  const avgScore = evaluations.reduce((sum, e) => sum + e.percentage, 0) / evaluations.length;
  const successCount = testResults.filter(r => r.success).length;

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Testrapport - Gemini Argumentatie-App</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; }
    .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #1a73e8, #4285f4); color: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; }
    header h1 { font-size: 1.8em; margin-bottom: 5px; }
    header p { opacity: 0.9; }
    .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
    .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .card h3 { color: #666; font-size: 0.85em; text-transform: uppercase; margin-bottom: 5px; }
    .card .value { font-size: 2em; font-weight: bold; color: #1a73e8; }
    .card .value.good { color: #34a853; }
    .card .value.warning { color: #fbbc04; }
    .card .value.bad { color: #ea4335; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e0e0e0; }
    th { background: #f8f9fa; font-weight: 600; color: #555; }
    tr:hover { background: #f8f9fa; }
    .score-bar { width: 100px; height: 8px; background: #e0e0e0; border-radius: 4px; display: inline-block; vertical-align: middle; }
    .score-bar-fill { height: 100%; border-radius: 4px; }
    .score-bar-fill.excellent { background: #34a853; }
    .score-bar-fill.good { background: #4285f4; }
    .score-bar-fill.fair { background: #fbbc04; }
    .score-bar-fill.poor { background: #ea4335; }
    .student-detail { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 15px; }
    .student-detail h3 { color: #1a73e8; margin-bottom: 10px; }
    .student-detail .meta { color: #666; font-size: 0.9em; margin-bottom: 15px; }
    .criteria-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .criteria-name { flex: 1; font-weight: 500; }
    .criteria-bar { width: 120px; margin: 0 15px; }
    .criteria-score { width: 50px; text-align: right; font-weight: 600; }
    .criteria-note { font-size: 0.85em; color: #666; padding: 2px 0 8px 0; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.8em; font-weight: 600; }
    .badge.excellent { background: #e6f4ea; color: #34a853; }
    .badge.good { background: #e8f0fe; color: #1a73e8; }
    .badge.fair { background: #fef7e0; color: #e37400; }
    .badge.poor { background: #fce8e6; color: #ea4335; }
    .recommendations { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .recommendations h2 { color: #1a73e8; margin-bottom: 15px; }
    .recommendations ol { padding-left: 20px; }
    .recommendations li { padding: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Testrapport - Gemini Argumentatie-App</h1>
      <p>Datum: ${new Date().toLocaleString('nl-NL')} | ${evaluations.length} leerlingen getest</p>
    </header>

    <div class="summary-cards">
      <div class="card">
        <h3>Gemiddelde Score</h3>
        <div class="value ${avgScore >= 70 ? 'good' : avgScore >= 50 ? 'warning' : 'bad'}">${Math.round(avgScore)}%</div>
      </div>
      <div class="card">
        <h3>Geslaagde Tests</h3>
        <div class="value">${successCount}/${testResults.length}</div>
      </div>
      <div class="card">
        <h3>Algemeen Oordeel</h3>
        <div class="value ${avgScore >= 70 ? 'good' : avgScore >= 50 ? 'warning' : 'bad'}">${getOverallVerdict(avgScore)}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <h2 style="margin-bottom: 15px;">Scores Overzicht</h2>
      <table>
        <thead>
          <tr>
            <th>Leerling</th>
            <th>Klas</th>
            <th>Leeftijd</th>
            <th>Score</th>
            <th>Beoordeling</th>
          </tr>
        </thead>
        <tbody>
          ${evaluations.map(ev => `
          <tr>
            <td><strong>${ev.student}</strong></td>
            <td>${ev.klas}</td>
            <td>${ev.leeftijd} jaar</td>
            <td>
              <div class="score-bar">
                <div class="score-bar-fill ${getScoreClass(ev.percentage)}" style="width: ${ev.percentage}%"></div>
              </div>
              ${ev.percentage}%
            </td>
            <td><span class="badge ${getScoreClass(ev.percentage)}">${ev.beoordeling}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <h2 style="margin-bottom: 15px;">Gedetailleerde Resultaten</h2>
    ${evaluations.map(ev => `
    <div class="student-detail">
      <h3>${ev.student}</h3>
      <div class="meta">${ev.klas} | ${ev.leeftijd} jaar | Score: ${ev.percentage}% - <span class="badge ${getScoreClass(ev.percentage)}">${ev.beoordeling}</span></div>
      ${Object.entries(ev.details).map(([key, detail]) => `
      <div class="criteria-row">
        <span class="criteria-name">${detail.naam}</span>
        <div class="criteria-bar">
          <div class="score-bar" style="width: 100%;">
            <div class="score-bar-fill ${getScoreClass(detail.score / detail.maxScore * 100)}" style="width: ${detail.score / detail.maxScore * 100}%"></div>
          </div>
        </div>
        <span class="criteria-score">${detail.score}/${detail.maxScore}</span>
      </div>
      <div class="criteria-note">${detail.opmerking}</div>
      `).join('')}
      <p style="margin-top: 10px; font-style: italic; color: #555;">${ev.samenvatting}</p>
    </div>`).join('')}

    <div class="recommendations">
      <h2>Aanbevelingen voor de App</h2>
      <ol>
        ${generateRecommendations(evaluations).map(rec => `<li>${rec}</li>`).join('')}
      </ol>
    </div>
  </div>
</body>
</html>`;
}

// --- Hulpfuncties ---

function padRight(str, len) {
  return str.padEnd(len);
}

function createBar(score, max) {
  const filled = Math.round((score / max) * 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

function getScoreClass(percentage) {
  if (percentage >= 80) return 'excellent';
  if (percentage >= 65) return 'good';
  if (percentage >= 45) return 'fair';
  return 'poor';
}

function getOverallVerdict(avgScore) {
  if (avgScore >= 80) return 'Uitstekend';
  if (avgScore >= 65) return 'Goed';
  if (avgScore >= 50) return 'Voldoende';
  if (avgScore >= 35) return 'Matig';
  return 'Onvoldoende';
}

function generateRecommendations(evaluations) {
  const recommendations = [];
  const avgScores = {};

  // Bereken gemiddelde scores per criterium
  for (const ev of evaluations) {
    for (const [key, detail] of Object.entries(ev.details)) {
      if (!avgScores[key]) {
        avgScores[key] = { naam: detail.naam, scores: [] };
      }
      avgScores[key].scores.push(detail.score / detail.maxScore);
    }
  }

  for (const [key, data] of Object.entries(avgScores)) {
    const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    if (avg < 0.6) {
      switch (key) {
        case 'niveauAanpassing':
          recommendations.push('De app zou beter moeten differentiëren op basis van het schrijfniveau van de leerling. Een vmbo-leerling heeft ander feedback nodig dan een vwo-leerling.');
          break;
        case 'constructieveFeedback':
          recommendations.push('Voeg meer constructieve feedback toe: combineer altijd positieve punten met verbeterpunten (sandwich-methode).');
          break;
        case 'inhoudelijkeFeedback':
          recommendations.push('De app zou specifieker moeten ingaan op de inhoud van de argumentatie, niet alleen op de vorm.');
          break;
        case 'toon':
          recommendations.push('Pas de toon aan om bemoedigender te zijn, vooral voor jongere leerlingen.');
          break;
        case 'verbeterpunten':
          recommendations.push('Geef concretere, gestructureerde verbeterpunten (bijv. genummerde lijst met specifieke acties).');
          break;
        case 'taalCorrectheit':
          recommendations.push('Zorg dat het antwoord volledig in correct Nederlands is.');
          break;
        case 'argumentatieStructuur':
          recommendations.push('Besteed meer aandacht aan argumentatiestructuur: benoem expliciet stelling, argumenten, onderbouwing en conclusie.');
          break;
        case 'antwoordLengte':
          recommendations.push('Pas de lengte van het antwoord aan op het niveau: korter en concreter voor vmbo, uitgebreider voor vwo.');
          break;
      }
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('De app presteert over het algemeen goed. Blijf monitoren met verschillende leerlingprofielen.');
  }

  return recommendations;
}

module.exports = { generateReport };
