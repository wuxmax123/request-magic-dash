import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Home, Plus, Search, Image as ImageIcon, Truck, X } from 'lucide-react';
import { toast } from 'sonner';
import { rfqService } from '@/services/rfqService';
import type { RFQData } from '@/types/rfq';
import { RFQDetailDialog } from '@/components/rfq/RFQDetailDialog';
import { QuotationRequestDetailDialog } from '@/components/rfq/QuotationRequestDetailDialog';

type RequestSource = 'system_rfq' | 'customer_quote' | 'all';
type PriorityLevel = 'high' | 'medium' | 'low';

interface QuotationRequest extends RFQData {
  request_source?: RequestSource;
  priority?: PriorityLevel;
  image_url?: string;
}

export default function QuotationRequestList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<QuotationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<QuotationRequest[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<RequestSource>('all');
  
  // Dialog states
  const [rfqDialogOpen, setRfqDialogOpen] = useState(false);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>('');
  const [requestDetailOpen, setRequestDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<QuotationRequest | null>(null);
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchKeyword, statusFilter, sourceFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const rfqs = await rfqService.listRFQs();
      // 将RFQ标记为系统询价来源
      const mappedRequests: QuotationRequest[] = rfqs.map(rfq => ({
        ...rfq,
        request_source: 'system_rfq' as RequestSource,
        priority: 'medium' as PriorityLevel,
        image_url: rfq.images?.[0]
      }));
      setRequests(mappedRequests);
    } catch (error) {
      console.error('Failed to load requests:', error);
      toast.error('加载报价请求失败');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // 按关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(req => 
        req.title?.toLowerCase().includes(keyword) ||
        req.product_name?.toLowerCase().includes(keyword) ||
        req.inquiry_id?.toLowerCase().includes(keyword) ||
        req.reference_number?.toLowerCase().includes(keyword)
      );
    }

    // 按状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // 按来源过滤
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(req => req.request_source === sourceFilter);
    }

    setFilteredRequests(filtered);
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      draft: { label: '草稿', variant: 'secondary' as const, clickable: false },
      submitted: { label: '已提交', variant: 'default' as const, clickable: false },
      approved: { label: '已报价', variant: 'default' as const, clickable: true },
      rejected: { label: '已拒绝', variant: 'destructive' as const, clickable: false }
    };
    return configs[status as keyof typeof configs] || { label: status, variant: 'secondary' as const, clickable: false };
  };

  const getSourceLabel = (source?: RequestSource) => {
    const labels = {
      system_rfq: '系统询价',
      customer_quote: '客户请求',
      all: '全部'
    };
    return labels[source || 'system_rfq'];
  };

  const getPriorityConfig = (priority?: PriorityLevel) => {
    const configs = {
      high: { label: 'High', color: 'text-red-500' },
      medium: { label: 'Medium', color: 'text-yellow-500' },
      low: { label: 'Low', color: 'text-green-500' }
    };
    return configs[priority || 'medium'];
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const handleViewRFQDetail = (inquiryId: string) => {
    setSelectedInquiryId(inquiryId);
    setRfqDialogOpen(true);
  };

  const handleViewRequestDetail = (request: QuotationRequest) => {
    setSelectedRequest(request);
    setRequestDetailOpen(true);
  };

  const toggleSelection = (inquiryId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(inquiryId)) {
      newSelected.delete(inquiryId);
    } else {
      newSelected.add(inquiryId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRequests.map(r => r.inquiry_id!)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error('请先选择要删除的项目');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedIds.size} 个报价请求吗？此操作不可恢复。`)) {
      return;
    }

    try {
      setDeleting(true);
      await rfqService.deleteRFQs(Array.from(selectedIds));
      toast.success(`成功删除 ${selectedIds.size} 个报价请求`);
      setSelectedIds(new Set());
      await loadRequests();
    } catch (error) {
      console.error('Failed to delete requests:', error);
      toast.error('删除失败，请重试');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <Home className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">报价请求管理</h1>
                <p className="text-sm text-muted-foreground">Quotation Request Management</p>
              </div>
            </div>
            <Button onClick={() => navigate('/rfq')} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              添加报价产品 Add Quote Product
            </Button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {selectedIds.size > 0 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteSelected}
                disabled={deleting}
              >
                {deleting ? '删除中...' : `删除选中 (${selectedIds.size})`}
              </Button>
            )}
            <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as RequestSource)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="请选择来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部来源</SelectItem>
                <SelectItem value="system_rfq">系统询价</SelectItem>
                <SelectItem value="customer_quote">客户请求</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1 min-w-[200px] max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索关键词 (产品名称、询价单号等)"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="submitted">已提交</SelectItem>
                <SelectItem value="approved">已报价</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      {/* Table */}
      <div className="container mx-auto px-4 pb-8">
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <input 
                      type="checkbox" 
                      className="rounded cursor-pointer"
                      checked={filteredRequests.length > 0 && selectedIds.size === filteredRequests.length}
                      onChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="min-w-[200px]">产品名称 Product Name</TableHead>
                  <TableHead className="min-w-[120px]">请求来源 Request From</TableHead>
                  <TableHead className="min-w-[120px]">状态 Status</TableHead>
                  <TableHead className="w-[100px]">图片 Image</TableHead>
                  <TableHead className="min-w-[100px]">优先级 Priority</TableHead>
                  <TableHead className="min-w-[120px]">日期 Date</TableHead>
                  <TableHead className="min-w-[150px]">备注 Note</TableHead>
                  <TableHead className="min-w-[120px]">运费 Shipping</TableHead>
                  <TableHead className="min-w-[120px]">目标 Target</TableHead>
                  <TableHead className="min-w-[100px]">操作 Menu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <div className="text-muted-foreground">
                        <p className="mb-4">暂无报价请求</p>
                        <Button onClick={() => navigate('/rfq')}>
                          <Plus className="h-4 w-4 mr-2" />
                          创建第一个询价单
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => {
                    const statusConfig = getStatusConfig(request.status);
                    const priorityConfig = getPriorityConfig(request.priority);
                    
                    return (
                      <TableRow key={request.inquiry_id} className="hover:bg-muted/50">
                        <TableCell>
                          <input 
                            type="checkbox" 
                            className="rounded cursor-pointer"
                            checked={selectedIds.has(request.inquiry_id!)}
                            onChange={() => toggleSelection(request.inquiry_id!)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            {((request.customer_links && request.customer_links.length > 0) || (request.source_links && request.source_links.length > 0)) ? (
                              <a 
                                href={(request.customer_links && request.customer_links.length > 0) ? request.customer_links[0] : (request.source_links && request.source_links.length > 0 ? request.source_links[0] : '#')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:underline block"
                              >
                                {request.product_name || request.title || '-'}
                              </a>
                            ) : (
                              <div className="font-medium">{request.product_name || request.title || '-'}</div>
                            )}
                            <button 
                              onClick={() => handleViewRFQDetail(request.inquiry_id!)}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {request.inquiry_id}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{getSourceLabel(request.request_source)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={statusConfig.variant}>
                              {statusConfig.label}
                            </Badge>
                            {statusConfig.clickable && (
                              <span className="text-xs text-red-500 font-medium animate-pulse">
                                CLICK ME!
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {request.image_url ? (
                            <img 
                              src={request.image_url} 
                              alt="Product" 
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={priorityConfig.color}>
                            ● {priorityConfig.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatDate(request.created_at)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground line-clamp-2">
                            {request.notes || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {request.include_shipping && request.shipping_quotes && request.shipping_quotes.length > 0 ? (
                            (() => {
                              const selectedQuote = request.shipping_quotes.find(q => q.is_selected) || request.shipping_quotes[0];
                              return (
                                <div className="flex items-center gap-2 text-sm">
                                  <Truck className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">${selectedQuote.total_freight.toFixed(2)}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {selectedQuote.estimated_delivery_days_min}-{selectedQuote.estimated_delivery_days_max}d
                                    </div>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <X className="h-3 w-3" />
                              <span>N/A</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Qty: 1 pcs</div>
                            <div className="text-muted-foreground">
                              Cost({request.currency}): {request.target_price || '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {request.status === 'draft' ? (
                              <Button 
                                variant="link" 
                                size="sm"
                                onClick={() => navigate(`/rfq?id=${request.inquiry_id}`)}
                              >
                                编辑
                              </Button>
                            ) : (
                              <Button 
                                variant="link" 
                                size="sm"
                                onClick={() => handleViewRequestDetail(request)}
                              >
                                查看详情
                              </Button>
                            )}
                            {request.status === 'approved' && (
                              <Button
                                variant="link"
                                size="sm"
                                className="text-blue-500"
                                onClick={() => {
                                  navigate(`/rfq?id=${request.inquiry_id}&tab=suppliers`);
                                }}
                              >
                                查看报价
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Dialogs */}
      <RFQDetailDialog 
        inquiryId={selectedInquiryId}
        open={rfqDialogOpen}
        onOpenChange={setRfqDialogOpen}
      />
      
      {selectedRequest && (
        <QuotationRequestDetailDialog
          request={selectedRequest}
          open={requestDetailOpen}
          onOpenChange={setRequestDetailOpen}
        />
      )}
    </div>
  );
}
