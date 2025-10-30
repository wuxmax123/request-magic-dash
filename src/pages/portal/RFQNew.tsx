import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { rfqService } from '@/services/rfqService';
import { ArrowLeft, Upload, Send } from 'lucide-react';

export default function RFQNew() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    productLink: '',
    productName: '',
    targetPrice: '',
    quantity: '',
    notes: '',
  });
  const [images, setImages] = useState<string[]>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // In a real app, upload to storage and get URLs
    // For now, just create object URLs
    const urls = Array.from(files).map(file => URL.createObjectURL(file));
    setImages([...images, ...urls]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productName) {
      toast({
        title: '请填写产品名称 Product Name Required',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await rfqService.createPublicRFQ({
        basic_info: {
          productLink: formData.productLink,
          productName: formData.productName,
          targetPrice: formData.targetPrice ? parseFloat(formData.targetPrice) : undefined,
          quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
          notes: formData.notes,
          referencePicUrls: images,
        }
      });

      toast({
        title: '提交成功 Submitted Successfully',
        description: `RFQ编号 RFQ No: ${result.rfqNo}`,
      });

      // Redirect to view page
      navigate(`/portal/rfq/${result.id}`);
    } catch (error) {
      console.error('Failed to submit RFQ:', error);
      toast({
        title: '提交失败 Submission Failed',
        description: '请稍后重试 Please try again later',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">新建询价 New RFQ</h1>
            <p className="text-muted-foreground">提交您的产品需求 Submit your product requirements</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>产品信息 Product Information</CardTitle>
            <CardDescription>
              请填写基本信息，我们将在24小时内响应
              <br />
              Please fill in basic information, we will respond within 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="productName">
                  产品名称 Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="productName"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="例如：蓝牙耳机 e.g., Bluetooth Earphones"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productLink">
                  参考链接 Reference Link
                </Label>
                <Input
                  id="productLink"
                  value={formData.productLink}
                  onChange={(e) => setFormData({ ...formData, productLink: e.target.value })}
                  placeholder="https://..."
                  type="url"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetPrice">
                    目标价格 Target Price (USD)
                  </Label>
                  <Input
                    id="targetPrice"
                    value={formData.targetPrice}
                    onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    数量 Quantity (pcs)
                  </Label>
                  <Input
                    id="quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="1000"
                    type="number"
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">
                  备注说明 Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="请描述您的具体需求... Describe your specific requirements..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="images">
                  参考图片 Reference Images
                </Label>
                <div className="flex flex-col gap-4">
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                  {images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {images.map((url, idx) => (
                        <div key={idx} className="relative aspect-square">
                          <img
                            src={url}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  取消 Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? '提交中... Submitting...' : '提交询价 Submit RFQ'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
