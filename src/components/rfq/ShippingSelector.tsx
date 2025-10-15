import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Package, ChevronDown, TrendingDown, Zap } from 'lucide-react';
import { RFQShippingQuote } from '@/types/shipping';
import * as shippingService from '@/services/shippingService';
import { toast } from '@/hooks/use-toast';

interface ShippingSelectorProps {
  weight: number;
  destinationCountry: string;
  warehouseId?: string;
  selectedQuoteId?: string;
  onSelectQuote: (quote: RFQShippingQuote) => void;
  readOnly?: boolean;
}

export function ShippingSelector({
  weight,
  destinationCountry,
  warehouseId,
  selectedQuoteId,
  onSelectQuote,
  readOnly = false,
}: ShippingSelectorProps) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    calculateShipping();
  }, [weight, destinationCountry, warehouseId]);

  const calculateShipping = async () => {
    if (!weight || !destinationCountry || !warehouseId) {
      setQuotes([]);
      return;
    }

    setLoading(true);
    try {
      const results = await shippingService.calculateMultipleQuotes(
        weight,
        warehouseId,
        destinationCountry
      );
      
      // Convert results to quote format
      const quoteData = results.map((r, idx) => ({
        id: `quote-${idx}`,
        channel_id: r.channel_id,
        carrier_name: r.carrier_name,
        channel_name: r.channel_name,
        base_freight: r.base_freight,
        fuel_surcharge: r.fuel_surcharge,
        remote_surcharge: r.remote_surcharge,
        total_freight: r.total_freight,
        currency: r.currency,
        estimated_delivery_days_min: r.estimated_delivery_days_min,
        estimated_delivery_days_max: r.estimated_delivery_days_max,
        breakdown: r.breakdown,
      }));

      setQuotes(quoteData);

      // Auto-select cheapest if no selection
      if (quoteData.length > 0 && !selectedQuoteId) {
        const cheapest = quoteData.reduce((min, q) => 
          q.total_freight < min.total_freight ? q : min
        );
        onSelectQuote(cheapest as any);
      }
    } catch (error) {
      toast({
        title: 'Calculation Failed',
        description: 'Could not calculate shipping costs',
        variant: 'destructive',
      });
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Calculating shipping options...</span>
        </CardContent>
      </Card>
    );
  }

  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          No shipping options available for this destination
        </CardContent>
      </Card>
    );
  }

  // Find cheapest and fastest
  const cheapestQuote = quotes.reduce((min, q) => 
    q.total_freight < min.total_freight ? q : min
  );
  const fastestQuote = quotes.reduce((min, q) => 
    q.estimated_delivery_days_min < min.estimated_delivery_days_min ? q : min
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>运费选择 Shipping Options</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedQuoteId}
          onValueChange={(value) => {
            const selected = quotes.find(q => q.id === value);
            if (selected) {
              onSelectQuote(selected as any);
            }
          }}
          disabled={readOnly}
          className="space-y-4"
        >
          {quotes.map((quote) => (
            <Card
              key={quote.id}
              className={`cursor-pointer transition-all ${
                selectedQuoteId === quote.id
                  ? 'border-primary border-2'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => !readOnly && onSelectQuote(quote as any)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <RadioGroupItem value={quote.id} id={quote.id} />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        <div>
                          <Label htmlFor={quote.id} className="text-base font-semibold cursor-pointer">
                            {quote.carrier_name}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {quote.channel_name}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          {quote.id === cheapestQuote.id && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <TrendingDown className="h-3 w-3" />
                              Cheapest
                            </Badge>
                          )}
                          {quote.id === fastestQuote.id && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              Fastest
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Delivery: {quote.estimated_delivery_days_min}-{quote.estimated_delivery_days_max} days
                        </span>
                      </div>

                      <Collapsible
                        open={expandedId === quote.id}
                        onOpenChange={(open) => setExpandedId(open ? quote.id : null)}
                      >
                        <CollapsibleTrigger className="flex items-center text-sm text-primary hover:underline">
                          <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${expandedId === quote.id ? 'rotate-180' : ''}`} />
                          View cost breakdown
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Base Freight:</span>
                            <span>${quote.base_freight.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fuel Surcharge:</span>
                            <span>${quote.fuel_surcharge.toFixed(2)}</span>
                          </div>
                          {quote.remote_surcharge > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Remote Surcharge:</span>
                              <span>${quote.remote_surcharge.toFixed(2)}</span>
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-primary">
                      ${quote.total_freight.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">{quote.currency}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
