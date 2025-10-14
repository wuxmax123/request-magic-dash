import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: number;
  name_cn: string;
  name_en: string;
  code: string | null;
  parent_id: number | null;
  level: number;
  path: string | null;
  sort: number;
  children?: Category[];
}

export interface CategoryAttribute {
  id: string;
  category_id: number;
  attr_code: string;
  attr_name: string;
  input_type: string;
  required: number;
  unit: string | null;
  options_json: any;
  help_text: string | null;
  visible_on_quote: number;
  attr_sort: number;
}

export interface FeatureModule {
  feature_code: string;
  feature_name: string;
  feature_name_en: string | null;
  description: string | null;
}

export interface FeatureAttribute {
  id: string;
  feature_code: string;
  attr_code: string;
  attr_name: string;
  input_type: string;
  required: number;
  unit: string | null;
  options_json: any;
  help_text: string | null;
  visible_on_quote: number;
  attr_sort: number;
}

export const categoryService = {
  // Get all L1 categories
  async getL1Categories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('level', 1)
      .order('sort', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Get L2 categories by parent L1 id
  async getL2Categories(parentId: number): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('level', 2)
      .eq('parent_id', parentId)
      .order('sort', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Get L3 categories by parent L2 id
  async getL3Categories(parentId: number): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('level', 3)
      .eq('parent_id', parentId)
      .order('sort', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Get attributes for a specific L3 category
  async getCategoryAttributes(categoryId: number): Promise<CategoryAttribute[]> {
    const { data, error } = await supabase
      .from('category_attributes')
      .select('*')
      .eq('category_id', categoryId)
      .order('attr_sort', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Get all feature modules
  async getFeatureModules(): Promise<FeatureModule[]> {
    const { data, error } = await supabase
      .from('feature_modules')
      .select('*')
      .order('feature_code', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Get available feature modules for a specific L3 category
  async getAvailableFeatureModules(categoryId: number): Promise<FeatureModule[]> {
    const { data, error } = await supabase
      .from('category_feature_binding')
      .select(`
        feature_code,
        feature_modules (
          feature_code,
          feature_name,
          feature_name_en,
          description
        )
      `)
      .eq('category_id', categoryId);
    
    if (error) throw error;
    
    return data?.map(item => (item as any).feature_modules).filter(Boolean) || [];
  },

  // Get attributes for a specific feature module
  async getFeatureAttributes(featureCode: string): Promise<FeatureAttribute[]> {
    const { data, error } = await supabase
      .from('feature_attributes')
      .select('*')
      .eq('feature_code', featureCode)
      .order('attr_sort', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Bulk insert categories
  async bulkInsertCategories(categories: any[]): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .upsert(categories, { onConflict: 'id' });
    
    if (error) throw error;
  },

  // Bulk insert category attributes
  async bulkInsertCategoryAttributes(attributes: any[]): Promise<void> {
    const { error } = await supabase
      .from('category_attributes')
      .insert(attributes);
    
    if (error) throw error;
  },

  // Bulk insert feature modules
  async bulkInsertFeatureModules(modules: any[]): Promise<void> {
    const { error } = await supabase
      .from('feature_modules')
      .upsert(modules, { onConflict: 'feature_code' });
    
    if (error) throw error;
  },

  // Bulk insert feature attributes
  async bulkInsertFeatureAttributes(attributes: any[]): Promise<void> {
    const { error } = await supabase
      .from('feature_attributes')
      .insert(attributes);
    
    if (error) throw error;
  },

  // Bulk insert category-feature bindings
  async bulkInsertCategoryFeatureBindings(bindings: { category_id: number; feature_code: string }[]): Promise<void> {
    const { error } = await supabase
      .from('category_feature_binding')
      .insert(bindings);
    
    if (error) throw error;
  },
};
