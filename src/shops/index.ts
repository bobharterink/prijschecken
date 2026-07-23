import { generic } from './generic.js';
import { browserAdapter } from './browser.js';
import type { Adapter } from '../types.js';

/**
 * Voeg hier een shop toe zodra generic niet werkt.
 * Begin altijd met generic, stap pas over op browser als de prijs null blijft.
 */
export const adapters: Record<string, Adapter> = {
  generic,
  coolblue: browserAdapter,
  mediamarkt: browserAdapter,
  bol: browserAdapter,
  amazon: browserAdapter,
};

export function getAdapter(shop: string): Adapter {
  return adapters[shop] ?? generic;
}

export { closeBrowser } from './browser.js';
