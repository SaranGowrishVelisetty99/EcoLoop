'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calculator, Target, TrendingDown, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TransportSection } from './TransportSection';
import { EnergySection } from './EnergySection';
import { DietSection } from './DietSection';
import { ConsumptionSection } from './ConsumptionSection';
import { CarbonFootprintInput, CarbonFootprintResult } from '@/types';
import { calculateCarbonFootprint, getDefaultInput } from '@/lib/carbonCalculations';

interface CarbonFootprintCalculatorProps {
  initialResult?: CarbonFootprintResult | null;
  onSave?: (result: CarbonFootprintResult) => Promise<void>;
  readOnly?: boolean;
}

export function CarbonFootprintCalculator({ initialResult, onSave, readOnly = false }: CarbonFootprintCalculatorProps) {
  const [input, setInput] = useState<CarbonFootprintInput>(getDefaultInput());
  const [result, setResult] = useState<CarbonFootprintResult | null>(initialResult ?? null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initialResult) {
      setResult(initialResult);
    }
  }, [initialResult]);

  const handleChange = useCallback((category: keyof CarbonFootprintInput, field: string, value: string | number) => {
    setInput(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
    setSaved(false);
  }, []);

  const handleCalculate = useCallback(() => {
    const calculated = calculateCarbonFootprint(input);
    setResult(calculated);
    setSaved(false);
  }, [input]);

  const handleSave = useCallback(async () => {
    if (!result || !onSave) return;
    setLoading(true);
    try {
      await onSave(result);
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }, [result, onSave]);

  if (!result) {
    return (
      <Card className="p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="text-brand-400" size={24} />
            Carbon Footprint Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-6">
          <TransportSection values={input.transport} onChange={(f, v) => handleChange('transport', f, v)} />
          <EnergySection values={input.energy} onChange={(f, v) => handleChange('energy', f, v)} />
          <DietSection values={input.diet} onChange={(f, v) => handleChange('diet', f, v)} />
          <ConsumptionSection values={input.consumption} onChange={(f, v) => handleChange('consumption', f, v)} />
          
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCalculate} className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={16} />
                  Calculating...
                </>
              ) : (
                'Calculate Footprint'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totalKgCo2PerYear, breakdown, percentiles, averageTotalKgCo2PerYear } = result;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="text-brand-400" size={24} />
            Your Carbon Footprint
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-brand-500/30 bg-brand-500/10 p-6 text-center">
              <p className="text-3xl font-bold text-brand-400">{totalKgCo2PerYear.toLocaleString()}</p>
              <p className="text-sm text-slate-400">kg CO₂/year</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-3xl font-bold text-white">
                {totalKgCo2PerYear > averageTotalKgCo2PerYear ? '+' : ''}
                {((totalKgCo2PerYear - averageTotalKgCo2PerYear) / averageTotalKgCo2PerYear * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-slate-400">vs. average</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-3xl font-bold text-green-400">
                {Math.max(0, averageTotalKgCo2PerYear - totalKgCo2PerYear).toLocaleString()}
              </p>
              <p className="text-sm text-slate-400">kg saved vs avg</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-3xl font-bold text-brand-400">{(totalKgCo2PerYear / 1000).toFixed(1)}</p>
              <p className="text-sm text-slate-400">tonnes CO₂</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(breakdown).map(([category, value]) => (
              <div key={category} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-brand-100">{category}</p>
                <p className="mt-1 text-xl font-semibold text-white">{value.toLocaleString()} kg</p>
                <p className="text-xs text-slate-400">
                  {percentiles[category as keyof typeof percentiles]}% of avg
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TransportSection values={input.transport} onChange={(f, v) => handleChange('transport', f, v)} />
            <EnergySection values={input.energy} onChange={(f, v) => handleChange('energy', f, v)} />
            <DietSection values={input.diet} onChange={(f, v) => handleChange('diet', f, v)} />
            <ConsumptionSection values={input.consumption} onChange={(f, v) => handleChange('consumption', f, v)} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleCalculate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={16} />
                  Recalculate
                </>
              ) : (
                'Recalculate'
              )}
            </Button>
            {onSave && !readOnly && (
              <Button variant="outline" onClick={handleSave} disabled={loading || saved}>
                {saved ? (
                  <>
                    <Save className="mr-2" size={16} />
                    Saved
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={16} />
                    Save to Profile
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}