// Shipping Module Type Definitions

export interface Warehouse {
  id: string;
  warehouse_code: string;
  name_cn: string;
  name_en: string;
  country: string;
  province?: string;
  city?: string;
  address?: string;
  is_active: boolean;
  sort: number;
  created_at?: string;
  updated_at?: string;
}

export interface ShippingCarrier {
  id: string;
  carrier_code: string;
  carrier_name_cn: string;
  carrier_name_en: string;
  carrier_type: string;
  website?: string;
  is_active: boolean;
  sort: number;
  created_at?: string;
  updated_at?: string;
}

export interface ShippingChannel {
  id: string;
  carrier_id: string;
  channel_code: string;
  channel_name_cn: string;
  channel_name_en: string;
  description?: string;
  is_active: boolean;
  sort: number;
  created_at?: string;
  updated_at?: string;
  carrier?: ShippingCarrier;
}

export interface RateMatrix {
  id: string;
  warehouse_id: string;
  channel_id: string;
  destination_country: string;
  weight_min_kg: number;
  weight_max_kg: number;
  first_weight_kg: number;
  first_weight_fee: number;
  additional_weight_step_kg: number;
  additional_fee_per_step: number;
  fuel_surcharge_percent: number;
  min_charge: number;
  currency: string;
  estimated_delivery_days_min: number;
  estimated_delivery_days_max: number;
  remote_area_surcharge: number;
  is_active: boolean;
  effective_from: string;
  effective_until?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  warehouse?: Warehouse;
  channel?: ShippingChannel;
}

export interface RFQShippingQuote {
  id: string;
  rfq_id: string;
  warehouse_id: string;
  channel_id: string;
  destination_country: string;
  product_weight_kg: number;
  base_freight: number;
  fuel_surcharge: number;
  remote_surcharge: number;
  total_freight: number;
  currency: string;
  estimated_delivery_days_min: number;
  estimated_delivery_days_max: number;
  calculation_details?: ShippingCalculationBreakdown;
  is_selected: boolean;
  is_manual: boolean;
  calculated_at: string;
  created_at?: string;
  updated_at?: string;
  warehouse?: Warehouse;
  channel?: ShippingChannel;
}

export interface ShippingCalculationBreakdown {
  weight_kg: number;
  first_weight_kg: number;
  first_weight_fee: number;
  additional_weight_kg: number;
  additional_steps: number;
  additional_weight_step_kg: number;
  additional_fee_per_step: number;
  additional_fees: number;
  base_freight: number;
  fuel_surcharge_percent: number;
  fuel_surcharge: number;
  remote_surcharge: number;
  subtotal: number;
  min_charge: number;
  total_freight: number;
  currency: string;
}

export interface ShippingEstimateRequest {
  weight_kg: number;
  warehouse_id: string;
  destination_country: string;
}

export interface ShippingEstimateResult {
  channel_id: string;
  carrier_name: string;
  channel_name: string;
  base_freight: number;
  fuel_surcharge: number;
  remote_surcharge: number;
  total_freight: number;
  currency: string;
  estimated_delivery_days_min: number;
  estimated_delivery_days_max: number;
  breakdown: ShippingCalculationBreakdown;
}

export interface RateMatrixFilter {
  warehouse_id?: string;
  carrier_id?: string;
  channel_id?: string;
  destination_country?: string;
  is_active?: boolean;
  effective_date?: string;
}

export interface RateMatrixImportData {
  warehouses?: Warehouse[];
  carriers?: ShippingCarrier[];
  channels?: ShippingChannel[];
  rates?: Omit<RateMatrix, 'id' | 'created_at' | 'updated_at'>[];
}

export interface ImportResult {
  success: boolean;
  created: number;
  errors: string[];
}
