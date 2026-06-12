'use client';

import { Shirt, Smartphone, Recycle, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CarbonFootprintInput } from '@/types';

interface ConsumptionSectionProps {
  values: CarbonFootprintInput['consumption'];
  onChange: (field: keyof CarbonFootprintInput['consumption'], value: string | number) => void;
}

export function ConsumptionSection({ values, onChange }: ConsumptionSectionProps) {
  return (
    <div className="space-y-4" aria-labelledby="consumption-heading">
      <h3 id="consumption-heading" className="flex items-center gap-2 text-lg font-semibold text-white">
        <Shirt className="text-brand-400" size={22} aria-hidden="true" />
        Consumption
      </h3>
      <p className="text-sm text-slate-400">Shopping habits and waste management</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="clothingItemsPerYear" className="flex items-center gap-2 text-sm text-slate-300">
            <Shirt className="text-brand-400" size={16} aria-hidden="true" />
            Clothing items/year
          </label>
          <Input
            id="clothingItemsPerYear"
            type="number"
            min="0"
            value={values.clothingItemsPerYear}
            onChange={(e) => onChange('clothingItemsPerYear', parseFloat(e.target.value) || 0)}
            className="bg-slate-900/50 border-white/10"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="electronicsItemsPerYear" className="flex items-center gap-2 text-sm text-slate-300">
            <Smartphone className="text-brand-400" size={16} aria-hidden="true" />
            Electronics items/year
          </label>
          <Input
            id="electronicsItemsPerYear"
            type="number"
            min="0"
            value={values.electronicsItemsPerYear}
            onChange={(e) => onChange('electronicsItemsPerYear', parseFloat(e.target.value) || 0)}
            className="bg-slate-900/50 border-white/10"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="recyclingRate" className="text-sm text-slate-300">Recycling rate</label>
          <select
            id="recyclingRate"
            value={values.recyclingRate}
            onChange={(e) => onChange('recyclingRate', e.target.value as CarbonFootprintInput['consumption']['recyclingRate'])}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-2 text-slate-100 focus:ring-2 focus:ring-brand-500"
          >
            <option value="high">High (recycle most)</option>
            <option value="average">Average (recycle some)</option>
            <option value="low">Low (rarely recycle)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="secondHandPercentage" className="flex items-center gap-2 text-sm text-slate-300">
            <RotateCcw className="text-brand-400" size={16} aria-hidden="true" />
            Second-hand purchases (%)
          </label>
          <Input
            id="secondHandPercentage"
            type="range"
            min="0"
            max="100"
            value={values.secondHandPercentage}
            onChange={(e) => onChange('secondHandPercentage', parseFloat(e.target.value) || 0)}
            className="w-full accent-brand-500"
            aria-valuetext={`${values.secondHandPercentage}%`}
          />
          <p className="text-sm text-slate-400">{values.secondHandPercentage}%</p>
        </div>
      </div>
    </div>
  );
}