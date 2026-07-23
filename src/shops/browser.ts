import { chromium, type Browser } from 'playwright';
import { extractPrice } from '../lib/extract.js';
import type { Adapter } from '../types.js';

let browser: Browser | null = null;

async function getBrowser() {
  if (!browser) browser = await chromium.launch({ headless: true });
  return browser;
}

export async function closeBrowser() {
  await browser?.close();
  browser = null;
}

/**
 * Voor shops die de prijs pas client side inladen, of die achter een
 * bot check zitten die een echte browser fingerprint verwacht.
 * Trager en zwaarder, dus alleen inzetten waar generic faalt.
 */
export const browserAdapter: Adapter = async (listing) => {
  const b = await getBrowser();
  const context = await b.newContext({
    locale: 'nl-NL',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  // Afbeeldingen en fonts blokkeren scheelt flink in tijd en bandbreedte
  await page.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (type === 'image' || type === 'font' || type === 'media') return route.abort();
    return route.continue();
  });

  try {
    await page.goto(listing.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Cookiebanner wegklikken, anders blijft de pagina soms leeg
    for (const label of ['Accepteren', 'Alles accepteren', 'Akkoord', 'Accepteer']) {
      const btn = page.getByRole('button', { name: label }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click().catch(() => {});
        break;
      }
    }

    if (listing.selector) {
      await page.waitForSelector(listing.selector, { timeout: 10_000 }).catch(() => {});
    }

    const html = await page.content();
    return extractPrice(html, listing.selector);
  } finally {
    await context.close();
  }
};
