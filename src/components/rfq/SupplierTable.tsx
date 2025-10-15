import { Supplier } from '@/types/rfq';
import { RFQShippingQuote } from '@/types/shipping';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Plus, Truck } from 'lucide-react';

interface SupplierTableProps {
  suppliers: Supplier[];
  onAddQuote: (supplierId: number) => void;
  onViewQuotes: (supplierId: number) => void;
  shippingQuote?: RFQShippingQuote;
  includeShipping?: boolean;
}

export function SupplierTable({ suppliers, onAddQuote, onViewQuotes, shippingQuote, includeShipping }: SupplierTableProps) {
  const calculateTotalCost = (unitPrice: number, moq: number) => {
    const productCost = unitPrice * moq;
    const shippingCost = includeShipping && shippingQuote ? shippingQuote.total_freight : 0;
    return productCost + shippingCost;
  };

  if (suppliers.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">暂无供应商</p>
        <p className="text-sm text-muted-foreground mt-1">请从供应商列表中选择</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>供应商</TableHead>
            <TableHead>联系人</TableHead>
            <TableHead>联系方式</TableHead>
            <TableHead>标签</TableHead>
            <TableHead>评分</TableHead>
            <TableHead>报价数</TableHead>
            {includeShipping && <TableHead>运费</TableHead>}
            <TableHead>最佳报价</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => {
            const bestQuote = supplier.quotes.length > 0 
              ? supplier.quotes.reduce((min, q) => q.unit_price_exw < min.unit_price_exw ? q : min)
              : null;
            
            return (
              <TableRow key={supplier.supplier_id}>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>{supplier.contact}</TableCell>
                <TableCell>
                  <div className="text-sm space-y-1">
                    <div>{supplier.phone}</div>
                    <div className="text-muted-foreground">{supplier.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {supplier.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{supplier.rating}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{supplier.quotes.length}</Badge>
                </TableCell>
                {includeShipping && (
                  <TableCell>
                    {shippingQuote ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Truck className="h-3 w-3 text-muted-foreground" />
                        <span>${shippingQuote.total_freight.toFixed(2)}</span>
                        <span className="text-muted-foreground text-xs">
                          ({shippingQuote.estimated_delivery_days_min}-{shippingQuote.estimated_delivery_days_max}d)
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">未选择</span>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  {bestQuote ? (
                    <div className="space-y-1">
                      <div className="font-medium">
                        ${bestQuote.unit_price_exw.toFixed(2)} × {bestQuote.moq}
                      </div>
                      {includeShipping && shippingQuote && (
                        <div className="text-sm text-muted-foreground">
                          总计: ${calculateTotalCost(bestQuote.unit_price_exw, bestQuote.moq).toFixed(2)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">无报价</span>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {supplier.quotes.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewQuotes(supplier.supplier_id)}
                    >
                      查看报价
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onAddQuote(supplier.supplier_id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    添加报价
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
