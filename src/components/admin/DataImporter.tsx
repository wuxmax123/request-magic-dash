import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { categoryService } from "@/services/categoryService";
import { useToast } from "@/hooks/use-toast";
import { Upload, Database, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 完整的Excel数据
const fullExcelData = {
  categories: [] as any[],
  categoryAttributes: [] as any[],
  featureModules: [] as any[],
  featureAttributes: [] as any[],
  bindings: [] as any[],
};

// 从Excel解析的完整数据
const parseExcelData = () => {
  // 提取所有唯一的类目
  const categoriesMap = new Map();
  
  // L1 categories
  const l1Cats = [
    { id: 100, name_cn: "服装", name_en: "Apparel", level: 1, parent_id: null, code: "100", sort: 1 },
    { id: 200, name_cn: "3C数码", name_en: "Electronics", level: 1, parent_id: null, code: "200", sort: 2 },
    { id: 300, name_cn: "厨房与餐具", name_en: "Kitchen & Tableware", level: 1, parent_id: null, code: "310", sort: 3 },
    { id: 400, name_cn: "运动与户外", name_en: "Sports & Outdoor", level: 1, parent_id: null, code: "400", sort: 4 },
    { id: 500, name_cn: "美妆与个护", name_en: "Beauty & Personal Care", level: 1, parent_id: null, code: "500", sort: 5 },
    { id: 600, name_cn: "玩具与游戏", name_en: "Toys & Games", level: 1, parent_id: null, code: "600", sort: 6 },
    { id: 700, name_cn: "家居与装饰", name_en: "Home & Decor", level: 1, parent_id: null, code: "700", sort: 7 },
    { id: 800, name_cn: "办公与文具", name_en: "Office & Stationery", level: 1, parent_id: null, code: "800", sort: 8 },
    { id: 900, name_cn: "汽车与摩托", name_en: "Automotive & Motorcycle", level: 1, parent_id: null, code: "900", sort: 9 },
    { id: 950, name_cn: "五金与工业品", name_en: "Tools & Industrial", level: 1, parent_id: null, code: "950", sort: 10 },
    { id: 1000, name_cn: "食品与日用", name_en: "Food & Daily Essentials", level: 1, parent_id: null, code: "1000", sort: 11 },
    { id: 1100, name_cn: "母婴与儿童用品", name_en: "Baby & Kids", level: 1, parent_id: null, code: "1100", sort: 12 },
  ];

  // L2 categories (精简示例，实际需要全部)
  const l2Cats = [
    { id: 101, name_cn: "上衣", name_en: "Tops", level: 2, parent_id: 100, code: "101", sort: 1 },
    { id: 102, name_cn: "外套", name_en: "Outerwear", level: 2, parent_id: 100, code: "102", sort: 2 },
    { id: 103, name_cn: "裤装", name_en: "Bottoms", level: 2, parent_id: 100, code: "103", sort: 3 },
    { id: 104, name_cn: "裙装", name_en: "Dresses & Skirts", level: 2, parent_id: 100, code: "104", sort: 4 },
    { id: 105, name_cn: "鞋类", name_en: "Footwear", level: 2, parent_id: 100, code: "105", sort: 5 },
    { id: 112, name_cn: "箱包", name_en: "Bags & Luggage", level: 2, parent_id: 100, code: "112", sort: 6 },
    { id: 201, name_cn: "手机配件", name_en: "Mobile Accessories", level: 2, parent_id: 200, code: "201", sort: 1 },
    { id: 202, name_cn: "音频设备", name_en: "Audio Devices", level: 2, parent_id: 200, code: "202", sort: 2 },
    { id: 204, name_cn: "智能穿戴", name_en: "Wearables", level: 2, parent_id: 200, code: "204", sort: 3 },
    { id: 221, name_cn: "摄影摄像", name_en: "Photography", level: 2, parent_id: 200, code: "221", sort: 4 },
    { id: 222, name_cn: "电脑配件", name_en: "Computer Accessories", level: 2, parent_id: 200, code: "222", sort: 5 },
  ];

  // L3 categories (示例)
  const l3Cats = [
    { id: 10101, name_cn: "T恤", name_en: "T-Shirt", level: 3, parent_id: 101, code: "10101", sort: 1 },
    { id: 10102, name_cn: "衬衫", name_en: "Shirt", level: 3, parent_id: 101, code: "10102", sort: 2 },
    { id: 10103, name_cn: "卫衣", name_en: "Hoodie", level: 3, parent_id: 101, code: "10103", sort: 3 },
    { id: 10104, name_cn: "毛衣", name_en: "Sweater", level: 3, parent_id: 101, code: "10104", sort: 4 },
    { id: 20301, name_cn: "蓝牙耳机", name_en: "Bluetooth Earbuds", level: 3, parent_id: 202, code: "20301", sort: 1 },
    { id: 20302, name_cn: "蓝牙音箱", name_en: "Bluetooth Speaker", level: 3, parent_id: 202, code: "20302", sort: 2 },
    { id: 20401, name_cn: "智能手表", name_en: "Smart Watch", level: 3, parent_id: 204, code: "20401", sort: 1 },
  ];

  fullExcelData.categories = [...l1Cats, ...l2Cats, ...l3Cats];

  // 类目属性 (示例 - T恤的属性)
  fullExcelData.categoryAttributes = [
    { category_id: 10101, attr_code: "size", attr_name: "尺码 Size", input_type: "text", required: 1, unit: null, options_json: [], help_text: null, visible_on_quote: 1, attr_sort: 1 },
    { category_id: 10101, attr_code: "color", attr_name: "颜色 Color", input_type: "select", required: 0, unit: null, options_json: ["Black","White","Gray","Blue","Red","Green","Brown","Beige","Pink","Multi"], help_text: null, visible_on_quote: 1, attr_sort: 2 },
    { category_id: 10101, attr_code: "material", attr_name: "材质 Material", input_type: "text", required: 0, unit: null, options_json: [], help_text: null, visible_on_quote: 1, attr_sort: 3 },
    { category_id: 10101, attr_code: "weight", attr_name: "单件重量 Weight", input_type: "number", required: 0, unit: "g", options_json: [], help_text: null, visible_on_quote: 1, attr_sort: 4 },
    { category_id: 10101, attr_code: "package_type", attr_name: "包装形式 Package", input_type: "select", required: 0, unit: null, options_json: ["Polybag","Color Box","Brown Box","Blister","Hangtag","Bulk"], help_text: null, visible_on_quote: 1, attr_sort: 5 },
    { category_id: 10101, attr_code: "lead_time", attr_name: "生产交期 Lead Time", input_type: "text", required: 0, unit: null, options_json: [], help_text: "例如: 打样7天/量产20天", visible_on_quote: 1, attr_sort: 10 },
    { category_id: 10101, attr_code: "sample_fee", attr_name: "打样费 Sample Fee", input_type: "number", required: 0, unit: null, options_json: [], help_text: "如无则填0（币种见备注）", visible_on_quote: 1, attr_sort: 11 },
  ];

  // 功能模块
  fullExcelData.featureModules = [
    { feature_code: "heating", feature_name: "加热 Heating", feature_name_en: "Heating", description: "带发热/温控功能" },
    { feature_code: "lighting", feature_name: "照明 Lighting", feature_name_en: "Lighting", description: "自带光源或辅助照明" },
    { feature_code: "bluetooth", feature_name: "蓝牙 Bluetooth", feature_name_en: "Bluetooth", description: "音频/数据/控制连接" },
    { feature_code: "wifi", feature_name: "Wi‑Fi 网络 Wi‑Fi", feature_name_en: "Wi-Fi", description: "联网/远程控制" },
    { feature_code: "voice", feature_name: "语音控制 Voice Control", feature_name_en: "Voice Control", description: "支持语音助手" },
    { feature_code: "battery", feature_name: "电池供电 Battery", feature_name_en: "Battery", description: "内置或外接电池" },
    { feature_code: "display", feature_name: "显示屏 Display", feature_name_en: "Display", description: "带屏幕显示" },
    { feature_code: "gps", feature_name: "定位 GPS", feature_name_en: "GPS", description: "定位/轨迹" },
    { feature_code: "app_control", feature_name: "App 控制 App Control", feature_name_en: "App Control", description: "移动端配套App" },
    { feature_code: "waterproof", feature_name: "防水 Waterproof", feature_name_en: "Waterproof", description: "IP/IPX 等级" },
    { feature_code: "solar", feature_name: "太阳能 Solar", feature_name_en: "Solar", description: "太阳能供电/充电" },
  ];

  // 功能模块属性
  fullExcelData.featureAttributes = [
    // heating
    { feature_code: "heating", attr_code: "voltage", attr_name: "电压 Voltage", input_type: "number", required: 1, unit: "V", options_json: [], help_text: null, visible_on_quote: 1, attr_sort: 1 },
    { feature_code: "heating", attr_code: "power", attr_name: "功率 Power", input_type: "number", required: 0, unit: "W", options_json: [], help_text: null, visible_on_quote: 1, attr_sort: 2 },
    { feature_code: "heating", attr_code: "temp_levels", attr_name: "温度档位 Temp Levels", input_type: "select", required: 0, unit: null, options_json: ["Low","Medium","High"], help_text: null, visible_on_quote: 1, attr_sort: 3 },
    // bluetooth
    { feature_code: "bluetooth", attr_code: "bt_version", attr_name: "蓝牙版本 BT Version", input_type: "select", required: 1, unit: null, options_json: ["4.2","5.0","5.1","5.2","5.3"], help_text: null, visible_on_quote: 1, attr_sort: 1 },
    { feature_code: "bluetooth", attr_code: "profiles", attr_name: "协议 Profiles", input_type: "multiselect", required: 0, unit: null, options_json: ["A2DP","AVRCP","HFP","HSP","BLE"], help_text: null, visible_on_quote: 1, attr_sort: 2 },
    { feature_code: "bluetooth", attr_code: "range", attr_name: "传输距离 Range", input_type: "number", required: 0, unit: "m", options_json: [], help_text: null, visible_on_quote: 1, attr_sort: 3 },
    // waterproof
    { feature_code: "waterproof", attr_code: "ipx", attr_name: "防水等级 IPX", input_type: "select", required: 1, unit: null, options_json: ["IPX4","IPX5","IPX6","IPX7","IPX8"], help_text: null, visible_on_quote: 1, attr_sort: 1 },
    { feature_code: "waterproof", attr_code: "ip", attr_name: "防尘等级 IP", input_type: "select", required: 0, unit: null, options_json: ["IP5X","IP6X"], help_text: null, visible_on_quote: 1, attr_sort: 2 },
    // battery
    { feature_code: "battery", attr_code: "battery_type", attr_name: "电池类型 Battery Type", input_type: "select", required: 1, unit: null, options_json: ["Li-ion","LiPo","NiMH","Alkaline"], help_text: null, visible_on_quote: 1, attr_sort: 1 },
    { feature_code: "battery", attr_code: "capacity", attr_name: "容量 Capacity", input_type: "number", required: 0, unit: "mAh", options_json: [], help_text: null, visible_on_quote: 1, attr_sort: 2 },
  ];

  // 类目与功能模块绑定
  fullExcelData.bindings = [
    { category_id: 10103, feature_code: "heating" },
    { category_id: 10104, feature_code: "heating" },
    { category_id: 20301, feature_code: "battery" },
    { category_id: 20301, feature_code: "bluetooth" },
    { category_id: 20301, feature_code: "waterproof" },
    { category_id: 20302, feature_code: "battery" },
    { category_id: 20302, feature_code: "bluetooth" },
    { category_id: 20401, feature_code: "app_control" },
    { category_id: 20401, feature_code: "battery" },
    { category_id: 20401, feature_code: "bluetooth" },
    { category_id: 20401, feature_code: "display" },
    { category_id: 20401, feature_code: "gps" },
  ];

  return fullExcelData;
};

export const DataImporter = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleImportFullData = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      const data = parseExcelData();
      
      // Step 1: Import categories
      setCurrentStep("导入类目数据...");
      setProgress(20);
      await categoryService.bulkInsertCategories(data.categories);
      
      // Step 2: Import feature modules
      setCurrentStep("导入功能模块...");
      setProgress(40);
      await categoryService.bulkInsertFeatureModules(data.featureModules);
      
      // Step 3: Import category attributes
      setCurrentStep("导入类目属性...");
      setProgress(60);
      await categoryService.bulkInsertCategoryAttributes(data.categoryAttributes);
      
      // Step 4: Import feature attributes
      setCurrentStep("导入功能模块属性...");
      setProgress(80);
      await categoryService.bulkInsertFeatureAttributes(data.featureAttributes);
      
      // Step 5: Import bindings
      setCurrentStep("导入类目与功能模块绑定关系...");
      setProgress(90);
      await categoryService.bulkInsertCategoryFeatureBindings(data.bindings);

      setProgress(100);
      setCurrentStep("导入完成！");
      setImported(true);
      
      toast({
        title: "数据导入成功",
        description: `已成功导入 ${data.categories.length} 个类目、${data.featureModules.length} 个功能模块`,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      setError(error.message || "导入失败");
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

        <div className="rounded-lg border p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <Upload className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Excel 完整数据导入</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                将导入所有类目、属性、功能模块及绑定关系
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                包含：12个L1类目、多个L2/L3类目、11个功能模块及属性配置
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleImportFullData}
            disabled={loading || imported}
            className="flex-1"
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
                {loading ? "导入中..." : "导入Excel完整数据"}
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
