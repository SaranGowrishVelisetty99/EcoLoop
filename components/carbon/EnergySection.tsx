'use client';

import { Zap, Home, Flame } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CarbonFootprintInput } from '@/types';

interface EnergySectionProps {
  values: CarbonFootprintInput['energy'];
  onChange: (field: keyof CarbonFootprintInput['energy'], value: string | number) => void;
}

export function EnergySection({ values, onChange }: EnergySectionProps) {
  return (
    <div className="space-y-4" aria-labelledby="energy-heading">
      <h3 id="energy-heading" className="flex items-center gap-2 text-lg font-semibold text-white">
        <Zap className="text-brand-400" size={22} aria-hidden="true" />
        Home Energy
      </h3>
      <p className="text-sm text-slate-400">Monthly usage divided by household size</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="electricityKwhPerMonth" className="flex items-center gap-2 text-sm text-slate-300">
            <Zap className="text-brand-400" size={16} aria-hidden="true" />
            Electricity (kWh/month)
          </label>
          <Input
            id="electricityKwhPerMonth"
            type="number"
            min="0"
            value={values.electricityKwhPerMonth}
            onChange={(e) => onChange('electricityKwhPerMonth', parseFloat(e.target.value) || 0)}
            className="bg-slate-900/50 border-white/10"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="gasKwhPerMonth" className="flex items-center gap-2 text-sm text-slate-300">
            <Flame className="text-brand-400" size={16} aria-hidden="true" />
            Gas/Heating (kWh/month)
          </label>
          <Input
            id="gasKwhPerMonth"
            type="number"
            min="0"
            value={values.gasKwhPerMonth}
            onChange={(e) => onChange('gasKwhPerMonth', parseFloat(e.target.value) || 0)}
            className="bg-slate-900/50 border-white/10"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="heatingType" className="text-sm text-slate-300">Heating type</label>
          <select
            id="heatingType"
            value={values.heatingType}
            onChange={(e) => onChange('heatingType', e.target.value as CarbonFootprintInput['energy']['heatingType'])}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-2 text-slate-100 focus:ring-2 focus:ring-brand-500"
          >
            <option value="gas">Gas boiler</option>
            <option value="electric">Electric heater</option>
            <option value="heatpump">Heat pump</option>
            <option value="oil">Oil boiler</option>
            <option value="district">District heating</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="householdSize" className="flex items-center gap-2 text-sm text-slate-300">
            <Home className="text-brand-400" size={16} aria-hidden="true" />
            Household size
          </label>
          <Input
            id="householdSize"
            type="number"
            min="1"
            value={values.householdSize}
            onChange={(e) => onChange('householdSize', parseFloat(e.target.value) || 1)}
            className="bg-slate-900/50 border-white/10"
          />
        </div>
      </div>
    </div>
  );
}