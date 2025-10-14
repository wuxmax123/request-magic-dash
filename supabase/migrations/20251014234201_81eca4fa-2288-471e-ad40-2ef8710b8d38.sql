-- 更新所有衣服尺寸属性，添加常见尺码选项
UPDATE category_attributes
SET 
  input_type = 'select',
  options_json = '["XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "Free Size", "均码"]'::jsonb,
  updated_at = now()
WHERE attr_code = 'size';