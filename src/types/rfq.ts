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

export interface CommercialTerm extends AttributeDefinition {
  id?: string;
  has_refundable_checkbox?: boolean;
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
  commercial_terms: Record<string, any>;
  supplier_attributes?: Record<string, any>; // Auto-inherited from RFQ attributes
  supplier_diff_json?: Record<string, any>; // Only stores differences from customer spec
}

export interface Supplier {
  supplier_id: number;
  name: string;
  province: string;
  city: string;
  address: string;
  contact: string;
  phone: string;
  wechat: string;
  email: string;
  link_1688: string;
  rating_1688: number;
  tags: string[];
  rating: number;
  quotes: SupplierQuote[];
}

// RFQ Types
export type RFQSource = 'customer_portal' | 'internal';
export type RFQStatus = 'pending' | 'draft' | 'in_progress' | 'quoted' | 'closed' | 'submitted' | 'approved' | 'rejected';
export type RFQPriority = 'P1' | 'P2' | 'P3';

export interface ActivityLogEntry {
  at: string;
  by: string;
  action: 'assign' | 'unassign' | 'reassign';
  to?: string;
  note?: string;
}

export interface RFQData {
  id?: string;
  inquiry_id?: string;
  product_name?: string;
  reference_number?: string;
  title: string;
  source_links: string[];
  customer_links: string[];
  target_country: string;
  target_countries?: string[];
  currency: string;
  target_weight_kg?: number;
  target_price?: number;
  category_l1: number | null;
  category_l2: number | null;
  category_l3: number | null;
  feature_modules: string[];
  attributes: Record<string, any>;
  feature_attributes: Record<string, Record<string, any>>;
  commercial_terms: Record<string, any>;
  suppliers: Supplier[];
  images: string[];
  attachments: string[];
  notes: string;
  status: RFQStatus;
  source?: RFQSource;
  created_by?: string;
  assigned_to?: string;
  assigned_by?: string;
  assigned_at?: string;
  auto_assignable?: boolean;
  priority?: RFQPriority;
  activity_log?: ActivityLogEntry[];
  quote_id?: string;
  created_at?: string;
  updated_at?: string;
  default_warehouse_id?: string;
  include_shipping?: boolean;
  shipping_quotes?: any[];
  basic_info?: {
    productLink?: string;
    productName?: string;
    targetPrice?: number;
    quantity?: number;
    notes?: string;
    referencePicUrls?: string[];
  };
}

export interface ValidationError {
  field: string;
  message: string;
  tab?: number;
}
