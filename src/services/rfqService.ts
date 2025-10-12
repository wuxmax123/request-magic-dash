import { 
  Category, 
  CategoryAttribute, 
  FeatureModule, 
  FeatureModuleAttribute,
  RFQData,
  Supplier 
} from '@/types/rfq';
import { 
  mockCategories, 
  mockCategoryAttributes, 
  mockFeatureModules, 
  mockFeatureAttributes 
} from '@/data/mockData';

// Mock delay to simulate API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const rfqService = {
  // Category APIs
  async getCategoryTree(): Promise<Category[]> {
    await delay(300);
    return mockCategories;
  },

  async getCategoryById(id: number): Promise<Category | null> {
    await delay(100);
    const findCategory = (categories: Category[]): Category | null => {
      for (const cat of categories) {
        if (cat.id === id) return cat;
        if (cat.children) {
          const found = findCategory(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findCategory(mockCategories);
  },

  async getCategoryAttributes(l3Id: number): Promise<CategoryAttribute[]> {
    await delay(200);
    return mockCategoryAttributes[l3Id] || [];
  },

  // Feature Module APIs
  async getFeatureModules(): Promise<FeatureModule[]> {
    await delay(200);
    return mockFeatureModules;
  },

  async getFeatureAttributes(featureCode: string): Promise<FeatureModuleAttribute[]> {
    await delay(200);
    return mockFeatureAttributes[featureCode] || [];
  },

  // RFQ APIs
  async saveRFQ(data: RFQData): Promise<{ ok: boolean; id: string }> {
    await delay(500);
    const id = data.inquiry_id || `RFQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    console.log('Saving RFQ:', { id, data });
    return { ok: true, id };
  },

  async getRFQById(id: string): Promise<RFQData | null> {
    await delay(300);
    // Mock empty RFQ
    return null;
  },

  // Supplier APIs
  async listSuppliers(): Promise<Supplier[]> {
    await delay(300);
    return [
      {
        supplier_id: 1,
        name: 'ABC Factory',
        province: '广东省',
        city: '深圳市',
        address: '宝安区西乡街道',
        contact: 'John Zhang',
        phone: '+86 138 0000 0001',
        wechat: 'abc_factory',
        email: 'john@abcfactory.com',
        link_1688: 'https://abc.1688.com',
        rating_1688: 4.5,
        tags: ['Apparel', 'OEM'],
        rating: 4.5,
        quotes: [],
      },
      {
        supplier_id: 2,
        name: 'XYZ Manufacturing',
        province: '浙江省',
        city: '义乌市',
        address: '国际商贸城',
        contact: 'Lisa Wang',
        phone: '+86 138 0000 0002',
        wechat: 'xyz_mfg',
        email: 'lisa@xyzmfg.com',
        link_1688: 'https://xyz.1688.com',
        rating_1688: 4.8,
        tags: ['Electronics', 'ODM'],
        rating: 4.8,
        quotes: [],
      },
      {
        supplier_id: 3,
        name: 'Global Sourcing Co.',
        province: '江苏省',
        city: '苏州市',
        address: '工业园区',
        contact: 'Mike Chen',
        phone: '+86 138 0000 0003',
        wechat: 'global_source',
        email: 'mike@globalsourcing.com',
        link_1688: 'https://global.1688.com',
        rating_1688: 4.2,
        tags: ['Bags', 'Trading'],
        rating: 4.2,
        quotes: [],
      },
    ];
  },

  // Admin - Category Management
  async createCategory(category: Omit<Category, 'id'>): Promise<{ ok: boolean; id: number }> {
    await delay(400);
    return { ok: true, id: Math.floor(Math.random() * 10000) };
  },

  async updateCategory(id: number, category: Partial<Category>): Promise<{ ok: boolean }> {
    await delay(400);
    return { ok: true };
  },

  async deleteCategory(id: number): Promise<{ ok: boolean }> {
    await delay(400);
    return { ok: true };
  },

  // Admin - Attribute Management
  async createCategoryAttribute(attr: CategoryAttribute): Promise<{ ok: boolean }> {
    await delay(400);
    return { ok: true };
  },

  async updateCategoryAttribute(categoryId: number, attrCode: string, attr: Partial<CategoryAttribute>): Promise<{ ok: boolean }> {
    await delay(400);
    return { ok: true };
  },

  async deleteCategoryAttribute(categoryId: number, attrCode: string): Promise<{ ok: boolean }> {
    await delay(400);
    return { ok: true };
  },
};
