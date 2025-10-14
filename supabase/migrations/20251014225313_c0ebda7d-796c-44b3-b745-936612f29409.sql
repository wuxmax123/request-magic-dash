-- Create categories table (L1, L2, L3 hierarchy)
CREATE TABLE IF NOT EXISTS public.categories (
  id INTEGER PRIMARY KEY,
  name_cn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  code TEXT,
  parent_id INTEGER,
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  path TEXT,
  sort INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create category_attributes table (attributes for each L3 category)
CREATE TABLE IF NOT EXISTS public.category_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id INTEGER NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  attr_code TEXT NOT NULL,
  attr_name TEXT NOT NULL,
  input_type TEXT NOT NULL CHECK (input_type IN ('text', 'number', 'select', 'multiselect', 'bool', 'file', 'textarea')),
  required INTEGER DEFAULT 0 CHECK (required IN (0, 1)),
  unit TEXT,
  options_json JSONB DEFAULT '[]',
  help_text TEXT,
  visible_on_quote INTEGER DEFAULT 1 CHECK (visible_on_quote IN (0, 1)),
  attr_sort INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, attr_code)
);

-- Create feature_modules table (功能模块定义)
CREATE TABLE IF NOT EXISTS public.feature_modules (
  feature_code TEXT PRIMARY KEY,
  feature_name TEXT NOT NULL,
  feature_name_en TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create feature_attributes table (功能模块的属性)
CREATE TABLE IF NOT EXISTS public.feature_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_code TEXT NOT NULL REFERENCES public.feature_modules(feature_code) ON DELETE CASCADE,
  attr_code TEXT NOT NULL,
  attr_name TEXT NOT NULL,
  input_type TEXT NOT NULL CHECK (input_type IN ('text', 'number', 'select', 'multiselect', 'bool', 'file', 'textarea')),
  required INTEGER DEFAULT 0 CHECK (required IN (0, 1)),
  unit TEXT,
  options_json JSONB DEFAULT '[]',
  help_text TEXT,
  visible_on_quote INTEGER DEFAULT 1 CHECK (visible_on_quote IN (0, 1)),
  attr_sort INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(feature_code, attr_code)
);

-- Create category_feature_binding table (类目与功能模块的绑定关系)
CREATE TABLE IF NOT EXISTS public.category_feature_binding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id INTEGER NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  feature_code TEXT NOT NULL REFERENCES public.feature_modules(feature_code) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, feature_code)
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_feature_binding ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users to read configuration data
CREATE POLICY "Allow authenticated users to read categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read category_attributes"
  ON public.category_attributes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read feature_modules"
  ON public.feature_modules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read feature_attributes"
  ON public.feature_attributes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read category_feature_binding"
  ON public.category_feature_binding FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies - Allow authenticated users to manage (for admin pages)
CREATE POLICY "Allow authenticated users to insert categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert category_attributes"
  ON public.category_attributes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update category_attributes"
  ON public.category_attributes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete category_attributes"
  ON public.category_attributes FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert feature_modules"
  ON public.feature_modules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update feature_modules"
  ON public.feature_modules FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete feature_modules"
  ON public.feature_modules FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert feature_attributes"
  ON public.feature_attributes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update feature_attributes"
  ON public.feature_attributes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete feature_attributes"
  ON public.feature_attributes FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert category_feature_binding"
  ON public.category_feature_binding FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete category_feature_binding"
  ON public.category_feature_binding FOR DELETE
  TO authenticated
  USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_category_attributes_updated_at
  BEFORE UPDATE ON public.category_attributes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_modules_updated_at
  BEFORE UPDATE ON public.feature_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_attributes_updated_at
  BEFORE UPDATE ON public.feature_attributes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();