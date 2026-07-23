import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Observation, Product } from '../src/types.js';

const DATA_DIR = path.join(process.cwd(), 'data');

export type ShopSeries = {
  shop: string;
  points: { date: string; price: number }[];
  current: number | null;
  url: string;
};

export type ProductStats = {
  lowestEver: number | null;
  highestEver: number | null;
  average: number | null;
  current: number | null;
  /** Verschil tussen huidige laagste prijs en het gemiddelde, in procent */
  vsAverage: number | null;
  firstDate: string | null;
};

export async function getProducts(): Promise<Product[]> {
  return JSON.parse(await readFile(path.join(process.cwd(), 'products.json'), 'utf8'));
}

export async function getObservations(): Promise<Observation[]> {
  try {
    const raw = await readFile(path.join(DATA_DIR, 'prices.ndjson'), 'utf8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l) as Observation)
      .filter((o) => o.price !== null);
  } catch {
    return [];
  }
}

/**
 * Bouwt per shop een reeks met één punt per dag.
 * Draait de scraper twee keer op een dag, dan wint de laatste meting.
 */
export function buildSeries(observations: Observation[], productId: string): ShopSeries[] {
  const forProduct = observations.filter((o) => o.productId === productId);
  const byShop = new Map<string, Map<string, Observation>>();

  for (const o of forProduct) {
    const day = o.ts.slice(0, 10);
    const shop = byShop.get(o.shop) ?? new Map();
    const existing = shop.get(day);
    if (!existing || o.ts > existing.ts) shop.set(day, o);
    byShop.set(o.shop, shop);
  }

  return [...byShop.entries()]
    .map(([shop, days]) => {
      const points = [...days.entries()]
        .map(([date, o]) => ({ date, price: o.price as number }))
        .sort((a, b) => a.date.localeCompare(b.date));
      const last = [...days.values()].sort((a, b) => a.ts.localeCompare(b.ts)).at(-1);
      return { shop, points, current: points.at(-1)?.price ?? null, url: last?.url ?? '#' };
    })
    .sort((a, b) => (a.current ?? Infinity) - (b.current ?? Infinity));
}

/** Zet de per-shop reeksen om naar rijen die recharts kan tekenen */
export function toChartRows(series: ShopSeries[]) {
  const dates = [...new Set(series.flatMap((s) => s.points.map((p) => p.date)))].sort();
  const lastKnown = new Map<string, number>();

  return dates.map((date) => {
    const row: Record<string, string | number | null> = { date };
    for (const s of series) {
      const point = s.points.find((p) => p.date === date);
      // Ontbreekt een meting, dan blijft de vorige prijs staan.
      // Een gat in de lijn zou suggereren dat het product niet te koop was.
      if (point) lastKnown.set(s.shop, point.price);
      row[s.shop] = lastKnown.get(s.shop) ?? null;
    }
    return row;
  });
}

export function getStats(series: ShopSeries[]): ProductStats {
  const all = series.flatMap((s) => s.points.map((p) => p.price));
  if (!all.length) {
    return { lowestEver: null, highestEver: null, average: null, current: null, vsAverage: null, firstDate: null };
  }

  const currents = series.map((s) => s.current).filter((p): p is number => p !== null);
  const current = currents.length ? Math.min(...currents) : null;
  const average = all.reduce((a, b) => a + b, 0) / all.length;
  const dates = series.flatMap((s) => s.points.map((p) => p.date)).sort();

  return {
    lowestEver: Math.min(...all),
    highestEver: Math.max(...all),
    average,
    current,
    vsAverage: current === null ? null : ((current - average) / average) * 100,
    firstDate: dates[0] ?? null,
  };
}

export const euro = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(n);

export const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('nl-BE', { day: 'numeric', month: 'short' }).format(new Date(iso));
