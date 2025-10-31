import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rfqService } from '@/services/rfqService';
import { RFQData } from '@/types/rfq';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Plus, FileText, Truck, X, UserCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/useAdmin';

const statusMap: Record<string, { label: string; variant: 'outline' | 'default' | 'destructive' | 'secondary' }> = {
  draft: { label: '草稿', variant: 'outline' },
  submitted: { label: '已提交', variant: 'default' },
  approved: { label: '已批准', variant: 'default' },
  rejected: { label: '已拒绝', variant: 'destructive' },
  pending: { label: '待处理', variant: 'secondary' },
  assigned: { label: '已分配', variant: 'default' },
  in_progress: { label: '进行中', variant: 'default' },
  quoted: { label: '已报价', variant: 'default' },
  closed: { label: '已关闭', variant: 'secondary' },
};

type AssigneeFilter = 'all' | 'unassigned' | 'assigned_to_me';

export default function RFQList() {
  const navigate = useNavigate();
  const { isSupervisor } = useAdmin();
  const [rfqs, setRfqs] = useState<RFQData[]>([]);
  const [filteredRfqs, setFilteredRfqs] = useState<RFQData[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('all');
  const [assigneeProfiles, setAssigneeProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    loadRFQs();
  }, []);

  useEffect(() => {
    filterRFQs();
  }, [rfqs, assigneeFilter]);

  const loadRFQs = async () => {
    try {
      const data = await rfqService.listRFQs();
      setRfqs(data);
      
      // Load assignee profiles
      const uniqueAssigneeIds = [...new Set(data.map(r => r.assigned_to).filter(Boolean))] as string[];
      const profiles: Record<string, any> = {};
      for (const userId of uniqueAssigneeIds) {
        const profile = await rfqService.getUserProfile(userId);
        if (profile) profiles[userId] = profile;
      }
      setAssigneeProfiles(profiles);
    } catch (error) {
      toast({
        title: '加载失败 Failed to Load',
        description: '无法加载询价单列表 Unable to load RFQ list',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRFQs = async () => {
    let filtered = [...rfqs];

    if (assigneeFilter === 'unassigned') {
      filtered = filtered.filter(r => !r.assigned_to);
    } else if (assigneeFilter === 'assigned_to_me') {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        filtered = filtered.filter(r => r.assigned_to === user.id);
      }
    }

    setFilteredRfqs(filtered);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">加载中... Loading...</p>
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
            <h1 className="text-3xl font-bold">我的询价单 My RFQ List</h1>
            <p className="text-muted-foreground">查看和管理您的询价单 View and manage your RFQ requests</p>
          </div>
          {isSupervisor && (
            <Select value={assigneeFilter} onValueChange={(v) => setAssigneeFilter(v as AssigneeFilter)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有 All</SelectItem>
                <SelectItem value="unassigned">未分配 Unassigned</SelectItem>
                <SelectItem value="assigned_to_me">分配给我 Assigned to me</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => navigate('/rfq')}>
            <Plus className="h-4 w-4 mr-2" />
            新建询价单 New RFQ
          </Button>
        </div>

        {filteredRfqs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground mb-2">暂无询价单 No RFQs</p>
              <p className="text-sm text-muted-foreground mb-4">点击"新建询价单"开始创建 Click "New RFQ" to start</p>
              <Button onClick={() => navigate('/rfq')}>
                <Plus className="h-4 w-4 mr-2" />
                新建询价单 New RFQ
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>询价单列表 RFQ List</CardTitle>
              <CardDescription>共 {filteredRfqs.length} 条记录 {filteredRfqs.length} records</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>询价单号 RFQ ID</TableHead>
                    <TableHead>客户需求 Requirements</TableHead>
                    <TableHead>负责人 Assignee</TableHead>
                    <TableHead>目标国家 Target Country</TableHead>
                    <TableHead>货币 Currency</TableHead>
                    <TableHead>运费 Shipping</TableHead>
                    <TableHead>状态 Status</TableHead>
                    <TableHead>创建时间 Created</TableHead>
                    <TableHead className="text-right">操作 Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRfqs.map((rfq) => {
                    const selectedQuote = rfq.shipping_quotes?.find(q => q.is_selected) || rfq.shipping_quotes?.[0];
                    
                    return (
                      <TableRow key={rfq.inquiry_id}>
                        <TableCell className="font-mono text-sm">{rfq.inquiry_id}</TableCell>
                        <TableCell className="max-w-xs truncate">{rfq.title || '-'}</TableCell>
                        <TableCell>
                          {rfq.assigned_to ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={assigneeProfiles[rfq.assigned_to]?.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {(assigneeProfiles[rfq.assigned_to]?.full_name || 
                                    assigneeProfiles[rfq.assigned_to]?.username || 'U')
                                    .split(' ')
                                    .map((n: string) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm truncate max-w-24">
                                {assigneeProfiles[rfq.assigned_to]?.full_name || 
                                 assigneeProfiles[rfq.assigned_to]?.username || 
                                 'Unknown'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <UserCircle2 className="h-4 w-4" />
                              <span>未分配 Unassigned</span>
                            </div>
                          )}
                        </TableCell>
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
                              <span>不含运费 N/A</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusMap[rfq.status]?.variant || 'secondary'}>
                            {statusMap[rfq.status]?.label || rfq.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(rfq.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/rfq?id=${rfq.inquiry_id}`)}
                          >
                            查看 View
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
