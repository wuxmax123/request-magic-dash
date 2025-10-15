-- Delete the remaining refundable attribute
DELETE FROM category_attributes 
WHERE attr_code = 'printing_fee_refundable';