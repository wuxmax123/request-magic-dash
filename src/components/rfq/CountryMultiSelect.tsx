import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

const topCountries = [
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
];

const otherCountries = [
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
].sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));

const allCountries = [...topCountries, ...otherCountries];

interface CountryMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function CountryMultiSelect({ value = [], onChange, disabled }: CountryMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (countryValue: string) => {
    const newValue = value.includes(countryValue)
      ? value.filter((v) => v !== countryValue)
      : [...value, countryValue];
    onChange(newValue);
  };

  const handleRemove = (countryValue: string) => {
    onChange(value.filter((v) => v !== countryValue));
  };

  const getCountryLabel = (countryValue: string) => {
    const country = allCountries.find((c) => c.value === countryValue);
    return country?.label || countryValue;
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">
              {value.length > 0 ? `已选择 ${value.length} 个国家` : '选择目的国...'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-popover z-50" align="start">
          <Command>
            <CommandInput placeholder="搜索国家..." />
            <CommandList>
              <CommandEmpty>未找到国家</CommandEmpty>
              <CommandGroup heading="热门国家">
                {topCountries.map((country) => (
                  <CommandItem
                    key={country.value}
                    value={country.label}
                    onSelect={() => handleSelect(country.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value.includes(country.value) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {country.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="其他国家">
                {otherCountries.map((country) => (
                  <CommandItem
                    key={country.value}
                    value={country.label}
                    onSelect={() => handleSelect(country.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value.includes(country.value) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {country.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((countryValue) => (
            <Badge key={countryValue} variant="secondary" className="pl-2 pr-1">
              {getCountryLabel(countryValue)}
              <button
                type="button"
                className="ml-1 rounded-full hover:bg-muted"
                onClick={() => handleRemove(countryValue)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
