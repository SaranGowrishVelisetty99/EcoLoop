import { CarbonFootprintInput, CarbonFootprintResult } from '@/types';

const EMISSION_FACTORS = {
  transport: {
    car: {
      petrol: 0.171,
      diesel: 0.164,
      hybrid: 0.085,
      electric: 0.053,
    },
    publicTransport: 0.041,
    flight: {
      short: 0.15,
      medium: 0.115,
      long: 0.15,
    },
  },
  energy: {
    electricity: 0.233,
    gas: 0.184,
    oil: 0.267,
    district: 0.15,
    heatpump: 0.05,
  },
  diet: {
    'meat-heavy': 3300,
    average: 2500,
    'low-meat': 1700,
    vegetarian: 1300,
    vegan: 1000,
  },
  dietWasteMultiplier: {
    high: 1.3,
    average: 1.15,
    low: 1.0,
  },
  consumption: {
    clothing: 25,
    electronics: 150,
  },
  recyclingMultiplier: {
    high: 0.8,
    average: 1.0,
    low: 1.2,
  },
  secondHandReduction: 0.6,
};

const AVERAGE_FOOTPRINT_PER_CATEGORY = {
  transport: 2800,
  energy: 2200,
  diet: 2500,
  consumption: 1500,
};

const AVERAGE_TOTAL = 9000;

export function calculateCarbonFootprint(input: CarbonFootprintInput): CarbonFootprintResult {
  const transport = calculateTransport(input.transport);
  const energy = calculateEnergy(input.energy);
  const diet = calculateDiet(input.diet);
  const consumption = calculateConsumption(input.consumption);

  const total = transport + energy + diet + consumption;

  return {
    totalKgCo2PerYear: Math.round(total),
    breakdown: {
      transport: Math.round(transport),
      energy: Math.round(energy),
      diet: Math.round(diet),
      consumption: Math.round(consumption),
    },
    percentiles: {
      transport: Math.round((transport / AVERAGE_FOOTPRINT_PER_CATEGORY.transport) * 100),
      energy: Math.round((energy / AVERAGE_FOOTPRINT_PER_CATEGORY.energy) * 100),
      diet: Math.round((diet / AVERAGE_FOOTPRINT_PER_CATEGORY.diet) * 100),
      consumption: Math.round((consumption / AVERAGE_FOOTPRINT_PER_CATEGORY.consumption) * 100),
    },
    averageTotalKgCo2PerYear: AVERAGE_TOTAL,
    lastCalculated: new Date(),
  };
}

function calculateTransport(t: CarbonFootprintInput['transport']): number {
  const carEmissions = t.carKmPerWeek * 52 * EMISSION_FACTORS.transport.car[t.carFuelType];
  const publicTransportEmissions = t.publicTransportKmPerWeek * 52 * EMISSION_FACTORS.transport.publicTransport;
  const flightEmissions = t.flightsPerYear * 
    (t.flightDistance === 'short' ? 500 : t.flightDistance === 'medium' ? 2000 : 8000) * 
    EMISSION_FACTORS.transport.flight[t.flightDistance];
  return carEmissions + publicTransportEmissions + flightEmissions;
}

function calculateEnergy(e: CarbonFootprintInput['energy']): number {
  const electricityEmissions = e.electricityKwhPerMonth * 12 * EMISSION_FACTORS.energy.electricity;
  const heatingTypeMap: Record<string, keyof typeof EMISSION_FACTORS.energy> = {
    gas: 'gas',
    electric: 'electricity',
    heatpump: 'heatpump',
    oil: 'oil',
    district: 'district',
  };
  const heatingKey = heatingTypeMap[e.heatingType] || 'gas';
  const heatingEmissions = e.gasKwhPerMonth * 12 * EMISSION_FACTORS.energy[heatingKey];
  return (electricityEmissions + heatingEmissions) / e.householdSize;
}

function calculateDiet(d: CarbonFootprintInput['diet']): number {
  const baseEmissions = EMISSION_FACTORS.diet[d.dietType];
  const wasteMultiplier = EMISSION_FACTORS.dietWasteMultiplier[d.foodWasteLevel];
  const localReduction = 1 - (d.localFoodPercentage / 100) * 0.1;
  return baseEmissions * wasteMultiplier * localReduction;
}

function calculateConsumption(c: CarbonFootprintInput['consumption']): number {
  const clothingEmissions = c.clothingItemsPerYear * EMISSION_FACTORS.consumption.clothing * 
    (1 - (c.secondHandPercentage / 100) * EMISSION_FACTORS.secondHandReduction);
  const electronicsEmissions = c.electronicsItemsPerYear * EMISSION_FACTORS.consumption.electronics;
  const recyclingMultiplier = EMISSION_FACTORS.recyclingMultiplier[c.recyclingRate];
  return (clothingEmissions + electronicsEmissions) * recyclingMultiplier;
}

export function getDefaultInput(): CarbonFootprintInput {
  return {
    transport: {
      carKmPerWeek: 100,
      carFuelType: 'petrol',
      publicTransportKmPerWeek: 50,
      flightsPerYear: 2,
      flightDistance: 'medium',
    },
    energy: {
      electricityKwhPerMonth: 300,
      gasKwhPerMonth: 200,
      heatingType: 'gas',
      householdSize: 2,
    },
    diet: {
      dietType: 'average',
      foodWasteLevel: 'average',
      localFoodPercentage: 20,
    },
    consumption: {
      clothingItemsPerYear: 20,
      electronicsItemsPerYear: 2,
      recyclingRate: 'average',
      secondHandPercentage: 10,
    },
  };
}