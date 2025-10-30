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
      <div className="flex flex-wrap gap-2 items-center">
        {selectedModules.map((module) => (
          <Badge key={module.feature_code} variant="secondary" className="text-sm pl-3 pr-1 py-1.5 gap-1">
            <span>{module.feature_name}</span>
            <button
              onClick={() => removeModule(module.feature_code)}
              className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              aria-label={`移除 ${module.feature_name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              + 添加功能模块 Add Feature Module
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[480px] p-0 bg-background border shadow-lg z-50" align="start" sideOffset={5}>
            <div className="p-3 border-b bg-background">
              <h4 className="font-semibold text-sm">选择功能模块 Select Feature Modules</h4>
              <p className="text-xs text-muted-foreground mt-1">
                点击添加，已选择的模块会显示为标签 Click to add, selected modules will be shown as badges
              </p>
            </div>
            <div className="p-3 max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {modules.map((module) => {
                  const isSelected = selected.includes(module.feature_code);
                  return (
                    <button
                      key={module.feature_code}
                      onClick={() => toggleModule(module.feature_code)}
                      className={cn(
                        "px-3 py-2.5 text-sm rounded-lg border-2 text-left transition-all hover:border-primary",
                        isSelected 
                          ? "bg-primary text-primary-foreground border-primary font-medium" 
                          : "bg-background hover:bg-accent border-border"
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{module.feature_name}</span>
                        {module.description && (
                          <span className={cn(
                            "text-xs",
                            isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                          )}>
                            {module.description}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              {modules.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>暂无可用的功能模块 No available modules</p>
                  <p className="text-xs mt-1">请先在管理页面导入数据 Please import data in Admin page first</p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {selected.length === 0 && (
        <p className="text-sm text-muted-foreground">
          点击"添加功能模块"选择产品功能（如：加热、蓝牙、防水等） Click "Add Feature Module" to select product features (e.g. heating, Bluetooth, waterproof)
        </p>
      )}
    </div>
  );
}
