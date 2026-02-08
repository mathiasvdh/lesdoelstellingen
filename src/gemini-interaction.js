const { chromium } = require('playwright');
const { createAuthenticatedContext } = require('./gemini-auth');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

/**
 * Interacteer met de Gemini-app als een specifieke leerling.
 * Opent de gedeelde link, wacht tot de app geladen is,
 * voert de leerlinginput in en vangt het antwoord op.
 */
async function interactAsStudent(student, geminiUrl, options = {}) {
  const { headless = false, slowMo = 100, timeout = 60000 } = options;

  const browser = await chromium.launch({ headless, slowMo });
  const context = await createAuthenticatedContext(browser);
  const page = await context.newPage();

  const result = {
    student: student.naam,
    leeftijd: student.leeftijd,
    klas: student.klas,
    input: student.input,
    output: null,
    screenshots: [],
    success: false,
    error: null,
    startTime: new Date().toISOString(),
    endTime: null,
    duration: null,
  };

  const startMs = Date.now();

  try {
    // Maak screenshots directory
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    const studentDir = path.join(SCREENSHOTS_DIR, `student-${student.id}`);
    if (!fs.existsSync(studentDir)) {
      fs.mkdirSync(studentDir, { recursive: true });
    }

    // 1. Open de Gemini gedeelde link
    console.log(`[${student.naam}] Gemini openen...`);
    await page.goto(geminiUrl, { waitUntil: 'networkidle', timeout });
    await page.waitForTimeout(3000);

    // Screenshot van de startpagina
    const startScreenshot = path.join(studentDir, '01-start.png');
    await page.screenshot({ path: startScreenshot, fullPage: true });
    result.screenshots.push(startScreenshot);

    // 2. Zoek het invoerveld van Gemini
    // Gemini gebruikt verschillende selectors; we proberen meerdere
    console.log(`[${student.naam}] Invoerveld zoeken...`);
    const inputSelectors = [
      'div[contenteditable="true"]',
      'textarea',
      '.ql-editor',
      '[data-placeholder]',
      'rich-textarea .textarea',
      '.input-area textarea',
      '.text-input-field',
    ];

    let inputElement = null;
    for (const selector of inputSelectors) {
      try {
        inputElement = await page.waitForSelector(selector, { timeout: 5000 });
        if (inputElement) {
          console.log(`[${student.naam}] Invoerveld gevonden: ${selector}`);
          break;
        }
      } catch {
        // Probeer de volgende selector
      }
    }

    if (!inputElement) {
      // Probeer klik op het midden van de pagina en zoek opnieuw
      console.log(`[${student.naam}] Invoerveld niet direct gevonden, probeer interactie...`);
      await page.click('body');
      await page.waitForTimeout(2000);

      for (const selector of inputSelectors) {
        try {
          inputElement = await page.waitForSelector(selector, { timeout: 3000 });
          if (inputElement) break;
        } catch {
          // Volgende
        }
      }
    }

    if (!inputElement) {
      throw new Error('Kan het invoerveld van Gemini niet vinden');
    }

    // 3. Voer de leerling-input in
    console.log(`[${student.naam}] Argumentatie invoeren...`);
    await inputElement.click();
    await page.waitForTimeout(500);

    // Type de tekst langzaam voor realisme
    await inputElement.fill(student.input);
    await page.waitForTimeout(1000);

    // Screenshot van de ingevulde input
    const inputScreenshot = path.join(studentDir, '02-input.png');
    await page.screenshot({ path: inputScreenshot, fullPage: true });
    result.screenshots.push(inputScreenshot);

    // 4. Verstuur het bericht
    console.log(`[${student.naam}] Bericht versturen...`);
    const sendSelectors = [
      'button[aria-label="Send message"]',
      'button[aria-label="Bericht verzenden"]',
      'button.send-button',
      '[data-mat-icon-name="send"]',
      'button mat-icon',
      '.send-button-container button',
    ];

    let sent = false;
    for (const selector of sendSelectors) {
      try {
        const btn = await page.$(selector);
        if (btn) {
          await btn.click();
          sent = true;
          console.log(`[${student.naam}] Verstuurd via: ${selector}`);
          break;
        }
      } catch {
        // Probeer volgende
      }
    }

    // Fallback: Enter toets
    if (!sent) {
      console.log(`[${student.naam}] Enter toets als fallback...`);
      await page.keyboard.press('Enter');
    }

    // 5. Wacht op het antwoord van Gemini
    console.log(`[${student.naam}] Wachten op antwoord...`);
    await page.waitForTimeout(5000); // Gemini heeft even nodig

    // Wacht tot het antwoord volledig is (geen loading indicator meer)
    const loadingSelectors = [
      '.loading-indicator',
      '.thinking-indicator',
      '[data-loading="true"]',
      '.response-streaming',
    ];

    for (const sel of loadingSelectors) {
      try {
        await page.waitForSelector(sel, { state: 'hidden', timeout: 45000 });
      } catch {
        // Geen loading indicator gevonden met deze selector
      }
    }

    // Extra wachttijd voor volledig antwoord
    await page.waitForTimeout(5000);

    // 6. Vang het antwoord op
    console.log(`[${student.naam}] Antwoord ophalen...`);
    const responseSelectors = [
      '.model-response-text',
      '.response-content',
      '.markdown-content',
      'message-content',
      '.message-body',
      '[data-message-author-role="model"]',
      '.conversation-turn:last-child .text-message',
    ];

    let responseText = null;
    for (const selector of responseSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          // Neem het laatste element (meest recente antwoord)
          const lastElement = elements[elements.length - 1];
          responseText = await lastElement.textContent();
          if (responseText && responseText.trim().length > 0) {
            console.log(`[${student.naam}] Antwoord gevonden via: ${selector}`);
            break;
          }
        }
      } catch {
        // Probeer volgende selector
      }
    }

    // Fallback: pak alle tekst van de laatste response container
    if (!responseText) {
      try {
        responseText = await page.evaluate(() => {
          const turns = document.querySelectorAll('[class*="response"], [class*="message"], [class*="turn"]');
          if (turns.length > 0) {
            return turns[turns.length - 1].textContent;
          }
          return null;
        });
      } catch {
        // Evaluatie mislukt
      }
    }

    if (!responseText) {
      // Laatste fallback: maak screenshot en meld het
      const errorScreenshot = path.join(studentDir, '03-no-response.png');
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      result.screenshots.push(errorScreenshot);
      throw new Error('Kan het antwoord van Gemini niet ophalen - zie screenshot');
    }

    // Screenshot van het antwoord
    const responseScreenshot = path.join(studentDir, '03-response.png');
    await page.screenshot({ path: responseScreenshot, fullPage: true });
    result.screenshots.push(responseScreenshot);

    result.output = responseText.trim();
    result.success = true;
    console.log(`[${student.naam}] ✓ Test succesvol afgerond`);

  } catch (error) {
    result.error = error.message;
    console.error(`[${student.naam}] ✗ Fout:`, error.message);

    // Error screenshot
    try {
      const errorScreenshot = path.join(SCREENSHOTS_DIR, `student-${student.id}`, 'error.png');
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      result.screenshots.push(errorScreenshot);
    } catch {
      // Kon geen screenshot maken
    }
  } finally {
    result.endTime = new Date().toISOString();
    result.duration = Date.now() - startMs;
    await browser.close();
  }

  return result;
}

module.exports = { interactAsStudent };
