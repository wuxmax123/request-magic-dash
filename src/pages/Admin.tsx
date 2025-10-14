import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CategoryManager from '@/components/admin/CategoryManager';
import CategoryAttributeManager from '@/components/admin/CategoryAttributeManager';
import FeatureModuleManager from '@/components/admin/FeatureModuleManager';
import { SupplierManager } from '@/components/admin/SupplierManager';
import { DataImporter } from '@/components/admin/DataImporter';
import { Settings, FolderTree, ListChecks, Package, Users, Database } from 'lucide-react';

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              数据导入 Import
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              类目管理 Categories
            </TabsTrigger>
            <TabsTrigger value="attributes" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              类目属性 Attributes
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              功能模块 Features
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              供应商管理 Suppliers
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

          <TabsContent value="suppliers">
            <SupplierManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
