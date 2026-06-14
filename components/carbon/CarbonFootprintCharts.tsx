'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { CarbonFootprintResult, CarbonFootprintHistoryEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];
const CATEGORY_LABELS: Record<string, string> = {
  transport: 'Transport',
  energy: 'Home Energy',
  diet: 'Diet',
  consumption: 'Consumption',
};

interface CarbonFootprintChartsProps {
  result?: CarbonFootprintResult | null;
  history?: CarbonFootprintHistoryEntry[];
}

export function CarbonFootprintCharts({ result, history = [] }: CarbonFootprintChartsProps) {
  if (!result) return null;

  const pieData = Object.entries(result.breakdown).map(([category, value], index) => ({
    name: CATEGORY_LABELS[category] || category,
    value,
    color: COLORS[index % COLORS.length],
    category,
  }));

  const barData = [
    { name: 'You', ...result.breakdown },
    { name: 'Average', transport: 2800, energy: 2200, diet: 2500, consumption: 1500 },
  ];

  const trendData = history.length > 0 
    ? history.map((entry) => ({
        month: entry.date.toLocaleDateString('en-US', { month: 'short' }),
        total: entry.totalKgCo2,
        transport: entry.breakdown.transport,
        energy: entry.breakdown.energy,
        diet: entry.breakdown.diet,
        consumption: entry.breakdown.consumption,
      }))
    : [
        { month: 'Jan', total: 0, transport: 0, energy: 0, diet: 0, consumption: 0 },
        { month: 'Feb', total: 0, transport: 0, energy: 0, diet: 0, consumption: 0 },
        { month: 'Mar', total: 0, transport: 0, energy: 0, diet: 0, consumption: 0 },
      ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle>Footprint Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex h-64" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, _index) => (
                    <Cell key={`cell-${_index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => value ? [`${value.toLocaleString()} kg CO₂`, ''] : ['', '']}
                  contentStyle={{
                    backgroundColor: '#0f1a17',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                />
              </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-4" aria-hidden="true">
              {pieData.map((entry) => (
                <div key={entry.category} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-slate-300">{entry.name}: {entry.value.toLocaleString()} kg</span>
                </div>
              ))}
            </div>
            <table className="sr-only" aria-hidden="true">
              <caption>Footprint Breakdown by Category</caption>
              <thead>
                <tr><th scope="col">Category</th><th scope="col">kg CO₂/year</th><th scope="col">Percentage</th></tr>
              </thead>
              <tbody>
                {pieData.map((entry) => (
                  <tr key={entry.category}>
                    <td>{entry.name}</td>
                    <td>{entry.value.toLocaleString()}</td>
                    <td>{((entry.value / result.totalKgCo2PerYear) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
                <tr>
                  <td><strong>Total</strong></td>
                  <td><strong>{result.totalKgCo2PerYear.toLocaleString()}</strong></td>
                  <td><strong>100%</strong></td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle>vs. Household Average</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex h-64" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fill: '#94a3b8' }} tickFormatter={(v) => `${(v/1000).toFixed(1)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8' }} width={60} />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => value ? [`${value.toLocaleString()} kg CO₂`, ''] : ['', '']}
                    contentStyle={{
                      backgroundColor: '#0f1a17',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                    }}
                  />
                  {Object.keys(result.breakdown).map((category, index) => (
                    <Bar key={category} dataKey={category} fill={COLORS[index % COLORS.length]} radius={[0, 4, 4, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-sm text-slate-400 text-center">
              Your total: {result.totalKgCo2PerYear.toLocaleString()} kg vs Average: {result.averageTotalKgCo2PerYear.toLocaleString()} kg
            </p>
            <table className="sr-only" aria-hidden="true">
              <caption>Your Footprint vs Household Average by Category</caption>
              <thead>
                <tr><th scope="col">Category</th><th scope="col">You (kg CO₂/year)</th><th scope="col">Average (kg CO₂/year)</th><th scope="col">Difference</th></tr>
              </thead>
              <tbody>
                {Object.entries(result.breakdown).map(([category, value]) => {
                  const avg = category === 'transport' ? 2800 : category === 'energy' ? 2200 : category === 'diet' ? 2500 : 1500;
                  return (
                    <tr key={category}>
                      <td>{CATEGORY_LABELS[category]}</td>
                      <td>{value.toLocaleString()}</td>
                      <td>{avg.toLocaleString()}</td>
                      <td>{value > avg ? '+' : ''}{(value - avg).toLocaleString()}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td><strong>Total</strong></td>
                  <td><strong>{result.totalKgCo2PerYear.toLocaleString()}</strong></td>
                  <td><strong>{result.averageTotalKgCo2PerYear.toLocaleString()}</strong></td>
                  <td><strong>{result.totalKgCo2PerYear > result.averageTotalKgCo2PerYear ? '+' : ''}{(result.totalKgCo2PerYear - result.averageTotalKgCo2PerYear).toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card className="p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle>Footprint Trend (6 months)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex h-64" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  {Object.keys(result.breakdown).map((category, _index) => (
                    <linearGradient key={category} id={`color-${category}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[_index % COLORS.length]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS[_index % COLORS.length]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8' }} />
                <YAxis tick={{ fill: '#94a3b8' }} tickFormatter={(v) => `${(v/1000).toFixed(1)}k`} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [
                    value ? (name === 'total' ? `${value.toLocaleString()} kg CO₂` : `${value.toLocaleString()} kg`) : '',
                    name ? (CATEGORY_LABELS[name] || name) : '',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f1a17',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                />
                {Object.keys(result.breakdown).map((category, _index) => (
                  <Area
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stroke={COLORS[_index % COLORS.length]}
                    fill={`url(#color-${category})`}
                    strokeWidth={2}
                  />
                ))}
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm" aria-hidden="true">
            {Object.keys(result.breakdown).map((category, index) => (
              <span key={category} className="flex items-center gap-1" style={{ color: COLORS[index % COLORS.length] }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                {CATEGORY_LABELS[category]}
              </span>
            ))}
            <span className="flex items-center gap-1 text-green-400">
              <span className="w-4 h-4 border-b-2 border-dashed border-green-400" />
              Total
            </span>
          </div>
          <table className="sr-only" aria-hidden="true">
            <caption>Footprint Trend Over 6 Months</caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                {Object.keys(result.breakdown).map((category) => (
                  <th key={category} scope="col">{CATEGORY_LABELS[category]}</th>
                ))}
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {trendData.map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  {Object.keys(result.breakdown).map((category) => (
                    <td key={category}>{row[category as keyof typeof row]?.toLocaleString() || 0}</td>
                  ))}
                  <td><strong>{row.total.toLocaleString()}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}