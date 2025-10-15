import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReviewPanel } from './ReviewPanel';
import { ShippingQuoteSelector } from './ShippingQuoteSelector';
import { rfqService } from '@/services/rfqService';
import { getShippingQuotesForRFQ } from '@/services/shippingService';
import { RFQData, CategoryAttribute, FeatureModuleAttribute } from '@/types/rfq';
import { RFQShippingQuote } from '@/types/shipping';
import { toast } from 'sonner';
import { Package } from 'lucide-react';

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
  const [shippingQuotes, setShippingQuotes] = useState<RFQShippingQuote[]>([]);

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

      // Load shipping quotes if shipping is included
      if (data.include_shipping && data.inquiry_id) {
        const quotes = await getShippingQuotesForRFQ(data.inquiry_id);
        setShippingQuotes(quotes);
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
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">询价详情</TabsTrigger>
              {rfqData.include_shipping && (
                <TabsTrigger value="shipping">
                  <Package className="h-4 w-4 mr-2" />
                  运费方案
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="details" className="mt-4">
              <ReviewPanel
                rfqData={rfqData}
                categoryPath={categoryPath}
                categoryAttributes={categoryAttributes}
                featureAttributes={featureAttributes}
              />
            </TabsContent>
            
            {rfqData.include_shipping && rfqData.inquiry_id && (
              <TabsContent value="shipping" className="mt-4">
                <ShippingQuoteSelector
                  rfqId={rfqData.inquiry_id}
                  quotes={shippingQuotes}
                  onQuoteSelected={() => loadRFQData()}
                />
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            未找到数据
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
