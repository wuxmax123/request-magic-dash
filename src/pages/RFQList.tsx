import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rfqService } from '@/services/rfqService';
import { RFQData } from '@/types/rfq';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, FileText, Truck, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const statusMap = {
  draft: { label: '草稿', variant: 'outline' as const },
  submitted: { label: '已提交', variant: 'default' as const },
  approved: { label: '已批准', variant: 'default' as const },
  rejected: { label: '已拒绝', variant: 'destructive' as const },
};

export default function RFQList() {
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState<RFQData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRFQs();
  }, []);

  const loadRFQs = async () => {
    try {
      const data = await rfqService.listRFQs();
      setRfqs(data);
    } catch (error) {
      toast({
        title: '加载失败',
        description: '无法加载询价单列表',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">我的询价单</h1>
            <p className="text-muted-foreground">查看和管理您的询价单</p>
          </div>
          <Button onClick={() => navigate('/rfq')}>
            <Plus className="h-4 w-4 mr-2" />
            新建询价单
          </Button>
        </div>

        {rfqs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground mb-2">暂无询价单</p>
              <p className="text-sm text-muted-foreground mb-4">点击"新建询价单"开始创建</p>
              <Button onClick={() => navigate('/rfq')}>
                <Plus className="h-4 w-4 mr-2" />
                新建询价单
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>询价单列表</CardTitle>
              <CardDescription>共 {rfqs.length} 条记录</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>询价单号</TableHead>
                    <TableHead>客户需求</TableHead>
                    <TableHead>目标国家</TableHead>
                    <TableHead>货币</TableHead>
                    <TableHead>运费</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfqs.map((rfq) => {
                    const selectedQuote = rfq.shipping_quotes?.find(q => q.is_selected) || rfq.shipping_quotes?.[0];
                    
                    return (
                      <TableRow key={rfq.inquiry_id}>
                        <TableCell className="font-mono text-sm">{rfq.inquiry_id}</TableCell>
                        <TableCell className="max-w-xs truncate">{rfq.title || '-'}</TableCell>
                        <TableCell>{rfq.target_country}</TableCell>
                        <TableCell>{rfq.currency}</TableCell>
                        <TableCell>
                          {rfq.include_shipping && selectedQuote ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Truck className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                ${selectedQuote.total_freight.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <X className="h-3 w-3" />
                              <span>不含运费</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusMap[rfq.status].variant}>
                            {statusMap[rfq.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(rfq.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/rfq?id=${rfq.inquiry_id}`)}
                          >
                            查看
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
