# Shipping Module Documentation

## Overview
Complete shipping cost calculation and management system for RFQ platform. Handles multi-carrier shipping quotes, rate matrices, and automatic cost calculation.

## Architecture

### Core Components

#### 1. ShippingSelector (`src/components/rfq/ShippingSelector.tsx`)
Main component for displaying and selecting shipping options.

**Features:**
- Real-time shipping cost calculation
- Multiple carrier comparison
- Auto-selection of cheapest option
- Expandable cost breakdown
- Debounced calculations (500ms)
- Response caching (5min TTL)
- Error handling with retry logic
- Mobile-responsive design

**Props:**
```typescript
interface ShippingSelectorProps {
  weight: number;              // Product weight in kg
  destinationCountry: string;  // ISO country code
  warehouseId?: string;        // Warehouse UUID
  selectedQuoteId?: string;    // Currently selected quote
  onSelectQuote: (quote: RFQShippingQuote) => void;
  readOnly?: boolean;          // Disable selection
}
```

**Usage:**
```tsx
<ShippingSelector
  weight={25.5}
  destinationCountry="US"
  warehouseId={warehouse.id}
  selectedQuoteId={selected?.id}
  onSelectQuote={(quote) => setSelectedQuote(quote)}
/>
```

#### 2. ShippingSummary (`src/components/rfq/ShippingSummary.tsx`)
Displays shipping information in compact or detailed format.

**Features:**
- Compact mode for tables
- Detailed mode for panels
- Tooltips for mobile
- Responsive layout

**Props:**
```typescript
interface ShippingSummaryProps {
  quote: RFQShippingQuote;
  compact?: boolean;  // Default: false
}
```

#### 3. ShippingQuoteSelector (`src/components/rfq/ShippingQuoteSelector.tsx`)
Manages shipping quote selection for saved RFQs.

**Features:**
- View all calculated quotes
- Select shipping option
- Save selection to database
- Detailed breakdown view

### Services

#### Shipping Service (`src/services/shippingService.ts`)

**Key Functions:**

##### Warehouse Operations
```typescript
getWarehouses(): Promise<Warehouse[]>
getActiveWarehouses(): Promise<Warehouse[]>
createWarehouse(warehouse): Promise<Warehouse>
updateWarehouse(id, warehouse): Promise<Warehouse>
deleteWarehouse(id): Promise<void>
```

##### Carrier & Channel Operations
```typescript
getCarriers(): Promise<ShippingCarrier[]>
getChannels(): Promise<ShippingChannel[]>
createChannel(channel): Promise<ShippingChannel>
```

##### Rate Matrix Operations
```typescript
getRateMatrix(filters?): Promise<RateMatrix[]>
findApplicableRate(weight, warehouse, channel, destination): Promise<RateMatrix | null>
createRateMatrix(rate): Promise<RateMatrix>
```

##### Quote Calculations
```typescript
// Single channel quote
calculateShippingQuote(
  weight: number,
  warehouseId: string,
  channelId: string,
  destination: string
): Promise<ShippingEstimateResult | null>

// Multiple channels (all available)
calculateMultipleQuotes(
  weight: number,
  warehouseId: string,
  destination: string
): Promise<ShippingEstimateResult[]>

// Save quote to RFQ
saveShippingQuote(rfqId, quote): Promise<RFQShippingQuote>

// Update selection
updateShippingQuoteSelection(rfqId, quoteId): Promise<void>
```

#### Shipping Calculator (`src/lib/shippingCalculator.ts`)
Pure calculation functions with no database dependencies.

**Main Function:**
```typescript
calculateShippingCost(params: {
  weight_kg: number;
  rate: RateMatrix;
}): ShippingCalculationBreakdown
```

**Calculation Algorithm:**
1. Validate weight is within rate range
2. Calculate additional weight beyond first weight
3. Calculate steps: `Math.ceil(additionalWeight / stepSize)`
4. Base freight: `firstFee + (steps × feePerStep)`
5. Fuel surcharge: `baseFee × (fuelPercent / 100)`
6. Add remote area surcharge (fixed)
7. Ensure minimum charge is met
8. Return detailed breakdown

**Validation Functions:**
```typescript
validateRateMatrix(rate): string[]  // Returns validation errors
checkWeightRangeOverlap(range1, range2): boolean
```

## Data Models

### RFQShippingQuote
```typescript
interface RFQShippingQuote {
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
  warehouse?: Warehouse;
  channel?: ShippingChannel;
}
```

### RateMatrix
```typescript
interface RateMatrix {
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
}
```

## Admin Features

### Rate Matrix Manager
Location: `src/components/admin/RateMatrixManager.tsx`

