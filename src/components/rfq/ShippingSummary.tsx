import { RFQShippingQuote } from '@/types/shipping';
import { Badge } from '@/components/ui/badge';
import { Truck, Package } from 'lucide-react';

interface ShippingSummaryProps {
  quote: RFQShippingQuote;
  compact?: boolean;
}

export function ShippingSummary({ quote, compact = false }: ShippingSummaryProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Truck className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">
          ${quote.total_freight.toFixed(2)} {quote.currency}
        </span>
        <span className="text-muted-foreground">
          {quote.estimated_delivery_days_min}-{quote.estimated_delivery_days_max}d
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <div className="text-sm">
          <span className="font-medium">{quote.warehouse?.name_cn}</span>
          <span className="text-muted-foreground mx-2">→</span>
          <span>{quote.destination_country}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-muted-foreground" />
        <div className="text-sm">
          <span className="font-medium">{quote.channel?.channel_name_cn}</span>
          <span className="text-muted-foreground ml-2">
            ({quote.estimated_delivery_days_min}-{quote.estimated_delivery_days_max} days)
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-sm text-muted-foreground">Total Shipping:</span>
        <span className="font-bold text-primary">
          ${quote.total_freight.toFixed(2)} {quote.currency}
        </span>
      </div>
    </div>
  );
}
