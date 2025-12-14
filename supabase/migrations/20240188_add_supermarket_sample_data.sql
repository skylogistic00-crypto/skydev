-- Insert sample supermarket items to stock table
INSERT INTO stock (
  item_name,
  unit,
  supplier_name,
  purchase_price,
  selling_price,
  item_arrival_date,
  item_quantity
) VALUES
('Beras Premium 5kg', 'karung', 'PT Beras Sejahtera', 50000, 65000, CURRENT_DATE, 100),
('Minyak Goreng 2L', 'botol', 'PT Minyak Nusantara', 28000, 35000, CURRENT_DATE, 150),
('Gula Pasir 1kg', 'pack', 'PT Gula Manis', 12000, 15000, CURRENT_DATE, 200),
('Telur Ayam 1kg', 'kg', 'CV Peternakan Jaya', 25000, 32000, CURRENT_DATE, 80),
('Susu UHT 1L', 'kotak', 'PT Susu Segar', 15000, 20000, CURRENT_DATE, 120),
('Tepung Terigu 1kg', 'pack', 'PT Bogasari', 10000, 13000, CURRENT_DATE, 180),
('Kecap Manis 600ml', 'botol', 'PT Unilever Indonesia', 18000, 24000, CURRENT_DATE, 90),
('Sabun Mandi 90gr', 'pcs', 'PT Unilever Indonesia', 3500, 5000, CURRENT_DATE, 250),
('Pasta Gigi 150gr', 'pcs', 'PT Unilever Indonesia', 8000, 12000, CURRENT_DATE, 200),
('Detergen Bubuk 1kg', 'pack', 'PT Unilever Indonesia', 22000, 28000, CURRENT_DATE, 150);