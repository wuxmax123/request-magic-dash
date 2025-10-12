import { Supplier } from '@/types/rfq';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Plus } from 'lucide-react';

interface SupplierTableProps {
  suppliers: Supplier[];
  onAddQuote: (supplierId: number) => void;
  onViewQuotes: (supplierId: number) => void;
}

export function SupplierTable({ suppliers, onAddQuote, onViewQuotes }: SupplierTableProps) {
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
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
