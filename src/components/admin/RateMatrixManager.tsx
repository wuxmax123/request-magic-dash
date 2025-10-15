import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as shippingService from '@/services/shippingService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RateMatrixManager() {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ratesData, warehousesData, channelsData] = await Promise.all([
        shippingService.getRateMatrix(),
        shippingService.getWarehouses(),
        shippingService.getChannels(),
      ]);
      setRates(ratesData);
      setWarehouses(warehousesData);
      setChannels(channelsData);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredRates = warehouseFilter
    ? rates.filter(r => r.warehouse_id === warehouseFilter)
    : rates;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Rate Matrix 运费矩阵</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="w-64">
              <Label>Filter by Warehouse</Label>
              <Select value={warehouseFilter || undefined} onValueChange={(value) => setWarehouseFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All warehouses" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name_cn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {warehouseFilter && (
              <Button variant="outline" onClick={() => setWarehouseFilter('')} className="mt-6">
                Clear Filter
              </Button>
            )}
            <Button className="mt-6">
              <Plus className="h-4 w-4 mr-2" />
              Add Rate
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Weight Range</TableHead>
                    <TableHead>First Fee</TableHead>
                    <TableHead>Add Fee</TableHead>
                    <TableHead>Fuel %</TableHead>
                    <TableHead>Currency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No rates found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell>{rate.warehouse?.name_cn}</TableCell>
                        <TableCell>{rate.channel?.channel_name_cn}</TableCell>
                        <TableCell>{rate.destination_country}</TableCell>
                        <TableCell>{rate.weight_min_kg}-{rate.weight_max_kg}kg</TableCell>
                        <TableCell>${rate.first_weight_fee}</TableCell>
                        <TableCell>${rate.additional_fee_per_step}/{rate.additional_weight_step_kg}kg</TableCell>
                        <TableCell>{rate.fuel_surcharge_percent}%</TableCell>
                        <TableCell>{rate.currency}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
