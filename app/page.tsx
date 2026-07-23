import Link from 'next/link';
import { getProducts, getObservations, buildSeries, getStats, euro } from '../lib/prices';

export const revalidate = 3600;

/** Kleine stapsparkline, zelfde logica als de grote grafiek maar zonder assen */
function Spark({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = 100 / (points.length - 1);

  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = 28 - ((p - min) / range) * 26;
      return i === 0 ? `M${x},${y}` : `H${x} V${y}`;
    })
    .join(' ');

  const rising = points[points.length - 1] > points[0];

  return (
    <svg className="spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} fill="none" stroke={rising ? 'var(--rise)' : 'var(--drop)'} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default async function Home() {
  const [products, observations] = await Promise.all([getProducts(), getObservations()]);

  const items = products.map((product) => {
    const series = buildSeries(observations, product.id);
    const stats = getStats(series);
    const dates = [...new Set(series.flatMap((s) => s.points.map((p) => p.date)))].sort();
    const daily = dates.map((date) => {
      const prices = series
        .map((s) => s.points.find((p) => p.date === date)?.price)
        .filter((p): p is number => p !== undefined);
      return Math.min(...prices);
    });
    return { product, stats, daily, shopCount: series.length };
  });

  return (
    <main className="wrap">
      <p className="eyebrow">{products.length} producten gevolgd</p>
      <h1>Wat kost het vandaag</h1>

      {items.length === 0 ? (
        <p className="none">Nog geen producten. Voeg ze toe in products.json.</p>
      ) : (
        <ul className="grid">
          {items.map(({ product, stats, daily, shopCount }) => (
            <li key={product.id}>
              <Link href={`/product/${product.id}`} className="card tile">
                <span className="tile-name">{product.name}</span>
                <span className="num tile-price">
                  {stats.current !== null ? euro(stats.current) : '—'}
                </span>
                <span className="tile-meta">
                  {shopCount > 0 ? `${shopCount} ${shopCount === 1 ? 'winkel' : 'winkels'}` : 'nog geen data'}
                </span>
                <Spark points={daily} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
