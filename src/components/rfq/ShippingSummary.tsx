import { RFQShippingQuote } from '@/types/shipping';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Truck, Package, Info } from 'lucide-react';

interface ShippingSummaryProps {
  quote: RFQShippingQuote;
  compact?: boolean;
}

export function ShippingSummary({ quote, compact = false }: ShippingSummaryProps) {
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 text-sm cursor-help">
              <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium whitespace-nowrap">
                ${quote.total_freight.toFixed(2)} {quote.currency}
              </span>
              <span className="text-muted-foreground hidden sm:inline">
                {quote.estimated_delivery_days_min}-{quote.estimated_delivery_days_max}d
              </span>
              <Info className="h-3 w-3 text-muted-foreground sm:hidden" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{quote.channel?.channel_name_cn}</p>
              <p className="text-xs">
                {quote.warehouse?.name_cn} → {quote.destination_country}
              </p>
              <p className="text-xs">
                Delivery: {quote.estimated_delivery_days_min}-{quote.estimated_delivery_days_max} days
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-3 p-4 rounded-lg bg-muted/30">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium">{quote.warehouse?.name_cn}</span>
            <span className="text-muted-foreground mx-2">→</span>
            <span className="break-all">{quote.destination_country}</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium">{quote.channel?.channel_name_cn}</span>
            <span className="text-muted-foreground ml-2">
              ({quote.estimated_delivery_days_min}-{quote.estimated_delivery_days_max} days)
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-sm text-muted-foreground">Total Shipping:</span>
        <span className="font-bold text-primary text-lg">
          ${quote.total_freight.toFixed(2)} <span className="text-sm">{quote.currency}</span>
        </span>
      </div>
    </div>
  );
}
