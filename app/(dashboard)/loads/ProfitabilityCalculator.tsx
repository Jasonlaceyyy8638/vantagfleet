'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

const HIGH_PROFIT_THRESHOLD = 2; // $/mile above this = high profit

function getProfitPerMile(
  revenue: number,
  totalMiles: number,
  fuelCost: number
): number | null {
  if (!totalMiles || totalMiles <= 0) return null;
  return (revenue - fuelCost) / totalMiles;
}

type Props = {
  defaultRevenue?: number;
  defaultTotalMiles?: number;
  defaultDeadhead?: number;
  defaultFuelCost?: number;
};

export function ProfitabilityCalculator({
  defaultRevenue = 0,
  defaultTotalMiles = 0,
  defaultDeadhead = 0,
  defaultFuelCost = 0,
}: Props) {
  const [revenue, setRevenue] = useState(String(defaultRevenue));
  const [totalMiles, setTotalMiles] = useState(String(defaultTotalMiles));
  const [deadheadMiles, setDeadheadMiles] = useState(String(defaultDeadhead));
  const [fuelCost, setFuelCost] = useState(String(defaultFuelCost));

  const r = Number(revenue) || 0;
  const miles = Number(totalMiles) || 0;
  const deadhead = Number(deadheadMiles) || 0;
  const fuel = Number(fuelCost) || 0;

  const profitPerMile = getProfitPerMile(r, miles, fuel);
  const isHighProfit = profitPerMile !== null && profitPerMile >= HIGH_PROFIT_THRESHOLD;
  const label = profitPerMile === null ? '—' : isHighProfit ? 'High Profit' : 'Low Profit';

  const chartData =
    profitPerMile !== null
      ? [{ name: label, value: Math.max(0, Math.min(profitPerMile, 10)), fullValue: profitPerMile }]
      : [];

  return (
    <div className="rounded-xl border border-white/10 bg-card p-6 space-y-6">
      <h2 className="text-lg font-semibold text-soft-cloud">Profitability Calculator</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-soft-cloud/70 mb-1">Gross Revenue ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-soft-cloud/70 mb-1">Total Miles</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={totalMiles}
            onChange={(e) => setTotalMiles(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-soft-cloud/70 mb-1">Deadhead Miles</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={deadheadMiles}
            onChange={(e) => setDeadheadMiles(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-soft-cloud/70 mb-1">Fuel Cost ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={fuelCost}
            onChange={(e) => setFuelCost(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud text-sm"
          />
        </div>
      </div>

      <p className="text-sm text-soft-cloud/70">
        Profit per mile = (Revenue − Fuel Cost) ÷ Total Miles
      </p>

      {profitPerMile !== null && (
        <p className="text-lg font-semibold text-soft-cloud">
          Profit per mile: <span className={isHighProfit ? 'text-electric-teal' : 'text-cyber-amber'}>${profitPerMile.toFixed(2)}</span>
        </p>
      )}

      {chartData.length > 0 && (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(226,232,240,0.8)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'rgba(226,232,240,0.8)', fontSize: 12 }} unit="$" />
              <Bar dataKey="value" radius={4} name="$/mile">
                <Cell fill={isHighProfit ? '#00F5D4' : '#FFB000'} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-xs text-soft-cloud/60 mt-1">
            {label} {profitPerMile !== null && `($${profitPerMile.toFixed(2)}/mi)`}
          </p>
        </div>
      )}
    </div>
  );
}
