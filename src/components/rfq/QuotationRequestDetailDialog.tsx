import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Image as ImageIcon } from 'lucide-react';
import type { RFQData } from '@/types/rfq';

interface QuotationRequestDetailDialogProps {
  request: RFQData & {
    request_source?: 'system_rfq' | 'customer_quote' | 'all';
    priority?: 'high' | 'medium' | 'low';
    image_url?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuotationRequestDetailDialog({ 
  request, 
  open, 
  onOpenChange 
}: QuotationRequestDetailDialogProps) {
  const getStatusConfig = (status: string) => {
    const configs = {
      draft: { label: '草稿', variant: 'secondary' as const },
      submitted: { label: '已提交', variant: 'default' as const },
      approved: { label: '已报价', variant: 'default' as const },
      rejected: { label: '已拒绝', variant: 'destructive' as const }
    };
    return configs[status as keyof typeof configs] || { label: status, variant: 'secondary' as const };
  };

  const getSourceLabel = (source?: string) => {
    const labels = {
      system_rfq: '系统询价',
      customer_quote: '客户请求',
      all: '全部'
    };
    return labels[source as keyof typeof labels] || '系统询价';
  };

  const getPriorityConfig = (priority?: string) => {
    const configs = {
      high: { label: 'High', color: 'text-red-500' },
      medium: { label: 'Medium', color: 'text-yellow-500' },
      low: { label: 'Low', color: 'text-green-500' }
    };
    return configs[priority as keyof typeof configs] || configs.medium;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusConfig = getStatusConfig(request.status);
  const priorityConfig = getPriorityConfig(request.priority);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>报价请求详情</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">询价单号：</span>
                  <span className="text-sm ml-2">{request.inquiry_id}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">产品名称：</span>
                  <span className="text-sm ml-2">{request.title || '-'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">请求来源：</span>
                  <span className="text-sm ml-2">{getSourceLabel(request.request_source)}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">状态：</span>
                  <Badge variant={statusConfig.variant} className="ml-2">
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">优先级：</span>
                  <span className={`text-sm ml-2 ${priorityConfig.color}`}>
                    ● {priorityConfig.label}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">创建时间：</span>
                  <span className="text-sm ml-2">{formatDate(request.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 产品图片 */}
          {request.image_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">产品图片</CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src={request.image_url} 
                  alt="Product" 
                  className="w-full max-w-md mx-auto rounded-lg"
                />
              </CardContent>
            </Card>
          )}

          {/* 目标信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">目标信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">目的国：</span>
                  <span className="text-sm ml-2">{request.target_country}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">货币：</span>
                  <span className="text-sm ml-2">{request.currency}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">目标价格：</span>
                  <span className="text-sm ml-2">
                    {request.target_price ? `${request.currency} ${request.target_price}` : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">目标重量：</span>
                  <span className="text-sm ml-2">
                    {request.target_weight_kg ? `${request.target_weight_kg} kg` : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 备注 */}
          {request.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">备注</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{request.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* 产品链接 */}
          {request.customer_links && request.customer_links.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">产品链接</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {request.customer_links.map((link, i) => (
                    <li key={i}>
                      <a 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 来源链接 */}
          {request.source_links && request.source_links.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">来源链接</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {request.source_links.map((link, i) => (
                    <li key={i}>
                      <a 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
