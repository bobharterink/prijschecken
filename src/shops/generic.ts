import { fetchHtml } from '../lib/http.js';
import { extractPrice } from '../lib/extract.js';
import type { Adapter } from '../types.js';

/**
 * Werkt voor elke shop die server side HTML rendert met JSON-LD.
 * Dat is het overgrote deel, inclusief de meeste kleinere webshops.
 */
export const generic: Adapter = async (listing) => {
  const html = await fetchHtml(listing.url);
  return extractPrice(html, listing.selector);
};
