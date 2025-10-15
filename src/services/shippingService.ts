// Shipping service - Database operations and business logic

import { supabase } from '@/integrations/supabase/client';
import { calculateShippingCost } from '@/lib/shippingCalculator';
import {
  Warehouse,
  ShippingCarrier,
  ShippingChannel,
  RateMatrix,
  RFQShippingQuote,
  RateMatrixFilter,
  ShippingEstimateResult,
} from '@/types/shipping';

// ============= Warehouse Operations =============

export async function getWarehouses(): Promise<Warehouse[]> {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .order('sort', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getActiveWarehouses(): Promise<Warehouse[]> {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .eq('is_active', true)
    .order('sort', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createWarehouse(warehouse: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>): Promise<Warehouse> {
  const { data, error } = await supabase
    .from('warehouses')
    .insert(warehouse)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWarehouse(id: string, warehouse: Partial<Warehouse>): Promise<Warehouse> {
  const { data, error } = await supabase
    .from('warehouses')
    .update(warehouse)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWarehouse(id: string): Promise<void> {
  const { error } = await supabase.from('warehouses').delete().eq('id', id);
  if (error) throw error;
}

// ============= Carrier Operations =============

export async function getCarriers(): Promise<ShippingCarrier[]> {
  const { data, error } = await supabase
    .from('shipping_carriers')
    .select('*')
    .order('sort', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getActiveCarriers(): Promise<ShippingCarrier[]> {
  const { data, error } = await supabase
    .from('shipping_carriers')
    .select('*')
    .eq('is_active', true)
    .order('sort', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createCarrier(carrier: Omit<ShippingCarrier, 'id' | 'created_at' | 'updated_at'>): Promise<ShippingCarrier> {
  const { data, error } = await supabase
    .from('shipping_carriers')
    .insert(carrier)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCarrier(id: string, carrier: Partial<ShippingCarrier>): Promise<ShippingCarrier> {
  const { data, error } = await supabase
    .from('shipping_carriers')
    .update(carrier)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCarrier(id: string): Promise<void> {
  const { error } = await supabase.from('shipping_carriers').delete().eq('id', id);
  if (error) throw error;
}

// ============= Channel Operations =============

export async function getChannels(): Promise<ShippingChannel[]> {
  const { data, error } = await supabase
    .from('shipping_channels')
    .select(`
      *,
      carrier:shipping_carriers(*)
    `)
    .order('sort', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getChannelsByCarrier(carrierId: string): Promise<ShippingChannel[]> {
  const { data, error } = await supabase
    .from('shipping_channels')
    .select('*')
    .eq('carrier_id', carrierId)
    .order('sort', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getActiveChannels(): Promise<ShippingChannel[]> {
  const { data, error } = await supabase
    .from('shipping_channels')
    .select(`
      *,
      carrier:shipping_carriers(*)
    `)
    .eq('is_active', true)
    .order('sort', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createChannel(channel: Omit<ShippingChannel, 'id' | 'created_at' | 'updated_at'>): Promise<ShippingChannel> {
  const { data, error } = await supabase
    .from('shipping_channels')
    .insert(channel)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateChannel(id: string, channel: Partial<ShippingChannel>): Promise<ShippingChannel> {
  const { data, error } = await supabase
    .from('shipping_channels')
    .update(channel)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteChannel(id: string): Promise<void> {
  const { error } = await supabase.from('shipping_channels').delete().eq('id', id);
  if (error) throw error;
}

// ============= Rate Matrix Operations =============

export async function getRateMatrix(filters?: RateMatrixFilter): Promise<RateMatrix[]> {
  let query = supabase
    .from('rate_matrix')
    .select(`
      *,
      warehouse:warehouses(*),
      channel:shipping_channels(*, carrier:shipping_carriers(*))
    `);

  if (filters?.warehouse_id) {
    query = query.eq('warehouse_id', filters.warehouse_id);
  }
  if (filters?.channel_id) {
    query = query.eq('channel_id', filters.channel_id);
  }
  if (filters?.destination_country) {
    query = query.eq('destination_country', filters.destination_country);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }
  if (filters?.effective_date) {
    query = query
      .lte('effective_from', filters.effective_date)
      .or(`effective_until.is.null,effective_until.gte.${filters.effective_date}`);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function findApplicableRate(
  weight: number,
  warehouseId: string,
  channelId: string,
  destination: string
): Promise<RateMatrix | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('rate_matrix')
    .select(`
      *,
      warehouse:warehouses(*),
      channel:shipping_channels(*, carrier:shipping_carriers(*))
    `)
    .eq('warehouse_id', warehouseId)
    .eq('channel_id', channelId)
    .eq('destination_country', destination)
    .eq('is_active', true)
    .lte('weight_min_kg', weight)
    .gte('weight_max_kg', weight)
    .lte('effective_from', today)
    .or(`effective_until.is.null,effective_until.gte.${today}`)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0] || null;
}

export async function createRateMatrix(rate: Omit<RateMatrix, 'id' | 'created_at' | 'updated_at'>): Promise<RateMatrix> {
  const { data, error } = await supabase
    .from('rate_matrix')
    .insert(rate)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRateMatrix(id: string, rate: Partial<RateMatrix>): Promise<RateMatrix> {
  const { data, error } = await supabase
    .from('rate_matrix')
    .update(rate)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRateMatrix(id: string): Promise<void> {
  const { error } = await supabase.from('rate_matrix').delete().eq('id', id);
  if (error) throw error;
}

// ============= Shipping Quote Operations =============

/**
 * Calculate shipping quote for a specific channel
 * Includes error handling and validation
 * 
 * @param weight - Product weight in kg
 * @param warehouseId - Warehouse UUID
 * @param channelId - Shipping channel UUID
 * @param destination - Destination country code
 * @returns Shipping estimate or null if no rate available
 */
export async function calculateShippingQuote(
  weight: number,
  warehouseId: string,
  channelId: string,
  destination: string
): Promise<ShippingEstimateResult | null> {
  // Input validation
  if (!weight || weight <= 0) {
    throw new Error('Weight must be greater than 0');
  }
  if (weight > 1000) {
    throw new Error('Weight exceeds maximum limit (1000kg)');
  }
  if (!warehouseId || !channelId || !destination) {
    throw new Error('Missing required parameters');
  }

  const rate = await findApplicableRate(weight, warehouseId, channelId, destination);
  
  if (!rate) {
    console.warn(`No applicable rate found for: ${weight}kg, ${warehouseId}, ${channelId}, ${destination}`);
    return null;
  }

  try {
    const breakdown = calculateShippingCost({ weight_kg: weight, rate });

    return {
      channel_id: rate.channel_id,
      carrier_name: rate.channel?.carrier?.carrier_name_cn || 'Unknown Carrier',
      channel_name: rate.channel?.channel_name_cn || 'Unknown Channel',
      base_freight: breakdown.base_freight,
      fuel_surcharge: breakdown.fuel_surcharge,
      remote_surcharge: breakdown.remote_surcharge,
      total_freight: breakdown.total_freight,
      currency: breakdown.currency,
      estimated_delivery_days_min: rate.estimated_delivery_days_min,
      estimated_delivery_days_max: rate.estimated_delivery_days_max,
      breakdown,
    };
  } catch (error) {
    console.error('Failed to calculate shipping quote:', error);
    throw new Error(`Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate shipping quotes for all available channels
 * Optimized with parallel processing and error recovery
 * 
 * @param weight - Product weight in kg
 * @param warehouseId - Warehouse UUID
 * @param destination - Destination country code
 * @returns Array of shipping estimates sorted by price
 */
export async function calculateMultipleQuotes(
  weight: number,
  warehouseId: string,
  destination: string
): Promise<ShippingEstimateResult[]> {
  // Input validation
  if (!weight || weight <= 0) {
    throw new Error('Weight must be greater than 0');
  }
  if (!warehouseId || !destination) {
    throw new Error('Warehouse and destination are required');
  }

  try {
    // Get all active channels
    const channels = await getActiveChannels();
    
    if (channels.length === 0) {
      console.warn('No active shipping channels available');
      return [];
    }

    // Calculate quote for each channel with error recovery
    const quotePromises = channels.map(async channel => {
      try {
        return await calculateShippingQuote(weight, warehouseId, channel.id, destination);
      } catch (error) {
        console.warn(`Failed to calculate quote for channel ${channel.channel_name_cn}:`, error);
        return null;
      }
    });

    const quotes = await Promise.all(quotePromises);

    // Filter out null results and sort by price
    const validQuotes = quotes.filter((q): q is ShippingEstimateResult => q !== null);
    
    return validQuotes.sort((a, b) => a.total_freight - b.total_freight);
  } catch (error) {
    console.error('Failed to calculate multiple quotes:', error);
    throw new Error('Failed to retrieve shipping options. Please try again.');
  }
}

export async function saveShippingQuote(
  rfqId: string,
  quote: Omit<RFQShippingQuote, 'id' | 'rfq_id' | 'created_at' | 'updated_at'>
): Promise<RFQShippingQuote> {
  const insertData: any = {
    rfq_id: rfqId,
    warehouse_id: quote.warehouse_id,
    channel_id: quote.channel_id,
    destination_country: quote.destination_country,
    product_weight_kg: quote.product_weight_kg,
    base_freight: quote.base_freight,
    fuel_surcharge: quote.fuel_surcharge,
    remote_surcharge: quote.remote_surcharge,
    total_freight: quote.total_freight,
    currency: quote.currency,
    estimated_delivery_days_min: quote.estimated_delivery_days_min,
    estimated_delivery_days_max: quote.estimated_delivery_days_max,
    calculation_details: quote.calculation_details,
    is_selected: quote.is_selected,
    is_manual: quote.is_manual,
    calculated_at: quote.calculated_at,
  };

  const { data, error } = await supabase
    .from('rfq_shipping_quotes')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as RFQShippingQuote;
}

export async function updateShippingQuoteSelection(rfqId: string, quoteId: string): Promise<void> {
  // First, unset all selections for this RFQ
  await supabase
    .from('rfq_shipping_quotes')
    .update({ is_selected: false })
    .eq('rfq_id', rfqId);

  // Then set the selected quote
  const { error } = await supabase
    .from('rfq_shipping_quotes')
    .update({ is_selected: true })
    .eq('id', quoteId)
    .eq('rfq_id', rfqId);

  if (error) throw error;
}

export async function getShippingQuotesForRFQ(rfqId: string): Promise<RFQShippingQuote[]> {
  const { data, error } = await supabase
    .from('rfq_shipping_quotes')
    .select(`
      *,
      warehouse:warehouses(*),
      channel:shipping_channels(*, carrier:shipping_carriers(*))
    `)
    .eq('rfq_id', rfqId)
    .order('total_freight', { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as RFQShippingQuote[];
}

export async function deleteShippingQuotesForRFQ(rfqId: string): Promise<void> {
  const { error } = await supabase
    .from('rfq_shipping_quotes')
    .delete()
    .eq('rfq_id', rfqId);

  if (error) throw error;
}

// ============= Helper Functions =============

export async function getDefaultWarehouse(): Promise<Warehouse | null> {
  const warehouses = await getActiveWarehouses();
  return warehouses[0] || null;
}

export async function getAvailableChannelsForDestination(
  warehouseId: string,
  destination: string
): Promise<ShippingChannel[]> {
  // Get distinct channels that have rates for this warehouse-destination combo
  const { data, error } = await supabase
    .from('rate_matrix')
    .select(`
      channel_id,
      channel:shipping_channels(*, carrier:shipping_carriers(*))
    `)
    .eq('warehouse_id', warehouseId)
    .eq('destination_country', destination)
    .eq('is_active', true);

  if (error) throw error;

  // Extract unique channels
  const uniqueChannels = new Map<string, ShippingChannel>();
  data?.forEach((item: any) => {
    if (item.channel && item.channel.is_active) {
      uniqueChannels.set(item.channel.id, item.channel);
    }
  });

  return Array.from(uniqueChannels.values());
}
