import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PricingTier {
  id: string;
  tier_code: string;
  tier_name: string;
  tier_name_en: string | null;
  markup_percentage: number;
  is_active: boolean;
}

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  pricing_tier_id: string | null;
}

export function UserTierAssignment() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<Record<string, string | null>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profilesRes, tiersRes] = await Promise.all([
        supabase.from('profiles').select('id, username, full_name, pricing_tier_id'),
        supabase.from('user_pricing_tiers').select('*').eq('is_active', true).order('sort'),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (tiersRes.error) throw tiersRes.error;
      setUsers(profilesRes.data || []);
      setTiers((tiersRes.data as unknown as PricingTier[]) || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('加载失败 Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleTierChange = (userId: string, tierId: string | null) => {
    setPendingChanges(prev => ({ ...prev, [userId]: tierId }));
  };

  const handleSave = async (userId: string) => {
    const newTierId = pendingChanges[userId];
    if (newTierId === undefined) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ pricing_tier_id: newTierId || null } as any)
        .eq('id', userId);
      if (error) throw error;
      toast.success('已更新 Updated');
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, pricing_tier_id: newTierId } : u))
      );
      setPendingChanges(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error(error.message || '更新失败 Update failed');
    }
  };

  const getTierInfo = (tierId: string | null) => {
    if (!tierId) return null;
    return tiers.find(t => t.id === tierId);
  };

  const getDisplayTierId = (userId: string) => {
    return pendingChanges[userId] !== undefined ? pendingChanges[userId] : users.find(u => u.id === userId)?.pricing_tier_id;
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
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          用户级别分配 User Tier Assignment
        </CardTitle>
        <CardDescription>
          为不同用户分配加价级别 / Assign pricing tiers to users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户 User</TableHead>
              <TableHead>用户名 Username</TableHead>
              <TableHead>当前级别 Current Tier</TableHead>
              <TableHead>加价比例 Markup</TableHead>
              <TableHead>分配级别 Assign Tier</TableHead>
              <TableHead className="text-right">操作 Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  暂无用户 No users
                </TableCell>
              </TableRow>
            ) : (
              users.map(user => {
                const currentTierId = getDisplayTierId(user.id);
                const tierInfo = getTierInfo(currentTierId ?? null);
                const hasChange = pendingChanges[user.id] !== undefined;

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.username || '-'}
                    </TableCell>
                    <TableCell>
                      {tierInfo ? (
                        <Badge variant="outline">{tierInfo.tier_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">未分配</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tierInfo ? (
                        <Badge variant="secondary" className="font-semibold">
                          {tierInfo.markup_percentage}%
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={currentTierId || 'none'}
                        onValueChange={(val) => handleTierChange(user.id, val === 'none' ? null : val)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="选择级别" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">无 None</SelectItem>
                          {tiers.map(tier => (
                            <SelectItem key={tier.id} value={tier.id}>
                              {tier.tier_name} ({tier.markup_percentage}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={hasChange ? 'default' : 'ghost'}
                        disabled={!hasChange}
                        onClick={() => handleSave(user.id)}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        保存
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
