import { useState, useEffect, useMemo } from 'react';
import { SupplierQuote, CommercialTerm, AttributeDefinition, FeatureModuleAttribute } from '@/types/rfq';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface QuoteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierName: string;
  onSave: (quote: SupplierQuote) => void;
  initialData?: SupplierQuote;
  commercialTerms: CommercialTerm[];
  rfqAttributes?: Record<string, any>; // Customer's product spec
  rfqFeatureAttributes?: Record<string, Record<string, any>>; // Customer's feature spec
  categoryAttributes?: AttributeDefinition[];
  featureModules?: string[];
  featureAttrsMap?: Record<string, FeatureModuleAttribute[]>; // Feature attribute definitions
}

export function QuoteDrawer({ 
  open, 
  onOpenChange, 
  supplierName, 
  onSave, 
  initialData, 
  commercialTerms,
  rfqAttributes = {},
  rfqFeatureAttributes = {},
  categoryAttributes = [],
  featureModules = [],
  featureAttrsMap = {}
}: QuoteDrawerProps) {
  const [showDifferenceEditor, setShowDifferenceEditor] = useState(true);
  
  const [formData, setFormData] = useState<SupplierQuote>(
    initialData || {
      currency: 'USD',
      moq: 0,
      unit_price_exw: 0,
      tax_included: 0,
      lead_time_days: 0,
      weight_kg: 0,
      length_cm: 0,
      width_cm: 0,
      height_cm: 0,
      inner_pack: '',
      outer_pack: '',
      carton_qty: 0,
      incoterm_supplier: 'EXW',
      valid_until: '',
      remarks: '',
      attachments: [],
      commercial_terms: {},
      supplier_attributes: {},
      supplier_diff_json: {},
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-inherit RFQ attributes on initial load
  useEffect(() => {
    if (!initialData && Object.keys(rfqAttributes).length > 0) {
      setFormData(prev => ({
        ...prev,
        supplier_attributes: { ...rfqAttributes, ...rfqFeatureAttributes }
      }));
    }
  }, [rfqAttributes, rfqFeatureAttributes, initialData]);

  // Merge all attributes for display
  const allRfqAttributes = useMemo(() => {
    const merged: Record<string, any> = { ...rfqAttributes };
    Object.entries(rfqFeatureAttributes).forEach(([, attrs]) => {
      Object.assign(merged, attrs);
    });
    return merged;
  }, [rfqAttributes, rfqFeatureAttributes]);

  // Get attribute definitions for rendering
  const allAttributeDefinitions = useMemo(() => {
    const defs: Array<AttributeDefinition & { feature_name?: string }> = [...categoryAttributes];
    
    // Add feature attribute definitions
    Object.entries(featureAttrsMap).forEach(([featureCode, attrs]) => {
      attrs.forEach(attr => {
        defs.push({
          ...attr,
          feature_name: attr.feature_name
        });
      });
    });
    
    return defs;
  }, [categoryAttributes, featureAttrsMap]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.moq <= 0) newErrors.moq = 'MOQ必须大于0';
    if (formData.unit_price_exw <= 0) newErrors.unit_price_exw = '单价必须大于0';
    if (formData.lead_time_days < 0) newErrors.lead_time_days = '交货期不能为负数';
    if (formData.weight_kg < 0) newErrors.weight_kg = '重量不能为负数';
    if (formData.length_cm < 0) newErrors.length_cm = '长度不能为负数';
    if (formData.width_cm < 0) newErrors.width_cm = '宽度不能为负数';
    if (formData.height_cm < 0) newErrors.height_cm = '高度不能为负数';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      // Calculate differences only
      const diff: Record<string, any> = {};
      const supplierAttrs = formData.supplier_attributes || {};
      
      Object.keys(supplierAttrs).forEach(key => {
        if (supplierAttrs[key] !== allRfqAttributes[key]) {
          diff[key] = supplierAttrs[key];
        }
      });

      const finalData = {
        ...formData,
        supplier_diff_json: diff
      };

      onSave(finalData);
      toast({
        title: '报价保存成功',
        description: `供应商 ${supplierName} 的报价已保存`,
      });
      onOpenChange(false);
    } else {
      toast({
        title: '验证失败',
        description: '请检查输入的数据',
        variant: 'destructive',
      });
    }
  };

  const updateField = (field: keyof SupplierQuote, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateSupplierAttribute = (attrCode: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      supplier_attributes: {
        ...prev.supplier_attributes,
        [attrCode]: value
      }
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[700px] sm:max-w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>添加报价 - {supplierName}</SheetTitle>
          <SheetDescription>填写供应商报价信息</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Product Attributes Section */}
          {Object.keys(allRfqAttributes).length > 0 && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">产品规格 (自动继承)</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDifferenceEditor(!showDifferenceEditor)}
                >
                  {showDifferenceEditor ? '收起差异编辑' : '🧠 修改差异'}
                </Button>
              </div>

              {!showDifferenceEditor && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>✅ 已自动继承客户要求的产品规格</p>
                  <p className="text-xs">如供应商实际产品与客户要求有差异，请点击"修改差异"按钮</p>
                </div>
              )}

              {showDifferenceEditor && (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    <p>⚠️ 仅修改与客户要求不同的属性，相同的属性无需填写</p>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2 font-medium">属性类型</th>
                          <th className="text-left p-2 font-medium">属性</th>
                          <th className="text-left p-2 font-medium">客户要求</th>
                          <th className="text-left p-2 font-medium">供应商实际</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Basic Attributes */}
                        {categoryAttributes.map((attr) => {
                          const customerValue = allRfqAttributes[attr.attr_code];
                          const supplierValue = formData.supplier_attributes?.[attr.attr_code] ?? customerValue;
                          const isDifferent = supplierValue !== customerValue;
                          const hasOptions = attr.input_type === 'select' && attr.options_json && attr.options_json.length > 0;

                          return (
                            <tr key={attr.attr_code} className={isDifferent ? 'bg-yellow-50' : ''}>
                              <td className="p-2 border-t text-muted-foreground">基本属性</td>
                              <td className="p-2 border-t font-medium">{attr.attr_name}</td>
                              <td className="p-2 border-t text-muted-foreground">
                                {customerValue || '-'}
                              </td>
                              <td className="p-2 border-t">
                                {hasOptions ? (
                                  (() => {
                                    const options = Array.isArray(attr.options_json) ? attr.options_json : [];
                                    const inOptions = options.includes(String(supplierValue ?? ''));
                                    const selectVal = inOptions ? String(supplierValue ?? '') : '__CUSTOM__';
                                    return (
                                      <div className="flex items-center gap-2">
                                        <Select
                                          value={selectVal}
                                          onValueChange={(val) => {
                                            if (val === '__CUSTOM__') {
                                              updateSupplierAttribute(attr.attr_code, String(supplierValue || ''));
                                            } else {
                                              updateSupplierAttribute(attr.attr_code, val);
                                            }
                                          }}
                                        >
                                          <SelectTrigger className="h-8 w-[180px]">
                                            <SelectValue placeholder="选择或输入自定义值" />
                                          </SelectTrigger>
                                          <SelectContent className="z-50">
                                            {options.map((option) => (
                                              <SelectItem key={option} value={String(option)}>
                                                {String(option)}
                                              </SelectItem>
                                            ))}
                                            <SelectItem value="__CUSTOM__">其他...</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        {selectVal === '__CUSTOM__' && (
                                          <Input
                                            value={String(supplierValue || '')}
                                            onChange={(e) => updateSupplierAttribute(attr.attr_code, e.target.value)}
                                            placeholder="输入自定义值"
                                            className="h-8 w-[180px]"
                                          />
                                        )}
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <Input
                                    value={supplierValue || ''}
                                    onChange={(e) => updateSupplierAttribute(attr.attr_code, e.target.value)}
                                    placeholder="如有差异，请填写"
                                    className="h-8"
                                  />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        
                        {/* Feature Attributes */}
                        {Object.entries(featureAttrsMap).map(([featureCode, attrs]) => (
                          attrs.map((attr, idx) => {
                            const customerValue = allRfqAttributes[attr.attr_code];
                            const supplierValue = formData.supplier_attributes?.[attr.attr_code] ?? customerValue;
                            const isDifferent = supplierValue !== customerValue;
                            const hasOptions = attr.input_type === 'select' && attr.options_json && attr.options_json.length > 0;

                            return (
                              <tr key={`${featureCode}-${attr.attr_code}`} className={isDifferent ? 'bg-yellow-50' : ''}>
                                <td className="p-2 border-t text-muted-foreground">
                                  {idx === 0 ? attr.feature_name : ''}
                                </td>
                                <td className="p-2 border-t font-medium">{attr.attr_name}</td>
                                <td className="p-2 border-t text-muted-foreground">
                                  {customerValue || '-'}
                                </td>
                                <td className="p-2 border-t">
                                  {hasOptions ? (
                                    (() => {
                                      const options = Array.isArray(attr.options_json) ? attr.options_json : [];
                                      const inOptions = options.includes(String(supplierValue ?? ''));
                                      const selectVal = inOptions ? String(supplierValue ?? '') : '__CUSTOM__';
                                      return (
                                        <div className="flex items-center gap-2">
                                          <Select
                                            value={selectVal}
                                            onValueChange={(val) => {
                                              if (val === '__CUSTOM__') {
                                                updateSupplierAttribute(attr.attr_code, String(supplierValue || ''));
                                              } else {
                                                updateSupplierAttribute(attr.attr_code, val);
                                              }
                                            }}
                                          >
                                            <SelectTrigger className="h-8 w-[180px]">
                                              <SelectValue placeholder="选择或输入自定义值" />
                                            </SelectTrigger>
                                            <SelectContent className="z-50">
                                              {options.map((option) => (
                                                <SelectItem key={option} value={String(option)}>
                                                  {String(option)}
                                                </SelectItem>
                                              ))}
                                              <SelectItem value="__CUSTOM__">其他...</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          {selectVal === '__CUSTOM__' && (
                                            <Input
                                              value={String(supplierValue || '')}
                                              onChange={(e) => updateSupplierAttribute(attr.attr_code, e.target.value)}
                                              placeholder="输入自定义值"
                                              className="h-8 w-[180px]"
                                            />
                                          )}
                                        </div>
                                      );
                                    })()
                                  ) : (
                                    <Input
                                      value={supplierValue || ''}
                                      onChange={(e) => updateSupplierAttribute(attr.attr_code, e.target.value)}
                                      placeholder="如有差异，请填写"
                                      className="h-8"
                                    />
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    💡 黄色高亮表示该属性与客户要求不同
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pricing Section */}
          <div className="space-y-4">
            <h3 className="font-medium">价格信息</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">货币 *</Label>
                <Select value={formData.currency} onValueChange={(val) => updateField('currency', val)}>
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

              <div className="space-y-2">
                <Label htmlFor="moq">MOQ *</Label>
                <Input
                  id="moq"
                  type="number"
                  value={formData.moq}
                  onChange={(e) => updateField('moq', parseInt(e.target.value) || 0)}
                />
                {errors.moq && <p className="text-sm text-destructive">{errors.moq}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_price">单价 EXW *</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  value={formData.unit_price_exw}
                  onChange={(e) => updateField('unit_price_exw', parseFloat(e.target.value) || 0)}
                />
                {errors.unit_price_exw && <p className="text-sm text-destructive">{errors.unit_price_exw}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax">是否含税</Label>
                <Select value={String(formData.tax_included)} onValueChange={(val) => updateField('tax_included', parseInt(val))}>
                  <SelectTrigger id="tax">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">不含税</SelectItem>
                    <SelectItem value="1">含税</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Logistics Section */}
          <div className="space-y-4">
            <h3 className="font-medium">物流信息</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">重量 (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight_kg}
                  onChange={(e) => updateField('weight_kg', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carton_qty">装箱数</Label>
                <Input
                  id="carton_qty"
                  type="number"
                  value={formData.carton_qty}
                  onChange={(e) => updateField('carton_qty', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">长 (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  value={formData.length_cm}
                  onChange={(e) => updateField('length_cm', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="width">宽 (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  value={formData.width_cm}
                  onChange={(e) => updateField('width_cm', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">高 (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height_cm}
                  onChange={(e) => updateField('height_cm', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inner_pack">内包装</Label>
                <Input
                  id="inner_pack"
                  value={formData.inner_pack}
                  onChange={(e) => updateField('inner_pack', e.target.value)}
                  placeholder="e.g., 1 pc/bag"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outer_pack">外包装</Label>
                <Input
                  id="outer_pack"
                  value={formData.outer_pack}
                  onChange={(e) => updateField('outer_pack', e.target.value)}
                  placeholder="e.g., 50 pcs/carton"
                />
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4">
            <h3 className="font-medium">其他信息</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="incoterm">贸易条款</Label>
                <Select value={formData.incoterm_supplier} onValueChange={(val) => updateField('incoterm_supplier', val)}>
                  <SelectTrigger id="incoterm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXW">EXW</SelectItem>
                    <SelectItem value="FOB">FOB</SelectItem>
                    <SelectItem value="CIF">CIF</SelectItem>
                    <SelectItem value="DDP">DDP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_until">有效期至</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => updateField('valid_until', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">备注</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => updateField('remarks', e.target.value)}
                rows={3}
                placeholder="其他说明..."
              />
            </div>
          </div>

          {/* Commercial Terms Section */}
          {commercialTerms && commercialTerms.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">商务条款 Commercial Terms</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {commercialTerms.map((term) => {
                  const value = formData.commercial_terms?.[term.attr_code];
                  const refundableValue = formData.commercial_terms?.[`${term.attr_code}_refundable`];
                  
                  return (
                    <div key={term.attr_code} className="space-y-2">
                      <Label>
                        {term.attr_name}
                        {term.required === 1 && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type={term.input_type === 'number' ? 'number' : 'text'}
                          value={value || ''}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              commercial_terms: {
                                ...prev.commercial_terms,
                                [term.attr_code]: e.target.value
                              }
                            }));
                          }}
                          placeholder={term.help_text}
                          className="flex-1"
                        />
                        {term.unit && (
                          <span className="flex items-center px-3 border rounded-md bg-muted text-sm whitespace-nowrap">
                            {term.unit}
                          </span>
                        )}
                        {term.has_refundable_checkbox && (
                          <label className="flex items-center gap-2 whitespace-nowrap cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!refundableValue}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  commercial_terms: {
                                    ...prev.commercial_terms,
                                    [`${term.attr_code}_refundable`]: e.target.checked
                                  }
                                }));
                              }}
                              className="h-4 w-4 rounded border-input"
                            />
                            <span className="text-sm">可退</span>
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            取消
          </Button>
          <Button onClick={handleSave} className="flex-1">
            保存报价
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
