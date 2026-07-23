import { appendFile, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { Observation } from '../types.js';

const DATA_DIR = path.resolve('data');
const HISTORY = path.join(DATA_DIR, 'prices.ndjson');
const LATEST = path.join(DATA_DIR, 'latest.json');

/**
 * NDJSON omdat het append only is. Elke dagelijkse run voegt regels toe
 * zonder het hele bestand te herschrijven, wat in git een schone diff geeft.
 */
export async function appendObservations(observations: Observation[]) {
  await mkdir(DATA_DIR, { recursive: true });
  const lines = observations.map((o) => JSON.stringify(o)).join('\n') + '\n';
  await appendFile(HISTORY, lines, 'utf8');
}

export async function readHistory(): Promise<Observation[]> {
  try {
    const raw = await readFile(HISTORY, 'utf8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Observation);
  } catch {
    return [];
  }
}

/** Snapshot van de laatst bekende prijs per product en shop, voor de frontend */
export async function writeLatest(observations: Observation[]) {
  const byKey = new Map<string, Observation>();
  for (const o of observations) {
    if (o.price === null) continue;
    byKey.set(`${o.productId}::${o.shop}`, o);
  }

  const grouped: Record<string, Observation[]> = {};
  for (const o of byKey.values()) {
    (grouped[o.productId] ??= []).push(o);
  }
  for (const list of Object.values(grouped)) {
    list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  }

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(LATEST, JSON.stringify({ updatedAt: new Date().toISOString(), products: grouped }, null, 2), 'utf8');
}
