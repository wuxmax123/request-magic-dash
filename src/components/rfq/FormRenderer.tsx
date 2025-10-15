import { AttributeDefinition } from '@/types/rfq';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FormRendererProps {
  attributes: AttributeDefinition[];
  values: Record<string, any>;
  onChange: (code: string, value: any) => void;
  errors?: Record<string, string>;
}

export function FormRenderer({ attributes, values, onChange, errors }: FormRendererProps) {
  const sortedAttributes = [...attributes].sort((a, b) => a.attr_sort - b.attr_sort);

  const renderField = (attr: AttributeDefinition) => {
    const value = values[attr.attr_code];
    const error = errors?.[attr.attr_code];
    const hasError = !!error;

    const fieldId = `field-${attr.attr_code}`;

    switch (attr.input_type) {
      case 'text':
        return (
          <Input
            id={fieldId}
            value={value || ''}
            onChange={(e) => onChange(attr.attr_code, e.target.value)}
            placeholder={attr.help_text || ''}
            className={cn(hasError && "border-destructive")}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={fieldId}
            value={value || ''}
            onChange={(e) => onChange(attr.attr_code, e.target.value)}
            placeholder={attr.help_text || ''}
            rows={3}
            className={cn(hasError && "border-destructive")}
          />
        );

      case 'number':
        return (
          <div className="flex gap-2">
            <Input
              id={fieldId}
              type="number"
              value={value || ''}
              onChange={(e) => onChange(attr.attr_code, parseFloat(e.target.value) || '')}
              placeholder={attr.help_text || ''}
              className={cn(hasError && "border-destructive")}
            />
            {attr.unit && (
              <span className="flex items-center px-3 border rounded-md bg-muted text-sm">
                {attr.unit}
              </span>
            )}
          </div>
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={(val) => onChange(attr.attr_code, val)}>
            <SelectTrigger id={fieldId} className={cn(hasError && "border-destructive")}>
              <SelectValue placeholder={attr.help_text || '请选择'} />
            </SelectTrigger>
            <SelectContent>
              {attr.options_json.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="flex flex-wrap gap-3">
            {attr.options_json.map((opt) => {
              const selected = Array.isArray(value) ? value.includes(opt) : false;
              return (
                <div key={opt} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${fieldId}-${opt}`}
                    checked={selected}
                    onCheckedChange={(checked) => {
                      const current = Array.isArray(value) ? value : [];
                      if (checked) {
                        onChange(attr.attr_code, [...current, opt]);
                      } else {
                        onChange(attr.attr_code, current.filter((v: string) => v !== opt));
                      }
                    }}
                  />
                  <label htmlFor={`${fieldId}-${opt}`} className="text-sm cursor-pointer">
                    {opt}
                  </label>
                </div>
              );
            })}
          </div>
        );

      case 'bool':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={!!value}
              onCheckedChange={(checked) => onChange(attr.attr_code, checked)}
            />
            <label htmlFor={fieldId} className="text-sm cursor-pointer">
              {attr.help_text || '是/否'}
            </label>
          </div>
        );

      case 'file':
        return (
          <Input
            id={fieldId}
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onChange(attr.attr_code, file.name);
              }
            }}
            className={cn(hasError && "border-destructive")}
          />
        );

      default:
        return <Input id={fieldId} value={value || ''} onChange={(e) => onChange(attr.attr_code, e.target.value)} />;
    }
  };

  if (sortedAttributes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>暂无属性 No attributes defined</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedAttributes.map((attr) => {
        const error = errors?.[attr.attr_code];
        return (
          <div key={attr.attr_code} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={`field-${attr.attr_code}`}>
                {attr.attr_name}
                {attr.required === 1 && <span className="text-destructive ml-1">*</span>}
              </Label>
              {attr.help_text && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">{attr.help_text}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {renderField(attr)}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );
      })}
    </div>
  );
}
