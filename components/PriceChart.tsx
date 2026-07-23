'use client';

import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

type Row = Record<string, string | number | null>;

const COLORS = ['var(--shop-1)', 'var(--shop-2)', 'var(--shop-3)', 'var(--shop-4)', 'var(--shop-5)'];

const euro = (n: number) => new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(n);
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('nl-BE', { day: 'numeric', month: 'short' }).format(new Date(iso));

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a, b) => a.value - b.value);
  return (
    <div className="tip">
      <div className="tip-date">{shortDate(label)}</div>
      {sorted.map((entry: any) => (
        <div className="tip-row" key={entry.dataKey}>
          <span className="tip-dot" style={{ background: entry.color }} aria-hidden />
          <span className="tip-shop">{entry.dataKey}</span>
          <span className="num tip-price">{euro(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function PriceChart({
  rows,
  shops,
  lowestEver,
}: {
  rows: Row[];
  shops: string[];
  lowestEver: number | null;
}) {
  const [hidden, setHidden] = useState<string[]>([]);
  const visible = shops.filter((s) => !hidden.includes(s));

  const toggle = (shop: string) =>
    setHidden((h) => (h.includes(shop) ? h.filter((s) => s !== shop) : [...h, shop]));

  if (rows.length < 2) {
    return (
      <div className="chart-empty">
        <p>Nog te weinig metingen voor een grafiek.</p>
        <p className="chart-empty-note">
          De lijn verschijnt zodra er twee dagen aan data zijn. Draai de scraper of wacht op de
          volgende run.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="legend">
        {shops.map((shop, i) => {
          const off = hidden.includes(shop);
          return (
            <button
              key={shop}
              type="button"
              onClick={() => toggle(shop)}
              className="legend-item"
              aria-pressed={!off}
              style={{ opacity: off ? 0.35 : 1 }}
            >
              <span className="legend-swatch" style={{ background: COLORS[i % COLORS.length] }} aria-hidden />
              {shop}
            </button>
          );
        })}
      </div>

      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tick={{ fontSize: 11, fill: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
              stroke="var(--line-strong)"
              minTickGap={28}
            />
            <YAxis
              domain={['auto', 'auto']}
              width={62}
              tickFormatter={(v) => `€${v}`}
              tick={{ fontSize: 11, fill: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
              stroke="var(--line-strong)"
            />
            <Tooltip content={<ChartTooltip />} />

            {lowestEver !== null && (
              <ReferenceLine
                y={lowestEver}
                stroke="var(--drop)"
                strokeDasharray="3 3"
                label={{
                  value: `laagste ooit ${euro(lowestEver)}`,
                  position: 'insideBottomRight',
                  fill: 'var(--drop)',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                }}
              />
            )}

            {visible.map((shop) => (
              <Line
                key={shop}
                type="stepAfter"
                dataKey={shop}
                stroke={COLORS[shops.indexOf(shop) % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <style jsx>{`
        .chart {
          height: 340px;
          margin-left: -0.5rem;
        }
        .legend {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: none;
          border: 0;
          padding: 0.15rem 0;
          cursor: pointer;
          font-family: var(--font-mono), monospace;
          font-size: 0.75rem;
          color: var(--ink);
        }
        .legend-swatch {
          width: 10px;
          height: 10px;
          border-radius: 2px;
        }
        .chart-empty {
          border: 1px dashed var(--line-strong);
          border-radius: 4px;
          padding: 2.5rem 1.5rem;
          text-align: center;
          color: var(--ink-soft);
        }
        .chart-empty p {
          margin: 0 0 0.4rem;
        }
        .chart-empty-note {
          font-size: 0.85rem;
        }
      `}</style>

      <style jsx global>{`
        .tip {
          background: var(--card);
          border: 1px solid var(--line-strong);
          border-radius: 4px;
          padding: 0.55rem 0.7rem;
          box-shadow: 0 4px 14px rgba(16, 26, 31, 0.08);
        }
        .tip-date {
          font-family: var(--font-mono), monospace;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink-soft);
          margin-bottom: 0.35rem;
        }
        .tip-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
        }
        .tip-dot {
          width: 8px;
          height: 8px;
          border-radius: 2px;
        }
        .tip-shop {
          margin-right: 1rem;
        }
        .tip-price {
          margin-left: auto;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
