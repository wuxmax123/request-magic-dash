import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RFQData, Category, CategoryAttribute, FeatureModule, FeatureModuleAttribute, CommercialTerm, Supplier, ValidationError } from '@/types/rfq';
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
import { QuotesViewDialog } from '@/components/rfq/QuotesViewDialog';
import { ReviewPanel } from '@/components/rfq/ReviewPanel';
import { ShippingSelector } from '@/components/rfq/ShippingSelector';
import { CountryMultiSelect } from '@/components/rfq/CountryMultiSelect';
import { ArrowLeft, Save, Send, Plus, AlertCircle, Package as PackageIcon, Eye, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

export default function RFQ() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rfqId = searchParams.get('id');
  const viewMode = searchParams.get('mode') === 'view';
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isViewMode, setIsViewMode] = useState(viewMode);

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [featureModules, setFeatureModules] = useState<FeatureModule[]>([]);
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([]);
  const [featureAttrsMap, setFeatureAttrsMap] = useState<Record<string, FeatureModuleAttribute[]>>({});
  const [commercialTerms, setCommercialTerms] = useState<CommercialTerm[]>([]);
  const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([]);

  // RFQ form data
  const [rfqData, setRfqData] = useState<RFQData>({
    product_name: '',
    reference_number: '',
    title: '',
    source_links: [],
    customer_links: [],
    target_country: '',
    target_countries: [],
    currency: 'USD',
    category_l1: null,
    category_l2: null,
    category_l3: null,
    feature_modules: [],
    attributes: {},
    feature_attributes: {},
    commercial_terms: {},
    suppliers: [],
    images: [],
    attachments: [],
    notes: '',
    status: 'draft',
  });

  const [customerLink, setCustomerLink] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [attrErrors, setAttrErrors] = useState<Record<string, string>>({});

  // Shipping states
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [includeShipping, setIncludeShipping] = useState(false);
  const [selectedShippingQuote, setSelectedShippingQuote] = useState<any>(null);
  const [showShippingPreview, setShowShippingPreview] = useState(false);

  // Quote drawer state
  const [quoteDrawerOpen, setQuoteDrawerOpen] = useState(false);
  const [quotesViewOpen, setQuotesViewOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Load initial data and existing RFQ if id is provided
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [cats, modules, suppliers, warehousesData, terms] = await Promise.all([
          rfqService.getCategoryTree(),
          rfqService.getFeatureModules(),
          rfqService.listSuppliers(),
          import('@/services/shippingService').then(m => m.getActiveWarehouses()),
          rfqService.getCommercialTerms(),
        ]);
        setCategories(cats);
        setFeatureModules(modules);
        setAvailableSuppliers(suppliers);
        setWarehouses(warehousesData);
        setCommercialTerms(terms);

        // Set default warehouse
        if (warehousesData.length > 0 && !selectedWarehouseId) {
          setSelectedWarehouseId(warehousesData[0].id);
        }

        // Load existing RFQ if id is provided
        if (rfqId) {
          const existingRfq = await rfqService.getRFQById(rfqId);
          if (existingRfq) {
            setRfqData(existingRfq);
            setIsViewMode(viewMode);
            
            // Load shipping data
            if (existingRfq.include_shipping) {
              setIncludeShipping(true);
              if (existingRfq.default_warehouse_id) {
                setSelectedWarehouseId(existingRfq.default_warehouse_id);
              }
              if (existingRfq.shipping_quotes && existingRfq.shipping_quotes.length > 0) {
                const selected = existingRfq.shipping_quotes.find(q => q.is_selected);
                setSelectedShippingQuote(selected || existingRfq.shipping_quotes[0]);
              }
            }
            
            if (tabParam) {
              setActiveTab(tabParam);
            }
            toast({
              title: '加载成功',
              description: `已加载询价单 ${rfqId}`,
            });
          } else {
            toast({
              title: '加载失败',
              description: '未找到该询价单',
              variant: 'destructive',
            });
            navigate('/rfq-list');
          }
        }
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
  }, [rfqId]);

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

  const addCustomerLink = () => {
    if (customerLink.trim()) {
      updateRfqData({ customer_links: [...rfqData.customer_links, customerLink.trim()] });
      setCustomerLink('');
    }
  };

  const removeLink = (type: 'customer', index: number) => {
    updateRfqData({ customer_links: rfqData.customer_links.filter((_, i) => i !== index) });
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

  const handleViewQuotes = (supplierId: number) => {
    const supplier = rfqData.suppliers.find(s => s.supplier_id === supplierId);
    if (supplier) {
      setSelectedSupplier(supplier);
      setQuotesViewOpen(true);
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
      const pendingCustomer = customerLink.trim() ? [customerLink.trim()] : [];
      const payload = {
        ...rfqData,
        customer_links: [...rfqData.customer_links, ...pendingCustomer],
        status: 'draft' as const,
        default_warehouse_id: includeShipping ? selectedWarehouseId : undefined,
        include_shipping: includeShipping,
      };
      const result = await rfqService.saveRFQ(payload);
      // Sync local state so UI reflects saved links
      if (pendingCustomer.length) {
        updateRfqData({
          customer_links: payload.customer_links,
        });
        setCustomerLink('');
      }
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
      const pendingCustomer = customerLink.trim() ? [customerLink.trim()] : [];
      const payload = {
        ...rfqData,
        customer_links: [...rfqData.customer_links, ...pendingCustomer],
        status: 'submitted' as const,
        default_warehouse_id: includeShipping ? selectedWarehouseId : undefined,
        include_shipping: includeShipping,
      };
      const result = await rfqService.saveRFQ(payload);
      if (pendingCustomer.length) {
        updateRfqData({
          customer_links: payload.customer_links,
        });
        setCustomerLink('');
      }
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
            <Button variant="ghost" size="icon" onClick={() => navigate('/rfq-list')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isViewMode ? `查看询价单 View RFQ` : '新建询价单 New RFQ'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {rfqData.inquiry_id && `${rfqData.inquiry_id} · `}
                {rfqData.title || '未命名RFQ'} · <Badge variant="outline">{rfqData.status}</Badge>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isViewMode && (
              <>
                <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  保存草稿
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  <Send className="h-4 w-4 mr-2" />
                  提交
                </Button>
              </>
            )}
            {isViewMode && (
              <Button onClick={() => setIsViewMode(false)}>
                编辑
              </Button>
            )}
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
            <TabsTrigger value="basic">1. 基本信息</TabsTrigger>
            <TabsTrigger value="category">2. 类目属性</TabsTrigger>
            <TabsTrigger value="features">3. 功能模块</TabsTrigger>
            <TabsTrigger value="suppliers">4. 供应商&运费</TabsTrigger>
            <TabsTrigger value="review">5. 预览提交</TabsTrigger>
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
                    <Label>产品链接 Product Links</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="粘贴产品链接..."
                        value={customerLink}
                        onChange={(e) => setCustomerLink(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCustomerLink()}
                        disabled={isViewMode}
                      />
                      <Button onClick={addCustomerLink} disabled={isViewMode}>添加</Button>
                    </div>
                    {rfqData.customer_links.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {rfqData.customer_links.map((link, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="flex-1 justify-start truncate">{link}</Badge>
                            {!isViewMode && (
                              <Button variant="ghost" size="sm" onClick={() => removeLink('customer', i)}>删除</Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Name */}
                <div>
                  <Label htmlFor="product_name">产品名称 Product Name</Label>
                  <Input
                    id="product_name"
                    value={rfqData.product_name || ''}
                    onChange={(e) => updateRfqData({ product_name: e.target.value })}
                    placeholder="输入产品名称..."
                  />
                </div>

                {/* Reference Number */}
                <div>
                  <Label htmlFor="reference_number">参考号 Reference Number</Label>
                  <Input
                    id="reference_number"
                    value={rfqData.reference_number || ''}
                    onChange={(e) => updateRfqData({ reference_number: e.target.value })}
                    placeholder="输入参考号..."
                  />
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title">客户需求（备注）</Label>
                  <Textarea
                    id="title"
                    value={rfqData.title}
                    onChange={(e) => updateRfqData({ title: e.target.value })}
                    placeholder="描述客户需求..."
                    rows={3}
                  />
                </div>

                {/* Target Market */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="countries">目的国</Label>
                    <CountryMultiSelect
                      value={rfqData.target_countries || []}
                      onChange={(countries) => updateRfqData({ target_countries: countries })}
                      disabled={isViewMode}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">货币</Label>
                    <Select value={rfqData.currency} onValueChange={(val) => updateRfqData({ currency: val })} disabled={isViewMode}>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target_weight">重量 (g)</Label>
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

          {/* Tab 5: Suppliers & Shipping */}
          <TabsContent value="suppliers" className="space-y-6">
            {/* Suppliers Section */}
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
                {/* Target Countries Display */}
                {rfqData.target_countries && rfqData.target_countries.length > 0 && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <Label className="text-sm font-medium">目的国 Destination Countries:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {rfqData.target_countries.map((country) => {
                        const allCountries = [
                          { value: 'US', label: '美国 US' },
                          { value: 'GB', label: '英国 GB' },
                          { value: 'AU', label: '澳大利亚 AU' },
                          { value: 'CA', label: '加拿大 CA' },
                          { value: 'DE', label: '德国 DE' },
                          { value: 'BE', label: '比利时 BE' },
                          { value: 'FR', label: '法国 FR' },
                          { value: 'IT', label: '意大利 IT' },
                          { value: 'CH', label: '瑞士 CH' },
                          { value: 'SE', label: '瑞典 SE' },
                          { value: 'AE', label: '阿联酋 AE' },
                          { value: 'AR', label: '阿根廷 AR' },
                          { value: 'AT', label: '奥地利 AT' },
                          { value: 'BR', label: '巴西 BR' },
                          { value: 'CL', label: '智利 CL' },
                          { value: 'CN', label: '中国 CN' },
                          { value: 'CO', label: '哥伦比亚 CO' },
                          { value: 'CZ', label: '捷克 CZ' },
                          { value: 'DK', label: '丹麦 DK' },
                          { value: 'EG', label: '埃及 EG' },
                          { value: 'ES', label: '西班牙 ES' },
                          { value: 'FI', label: '芬兰 FI' },
                          { value: 'GR', label: '希腊 GR' },
                          { value: 'HK', label: '香港 HK' },
                          { value: 'HU', label: '匈牙利 HU' },
                          { value: 'ID', label: '印度尼西亚 ID' },
                          { value: 'IE', label: '爱尔兰 IE' },
                          { value: 'IL', label: '以色列 IL' },
                          { value: 'IN', label: '印度 IN' },
                          { value: 'JP', label: '日本 JP' },
                          { value: 'KR', label: '韩国 KR' },
                          { value: 'MX', label: '墨西哥 MX' },
                          { value: 'MY', label: '马来西亚 MY' },
                          { value: 'NL', label: '荷兰 NL' },
                          { value: 'NO', label: '挪威 NO' },
                          { value: 'NZ', label: '新西兰 NZ' },
                          { value: 'PH', label: '菲律宾 PH' },
                          { value: 'PL', label: '波兰 PL' },
                          { value: 'PT', label: '葡萄牙 PT' },
                          { value: 'RO', label: '罗马尼亚 RO' },
                          { value: 'RU', label: '俄罗斯 RU' },
                          { value: 'SA', label: '沙特阿拉伯 SA' },
                          { value: 'SG', label: '新加坡 SG' },
                          { value: 'TH', label: '泰国 TH' },
                          { value: 'TR', label: '土耳其 TR' },
                          { value: 'TW', label: '台湾 TW' },
                          { value: 'UA', label: '乌克兰 UA' },
                          { value: 'VN', label: '越南 VN' },
                          { value: 'ZA', label: '南非 ZA' },
                        ];
                        const countryInfo = allCountries.find(c => c.value === country);
                        return (
                          <Badge key={country} variant="secondary">
                            {countryInfo?.label || country}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                  onViewQuotes={handleViewQuotes}
                  shippingQuote={selectedShippingQuote}
                  includeShipping={includeShipping}
                />
              </CardContent>
            </Card>

            {/* Shipping Section */}
            <Card>
              <CardHeader>
                <CardTitle>运费选择 Shipping Options</CardTitle>
                <CardDescription>
                  Select shipping method and view estimated costs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Include shipping toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={includeShipping}
                    onCheckedChange={setIncludeShipping}
                    disabled={isViewMode}
                  />
                  <Label>Include shipping cost in quotation</Label>
                </div>

                {includeShipping && (
                  <>
                    {/* Warehouse selector */}
                    <div>
                      <Label>Origin Warehouse *</Label>
                      <Select
                        value={selectedWarehouseId || undefined}
                        onValueChange={setSelectedWarehouseId}
                        disabled={isViewMode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map(w => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name_cn} ({w.city}, {w.country})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Display current weight and destination */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Product Weight</Label>
                        <p className="text-sm text-muted-foreground">
                          {rfqData.target_weight_kg} g (from Basic Info)
                        </p>
                      </div>
                      <div>
                        <Label>Destination Countries</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rfqData.target_countries && rfqData.target_countries.length > 0 ? (
                            rfqData.target_countries.map((country) => {
                              const allCountries = [
                                { value: 'US', label: '美国 US' },
                                { value: 'GB', label: '英国 GB' },
                                { value: 'AU', label: '澳大利亚 AU' },
                                { value: 'CA', label: '加拿大 CA' },
                                { value: 'DE', label: '德国 DE' },
                                { value: 'BE', label: '比利时 BE' },
                                { value: 'FR', label: '法国 FR' },
                                { value: 'IT', label: '意大利 IT' },
                                { value: 'CH', label: '瑞士 CH' },
                                { value: 'SE', label: '瑞典 SE' },
                                { value: 'AE', label: '阿联酋 AE' },
                                { value: 'AR', label: '阿根廷 AR' },
                                { value: 'AT', label: '奥地利 AT' },
                                { value: 'BR', label: '巴西 BR' },
                                { value: 'CL', label: '智利 CL' },
                                { value: 'CN', label: '中国 CN' },
                                { value: 'CO', label: '哥伦比亚 CO' },
                                { value: 'CZ', label: '捷克 CZ' },
                                { value: 'DK', label: '丹麦 DK' },
                                { value: 'EG', label: '埃及 EG' },
                                { value: 'ES', label: '西班牙 ES' },
                                { value: 'FI', label: '芬兰 FI' },
                                { value: 'GR', label: '希腊 GR' },
                                { value: 'HK', label: '香港 HK' },
                                { value: 'HU', label: '匈牙利 HU' },
                                { value: 'ID', label: '印度尼西亚 ID' },
                                { value: 'IE', label: '爱尔兰 IE' },
                                { value: 'IL', label: '以色列 IL' },
                                { value: 'IN', label: '印度 IN' },
                                { value: 'JP', label: '日本 JP' },
                                { value: 'KR', label: '韩国 KR' },
                                { value: 'MX', label: '墨西哥 MX' },
                                { value: 'MY', label: '马来西亚 MY' },
                                { value: 'NL', label: '荷兰 NL' },
                                { value: 'NO', label: '挪威 NO' },
                                { value: 'NZ', label: '新西兰 NZ' },
                                { value: 'PH', label: '菲律宾 PH' },
                                { value: 'PL', label: '波兰 PL' },
                                { value: 'PT', label: '葡萄牙 PT' },
                                { value: 'RO', label: '罗马尼亚 RO' },
                                { value: 'RU', label: '俄罗斯 RU' },
                                { value: 'SA', label: '沙特阿拉伯 SA' },
                                { value: 'SG', label: '新加坡 SG' },
                                { value: 'TH', label: '泰国 TH' },
                                { value: 'TR', label: '土耳其 TR' },
                                { value: 'TW', label: '台湾 TW' },
                                { value: 'UA', label: '乌克兰 UA' },
                                { value: 'VN', label: '越南 VN' },
                                { value: 'ZA', label: '南非 ZA' },
                              ];
                              const countryInfo = allCountries.find(c => c.value === country);
                              return (
                                <Badge key={country} variant="outline" className="text-xs">
                                  {countryInfo?.label || country}
                                </Badge>
                              );
                            })
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {rfqData.target_country || 'Not specified'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Preview Button */}
                    {rfqData.target_weight_kg && rfqData.target_countries && rfqData.target_countries.length > 0 && selectedWarehouseId && !showShippingPreview && (
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          onClick={() => setShowShippingPreview(true)}
                          disabled={isViewMode}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          预览运费方案 Preview Shipping Options
                        </Button>
                      </div>
                    )}

                    {/* Shipping selector component */}
                    {showShippingPreview && rfqData.target_weight_kg && rfqData.target_countries && rfqData.target_countries.length > 0 && selectedWarehouseId && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">运费方案预览 Shipping Preview</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowShippingPreview(false)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            关闭预览 Close
                          </Button>
                        </div>
                        <ShippingSelector
                          weight={rfqData.target_weight_kg / 1000}
                          destinationCountries={rfqData.target_countries}
                          warehouseId={selectedWarehouseId}
                          selectedQuoteId={selectedShippingQuote?.id}
                          onSelectQuote={setSelectedShippingQuote}
                          readOnly={isViewMode}
                        />
                      </div>
                    )}

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {showShippingPreview 
                          ? '请从上方选择合适的运费方案。Shipping cost will be saved when you submit the RFQ.'
                          : '点击"预览运费方案"按钮查看可用的运费选项。Click "Preview Shipping Options" to view available shipping methods.'}
                      </AlertDescription>
                    </Alert>
                  </>
                )}
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
        <>
          <QuoteDrawer
            open={quoteDrawerOpen}
            onOpenChange={setQuoteDrawerOpen}
            supplierName={selectedSupplier.name}
            onSave={handleSaveQuote}
            commercialTerms={commercialTerms}
          />
          <QuotesViewDialog
            open={quotesViewOpen}
            onOpenChange={setQuotesViewOpen}
            supplierName={selectedSupplier.name}
            quotes={selectedSupplier.quotes}
            commercialTerms={commercialTerms}
          />
        </>
      )}
    </div>
  );
}
