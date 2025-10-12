import { useState, useEffect } from 'react';
import { Category } from '@/types/rfq';
import { rfqService } from '@/services/rfqService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CategoryManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedL1, setSelectedL1] = useState<Category | null>(null);
  const [selectedL2, setSelectedL2] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [formData, setFormData] = useState({
    name_cn: '',
    name_en: '',
    code: '',
    level: 1 as 1 | 2 | 3,
    parent_id: null as number | null,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const data = await rfqService.getCategoryTree();
    setCategories(data);
  };

  const handleAdd = (level: 1 | 2 | 3, parent?: Category) => {
    setEditingCategory(null);
    setFormData({
      name_cn: '',
      name_en: '',
      code: '',
      level,
      parent_id: parent?.id || null,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name_cn: category.name_cn,
      name_en: category.name_en,
      code: category.code,
      level: category.level,
      parent_id: category.parent_id,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`确认删除"${category.name_cn}"？此操作将删除所有子类目。`)) return;
    
    try {
      await rfqService.deleteCategory(category.id);
      toast({
        title: '删除成功',
        description: `已删除类目: ${category.name_cn}`,
      });
      loadCategories();
    } catch (error) {
      toast({
        title: '删除失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    if (!formData.name_cn || !formData.name_en || !formData.code) {
      toast({
        title: '请填写所有必填项',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingCategory) {
        await rfqService.updateCategory(editingCategory.id!, formData);
        toast({
          title: '更新成功',
          description: `已更新类目: ${formData.name_cn}`,
        });
      } else {
        await rfqService.createCategory(formData as Omit<Category, 'id'>);
        toast({
          title: '添加成功',
          description: `已添加类目: ${formData.name_cn}`,
        });
      }
      setIsDialogOpen(false);
      loadCategories();
    } catch (error) {
      toast({
        title: '保存失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const getL2Children = (l1: Category) => l1.children || [];
  const getL3Children = (l2: Category) => l2.children || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {/* L1 Categories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">一级类目 L1</h3>
            <Button size="sm" onClick={() => handleAdd(1)}>
              <Plus className="h-4 w-4 mr-1" />
              添加
            </Button>
          </div>
          <div className="border rounded-lg divide-y max-h-[600px] overflow-y-auto">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                  selectedL1?.id === cat.id ? 'bg-accent' : ''
                }`}
                onClick={() => {
                  setSelectedL1(cat);
                  setSelectedL2(null);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{cat.name_cn}</div>
                    <div className="text-xs text-muted-foreground">{cat.name_en}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(cat);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(cat);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* L2 Categories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">二级类目 L2</h3>
            {selectedL1 && (
              <Button size="sm" onClick={() => handleAdd(2, selectedL1)}>
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            )}
          </div>
          <div className="border rounded-lg divide-y max-h-[600px] overflow-y-auto">
            {selectedL1 ? (
              getL2Children(selectedL1).map((cat) => (
                <div
                  key={cat.id}
                  className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                    selectedL2?.id === cat.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedL2(cat)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{cat.name_cn}</div>
                      <div className="text-xs text-muted-foreground">{cat.name_en}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(cat);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(cat);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                请先选择一级类目
              </div>
            )}
          </div>
        </div>

        {/* L3 Categories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">三级类目 L3</h3>
            {selectedL2 && (
              <Button size="sm" onClick={() => handleAdd(3, selectedL2)}>
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            )}
          </div>
          <div className="border rounded-lg divide-y max-h-[600px] overflow-y-auto">
            {selectedL2 ? (
              getL3Children(selectedL2).map((cat) => (
                <div key={cat.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{cat.name_cn}</div>
                      <div className="text-xs text-muted-foreground">{cat.name_en}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(cat)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(cat)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                请先选择二级类目
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? '编辑类目' : '添加类目'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>中文名称 *</Label>
              <Input
                value={formData.name_cn}
                onChange={(e) => setFormData({ ...formData, name_cn: e.target.value })}
                placeholder="如：服装"
              />
            </div>
            <div>
              <Label>英文名称 *</Label>
              <Input
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="如：Apparel"
              />
            </div>
            <div>
              <Label>代码 *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="如：apparel"
              />
            </div>
            <div>
              <Label>级别</Label>
              <Input value={`L${formData.level}`} disabled />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManager;
