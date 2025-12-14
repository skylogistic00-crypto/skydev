-- Add comprehensive brands from various categories

-- ELEKTRONIK & TEKNOLOGI
INSERT INTO brands (brand_name, category, description, kategori_layanan, jenis_layanan, satuan, berat, volume, coa_account_code, coa_account_name) VALUES
  ('Samsung', 'Elektronik', 'Brand elektronik global', 'Persediaan Barang', 'Elektronik', 'pcs', '0.5', '0.001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Apple', 'Elektronik', 'Brand teknologi premium', 'Persediaan Barang', 'Elektronik', 'pcs', '0.3', '0.0005', '1-1400', 'Persediaan Barang Dagangan'),
  ('Sony', 'Elektronik', 'Brand elektronik Jepang', 'Persediaan Barang', 'Elektronik', 'pcs', '0.4', '0.001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Xiaomi', 'Elektronik', 'Brand teknologi China', 'Persediaan Barang', 'Elektronik', 'pcs', '0.3', '0.0008', '1-1400', 'Persediaan Barang Dagangan'),
  ('Oppo', 'Elektronik', 'Brand smartphone', 'Persediaan Barang', 'Elektronik', 'pcs', '0.25', '0.0006', '1-1400', 'Persediaan Barang Dagangan'),
  ('Vivo', 'Elektronik', 'Brand smartphone', 'Persediaan Barang', 'Elektronik', 'pcs', '0.25', '0.0006', '1-1400', 'Persediaan Barang Dagangan'),
  ('Realme', 'Elektronik', 'Brand smartphone', 'Persediaan Barang', 'Elektronik', 'pcs', '0.25', '0.0006', '1-1400', 'Persediaan Barang Dagangan'),
  ('Asus', 'Elektronik', 'Brand laptop dan komputer', 'Persediaan Barang', 'Elektronik', 'pcs', '2.0', '0.01', '1-1400', 'Persediaan Barang Dagangan'),
  ('Acer', 'Elektronik', 'Brand laptop', 'Persediaan Barang', 'Elektronik', 'pcs', '2.0', '0.01', '1-1400', 'Persediaan Barang Dagangan'),
  ('Lenovo', 'Elektronik', 'Brand komputer', 'Persediaan Barang', 'Elektronik', 'pcs', '2.0', '0.01', '1-1400', 'Persediaan Barang Dagangan'),
  ('Canon', 'Elektronik', 'Brand kamera dan printer', 'Persediaan Barang', 'Elektronik', 'pcs', '1.5', '0.008', '1-1400', 'Persediaan Barang Dagangan'),
  ('Nikon', 'Elektronik', 'Brand kamera', 'Persediaan Barang', 'Elektronik', 'pcs', '1.0', '0.005', '1-1400', 'Persediaan Barang Dagangan'),
  ('Panasonic', 'Elektronik', 'Brand elektronik rumah tangga', 'Persediaan Barang', 'Elektronik', 'pcs', '3.0', '0.02', '1-1400', 'Persediaan Barang Dagangan'),
  ('Sharp', 'Elektronik', 'Brand elektronik', 'Persediaan Barang', 'Elektronik', 'pcs', '3.0', '0.02', '1-1400', 'Persediaan Barang Dagangan'),
  ('Toshiba', 'Elektronik', 'Brand elektronik', 'Persediaan Barang', 'Elektronik', 'pcs', '3.0', '0.02', '1-1400', 'Persediaan Barang Dagangan'),
  ('Philips', 'Elektronik', 'Brand elektronik dan lampu', 'Persediaan Barang', 'Elektronik', 'pcs', '0.5', '0.002', '1-1400', 'Persediaan Barang Dagangan'),
  ('JBL', 'Elektronik', 'Brand audio', 'Persediaan Barang', 'Elektronik', 'pcs', '0.5', '0.003', '1-1400', 'Persediaan Barang Dagangan'),
  ('Bose', 'Elektronik', 'Brand audio premium', 'Persediaan Barang', 'Elektronik', 'pcs', '0.6', '0.003', '1-1400', 'Persediaan Barang Dagangan'),
  ('Harman Kardon', 'Elektronik', 'Brand audio premium', 'Persediaan Barang', 'Elektronik', 'pcs', '0.8', '0.004', '1-1400', 'Persediaan Barang Dagangan')
