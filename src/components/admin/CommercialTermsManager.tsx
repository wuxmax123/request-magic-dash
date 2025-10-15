import { useState, useEffect } from 'react';
import { CommercialTerm, InputType } from '@/types/rfq';
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

const CommercialTermsManager = () => {
  const [terms, setTerms] = useState<CommercialTerm[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<CommercialTerm | null>(null);
  const [formData, setFormData] = useState<Partial<CommercialTerm>>({
    attr_code: '',
    attr_name: '',
    input_type: 'text',
    required: 0,
    unit: '',
    options_json: [],
    help_text: '',
    visible_on_quote: 1,
    attr_sort: 1,
    has_refundable_checkbox: false,
  });
  const [optionsText, setOptionsText] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadTerms();
  }, []);

  const loadTerms = async () => {
    const data = await rfqService.getCommercialTerms();
    setTerms(data.sort((a, b) => a.attr_sort - b.attr_sort));
  };

  const handleAdd = () => {
    setEditingTerm(null);
    const maxSort = terms.length > 0 ? Math.max(...terms.map(t => t.attr_sort)) : 0;
    setFormData({
      attr_code: '',
      attr_name: '',
      input_type: 'text',
      required: 0,
      unit: '',
      options_json: [],
      help_text: '',
      visible_on_quote: 1,
      attr_sort: maxSort + 1,
      has_refundable_checkbox: false,
    });
    setOptionsText('');
    setIsDialogOpen(true);
  };

  const handleEdit = (term: CommercialTerm) => {
    setEditingTerm(term);
    setFormData(term);
    setOptionsText(term.options_json.join('\n'));
    setIsDialogOpen(true);
  };

  const handleDelete = async (term: CommercialTerm) => {
    if (!confirm(`确认删除商务条款"${term.attr_name}"？`)) return;

    try {
      await rfqService.deleteCommercialTerm(term.attr_code);
      toast({
        title: '删除成功',
        description: `已删除商务条款: ${term.attr_name}`,
      });
      loadTerms();
    } catch (error) {
      toast({
        title: '删除失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    const attrCode = (formData.attr_code || '').trim();
    if (!attrCode || !formData.attr_name || !formData.input_type) {
      toast({
        title: '请填写所有必填项',
        variant: 'destructive',
      });
      return;
    }

    const isDuplicate = terms.some(
      (t) => t.attr_code === attrCode && (!editingTerm || editingTerm.attr_code !== attrCode)
    );
    if (isDuplicate) {
      toast({ title: '商务条款代码已存在', description: `重复的代码: ${attrCode}`, variant: 'destructive' });
      return;
    }

    const options = optionsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const dataToSave = {
      ...formData,
      attr_code: attrCode,
      options_json: options,
    } as CommercialTerm;

    try {
      if (editingTerm) {
        await rfqService.updateCommercialTerm(editingTerm.attr_code, dataToSave);
        toast({
          title: '更新成功',
          description: `已更新商务条款: ${formData.attr_name}`,
        });
      } else {
        await rfqService.createCommercialTerm(dataToSave);
        toast({
          title: '添加成功',
          description: `已添加商务条款: ${formData.attr_name}`,
        });
      }
      setIsDialogOpen(false);
      loadTerms();
    } catch (error: any) {
      toast({
        title: '保存失败',
        description: error?.message || '请稍后重试',
        variant: 'destructive',
      });
      console.error('Create/Update commercial term failed:', error);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newTerms = [...terms];
    [newTerms[index - 1], newTerms[index]] = [newTerms[index], newTerms[index - 1]];
    newTerms.forEach((term, i) => {
      term.attr_sort = i + 1;
      rfqService.updateCommercialTerm(term.attr_code, { attr_sort: i + 1 });
    });
    setTerms(newTerms);
  };

  const handleMoveDown = (index: number) => {
    if (index === terms.length - 1) return;
    const newTerms = [...terms];
    [newTerms[index], newTerms[index + 1]] = [newTerms[index + 1], newTerms[index]];
    newTerms.forEach((term, i) => {
      term.attr_sort = i + 1;
      rfqService.updateCommercialTerm(term.attr_code, { attr_sort: i + 1 });
    });
    setTerms(newTerms);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">商务条款管理</h3>
          <p className="text-sm text-muted-foreground">管理通用商务条款属性，如包装形式、交期、打样费等</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          添加商务条款
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">排序</TableHead>
              <TableHead>代码</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>输入类型</TableHead>
              <TableHead>必填</TableHead>
              <TableHead>单位</TableHead>
              <TableHead>可退款选项</TableHead>
              <TableHead>报价显示</TableHead>
              <TableHead className="w-32">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {terms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  暂无商务条款，点击"添加商务条款"开始配置
                </TableCell>
              </TableRow>
            ) : (
              terms.map((term, index) => (
                <TableRow key={term.attr_code}>
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
                        disabled={index === terms.length - 1}
                      >
                        <MoveDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{term.attr_code}</TableCell>
                  <TableCell>{term.attr_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{term.input_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {term.required === 1 ? (
                      <Badge variant="destructive">必填</Badge>
                    ) : (
                      <Badge variant="secondary">可选</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{term.unit || '-'}</TableCell>
                  <TableCell>
                    {term.has_refundable_checkbox ? (
                      <Badge>是</Badge>
                    ) : (
                      <Badge variant="outline">否</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {term.visible_on_quote === 1 ? (
                      <Badge>显示</Badge>
                    ) : (
                      <Badge variant="outline">隐藏</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(term)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(term)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTerm ? '编辑商务条款' : '添加商务条款'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>代码 *</Label>
                <Input
                  value={formData.attr_code}
                  onChange={(e) => setFormData({ ...formData, attr_code: e.target.value })}
                  placeholder="如：package_type"
                  disabled={!!editingTerm}
                />
              </div>
              <div>
                <Label>名称 *</Label>
                <Input
                  value={formData.attr_name}
                  onChange={(e) => setFormData({ ...formData, attr_name: e.target.value })}
                  placeholder="如：包装形式 Package"
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
                  placeholder="如：天, 元, USD"
                />
              </div>
            </div>

            {(formData.input_type === 'select' || formData.input_type === 'multiselect') && (
              <div>
                <Label>选项列表（每行一个）</Label>
                <Textarea
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  placeholder="纸盒&#10;塑料盒&#10;布袋"
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
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.has_refundable_checkbox || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, has_refundable_checkbox: checked })
                  }
                />
                <Label>带"可退款"选项</Label>
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

export default CommercialTermsManager;