**Features:**
- CRUD operations for rate matrices
- Bulk import from Excel/CSV
- Export to CSV
- Analytics dashboard:
  - Total rates count
  - Active rates percentage
  - Countries covered
  - Average delivery time
- Validation and error handling
- Weight range overlap detection

**Usage:**
```tsx
<RateMatrixManager />
```

### Warehouse Manager
Location: `src/components/admin/WarehouseManager.tsx`

**Features:**
- Add/edit/delete warehouses
- Set active/inactive status
- Sort order management
- Country/province/city fields

### Carrier & Channel Manager
Location: `src/components/admin/CarrierChannelManager.tsx`

**Features:**
- Manage shipping carriers
- Manage shipping channels
- Link channels to carriers
- Set active/inactive status

## Integration Guide

### Adding Shipping to RFQ Form

```tsx
import { ShippingSelector } from '@/components/rfq/ShippingSelector';

function RFQForm() {
  const [includeShipping, setIncludeShipping] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<RFQShippingQuote>();

  return (
    <>
      <Switch
        checked={includeShipping}
        onCheckedChange={setIncludeShipping}
        label="Include Shipping"
      />

      {includeShipping && (
        <ShippingSelector
          weight={formData.targetWeight}
          destinationCountry={formData.targetCountry}
          warehouseId={formData.warehouseId}
          selectedQuoteId={selectedQuote?.id}
          onSelectQuote={setSelectedQuote}
        />
      )}
    </>
  );
}
```

### Displaying Shipping in Tables

```tsx
import { ShippingSummary } from '@/components/rfq/ShippingSummary';

function RFQTable({ rfqs }) {
  return (
    <Table>
      <TableBody>
        {rfqs.map(rfq => (
          <TableRow key={rfq.id}>
            <TableCell>
              {rfq.selectedShippingQuote && (
                <ShippingSummary
                  quote={rfq.selectedShippingQuote}
                  compact
                />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Error Handling

### Client-Side Validation
```typescript
// Weight validation
if (weight <= 0) throw new Error('Weight must be greater than 0');
if (weight > 1000) throw new Error('Weight exceeds maximum limit');

// Rate validation
const errors = validateRateMatrix(rate);
if (errors.length > 0) throw new Error(`Invalid rate: ${errors.join(', ')}`);
```

### Error Recovery
- Automatic retry with exponential backoff
- User-friendly error messages
- Fallback to cached data
- Graceful degradation

## Performance Optimization

### Caching Strategy
- Response cache: 5-minute TTL
- Cache key: `${weight}-${warehouse}-${destination}`
- Automatic cache invalidation on changes

### Debouncing
- Input debounce: 500ms
- Prevents excessive API calls
- Improves user experience

### Parallel Processing
- Calculate all channels simultaneously
- Promise.all for concurrent operations
- Error recovery per channel

## Database Schema

### Tables
1. **warehouses** - Storage locations
2. **shipping_carriers** - Shipping companies (DHL, FedEx, etc.)
3. **shipping_channels** - Specific services (Express, Economy, etc.)
4. **rate_matrix** - Pricing rules
5. **rfq_shipping_quotes** - Saved quotes for RFQs

### RLS Policies
- Users can only access their own RFQ shipping quotes
- Admins can manage rate matrices, warehouses, carriers
- Public read access to active rates

## Testing

### Unit Tests
```typescript
// Test calculation accuracy
test('calculates shipping cost correctly', () => {
  const result = calculateShippingCost({
    weight_kg: 10,
    rate: mockRate
  });
  expect(result.total_freight).toBe(150.50);
});

// Test validation
test('validates weight range', () => {
  expect(() => calculateShippingCost({
    weight_kg: 1500,
    rate: mockRate
  })).toThrow('outside the valid range');
});
```

### Integration Tests
- Test quote calculation flow
- Verify database operations
- Test RLS policies
- Validate error handling

## Common Issues & Solutions

### Issue: No shipping options available
**Solution:** Check rate matrix for destination country and weight range

### Issue: Calculation takes too long
**Solution:** Verify database indexes on warehouse_id, channel_id, destination_country

### Issue: Incorrect prices
**Solution:** Validate rate matrix data, check effective dates

### Issue: Mobile display issues
**Solution:** Use compact mode for table displays, detailed mode for panels

## Future Enhancements

1. **Multi-currency support** - Real-time exchange rates
2. **Custom rate rules** - Per-customer pricing
3. **Volume discounts** - Tiered pricing
4. **Address validation** - Verify delivery addresses
5. **Tracking integration** - Real-time shipment tracking
6. **Insurance calculation** - Add insurance costs
7. **Customs calculation** - Duties and taxes
8. **API integration** - Live carrier rates

## Support

For issues or questions:
- Check error messages in browser console
- Review validation errors in UI
- Verify rate matrix configuration
- Check RLS policies for access issues
