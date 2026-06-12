export interface ScanDoc {
  id: string;
  detectedObject?: string;
  materialType?: string;
  conditionAssessment?: string;
  confidenceScore?: number;
  createdAt?: { seconds?: number };
  imageUrl?: string;
  suggestions?: Array<{
    id?: string;
    title?: string;
    description?: string;
    difficulty?: string;
    estimatedTimeMinutes?: number;
    materialsNeeded?: string[];
    steps?: string[];
    estimatedCo2SavedKg?: number;
  }>;
}

export interface ProjectDoc {
  id: string;
  scanId: string;
  suggestionId?: string;
  status?: 'saved' | 'in_progress' | 'completed';
  updatedAt?: { seconds?: number };
  startedAt?: { seconds?: number };
  completedAt?: { seconds?: number } | null;
  suggestionTitle?: string;
  pointsAwarded?: boolean;
  pointsAwardedAt?: { seconds?: number };
}

export interface UserDoc {
  uid: string;
  username: string;
  email: string;
  points: number;
  createdAt?: { seconds?: number };
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTimeMinutes: number;
  materialsNeeded: string[];
  steps: string[];
  estimatedCo2SavedKg: number;
}

export interface CarbonFootprintInput {
  transport: {
    carKmPerWeek: number;
    carFuelType: 'petrol' | 'diesel' | 'hybrid' | 'electric';
    publicTransportKmPerWeek: number;
    flightsPerYear: number;
    flightDistance: 'short' | 'medium' | 'long';
  };
  energy: {
    electricityKwhPerMonth: number;
    gasKwhPerMonth: number;
    heatingType: 'gas' | 'electric' | 'heatpump' | 'oil' | 'district';
    householdSize: number;
  };
  diet: {
    dietType: 'meat-heavy' | 'average' | 'low-meat' | 'vegetarian' | 'vegan';
    foodWasteLevel: 'high' | 'average' | 'low';
    localFoodPercentage: number;
  };
  consumption: {
    clothingItemsPerYear: number;
    electronicsItemsPerYear: number;
    recyclingRate: 'high' | 'average' | 'low';
    secondHandPercentage: number;
  };
}

export interface CarbonFootprintResult {
  totalKgCo2PerYear: number;
  breakdown: {
    transport: number;
    energy: number;
    diet: number;
    consumption: number;
  };
  percentiles: {
    transport: number;
    energy: number;
    diet: number;
    consumption: number;
  };
  averageTotalKgCo2PerYear: number;
  lastCalculated: Date;
}

export interface CarbonFootprintGoal {
  id: string;
  userId: string;
  targetReductionPercentage: number;
  targetDate: Date;
  baselineTotalKgCo2: number;
  currentTotalKgCo2: number;
  status: 'active' | 'achieved' | 'expired';
  createdAt: Date;
}

export interface CarbonAction {
  id: string;
  userId: string;
  category: 'transport' | 'energy' | 'diet' | 'consumption';
  action: string;
  estimatedKgCo2Saved: number;
  completedAt: Date;
  verified: boolean;
}

export interface CarbonFootprintHistoryEntry {
  date: Date;
  totalKgCo2: number;
  breakdown: {
    transport: number;
    energy: number;
    diet: number;
    consumption: number;
  };
}