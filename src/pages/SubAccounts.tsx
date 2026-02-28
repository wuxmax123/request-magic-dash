import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Trash2, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Store {
  id: string;
  store_name: string;
  platform: string;
}

interface Invitation {
  id: string;
  invited_email: string;
  store_ids: string[];
  status: string;
  child_user_id: string | null;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending: { label: '待接受', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
  accepted: { label: '已接受', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: '已拒绝', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
};

export default function SubAccounts() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [invRes, storeRes] = await Promise.all([
      supabase
        .from('sub_account_invitations')
        .select('id, invited_email, store_ids, status, child_user_id, created_at')
        .eq('parent_user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('stores')
        .select('id, store_name, platform')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('store_name'),
    ]);

    if (invRes.data) setInvitations(invRes.data);
    if (storeRes.data) setStores(storeRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getStoreNames = (storeIds: string[]) => {
    if (!storeIds || storeIds.length === 0) return null;
    return storeIds.map(sid => {
      const store = stores.find(s => s.id === sid);
      return store ? `${store.store_name}` : sid.slice(0, 8);
    });
  };

  const toggleStore = (storeId: string) => {
    setSelectedStoreIds(prev =>
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    );
  };

  const handleInvite = async () => {
    if (!email.trim()) { toast.error('请输入邮箱地址'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { toast.error('请输入有效的邮箱地址'); return; }

    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('请先登录'); setSending(false); return; }

    const { error } = await supabase.from('sub_account_invitations').insert({
      parent_user_id: user.id,
      invited_email: email.trim().toLowerCase(),
      status: 'pending',
      store_ids: selectedStoreIds,
    });
    if (error) {
      if (error.code === '23505') {
        toast.error('该邮箱已被邀请');
      } else {
        toast.error('邀请失败: ' + error.message);
      }
      setSending(false);
      return;
    }

    toast.success('子账号邀请已创建');
    setDialogOpen(false);
    setEmail('');
    setSelectedStoreIds([]);
    setSending(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('sub_account_invitations').delete().eq('id', id);
    if (error) { toast.error('删除失败'); return; }
    toast.success('已删除');
    setInvitations(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">子账号管理</h1>
          <p className="text-muted-foreground">添加子账号并分配店铺权限</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          添加子账号
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">邀请列表</CardTitle>
          <CardDescription>已发送的子账号邀请及其状态</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">加载中...</p>
          ) : invitations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              暂无子账号邀请，点击右上角"添加子账号"开始
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>邮箱</TableHead>
                  <TableHead>关联店铺</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>邀请时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map(inv => {
                  const statusInfo = STATUS_MAP[inv.status] || STATUS_MAP.pending;
                  const storeNames = getStoreNames(inv.store_ids);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {inv.invited_email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {storeNames ? (
                          <div className="flex flex-wrap gap-1">
                            {storeNames.map((name, i) => (
                              <Badge key={i} variant="outline">{name}</Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
                          {statusInfo.icon}
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(inv.created_at).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(inv.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Sub-Account Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加子账号</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>子账号邮箱 *</Label>
              <Input
                type="email"
                placeholder="请输入子账号邮箱"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            {stores.length > 0 && (
              <div className="space-y-3">
                <Label>分配店铺（可多选）</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                  {stores.map(store => (
                    <label
                      key={store.id}
                      className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedStoreIds.includes(store.id)}
                        onCheckedChange={() => toggleStore(store.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{store.store_name}</span>
                        {store.platform && (
                          <Badge variant="outline" className="ml-2 text-xs">{store.platform}</Badge>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                {selectedStoreIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    已选择 {selectedStoreIds.length} 个店铺
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleInvite} disabled={sending}>
              {sending ? '发送中...' : '发送邀请'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
