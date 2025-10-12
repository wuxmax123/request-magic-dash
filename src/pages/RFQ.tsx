import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RFQData, Category, CategoryAttribute, FeatureModule, FeatureModuleAttribute, Supplier, ValidationError } from '@/types/rfq';
import { rfqService } from '@/services/rfqService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CategoryCascader } from '@/components/rfq/CategoryCascader';
import { FormRenderer } from '@/components/rfq/FormRenderer';
import { FeatureSelector } from '@/components/rfq/FeatureSelector';
import { AttachmentUploader } from '@/components/rfq/AttachmentUploader';
import { SupplierTable } from '@/components/rfq/SupplierTable';
import { QuoteDrawer } from '@/components/rfq/QuoteDrawer';
import { ReviewPanel } from '@/components/rfq/ReviewPanel';
import { ArrowLeft, Save, Send, Plus, AlertCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RFQ() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [featureModules, setFeatureModules] = useState<FeatureModule[]>([]);
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([]);
  const [featureAttrsMap, setFeatureAttrsMap] = useState<Record<string, FeatureModuleAttribute[]>>({});
  const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([]);

  // RFQ form data
  const [rfqData, setRfqData] = useState<RFQData>({
    title: '',
    source_links: [],
    customer_links: [],
    target_country: 'US',
    target_city: '',
    incoterm: 'EXW',
    currency: 'USD',
    category_l1: null,
    category_l2: null,
    category_l3: null,
    feature_modules: [],
    attributes: {},
    feature_attributes: {},
    suppliers: [],
    images: [],
    attachments: [],
    notes: '',
    status: 'draft',
  });

  const [sourceLink, setSourceLink] = useState('');
  const [customerLink, setCustomerLink] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [attrErrors, setAttrErrors] = useState<Record<string, string>>({});

  // Quote drawer state
  const [quoteDrawerOpen, setQuoteDrawerOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [cats, modules, suppliers] = await Promise.all([
          rfqService.getCategoryTree(),
          rfqService.getFeatureModules(),
          rfqService.listSuppliers(),
        ]);
        setCategories(cats);
        setFeatureModules(modules);
        setAvailableSuppliers(suppliers);
      } catch (error) {
        toast({
          title: '数据加载失败',
          description: '请刷新页面重试',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load category attributes when L3 selected
  useEffect(() => {
    if (rfqData.category_l3) {
      rfqService.getCategoryAttributes(rfqData.category_l3).then(setCategoryAttributes);
    } else {
      setCategoryAttributes([]);
    }
  }, [rfqData.category_l3]);

  // Load feature attributes when modules selected
  useEffect(() => {
    const loadFeatureAttrs = async () => {
      const attrsMap: Record<string, FeatureModuleAttribute[]> = {};
      for (const moduleCode of rfqData.feature_modules) {
        attrsMap[moduleCode] = await rfqService.getFeatureAttributes(moduleCode);
      }
      setFeatureAttrsMap(attrsMap);
    };
    if (rfqData.feature_modules.length > 0) {
      loadFeatureAttrs();
    } else {
      setFeatureAttrsMap({});
    }
  }, [rfqData.feature_modules]);

  const updateRfqData = (updates: Partial<RFQData>) => {
    setRfqData(prev => ({ ...prev, ...updates }));
  };

  const addSourceLink = () => {
    if (sourceLink.trim()) {
      updateRfqData({ source_links: [...rfqData.source_links, sourceLink.trim()] });
      setSourceLink('');
    }
  };

  const addCustomerLink = () => {
    if (customerLink.trim()) {
      updateRfqData({ customer_links: [...rfqData.customer_links, customerLink.trim()] });
      setCustomerLink('');
    }
  };

  const removeLink = (type: 'source' | 'customer', index: number) => {
    if (type === 'source') {
      updateRfqData({ source_links: rfqData.source_links.filter((_, i) => i !== index) });
    } else {
      updateRfqData({ customer_links: rfqData.customer_links.filter((_, i) => i !== index) });
    }
  };

  const updateCategoryAttribute = (code: string, value: any) => {
    updateRfqData({
      attributes: { ...rfqData.attributes, [code]: value }
    });
    if (attrErrors[code]) {
      setAttrErrors(prev => ({ ...prev, [code]: '' }));
    }
  };

  const updateFeatureAttribute = (moduleCode: string, attrCode: string, value: any) => {
    updateRfqData({
      feature_attributes: {
        ...rfqData.feature_attributes,
        [moduleCode]: {
          ...rfqData.feature_attributes[moduleCode],
          [attrCode]: value,
        }
      }
    });
  };

  const addSupplierToRfq = (supplierId: number) => {
    const supplier = availableSuppliers.find(s => s.supplier_id === supplierId);
    if (supplier && !rfqData.suppliers.find(s => s.supplier_id === supplierId)) {
      updateRfqData({
        suppliers: [...rfqData.suppliers, { ...supplier, quotes: [] }]
      });
    }
  };

  const handleAddQuote = (supplierId: number) => {
    const supplier = rfqData.suppliers.find(s => s.supplier_id === supplierId);
    if (supplier) {
      setSelectedSupplier(supplier);
      setQuoteDrawerOpen(true);
    }
  };

  const handleSaveQuote = (quote: any) => {
    if (selectedSupplier) {
      updateRfqData({
        suppliers: rfqData.suppliers.map(s =>
          s.supplier_id === selectedSupplier.supplier_id
            ? { ...s, quotes: [...s.quotes, quote] }
            : s
        )
      });
    }
  };

  const validateRfq = (): boolean => {
    const errors: ValidationError[] = [];
    const newAttrErrors: Record<string, string> = {};

    // Basic validation
    if (!rfqData.category_l3) {
      errors.push({ field: 'category', message: '请选择三级类目', tab: 0 });
    }

    // Category attributes validation
    categoryAttributes.forEach(attr => {
      if (attr.required === 1) {
        const value = rfqData.attributes[attr.attr_code];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          newAttrErrors[attr.attr_code] = '此项必填';
          errors.push({ field: attr.attr_code, message: `${attr.attr_name} 必填`, tab: 1 });
        }
      }
    });

    // Feature modules validation
    rfqData.feature_modules.forEach(moduleCode => {
      const attrs = featureAttrsMap[moduleCode] || [];
      attrs.forEach(attr => {
        if (attr.required === 1) {
          const value = rfqData.feature_attributes[moduleCode]?.[attr.attr_code];
          if (!value || (Array.isArray(value) && value.length === 0)) {
            errors.push({ field: attr.attr_code, message: `${attr.attr_name} 必填`, tab: 2 });
          }
        }
      });
    });

    setValidationErrors(errors);
    setAttrErrors(newAttrErrors);
    return errors.length === 0;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const result = await rfqService.saveRFQ({ ...rfqData, status: 'draft' });
      toast({
        title: '草稿保存成功',
        description: `RFQ ID: ${result.id}`,
      });
    } catch (error) {
      toast({
        title: '保存失败',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateRfq()) {
      toast({
        title: '验证失败',
        description: `发现 ${validationErrors.length} 个错误，请检查`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const result = await rfqService.saveRFQ({ ...rfqData, status: 'submitted' });
      toast({
        title: '提交成功',
        description: `RFQ ID: ${result.id}`,
      });
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      toast({
        title: '提交失败',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getCategoryPath = (): string => {
    if (!rfqData.category_l3) return '';
    
    const findPath = (cats: Category[], path: string[] = []): string[] | null => {
      for (const cat of cats) {
        const currentPath = [...path, cat.name_cn];
        if (cat.id === rfqData.category_l3 && cat.level === 3) {
          return currentPath;
        }
        if (cat.children) {
          const found = findPath(cat.children, currentPath);
          if (found) return found;
        }
      }
      return null;
    };
    return findPath(categories)?.join(' > ') || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">新建询价单 New RFQ</h1>
              <p className="text-sm text-muted-foreground">
                {rfqData.title || '未命名RFQ'} · <Badge variant="outline">{rfqData.status}</Badge>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              保存草稿
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              <Send className="h-4 w-4 mr-2" />
              提交
            </Button>
          </div>
        </div>
      </header>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="container mx-auto px-4 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">发现 {validationErrors.length} 个验证错误：</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {validationErrors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="category">类目属性</TabsTrigger>
            <TabsTrigger value="features">功能模块</TabsTrigger>
            <TabsTrigger value="suppliers">供应商报价</TabsTrigger>
            <TabsTrigger value="review">预览提交</TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Info */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
                <CardDescription>填写RFQ的基本信息和来源链接</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Links */}
                <div className="space-y-4">
                  <div>
                    <Label>客户链接 Customer Links</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="粘贴客户链接..."
                        value={customerLink}
                        onChange={(e) => setCustomerLink(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCustomerLink()}
                      />
                      <Button onClick={addCustomerLink}>添加</Button>
                    </div>
                    {rfqData.customer_links.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {rfqData.customer_links.map((link, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="flex-1 justify-start truncate">{link}</Badge>
                            <Button variant="ghost" size="sm" onClick={() => removeLink('customer', i)}>删除</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>来源链接 Source Links (1688/Amazon/Shopify)</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="粘贴来源链接..."
                        value={sourceLink}
                        onChange={(e) => setSourceLink(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSourceLink()}
                      />
                      <Button onClick={addSourceLink}>添加</Button>
                    </div>
                    {rfqData.source_links.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {rfqData.source_links.map((link, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="flex-1 justify-start truncate">{link}</Badge>
                            <Button variant="ghost" size="sm" onClick={() => removeLink('source', i)}>删除</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title">RFQ标题 *</Label>
                  <Input
                    id="title"
                    value={rfqData.title}
                    onChange={(e) => updateRfqData({ title: e.target.value })}
                    placeholder="描述性标题..."
                  />
                </div>

                {/* Target Market */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="country">目的国 *</Label>
                    <Input
                      id="country"
                      value={rfqData.target_country}
                      onChange={(e) => updateRfqData({ target_country: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">目的城市</Label>
                    <Input
                      id="city"
                      value={rfqData.target_city}
                      onChange={(e) => updateRfqData({ target_city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">货币</Label>
                    <Select value={rfqData.currency} onValueChange={(val) => updateRfqData({ currency: val })}>
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CNY">CNY</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="incoterm">贸易条款 Incoterm</Label>
                    <Select value={rfqData.incoterm} onValueChange={(val) => updateRfqData({ incoterm: val })}>
                      <SelectTrigger id="incoterm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXW">EXW</SelectItem>
                        <SelectItem value="FOB">FOB</SelectItem>
                        <SelectItem value="CIF">CIF</SelectItem>
                        <SelectItem value="DDP">DDP</SelectItem>
                        <SelectItem value="DDU">DDU</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="target_weight">重量 (kg)</Label>
                    <Input
                      id="target_weight"
                      type="number"
                      value={rfqData.target_weight_kg || ''}
                      onChange={(e) => updateRfqData({ target_weight_kg: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="重量"
                    />
                  </div>
                  <div>
                    <Label htmlFor="target_price">价格</Label>
                    <Input
                      id="target_price"
                      type="number"
                      value={rfqData.target_price || ''}
                      onChange={(e) => updateRfqData({ target_price: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="价格"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <Label>产品类目 (三级) *</Label>
                  <CategoryCascader
                    categories={categories}
                    value={[rfqData.category_l1, rfqData.category_l2, rfqData.category_l3]}
                    onChange={([l1, l2, l3]) => updateRfqData({ category_l1: l1, category_l2: l2, category_l3: l3 })}
                    required
                  />
                </div>

                {/* Feature Modules */}
                <div>
                  <Label>功能模块 Feature Modules</Label>
                  <FeatureSelector
                    modules={featureModules}
                    selected={rfqData.feature_modules}
                    onChange={(modules) => updateRfqData({ feature_modules: modules })}
                  />
                </div>

                {/* Attachments */}
                <div>
                  <Label>图片与附件</Label>
                  <AttachmentUploader
                    images={rfqData.images}
                    attachments={rfqData.attachments}
                    onImagesChange={(imgs) => updateRfqData({ images: imgs })}
                    onAttachmentsChange={(files) => updateRfqData({ attachments: files })}
                  />
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">备注 Notes</Label>
                  <Textarea
                    id="notes"
                    value={rfqData.notes}
                    onChange={(e) => updateRfqData({ notes: e.target.value })}
                    rows={4}
                    placeholder="其他说明..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Category Attributes */}
          <TabsContent value="category">
            <Card>
              <CardHeader>
                <CardTitle>类目属性</CardTitle>
                <CardDescription>
                  {getCategoryPath() || '请先在"基本信息"中选择三级类目'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rfqData.category_l3 ? (
                  <FormRenderer
                    attributes={categoryAttributes}
                    values={rfqData.attributes}
                    onChange={updateCategoryAttribute}
                    errors={attrErrors}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>请先选择类目</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Feature Modules */}
          <TabsContent value="features" className="space-y-4">
            {rfqData.feature_modules.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>未选择功能模块</p>
                  <p className="text-sm mt-1">请在"基本信息"中添加功能模块</p>
                </CardContent>
              </Card>
            ) : (
              rfqData.feature_modules.map(moduleCode => {
                const attrs = featureAttrsMap[moduleCode] || [];
                const moduleInfo = featureModules.find(m => m.feature_code === moduleCode);
                
                return (
                  <Collapsible key={moduleCode} defaultOpen>
                    <Card>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <CardTitle className="text-lg flex items-center justify-between">
                            <span>{moduleInfo?.feature_name} {moduleInfo?.feature_name_en}</span>
                            <Badge>{attrs.length} 个属性</Badge>
                          </CardTitle>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent>
                          <FormRenderer
                            attributes={attrs}
                            values={rfqData.feature_attributes[moduleCode] || {}}
                            onChange={(code, value) => updateFeatureAttribute(moduleCode, code, value)}
                          />
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })
            )}
          </TabsContent>

          {/* Tab 4: Suppliers & Quotes */}
          <TabsContent value="suppliers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>选择供应商</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Show available suppliers picker
                      const supplierId = availableSuppliers[0]?.supplier_id;
                      if (supplierId) addSupplierToRfq(supplierId);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加供应商
                  </Button>
                </CardTitle>
                <CardDescription>从可用供应商列表中选择，并为其添加报价</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Available Suppliers Quick Add */}
                <div className="mb-4">
                  <Label className="text-sm text-muted-foreground">可用供应商：</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableSuppliers
                      .filter(s => !rfqData.suppliers.find(rs => rs.supplier_id === s.supplier_id))
                      .map(supplier => (
                        <Button
                          key={supplier.supplier_id}
                          variant="outline"
                          size="sm"
                          onClick={() => addSupplierToRfq(supplier.supplier_id)}
                        >
                          {supplier.name}
                        </Button>
                      ))}
                  </div>
                </div>

                <SupplierTable
                  suppliers={rfqData.suppliers}
                  onAddQuote={handleAddQuote}
                  onViewQuotes={(id) => toast({ title: '查看报价功能' })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Review & Submit */}
          <TabsContent value="review">
            <Card>
              <CardHeader>
                <CardTitle>预览与提交</CardTitle>
                <CardDescription>检查所有信息后提交RFQ</CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewPanel
                  rfqData={rfqData}
                  categoryPath={getCategoryPath()}
                  categoryAttributes={categoryAttributes}
                  featureAttributes={featureAttrsMap}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quote Drawer */}
      {selectedSupplier && (
        <QuoteDrawer
          open={quoteDrawerOpen}
          onOpenChange={setQuoteDrawerOpen}
          supplierName={selectedSupplier.name}
          onSave={handleSaveQuote}
        />
      )}
    </div>
  );
}
