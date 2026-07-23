import { readFile } from 'node:fs/promises';
import { getAdapter, closeBrowser } from './shops/index.js';
import { appendObservations, readHistory, writeLatest } from './lib/store.js';
import { sleep } from './lib/http.js';
import type { Observation, Product } from './types.js';

/** Willekeurige pauze tussen requests, zodat het verkeer niet als bot patroon opvalt */
const DELAY_MIN = 3_000;
const DELAY_MAX = 8_000;

async function main() {
  const filter = process.argv.includes('--product')
    ? process.argv[process.argv.indexOf('--product') + 1]
    : null;

  const products: Product[] = JSON.parse(await readFile('products.json', 'utf8'));
  const todo = filter ? products.filter((p) => p.id === filter) : products;

  const observations: Observation[] = [];
  const ts = new Date().toISOString();

  for (const product of todo) {
    for (const listing of product.listings) {
      const adapter = getAdapter(listing.shop);
      try {
        const result = await adapter(listing);
        observations.push({ ...result, ts, productId: product.id, shop: listing.shop, url: listing.url });
        const label = result.price === null ? 'GEEN PRIJS' : `${result.price.toFixed(2)} ${result.currency}`;
        console.log(`${product.id} @ ${listing.shop}: ${label} (${result.source})`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        observations.push({
          ts,
          productId: product.id,
          shop: listing.shop,
          url: listing.url,
          price: null,
          currency: 'EUR',
          inStock: null,
          source: 'none',
          error: message,
        });
        console.error(`${product.id} @ ${listing.shop}: mislukt, ${message}`);
      }

      await sleep(DELAY_MIN + Math.random() * (DELAY_MAX - DELAY_MIN));
    }
  }

  await appendObservations(observations);
  await writeLatest(await readHistory());
  await closeBrowser();

  const ok = observations.filter((o) => o.price !== null).length;
  console.log(`\nKlaar. ${ok} van ${observations.length} prijzen opgehaald.`);

  // Laat de run falen als meer dan de helft misgaat, dan zie je het in GitHub
  if (observations.length > 0 && ok < observations.length / 2) process.exit(1);
}

main().catch(async (err) => {
  console.error(err);
  await closeBrowser();
  process.exit(1);
});
