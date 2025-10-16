import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calculator, Package, ShoppingCart, ArrowUpDown, Zap, ChevronDown, AlertCircle } from 'lucide-react';
import * as shippingService from '@/services/shippingService';
import { toast } from '@/hooks/use-toast';

export default function ShippingEstimator() {
  const navigate = useNavigate();
  const [weight, setWeight] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'speed'>('price');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const data = await shippingService.getActiveWarehouses();
      setWarehouses(data);
      if (data.length > 0) {
        setWarehouseId(data[0].id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load warehouses',
        variant: 'destructive',
      });
    }
  };

  const handleCalculate = async () => {
    if (!weight || !destination) {
      toast({
        title: 'Missing Information',
        description: 'Please enter weight and destination',
        variant: 'destructive',
      });
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast({
        title: 'Invalid Weight',
        description: 'Please enter a valid weight',
        variant: 'destructive',
      });
      return;
    }

    setCalculating(true);
    setCalculated(false);
    try {
      const quotes = await shippingService.calculateMultipleQuotes(
        weightNum,
        warehouseId,
        destination
      );
      setResults(quotes);
      setCalculated(true);
    } catch (error) {
      toast({
        title: 'Calculation Failed',
        description: 'Could not calculate shipping costs',
        variant: 'destructive',
      });
      setResults([]);
    } finally {
      setCalculating(false);
    }
  };

  const handleCreateRFQ = (result: any) => {
    navigate(`/rfq?weight=${weight}&destination=${destination}&warehouse=${warehouseId}&channel=${result.channel_id}`);
  };

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'price') {
      return a.total_freight - b.total_freight;
    } else {
      return a.estimated_delivery_days_min - b.estimated_delivery_days_min;
    }
  });

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'CA', name: 'Canada' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            运费计算器 Shipping Cost Estimator
          </h1>
          <p className="text-xl text-muted-foreground">
            快速估算国际运费 / Quickly estimate international shipping costs
          </p>
        </div>

        {/* Input Card */}
        <Card className="max-w-4xl mx-auto mb-8">
          <CardHeader>
            <CardTitle>Calculate Shipping Cost</CardTitle>
            <CardDescription>
              Enter product details to get shipping quotes from multiple carriers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Product Weight (g) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g., 450"
                />
              </div>
              <div>
                <Label>Origin Warehouse</Label>
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name_cn} ({w.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Destination Country *</Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              className="mt-6 w-full"
              onClick={handleCalculate}
              disabled={!weight || !destination || calculating}
            >
              {calculating ? (
                <><Loader2 className="animate-spin mr-2" /> Calculating...</>
              ) : (
                <><Calculator className="mr-2" /> Calculate Shipping Cost</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.length > 0 && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Available Shipping Options</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={sortBy === 'price' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('price')}
                  >
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Sort by Price
                  </Button>
                  <Button
                    variant={sortBy === 'speed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('speed')}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Sort by Speed
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedResults.map((result, idx) => (
                  <Card key={idx} className="border-2 hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">{result.carrier_name}</h3>
                            <Badge variant="outline">{result.channel_name}</Badge>
                            {idx === 0 && sortBy === 'price' && (
                              <Badge variant="default">Cheapest</Badge>
                            )}
                            {idx === 0 && sortBy === 'speed' && (
                              <Badge variant="default">Fastest</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            Delivery: {result.estimated_delivery_days_min}-{result.estimated_delivery_days_max} days
                          </div>

                          <Collapsible
                            open={expandedId === `result-${idx}`}
                            onOpenChange={(open) => setExpandedId(open ? `result-${idx}` : null)}
                          >
                            <CollapsibleTrigger className="text-sm text-primary hover:underline flex items-center">
                              <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${expandedId === `result-${idx}` ? 'rotate-180' : ''}`} />
                              View cost breakdown
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Base Freight:</span>
                                <span>${result.base_freight.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Fuel Surcharge:</span>
                                <span>${result.fuel_surcharge.toFixed(2)}</span>
                              </div>
                              {result.remote_surcharge > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span>Remote Surcharge:</span>
                                  <span>${result.remote_surcharge.toFixed(2)}</span>
                                </div>
                              )}
                            </CollapsibleContent>
                          </Collapsible>
                        </div>

                        <div className="text-right ml-4">
                          <div className="text-3xl font-bold text-primary">
                            ${result.total_freight.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">{result.currency}</div>
                          <Button
                            size="sm"
                            onClick={() => handleCreateRFQ(result)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Create RFQ
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No results message */}
        {calculated && results.length === 0 && (
          <Alert className="max-w-4xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No shipping options available for the selected destination.
              Please try a different warehouse or contact support.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
