export type Listing = {
  /** Naam van de shop, moet matchen met een key in de adapter registry */
  shop: string;
  url: string;
  /** Optionele CSS selector als fallback wanneer JSON-LD ontbreekt */
  selector?: string;
};

export type Product = {
  id: string;
  name: string;
  category?: string;
  listings: Listing[];
};

export type PriceResult = {
  price: number | null;
  currency: string;
  inStock: boolean | null;
  /** Waar de prijs vandaan kwam, handig bij debuggen */
  source: 'json-ld' | 'microdata' | 'selector' | 'none';
};

export type Observation = PriceResult & {
  ts: string;
  productId: string;
  shop: string;
  url: string;
  error?: string;
};

export type Adapter = (listing: Listing) => Promise<PriceResult>;
