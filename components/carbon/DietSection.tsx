'use client';

import { Utensils, Leaf } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CarbonFootprintInput } from '@/types';

interface DietSectionProps {
  values: CarbonFootprintInput['diet'];
  onChange: (field: keyof CarbonFootprintInput['diet'], value: string | number) => void;
}

export function DietSection({ values, onChange }: DietSectionProps) {
  return (
    <div className="space-y-4" aria-labelledby="diet-heading">
      <h3 id="diet-heading" className="flex items-center gap-2 text-lg font-semibold text-white">
        <Utensils className="text-brand-400" size={22} aria-hidden="true" />
        Diet
      </h3>
      <p className="text-sm text-slate-400">Food choices and waste habits</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="dietType" className="text-sm text-slate-300">Diet type</label>
          <select
            id="dietType"
            value={values.dietType}
            onChange={(e) => onChange('dietType', e.target.value as CarbonFootprintInput['diet']['dietType'])}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-2 text-slate-100 focus:ring-2 focus:ring-brand-500"
            aria-describedby="dietType-hint"
          >
            <option value="meat-heavy">Meat-heavy (daily red meat)</option>
            <option value="average">Average (meat most days)</option>
            <option value="low-meat">Low meat (few times/week)</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
          </select>
          <p id="dietType-hint" className="text-xs text-slate-500">Select your typical dietary pattern</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="foodWasteLevel" className="text-sm text-slate-300">Food waste level</label>
          <select
            id="foodWasteLevel"
            value={values.foodWasteLevel}
            onChange={(e) => onChange('foodWasteLevel', e.target.value as CarbonFootprintInput['diet']['foodWasteLevel'])}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-2 text-slate-100 focus:ring-2 focus:ring-brand-500"
            aria-describedby="foodWasteLevel-hint"
          >
            <option value="high">High (throw away often)</option>
            <option value="average">Average (sometimes)</option>
            <option value="low">Low (rarely waste)</option>
          </select>
          <p id="foodWasteLevel-hint" className="text-xs text-slate-500">Select how much food you typically waste</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="localFoodPercentage" className="flex items-center gap-2 text-sm text-slate-300">
            <Leaf className="text-brand-400" size={16} aria-hidden="true" />
            Local/seasonal food (%)
          </label>
          <Input
            id="localFoodPercentage"
            type="range"
            min="0"
            max="100"
            value={values.localFoodPercentage}
            onChange={(e) => onChange('localFoodPercentage', parseFloat(e.target.value) || 0)}
            className="w-full accent-brand-500"
            aria-valuetext={`${values.localFoodPercentage}% local or seasonal food`}
            aria-label="Percentage of local or seasonal food in diet"
          />
          <p className="text-sm text-slate-400" aria-hidden="true">{values.localFoodPercentage}%</p>
          <output htmlFor="localFoodPercentage" className="sr-only">{values.localFoodPercentage}% local or seasonal food</output>
        </div>
      </div>
    </div>
  );
}