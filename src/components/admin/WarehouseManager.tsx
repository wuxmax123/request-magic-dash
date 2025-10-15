import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as shippingService from '@/services/shippingService';
import { Warehouse } from '@/types/shipping';

export function WarehouseManager() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    warehouse_code: '',
    name_cn: '',
    name_en: '',
    country: '',
    province: '',
    city: '',
    address: '',
    is_active: true,
    sort: 0,
  });

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const data = await shippingService.getWarehouses();
      setWarehouses(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load warehouses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingWarehouse(null);
    setFormData({
      warehouse_code: '',
      name_cn: '',
      name_en: '',
      country: '',
      province: '',
      city: '',
      address: '',
      is_active: true,
      sort: 0,
    });
    setDialogOpen(true);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      warehouse_code: warehouse.warehouse_code,
      name_cn: warehouse.name_cn,
      name_en: warehouse.name_en,
      country: warehouse.country,
      province: warehouse.province || '',
      city: warehouse.city || '',
      address: warehouse.address || '',
      is_active: warehouse.is_active,
      sort: warehouse.sort,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingWarehouse) {
        await shippingService.updateWarehouse(editingWarehouse.id, formData);
        toast({
          title: 'Success',
          description: 'Warehouse updated successfully',
        });
      } else {
        await shippingService.createWarehouse(formData);
        toast({
          title: 'Success',
          description: 'Warehouse created successfully',
        });
      }
      setDialogOpen(false);
      loadWarehouses();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save warehouse',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await shippingService.deleteWarehouse(deletingId);
      toast({
        title: 'Success',
        description: 'Warehouse deleted successfully',
      });
      setDeleteDialogOpen(false);
      loadWarehouses();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete warehouse',
        variant: 'destructive',
      });
    }
  };

  const filteredWarehouses = warehouses.filter(w =>
    w.name_cn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search warehouses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Warehouse
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
                <TableHead>Code</TableHead>
                <TableHead>Name (CN)</TableHead>
                <TableHead>Name (EN)</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWarehouses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No warehouses found
                  </TableCell>
                </TableRow>
              ) : (
                filteredWarehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell className="font-mono">{warehouse.warehouse_code}</TableCell>
                    <TableCell>{warehouse.name_cn}</TableCell>
                    <TableCell>{warehouse.name_en}</TableCell>
                    <TableCell>{warehouse.city}, {warehouse.country}</TableCell>
                    <TableCell>
                      <Switch checked={warehouse.is_active} disabled />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(warehouse)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(warehouse.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
            </DialogTitle>
            <DialogDescription>
              Fill in the warehouse details below
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Warehouse Code *</Label>
              <Input
                value={formData.warehouse_code}
                onChange={(e) => setFormData({ ...formData, warehouse_code: e.target.value })}
                placeholder="e.g., SZ001"
              />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort}
                onChange={(e) => setFormData({ ...formData, sort: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Name (Chinese) *</Label>
              <Input
                value={formData.name_cn}
                onChange={(e) => setFormData({ ...formData, name_cn: e.target.value })}
                placeholder="e.g., 深圳仓"
              />
            </div>
            <div>
              <Label>Name (English) *</Label>
              <Input
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="e.g., Shenzhen Warehouse"
              />
            </div>
            <div>
              <Label>Country *</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g., CN"
              />
            </div>
            <div>
              <Label>Province</Label>
              <Input
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="e.g., 广东省"
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., 深圳市"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., 龙岗区坂田街道"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this warehouse. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
