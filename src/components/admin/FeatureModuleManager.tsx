import { useState, useEffect } from 'react';
import { FeatureModule, FeatureModuleAttribute, InputType } from '@/types/rfq';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FeatureModuleManager = () => {
  const [modules, setModules] = useState<FeatureModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<FeatureModule | null>(null);
  const [attributes, setAttributes] = useState<FeatureModuleAttribute[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<FeatureModuleAttribute | null>(null);
  const [formData, setFormData] = useState<Partial<FeatureModuleAttribute>>({
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
    loadModules();
  }, []);

  useEffect(() => {
    if (selectedModule) {
      loadAttributes(selectedModule.feature_code);
    }
  }, [selectedModule]);

  const loadModules = async () => {
    const data = await rfqService.getFeatureModules();
    setModules(data);
  };

  const loadAttributes = async (featureCode: string) => {
    const data = await rfqService.getFeatureAttributes(featureCode);
    setAttributes(data.sort((a, b) => a.attr_sort - b.attr_sort));
  };

  const handleAdd = () => {
    if (!selectedModule) {
      toast({
        title: '请先选择功能模块',
        variant: 'destructive',
      });
      return;
    }

    setEditingAttribute(null);
    const maxSort = attributes.length > 0 ? Math.max(...attributes.map(a => a.attr_sort)) : 0;
    setFormData({
      feature_code: selectedModule.feature_code,
      feature_name: selectedModule.feature_name,
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

  const handleEdit = (attr: FeatureModuleAttribute) => {
    setEditingAttribute(attr);
    setFormData(attr);
    setOptionsText(attr.options_json.join('\n'));
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.attr_code || !formData.attr_name || !formData.input_type) {
      toast({
        title: '请填写所有必填项',
        variant: 'destructive',
      });
      return;
    }

    const options = optionsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    toast({
      title: editingAttribute ? '更新成功' : '添加成功',
      description: `已${editingAttribute ? '更新' : '添加'}属性: ${formData.attr_name}`,
    });

    setIsDialogOpen(false);
    if (selectedModule) {
      loadAttributes(selectedModule.feature_code);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {modules.map((module) => (
          <Card
            key={module.feature_code}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedModule?.feature_code === module.feature_code
                ? 'ring-2 ring-primary'
                : ''
            }`}
            onClick={() => setSelectedModule(module)}
          >
            <CardHeader>
              <CardTitle className="text-base">{module.feature_name}</CardTitle>
              <CardDescription className="text-sm">{module.feature_name_en}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="outline">{module.feature_code}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedModule(module);
                  }}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedModule && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {selectedModule.feature_name} 的属性
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedModule.feature_name_en}
              </p>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              添加属性
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>排序</TableHead>
                  <TableHead>属性代码</TableHead>
                  <TableHead>属性名称</TableHead>
                  <TableHead>输入类型</TableHead>
                  <TableHead>必填</TableHead>
                  <TableHead>单位</TableHead>
                  <TableHead>报价显示</TableHead>
                  <TableHead className="w-24">操作</TableHead>
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
                  attributes.map((attr) => (
                    <TableRow key={attr.attr_code}>
                      <TableCell>{attr.attr_sort}</TableCell>
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
                      <TableCell className="text-muted-foreground">
                        {attr.unit || '-'}
                      </TableCell>
                      <TableCell>
                        {attr.visible_on_quote === 1 ? (
                          <Badge>显示</Badge>
                        ) : (
                          <Badge variant="outline">隐藏</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(attr)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
                  placeholder="如：voltage"
                  disabled={!!editingAttribute}
                />
              </div>
              <div>
                <Label>属性名称 *</Label>
                <Input
                  value={formData.attr_name}
                  onChange={(e) => setFormData({ ...formData, attr_name: e.target.value })}
                  placeholder="如：电压 Voltage"
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
                  placeholder="如：V, W, Wh"
                />
              </div>
            </div>

            {(formData.input_type === 'select' || formData.input_type === 'multiselect') && (
              <div>
                <Label>选项列表（每行一个）</Label>
                <Textarea
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  placeholder="110V&#10;220V&#10;100-240V"
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

export default FeatureModuleManager;
