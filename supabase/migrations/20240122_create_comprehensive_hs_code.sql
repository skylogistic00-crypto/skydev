DROP TABLE IF EXISTS hs_codes CASCADE;

CREATE TABLE IF NOT EXISTS hs_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hs_code VARCHAR(10) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(100),
  sub_category VARCHAR(100),
  unit VARCHAR(50),
  import_duty_rate DECIMAL(5,2),
  export_duty_rate DECIMAL(5,2),
  vat_rate DECIMAL(5,2),
  pph_rate DECIMAL(5,2),
  import_restriction TEXT,
  export_restriction TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hs_codes_code ON hs_codes(hs_code);
CREATE INDEX idx_hs_codes_category ON hs_codes(category);
CREATE INDEX idx_hs_codes_sub_category ON hs_codes(sub_category);
CREATE INDEX idx_hs_codes_active ON hs_codes(is_active);

CREATE OR REPLACE FUNCTION update_hs_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hs_codes_updated_at
  BEFORE UPDATE ON hs_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_hs_codes_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE hs_codes;

INSERT INTO hs_codes (hs_code, description, category, sub_category, unit, import_duty_rate, export_duty_rate, vat_rate, pph_rate, notes) VALUES
('0101.21.00', 'Kuda murni untuk pembiakan', 'Live Animals', 'Horses', 'Unit', 0.00, 0.00, 11.00, 2.50, 'Hewan hidup'),
('0102.21.00', 'Sapi murni untuk pembiakan', 'Live Animals', 'Cattle', 'Unit', 0.00, 0.00, 11.00, 2.50, 'Hewan ternak'),
('0201.10.00', 'Daging sapi, segar atau dingin, karkas dan setengah karkas', 'Meat Products', 'Beef', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Daging sapi'),
('0203.12.00', 'Daging babi, segar atau dingin, ham, shoulder dan potongannya', 'Meat Products', 'Pork', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Daging babi'),
('0301.11.00', 'Ikan hias air tawar, hidup', 'Fish & Seafood', 'Ornamental Fish', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Ikan hias'),
('0302.31.00', 'Tuna albacore, segar atau dingin', 'Fish & Seafood', 'Tuna', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Ikan tuna'),
('0303.14.00', 'Ikan tuna sirip biru, beku', 'Fish & Seafood', 'Tuna', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Ikan tuna beku'),
('0306.16.00', 'Udang air dingin, beku', 'Fish & Seafood', 'Shrimp', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Udang beku'),
('0401.10.00', 'Susu dan krim, tidak dipekatkan, tidak mengandung tambahan gula', 'Dairy Products', 'Milk', 'Liter', 5.00, 0.00, 11.00, 2.50, 'Susu segar'),
('0402.10.00', 'Susu dan krim dalam bentuk bubuk, tidak mengandung tambahan gula', 'Dairy Products', 'Milk Powder', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Susu bubuk'),
('0406.10.00', 'Keju segar (tidak matang atau tidak diawetkan)', 'Dairy Products', 'Cheese', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Keju'),
('0701.90.00', 'Kentang, segar atau dingin', 'Vegetables', 'Potatoes', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Kentang'),
('0702.00.00', 'Tomat, segar atau dingin', 'Vegetables', 'Tomatoes', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Tomat'),
('0703.10.00', 'Bawang bombay dan bawang merah, segar atau dingin', 'Vegetables', 'Onions', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Bawang'),
('0704.10.00', 'Kembang kol dan brokoli, segar atau dingin', 'Vegetables', 'Cauliflower', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Kembang kol'),
('0803.10.00', 'Pisang plantain, segar atau kering', 'Fruits', 'Bananas', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Pisang'),
('0804.50.00', 'Jambu biji, mangga dan manggis, segar atau kering', 'Fruits', 'Tropical Fruits', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Buah tropis'),
('0805.10.00', 'Jeruk, segar atau kering', 'Fruits', 'Citrus', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Jeruk'),
('0901.11.00', 'Kopi, tidak dipanggang, tidak mengandung kafein', 'Coffee & Tea', 'Coffee', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Kopi mentah'),
('0901.21.00', 'Kopi, sangrai, tidak mengandung kafein', 'Coffee & Tea', 'Coffee', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Kopi sangrai'),
('0902.10.00', 'Teh hijau dalam kemasan langsung tidak melebihi 3 kg', 'Coffee & Tea', 'Tea', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Teh hijau'),
('0902.30.00', 'Teh hitam dan teh yang difermentasi sebagian', 'Coffee & Tea', 'Tea', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Teh hitam'),
('1001.11.00', 'Gandum durum untuk disemai', 'Cereals', 'Wheat', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Gandum'),
('1003.10.00', 'Jelai untuk disemai', 'Cereals', 'Barley', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Jelai'),
('1005.10.00', 'Jagung untuk disemai', 'Cereals', 'Corn', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Jagung'),
('1006.10.00', 'Padi (beras dalam kulit)', 'Cereals', 'Rice', 'Kg', 0.00, 0.00, 11.00, 0.00, 'Padi'),
('1006.30.00', 'Beras setengah giling atau digiling seluruhnya', 'Cereals', 'Rice', 'Kg', 0.00, 0.00, 11.00, 0.00, 'Beras'),
('1201.10.00', 'Kedelai untuk disemai', 'Oil Seeds', 'Soybeans', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Kedelai'),
('1507.10.00', 'Minyak kedelai, mentah', 'Oils & Fats', 'Soybean Oil', 'Liter', 5.00, 0.00, 11.00, 2.50, 'Minyak kedelai'),
('1511.10.00', 'Minyak kelapa sawit, mentah', 'Oils & Fats', 'Palm Oil', 'Liter', 0.00, 0.00, 11.00, 2.50, 'CPO'),
('1512.11.00', 'Minyak bunga matahari, mentah', 'Oils & Fats', 'Sunflower Oil', 'Liter', 5.00, 0.00, 11.00, 2.50, 'Minyak bunga matahari'),
('1701.14.00', 'Gula tebu lainnya', 'Sugar & Confectionery', 'Sugar', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Gula tebu'),
('1701.91.00', 'Gula tebu atau gula bit dengan tambahan perasa atau pewarna', 'Sugar & Confectionery', 'Sugar', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Gula olahan'),
('1801.00.00', 'Biji kakao, utuh atau pecah, mentah atau sangrai', 'Cocoa Products', 'Cocoa Beans', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Kakao'),
('1805.00.00', 'Bubuk kakao, tanpa tambahan gula', 'Cocoa Products', 'Cocoa Powder', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Bubuk kakao'),
('2203.00.00', 'Bir yang dibuat dari malt', 'Beverages', 'Beer', 'Liter', 15.00, 0.00, 11.00, 2.50, 'Bir'),
('2204.10.00', 'Anggur berkilau', 'Beverages', 'Wine', 'Liter', 15.00, 0.00, 11.00, 2.50, 'Wine'),
('2710.12.10', 'Bensin', 'Petroleum Products', 'Gasoline', 'Liter', 0.00, 0.00, 11.00, 2.50, 'BBM'),
('2710.19.21', 'Minyak tanah', 'Petroleum Products', 'Kerosene', 'Liter', 0.00, 0.00, 11.00, 2.50, 'Minyak tanah'),
('2710.19.29', 'Minyak solar', 'Petroleum Products', 'Diesel', 'Liter', 0.00, 0.00, 11.00, 2.50, 'Solar'),
('2711.11.00', 'Gas alam dalam bentuk gas', 'Petroleum Products', 'Natural Gas', 'M3', 0.00, 0.00, 11.00, 2.50, 'Gas alam'),
('2711.12.00', 'Propana, dicairkan', 'Petroleum Products', 'LPG', 'Kg', 0.00, 0.00, 11.00, 2.50, 'LPG'),
('3004.10.00', 'Obat yang mengandung penisilin', 'Pharmaceuticals', 'Antibiotics', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Obat antibiotik'),
('3004.20.00', 'Obat yang mengandung antibiotik lainnya', 'Pharmaceuticals', 'Antibiotics', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Obat antibiotik'),
('3004.90.99', 'Obat-obatan lainnya', 'Pharmaceuticals', 'Medicine', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Obat-obatan'),
('3926.90.90', 'Barang lain dari plastik', 'Plastics', 'Plastic Products', 'Kg', 7.50, 0.00, 11.00, 2.50, 'Produk plastik'),
('4011.10.00', 'Ban pneumatik baru dari karet untuk mobil penumpang', 'Rubber Products', 'Tires', 'Unit', 10.00, 0.00, 11.00, 2.50, 'Ban mobil'),
('4011.20.00', 'Ban pneumatik baru dari karet untuk bus atau truk', 'Rubber Products', 'Tires', 'Unit', 10.00, 0.00, 11.00, 2.50, 'Ban truk'),
('5201.00.00', 'Kapas, tidak disisir atau disisir', 'Textiles', 'Cotton', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Kapas'),
('5208.11.00', 'Kain tenun dari katun, putih', 'Textiles', 'Cotton Fabric', 'M', 10.00, 0.00, 11.00, 2.50, 'Kain katun'),
('6109.10.00', 'T-shirt, singlet dan kaos dalam sejenis dari katun', 'Garments', 'T-Shirts', 'Pcs', 15.00, 0.00, 11.00, 2.50, 'Kaos'),
('6203.42.00', 'Celana panjang dari katun untuk pria', 'Garments', 'Trousers', 'Pcs', 15.00, 0.00, 11.00, 2.50, 'Celana pria'),
('6204.62.00', 'Celana panjang dari katun untuk wanita', 'Garments', 'Trousers', 'Pcs', 15.00, 0.00, 11.00, 2.50, 'Celana wanita'),
('6403.91.00', 'Alas kaki dengan bagian luar dari kulit', 'Footwear', 'Leather Shoes', 'Pairs', 15.00, 0.00, 11.00, 2.50, 'Sepatu kulit'),
('6404.11.00', 'Alas kaki olahraga dengan bagian luar dari tekstil', 'Footwear', 'Sports Shoes', 'Pairs', 15.00, 0.00, 11.00, 2.50, 'Sepatu olahraga'),
('7208.10.00', 'Produk datar dari besi atau baja, lebar 600mm atau lebih', 'Iron & Steel', 'Steel Plates', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Plat besi'),
('7210.11.00', 'Produk datar dari besi atau baja, dilapisi timah', 'Iron & Steel', 'Tin Plates', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Plat timah'),
('7213.10.00', 'Batang besi atau baja, dalam gulungan tidak teratur', 'Iron & Steel', 'Steel Bars', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Besi beton'),
('7326.90.90', 'Barang lain dari besi atau baja', 'Iron & Steel', 'Steel Products', 'Kg', 7.50, 0.00, 11.00, 2.50, 'Produk besi'),
('7403.11.00', 'Tembaga katoda dan seksi katoda', 'Non-Ferrous Metals', 'Copper', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Tembaga'),
('7601.10.00', 'Aluminium tidak dicampur', 'Non-Ferrous Metals', 'Aluminum', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Aluminium'),
('8471.30.00', 'Mesin pengolah data otomatis portabel, bobotnya tidak melebihi 10 kg', 'Electronics', 'Computers', 'Unit', 0.00, 0.00, 11.00, 2.50, 'Laptop'),
('8471.41.00', 'Mesin pengolah data otomatis lainnya yang mengandung unit penyimpanan', 'Electronics', 'Computers', 'Unit', 0.00, 0.00, 11.00, 2.50, 'Desktop PC'),
('8517.12.00', 'Telepon untuk jaringan selular atau untuk jaringan nirkabel lainnya', 'Electronics', 'Mobile Phones', 'Unit', 0.00, 0.00, 11.00, 2.50, 'Smartphone'),
('8517.62.00', 'Mesin untuk penerimaan, konversi dan transmisi atau regenerasi suara', 'Electronics', 'Communication Equipment', 'Unit', 0.00, 0.00, 11.00, 2.50, 'Perangkat komunikasi'),
('8528.72.10', 'Pesawat penerima televisi berwarna', 'Electronics', 'Television', 'Unit', 7.50, 0.00, 11.00, 2.50, 'TV LED/LCD'),
('8703.23.31', 'Sedan dengan kapasitas silinder melebihi 1500cc tetapi tidak melebihi 2000cc', 'Vehicles', 'Passenger Cars', 'Unit', 40.00, 0.00, 11.00, 2.50, 'Mobil sedan'),
('8703.24.31', 'Sedan dengan kapasitas silinder melebihi 2000cc tetapi tidak melebihi 2500cc', 'Vehicles', 'Passenger Cars', 'Unit', 50.00, 0.00, 11.00, 2.50, 'Mobil sedan'),
('8704.21.00', 'Kendaraan bermotor untuk pengangkutan barang, GVW tidak melebihi 5 ton', 'Vehicles', 'Trucks', 'Unit', 15.00, 0.00, 11.00, 2.50, 'Truk kecil'),
('8708.29.90', 'Bagian dan aksesori lainnya dari badan kendaraan bermotor', 'Vehicles', 'Auto Parts', 'Kg', 10.00, 0.00, 11.00, 2.50, 'Spare parts'),
('8711.20.00', 'Sepeda motor dengan mesin piston bolak-balik, kapasitas silinder melebihi 50cc tetapi tidak melebihi 250cc', 'Vehicles', 'Motorcycles', 'Unit', 15.00, 0.00, 11.00, 2.50, 'Motor'),
('9018.11.00', 'Elektrokardiograf', 'Medical Equipment', 'Diagnostic Equipment', 'Unit', 0.00, 0.00, 11.00, 2.50, 'Alat EKG'),
('9018.90.90', 'Instrumen dan peralatan medis lainnya', 'Medical Equipment', 'Medical Devices', 'Unit', 0.00, 0.00, 11.00, 2.50, 'Alat kesehatan'),
('9401.20.00', 'Tempat duduk dari jenis yang digunakan untuk kendaraan bermotor', 'Furniture', 'Vehicle Seats', 'Unit', 10.00, 0.00, 11.00, 2.50, 'Kursi mobil'),
('9403.30.00', 'Mebel dari kayu dari jenis yang digunakan di kantor', 'Furniture', 'Office Furniture', 'Unit', 10.00, 0.00, 11.00, 2.50, 'Mebel kantor'),
('9403.60.00', 'Mebel dari kayu lainnya', 'Furniture', 'Wooden Furniture', 'Unit', 10.00, 0.00, 11.00, 2.50, 'Mebel kayu');
