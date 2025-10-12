// Category Types
export interface Category {
  id: number;
  name_cn: string;
  name_en: string;
  code: string;
  parent_id: number | null;
  level: 1 | 2 | 3;
  path: string;
  sort: number;
  children?: Category[];
}

// Attribute Types
export type InputType = 'text' | 'number' | 'select' | 'multiselect' | 'bool' | 'file' | 'textarea';

export interface AttributeDefinition {
  attr_code: string;
  attr_name: string;
  input_type: InputType;
  required: 0 | 1;
  unit: string;
  options_json: string[];
  help_text: string;
  visible_on_quote: 0 | 1;
  attr_sort: number;
}

export interface CategoryAttribute extends AttributeDefinition {
  category_id: number;
}

export interface FeatureModuleAttribute extends AttributeDefinition {
  feature_code: string;
  feature_name: string;
}

export interface FeatureModule {
  feature_code: string;
  feature_name: string;
  feature_name_en: string;
  description?: string;
}

// Quote Types
export interface SupplierQuote {
  quote_id?: string;
  currency: string;
  moq: number;
  unit_price_exw: number;
  tax_included: 0 | 1;
  lead_time_days: number;
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  inner_pack: string;
  outer_pack: string;
  carton_qty: number;
  incoterm_supplier: string;
  valid_until: string;
  remarks: string;
  attachments: string[];
}

export interface Supplier {
  supplier_id: number;
  name: string;
  contact: string;
  phone: string;
  wechat: string;
  email: string;
  tags: string[];
  rating: number;
  quotes: SupplierQuote[];
}

// RFQ Types
export interface RFQData {
  inquiry_id?: string;
  title: string;
  source_links: string[];
  customer_links: string[];
  target_country: string;
  target_city: string;
  incoterm: string;
  currency: string;
  target_weight_kg?: number;
  target_price?: number;
  category_l1: number | null;
  category_l2: number | null;
  category_l3: number | null;
  feature_modules: string[];
  attributes: Record<string, any>;
  feature_attributes: Record<string, Record<string, any>>;
  suppliers: Supplier[];
  images: string[];
  attachments: string[];
  notes: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  tab?: number;
}
