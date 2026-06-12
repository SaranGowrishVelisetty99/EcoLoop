'use client';

import { Car, Bus, Plane } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CarbonFootprintInput } from '@/types';

interface TransportSectionProps {
  values: CarbonFootprintInput['transport'];
  onChange: (field: keyof CarbonFootprintInput['transport'], value: string | number) => void;
}

export function TransportSection({ values, onChange }: TransportSectionProps) {
  return (
    <div className="space-y-4" aria-labelledby="transport-heading">
      <h3 id="transport-heading" className="flex items-center gap-2 text-lg font-semibold text-white">
        <Car className="text-brand-400" size={22} aria-hidden="true" />
        Transport
      </h3>
      <p className="text-sm text-slate-400">Weekly travel and annual flights</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="carKmPerWeek" className="text-sm text-slate-300">Car km per week</label>
          <Input
            id="carKmPerWeek"
            type="number"
            min="0"
            value={values.carKmPerWeek}
            onChange={(e) => onChange('carKmPerWeek', parseFloat(e.target.value) || 0)}
            className="bg-slate-900/50 border-white/10"
            aria-describedby="carKmHint"
          />
          <p id="carKmHint" className="text-xs text-slate-500">Daily commute + errands</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="carFuelType" className="text-sm text-slate-300">Fuel type</label>
          <select
            id="carFuelType"
            value={values.carFuelType}
            onChange={(e) => onChange('carFuelType', e.target.value as CarbonFootprintInput['transport']['carFuelType'])}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-2 text-slate-100 focus:ring-2 focus:ring-brand-500"
          >
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="publicTransportKmPerWeek" className="flex items-center gap-2 text-sm text-slate-300">
            <Bus className="text-brand-400" size={16} aria-hidden="true" />
            Public transport km/week
          </label>
          <Input
            id="publicTransportKmPerWeek"
            type="number"
            min="0"
            value={values.publicTransportKmPerWeek}
            onChange={(e) => onChange('publicTransportKmPerWeek', parseFloat(e.target.value) || 0)}
            className="bg-slate-900/50 border-white/10"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="flightsPerYear" className="flex items-center gap-2 text-sm text-slate-300">
            <Plane className="text-brand-400" size={16} aria-hidden="true" />
            Flights per year
          </label>
          <Input
            id="flightsPerYear"
            type="number"
            min="0"
            value={values.flightsPerYear}
            onChange={(e) => onChange('flightsPerYear', parseFloat(e.target.value) || 0)}
            className="bg-slate-900/50 border-white/10"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="flightDistance" className="text-sm text-slate-300">Typical flight distance</label>
          <select
            id="flightDistance"
            value={values.flightDistance}
            onChange={(e) => onChange('flightDistance', e.target.value as CarbonFootprintInput['transport']['flightDistance'])}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-2 text-slate-100 focus:ring-2 focus:ring-brand-500"
          >
            <option value="short">Short (&lt; 800 km)</option>
            <option value="medium">Medium (800-3000 km)</option>
            <option value="long">Long (&gt; 3000 km)</option>
          </select>
        </div>
      </div>
    </div>
  );
}