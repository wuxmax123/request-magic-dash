import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { rfqService } from '@/services/rfqService';
import { RFQData } from '@/types/rfq';
import { ArrowLeft, Package, DollarSign, Hash, Calendar, MessageSquare } from 'lucide-react';

export default function RFQView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rfq, setRfq] = useState<RFQData | null>(null);

  useEffect(() => {
    if (id) {
      loadRFQ(id);
    }
  }, [id]);

  const loadRFQ = async (rfqId: string) => {
    try {
      setLoading(true);
      const data = await rfqService.getRFQById(rfqId);
      setRfq(data);
    } catch (error) {
      console.error('Failed to load RFQ:', error);
      toast({
        title: '加载失败 Failed to Load',
        description: '无法加载询价单信息 Unable to load RFQ information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { label: '待处理 Pending', variant: 'outline' as const },
      draft: { label: '处理中 Processing', variant: 'secondary' as const },
      in_progress: { label: '进行中 In Progress', variant: 'default' as const },
      quoted: { label: '已报价 Quoted', variant: 'default' as const },
      closed: { label: '已关闭 Closed', variant: 'secondary' as const },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">加载中... Loading...</p>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">询价单不存在 RFQ not found</p>
          <Button onClick={() => navigate(-1)}>返回 Go Back</Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(rfq.status);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">询价详情 RFQ Details</h1>
            <p className="text-muted-foreground">查看您的询价进度 View your RFQ progress</p>
          </div>
          <Badge variant={statusConfig.variant} className="text-base px-4 py-2">
            {statusConfig.label}
          </Badge>
        </div>

        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息 Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">RFQ编号 RFQ No</p>
                    <p className="font-mono font-medium">{rfq.inquiry_id}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">提交时间 Submitted</p>
                    <p className="font-medium">
                      {rfq.created_at ? new Date(rfq.created_at).toLocaleDateString('zh-CN') : '-'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">产品名称 Product Name</p>
                  <p className="font-medium text-lg">
                    {rfq.basic_info?.productName || rfq.product_name || rfq.title}
                  </p>
                </div>
              </div>

              {rfq.basic_info?.productLink && (
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">参考链接 Reference Link</p>
                    <a
                      href={rfq.basic_info.productLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      {rfq.basic_info.productLink}
                    </a>
                  </div>
                </div>
              )}

              {(rfq.basic_info?.targetPrice || rfq.basic_info?.quantity) && (
                <div className="grid grid-cols-2 gap-4">
                  {rfq.basic_info?.targetPrice && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">目标价格 Target Price</p>
                        <p className="font-medium">${rfq.basic_info.targetPrice}</p>
                      </div>
                    </div>
                  )}
                  
                  {rfq.basic_info?.quantity && (
                    <div className="flex items-start gap-3">
                      <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">数量 Quantity</p>
                        <p className="font-medium">{rfq.basic_info.quantity} pcs</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {rfq.basic_info?.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">备注说明 Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{rfq.basic_info.notes}</p>
                  </div>
                </>
              )}

              {rfq.basic_info?.referencePicUrls && rfq.basic_info.referencePicUrls.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">参考图片 Reference Images</p>
                    <div className="grid grid-cols-4 gap-2">
                      {rfq.basic_info.referencePicUrls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Reference ${idx + 1}`}
                          className="w-full aspect-square object-cover rounded border"
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Status & Progress */}
          <Card>
            <CardHeader>
              <CardTitle>处理进度 Processing Progress</CardTitle>
              <CardDescription>
                我们将在收到您的询价后24小时内开始处理
                <br />
                We will start processing within 24 hours after receiving your RFQ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full ${rfq.status === 'pending' ? 'bg-primary' : 'bg-muted'}`} />
                  <div className="flex-1">
                    <p className="font-medium">待处理 Pending</p>
                    <p className="text-sm text-muted-foreground">已收到您的询价 RFQ received</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full ${['draft', 'in_progress'].includes(rfq.status) ? 'bg-primary' : 'bg-muted'}`} />
                  <div className="flex-1">
                    <p className="font-medium">处理中 Processing</p>
                    <p className="text-sm text-muted-foreground">正在完善询价信息 Completing RFQ details</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full ${rfq.status === 'quoted' ? 'bg-primary' : 'bg-muted'}`} />
                  <div className="flex-1">
                    <p className="font-medium">已报价 Quoted</p>
                    <p className="text-sm text-muted-foreground">报价已生成 Quotation ready</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Section - Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                沟通记录 Communication
              </CardTitle>
              <CardDescription>
                与采购员沟通 Communicate with purchaser
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>沟通功能开发中 Communication feature coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
