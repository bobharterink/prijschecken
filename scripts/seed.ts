/**
 * Vult data/prices.ndjson met 90 dagen verzonnen prijzen.
 * Puur om de frontend te kunnen bekijken voordat de scraper echte data heeft.
 * Draai `npm run seed`, en gooi data/prices.ndjson weg zodra je echte metingen hebt.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import type { Observation, Product } from '../src/types.js';

const DAYS = 90;

function walk(start: number, days: number): number[] {
  const out: number[] = [];
  let price = start;
  for (let i = 0; i < days; i++) {
    // Prijzen blijven meestal staan en springen af en toe
    if (Math.random() < 0.12) {
      const jump = (Math.random() - 0.55) * start * 0.08;
      price = Math.max(start * 0.65, price + jump);
    }
    // Af en toe een korte actie
    if (Math.random() < 0.03) price = price * 0.88;
    out.push(Math.round(price * 100) / 100);
  }
  return out;
}

async function main() {
  const products: Product[] = JSON.parse(await readFile('products.json', 'utf8'));
  const lines: string[] = [];
  const base: Record<string, number> = {};

  for (const product of products) {
    const anchor = 200 + Math.random() * 1200;
    for (const listing of product.listings) {
      base[listing.shop] = anchor * (0.95 + Math.random() * 0.12);
      const prices = walk(base[listing.shop], DAYS);
      prices.forEach((price, i) => {
        const date = new Date();
        date.setUTCDate(date.getUTCDate() - (DAYS - 1 - i));
        date.setUTCHours(6, 12, 0, 0);
        const obs: Observation = {
          ts: date.toISOString(),
          productId: product.id,
          shop: listing.shop,
          url: listing.url,
          price,
          currency: 'EUR',
          inStock: true,
          source: 'json-ld',
        };
        lines.push(JSON.stringify(obs));
      });
    }
  }

  await mkdir('data', { recursive: true });
  await writeFile('data/prices.ndjson', lines.join('\n') + '\n', 'utf8');
  console.log(`${lines.length} demo-metingen weggeschreven naar data/prices.ndjson`);
}

main();
