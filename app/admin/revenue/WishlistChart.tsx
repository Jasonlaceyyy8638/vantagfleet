'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

type WishlistChartData = { name: string; count: number; fill: string }[];

export function WishlistChart({ data }: { data: WishlistChartData }) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <XAxis dataKey="name" tick={{ fill: 'rgba(226,232,240,0.8)', fontSize: 12 }} />
          <YAxis tick={{ fill: 'rgba(226,232,240,0.6)', fontSize: 11 }} allowDecimals={false} />
          <Bar dataKey="count" radius={4} name="Notify Me signups">
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
