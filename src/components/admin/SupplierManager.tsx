import { useState, useEffect } from 'react';
import { Supplier } from '@/types/rfq';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SupplierManager() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    province: '',
    city: '',
    address: '',
    contact: '',
    phone: '',
    wechat: '',
    email: '',
    link_1688: '',
    rating_1688: 0,
  });

  useEffect(() => {
    // Load suppliers from localStorage or API
    const saved = localStorage.getItem('suppliers');
    if (saved) {
      setSuppliers(JSON.parse(saved));
    }
  }, []);

  const saveSuppliers = (newSuppliers: Supplier[]) => {
    setSuppliers(newSuppliers);
    localStorage.setItem('suppliers', JSON.stringify(newSuppliers));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: '请填写供应商名称', variant: 'destructive' });
      return;
    }

    if (editingSupplier) {
      // Update existing
      const updated = suppliers.map(s =>
        s.supplier_id === editingSupplier.supplier_id
          ? { ...s, ...formData }
          : s
      );
      saveSuppliers(updated);
      toast({ title: '供应商已更新' });
    } else {
      // Add new
      const newSupplier: Supplier = {
        supplier_id: Date.now(),
        ...formData,
        tags: [],
        rating: 0,
        quotes: [],
      };
      saveSuppliers([...suppliers, newSupplier]);
      toast({ title: '供应商已添加' });
    }

    resetForm();
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      province: supplier.province,
      city: supplier.city,
      address: supplier.address,
      contact: supplier.contact,
      phone: supplier.phone,
      wechat: supplier.wechat,
      email: supplier.email,
      link_1688: supplier.link_1688,
      rating_1688: supplier.rating_1688,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('确定要删除此供应商吗？')) {
      saveSuppliers(suppliers.filter(s => s.supplier_id !== id));
      toast({ title: '供应商已删除' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      province: '',
      city: '',
      address: '',
      contact: '',
      phone: '',
      wechat: '',
      email: '',
      link_1688: '',
      rating_1688: 0,
    });
    setEditingSupplier(null);
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>供应商管理</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                添加供应商
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSupplier ? '编辑供应商' : '添加供应商'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">供应商名称 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="供应商名称"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="province">省份</Label>
                    <Input
                      id="province"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      placeholder="如：广东省"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">城市</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="如：深圳市"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">详细地址</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="详细地址"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact">联系人</Label>
                    <Input
                      id="contact"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="联系人姓名"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">联系电话</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="手机号码"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="wechat">微信</Label>
                    <Input
                      id="wechat"
                      value={formData.wechat}
                      onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
                      placeholder="微信号"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">邮箱</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="邮箱地址"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="link_1688">1688链接</Label>
                  <Input
                    id="link_1688"
                    value={formData.link_1688}
                    onChange={(e) => setFormData({ ...formData, link_1688: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label htmlFor="rating_1688">1688评分 (0-5)</Label>
                  <Input
                    id="rating_1688"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating_1688}
                    onChange={(e) => setFormData({ ...formData, rating_1688: parseFloat(e.target.value) || 0 })}
                    placeholder="评分"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={resetForm}>取消</Button>
                  <Button onClick={handleSubmit}>保存</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {suppliers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            暂无供应商，点击"添加供应商"开始
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>供应商名称</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>联系方式</TableHead>
                <TableHead>1688评分</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.supplier_id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {supplier.province && supplier.city && (
                        <div>{supplier.province} {supplier.city}</div>
                      )}
                      {supplier.address && (
                        <div className="text-muted-foreground">{supplier.address}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {supplier.contact && <div>{supplier.contact}</div>}
                      {supplier.phone && <div>{supplier.phone}</div>}
                      {supplier.wechat && <div className="text-muted-foreground">微信: {supplier.wechat}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {supplier.rating_1688 > 0 && (
                        <Badge variant="secondary">{supplier.rating_1688.toFixed(1)}</Badge>
                      )}
                      {supplier.link_1688 && (
                        <a href={supplier.link_1688} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(supplier)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(supplier.supplier_id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
