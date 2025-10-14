-- 1. 更新尺寸为多选
UPDATE category_attributes
SET 
  input_type = 'multiselect',
  updated_at = now()
WHERE attr_code = 'size';

-- 2. 更新所有材质属性为单选下拉框，添加常见材质选项
UPDATE category_attributes
SET 
  input_type = 'select',
  options_json = '["棉 Cotton", "涤纶 Polyester", "尼龙 Nylon", "羊毛 Wool", "真丝 Silk", "亚麻 Linen", "氨纶 Spandex", "人造丝 Rayon", "混纺 Blended", "牛仔布 Denim", "针织 Knit", "梭织 Woven", "皮革 Leather", "绒面 Suede", "帆布 Canvas", "其他 Other"]'::jsonb,
  updated_at = now()
WHERE attr_code = 'material';