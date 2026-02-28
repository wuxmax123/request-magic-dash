import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, ChevronDown, ChevronRight, Plus, Pencil, Trash2, Store } from 'lucide-react';
import { toast } from 'sonner';

interface PricingTier {
  id: string;
  tier_name: string;
  tier_code: string;
  markup_percentage: number;
  shipping_markup_percentage: number;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  pricing_tier_id: string | null;
}

interface StoreRecord {
  id: string;
  user_id: string;
  store_name: string;
  platform: string;
  store_url: string | null;
  country: string | null;
  is_active: boolean;
  notes: string | null;
}

const PLATFORMS = ['Shopify', 'Amazon', 'eBay', 'Walmart', 'TikTok Shop', 'Temu', 'AliExpress', 'Etsy', '独立站', '其他'];

export function UserManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Store dialog state
  const [storeDialogOpen, setStoreDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreRecord | null>(null);
  const [storeForm, setStoreForm] = useState({
    user_id: '',
    store_name: '',
    platform: '',
    store_url: '',
    country: '',
    notes: '',
    is_active: true,
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [usersRes, tiersRes, storesRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, username, pricing_tier_id'),
      supabase.from('user_pricing_tiers').select('id, tier_name, tier_code, markup_percentage, shipping_markup_percentage').eq('is_active', true).order('sort'),
      supabase.from('stores').select('*').order('created_at', { ascending: false }),
    ]);
    if (usersRes.data) setUsers(usersRes.data);
    if (tiersRes.data) setTiers(tiersRes.data);
    if (storesRes.data) setStores(storesRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getTierName = (tierId: string | null) => {
    if (!tierId) return null;
    const tier = tiers.find(t => t.id === tierId);
    return tier ? `${tier.tier_name} (${tier.markup_percentage}%)` : null;
  };

  const handleTierChange = async (userId: string, tierId: string) => {
    const value = tierId === '__none' ? null : tierId;
    const { error } = await supabase.from('profiles').update({ pricing_tier_id: value }).eq('id', userId);
    if (error) { toast.error('更新失败'); return; }
    toast.success('加价等级已更新');
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, pricing_tier_id: value } : u));
  };

  const getUserStores = (userId: string) => stores.filter(s => s.user_id === userId);

  const openAddStore = (userId: string) => {
    setEditingStore(null);
    setStoreForm({ user_id: userId, store_name: '', platform: '', store_url: '', country: '', notes: '', is_active: true });
    setStoreDialogOpen(true);
  };

  const openEditStore = (store: StoreRecord) => {
    setEditingStore(store);
    setStoreForm({
      user_id: store.user_id,
      store_name: store.store_name,
      platform: store.platform,
      store_url: store.store_url || '',
      country: store.country || '',
      notes: store.notes || '',
      is_active: store.is_active,
    });
    setStoreDialogOpen(true);
  };

  const handleSaveStore = async () => {
    if (!storeForm.store_name) { toast.error('请填写店铺名称'); return; }
    const payload = {
      user_id: storeForm.user_id,
      store_name: storeForm.store_name,
      platform: storeForm.platform,
      store_url: storeForm.store_url || null,
      country: storeForm.country || null,
      notes: storeForm.notes || null,
      is_active: storeForm.is_active,
    };
    if (editingStore) {
      const { error } = await supabase.from('stores').update(payload).eq('id', editingStore.id);
      if (error) { toast.error('更新失败'); return; }
      toast.success('店铺已更新');
    } else {
      const { error } = await supabase.from('stores').insert(payload);
      if (error) { toast.error('添加失败: ' + error.message); return; }
      toast.success('店铺已添加');
    }
    setStoreDialogOpen(false);
    // Refresh stores
    const { data } = await supabase.from('stores').select('*').order('created_at', { ascending: false });
    if (data) setStores(data);
  };

  const handleDeleteStore = async (id: string) => {
    const { error } = await supabase.from('stores').delete().eq('id', id);
    if (error) { toast.error('删除失败'); return; }
    toast.success('店铺已删除');
    setStores(prev => prev.filter(s => s.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          用户管理 User Management
        </CardTitle>
        <CardDescription>管理用户加价等级和店铺 / Manage user pricing tiers and stores</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>用户</TableHead>
              <TableHead>加价等级</TableHead>
              <TableHead>店铺数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => {
              const userStores = getUserStores(user.id);
              const isExpanded = expandedUser === user.id;
              return (
                <Collapsible key={user.id} open={isExpanded} onOpenChange={() => setExpandedUser(isExpanded ? null : user.id)} asChild>
                  <>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell className="font-medium">{user.full_name || user.username || user.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <Select
                          value={user.pricing_tier_id || '__none'}
                          onValueChange={(v) => handleTierChange(user.id, v)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="选择加价等级" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">未设置</SelectItem>
                            {tiers.map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.tier_name} ({t.markup_percentage}% / 运费{t.shipping_markup_percentage}%)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{userStores.length} 个店铺</Badge>
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={4} className="bg-muted/30 p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium flex items-center gap-1">
                                <Store className="h-4 w-4" /> 店铺列表
                              </h4>
                              <Button size="sm" variant="outline" onClick={() => openAddStore(user.id)}>
                                <Plus className="h-3 w-3 mr-1" />添加店铺
                              </Button>
                            </div>
                            {userStores.length === 0 ? (
                              <p className="text-sm text-muted-foreground">暂无店铺，点击上方按钮添加</p>
                            ) : (
                              <div className="rounded border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>店铺名称</TableHead>
                                      <TableHead>平台</TableHead>
                                      <TableHead>国家</TableHead>
                                      <TableHead>状态</TableHead>
                                      <TableHead className="text-right">操作</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {userStores.map(store => (
                                      <TableRow key={store.id}>
                                        <TableCell>{store.store_name}</TableCell>
                                        <TableCell><Badge variant="outline">{store.platform || '-'}</Badge></TableCell>
                                        <TableCell>{store.country || '-'}</TableCell>
                                        <TableCell>
                                          <Badge variant={store.is_active ? 'default' : 'secondary'}>
                                            {store.is_active ? '启用' : '停用'}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditStore(store)}>
                                            <Pencil className="h-3 w-3" />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteStore(store.id)}>
                                            <Trash2 className="h-3 w-3 text-destructive" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              );
            })}
            {users.length === 0 && !loading && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">暂无用户数据</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        {/* Store Add/Edit Dialog */}
        <Dialog open={storeDialogOpen} onOpenChange={setStoreDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingStore ? '编辑店铺' : '添加店铺'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>店铺名称 *</Label>
                <Input value={storeForm.store_name} onChange={e => setStoreForm(f => ({ ...f, store_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>平台</Label>
                <Select value={storeForm.platform} onValueChange={v => setStoreForm(f => ({ ...f, platform: v }))}>
                  <SelectTrigger><SelectValue placeholder="选择平台" /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>店铺链接</Label>
                <Input value={storeForm.store_url} onChange={e => setStoreForm(f => ({ ...f, store_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>国家/地区</Label>
                <Input value={storeForm.country} onChange={e => setStoreForm(f => ({ ...f, country: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>备注</Label>
                <Input value={storeForm.notes} onChange={e => setStoreForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={storeForm.is_active} onCheckedChange={v => setStoreForm(f => ({ ...f, is_active: v }))} />
                <Label>启用</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStoreDialogOpen(false)}>取消</Button>
              <Button onClick={handleSaveStore}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
