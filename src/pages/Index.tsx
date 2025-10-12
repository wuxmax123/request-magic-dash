import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Settings, FileText } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">RFQ询价系统</h1>
              <p className="text-muted-foreground mt-1">Request for Quotation Management System</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/admin')}>
              <Settings className="h-4 w-4 mr-2" />
              管理后台
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <section className="mb-12">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/rfq')}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Plus className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">新建询价单</CardTitle>
                      <CardDescription>创建新的RFQ询价单</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    开始新的询价流程，选择产品类目，填写属性，添加供应商报价
                  </p>
                  <Button className="mt-4 w-full">开始创建 Start New RFQ</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/rfq-list')}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">我的询价单</CardTitle>
                      <CardDescription>查看和管理询价单</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    查看所有草稿、待审核和已完成的询价单
                  </p>
                  <Button className="mt-4 w-full">
                    查看列表 View List
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
                  <CardTitle className="text-lg">三级类目选择</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    支持三级类目级联选择，每个L3类目关联专属属性模板
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">动态属性表单</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    根据选择的类目和功能模块，自动生成对应的属性填写表单
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">供应商报价管理</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    管理多个供应商，每个供应商可提供多个报价进行比较
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
