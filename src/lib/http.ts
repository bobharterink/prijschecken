const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchHtml(url: string, attempt = 1): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
    },
    redirect: 'follow',
  });

  // 429 en 5xx zijn tijdelijk, exponentieel terugvallen
  if ((res.status === 429 || res.status >= 500) && attempt < 3) {
    await sleep(2000 * 2 ** attempt);
    return fetchHtml(url, attempt + 1);
  }

  if (!res.ok) throw new Error(`HTTP ${res.status} voor ${url}`);
  return res.text();
}
