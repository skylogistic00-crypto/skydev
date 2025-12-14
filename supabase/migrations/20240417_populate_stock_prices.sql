-- Populate purchase_price and selling_price for stock items with 0 or NULL values
-- This migration sets reasonable default prices based on item categories

-- Update purchase_price and selling_price for items that have 0 or NULL values
-- Using a 30% markup from purchase to selling price as default

UPDATE stock
SET 
  purchase_price = CASE
    -- Coffee products
    WHEN LOWER(item_name) LIKE '%kopi%' OR LOWER(jenis_barang) LIKE '%kopi%' THEN 15000
    -- Tea products
    WHEN LOWER(item_name) LIKE '%teh%' OR LOWER(jenis_barang) LIKE '%teh%' THEN 12000
    -- Snacks
    WHEN LOWER(item_name) LIKE '%snack%' OR LOWER(jenis_barang) LIKE '%snack%' THEN 8000
    -- Rice products
    WHEN LOWER(item_name) LIKE '%beras%' OR LOWER(jenis_barang) LIKE '%beras%' THEN 50000
    -- Cooking oil
    WHEN LOWER(item_name) LIKE '%minyak%' OR LOWER(jenis_barang) LIKE '%minyak%' THEN 28000
    -- Sugar
    WHEN LOWER(item_name) LIKE '%gula%' OR LOWER(jenis_barang) LIKE '%gula%' THEN 12000
    -- Milk products
    WHEN LOWER(item_name) LIKE '%susu%' OR LOWER(jenis_barang) LIKE '%susu%' THEN 18000
    -- Instant noodles
    WHEN LOWER(item_name) LIKE '%mie%' OR LOWER(jenis_barang) LIKE '%mie%' THEN 2500
    -- Eggs
    WHEN LOWER(item_name) LIKE '%telur%' OR LOWER(jenis_barang) LIKE '%telur%' THEN 25000
    -- Flour
    WHEN LOWER(item_name) LIKE '%tepung%' OR LOWER(jenis_barang) LIKE '%tepung%' THEN 10000
    -- Default for other items
    ELSE 10000
  END,
  selling_price = CASE
    -- Coffee products (30% markup)
    WHEN LOWER(item_name) LIKE '%kopi%' OR LOWER(jenis_barang) LIKE '%kopi%' THEN 19500
    -- Tea products (30% markup)
    WHEN LOWER(item_name) LIKE '%teh%' OR LOWER(jenis_barang) LIKE '%teh%' THEN 15600
    -- Snacks (30% markup)
    WHEN LOWER(item_name) LIKE '%snack%' OR LOWER(jenis_barang) LIKE '%snack%' THEN 10400
    -- Rice products (30% markup)
    WHEN LOWER(item_name) LIKE '%beras%' OR LOWER(jenis_barang) LIKE '%beras%' THEN 65000
    -- Cooking oil (25% markup)
    WHEN LOWER(item_name) LIKE '%minyak%' OR LOWER(jenis_barang) LIKE '%minyak%' THEN 35000
    -- Sugar (30% markup)
    WHEN LOWER(item_name) LIKE '%gula%' OR LOWER(jenis_barang) LIKE '%gula%' THEN 15600
    -- Milk products (30% markup)
    WHEN LOWER(item_name) LIKE '%susu%' OR LOWER(jenis_barang) LIKE '%susu%' THEN 23400
    -- Instant noodles (40% markup)
    WHEN LOWER(item_name) LIKE '%mie%' OR LOWER(jenis_barang) LIKE '%mie%' THEN 3500
    -- Eggs (20% markup)
    WHEN LOWER(item_name) LIKE '%telur%' OR LOWER(jenis_barang) LIKE '%telur%' THEN 30000
    -- Flour (30% markup)
    WHEN LOWER(item_name) LIKE '%tepung%' OR LOWER(jenis_barang) LIKE '%tepung%' THEN 13000
    -- Default for other items (30% markup)
    ELSE 13000
  END,
  updated_at = NOW()
WHERE 
  (purchase_price IS NULL OR purchase_price = 0 OR selling_price IS NULL OR selling_price = 0);

-- Also update cost_per_unit if it exists and is 0
UPDATE stock
SET cost_per_unit = purchase_price
WHERE cost_per_unit IS NULL OR cost_per_unit = 0;
