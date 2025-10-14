import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryService } from "@/services/categoryService";
import { useToast } from "@/hooks/use-toast";
import { Upload, Database, CheckCircle2 } from "lucide-react";

// Mock data from the Excel file structure
const sampleData = {
  categories: [
    { id: 100, name_cn: "服装", name_en: "Apparel", level: 1, parent_id: null, sort: 1 },
    { id: 101, name_cn: "上衣", name_en: "Tops", level: 2, parent_id: 100, sort: 1 },
    { id: 10101, name_cn: "T恤", name_en: "T-Shirt", level: 3, parent_id: 101, sort: 1 },
  ],
  featureModules: [
    { feature_code: "heating", feature_name: "加热 Heating", feature_name_en: "Heating", description: "带发热/温控功能" },
    { feature_code: "bluetooth", feature_name: "蓝牙 Bluetooth", feature_name_en: "Bluetooth", description: "音频/数据/控制连接" },
  ],
};

export const DataImporter = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);

  const handleImportSampleData = async () => {
    setLoading(true);
    try {
      // Import categories
      await categoryService.bulkInsertCategories(sampleData.categories);
      
      // Import feature modules
      await categoryService.bulkInsertFeatureModules(sampleData.featureModules);

      setImported(true);
      toast({
        title: "数据导入成功",
        description: "示例数据已导入到数据库",
      });
    } catch (error: any) {
      toast({
        title: "导入失败",
        description: error.message,
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
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Excel 数据导入</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            完整的Excel数据导入功能需要后端处理。<br />
            当前版本提供示例数据导入以测试系统功能。
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleImportSampleData}
            disabled={loading || imported}
            className="flex-1"
          >
            {imported ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                已导入示例数据
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {loading ? "导入中..." : "导入示例数据"}
              </>
            )}
          </Button>
        </div>

        <div className="rounded-lg bg-muted p-4 text-sm">
          <p className="font-medium mb-2">📋 导入说明：</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• 完整Excel数据包含4个工作表：Category+Attributes、FeatureModules、FeatureAttributes、CategoryFeatureBinding</li>
            <li>• 当前提供的示例数据用于测试系统功能</li>
            <li>• 完整数据导入需要开发Excel解析功能或手动录入</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
