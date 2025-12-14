-- Periksa dan perbaiki struktur tabel stock

-- Drop tabel stock jika ada dan buat ulang dengan struktur lengkap
DROP TABLE IF EXISTS stock CASCADE;

CREATE TABLE stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  jenis_barang TEXT,
  location TEXT,
  unit TEXT,
  barcode TEXT UNIQUE,
  supplier_name TEXT,
  nominal_barang INTEGER DEFAULT 0,
  ppn_type TEXT,
  purchase_price DECIMAL(15,2) DEFAULT 0,
  selling_price DECIMAL(15,2) DEFAULT 0,
  coa_account_code TEXT,
  coa_account_name TEXT,
  description TEXT,
  sku TEXT,
  kode_barang TEXT,
  brand TEXT,
  part_number TEXT,
  supplier_id UUID REFERENCES suppliers(id),
  warehouse_id UUID REFERENCES warehouses(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tambahkan ke realtime
ALTER PUBLICATION supabase_realtime ADD TABLE stock;

-- Insert data sample
INSERT INTO stock (
  item_name,
  jenis_barang,
  location, 
  unit, 
  barcode, 
  supplier_name, 
  nominal_barang, 
  ppn_type,
  purchase_price, 
  selling_price,
  coa_account_code,
  coa_account_name,
  description,
  sku,
  kode_barang,
  brand,
  part_number
) VALUES 
  ('Laptop', 'Laptop Dell Latitude 5420', 'Gudang A', 'Unit', 'LPT-DELL-001', 'PT Teknologi Maju', 15000000, 'PPN 11%', 12000000, 15000000, '1-1101', 'Persediaan Elektronik', 'Laptop Dell Latitude 5420 i5 Gen 11', 'SKU-LPT-001', 'BRG-001', 'Dell', 'LAT-5420'),
  ('Monitor', 'Monitor LG 24 Inch', 'Gudang A', 'Unit', 'MON-LG-001', 'PT Teknologi Maju', 2500000, 'PPN 11%', 2000000, 2500000, '1-1101', 'Persediaan Elektronik', 'Monitor LG 24 inch Full HD', 'SKU-MON-001', 'BRG-002', 'LG', '24MK430H'),
  ('Keyboard', 'Keyboard Logitech K380', 'Gudang A', 'Unit', 'KEY-LOG-001', 'PT Teknologi Maju', 450000, 'PPN 11%', 350000, 450000, '1-1101', 'Persediaan Elektronik', 'Keyboard wireless Logitech K380', 'SKU-KEY-001', 'BRG-003', 'Logitech', 'K380'),
  ('Mouse', 'Mouse Logitech M331', 'Gudang A', 'Unit', 'MOU-LOG-001', 'PT Teknologi Maju', 250000, 'PPN 11%', 180000, 250000, '1-1101', 'Persediaan Elektronik', 'Mouse wireless Logitech M331', 'SKU-MOU-001', 'BRG-004', 'Logitech', 'M331'),
  ('Printer', 'Printer HP LaserJet', 'Gudang A', 'Unit', 'PRT-HP-001', 'PT Teknologi Maju', 3500000, 'PPN 11%', 2800000, 3500000, '1-1101', 'Persediaan Elektronik', 'Printer HP LaserJet Pro M404dn', 'SKU-PRT-001', 'BRG-005', 'HP', 'M404DN'),
  ('Meja', 'Meja Kerja Minimalis', 'Gudang B', 'Unit', 'MJK-MIN-001', 'CV Furniture Jaya', 1500000, 'PPN 11%', 1200000, 1500000, '1-1102', 'Persediaan Furniture', 'Meja kerja minimalis 120x60cm', 'SKU-MJK-001', 'BRG-006', 'Olympic', 'MK-120'),
  ('Kursi', 'Kursi Kantor Ergonomis', 'Gudang B', 'Unit', 'KRS-ERG-001', 'CV Furniture Jaya', 1200000, 'PPN 11%', 900000, 1200000, '1-1102', 'Persediaan Furniture', 'Kursi kantor ergonomis', 'SKU-KRS-001', 'BRG-007', 'Ergotec', 'ERG-100'),
  ('Kertas', 'Kertas A4 80gsm', 'Gudang C', 'Rim', 'KRT-A4-001', 'PT Kertas Nusantara', 45000, 'PPN 11%', 35000, 45000, '1-1103', 'Persediaan Alat Tulis', 'Kertas A4 80gsm isi 500 lembar', 'SKU-KRT-001', 'BRG-010', 'Sinar Dunia', 'SD-A4-80'),
  ('Pulpen', 'Pulpen Pilot G2', 'Gudang C', 'Pcs', 'PEN-PIL-001', 'PT Kertas Nusantara', 5000, 'Non PPN', 3500, 5000, '1-1103', 'Persediaan Alat Tulis', 'Pulpen gel Pilot G2 0.7mm', 'SKU-PEN-001', 'BRG-011', 'Pilot', 'G2-07');
