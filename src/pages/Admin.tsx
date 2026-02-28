import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CategoryManager from '@/components/admin/CategoryManager';
import CategoryAttributeManager from '@/components/admin/CategoryAttributeManager';
import FeatureModuleManager from '@/components/admin/FeatureModuleManager';
import CommercialTermsManager from '@/components/admin/CommercialTermsManager';
import { SupplierManager } from '@/components/admin/SupplierManager';
import { DataImporter } from '@/components/admin/DataImporter';
import { WarehouseManager } from '@/components/admin/WarehouseManager';
import { CarrierChannelManager } from '@/components/admin/CarrierChannelManager';
import { RateMatrixManager } from '@/components/admin/RateMatrixManager';
import { PricingTierManager } from '@/components/admin/PricingTierManager';
import { UserTierAssignment } from '@/components/admin/UserTierAssignment';
import { Settings, FolderTree, ListChecks, Package, Users, Database, Truck, FileText, Percent } from 'lucide-react';

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">系统管理 System Admin</h1>
          </div>
          <p className="text-muted-foreground">
            管理产品类目、属性和功能模块 / Manage product categories, attributes and feature modules
          </p>
        </div>

        <Tabs defaultValue="import" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              数据导入
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              类目管理
            </TabsTrigger>
            <TabsTrigger value="attributes" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              类目属性
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              功能模块
            </TabsTrigger>
            <TabsTrigger value="commercial" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              商务条款
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              供应商
            </TabsTrigger>
            <TabsTrigger value="logistics" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              物流管理
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              加价设置
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import">
            <DataImporter />
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>类目树管理 Category Tree Management</CardTitle>
                <CardDescription>
                  管理三级类目结构（L1 → L2 → L3）/ Manage 3-level category structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attributes">
            <Card>
              <CardHeader>
                <CardTitle>类目属性管理 Category Attribute Management</CardTitle>
                <CardDescription>
                  为每个L3类目配置动态属性 / Configure dynamic attributes for each L3 category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryAttributeManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>功能模块管理 Feature Module Management</CardTitle>
                <CardDescription>
                  管理功能模块及其属性 / Manage feature modules and their attributes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureModuleManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commercial">
            <Card>
              <CardHeader>
                <CardTitle>商务条款管理 Commercial Terms Management</CardTitle>
                <CardDescription>
                  管理通用商务条款属性，如包装、交期、打样费等 / Manage commercial terms like package, lead time, sample fees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CommercialTermsManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers">
            <SupplierManager />
          </TabsContent>

          <TabsContent value="logistics">
            <Tabs defaultValue="warehouses" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="warehouses">仓库 Warehouses</TabsTrigger>
                <TabsTrigger value="carriers">承运商 Carriers & Channels</TabsTrigger>
                <TabsTrigger value="rates">运费矩阵 Rate Matrix</TabsTrigger>
              </TabsList>
              
              <TabsContent value="warehouses">
                <Card>
                  <CardContent className="pt-6">
                    <WarehouseManager />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="carriers">
                <CarrierChannelManager />
              </TabsContent>
              
              <TabsContent value="rates">
                <RateMatrixManager />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="pricing">
            <div className="space-y-6">
              <PricingTierManager />
              <UserTierAssignment />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
