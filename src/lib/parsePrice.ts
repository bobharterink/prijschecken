/**
 * Zet een prijsstring om naar een number.
 * Handelt zowel NL notatie (1.299,00) als internationale notatie (1,299.00) af.
 * Geeft null terug als er geen zinnig getal in zit.
 */
export function parsePrice(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;

  let s = String(raw).trim();
  if (!s) return null;

  // Valutatekens, spaties en niet-breekbare spaties eruit
  s = s.replace(/[€$£]|EUR|eur/gi, '').replace(/[\s\u00a0\u202f]/g, '');

  // Alles behalve cijfers, punt, komma en minteken weg
  s = s.replace(/[^0-9.,-]/g, '');
  if (!s) return null;

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  if (lastComma > -1 && lastDot > -1) {
    // Beide aanwezig, de laatste is het decimaalteken
    if (lastComma > lastDot) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (lastComma > -1) {
    // Alleen komma. Twee cijfers erna betekent decimaal, anders duizendtal
    const decimals = s.length - lastComma - 1;
    s = decimals === 2 ? s.replace(',', '.') : s.replace(/,/g, '');
  } else if (lastDot > -1) {
    const decimals = s.length - lastDot - 1;
    if (decimals === 3) s = s.replace(/\./g, '');
  }

  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}
