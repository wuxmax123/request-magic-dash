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
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    const inquiry_id = data.inquiry_id || `RFQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    
    const { data: rfq, error } = await supabase
      .from('rfqs')
      .upsert({
        user_id: user.id,
        inquiry_id,
        title: data.title,
        source_links: data.source_links,
        customer_links: data.customer_links,
        target_country: data.target_country,
        currency: data.currency,
        target_weight_kg: data.target_weight_kg,
        target_price: data.target_price,
        category_l1: data.category_l1,
        category_l2: data.category_l2,
        category_l3: data.category_l3,
        feature_modules: data.feature_modules,
        attributes: data.attributes,
        feature_attributes: data.feature_attributes,
        images: data.images,
        attachments: data.attachments,
        notes: data.notes,
        status: data.status,
      })
      .select()
      .single();

    if (error) throw error;

    // Save suppliers
    if (data.suppliers && data.suppliers.length > 0) {
      const supplierRecords = data.suppliers.map(s => ({
        rfq_id: rfq.id,
        supplier_id: s.supplier_id,
        name: s.name,
        province: s.province || '',
        city: s.city || '',
        address: s.address || '',
        contact: s.contact || '',
        phone: s.phone || '',
        wechat: s.wechat || '',
        email: s.email || '',
        link_1688: s.link_1688 || '',
        rating_1688: s.rating_1688 || 0,
        tags: s.tags || [],
        rating: s.rating || 0,
        quotes: s.quotes as any,
      }));

      await supabase.from('suppliers').upsert(supplierRecords);
    }

    return { ok: true, id: inquiry_id };
  },

  async getRFQById(id: string): Promise<RFQData | null> {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from('rfqs')
      .select('*, suppliers(*)')
      .eq('inquiry_id', id)
      .single();

    if (error || !data) return null;

    return {
      inquiry_id: data.inquiry_id,
      title: data.title,
      source_links: data.source_links || [],
      customer_links: data.customer_links || [],
      target_country: data.target_country,
      currency: data.currency,
      target_weight_kg: data.target_weight_kg || undefined,
      target_price: data.target_price || undefined,
      category_l1: data.category_l1,
      category_l2: data.category_l2,
      category_l3: data.category_l3,
      feature_modules: data.feature_modules || [],
      attributes: (data.attributes as any) || {},
      feature_attributes: (data.feature_attributes as any) || {},
      suppliers: (data.suppliers || []).map((s: any) => ({
        supplier_id: s.supplier_id,
        name: s.name,
        province: s.province || '',
        city: s.city || '',
        address: s.address || '',
        contact: s.contact || '',
        phone: s.phone || '',
        wechat: s.wechat || '',
        email: s.email || '',
        link_1688: s.link_1688 || '',
        rating_1688: s.rating_1688 || 0,
        tags: s.tags || [],
        rating: s.rating || 0,
        quotes: s.quotes || [],
      })),
      images: data.images || [],
      attachments: data.attachments || [],
      notes: data.notes || '',
      status: data.status as 'draft' | 'submitted' | 'approved' | 'rejected',
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  async listRFQs(): Promise<RFQData[]> {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from('rfqs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(rfq => ({
      inquiry_id: rfq.inquiry_id,
      title: rfq.title,
      source_links: rfq.source_links || [],
      customer_links: rfq.customer_links || [],
      target_country: rfq.target_country,
      currency: rfq.currency,
      target_weight_kg: rfq.target_weight_kg || undefined,
      target_price: rfq.target_price || undefined,
      category_l1: rfq.category_l1,
      category_l2: rfq.category_l2,
      category_l3: rfq.category_l3,
      feature_modules: rfq.feature_modules || [],
      attributes: (rfq.attributes as any) || {},
      feature_attributes: (rfq.feature_attributes as any) || {},
      suppliers: [],
      images: rfq.images || [],
      attachments: rfq.attachments || [],
      notes: rfq.notes || '',
      status: rfq.status as 'draft' | 'submitted' | 'approved' | 'rejected',
      created_at: rfq.created_at,
      updated_at: rfq.updated_at,
    }));
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
