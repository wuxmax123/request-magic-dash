import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Download, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as shippingService from '@/services/shippingService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RateMatrixManager() {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

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

  const handleExport = () => {
    const csv = [
      ['Warehouse', 'Channel', 'Country', 'Min Weight', 'Max Weight', 'First Weight', 'First Fee', 'Additional Step', 'Additional Fee', 'Fuel %', 'Min Charge', 'Delivery Min', 'Delivery Max', 'Remote Charge', 'Currency', 'Active'].join(','),
      ...rates.map(r => [
        r.warehouse?.warehouse_code || '',
        r.channel?.channel_code || '',
        r.destination_country,
        r.weight_min_kg,
        r.weight_max_kg,
        r.first_weight_kg,
        r.first_weight_fee,
        r.additional_weight_step_kg,
        r.additional_fee_per_step,
        r.fuel_surcharge_percent,
        r.min_charge,
        r.estimated_delivery_days_min,
        r.estimated_delivery_days_max,
        r.remote_area_surcharge,
        r.currency,
        r.is_active
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rate_matrix_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: 'Success', description: '数据已导出' });
  };

  const calculateAnalytics = () => {
    if (rates.length === 0) return { totalRates: 0, activeRates: 0, countries: 0, avgDeliveryTime: '0' };
    
    const totalRates = rates.length;
    const activeRates = rates.filter(r => r.is_active).length;
    const countries = new Set(rates.map(r => r.destination_country)).size;
    const avgDeliveryTime = rates.reduce((sum, r) => sum + (r.estimated_delivery_days_min + r.estimated_delivery_days_max) / 2, 0) / totalRates;
    
    return { totalRates, activeRates, countries, avgDeliveryTime: avgDeliveryTime.toFixed(1) };
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Rate Matrix 运费矩阵</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                导出数据
              </Button>
              <Button variant="outline" onClick={() => setShowAnalytics(!showAnalytics)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                {showAnalytics ? '隐藏' : '查看'}分析
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showAnalytics && (
            <Card className="mb-4 bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">运费数据分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-primary">{calculateAnalytics().totalRates}</div>
                    <div className="text-sm text-muted-foreground">总配置数</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{calculateAnalytics().activeRates}</div>
                    <div className="text-sm text-muted-foreground">激活配置</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{calculateAnalytics().countries}</div>
                    <div className="text-sm text-muted-foreground">覆盖国家</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{calculateAnalytics().avgDeliveryTime}</div>
                    <div className="text-sm text-muted-foreground">平均时效(天)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
