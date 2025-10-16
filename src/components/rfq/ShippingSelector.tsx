import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, ChevronDown, TrendingDown, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RFQShippingQuote } from '@/types/shipping';
import * as shippingService from '@/services/shippingService';
import { toast } from '@/hooks/use-toast';

interface ShippingSelectorProps {
  weight: number;
  destinationCountries: string[];
  warehouseId?: string;
  selectedQuoteId?: string;
  onSelectQuote: (quote: RFQShippingQuote) => void;
  readOnly?: boolean;
}

export function ShippingSelector({
  weight,
  destinationCountries,
  warehouseId,
  selectedQuoteId,
  onSelectQuote,
  readOnly = false,
}: ShippingSelectorProps) {
  const [quotesByCountry, setQuotesByCountry] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, { data: any[]; timestamp: number }>>(new Map());
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Validate inputs
  const validationError = useMemo(() => {
    if (!weight || weight <= 0) return 'Weight must be greater than 0';
    if (weight > 1000) return 'Weight exceeds maximum limit (1000kg)';
    if (!destinationCountries || destinationCountries.length === 0) return 'Destination country is required';
    if (!warehouseId) return 'Warehouse selection is required';
    return null;
  }, [weight, destinationCountries, warehouseId]);

  // Debounced calculation with caching for multiple countries
  const calculateShipping = useCallback(async () => {
    if (validationError) {
      setQuotesByCountry({});
      setError(validationError);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const allQuotesByCountry: Record<string, any[]> = {};
      
      // Calculate quotes for each country
      for (const country of destinationCountries) {
        // Check cache
        const cacheKey = `${weight}-${warehouseId}-${country}`;
        const cached = cacheRef.current.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          allQuotesByCountry[country] = cached.data;
          continue;
        }

        const results = await shippingService.calculateMultipleQuotes(
          weight,
          warehouseId,
          country
        );
        
        // Convert results to quote format
        const quoteData = results.map((r, idx) => ({
          id: `quote-${country}-${idx}`,
          country: country,
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

        allQuotesByCountry[country] = quoteData;
        cacheRef.current.set(cacheKey, { data: quoteData, timestamp: Date.now() });
      }

      setQuotesByCountry(allQuotesByCountry);

      // Auto-select cheapest overall if no selection
      if (!selectedQuoteId) {
        const allQuotes = Object.values(allQuotesByCountry).flat();
        if (allQuotes.length > 0) {
          const cheapest = allQuotes.reduce((min, q) => 
            q.total_freight < min.total_freight ? q : min
          );
          onSelectQuote(cheapest as any);
        }
      }
      
      setRetryCount(0);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      
      const errorMessage = error.message || 'Failed to calculate shipping costs';
      console.error('Shipping calculation error:', error);
      
      setError(errorMessage);
      setQuotesByCountry({});
      
      toast({
        title: 'Calculation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [weight, destinationCountries, warehouseId, selectedQuoteId, validationError, onSelectQuote]);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateShipping();
    }, 500);

    return () => clearTimeout(timer);
  }, [calculateShipping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    calculateShipping();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <Package className="h-6 w-6 absolute top-3 left-3 text-primary-foreground" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-medium">Calculating shipping options...</p>
            <p className="text-sm text-muted-foreground">
              Comparing {Math.round(weight * 1000)}g to {destinationCountries.join(', ')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {error}
            </AlertDescription>
          </Alert>
          <div className="flex justify-center mt-4">
            <Button onClick={handleRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry {retryCount > 0 && `(Attempt ${retryCount + 1})`}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allQuotes = Object.values(quotesByCountry).flat();
  
  if (allQuotes.length === 0 && !validationError) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-4">
          <Package className="h-12 w-12 mx-auto text-muted-foreground" />
          <div className="space-y-2">
            <p className="font-medium text-muted-foreground">No shipping options available</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting the weight or selecting a different warehouse
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find cheapest and fastest across all countries
  const cheapestQuote = allQuotes.reduce((min, q) => 
    q.total_freight < min.total_freight ? q : min
  , allQuotes[0]);
  const fastestQuote = allQuotes.reduce((min, q) => 
    q.estimated_delivery_days_min < min.estimated_delivery_days_min ? q : min
  , allQuotes[0]);

  // Country label mapping
  const countryLabels: Record<string, string> = {
    'US': '美国 US',
    'GB': '英国 GB',
    'AU': '澳大利亚 AU',
    'CA': '加拿大 CA',
    'DE': '德国 DE',
    'FR': '法国 FR',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>运费选择 Shipping Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {destinationCountries.map((country) => {
          const quotes = quotesByCountry[country] || [];
          
          if (quotes.length === 0) {
            return (
              <div key={country} className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Badge variant="secondary" className="text-sm">
                    {countryLabels[country] || country}
                  </Badge>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No shipping options available for this country with the current weight and warehouse selection.
                  </AlertDescription>
                </Alert>
              </div>
            );
          }

          return (
            <div key={country} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Badge variant="secondary" className="text-sm">
                  {countryLabels[country] || country}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {quotes.length} shipping options
                </span>
              </div>
              
              <RadioGroup
                value={selectedQuoteId}
                onValueChange={(value) => {
                  const selected = allQuotes.find(q => q.id === value);
                  if (selected) {
                    onSelectQuote(selected as any);
                  }
                }}
                disabled={readOnly}
                className="space-y-3"
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
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
