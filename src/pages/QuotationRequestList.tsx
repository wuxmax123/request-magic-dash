import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Plus, Search, Image as ImageIcon, Truck, X, UserCircle2, UserCog, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { rfqService } from '@/services/rfqService';
import type { RFQData, RFQPriority } from '@/types/rfq';
import { RFQDetailDialog } from '@/components/rfq/RFQDetailDialog';
import { QuotationRequestDetailDialog } from '@/components/rfq/QuotationRequestDetailDialog';
import { UserSelector } from '@/components/rfq/UserSelector';
import { useAdmin } from '@/hooks/useAdmin';

type RequestSource = 'customer_portal' | 'internal' | 'all';
type FilterStatus = 'all' | 'pending' | 'draft' | 'in_progress' | 'quoted' | 'closed';

interface QuotationRequest extends RFQData {
  request_source?: RequestSource;
  image_url?: string;
}

export default function QuotationRequestList() {
  const navigate = useNavigate();
  const { isSupervisor } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<QuotationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<QuotationRequest[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sourceFilter, setSourceFilter] = useState<RequestSource>('all');
  
  // Dialog states
  const [rfqDialogOpen, setRfqDialogOpen] = useState(false);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>('');
  const [requestDetailOpen, setRequestDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<QuotationRequest | null>(null);
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  
  // Assignment states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignDialogType, setAssignDialogType] = useState<'assign' | 'reassign' | 'unassign'>('assign');
  const [assigningRfq, setAssigningRfq] = useState<QuotationRequest | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [assignNote, setAssignNote] = useState('');
  const [assigneeProfiles, setAssigneeProfiles] = useState<Record<string, any>>({});

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
      // Map RFQs with proper source
      const mappedRequests: QuotationRequest[] = rfqs.map(rfq => ({
        ...rfq,
        request_source: (rfq.source || 'internal') as RequestSource,
        image_url: rfq.images?.[0]
      }));
      setRequests(mappedRequests);
      
      // Load assignee profiles
      const uniqueAssigneeIds = [...new Set(mappedRequests.map(r => r.assigned_to).filter(Boolean))] as string[];
      const profiles: Record<string, any> = {};
      for (const userId of uniqueAssigneeIds) {
        const profile = await rfqService.getUserProfile(userId);
        if (profile) profiles[userId] = profile;
      }
      setAssigneeProfiles(profiles);
    } catch (error) {
      console.error('Failed to load requests:', error);
      toast.error('加载报价请求失败 Failed to load quotation requests');
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
      pending: { label: '待处理 Pending', variant: 'outline' as const, clickable: false },
      draft: { label: '草稿 Draft', variant: 'secondary' as const, clickable: false },
      in_progress: { label: '进行中 In Progress', variant: 'default' as const, clickable: false },
      quoted: { label: '已报价 Quoted', variant: 'default' as const, clickable: true },
      closed: { label: '已关闭 Closed', variant: 'secondary' as const, clickable: false },
      submitted: { label: '已提交 Submitted', variant: 'default' as const, clickable: false },
      approved: { label: '已批准 Approved', variant: 'default' as const, clickable: true },
      rejected: { label: '已拒绝 Rejected', variant: 'destructive' as const, clickable: false }
    };
    return configs[status as keyof typeof configs] || { label: status, variant: 'secondary' as const, clickable: false };
  };

  const getSourceLabel = (source?: RequestSource) => {
    const labels = {
      customer_portal: '客户提交 Customer Portal',
      internal: '内部创建 Internal',
      all: '全部来源 All Sources'
    };
    return labels[source || 'internal'];
  };

  const getPriorityConfig = (priority?: RFQPriority) => {
    const configs = {
      P1: { label: 'P1', color: 'text-red-500' },
      P2: { label: 'P2', color: 'text-yellow-500' },
      P3: { label: 'P3', color: 'text-green-500' }
    };
    return configs[priority || 'P2'];
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
      toast.error('请先选择要删除的项目 Please select items to delete');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedIds.size} 个报价请求吗？此操作不可恢复。Are you sure to delete ${selectedIds.size} selected request(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      await rfqService.deleteRFQs(Array.from(selectedIds));
      toast.success(`成功删除 ${selectedIds.size} 个报价请求 Successfully deleted ${selectedIds.size} request(s)`);
      setSelectedIds(new Set());
      await loadRequests();
    } catch (error) {
      console.error('Failed to delete requests:', error);
      toast.error('删除失败，请重试 Delete failed, please try again');
    } finally {
      setDeleting(false);
    }
  };

  const handleAssignToMe = async (rfqId: string) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('未登录 Not logged in');
        return;
      }
      
      await rfqService.assignRFQ(rfqId, user.id);
      toast.success('已领取 Assigned to you');
      await loadRequests();
    } catch (error) {
      console.error('Failed to assign:', error);
      toast.error('领取失败 Failed to assign');
    }
  };

  const handleOpenAssignDialog = (request: QuotationRequest, type: 'assign' | 'reassign' | 'unassign') => {
    setAssigningRfq(request);
    setAssignDialogType(type);
    setSelectedUserId('');
    setAssignNote('');
    setAssignDialogOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!assigningRfq?.id) return;
    
    if (assignDialogType !== 'unassign' && !selectedUserId) {
      toast.error('请选择用户 Please select a user');
      return;
    }

    try {
      if (assignDialogType === 'assign') {
        await rfqService.assign(assigningRfq.id, selectedUserId, assignNote || undefined);
        toast.success('分配成功 Assigned successfully');
      } else if (assignDialogType === 'reassign') {
        await rfqService.reassign(assigningRfq.id, selectedUserId, assignNote || undefined);
        toast.success('重新分配成功 Reassigned successfully');
      } else {
        await rfqService.unassign(assigningRfq.id, assignNote || undefined);
        toast.success('取消分配成功 Unassigned successfully');
      }
      
      setAssignDialogOpen(false);
      await loadRequests();
    } catch (error) {
      console.error('Assignment failed:', error);
      toast.error('操作失败 Operation failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载中... Loading...</p>
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
                {deleting ? '删除中... Deleting...' : `删除选中 Delete (${selectedIds.size})`}
              </Button>
            )}
            <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as RequestSource)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="请选择来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部来源 All Sources</SelectItem>
                <SelectItem value="customer_portal">客户提交 Customer Portal</SelectItem>
                <SelectItem value="internal">内部创建 Internal</SelectItem>
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

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterStatus)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态 All Status</SelectItem>
                <SelectItem value="pending">待处理 Pending</SelectItem>
                <SelectItem value="draft">草稿 Draft</SelectItem>
                <SelectItem value="in_progress">进行中 In Progress</SelectItem>
                <SelectItem value="quoted">已报价 Quoted</SelectItem>
                <SelectItem value="closed">已关闭 Closed</SelectItem>
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
                  <TableHead className="min-w-[120px]">报价编号 Quote ID</TableHead>
                  <TableHead className="min-w-[120px]">请求来源 Request From</TableHead>
                  <TableHead className="min-w-[120px]">负责人 Assignee</TableHead>
                  <TableHead className="min-w-[120px]">状态 Status</TableHead>
                  <TableHead className="w-[100px]">图片 Image</TableHead>
                  <TableHead className="min-w-[100px]">优先级 Priority</TableHead>
                  <TableHead className="min-w-[120px]">日期 Date</TableHead>
                  <TableHead className="min-w-[150px]">备注 Note</TableHead>
                  <TableHead className="min-w-[120px]">运费 Shipping</TableHead>
                  <TableHead className="min-w-[120px]">目标 Target</TableHead>
                  <TableHead className="min-w-[150px]">操作 Menu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={12} className="text-center py-12">
                      <div className="text-muted-foreground">
                        <p className="mb-4">暂无报价请求 No quotation requests</p>
                        <Button onClick={() => navigate('/rfq')}>
                          <Plus className="h-4 w-4 mr-2" />
                          创建第一个询价单 Create first RFQ
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
                            {(request.customer_links && request.customer_links.length > 0) ? (
                              <a 
                                href={request.customer_links[0]}
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
                          <span className="text-sm font-mono text-muted-foreground">
                            {request.quote_id || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{getSourceLabel(request.request_source)}</span>
                        </TableCell>
                        <TableCell>
                          {request.assigned_to ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={assigneeProfiles[request.assigned_to]?.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {(assigneeProfiles[request.assigned_to]?.full_name || 
                                    assigneeProfiles[request.assigned_to]?.username || 'U')
                                    .split(' ')
                                    .map((n: string) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm truncate max-w-24">
                                {assigneeProfiles[request.assigned_to]?.full_name || 
                                 assigneeProfiles[request.assigned_to]?.username || 
                                 'Unknown'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <UserCircle2 className="h-4 w-4" />
                              <span>未分配</span>
                            </div>
                          )}
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
                          <div className="flex flex-col gap-1">
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
                            {isSupervisor && (
                              <div className="flex gap-1">
                                {!request.assigned_to ? (
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenAssignDialog(request, 'assign')}
                                  >
                                    <UserCircle2 className="h-3 w-3 mr-1" />
                                    分配
                                  </Button>
                                ) : (
                                  <>
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenAssignDialog(request, 'reassign')}
                                    >
                                      <UserCog className="h-3 w-3 mr-1" />
                                      重新分配
                                    </Button>
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenAssignDialog(request, 'unassign')}
                                    >
                                      <UserX className="h-3 w-3 mr-1" />
                                      取消分配
                                    </Button>
                                  </>
                                )}
                              </div>
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
          request={selectedRequest as any}
          open={requestDetailOpen}
          onOpenChange={setRequestDetailOpen}
        />
      )}

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {assignDialogType === 'assign' ? '分配询价员 Assign' : 
               assignDialogType === 'reassign' ? '重新分配 Reassign' : 
               '取消分配 Unassign'}
            </DialogTitle>
            <DialogDescription>
              {assignDialogType === 'unassign' 
                ? '确定要取消当前分配吗？Remove the current assignee from this RFQ' 
                : '选择要分配的询价员 Select a user to assign this RFQ to'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {assignDialogType !== 'unassign' && (
              <div className="space-y-2">
                <Label htmlFor="user">询价员 User *</Label>
                <UserSelector
                  value={selectedUserId}
                  onChange={setSelectedUserId}
                  placeholder="搜索用户... Search users..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="note">备注 Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="添加备注... Add a note..."
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              取消 Cancel
            </Button>
            <Button onClick={handleConfirmAssign}>
              确认 Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
