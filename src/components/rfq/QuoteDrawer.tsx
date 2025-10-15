import { useState } from 'react';
import { SupplierQuote, CommercialTerm } from '@/types/rfq';
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
}

export function QuoteDrawer({ open, onOpenChange, supplierName, onSave, initialData, commercialTerms }: QuoteDrawerProps) {
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
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

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
      onSave(formData);
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>添加报价 - {supplierName}</SheetTitle>
          <SheetDescription>填写供应商报价信息</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
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
