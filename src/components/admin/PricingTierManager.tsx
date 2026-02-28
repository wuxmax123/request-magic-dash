import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PricingTier {
  id: string;
  tier_code: string;
  tier_name: string;
  tier_name_en: string | null;
  markup_percentage: number;
  description: string | null;
  sort: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const emptyTier = {
  tier_code: '',
  tier_name: '',
  tier_name_en: '',
  markup_percentage: 0,
  description: '',
  sort: 0,
  is_active: true,
};

export function PricingTierManager() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PricingTier | null>(null);
  const [form, setForm] = useState(emptyTier);

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_pricing_tiers')
        .select('*')
        .order('sort', { ascending: true });
      if (error) throw error;
      setTiers((data as unknown as PricingTier[]) || []);
    } catch (error) {
      console.error('Failed to load pricing tiers:', error);
      toast.error('加载失败 Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({ ...emptyTier, sort: tiers.length });
    setDialogOpen(true);
  };

  const handleOpenEdit = (tier: PricingTier) => {
    setEditing(tier);
    setForm({
      tier_code: tier.tier_code,
      tier_name: tier.tier_name,
      tier_name_en: tier.tier_name_en || '',
      markup_percentage: tier.markup_percentage,
      description: tier.description || '',
      sort: tier.sort,
      is_active: tier.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.tier_code || !form.tier_name) {
      toast.error('请填写必填字段 Please fill required fields');
      return;
    }

    try {
      if (editing) {
        const { error } = await supabase
          .from('user_pricing_tiers')
          .update({
            tier_code: form.tier_code,
            tier_name: form.tier_name,
            tier_name_en: form.tier_name_en || null,
            markup_percentage: form.markup_percentage,
            description: form.description || null,
            sort: form.sort,
            is_active: form.is_active,
          } as any)
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('更新成功 Updated');
      } else {
        const { error } = await supabase
          .from('user_pricing_tiers')
          .insert({
            tier_code: form.tier_code,
            tier_name: form.tier_name,
            tier_name_en: form.tier_name_en || null,
            markup_percentage: form.markup_percentage,
            description: form.description || null,
            sort: form.sort,
            is_active: form.is_active,
          } as any);
        if (error) throw error;
        toast.success('创建成功 Created');
      }
      setDialogOpen(false);
      await loadTiers();
    } catch (error: any) {
      console.error('Save failed:', error);
      toast.error(error.message || '保存失败 Save failed');
    }
  };

  const handleDelete = async (tier: PricingTier) => {
    if (!confirm(`确定删除「${tier.tier_name}」？Delete "${tier.tier_name}"?`)) return;
    try {
      const { error } = await supabase
        .from('user_pricing_tiers')
        .delete()
        .eq('id', tier.id);
      if (error) throw error;
      toast.success('已删除 Deleted');
      await loadTiers();
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast.error(error.message || '删除失败 Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              用户加价比例设置 User Pricing Tiers
            </CardTitle>
            <CardDescription>
              设置不同用户级别的加价比例 / Configure markup percentages for different user tiers
            </CardDescription>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-1" />
            添加级别 Add Tier
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>排序 Sort</TableHead>
              <TableHead>级别代码 Code</TableHead>
              <TableHead>级别名称 Name</TableHead>
              <TableHead>英文名 English</TableHead>
              <TableHead>加价比例 Markup</TableHead>
              <TableHead>说明 Description</TableHead>
              <TableHead>状态 Status</TableHead>
              <TableHead className="text-right">操作 Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  暂无数据 No data
                </TableCell>
              </TableRow>
            ) : (
              tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="font-mono text-sm">{tier.sort}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {tier.tier_code}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{tier.tier_name}</TableCell>
                  <TableCell className="text-muted-foreground">{tier.tier_name_en || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-base font-semibold">
                      {tier.markup_percentage}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {tier.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tier.is_active ? 'default' : 'secondary'}>
                      {tier.is_active ? '启用' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(tier)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tier)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing ? '编辑级别 Edit Tier' : '添加级别 Add Tier'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>级别代码 Code *</Label>
                  <Input
                    value={form.tier_code}
                    onChange={(e) => setForm({ ...form, tier_code: e.target.value })}
                    placeholder="e.g. vip"
                    disabled={!!editing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>排序 Sort</Label>
                  <Input
                    type="number"
                    value={form.sort}
                    onChange={(e) => setForm({ ...form, sort: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>中文名称 Name *</Label>
                  <Input
                    value={form.tier_name}
                    onChange={(e) => setForm({ ...form, tier_name: e.target.value })}
                    placeholder="e.g. VIP客户"
                  />
                </div>
                <div className="space-y-2">
                  <Label>英文名 English</Label>
                  <Input
                    value={form.tier_name_en}
                    onChange={(e) => setForm({ ...form, tier_name_en: e.target.value })}
                    placeholder="e.g. VIP"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>加价比例 Markup % *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={form.markup_percentage}
                    onChange={(e) => setForm({ ...form, markup_percentage: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.5}
                  />
                  <span className="text-muted-foreground font-medium">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>说明 Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="描述该级别的适用场景"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
                <Label>启用 Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消 Cancel
              </Button>
              <Button onClick={handleSave}>
                {editing ? '保存 Save' : '创建 Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
