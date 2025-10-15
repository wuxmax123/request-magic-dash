import { RFQData, Category, CategoryAttribute, FeatureModuleAttribute } from '@/types/rfq';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ReviewPanelProps {
  rfqData: RFQData;
  categoryPath: string;
  categoryAttributes: CategoryAttribute[];
  featureAttributes: Record<string, FeatureModuleAttribute[]>;
}

export function ReviewPanel({ 
  rfqData, 
  categoryPath, 
  categoryAttributes,
  featureAttributes 
}: ReviewPanelProps) {
  const visibleAttributes = categoryAttributes.filter(attr => attr.visible_on_quote === 1);

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rfqData.product_name && (
            <div>
              <span className="text-sm font-medium">产品名称：</span>
              {(rfqData.customer_links && rfqData.customer_links.length > 0) || (rfqData.source_links && rfqData.source_links.length > 0) ? (
                <a 
                  href={(rfqData.customer_links && rfqData.customer_links.length > 0) ? rfqData.customer_links[0] : (rfqData.source_links && rfqData.source_links.length > 0 ? rfqData.source_links[0] : '#')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm ml-2 text-blue-600 hover:underline"
                >
                  {rfqData.product_name}
                </a>
              ) : (
                <span className="text-sm ml-2">{rfqData.product_name}</span>
              )}
            </div>
          )}

          <div>
            <span className="text-sm font-medium">客户需求（备注）：</span>
            <span className="text-sm ml-2">{rfqData.title || '未填写'}</span>
          </div>
          
          <div>
            <span className="text-sm font-medium">类目：</span>
            <span className="text-sm ml-2">{categoryPath}</span>
          </div>

          {rfqData.customer_links && rfqData.customer_links.length > 0 && (
            <div>
              <span className="text-sm font-medium">产品链接：</span>
              <ul className="mt-1 space-y-1">
                {rfqData.customer_links.map((link, i) => (
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
            </div>
          )}

          {rfqData.source_links && rfqData.source_links.length > 0 && (
            <div>
              <span className="text-sm font-medium">来源链接：</span>
              <ul className="mt-1 space-y-1">
                {rfqData.source_links.map((link, i) => (
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
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium">目的国：</span>
              <div className="text-sm">{rfqData.target_country}</div>
            </div>
            <div>
              <span className="text-sm font-medium">货币：</span>
              <div className="text-sm">{rfqData.currency}</div>
            </div>
          </div>

          {rfqData.feature_modules.length > 0 && (
            <div>
              <span className="text-sm font-medium">功能模块：</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {rfqData.feature_modules.map(code => (
                  <Badge key={code} variant="secondary">{code}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Attributes */}
      {visibleAttributes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>类目属性</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {visibleAttributes.map(attr => {
                const value = rfqData.attributes[attr.attr_code];
                const displayValue = Array.isArray(value) ? value.join(', ') : value;
                
                return (
                  <div key={attr.attr_code}>
                    <span className="text-sm font-medium">{attr.attr_name}：</span>
                    <span className="text-sm ml-2">
                      {displayValue || '-'}
                      {attr.unit && value && ` ${attr.unit}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Module Attributes - Combined */}
      {rfqData.feature_modules.length > 0 && (() => {
        const allFeatureAttrs: Array<{ moduleCode: string; attr: FeatureModuleAttribute; value: any }> = [];
        
        rfqData.feature_modules.forEach(moduleCode => {
          const attrs = featureAttributes[moduleCode]?.filter(a => a.visible_on_quote === 1) || [];
          const moduleData = rfqData.feature_attributes[moduleCode] || {};
          
          attrs.forEach(attr => {
            allFeatureAttrs.push({
              moduleCode,
              attr,
              value: moduleData[attr.attr_code]
            });
          });
        });

        if (allFeatureAttrs.length === 0) return null;

        return (
          <Card>
            <CardHeader>
              <CardTitle>功能模块属性</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {allFeatureAttrs.map(({ moduleCode, attr, value }) => {
                  const displayValue = Array.isArray(value) ? value.join(', ') : value;

                  return (
                    <div key={`${moduleCode}-${attr.attr_code}`}>
                      <span className="text-sm font-medium">
                        {attr.attr_name}
                        <span className="text-xs text-muted-foreground ml-1">({moduleCode})</span>
                        ：
                      </span>
                      <span className="text-sm ml-2">
                        {displayValue || '-'}
                        {attr.unit && value && ` ${attr.unit}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Shipping Information */}
      {rfqData.include_shipping && rfqData.shipping_quotes && rfqData.shipping_quotes.length > 0 && (() => {
        const selectedQuote = rfqData.shipping_quotes.find(q => q.is_selected) || rfqData.shipping_quotes[0];
        
        return (
          <Card>
            <CardHeader>
              <CardTitle>运费信息 Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Origin Warehouse：</span>
                  <span className="text-sm ml-2">{selectedQuote.warehouse?.name_cn}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Shipping Channel：</span>
                  <span className="text-sm ml-2">{selectedQuote.channel?.channel_name_cn}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Product Weight：</span>
                  <span className="text-sm ml-2">{selectedQuote.product_weight_kg} kg</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Destination：</span>
                  <span className="text-sm ml-2">{selectedQuote.destination_country}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Base Freight:</span>
                  <span>${selectedQuote.base_freight?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Fuel Surcharge:</span>
                  <span>${selectedQuote.fuel_surcharge?.toFixed(2)}</span>
                </div>
                {selectedQuote.remote_surcharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Remote Area Surcharge:</span>
                    <span>${selectedQuote.remote_surcharge?.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Shipping Cost:</span>
                  <span className="text-primary">
                    ${selectedQuote.total_freight?.toFixed(2)} {selectedQuote.currency}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium">Estimated Delivery：</span>
                <span className="text-sm ml-2">
                  {selectedQuote.estimated_delivery_days_min}-{selectedQuote.estimated_delivery_days_max} days
                </span>
              </div>

              <div className="text-xs text-muted-foreground">
                Calculated at: {new Date(selectedQuote.calculated_at).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Suppliers */}
      {rfqData.suppliers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>供应商报价汇总</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rfqData.suppliers.map(supplier => (
                <div key={supplier.supplier_id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{supplier.name}</h4>
                      <p className="text-sm text-muted-foreground">{supplier.contact}</p>
                    </div>
                    <Badge variant="outline">{supplier.quotes.length} 个报价</Badge>
                  </div>

                  {supplier.quotes.map((quote, idx) => (
                    <div key={idx} className="mt-3 pt-3 border-t first:mt-0 first:pt-0 first:border-t-0">
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="font-medium">MOQ：</span>
                          {quote.moq}
                        </div>
                        <div>
                          <span className="font-medium">单价：</span>
                          {quote.currency} {quote.unit_price_exw}
                        </div>
                        <div>
                          <span className="font-medium">交期：</span>
                          {quote.lead_time_days}天
                        </div>
                        <div>
                          <span className="font-medium">重量：</span>
                          {quote.weight_kg}kg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {rfqData.notes && (
        <Card>
          <CardHeader>
            <CardTitle>备注</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{rfqData.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
