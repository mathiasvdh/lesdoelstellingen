const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const AUTH_STATE_PATH = path.join(__dirname, '..', 'auth-state');

/**
 * Log in op Google en sla de sessie op zodat we niet
 * elke keer opnieuw hoeven in te loggen.
 */
async function loginToGoogle(email, password, options = {}) {
  const { headless = false, slowMo = 100 } = options;

  const browser = await chromium.launch({ headless, slowMo });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'nl-NL',
  });
  const page = await context.newPage();

  try {
    console.log('[Auth] Navigeren naar Google login...');
    await page.goto('https://accounts.google.com/signin');
    await page.waitForLoadState('networkidle');

    // Email invoeren
    console.log('[Auth] Email invoeren...');
    await page.fill('input[type="email"]', email);
    await page.click('#identifierNext');
    await page.waitForTimeout(2000);

    // Wachtwoord invoeren
    console.log('[Auth] Wachtwoord invoeren...');
    await page.waitForSelector('input[type="password"]', { state: 'visible', timeout: 10000 });
    await page.fill('input[type="password"]', password);
    await page.click('#passwordNext');
    await page.waitForTimeout(3000);

    // Controleer of we ingelogd zijn
    await page.waitForURL(/myaccount\.google\.com|accounts\.google\.com\/b/, {
      timeout: 30000,
    }).catch(() => {
      // Mogelijk 2FA of andere verificatie nodig
      console.log('[Auth] ⚠️  Extra verificatie mogelijk nodig - controleer het browservenster');
    });

    // Sla authenticatiestatus op
    if (!fs.existsSync(AUTH_STATE_PATH)) {
      fs.mkdirSync(AUTH_STATE_PATH, { recursive: true });
    }
    await context.storageState({ path: path.join(AUTH_STATE_PATH, 'google-auth.json') });
    console.log('[Auth] ✓ Authenticatie opgeslagen');

    await browser.close();
    return true;
  } catch (error) {
    console.error('[Auth] ✗ Login mislukt:', error.message);
    await page.screenshot({ path: path.join(AUTH_STATE_PATH, 'login-error.png') });
    await browser.close();
    throw error;
  }
}

/**
 * Controleer of er een opgeslagen sessie is en of deze nog geldig is.
 */
function hasValidSession() {
  const authFile = path.join(AUTH_STATE_PATH, 'google-auth.json');
  if (!fs.existsSync(authFile)) return false;

  const stats = fs.statSync(authFile);
  const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
  // Sessie is maximaal 12 uur geldig
  return ageHours < 12;
}

/**
 * Maak een browser context met opgeslagen sessie.
 */
async function createAuthenticatedContext(browser) {
  const authFile = path.join(AUTH_STATE_PATH, 'google-auth.json');
  if (!fs.existsSync(authFile)) {
    throw new Error('Geen opgeslagen sessie gevonden. Voer eerst login uit.');
  }

  return browser.newContext({
    storageState: authFile,
    viewport: { width: 1280, height: 800 },
    locale: 'nl-NL',
  });
}

module.exports = { loginToGoogle, hasValidSession, createAuthenticatedContext, AUTH_STATE_PATH };
