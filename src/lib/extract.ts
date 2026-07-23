import * as cheerio from 'cheerio';
import { parsePrice } from './parsePrice.js';
import type { PriceResult } from '../types.js';

const IN_STOCK = /InStock|LimitedAvailability|OnlineOnly|PreOrder/i;
const OUT_OF_STOCK = /OutOfStock|SoldOut|Discontinued|BackOrder/i;

/** Loopt recursief door een JSON-LD structuur en verzamelt alle nodes */
function flatten(node: unknown, out: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(node)) {
    for (const item of node) flatten(item, out);
  } else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    out.push(obj);
    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object') flatten(value, out);
    }
  }
  return out;
}

function typeOf(obj: Record<string, unknown>): string {
  const t = obj['@type'];
  if (Array.isArray(t)) return t.join(' ');
  return typeof t === 'string' ? t : '';
}

function offerToResult(offer: Record<string, unknown>): PriceResult | null {
  const spec = offer['priceSpecification'];
  let priceRaw = offer['price'] ?? offer['lowPrice'];
  let currency = offer['priceCurrency'];

  if (priceRaw === undefined && spec && typeof spec === 'object') {
    const s = (Array.isArray(spec) ? spec[0] : spec) as Record<string, unknown>;
    priceRaw = s?.['price'];
    currency = currency ?? s?.['priceCurrency'];
  }

  const price = parsePrice(priceRaw as string | number);
  if (price === null) return null;

  const availability = String(offer['availability'] ?? '');
  let inStock: boolean | null = null;
  if (IN_STOCK.test(availability)) inStock = true;
  else if (OUT_OF_STOCK.test(availability)) inStock = false;

  return {
    price,
    currency: typeof currency === 'string' ? currency : 'EUR',
    inStock,
    source: 'json-ld',
  };
}

/** Probeert prijs uit JSON-LD te halen, dan microdata, dan een CSS selector */
export function extractPrice(html: string, selector?: string): PriceResult {
  const $ = cheerio.load(html);

  // 1. JSON-LD, veruit het meest stabiel
  const nodes: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const text = $(el).contents().text().trim();
    if (!text) return;
    try {
      flatten(JSON.parse(text), nodes);
    } catch {
      // Ongeldige JSON-LD komt vaker voor dan je zou hopen, negeren
    }
  });

  const offers = nodes.filter((n) => /Offer/i.test(typeOf(n)) && ('price' in n || 'lowPrice' in n || 'priceSpecification' in n));
  const results = offers.map(offerToResult).filter((r): r is PriceResult => r !== null);
  if (results.length) {
    // Laagste prijs winnen, sommige shops zetten meerdere offers neer
    return results.reduce((a, b) => (b.price! < a.price! ? b : a));
  }

  // 2. Microdata
  const micro = $('[itemprop="price"]').first();
  if (micro.length) {
    const price = parsePrice(micro.attr('content') ?? micro.text());
    if (price !== null) {
      return {
        price,
        currency: $('[itemprop="priceCurrency"]').first().attr('content') ?? 'EUR',
        inStock: null,
        source: 'microdata',
      };
    }
  }

  // 3. CSS selector fallback
  if (selector) {
    const el = $(selector).first();
    if (el.length) {
      const price = parsePrice(el.attr('content') ?? el.attr('data-price') ?? el.text());
      if (price !== null) {
        return { price, currency: 'EUR', inStock: null, source: 'selector' };
      }
    }
  }

  return { price: null, currency: 'EUR', inStock: null, source: 'none' };
}
