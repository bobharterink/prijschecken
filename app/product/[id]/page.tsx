import Link from 'next/link';
import { notFound } from 'next/navigation';
import PriceChart from '../../../components/PriceChart';
import {
  getProducts,
  getObservations,
  buildSeries,
  toChartRows,
  getStats,
  euro,
  shortDate,
} from '../../../lib/prices';

export const revalidate = 3600;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ id: p.id }));
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [products, observations] = await Promise.all([getProducts(), getObservations()]);

  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  const series = buildSeries(observations, id);
  const rows = toChartRows(series);
  const stats = getStats(series);
  const best = series[0];

  return (
    <main className="wrap">
      <Link href="/" className="back">
        Terug naar overzicht
      </Link>

      {product.category && <p className="eyebrow">{product.category}</p>}
      <h1>{product.name}</h1>

      {stats.current === null ? (
        <p className="none">Nog geen prijs bekend. De scraper heeft dit product nog niet opgehaald.</p>
      ) : (
        <>
          <div className="headline">
            <div>
              <span className="num price">{euro(stats.current)}</span>
              {best && <span className="at">bij {best.shop}</span>}
            </div>
            {stats.vsAverage !== null && (
              <span className={`delta ${stats.vsAverage <= 0 ? 'is-drop' : 'is-rise'}`}>
                {stats.vsAverage <= 0 ? '' : '+'}
                {stats.vsAverage.toFixed(1)}% tegenover het gemiddelde
              </span>
            )}
          </div>

          <section className="card block">
            <h2>Prijsverloop</h2>
            <PriceChart rows={rows} shops={series.map((s) => s.shop)} lowestEver={stats.lowestEver} />
          </section>

          <div className="cols">
            <section className="card block">
              <h2>Per winkel</h2>
              <ul className="shops">
                {series.map((s, i) => (
                  <li key={s.shop}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer nofollow">
                      <span className="shop-name">{s.shop}</span>
                      {i === 0 && <span className="badge">laagste</span>}
                      <span className="num shop-price">{s.current !== null ? euro(s.current) : '—'}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card block">
              <h2>Statistiek</h2>
              <dl className="stats">
                <div>
                  <dt>Laagste ooit</dt>
                  <dd className="num">{stats.lowestEver !== null ? euro(stats.lowestEver) : '—'}</dd>
                </div>
                <div>
                  <dt>Hoogste ooit</dt>
                  <dd className="num">{stats.highestEver !== null ? euro(stats.highestEver) : '—'}</dd>
                </div>
                <div>
                  <dt>Gemiddeld</dt>
                  <dd className="num">{stats.average !== null ? euro(stats.average) : '—'}</dd>
                </div>
                <div>
                  <dt>Gevolgd sinds</dt>
                  <dd className="num">{stats.firstDate ? shortDate(stats.firstDate) : '—'}</dd>
                </div>
              </dl>
            </section>
          </div>
        </>
      )}
    </main>
  );
}
