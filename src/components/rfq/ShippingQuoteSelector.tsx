import { useState } from 'react';
import { RFQShippingQuote } from '@/types/shipping';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Check, Truck, Package, Clock } from 'lucide-react';
import { updateShippingQuoteSelection } from '@/services/shippingService';
import { toast } from 'sonner';

interface ShippingQuoteSelectorProps {
  rfqId: string;
  quotes: RFQShippingQuote[];
  onQuoteSelected?: (quoteId: string) => void;
}

export function ShippingQuoteSelector({ rfqId, quotes, onQuoteSelected }: ShippingQuoteSelectorProps) {
  const [selectedQuoteId, setSelectedQuoteId] = useState(
    quotes.find(q => q.is_selected)?.id || quotes[0]?.id
  );
  const [saving, setSaving] = useState(false);

  const handleSaveSelection = async () => {
    if (!selectedQuoteId) return;
    
    try {
      setSaving(true);
      await updateShippingQuoteSelection(rfqId, selectedQuoteId);
      toast.success('已更新运费方案');
      onQuoteSelected?.(selectedQuoteId);
    } catch (error) {
      console.error('Failed to update shipping quote:', error);
      toast.error('更新失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (quotes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>暂无运费方案</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RadioGroup value={selectedQuoteId} onValueChange={setSelectedQuoteId}>
        {quotes.map((quote) => {
          const isSelected = quote.id === selectedQuoteId;
          
          return (
            <Card key={quote.id} className={isSelected ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <RadioGroupItem value={quote.id} id={quote.id} className="mt-1" />
                  
                  <div className="flex-1 space-y-3">
                    <Label htmlFor={quote.id} className="cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-lg">
                            {quote.channel?.channel_name_cn}
                          </span>
                          {quote.is_selected && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              当前方案
                            </span>
                          )}
                        </div>
                        <span className="text-2xl font-bold text-primary">
                          ${quote.total_freight.toFixed(2)}
                        </span>
                      </div>
                    </Label>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">起运仓库</div>
                          <div className="font-medium">{quote.warehouse?.name_cn}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">预计时效</div>
                          <div className="font-medium">
                            {quote.estimated_delivery_days_min}-{quote.estimated_delivery_days_max} 天
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-muted-foreground">货物重量</div>
                        <div className="font-medium">{quote.product_weight_kg} kg</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">基础运费</span>
                        <span>${quote.base_freight.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">燃油附加费</span>
                        <span>${quote.fuel_surcharge.toFixed(2)}</span>
                      </div>
                      {quote.remote_surcharge > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">偏远地区附加费</span>
                          <span>${quote.remote_surcharge.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </RadioGroup>

      {quotes.find(q => q.id === selectedQuoteId)?.id !== quotes.find(q => q.is_selected)?.id && (
        <div className="flex justify-end">
          <Button onClick={handleSaveSelection} disabled={saving}>
            {saving ? '保存中...' : '保存运费方案'}
          </Button>
        </div>
      )}
    </div>
  );
}
