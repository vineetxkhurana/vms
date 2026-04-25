-- Product variant grouping
ALTER TABLE products ADD COLUMN variant_group TEXT;
ALTER TABLE products ADD COLUMN variant_label TEXT;
ALTER TABLE products ADD COLUMN variant_type TEXT; -- 'size' | 'flavor' | 'color'
