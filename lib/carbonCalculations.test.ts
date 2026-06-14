import { calculateCarbonFootprint, getDefaultInput } from './carbonCalculations';
import { CarbonFootprintInput } from '@/types';

describe('carbonCalculations', () => {
  it('should calculate footprint with default input correctly', () => {
    const input = getDefaultInput();
    const result = calculateCarbonFootprint(input);

    expect(result.totalKgCo2PerYear).toBeGreaterThan(0);
    expect(result.breakdown.transport).toBeGreaterThan(0);
    expect(result.breakdown.energy).toBeGreaterThan(0);
    expect(result.breakdown.diet).toBeGreaterThan(0);
    expect(result.breakdown.consumption).toBeGreaterThan(0);
    expect(result.averageTotalKgCo2PerYear).toBe(9000);
    expect(result.lastCalculated).toBeInstanceOf(Date);
  });

  it('should reflect changes in car usage frequency', () => {
    const lowUsage = { ...getDefaultInput(), transport: { ...getDefaultInput().transport, carKmPerWeek: 10 } };
    const highUsage = { ...getDefaultInput(), transport: { ...getDefaultInput().transport, carKmPerWeek: 500 } };

    const lowResult = calculateCarbonFootprint(lowUsage as CarbonFootprintInput);
    const highResult = calculateCarbonFootprint(highUsage as CarbonFootprintInput);

    expect(highResult.breakdown.transport).toBeGreaterThan(lowResult.breakdown.transport);
  });

  it('should calculate energy per person based on household size', () => {
    const singlePerson = { ...getDefaultInput(), energy: { ...getDefaultInput().energy, householdSize: 1 } };
    const family = { ...getDefaultInput(), energy: { ...getDefaultInput().energy, householdSize: 4 } };

    const singleResult = calculateCarbonFootprint(singlePerson as CarbonFootprintInput);
    const familyResult = calculateCarbonFootprint(family as CarbonFootprintInput);

    // For same total monthly usage, family per-person should be lower
    expect(familyResult.breakdown.energy).toBe(singleResult.breakdown.energy / 4);
  });

  it('should reduce diet footprint for vegans vs meat-heavy', () => {
    const meatInput = { ...getDefaultInput(), diet: { ...getDefaultInput().diet, dietType: 'meat-heavy' } };
    const veganInput = { ...getDefaultInput(), diet: { ...getDefaultInput().diet, dietType: 'vegan' } };

    const meatResult = calculateCarbonFootprint(meatInput as CarbonFootprintInput);
    const veganResult = calculateCarbonFootprint(veganInput as CarbonFootprintInput);

    expect(veganResult.breakdown.diet).toBeLessThan(meatResult.breakdown.diet);
  });

  it('should apply second-hand reduction in consumption', () => {
    const newItemsOnly = { ...getDefaultInput(), consumption: { ...getDefaultInput().consumption, secondHandPercentage: 0 } };
    const mixedItems = { ...getDefaultInput(), consumption: { ...getDefaultInput().consumption, secondHandPercentage: 50 } };

    const newResult = calculateCarbonFootprint(newItemsOnly as CarbonFootprintInput);
    const mixedResult = calculateCarbonFootprint(mixedItems as CarbonFootprintInput);

    expect(mixedResult.breakdown.consumption).toBeLessThan(newResult.breakdown.consumption);
  });

  it('should provide a valid default input', () => {
    const input = getDefaultInput();
    expect(input.transport.carFuelType).toBe('petrol');
    expect(input.energy.householdSize).toBe(2);
  });
});