ON CONFLICT (brand_name, category) DO NOTHING;

-- MAKANAN & MINUMAN
INSERT INTO brands (brand_name, category, description, kategori_layanan, jenis_layanan, satuan, berat, volume, coa_account_code, coa_account_name) VALUES
  ('Nestle', 'Makanan', 'Brand makanan global', 'Persediaan Barang', 'Makanan & Minuman', 'pcs', '0.1', '0.0002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Unilever', 'Makanan', 'Brand makanan dan minuman', 'Persediaan Barang', 'Makanan & Minuman', 'pcs', '0.1', '0.0002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Coca-Cola', 'Minuman', 'Brand minuman berkarbonasi', 'Persediaan Barang', 'Makanan & Minuman', 'botol', '0.6', '0.0006', '1-1400', 'Persediaan Barang Dagangan'),
  ('Pepsi', 'Minuman', 'Brand minuman berkarbonasi', 'Persediaan Barang', 'Makanan & Minuman', 'botol', '0.6', '0.0006', '1-1400', 'Persediaan Barang Dagangan'),
  ('Sprite', 'Minuman', 'Brand minuman berkarbonasi', 'Persediaan Barang', 'Makanan & Minuman', 'botol', '0.6', '0.0006', '1-1400', 'Persediaan Barang Dagangan'),
  ('Fanta', 'Minuman', 'Brand minuman berkarbonasi', 'Persediaan Barang', 'Makanan & Minuman', 'botol', '0.6', '0.0006', '1-1400', 'Persediaan Barang Dagangan'),
  ('Danone', 'Minuman', 'Brand air mineral dan yogurt', 'Persediaan Barang', 'Makanan & Minuman', 'botol', '0.6', '0.0006', '1-1400', 'Persediaan Barang Dagangan'),
  ('Yakult', 'Minuman', 'Brand minuman probiotik', 'Persediaan Barang', 'Makanan & Minuman', 'botol', '0.1', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Pocari Sweat', 'Minuman', 'Brand minuman isotonik', 'Persediaan Barang', 'Makanan & Minuman', 'botol', '0.35', '0.0003', '1-1400', 'Persediaan Barang Dagangan'),
  ('Mizone', 'Minuman', 'Brand minuman isotonik', 'Persediaan Barang', 'Makanan & Minuman', 'botol', '0.5', '0.0005', '1-1400', 'Persediaan Barang Dagangan'),
  ('Teh Botol Sosro', 'Minuman', 'Brand teh dalam kemasan', 'Persediaan Barang', 'Makanan & Minuman', 'botol', '0.45', '0.0004', '1-1400', 'Persediaan Barang Dagangan'),
  ('Nutrisari', 'Minuman', 'Brand minuman serbuk', 'Persediaan Barang', 'Makanan & Minuman', 'sachet', '0.02', '0.00005', '1-1400', 'Persediaan Barang Dagangan'),
  ('Oreo', 'Makanan', 'Brand biskuit', 'Persediaan Barang', 'Makanan & Minuman', 'pack', '0.15', '0.0003', '1-1400', 'Persediaan Barang Dagangan'),
  ('Khong Guan', 'Makanan', 'Brand biskuit', 'Persediaan Barang', 'Makanan & Minuman', 'kaleng', '0.5', '0.002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Roma', 'Makanan', 'Brand biskuit', 'Persediaan Barang', 'Makanan & Minuman', 'pack', '0.12', '0.0002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Nissin', 'Makanan', 'Brand mie instan', 'Persediaan Barang', 'Makanan & Minuman', 'pack', '0.08', '0.0002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Lays', 'Makanan', 'Brand keripik kentang', 'Persediaan Barang', 'Makanan & Minuman', 'pack', '0.06', '0.0008', '1-1400', 'Persediaan Barang Dagangan'),
  ('Chitato', 'Makanan', 'Brand keripik kentang', 'Persediaan Barang', 'Makanan & Minuman', 'pack', '0.06', '0.0008', '1-1400', 'Persediaan Barang Dagangan'),
  ('Taro', 'Makanan', 'Brand snack', 'Persediaan Barang', 'Makanan & Minuman', 'pack', '0.05', '0.0006', '1-1400', 'Persediaan Barang Dagangan'),
  ('Silverqueen', 'Makanan', 'Brand coklat', 'Persediaan Barang', 'Makanan & Minuman', 'bar', '0.06', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Cadbury', 'Makanan', 'Brand coklat', 'Persediaan Barang', 'Makanan & Minuman', 'bar', '0.06', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Toblerone', 'Makanan', 'Brand coklat premium', 'Persediaan Barang', 'Makanan & Minuman', 'bar', '0.1', '0.0002', '1-1400', 'Persediaan Barang Dagangan')
ON CONFLICT (brand_name, category) DO NOTHING;

-- FASHION & PAKAIAN
INSERT INTO brands (brand_name, category, description, kategori_layanan, jenis_layanan, satuan, berat, volume, coa_account_code, coa_account_name) VALUES
  ('Nike', 'Fashion', 'Brand olahraga global', 'Persediaan Barang', 'Fashion & Pakaian', 'pcs', '0.3', '0.002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Adidas', 'Fashion', 'Brand olahraga', 'Persediaan Barang', 'Fashion & Pakaian', 'pcs', '0.3', '0.002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Puma', 'Fashion', 'Brand olahraga', 'Persediaan Barang', 'Fashion & Pakaian', 'pcs', '0.3', '0.002', '1-1400', 'Persediaan Barang Dagangan'),
  ('New Balance', 'Fashion', 'Brand sepatu olahraga', 'Persediaan Barang', 'Fashion & Pakaian', 'pcs', '0.4', '0.003', '1-1400', 'Persediaan Barang Dagangan'),
  ('Converse', 'Fashion', 'Brand sepatu kasual', 'Persediaan Barang', 'Fashion & Pakaian', 'pcs', '0.4', '0.003', '1-1400', 'Persediaan Barang Dagangan'),
  ('Vans', 'Fashion', 'Brand sepatu kasual', 'Persediaan Barang', 'Fashion & Pakaian', 'pcs', '0.4', '0.003', '1-1400', 'Persediaan Barang Dagangan'),
  ('Uniqlo', 'Fashion', 'Brand pakaian kasual', 'Persediaan Barang', 'Fashion & Pakaian', 'pcs', '0.2', '0.001', '1-1400', 'Persediaan Barang Dagangan'),
  ('H&M', 'Fashion', 'Brand fashion', 'Persediaan Barang', 'Fashion & Pakaian', 'pcs', '0.2', '0.001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Zara', 'Fashion', 'Brand fashion', 'Persediaan Barang', 'Fashion & Pakaian', 'pcs', '0.2', '0.001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Levis', 'Fashion', 'Brand jeans', 'Persediaan Barang', 'Fashion & Pakaian', 'pcs', '0.5', '0.002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Wrangler', 'Fashion', 'Brand jeans', 'Persediaan Barang', 'Fashion & Pakaian', 'pcs', '0.5', '0.002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Cardinal', 'Fashion', 'Brand pakaian lokal', 'Persediaan Barang', 'Fashion & Pakaian', 'pcs', '0.2', '0.001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Eiger', 'Fashion', 'Brand outdoor Indonesia', 'Persediaan Barang', 'Fashion & Pakaian', 'pcs', '0.3', '0.002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Consina', 'Fashion', 'Brand outdoor Indonesia', 'Persediaan Barang', 'Fashion & Pakaian', 'pcs', '0.3', '0.002', '1-1400', 'Persediaan Barang Dagangan')
ON CONFLICT (brand_name, category) DO NOTHING;

-- KECANTIKAN & PERAWATAN
INSERT INTO brands (brand_name, category, description, kategori_layanan, jenis_layanan, satuan, berat, volume, coa_account_code, coa_account_name) VALUES
  ('Wardah', 'Kecantikan', 'Brand kosmetik halal Indonesia', 'Persediaan Barang', 'Kecantikan & Perawatan', 'pcs', '0.05', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Emina', 'Kecantikan', 'Brand kosmetik remaja', 'Persediaan Barang', 'Kecantikan & Perawatan', 'pcs', '0.05', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Maybelline', 'Kecantikan', 'Brand kosmetik global', 'Persediaan Barang', 'Kecantikan & Perawatan', 'pcs', '0.05', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Loreal', 'Kecantikan', 'Brand kosmetik premium', 'Persediaan Barang', 'Kecantikan & Perawatan', 'pcs', '0.05', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('MAC', 'Kecantikan', 'Brand kosmetik premium', 'Persediaan Barang', 'Kecantikan & Perawatan', 'pcs', '0.05', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Estee Lauder', 'Kecantikan', 'Brand kosmetik luxury', 'Persediaan Barang', 'Kecantikan & Perawatan', 'pcs', '0.05', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Clinique', 'Kecantikan', 'Brand skincare', 'Persediaan Barang', 'Kecantikan & Perawatan', 'pcs', '0.1', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Ponds', 'Kecantikan', 'Brand perawatan kulit', 'Persediaan Barang', 'Kecantikan & Perawatan', 'jar', '0.05', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Garnier', 'Kecantikan', 'Brand perawatan kulit', 'Persediaan Barang', 'Kecantikan & Perawatan', 'botol', '0.1', '0.0002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Nivea', 'Kecantikan', 'Brand perawatan kulit', 'Persediaan Barang', 'Kecantikan & Perawatan', 'tube', '0.08', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Vaseline', 'Kecantikan', 'Brand perawatan kulit', 'Persediaan Barang', 'Kecantikan & Perawatan', 'jar', '0.1', '0.0002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Olay', 'Kecantikan', 'Brand anti-aging', 'Persediaan Barang', 'Kecantikan & Perawatan', 'jar', '0.05', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('The Body Shop', 'Kecantikan', 'Brand natural beauty', 'Persediaan Barang', 'Kecantikan & Perawatan', 'pcs', '0.1', '0.0002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Innisfree', 'Kecantikan', 'Brand K-beauty', 'Persediaan Barang', 'Kecantikan & Perawatan', 'pcs', '0.05', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Laneige', 'Kecantikan', 'Brand K-beauty premium', 'Persediaan Barang', 'Kecantikan & Perawatan', 'pcs', '0.05', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Etude House', 'Kecantikan', 'Brand K-beauty', 'Persediaan Barang', 'Kecantikan & Perawatan', 'pcs', '0.05', '0.0001', '1-1400', 'Persediaan Barang Dagangan')
ON CONFLICT (brand_name, category) DO NOTHING;

-- OTOMOTIF
INSERT INTO brands (brand_name, category, description, kategori_layanan, jenis_layanan, satuan, berat, volume, coa_account_code, coa_account_name) VALUES
  ('Toyota', 'Otomotif', 'Brand mobil Jepang', 'Persediaan Barang', 'Otomotif', 'unit', '1200', '15', '1-1400', 'Persediaan Barang Dagangan'),
  ('Honda', 'Otomotif', 'Brand mobil dan motor', 'Persediaan Barang', 'Otomotif', 'unit', '150', '2', '1-1400', 'Persediaan Barang Dagangan'),
  ('Yamaha', 'Otomotif', 'Brand motor', 'Persediaan Barang', 'Otomotif', 'unit', '120', '1.5', '1-1400', 'Persediaan Barang Dagangan'),
  ('Suzuki', 'Otomotif', 'Brand mobil dan motor', 'Persediaan Barang', 'Otomotif', 'unit', '150', '2', '1-1400', 'Persediaan Barang Dagangan'),
  ('Kawasaki', 'Otomotif', 'Brand motor', 'Persediaan Barang', 'Otomotif', 'unit', '180', '1.8', '1-1400', 'Persediaan Barang Dagangan'),
  ('Mitsubishi', 'Otomotif', 'Brand mobil', 'Persediaan Barang', 'Otomotif', 'unit', '1500', '18', '1-1400', 'Persediaan Barang Dagangan'),
  ('Daihatsu', 'Otomotif', 'Brand mobil', 'Persediaan Barang', 'Otomotif', 'unit', '900', '12', '1-1400', 'Persediaan Barang Dagangan'),
  ('Nissan', 'Otomotif', 'Brand mobil', 'Persediaan Barang', 'Otomotif', 'unit', '1300', '16', '1-1400', 'Persediaan Barang Dagangan'),
  ('Mazda', 'Otomotif', 'Brand mobil', 'Persediaan Barang', 'Otomotif', 'unit', '1400', '17', '1-1400', 'Persediaan Barang Dagangan'),
  ('BMW', 'Otomotif', 'Brand mobil premium', 'Persediaan Barang', 'Otomotif', 'unit', '1600', '19', '1-1400', 'Persediaan Barang Dagangan'),
  ('Mercedes-Benz', 'Otomotif', 'Brand mobil luxury', 'Persediaan Barang', 'Otomotif', 'unit', '1800', '20', '1-1400', 'Persediaan Barang Dagangan'),
  ('Audi', 'Otomotif', 'Brand mobil premium', 'Persediaan Barang', 'Otomotif', 'unit', '1700', '19', '1-1400', 'Persediaan Barang Dagangan')
ON CONFLICT (brand_name, category) DO NOTHING;

-- FURNITURE & HOME
INSERT INTO brands (brand_name, category, description, kategori_layanan, jenis_layanan, satuan, berat, volume, coa_account_code, coa_account_name) VALUES
  ('IKEA', 'Furniture', 'Brand furniture global', 'Persediaan Barang', 'Furniture & Home', 'pcs', '20', '0.5', '1-1400', 'Persediaan Barang Dagangan'),
  ('Informa', 'Furniture', 'Brand furniture Indonesia', 'Persediaan Barang', 'Furniture & Home', 'pcs', '20', '0.5', '1-1400', 'Persediaan Barang Dagangan'),
  ('ACE Hardware', 'Furniture', 'Brand peralatan rumah', 'Persediaan Barang', 'Furniture & Home', 'pcs', '5', '0.1', '1-1400', 'Persediaan Barang Dagangan'),
  ('Krisbow', 'Furniture', 'Brand tools dan hardware', 'Persediaan Barang', 'Furniture & Home', 'pcs', '2', '0.05', '1-1400', 'Persediaan Barang Dagangan'),
  ('Tupperware', 'Furniture', 'Brand wadah makanan', 'Persediaan Barang', 'Furniture & Home', 'pcs', '0.2', '0.001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Lock&Lock', 'Furniture', 'Brand wadah makanan', 'Persediaan Barang', 'Furniture & Home', 'pcs', '0.2', '0.001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Oxone', 'Furniture', 'Brand peralatan dapur', 'Persediaan Barang', 'Furniture & Home', 'pcs', '1', '0.01', '1-1400', 'Persediaan Barang Dagangan'),
  ('Maspion', 'Furniture', 'Brand peralatan rumah tangga', 'Persediaan Barang', 'Furniture & Home', 'pcs', '1', '0.01', '1-1400', 'Persediaan Barang Dagangan'),
  ('Cosmos', 'Furniture', 'Brand elektronik rumah tangga', 'Persediaan Barang', 'Furniture & Home', 'pcs', '3', '0.05', '1-1400', 'Persediaan Barang Dagangan'),
  ('Miyako', 'Furniture', 'Brand elektronik rumah tangga', 'Persediaan Barang', 'Furniture & Home', 'pcs', '3', '0.05', '1-1400', 'Persediaan Barang Dagangan')
ON CONFLICT (brand_name, category) DO NOTHING;

-- ALAT TULIS & KANTOR
INSERT INTO brands (brand_name, category, description, kategori_layanan, jenis_layanan, satuan, berat, volume, coa_account_code, coa_account_name) VALUES
  ('Faber-Castell', 'Alat Tulis', 'Brand alat tulis premium', 'Persediaan Barang', 'Alat Tulis & Kantor', 'pcs', '0.02', '0.00005', '1-1400', 'Persediaan Barang Dagangan'),
  ('Staedtler', 'Alat Tulis', 'Brand alat tulis', 'Persediaan Barang', 'Alat Tulis & Kantor', 'pcs', '0.02', '0.00005', '1-1400', 'Persediaan Barang Dagangan'),
  ('Stabilo', 'Alat Tulis', 'Brand highlighter', 'Persediaan Barang', 'Alat Tulis & Kantor', 'pcs', '0.01', '0.00003', '1-1400', 'Persediaan Barang Dagangan'),
  ('Snowman', 'Alat Tulis', 'Brand spidol', 'Persediaan Barang', 'Alat Tulis & Kantor', 'pcs', '0.02', '0.00005', '1-1400', 'Persediaan Barang Dagangan'),
  ('Joyko', 'Alat Tulis', 'Brand alat tulis Indonesia', 'Persediaan Barang', 'Alat Tulis & Kantor', 'pcs', '0.05', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Kenko', 'Alat Tulis', 'Brand alat tulis', 'Persediaan Barang', 'Alat Tulis & Kantor', 'pcs', '0.05', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Bantex', 'Alat Tulis', 'Brand perlengkapan kantor', 'Persediaan Barang', 'Alat Tulis & Kantor', 'pcs', '0.1', '0.0005', '1-1400', 'Persediaan Barang Dagangan'),
  ('Deli', 'Alat Tulis', 'Brand alat tulis', 'Persediaan Barang', 'Alat Tulis & Kantor', 'pcs', '0.05', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Pentel', 'Alat Tulis', 'Brand pulpen', 'Persediaan Barang', 'Alat Tulis & Kantor', 'pcs', '0.01', '0.00003', '1-1400', 'Persediaan Barang Dagangan'),
  ('Zebra', 'Alat Tulis', 'Brand pulpen', 'Persediaan Barang', 'Alat Tulis & Kantor', 'pcs', '0.01', '0.00003', '1-1400', 'Persediaan Barang Dagangan')
ON CONFLICT (brand_name, category) DO NOTHING;

-- KESEHATAN & FARMASI
INSERT INTO brands (brand_name, category, description, kategori_layanan, jenis_layanan, satuan, berat, volume, coa_account_code, coa_account_name) VALUES
  ('Bodrex', 'Farmasi', 'Brand obat sakit kepala', 'Persediaan Barang', 'Kesehatan & Farmasi', 'strip', '0.01', '0.00002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Panadol', 'Farmasi', 'Brand obat demam', 'Persediaan Barang', 'Kesehatan & Farmasi', 'strip', '0.01', '0.00002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Paramex', 'Farmasi', 'Brand obat sakit kepala', 'Persediaan Barang', 'Kesehatan & Farmasi', 'strip', '0.01', '0.00002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Tolak Angin', 'Farmasi', 'Brand obat herbal', 'Persediaan Barang', 'Kesehatan & Farmasi', 'sachet', '0.01', '0.00002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Antangin', 'Farmasi', 'Brand obat herbal', 'Persediaan Barang', 'Kesehatan & Farmasi', 'sachet', '0.01', '0.00002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Hemaviton', 'Farmasi', 'Brand vitamin', 'Persediaan Barang', 'Kesehatan & Farmasi', 'botol', '0.05', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Enervon-C', 'Farmasi', 'Brand vitamin C', 'Persediaan Barang', 'Kesehatan & Farmasi', 'strip', '0.02', '0.00005', '1-1400', 'Persediaan Barang Dagangan'),
  ('Redoxon', 'Farmasi', 'Brand vitamin C', 'Persediaan Barang', 'Kesehatan & Farmasi', 'tube', '0.05', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Blackmores', 'Farmasi', 'Brand suplemen', 'Persediaan Barang', 'Kesehatan & Farmasi', 'botol', '0.1', '0.0002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Youvit', 'Farmasi', 'Brand vitamin gummy', 'Persediaan Barang', 'Kesehatan & Farmasi', 'botol', '0.08', '0.0002', '1-1400', 'Persediaan Barang Dagangan')
ON CONFLICT (brand_name, category) DO NOTHING;

-- MAINAN & HOBI
INSERT INTO brands (brand_name, category, description, kategori_layanan, jenis_layanan, satuan, berat, volume, coa_account_code, coa_account_name) VALUES
  ('LEGO', 'Mainan', 'Brand mainan konstruksi', 'Persediaan Barang', 'Mainan & Hobi', 'set', '0.5', '0.003', '1-1400', 'Persediaan Barang Dagangan'),
  ('Hot Wheels', 'Mainan', 'Brand mainan mobil', 'Persediaan Barang', 'Mainan & Hobi', 'pcs', '0.05', '0.0001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Barbie', 'Mainan', 'Brand boneka', 'Persediaan Barang', 'Mainan & Hobi', 'pcs', '0.2', '0.001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Hasbro', 'Mainan', 'Brand mainan', 'Persediaan Barang', 'Mainan & Hobi', 'pcs', '0.3', '0.002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Mattel', 'Mainan', 'Brand mainan', 'Persediaan Barang', 'Mainan & Hobi', 'pcs', '0.3', '0.002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Bandai', 'Mainan', 'Brand action figure', 'Persediaan Barang', 'Mainan & Hobi', 'pcs', '0.2', '0.001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Tamiya', 'Mainan', 'Brand model kit', 'Persediaan Barang', 'Mainan & Hobi', 'set', '0.3', '0.002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Gundam', 'Mainan', 'Brand model kit robot', 'Persediaan Barang', 'Mainan & Hobi', 'set', '0.4', '0.003', '1-1400', 'Persediaan Barang Dagangan')
ON CONFLICT (brand_name, category) DO NOTHING;

-- OLAHRAGA & FITNESS
INSERT INTO brands (brand_name, category, description, kategori_layanan, jenis_layanan, satuan, berat, volume, coa_account_code, coa_account_name) VALUES
  ('Reebok', 'Olahraga', 'Brand olahraga', 'Persediaan Barang', 'Olahraga & Fitness', 'pcs', '0.3', '0.002', '1-1400', 'Persediaan Barang Dagangan'),
  ('Under Armour', 'Olahraga', 'Brand pakaian olahraga', 'Persediaan Barang', 'Olahraga & Fitness', 'pcs', '0.2', '0.001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Yonex', 'Olahraga', 'Brand badminton', 'Persediaan Barang', 'Olahraga & Fitness', 'pcs', '0.1', '0.001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Li-Ning', 'Olahraga', 'Brand badminton', 'Persediaan Barang', 'Olahraga & Fitness', 'pcs', '0.1', '0.001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Mikasa', 'Olahraga', 'Brand bola voli', 'Persediaan Barang', 'Olahraga & Fitness', 'pcs', '0.3', '0.005', '1-1400', 'Persediaan Barang Dagangan'),
  ('Molten', 'Olahraga', 'Brand bola basket', 'Persediaan Barang', 'Olahraga & Fitness', 'pcs', '0.6', '0.007', '1-1400', 'Persediaan Barang Dagangan'),
  ('Spalding', 'Olahraga', 'Brand bola basket', 'Persediaan Barang', 'Olahraga & Fitness', 'pcs', '0.6', '0.007', '1-1400', 'Persediaan Barang Dagangan'),
  ('Wilson', 'Olahraga', 'Brand peralatan olahraga', 'Persediaan Barang', 'Olahraga & Fitness', 'pcs', '0.3', '0.003', '1-1400', 'Persediaan Barang Dagangan'),
  ('Decathlon', 'Olahraga', 'Brand peralatan olahraga', 'Persediaan Barang', 'Olahraga & Fitness', 'pcs', '0.5', '0.005', '1-1400', 'Persediaan Barang Dagangan')
ON CONFLICT (brand_name, category) DO NOTHING;

-- BUKU & MEDIA
INSERT INTO brands (brand_name, category, description, kategori_layanan, jenis_layanan, satuan, berat, volume, coa_account_code, coa_account_name) VALUES
  ('Gramedia', 'Buku', 'Brand toko buku Indonesia', 'Persediaan Barang', 'Buku & Media', 'pcs', '0.3', '0.001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Erlangga', 'Buku', 'Brand penerbit buku', 'Persediaan Barang', 'Buku & Media', 'pcs', '0.3', '0.001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Mizan', 'Buku', 'Brand penerbit buku', 'Persediaan Barang', 'Buku & Media', 'pcs', '0.3', '0.001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Bentang Pustaka', 'Buku', 'Brand penerbit buku', 'Persediaan Barang', 'Buku & Media', 'pcs', '0.3', '0.001', '1-1400', 'Persediaan Barang Dagangan'),
  ('Penguin Books', 'Buku', 'Brand penerbit internasional', 'Persediaan Barang', 'Buku & Media', 'pcs', '0.3', '0.001', '1-1400', 'Persediaan Barang Dagangan')
ON CONFLICT (brand_name, category) DO NOTHING;

-- PET CARE
INSERT INTO brands (brand_name, category, description, kategori_layanan, jenis_layanan, satuan, berat, volume, coa_account_code, coa_account_name) VALUES
  ('Royal Canin', 'Pet Care', 'Brand makanan hewan premium', 'Persediaan Barang', 'Pet Care', 'kg', '1', '0.003', '1-1400', 'Persediaan Barang Dagangan'),
  ('Pedigree', 'Pet Care', 'Brand makanan anjing', 'Persediaan Barang', 'Pet Care', 'kg', '1', '0.003', '1-1400', 'Persediaan Barang Dagangan'),
  ('Whiskas', 'Pet Care', 'Brand makanan kucing', 'Persediaan Barang', 'Pet Care', 'kg', '1', '0.003', '1-1400', 'Persediaan Barang Dagangan'),
  ('Friskies', 'Pet Care', 'Brand makanan kucing', 'Persediaan Barang', 'Pet Care', 'kg', '1', '0.003', '1-1400', 'Persediaan Barang Dagangan'),
  ('Me-O', 'Pet Care', 'Brand makanan kucing', 'Persediaan Barang', 'Pet Care', 'kg', '1', '0.003', '1-1400', 'Persediaan Barang Dagangan'),
  ('Bolt', 'Pet Care', 'Brand makanan anjing Indonesia', 'Persediaan Barang', 'Pet Care', 'kg', '1', '0.003', '1-1400', 'Persediaan Barang Dagangan')
ON CONFLICT (brand_name, category) DO NOTHING;
