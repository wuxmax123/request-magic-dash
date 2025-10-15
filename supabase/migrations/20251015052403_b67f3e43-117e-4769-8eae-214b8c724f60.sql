-- Delete commercial-related attributes from category_attributes
-- These have been moved to the commercial_terms table
DELETE FROM category_attributes 
WHERE attr_code IN (
  'package_type',
  'lead_time', 
  'lead_time_days',
  'printing_fee',
  'plate_fee',
  'printing_plate_fee',
  'sample_fee',
  'sample_fee_refundable',
  'plate_fee_refundable'
);