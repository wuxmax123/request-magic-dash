import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Users, Plus, Trash2 } from 'lucide-react';
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
  store_name: string;
  platform: string;
  user_id: string;
}

export function TierUserManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedTierId, setSelectedTierId] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [usersRes, tiersRes, storesRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, username, pricing_tier_id'),
      supabase.from('user_pricing_tiers').select('id, tier_name, tier_code, markup_percentage, shipping_markup_percentage').eq('is_active', true).order('sort'),
      supabase.from('stores').select('id, store_name, platform, user_id').eq('is_active', true).order('store_name'),
    ]);
    if (usersRes.data) setUsers(usersRes.data);
    if (tiersRes.data) setTiers(tiersRes.data);
    if (storesRes.data) setStores(storesRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const assignedUsers = users.filter(u => u.pricing_tier_id);
  const unassignedUsers = users.filter(u => !u.pricing_tier_id);

  const getUserName = (user: UserProfile) => user.full_name || user.username || user.id.slice(0, 8);
  const getTierName = (tierId: string) => tiers.find(t => t.id === tierId);
  const getUserStores = (userId: string) => stores.filter(s => s.user_id === userId);

  const openAssignDialog = () => {
    setSelectedUserId('');
    setSelectedTierId('');
    setSelectedStoreId('');
    setDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedUserId || !selectedTierId) {
      toast.error('请选择用户和等级');
      return;
    }
    const { error } = await supabase.from('profiles').update({ pricing_tier_id: selectedTierId }).eq('id', selectedUserId);
    if (error) { toast.error('分配失败'); return; }

    // If store selected, link it to user
    if (selectedStoreId && selectedStoreId !== '__none') {
      await supabase.from('stores').update({ user_id: selectedUserId }).eq('id', selectedStoreId);
    }

    toast.success('用户已分配到等级');
    setDialogOpen(false);
    fetchAll();
  };

  const handleRemoveTier = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ pricing_tier_id: null }).eq('id', userId);
    if (error) { toast.error('移除失败'); return; }
    toast.success('已移除等级');
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, pricing_tier_id: null } : u));
  };

  const handleChangeTier = async (userId: string, tierId: string) => {
    const value = tierId === '__none' ? null : tierId;
    const { error } = await supabase.from('profiles').update({ pricing_tier_id: value }).eq('id', userId);
    if (error) { toast.error('更新失败'); return; }
    toast.success('等级已更新');
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, pricing_tier_id: value } : u));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              用户等级分配 User Tier Assignment
            </CardTitle>
            <CardDescription>
              为用户分配加价等级，并可关联店铺 / Assign pricing tiers to users with optional store linking
            </CardDescription>
          </div>
          <Button onClick={openAssignDialog}>
            <Plus className="h-4 w-4 mr-1" />
            添加用户 Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户 User</TableHead>
              <TableHead>加价等级 Tier</TableHead>
              <TableHead>关联店铺 Stores</TableHead>
              <TableHead className="text-right">操作 Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  暂无已分配用户，点击"添加用户"开始 / No assigned users yet
                </TableCell>
              </TableRow>
            ) : (
              assignedUsers.map(user => {
                const tier = getTierName(user.pricing_tier_id!);
                const userStores = getUserStores(user.id);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{getUserName(user)}</TableCell>
                    <TableCell>
                      <Select
                        value={user.pricing_tier_id || '__none'}
                        onValueChange={(v) => handleChangeTier(user.id, v)}
                      >
                        <SelectTrigger className="w-[220px]">
                          <SelectValue />
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
                      {userStores.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {userStores.map(s => (
                            <Badge key={s.id} variant="outline" className="text-xs">
                              {s.store_name}{s.platform ? ` (${s.platform})` : ''}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">无店铺</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveTier(user.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Assign User Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>添加用户到等级 Assign User to Tier</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>选择用户 *</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger><SelectValue placeholder="选择用户" /></SelectTrigger>
                  <SelectContent>
                    {unassignedUsers.map(u => (
                      <SelectItem key={u.id} value={u.id}>{getUserName(u)}</SelectItem>
                    ))}
                    {unassignedUsers.length === 0 && (
                      <SelectItem value="__empty" disabled>所有用户已分配</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>加价等级 *</Label>
                <Select value={selectedTierId} onValueChange={setSelectedTierId}>
                  <SelectTrigger><SelectValue placeholder="选择等级" /></SelectTrigger>
                  <SelectContent>
                    {tiers.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.tier_name} ({t.markup_percentage}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>关联店铺（可选）</Label>
                <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                  <SelectTrigger><SelectValue placeholder="选择店铺（非必选）" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">不关联店铺</SelectItem>
                    {stores.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.store_name}{s.platform ? ` (${s.platform})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={handleAssign}>确认分配</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
