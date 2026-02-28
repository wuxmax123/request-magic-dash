import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Ship, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ShippingMarkupRule {
  id: string;
  country_code: string;
  country_name_cn: string;
  country_name_en: string;
  markup_percentage: number;
  sort: number;
  is_active: boolean;
}

export function ShippingMarkupManager() {
  const [rules, setRules] = useState<ShippingMarkupRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [edited, setEdited] = useState<Record<string, Partial<ShippingMarkupRule>>>({});

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shipping_markup_rules')
        .select('*')
        .order('sort', { ascending: true });
      if (error) throw error;
      setRules((data as unknown as ShippingMarkupRule[]) || []);
      setEdited({});
    } catch (error) {
      console.error('Failed to load shipping markup rules:', error);
      toast.error('加载失败 Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (id: string, field: keyof ShippingMarkupRule, value: any) => {
    setEdited(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const getValue = (rule: ShippingMarkupRule, field: keyof ShippingMarkupRule) => {
    return edited[rule.id]?.[field] ?? rule[field];
  };

  const hasChanges = Object.keys(edited).length > 0;

  const handleSaveAll = async () => {
    try {
      const updates = Object.entries(edited).map(([id, changes]) => 
        supabase
          .from('shipping_markup_rules')
          .update(changes as any)
          .eq('id', id)
      );
      const results = await Promise.all(updates);
      const failed = results.find(r => r.error);
      if (failed?.error) throw failed.error;
      toast.success('保存成功 Saved');
      await loadRules();
    } catch (error: any) {
      console.error('Save failed:', error);
      toast.error(error.message || '保存失败 Save failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const topCountries = rules.filter(r => r.country_code !== 'OTHERS');
  const othersRule = rules.find(r => r.country_code === 'OTHERS');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              运费加价比例设置 Shipping Markup Rules
            </CardTitle>
            <CardDescription>
              设置排名前十国家的运费加价比例，其他国家统一使用 Others 比例 / Set shipping markup for top 10 countries, others share a unified rate
            </CardDescription>
          </div>
          <Button onClick={handleSaveAll} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-1" />
            保存全部 Save All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">排序</TableHead>
              <TableHead className="w-24">国家代码</TableHead>
              <TableHead>国家 Country</TableHead>
              <TableHead className="w-40">加价比例 Markup %</TableHead>
              <TableHead className="w-24">状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topCountries.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-mono text-sm text-muted-foreground">{rule.sort}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">{rule.country_code}</Badge>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{rule.country_name_cn}</span>
                  <span className="text-muted-foreground ml-2 text-sm">{rule.country_name_en}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      className="w-24"
                      value={getValue(rule, 'markup_percentage') as number}
                      onChange={(e) => handleChange(rule.id, 'markup_percentage', parseFloat(e.target.value) || 0)}
                      min={0}
                      step={0.5}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={getValue(rule, 'is_active') as boolean}
                    onCheckedChange={(v) => handleChange(rule.id, 'is_active', v)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {othersRule && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">其他国家 Others</p>
                <p className="text-sm text-muted-foreground">未在上方列出的国家统一使用此加价比例</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-24"
                  value={getValue(othersRule, 'markup_percentage') as number}
                  onChange={(e) => handleChange(othersRule.id, 'markup_percentage', parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.5}
                />
                <span className="text-muted-foreground">%</span>
                <Switch
                  checked={getValue(othersRule, 'is_active') as boolean}
                  onCheckedChange={(v) => handleChange(othersRule.id, 'is_active', v)}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
