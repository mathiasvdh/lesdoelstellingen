require('dotenv').config();
const { students } = require('./students');
const { loginToGoogle, hasValidSession } = require('./gemini-auth');
const { interactAsStudent } = require('./gemini-interaction');
const { evaluateResponse } = require('./evaluator');
const { generateReport } = require('./reporter');
const path = require('path');

const GEMINI_URL = process.env.GEMINI_SHARE_URL || 'https://gemini.google.com/share/ac85d426f6ed';
const REPORT_DIR = process.env.REPORT_DIR || path.join(__dirname, '..', 'reports');

async function run() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  Gemini Argumentatie-App Testing Agent                  ║');
  console.log('║  10 leerlingprofielen | Argumentatie over 2025          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  const options = {
    headless: process.env.HEADLESS === 'true',
    slowMo: parseInt(process.env.SLOW_MO || '100'),
  };

  // Stap 1: Authenticatie
  console.log('📋 Stap 1: Authenticatie controleren...');
  if (!hasValidSession()) {
    const email = process.env.GOOGLE_EMAIL;
    const password = process.env.GOOGLE_PASSWORD;

    if (!email || !password) {
      console.error('✗ Geen Google credentials gevonden.');
      console.error('  Maak een .env bestand aan op basis van .env.example');
      console.error('  Of voer eerst uit: npm run login');
      process.exit(1);
    }

    console.log('  Inloggen op Google...');
    await loginToGoogle(email, password, options);
    console.log('  ✓ Ingelogd');
  } else {
    console.log('  ✓ Bestaande sessie gevonden');
  }

  // Stap 2: Tests uitvoeren per leerling
  console.log('');
  console.log('📋 Stap 2: Tests uitvoeren voor 10 leerlingen...');
  console.log('');

  const testResults = [];
  const evaluations = [];

  for (const student of students) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`▸ Test ${student.id}/10: ${student.naam} (${student.klas}, ${student.leeftijd} jaar)`);
    console.log(`  Profiel: ${student.profiel}`);
    console.log(`${'─'.repeat(50)}`);

    try {
      // Interacteer met Gemini als deze leerling
      const result = await interactAsStudent(student, GEMINI_URL, options);
      testResults.push(result);

      if (result.success && result.output) {
        // Evalueer het antwoord
        const evaluation = evaluateResponse(student, result.output);
        evaluations.push(evaluation);

        console.log(`  Score: ${evaluation.percentage}% - ${evaluation.beoordeling}`);
        console.log(`  ${evaluation.samenvatting}`);
      } else {
        console.log(`  ⚠️  Geen output ontvangen: ${result.error || 'Onbekende fout'}`);
        evaluations.push({
          student: student.naam,
          klas: student.klas,
          leeftijd: student.leeftijd,
          percentage: 0,
          beoordeling: 'Niet getest',
          details: {},
          samenvatting: `Test mislukt: ${result.error || 'Geen output'}`,
        });
      }
    } catch (error) {
      console.error(`  ✗ Test mislukt: ${error.message}`);
      testResults.push({
        student: student.naam,
        success: false,
        error: error.message,
      });
      evaluations.push({
        student: student.naam,
        klas: student.klas,
        leeftijd: student.leeftijd,
        percentage: 0,
        beoordeling: 'Fout',
        details: {},
        samenvatting: `Fout tijdens test: ${error.message}`,
      });
    }

    // Wacht even tussen tests om rate limiting te voorkomen
    console.log('  ⏳ Wachten voor volgende test...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Stap 3: Rapport genereren
  console.log('\n');
  console.log('📋 Stap 3: Rapport genereren...');
  const reportPaths = generateReport(evaluations, testResults, REPORT_DIR);

  // Samenvatting printen
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  SAMENVATTING                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const successCount = testResults.filter(r => r.success).length;
  const avgScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((sum, e) => sum + e.percentage, 0) / evaluations.length)
    : 0;

  console.log(`  Geslaagde tests:    ${successCount}/${students.length}`);
  console.log(`  Gemiddelde score:   ${avgScore}%`);
  console.log('');
  console.log('  Scores per leerling:');
  for (const ev of evaluations) {
    const bar = '█'.repeat(Math.round(ev.percentage / 10)) + '░'.repeat(10 - Math.round(ev.percentage / 10));
    console.log(`    ${ev.student.padEnd(22)} ${bar} ${ev.percentage}% (${ev.beoordeling})`);
  }
  console.log('');
  console.log(`  📄 Rapport: ${reportPaths.htmlPath}`);
  console.log('');
}

// Login-only modus
async function loginOnly() {
  const email = process.env.GOOGLE_EMAIL;
  const password = process.env.GOOGLE_PASSWORD;

  if (!email || !password) {
    console.error('Stel GOOGLE_EMAIL en GOOGLE_PASSWORD in via .env bestand');
    process.exit(1);
  }

  await loginToGoogle(email, password, { headless: false, slowMo: 50 });
  console.log('✓ Login succesvol. Sessie opgeslagen.');
}

// CLI
const command = process.argv[2];
if (command === 'login') {
  loginOnly().catch(console.error);
} else {
  run().catch(console.error);
}
