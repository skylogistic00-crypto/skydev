CREATE TABLE IF NOT EXISTS hs_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hs_code VARCHAR(10) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(100),
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

INSERT INTO hs_codes (hs_code, description, category, unit, import_duty_rate, export_duty_rate, vat_rate, pph_rate, notes) VALUES
('8471.30.00', 'Mesin pengolah data otomatis portabel, bobotnya tidak melebihi 10 kg', 'Electronics', 'Unit', 0.00, 0.00, 11.00, 2.50, 'Laptop dan notebook'),
('8471.41.00', 'Mesin pengolah data otomatis lainnya yang mengandung unit penyimpanan', 'Electronics', 'Unit', 0.00, 0.00, 11.00, 2.50, 'Desktop computer'),
('8517.12.00', 'Telepon untuk jaringan selular atau untuk jaringan nirkabel lainnya', 'Electronics', 'Unit', 0.00, 0.00, 11.00, 2.50, 'Smartphone dan handphone'),
('8528.72.10', 'Pesawat penerima televisi berwarna', 'Electronics', 'Unit', 7.50, 0.00, 11.00, 2.50, 'TV LED/LCD'),
('8704.21.00', 'Kendaraan bermotor untuk pengangkutan barang, GVW tidak melebihi 5 ton', 'Automotive', 'Unit', 15.00, 0.00, 11.00, 2.50, 'Truk kecil'),
('8703.23.31', 'Sedan dengan kapasitas silinder melebihi 1500cc tetapi tidak melebihi 2000cc', 'Automotive', 'Unit', 40.00, 0.00, 11.00, 2.50, 'Mobil sedan'),
('8708.29.90', 'Bagian dan aksesori lainnya dari badan kendaraan bermotor', 'Automotive', 'Kg', 10.00, 0.00, 11.00, 2.50, 'Spare parts mobil'),
('6203.42.00', 'Celana panjang, celana kodok dan celana pendek dari katun untuk pria', 'Textile', 'Pcs', 15.00, 0.00, 11.00, 2.50, 'Pakaian jadi'),
('6204.62.00', 'Celana panjang, celana kodok dan celana pendek dari katun untuk wanita', 'Textile', 'Pcs', 15.00, 0.00, 11.00, 2.50, 'Pakaian jadi'),
('6109.10.00', 'T-shirt, singlet dan kaos dalam sejenis dari katun', 'Textile', 'Pcs', 15.00, 0.00, 11.00, 2.50, 'Kaos'),
('0901.21.00', 'Kopi, sangrai, tidak mengandung kafein', 'Agriculture', 'Kg', 5.00, 0.00, 11.00, 2.50, 'Kopi olahan'),
('1006.30.00', 'Beras setengah giling atau digiling seluruhnya', 'Agriculture', 'Kg', 0.00, 0.00, 11.00, 0.00, 'Beras'),
('1801.00.00', 'Biji kakao, utuh atau pecah, mentah atau sangrai', 'Agriculture', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Kakao'),
('2710.19.21', 'Minyak tanah', 'Energy', 'Liter', 0.00, 0.00, 11.00, 2.50, 'BBM'),
('2710.19.29', 'Bahan bakar minyak lainnya', 'Energy', 'Liter', 0.00, 0.00, 11.00, 2.50, 'Solar, bensin'),
('7208.10.00', 'Produk datar dari besi atau baja', 'Metal', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Plat besi'),
('7326.90.90', 'Barang lain dari besi atau baja', 'Metal', 'Kg', 7.50, 0.00, 11.00, 2.50, 'Komponen besi'),
('3004.90.99', 'Obat-obatan lainnya', 'Pharmaceutical', 'Kg', 0.00, 0.00, 11.00, 2.50, 'Obat-obatan'),
('9018.90.90', 'Instrumen dan peralatan medis lainnya', 'Medical', 'Unit', 0.00, 0.00, 11.00, 2.50, 'Alat kesehatan'),
('4011.10.00', 'Ban pneumatik baru dari karet untuk mobil penumpang', 'Automotive', 'Unit', 10.00, 0.00, 11.00, 2.50, 'Ban mobil');
