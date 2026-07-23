# prijschecken.nl scraper

Dagelijkse prijsscraper voor elektronicaproducten. Haalt 1x per dag de prijs op
per product per shop en bewaart de historiek.

## Werking

De strategie is bewust gelaagd, van stabiel naar fragiel:

1. **JSON-LD** (`script[type="application/ld+json"]`) met een schema.org `Offer`.
   Webshops zetten dit erin voor Google Shopping en veranderen het zelden.
2. **Microdata** (`[itemprop="price"]`) als tweede optie.
3. **CSS selector** uit `products.json` als laatste redmiddel.

Shops die de prijs pas client side inladen krijgen de Playwright adapter.
Die staat in `src/shops/index.ts` per shop ingesteld.

## Gebruik

```bash
npm install
npx playwright install chromium
npm run scrape                       # alle producten
npm run scrape:one sony-wh1000xm5    # één product, handig bij debuggen
```

Producten configureer je in `products.json`. De `shop` waarde moet matchen met
een key in de adapter registry, anders valt hij terug op `generic`.

## Data

- `data/prices.ndjson` — append only, één regel per observatie. Dit is je historiek.
- `data/latest.json` — snapshot van de laagste actuele prijs per product, voor de frontend.

Bij een nieuwe shop: zet hem eerst op `generic`. Blijft de prijs `null`, dan pas
`browserAdapter`. Playwright is tien keer trager, dus niet standaard inzetten.

## Cron

`.github/workflows/scrape.yml` draait dagelijks en committ de data terug.
Gratis voor publieke repos. Voor private repos telt het mee in je Actions minuten,
maar een run van een paar minuten per dag blijft ruim binnen de free tier.

Alternatief is een Vercel Cron Job, maar die heeft een timeout van 60 seconden
op het hobby plan. Met delays tussen requests haal je dat niet bij meer dan een
handvol producten.

## Aandachtspunten

Scrapen van publiek zichtbare data is niet verboden, maar staat wel in de
voorwaarden van vrijwel elke grote webshop. Praktisch risico is een IP-block,
geen rechtszaak. Daarom: 1x per dag, met delay tussen requests, en geen parallelle
requests naar dezelfde host.

Voor bol.com bestaat een officiële Partner API met prijzen als gestructureerde
data. Dat is stabieler dan scrapen en levert commissie op doorkliks. Overweeg
dat voor de shops waar het kan.

Selectors breken. De run faalt bewust met exit code 1 als meer dan de helft
van de prijzen misgaat, zodat GitHub je een mail stuurt.

## Frontend

De site draait op Next.js in dezelfde repo en leest rechtstreeks `data/prices.ndjson`.
Geen database nodig zolang je onder een paar honderd producten blijft.

```bash
npm run seed   # 90 dagen demo-data, zodat je de grafiek meteen ziet
npm run dev
```

Gooi `data/prices.ndjson` weg zodra de scraper echte metingen oplevert.

Pagina's:

- `/` overzicht met per product de laagste prijs en een sparkline
- `/product/[id]` grafiek, vergelijking per winkel en statistiek

De grafiek is een stapgrafiek (`type="stepAfter"`), geen vloeiende lijn. Een prijs
verandert op een moment en blijft daarna gelijk. Een curve zou tussenliggende
prijzen suggereren die nooit hebben bestaan.

Ontbreekt er een dag in de reeks, dan trekt `toChartRows` de laatst bekende prijs
door. Een gat in de lijn zou lezen als "niet te koop", terwijl het meestal betekent
dat de scraper die dag faalde.

Beide pagina's staan op `revalidate = 3600`. Bij één meting per dag is dat ruim
voldoende en blijft alles statisch geserveerd.
