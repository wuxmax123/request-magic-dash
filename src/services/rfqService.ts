import { 
  Category, 
  CategoryAttribute, 
  FeatureModule, 
  FeatureModuleAttribute,
  RFQData,
  Supplier 
} from '@/types/rfq';
import { categoryService } from './categoryService';
import { 
  mockCategories, 
  mockCategoryAttributes, 
  mockFeatureModules, 
  mockFeatureAttributes 
} from '@/data/mockData';

export const rfqService = {
  // Category APIs - now using real database
  async getCategoryTree(): Promise<Category[]> {
    try {
      const l1Categories = await categoryService.getL1Categories();
      const tree: Category[] = [];
      
      const convertCategory = (cat: any): Category => ({
        id: cat.id,
        name_cn: cat.name_cn,
        name_en: cat.name_en,
        code: cat.code || '',
        parent_id: cat.parent_id,
        level: cat.level as 1 | 2 | 3,
        path: cat.path || '',
        sort: cat.sort,
        children: cat.children?.map(convertCategory)
      });
      
      for (const l1 of l1Categories) {
        const l2Categories = await categoryService.getL2Categories(l1.id);
        const l1Children: Category[] = [];
        
        for (const l2 of l2Categories) {
          const l3Categories = await categoryService.getL3Categories(l2.id);
          l1Children.push({
            id: l2.id,
            name_cn: l2.name_cn,
            name_en: l2.name_en,
            code: l2.code || '',
            parent_id: l2.parent_id,
            level: 2,
            path: l2.path || '',
            sort: l2.sort,
            children: l3Categories.map(l3 => ({
              id: l3.id,
              name_cn: l3.name_cn,
              name_en: l3.name_en,
              code: l3.code || '',
              parent_id: l3.parent_id,
              level: 3,
              path: l3.path || '',
              sort: l3.sort,
            }))
          });
        }
        
        tree.push({
          id: l1.id,
          name_cn: l1.name_cn,
          name_en: l1.name_en,
          code: l1.code || '',
          parent_id: l1.parent_id,
          level: 1,
          path: l1.path || '',
          sort: l1.sort,
          children: l1Children
        });
      }
      
      return tree;
    } catch (error) {
      console.error('Failed to load category tree:', error);
      // Fallback to mock data if database is empty
      return mockCategories;
    }
  },

  async getCategoryById(id: number): Promise<Category | null> {
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
    const tree = await this.getCategoryTree();
    return findCategory(tree);
  },

  async getCategoryAttributes(l3Id: number): Promise<CategoryAttribute[]> {
    try {
      const attrs = await categoryService.getCategoryAttributes(l3Id);
      return attrs.map(attr => ({
        ...attr,
        category_id: l3Id,
        input_type: attr.input_type as any,
        options_json: Array.isArray(attr.options_json) ? attr.options_json : []
      })) as CategoryAttribute[];
    } catch (error) {
      console.error('Failed to load category attributes:', error);
      return mockCategoryAttributes[l3Id] || [];
    }
  },

  // Feature Module APIs - now using real database
  async getFeatureModules(): Promise<FeatureModule[]> {
    try {
      const modules = await categoryService.getFeatureModules();
      return modules.map(m => ({
        feature_code: m.feature_code,
        feature_name: m.feature_name,
        feature_name_en: m.feature_name_en || '',
        description: m.description
      }));
    } catch (error) {
      console.error('Failed to load feature modules:', error);
      return mockFeatureModules;
    }
  },

  async getAvailableFeatureModules(l3Id: number): Promise<FeatureModule[]> {
    try {
      const modules = await categoryService.getAvailableFeatureModules(l3Id);
      if (modules.length === 0) {
        // If no bindings exist, return all modules
        return await this.getFeatureModules();
      }
      return modules.map(m => ({
        feature_code: m.feature_code,
        feature_name: m.feature_name,
        feature_name_en: m.feature_name_en || '',
        description: m.description
      }));
    } catch (error) {
      console.error('Failed to load available feature modules:', error);
      return mockFeatureModules;
    }
  },

  async getFeatureAttributes(featureCode: string): Promise<FeatureModuleAttribute[]> {
    try {
      const attrs = await categoryService.getFeatureAttributes(featureCode);
      const module = await categoryService.getFeatureModules();
      const featureModule = module.find(m => m.feature_code === featureCode);
      
      return attrs.map(attr => ({
        feature_code: featureCode,
        feature_name: featureModule?.feature_name || '',
        attr_code: attr.attr_code,
        attr_name: attr.attr_name,
        input_type: attr.input_type as any,
        required: attr.required,
        unit: attr.unit || '',
        options_json: Array.isArray(attr.options_json) ? attr.options_json : [],
        help_text: attr.help_text || '',
        visible_on_quote: attr.visible_on_quote,
        attr_sort: attr.attr_sort
      })) as FeatureModuleAttribute[];
    } catch (error) {
      console.error('Failed to load feature attributes:', error);
      return mockFeatureAttributes[featureCode] || [];
    }
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
        product_name: data.product_name,
        reference_number: data.reference_number,
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
        default_warehouse_id: data.default_warehouse_id,
        include_shipping: data.include_shipping || false,
      })
      .select()
      .single();

    if (error) throw error;

    // Calculate and save shipping quotes if enabled
    if (data.include_shipping && data.target_weight_kg && data.target_country && data.default_warehouse_id) {
      const { calculateMultipleQuotes, deleteShippingQuotesForRFQ, saveShippingQuote, updateShippingQuoteSelection } = await import('@/services/shippingService');
      
      // Delete existing quotes
      await deleteShippingQuotesForRFQ(rfq.id);
      
      // Calculate new quotes
      const quotes = await calculateMultipleQuotes(
        data.target_weight_kg,
        data.default_warehouse_id,
        data.target_country
      );
      
      // Save all calculated quotes
      for (const quote of quotes) {
        await saveShippingQuote(rfq.id, {
          warehouse_id: data.default_warehouse_id,
          channel_id: quote.channel_id,
          destination_country: data.target_country,
          product_weight_kg: data.target_weight_kg,
          base_freight: quote.base_freight,
          fuel_surcharge: quote.fuel_surcharge,
          remote_surcharge: quote.remote_surcharge,
          total_freight: quote.total_freight,
          currency: quote.currency,
          estimated_delivery_days_min: quote.estimated_delivery_days_min,
          estimated_delivery_days_max: quote.estimated_delivery_days_max,
          calculation_details: quote.breakdown,
          is_selected: false,
          is_manual: false,
          calculated_at: new Date().toISOString(),
        });
      }
      
      // Auto-select cheapest option
      if (quotes.length > 0) {
        const cheapest = quotes.reduce((min, q) => 
          q.total_freight < min.total_freight ? q : min
        );
        const savedQuotes = await import('@/services/shippingService').then(m => m.getShippingQuotesForRFQ(rfq.id));
        const cheapestSaved = savedQuotes.find(q => q.channel_id === cheapest.channel_id);
        if (cheapestSaved) {
          await updateShippingQuoteSelection(rfq.id, cheapestSaved.id);
        }
      }
    }

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

    // Fetch shipping quotes if included
    let shipping_quotes: any[] = [];
    if (data.include_shipping) {
      const { getShippingQuotesForRFQ } = await import('@/services/shippingService');
      shipping_quotes = await getShippingQuotesForRFQ(data.id);
    }

    return {
      inquiry_id: data.inquiry_id,
      product_name: data.product_name,
      reference_number: data.reference_number,
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
      default_warehouse_id: data.default_warehouse_id,
      include_shipping: data.include_shipping,
      shipping_quotes,
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
      product_name: rfq.product_name,
      reference_number: rfq.reference_number,
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
    return { ok: true, id: Math.floor(Math.random() * 10000) };
  },

  async updateCategory(id: number, category: Partial<Category>): Promise<{ ok: boolean }> {
    return { ok: true };
  },

  async deleteCategory(id: number): Promise<{ ok: boolean }> {
    return { ok: true };
  },

  // Admin - Attribute Management
  async createCategoryAttribute(attr: CategoryAttribute): Promise<{ ok: boolean }> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('category_attributes')
      .insert({
        category_id: attr.category_id,
        attr_code: attr.attr_code,
        attr_name: attr.attr_name,
        input_type: attr.input_type,
        required: attr.required,
        unit: attr.unit || null,
        help_text: attr.help_text || null,
        options_json: attr.options_json || [],
        visible_on_quote: attr.visible_on_quote,
        attr_sort: attr.attr_sort,
      });

    if (error) throw error;
    return { ok: true };
  },

  async updateCategoryAttribute(categoryId: number, attrCode: string, attr: Partial<CategoryAttribute>): Promise<{ ok: boolean }> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('category_attributes')
      .update({
        attr_name: attr.attr_name,
        input_type: attr.input_type,
        required: attr.required,
        unit: attr.unit || null,
        help_text: attr.help_text || null,
        options_json: attr.options_json || [],
        visible_on_quote: attr.visible_on_quote,
        attr_sort: attr.attr_sort,
      })
      .eq('category_id', categoryId)
      .eq('attr_code', attrCode);

    if (error) throw error;
    return { ok: true };
  },

  async deleteCategoryAttribute(categoryId: number, attrCode: string): Promise<{ ok: boolean }> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('category_attributes')
      .delete()
      .eq('category_id', categoryId)
      .eq('attr_code', attrCode);

    if (error) throw error;
    return { ok: true };
  },

  // Delete RFQs
  async deleteRFQs(inquiryIds: string[]): Promise<{ ok: boolean }> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('rfqs')
      .delete()
      .in('inquiry_id', inquiryIds);

    if (error) throw error;

    return { ok: true };
  },
};
