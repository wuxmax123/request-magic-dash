import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { categoryService } from "@/services/categoryService";
import { useToast } from "@/hooks/use-toast";
import { Upload, Database, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from 'xlsx';

export const DataImporter = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  const parseExcelFile = async (file: File) => {
    return new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          const result = {
            categories: [] as any[],
            categoryAttributes: [] as any[],
            featureModules: [] as any[],
            featureAttributes: [] as any[],
            bindings: [] as any[],
          };
          
          // Parse Sheet 1: Categories and Category Attributes
          const sheet1 = workbook.Sheets[workbook.SheetNames[0]];
          const sheet1Data: any[] = XLSX.utils.sheet_to_json(sheet1);
          
          // Extract unique categories at each level
          const categoriesMap = new Map<number, any>();
          const categoryAttributesMap = new Map<string, any>();
          
          sheet1Data.forEach((row: any) => {
            // L1 category
            if (row.L1_ID && !categoriesMap.has(row.L1_ID)) {
              categoriesMap.set(row.L1_ID, {
                id: row.L1_ID,
                name_cn: row.L1_Name_CN,
                name_en: row.L1_Name_EN,
                code: `L1_${row.L1_ID}`,
                parent_id: null,
                level: 1,
                path: `/${row.L1_ID}`,
                sort: row.L1_ID
              });
            }
            
            // L2 category
            if (row.L2_ID && !categoriesMap.has(row.L2_ID)) {
              categoriesMap.set(row.L2_ID, {
                id: row.L2_ID,
                name_cn: row.L2_Name_CN,
                name_en: row.L2_Name_EN,
                code: `L2_${row.L2_ID}`,
                parent_id: row.L1_ID,
                level: 2,
                path: `/${row.L1_ID}/${row.L2_ID}`,
                sort: row.L2_ID
              });
            }
            
            // L3 category
            if (row.L3_ID && !categoriesMap.has(row.L3_ID)) {
              categoriesMap.set(row.L3_ID, {
                id: row.L3_ID,
                name_cn: row.L3_Name_CN,
                name_en: row.L3_Name_EN,
                code: `L3_${row.L3_ID}`,
                parent_id: row.L2_ID,
                level: 3,
                path: `/${row.L1_ID}/${row.L2_ID}/${row.L3_ID}`,
                sort: row.L3_ID
              });
            }
            
            // Category attributes
            if (row.L3_ID && row.attr_code) {
              const key = `${row.L3_ID}_${row.attr_code}`;
              if (!categoryAttributesMap.has(key)) {
                let optionsJson = [];
                try {
                  if (row.options_json && typeof row.options_json === 'string') {
                    // Remove brackets and split by comma
                    const cleaned = row.options_json.replace(/[\[\]"']/g, '');
                    optionsJson = cleaned ? cleaned.split(',').map((s: string) => s.trim()) : [];
                  } else if (Array.isArray(row.options_json)) {
                    optionsJson = row.options_json;
                  }
                } catch (e) {
                  console.error('Failed to parse options_json:', row.options_json);
                }
                
                categoryAttributesMap.set(key, {
                  category_id: row.L3_ID,
                  attr_code: row.attr_code,
                  attr_name: row.attr_name,
                  input_type: row.input_type || 'text',
                  required: row.required || 0,
                  unit: row.unit || null,
                  options_json: optionsJson,
                  help_text: row.help_text || null,
                  visible_on_quote: row.visible_on_quote !== undefined ? row.visible_on_quote : 1,
                  attr_sort: row.attr_sort || 0
                });
              }
            }
          });
          
          result.categories = Array.from(categoriesMap.values());
          result.categoryAttributes = Array.from(categoryAttributesMap.values());
          
          // Parse Sheet 2: Feature Modules
          if (workbook.SheetNames[1]) {
            const sheet2 = workbook.Sheets[workbook.SheetNames[1]];
            const sheet2Data: any[] = XLSX.utils.sheet_to_json(sheet2);
            
            result.featureModules = sheet2Data.map((row: any) => ({
              feature_code: row.feature_code,
              feature_name: row.feature_name,
              feature_name_en: row.feature_name.split(' ')[1] || null,
              description: row.description || null
            }));
          }
          
          // Parse Sheet 3: Feature Attributes
          if (workbook.SheetNames[2]) {
            const sheet3 = workbook.Sheets[workbook.SheetNames[2]];
            const sheet3Data: any[] = XLSX.utils.sheet_to_json(sheet3);
            
            result.featureAttributes = sheet3Data.map((row: any) => {
              let optionsJson = [];
              try {
                if (row.options_json && typeof row.options_json === 'string') {
                  const cleaned = row.options_json.replace(/[\[\]"']/g, '');
                  optionsJson = cleaned ? cleaned.split(',').map((s: string) => s.trim()) : [];
                } else if (Array.isArray(row.options_json)) {
                  optionsJson = row.options_json;
                }
              } catch (e) {
                console.error('Failed to parse options_json:', row.options_json);
              }
              
              return {
                feature_code: row.feature_code,
                attr_code: row.attr_code,
                attr_name: row.attr_name,
                input_type: row.input_type || 'text',
                required: row.required || 0,
                unit: row.unit || null,
                options_json: optionsJson,
                help_text: row.help_text || null,
                visible_on_quote: row.visible_on_quote !== undefined ? row.visible_on_quote : 1,
                attr_sort: row.attr_sort || 0
              };
            });
          }
          
          // Parse Sheet 4: Category-Feature Bindings
          if (workbook.SheetNames[3]) {
            const sheet4 = workbook.Sheets[workbook.SheetNames[3]];
            const sheet4Data: any[] = XLSX.utils.sheet_to_json(sheet4);
            
            result.bindings = sheet4Data.map((row: any) => ({
              category_id: row.L3_ID,
              feature_code: row.feature_code
            }));
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  };

  const handleImportFromUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setProgress(0);
    setCurrentStep('读取文件...');
    
    try {
      // Parse Excel file
      setCurrentStep('解析Excel数据...');
      setProgress(5);
      const data = await parseExcelFile(file);
      
      // 1. Import categories
      setCurrentStep('导入类目数据...');
      setProgress(20);
      await categoryService.bulkInsertCategories(data.categories);
      
      // 2. Import feature modules
      setCurrentStep('导入功能模块...');
      setProgress(40);
      await categoryService.bulkInsertFeatureModules(data.featureModules);
      
      // 3. Import category attributes
      setCurrentStep('导入类目属性...');
      setProgress(60);
      await categoryService.bulkInsertCategoryAttributes(data.categoryAttributes);
      
      // 4. Import feature attributes
      setCurrentStep('导入功能属性...');
      setProgress(75);
      await categoryService.bulkInsertFeatureAttributes(data.featureAttributes);
      
      // 5. Import category-feature bindings
      setCurrentStep('导入类目-功能绑定关系...');
      setProgress(90);
      await categoryService.bulkInsertCategoryFeatureBindings(data.bindings);
      
      setProgress(100);
      setCurrentStep('导入完成！');
      setImported(true);
      
      toast({
        title: "数据导入成功",
        description: `已成功导入 ${data.categories.length} 个类目、${data.featureModules.length} 个功能模块`,
      });
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || '导入失败，请检查数据格式');
      toast({
        title: "导入失败",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportPreloaded = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setCurrentStep('加载预置数据...');
    
    try {
      // Fetch the preloaded Excel file
      const response = await fetch('/data/category_data.xlsx');
      const blob = await response.blob();
      const file = new File([blob], 'category_data.xlsx');
      
      // Parse Excel file
      setCurrentStep('解析Excel数据...');
      setProgress(5);
      const data = await parseExcelFile(file);
      
      // 1. Import categories
      setCurrentStep('导入类目数据...');
      setProgress(20);
      await categoryService.bulkInsertCategories(data.categories);
      
      // 2. Import feature modules
      setCurrentStep('导入功能模块...');
      setProgress(40);
      await categoryService.bulkInsertFeatureModules(data.featureModules);
      
      // 3. Import category attributes
      setCurrentStep('导入类目属性...');
      setProgress(60);
      await categoryService.bulkInsertCategoryAttributes(data.categoryAttributes);
      
      // 4. Import feature attributes
      setCurrentStep('导入功能属性...');
      setProgress(75);
      await categoryService.bulkInsertFeatureAttributes(data.featureAttributes);
      
      // 5. Import category-feature bindings
      setCurrentStep('导入类目-功能绑定关系...');
      setProgress(90);
      await categoryService.bulkInsertCategoryFeatureBindings(data.bindings);
      
      setProgress(100);
      setCurrentStep('导入完成！');
      setImported(true);
      
      toast({
        title: "数据导入成功",
        description: `已成功导入 ${data.categories.length} 个类目、${data.featureModules.length} 个功能模块`,
      });
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || '导入失败，请检查数据格式');
      toast({
        title: "导入失败",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          数据导入工具 Data Importer
        </CardTitle>
        <CardDescription>
          从Excel文件导入类目、属性和功能模块配置数据
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{currentStep}</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label htmlFor="excel-upload" className="block">
              <Button 
                onClick={() => document.getElementById('excel-upload')?.click()}
                disabled={loading || imported}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Upload className="mr-2 h-4 w-4" />
                上传Excel文件导入
              </Button>
            </label>
            <input
              id="excel-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportFromUpload}
              className="hidden"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">或</span>
            </div>
          </div>
          
          <Button 
            onClick={handleImportPreloaded}
            disabled={loading || imported}
            className="w-full"
            size="lg"
          >
            {imported ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                已导入完整数据
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                {loading ? "导入中..." : "导入预置数据"}
              </>
            )}
          </Button>
        </div>

        <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
          <p className="font-medium">📋 数据说明：</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• <strong>类目数据</strong>：12个L1类目（服装、3C数码、厨房、运动等）</li>
            <li>• <strong>功能模块</strong>：11个模块（heating、bluetooth、wifi、battery等）</li>
            <li>• <strong>属性配置</strong>：每个L3类目的动态属性表单</li>
            <li>• <strong>绑定关系</strong>：类目与功能模块的关联配置</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
