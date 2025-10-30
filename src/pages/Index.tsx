import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Settings, FileText, Truck } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <section className="mb-12">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/rfq')}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Plus className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">新建询价单 New RFQ</CardTitle>
                      <CardDescription>创建新的RFQ询价单 Create new RFQ request</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    开始新的询价流程，选择产品类目，填写属性，添加供应商报价 Start a new RFQ process, select product category, fill in attributes, add supplier quotes
                  </p>
                  <Button className="mt-4 w-full">开始创建 Start New RFQ</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/quotation-requests')}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">报价请求管理 Quotation Management</CardTitle>
                      <CardDescription>统一管理所有报价请求 Manage all quote requests</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    查看系统询价单和客户报价请求，统一入口管理 View system RFQs and customer quote requests in one place
                  </p>
                  <Button className="mt-4 w-full">
                    查看列表 View Requests
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/shipping-estimator')}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Truck className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">运费计算器 Shipping Calculator</CardTitle>
                      <CardDescription>快速估算运费 Quick shipping estimate</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    输入重量和目的地，快速计算多个物流渠道的运费 Enter weight and destination to quickly calculate shipping costs for multiple channels
                  </p>
                  <Button className="mt-4 w-full">
                    立即计算 Calculate Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">系统功能 Features</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">三级类目选择 3-Level Category Selection</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    支持三级类目级联选择，每个L3类目关联专属属性模板 Support 3-level cascading category selection, each L3 category has its own attribute template
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">动态属性表单 Dynamic Attribute Forms</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    根据选择的类目和功能模块，自动生成对应的属性填写表单 Automatically generate corresponding attribute forms based on selected categories and feature modules
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">供应商报价管理 Supplier Quote Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    管理多个供应商，每个供应商可提供多个报价进行比较 Manage multiple suppliers, each supplier can provide multiple quotes for comparison
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
