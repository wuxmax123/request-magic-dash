import { SupplierQuote, CommercialTerm } from '@/types/rfq';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface QuotesViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierName: string;
  quotes: SupplierQuote[];
  commercialTerms: CommercialTerm[];
}

export function QuotesViewDialog({ open, onOpenChange, supplierName, quotes, commercialTerms }: QuotesViewDialogProps) {
  if (quotes.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{supplierName} - 报价列表</DialogTitle>
            <DialogDescription>该供应商暂无报价</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplierName} - 报价列表</DialogTitle>
          <DialogDescription>共 {quotes.length} 个报价</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {quotes.map((quote, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>报价 #{index + 1}</span>
                  <Badge variant={quote.tax_included ? 'default' : 'outline'}>
                    {quote.tax_included ? '含税' : '不含税'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pricing Info */}
                <div>
                  <h4 className="font-medium mb-3">价格信息</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">货币</p>
                      <p className="font-medium">{quote.currency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">MOQ</p>
                      <p className="font-medium">{quote.moq}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">单价 EXW</p>
                      <p className="font-medium">{quote.currency} {quote.unit_price_exw.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">总价</p>
                      <p className="font-medium text-primary">
                        {quote.currency} {(quote.unit_price_exw * quote.moq).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Logistics Info */}
                <div>
                  <h4 className="font-medium mb-3">物流信息</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">重量</p>
                      <p className="font-medium">{quote.weight_kg} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">尺寸 (长×宽×高)</p>
                      <p className="font-medium">
                        {quote.length_cm} × {quote.width_cm} × {quote.height_cm} cm
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">装箱数</p>
                      <p className="font-medium">{quote.carton_qty || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">贸易条款</p>
                      <p className="font-medium">{quote.incoterm_supplier}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">内包装</p>
                      <p className="font-medium">{quote.inner_pack || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">外包装</p>
                      <p className="font-medium">{quote.outer_pack || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Commercial Terms */}
                {quote.commercial_terms && Object.keys(quote.commercial_terms).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">商务条款</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(quote.commercial_terms).map(([key, value]) => {
                          if (key.endsWith('_refundable')) return null;
                          
                          const term = commercialTerms.find(t => t.attr_code === key);
                          const isRefundable = quote.commercial_terms[`${key}_refundable`];
                          
                          return (
                            <div key={key}>
                              <p className="text-sm text-muted-foreground">
                                {term?.attr_name || key}
                              </p>
                              <p className="font-medium">
                                {value} {term?.unit}
                                {isRefundable && (
                                  <Badge variant="outline" className="ml-2">可退</Badge>
                                )}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Additional Info */}
                {(quote.valid_until || quote.remarks) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">其他信息</h4>
                      <div className="space-y-2">
                        {quote.valid_until && (
                          <div>
                            <p className="text-sm text-muted-foreground">有效期至</p>
                            <p className="font-medium">{quote.valid_until}</p>
                          </div>
                        )}
                        {quote.remarks && (
                          <div>
                            <p className="text-sm text-muted-foreground">备注</p>
                            <p className="font-medium whitespace-pre-wrap">{quote.remarks}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
