import { FeatureModule } from '@/types/rfq';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface FeatureSelectorProps {
  modules: FeatureModule[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function FeatureSelector({ modules, selected, onChange }: FeatureSelectorProps) {
  const toggleModule = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter(m => m !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  const removeModule = (code: string) => {
    onChange(selected.filter(m => m !== code));
  };

  const selectedModules = modules.filter(m => selected.includes(m.feature_code));
  const availableModules = modules.filter(m => !selected.includes(m.feature_code));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedModules.map((module) => (
          <Badge key={module.feature_code} variant="secondary" className="text-sm pl-3 pr-1 py-1">
            {module.feature_name}
            <button
              onClick={() => removeModule(module.feature_code)}
              className="ml-2 hover:bg-muted-foreground/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7">
              + 添加功能模块
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2" align="start">
            <div className="grid grid-cols-2 gap-2">
              {availableModules.map((module) => (
                <button
                  key={module.feature_code}
                  onClick={() => toggleModule(module.feature_code)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-md border hover:bg-muted text-left transition-colors",
                    selected.includes(module.feature_code) && "bg-primary text-primary-foreground"
                  )}
                >
                  {module.feature_name}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {selected.length === 0 && (
        <p className="text-sm text-muted-foreground">
          点击"添加功能模块"选择产品功能
        </p>
      )}
    </div>
  );
}
