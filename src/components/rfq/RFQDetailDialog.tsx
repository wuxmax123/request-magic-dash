import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReviewPanel } from './ReviewPanel';
import { rfqService } from '@/services/rfqService';
import { RFQData, CategoryAttribute, FeatureModuleAttribute } from '@/types/rfq';
import { toast } from 'sonner';

interface RFQDetailDialogProps {
  inquiryId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RFQDetailDialog({ inquiryId, open, onOpenChange }: RFQDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [rfqData, setRfqData] = useState<RFQData | null>(null);
  const [categoryPath, setCategoryPath] = useState('');
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([]);
  const [featureAttributes, setFeatureAttributes] = useState<Record<string, FeatureModuleAttribute[]>>({});

  useEffect(() => {
    if (open && inquiryId) {
      loadRFQData();
    }
  }, [open, inquiryId]);

  const loadRFQData = async () => {
    try {
      setLoading(true);
      const data = await rfqService.getRFQById(inquiryId);
      if (!data) {
        toast.error('未找到询价单');
        onOpenChange(false);
        return;
      }

      setRfqData(data);

      // Load category path
      if (data.category_l3) {
        const [l1Cat, l2Cat, l3Cat] = await Promise.all([
          rfqService.getCategoryById(data.category_l1),
          rfqService.getCategoryById(data.category_l2),
          rfqService.getCategoryById(data.category_l3),
        ]);
        const path = [l1Cat?.name_cn, l2Cat?.name_cn, l3Cat?.name_cn].filter(Boolean).join(' > ');
        setCategoryPath(path);

        // Load category attributes
        const attrs = await rfqService.getCategoryAttributes(data.category_l3);
        setCategoryAttributes(attrs);
      }

      // Load feature attributes
      if (data.feature_modules.length > 0) {
        const featureAttrs: Record<string, FeatureModuleAttribute[]> = {};
        for (const moduleCode of data.feature_modules) {
          const attrs = await rfqService.getFeatureAttributes(moduleCode);
          featureAttrs[moduleCode] = attrs;
        }
        setFeatureAttributes(featureAttrs);
      }
    } catch (error) {
      console.error('Failed to load RFQ data:', error);
      toast.error('加载询价单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>询价单详情 - {inquiryId}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">加载中...</p>
            </div>
          </div>
        ) : rfqData ? (
          <ReviewPanel
            rfqData={rfqData}
            categoryPath={categoryPath}
            categoryAttributes={categoryAttributes}
            featureAttributes={featureAttributes}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            未找到数据
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
