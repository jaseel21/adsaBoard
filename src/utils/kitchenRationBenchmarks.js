/**
 * Kitchen Ration & Meal Cost Calculation Benchmarks
 * Standardized portion allocations for Alathurpadi Dars dining mess.
 */

export const RATION_BENCHMARKS = {
  // Grams per active consumer per meal
  PORTIONS: {
    riceGrams: 185,             // Standard cooked rice equivalent per student
    beefGrams: 155,             // Raw beef allocation per meat-eating diner
    chickenGrams: 150,          // Raw chicken allocation per meat-eating diner
    fishGrams: 145,             // Raw fish allocation per fish-eating diner
    vegetableGrams: 90,         // Mixed vegetables for curries / sides
    dhalGrams: 45,              // Pulses / lentils for sambar / parippu
    oilMl: 22,                  // Cooking oil per meal
    onionGrams: 35,             // Onions & shallots
  },

  // Average estimated cost per meal component (INR ₹)
  ECONOMICS: {
    averageMealCostINR: 42,     // Standard full mess meal nominal cost
    breakfastUnitCostINR: 28,   // Breakfast nominal unit cost
    lunchUnitCostINR: 52,       // Lunch nominal unit cost
    grainSavingsPerKgINR: 48,   // Rice cost per kg
    meatSavingsPerKgINR: 360,   // Protein cost per kg average
  },

  // Traditional Kitchen Unit Converters
  UNITS: {
    CHAKKU_KG: 50,              // 1 Chakku = 50 kg (Standard rice sack)
    PADI_KG: 1.25,              // 1 Traditional Padi ≈ 1.25 kg
  },
};

/**
 * Calculates raw kitchen ingredient projections based on active diners and dietary avoidances
 */
export function calculateKitchenRations({
  activeDiners = 0,
  beefConsumers = 0,
  chickenConsumers = 0,
  fishConsumers = 0,
  meal = 'lunch',
}) {
  const isBreakfast = meal === 'breakfast';
  const p = RATION_BENCHMARKS.PORTIONS;

  // For breakfast, grain requirements are slightly lighter (e.g. appam, pathiri, kanji)
  const grainMultiplier = isBreakfast ? 0.75 : 1.0;
  const totalRiceKg = Number(((activeDiners * p.riceGrams * grainMultiplier) / 1000).toFixed(1));
  const totalVegKg = Number(((activeDiners * p.vegetableGrams) / 1000).toFixed(1));
  const totalDhalKg = Number(((activeDiners * p.dhalGrams) / 1000).toFixed(1));

  // Protein requirements deduct avoiders
  const totalBeefKg = isBreakfast ? 0 : Number(((beefConsumers * p.beefGrams) / 1000).toFixed(1));
  const totalChickenKg = isBreakfast ? 0 : Number(((chickenConsumers * p.chickenGrams) / 1000).toFixed(1));
  const totalFishKg = isBreakfast ? 0 : Number(((fishConsumers * p.fishGrams) / 1000).toFixed(1));

  // Traditional Sacks
  const riceSacks = (totalRiceKg / RATION_BENCHMARKS.UNITS.CHAKKU_KG).toFixed(1);

  return {
    activeDiners,
    totalRiceKg,
    riceSacks,
    totalBeefKg,
    totalChickenKg,
    totalFishKg,
    totalVegKg,
    totalDhalKg,
    cookingOilLiters: Number(((activeDiners * p.oilMl) / 1000).toFixed(1)),
    onionsKg: Number(((activeDiners * p.onionGrams) / 1000).toFixed(1)),
  };
}

/**
 * Estimates food waste prevention economics achieved through timely token opt-outs
 */
export function calculateWastePreventionEconomics({
  optedOutCount = 0,
  meal = 'lunch',
}) {
  const isLunch = meal === 'lunch';
  const unitCost = isLunch
    ? RATION_BENCHMARKS.ECONOMICS.lunchUnitCostINR
    : RATION_BENCHMARKS.ECONOMICS.breakfastUnitCostINR;

  const totalCostSavedINR = optedOutCount * unitCost;
  const grainSavedKg = Number(((optedOutCount * RATION_BENCHMARKS.PORTIONS.riceGrams) / 1000).toFixed(1));
  const proteinSavedKg = isLunch
    ? Number(((optedOutCount * 0.7 * RATION_BENCHMARKS.PORTIONS.beefGrams) / 1000).toFixed(1))
    : 0;

  return {
    optedOutCount,
    totalCostSavedINR,
    grainSavedKg,
    proteinSavedKg,
    totalEstimatedFoodSavedKg: Number((grainSavedKg + proteinSavedKg).toFixed(1)),
  };
}
