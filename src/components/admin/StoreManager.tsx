import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Store, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface StoreRecord {
  id: string;
  user_id: string;
  store_name: string;
  platform: string;
  store_url: string | null;
  country: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
}

const PLATFORMS = ['Shopify', 'Amazon', 'eBay', 'Walmart', 'TikTok Shop', 'Temu', 'AliExpress', 'Etsy', '独立站', '其他'];

export function StoreManager() {
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreRecord | null>(null);
  const [form, setForm] = useState({
    user_id: '',
    store_name: '',
    platform: '',
    store_url: '',
    country: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    fetchStores();
    fetchUsers();
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setStores(data);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, username');
    if (data) setUsers(data);
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || user?.username || userId.slice(0, 8);
  };

  const openAdd = () => {
    setEditingStore(null);
    setForm({ user_id: '', store_name: '', platform: '', store_url: '', country: '', notes: '', is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (store: StoreRecord) => {
    setEditingStore(store);
    setForm({
      user_id: store.user_id,
      store_name: store.store_name,
      platform: store.platform,
      store_url: store.store_url || '',
      country: store.country || '',
      notes: store.notes || '',
      is_active: store.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.user_id || !form.store_name) {
      toast.error('请填写用户和店铺名称');
      return;
    }
    const payload = {
      user_id: form.user_id,
      store_name: form.store_name,
      platform: form.platform,
      store_url: form.store_url || null,
      country: form.country || null,
      notes: form.notes || null,
      is_active: form.is_active,
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
    setDialogOpen(false);
    fetchStores();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('stores').delete().eq('id', id);
    if (error) { toast.error('删除失败'); return; }
    toast.success('店铺已删除');
    fetchStores();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              店铺管理 Store Management
            </CardTitle>
            <CardDescription>管理用户店铺信息 / Manage user stores</CardDescription>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" />添加店铺</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>店铺名称</TableHead>
              <TableHead>平台</TableHead>
              <TableHead>所属用户</TableHead>
              <TableHead>国家</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map(store => (
              <TableRow key={store.id}>
                <TableCell className="font-medium">{store.store_name}</TableCell>
                <TableCell><Badge variant="outline">{store.platform || '-'}</Badge></TableCell>
                <TableCell>{getUserName(store.user_id)}</TableCell>
                <TableCell>{store.country || '-'}</TableCell>
                <TableCell>
                  <Badge variant={store.is_active ? 'default' : 'secondary'}>
                    {store.is_active ? '启用' : '停用'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(store)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(store.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {stores.length === 0 && !loading && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">暂无店铺数据</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingStore ? '编辑店铺' : '添加店铺'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>所属用户 *</Label>
                <Select value={form.user_id} onValueChange={v => setForm(f => ({ ...f, user_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="选择用户" /></SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.full_name || u.username || u.id.slice(0, 8)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>店铺名称 *</Label>
                <Input value={form.store_name} onChange={e => setForm(f => ({ ...f, store_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>平台</Label>
                <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))}>
                  <SelectTrigger><SelectValue placeholder="选择平台" /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>店铺链接</Label>
                <Input value={form.store_url} onChange={e => setForm(f => ({ ...f, store_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>国家/地区</Label>
                <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>备注</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>启用</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={handleSave}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
