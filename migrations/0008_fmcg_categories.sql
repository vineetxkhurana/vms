-- Migration 0008: Replace medical categories with FMCG categories
-- Removes medicine/medical categories and adds consumer goods categories.

-- Remove old medical-only categories
DELETE FROM categories WHERE name IN (
  'Medicines',
  'Vitamins & Supplements',
  'First Aid',
  'Medical Devices',
  'Ayurvedic',
  'Surgical Instruments',
  'Knee Support',
  'Back & Abdominal Support',
  'Elbow & Arm Support',
  'Wrist & Hand Support',
  'Ankle & Foot Support',
  'Cervical & Neck Support',
  'Shoulder Support',
  'Hot & Cold Therapy',
  'Bandages & Compression',
  'Body Massagers',
  'Weighing Scales',
  'Memory Foam',
  'Mobility Aids'
);

-- Insert new FMCG categories
INSERT OR IGNORE INTO categories (name) VALUES
  ('Soaps'),
  ('Detergent Powder'),
  ('Detergent Liquids'),
  ('Face Wash'),
  ('Ketchup & Sauce'),
  ('Sanitary Napkins'),
  ('Baby Diapers'),
  ('Adult Diapers'),
  ('Skin Care'),
  ('Baby Care');
