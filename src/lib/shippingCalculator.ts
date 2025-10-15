// Pure shipping cost calculation functions (no database access)

import { RateMatrix, ShippingCalculationBreakdown } from '@/types/shipping';

export interface CalculateShippingCostParams {
  weight_kg: number;
  rate: RateMatrix;
}

/**
 * Calculate shipping cost based on weight and rate matrix
 * Pure function with no side effects or database access
 * 
 * Algorithm:
 * 1. Calculate additional weight beyond first weight
 * 2. Calculate number of steps using Math.ceil
 * 3. Calculate base_freight = first_fee + (steps × fee_per_step)
 * 4. Apply fuel surcharge = base_freight × (fuel_percent / 100)
 * 5. Add remote area surcharge if applicable
 * 6. Ensure minimum charge is met
 * 7. Return detailed breakdown
 */
export function calculateShippingCost(params: CalculateShippingCostParams): ShippingCalculationBreakdown {
  const { weight_kg, rate } = params;

  // Ensure weight is within rate range
  if (weight_kg < rate.weight_min_kg || weight_kg > rate.weight_max_kg) {
    throw new Error(
      `Weight ${weight_kg}kg is outside the valid range ${rate.weight_min_kg}-${rate.weight_max_kg}kg`
    );
  }

  // Calculate additional weight beyond first weight
  const additional_weight_kg = Math.max(0, weight_kg - rate.first_weight_kg);

  // Calculate number of additional steps (ceiling division)
  const additional_steps = additional_weight_kg > 0 
    ? Math.ceil(additional_weight_kg / rate.additional_weight_step_kg)
    : 0;

  // Calculate additional fees
  const additional_fees = additional_steps * rate.additional_fee_per_step;

  // Calculate base freight (before surcharges)
  const base_freight = rate.first_weight_fee + additional_fees;

  // Calculate fuel surcharge
  const fuel_surcharge = base_freight * (rate.fuel_surcharge_percent / 100);

  // Remote area surcharge (fixed amount)
  const remote_surcharge = rate.remote_area_surcharge;

  // Calculate subtotal
  const subtotal = base_freight + fuel_surcharge + remote_surcharge;

  // Ensure minimum charge is met
  const total_freight = Math.max(subtotal, rate.min_charge);

  return {
    weight_kg,
    first_weight_kg: rate.first_weight_kg,
    first_weight_fee: rate.first_weight_fee,
    additional_weight_kg,
    additional_steps,
    additional_weight_step_kg: rate.additional_weight_step_kg,
    additional_fee_per_step: rate.additional_fee_per_step,
    additional_fees,
    base_freight,
    fuel_surcharge_percent: rate.fuel_surcharge_percent,
    fuel_surcharge,
    remote_surcharge,
    subtotal,
    min_charge: rate.min_charge,
    total_freight,
    currency: rate.currency,
  };
}

/**
 * Validate rate matrix data
 */
export function validateRateMatrix(rate: Partial<RateMatrix>): string[] {
  const errors: string[] = [];

  if (!rate.weight_min_kg || rate.weight_min_kg <= 0) {
    errors.push('Minimum weight must be greater than 0');
  }

  if (!rate.weight_max_kg || rate.weight_max_kg <= 0) {
    errors.push('Maximum weight must be greater than 0');
  }

  if (rate.weight_min_kg && rate.weight_max_kg && rate.weight_min_kg >= rate.weight_max_kg) {
    errors.push('Minimum weight must be less than maximum weight');
  }

  if (!rate.first_weight_kg || rate.first_weight_kg <= 0) {
    errors.push('First weight must be greater than 0');
  }

  if (!rate.first_weight_fee || rate.first_weight_fee < 0) {
    errors.push('First weight fee cannot be negative');
  }

  if (!rate.additional_weight_step_kg || rate.additional_weight_step_kg <= 0) {
    errors.push('Additional weight step must be greater than 0');
  }

  if (!rate.additional_fee_per_step || rate.additional_fee_per_step < 0) {
    errors.push('Additional fee per step cannot be negative');
  }

  if (rate.fuel_surcharge_percent !== undefined && rate.fuel_surcharge_percent < 0) {
    errors.push('Fuel surcharge percentage cannot be negative');
  }

  if (rate.min_charge !== undefined && rate.min_charge < 0) {
    errors.push('Minimum charge cannot be negative');
  }

  if (rate.estimated_delivery_days_min && rate.estimated_delivery_days_max) {
    if (rate.estimated_delivery_days_min > rate.estimated_delivery_days_max) {
      errors.push('Minimum delivery days must be less than or equal to maximum');
    }
  }

  return errors;
}

/**
 * Check if two weight ranges overlap
 */
export function checkWeightRangeOverlap(
  range1: { min: number; max: number },
  range2: { min: number; max: number }
): boolean {
  return range1.min < range2.max && range2.min < range1.max;
}
