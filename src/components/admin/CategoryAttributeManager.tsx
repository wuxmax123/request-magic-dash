import { useState, useEffect } from 'react';
import { Category, CategoryAttribute, InputType } from '@/types/rfq';
import { rfqService } from '@/services/rfqService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, MoveUp, MoveDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CategoryCascader } from '@/components/rfq/CategoryCascader';

const CategoryAttributeManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<[number | null, number | null, number | null]>([null, null, null]);
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<CategoryAttribute | null>(null);
  const [formData, setFormData] = useState<Partial<CategoryAttribute>>({
    attr_code: '',
    attr_name: '',
    input_type: 'text',
    required: 0,
    unit: '',
    options_json: [],
    help_text: '',
    visible_on_quote: 1,
    attr_sort: 1,
  });
  const [optionsText, setOptionsText] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const l3Id = selectedCategory[2];
    if (l3Id) {
      loadAttributes(l3Id);
    } else {
      setAttributes([]);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    const data = await rfqService.getCategoryTree();
    setCategories(data);
  };

  const loadAttributes = async (l3Id: number) => {
    const data = await rfqService.getCategoryAttributes(l3Id);
    setAttributes(data.sort((a, b) => a.attr_sort - b.attr_sort));
  };

  const handleAdd = () => {
    const l3Id = selectedCategory[2];
    if (!l3Id) {
      toast({
        title: '请先选择L3类目',
        variant: 'destructive',
      });
      return;
    }

    setEditingAttribute(null);
    const maxSort = attributes.length > 0 ? Math.max(...attributes.map(a => a.attr_sort)) : 0;
    setFormData({
      category_id: l3Id,
      attr_code: '',
      attr_name: '',
      input_type: 'text',
      required: 0,
      unit: '',
      options_json: [],
      help_text: '',
      visible_on_quote: 1,
      attr_sort: maxSort + 1,
    });
    setOptionsText('');
    setIsDialogOpen(true);
  };

  const handleEdit = (attr: CategoryAttribute) => {
    setEditingAttribute(attr);
    setFormData(attr);
    setOptionsText(attr.options_json.join('\n'));
    setIsDialogOpen(true);
  };

  const handleDelete = async (attr: CategoryAttribute) => {
    if (!confirm(`确认删除属性"${attr.attr_name}"？`)) return;

    try {
      await rfqService.deleteCategoryAttribute(attr.category_id, attr.attr_code);
      toast({
        title: '删除成功',
        description: `已删除属性: ${attr.attr_name}`,
      });
      loadAttributes(selectedCategory[2]!);
    } catch (error) {
      toast({
        title: '删除失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    const l3Id = selectedCategory[2];
    if (!l3Id) {
      toast({ title: '请先选择L3类目', variant: 'destructive' });
      return;
    }

    const attrCode = (formData.attr_code || '').trim();
    if (!attrCode || !formData.attr_name || !formData.input_type) {
      toast({
        title: '请填写所有必填项',
        variant: 'destructive',
      });
      return;
    }

    // Duplicate code check within this L3 category
    const isDuplicate = attributes.some(
      (a) => a.attr_code === attrCode && (!editingAttribute || editingAttribute.attr_code !== attrCode)
    );
    if (isDuplicate) {
      toast({ title: '属性代码已存在', description: `重复的代码: ${attrCode}`, variant: 'destructive' });
      return;
    }

    const options = optionsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const dataToSave = {
      ...formData,
      category_id: formData.category_id ?? l3Id,
      attr_code: attrCode,
      options_json: options,
    } as CategoryAttribute;

    try {
      if (editingAttribute) {
        await rfqService.updateCategoryAttribute(
          editingAttribute.category_id,
          editingAttribute.attr_code,
          dataToSave
        );
        toast({
          title: '更新成功',
          description: `已更新属性: ${formData.attr_name}`,
        });
      } else {
        await rfqService.createCategoryAttribute(dataToSave);
        toast({
          title: '添加成功',
          description: `已添加属性: ${formData.attr_name}`,
        });
      }
      setIsDialogOpen(false);
      loadAttributes(selectedCategory[2]!);
    } catch (error: any) {
      toast({
        title: '保存失败',
        description: error?.message || '请稍后重试',
        variant: 'destructive',
      });
      console.error('Create/Update category attribute failed:', error);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newAttrs = [...attributes];
    [newAttrs[index - 1], newAttrs[index]] = [newAttrs[index], newAttrs[index - 1]];
    newAttrs.forEach((attr, i) => {
      attr.attr_sort = i + 1;
      rfqService.updateCategoryAttribute(attr.category_id, attr.attr_code, { attr_sort: i + 1 });
    });
    setAttributes(newAttrs);
  };

  const handleMoveDown = (index: number) => {
    if (index === attributes.length - 1) return;
    const newAttrs = [...attributes];
    [newAttrs[index], newAttrs[index + 1]] = [newAttrs[index + 1], newAttrs[index]];
    newAttrs.forEach((attr, i) => {
      attr.attr_sort = i + 1;
      rfqService.updateCategoryAttribute(attr.category_id, attr.attr_code, { attr_sort: i + 1 });
    });
    setAttributes(newAttrs);
  };

  const getSelectedCategoryName = () => {
    const [l1Id, l2Id, l3Id] = selectedCategory;
    if (!l3Id) return '未选择';
    let name = '';
    for (const l1 of categories) {
      if (l1.id === l1Id) {
        name = l1.name_cn;
        if (l1.children) {
          for (const l2 of l1.children) {
            if (l2.id === l2Id) {
              name += ` > ${l2.name_cn}`;
              if (l2.children) {
                for (const l3 of l2.children) {
                  if (l3.id === l3Id) {
                    name += ` > ${l3.name_cn}`;
                    break;
                  }
                }
              }
              break;
            }
          }
        }
        break;
      }
    }
    return name;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label>选择L3类目 *</Label>
          <CategoryCascader
            categories={categories}
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val)}
            required
          />
        </div>
        <div className="pt-6">
          <Button onClick={handleAdd} disabled={!selectedCategory[2]}>
            <Plus className="h-4 w-4 mr-2" />
            添加属性
          </Button>
        </div>
      </div>

      {selectedCategory[2] && (
        <div className="border rounded-lg">
          <div className="bg-muted p-3 flex items-center justify-between">
            <div className="font-semibold">
              当前类目：{getSelectedCategoryName()}
            </div>
            <Badge variant="outline">{attributes.length} 个属性</Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">排序</TableHead>
                <TableHead>属性代码</TableHead>
                <TableHead>属性名称</TableHead>
                <TableHead>输入类型</TableHead>
                <TableHead>必填</TableHead>
                <TableHead>单位</TableHead>
                <TableHead>报价显示</TableHead>
                <TableHead className="w-32">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    暂无属性，点击"添加属性"开始配置
                  </TableCell>
                </TableRow>
              ) : (
                attributes.map((attr, index) => (
                  <TableRow key={attr.attr_code}>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <MoveUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === attributes.length - 1}
                        >
                          <MoveDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{attr.attr_code}</TableCell>
                    <TableCell>{attr.attr_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{attr.input_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {attr.required === 1 ? (
                        <Badge variant="destructive">必填</Badge>
                      ) : (
                        <Badge variant="secondary">可选</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{attr.unit || '-'}</TableCell>
                    <TableCell>
                      {attr.visible_on_quote === 1 ? (
                        <Badge>显示</Badge>
                      ) : (
                        <Badge variant="outline">隐藏</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(attr)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(attr)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAttribute ? '编辑属性' : '添加属性'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>属性代码 *</Label>
                <Input
                  value={formData.attr_code}
                  onChange={(e) => setFormData({ ...formData, attr_code: e.target.value })}
                  placeholder="如：size"
                  disabled={!!editingAttribute}
                />
              </div>
              <div>
                <Label>属性名称 *</Label>
                <Input
                  value={formData.attr_name}
                  onChange={(e) => setFormData({ ...formData, attr_name: e.target.value })}
                  placeholder="如：尺码 Size"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>输入类型 *</Label>
                <Select
                  value={formData.input_type}
                  onValueChange={(value: InputType) =>
                    setFormData({ ...formData, input_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">文本 Text</SelectItem>
                    <SelectItem value="textarea">长文本 Textarea</SelectItem>
                    <SelectItem value="number">数字 Number</SelectItem>
                    <SelectItem value="select">单选 Select</SelectItem>
                    <SelectItem value="multiselect">多选 Multiselect</SelectItem>
                    <SelectItem value="bool">布尔 Boolean</SelectItem>
                    <SelectItem value="file">文件 File</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>单位</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="如：cm, kg, W"
                />
              </div>
            </div>

            {(formData.input_type === 'select' || formData.input_type === 'multiselect') && (
              <div>
                <Label>选项列表（每行一个）</Label>
                <Textarea
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  placeholder="XS&#10;S&#10;M&#10;L&#10;XL"
                  rows={5}
                />
              </div>
            )}

            <div>
              <Label>帮助文本</Label>
              <Input
                value={formData.help_text}
                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                placeholder="为用户提供填写提示"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.required === 1}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, required: checked ? 1 : 0 })
                  }
                />
                <Label>必填</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.visible_on_quote === 1}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, visible_on_quote: checked ? 1 : 0 })
                  }
                />
                <Label>在报价单中显示</Label>
              </div>
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

export default CategoryAttributeManager;
