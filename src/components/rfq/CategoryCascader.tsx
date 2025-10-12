import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { Category } from '@/types/rfq';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface CategoryCascaderProps {
  categories: Category[];
  value: [number | null, number | null, number | null];
  onChange: (value: [number | null, number | null, number | null]) => void;
  required?: boolean;
}

export function CategoryCascader({ categories, value, onChange, required }: CategoryCascaderProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPath, setSelectedPath] = useState<string>('');

  useEffect(() => {
    if (value[2]) {
      const path = getCategoryPath(value[2]);
      setSelectedPath(path);
    } else {
      setSelectedPath('');
    }
  }, [value]);

  const getCategoryPath = (l3Id: number): string => {
    const findPath = (cats: Category[], path: string[] = []): string[] | null => {
      for (const cat of cats) {
        const currentPath = [...path, cat.name_cn];
        if (cat.id === l3Id && cat.level === 3) {
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

  const handleL1Select = (cat: Category) => {
    onChange([cat.id, null, null]);
  };

  const handleL2Select = (cat: Category) => {
    onChange([value[0], cat.id, null]);
  };

  const handleL3Select = (cat: Category) => {
    onChange([value[0], value[1], cat.id]);
    setOpen(false);
  };

  const l1Selected = categories.find(c => c.id === value[0]);
  const l2Selected = l1Selected?.children?.find(c => c.id === value[1]);
  const l3Options = l2Selected?.children || [];

  const filterCategories = (cats: Category[], query: string): Category[] => {
    if (!query) return cats;
    return cats.filter(c => 
      c.name_cn.includes(query) || 
      c.name_en.toLowerCase().includes(query.toLowerCase()) ||
      c.code.toLowerCase().includes(query.toLowerCase())
    );
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between",
              !selectedPath && "text-muted-foreground"
            )}
          >
            {selectedPath || "选择三级类目 Select Category"}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索类目 Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x max-h-[400px]">
            {/* L1 Categories */}
            <div className="overflow-y-auto">
              {filterCategories(categories, search).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleL1Select(cat)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between",
                    value[0] === cat.id && "bg-muted font-medium"
                  )}
                >
                  <span>{cat.name_cn}</span>
                  {cat.children && cat.children.length > 0 && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>

            {/* L2 Categories */}
            <div className="overflow-y-auto">
              {l1Selected?.children?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleL2Select(cat)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between",
                    value[1] === cat.id && "bg-muted font-medium"
                  )}
                >
                  <span>{cat.name_cn}</span>
                  {cat.children && cat.children.length > 0 && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>

            {/* L3 Categories */}
            <div className="overflow-y-auto">
              {l3Options.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleL3Select(cat)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                    value[2] === cat.id && "bg-muted font-medium"
                  )}
                >
                  {cat.name_cn}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {required && !value[2] && (
        <p className="text-sm text-destructive">请选择三级类目</p>
      )}
    </div>
  );
}
