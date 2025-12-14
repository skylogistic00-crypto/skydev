-- Create chart_of_accounts_2 table with clean, organized data
DROP TABLE IF EXISTS chart_of_accounts_2 CASCADE;

CREATE TABLE chart_of_accounts_2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_code TEXT NOT NULL UNIQUE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('Aset', 'Kewajiban', 'Ekuitas', 'Pendapatan', 'Beban Pokok Penjualan', 'Beban Operasional', 'Pendapatan & Beban Lain-lain')),
  level INTEGER NOT NULL DEFAULT 1,
  parent_code TEXT,
  is_header BOOLEAN DEFAULT false,
  normal_balance TEXT CHECK (normal_balance IN ('Debit', 'Kredit')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  entity_id UUID,
  user_id UUID
);

COMMENT ON TABLE chart_of_accounts_2 IS 'Tabel COA baru dengan struktur parent_code yang rapi';
COMMENT ON COLUMN chart_of_accounts_2.account_code IS 'Kode akun unik (format: 1-0000)';
COMMENT ON COLUMN chart_of_accounts_2.parent_code IS 'Kode akun parent untuk hierarki';
COMMENT ON COLUMN chart_of_accounts_2.level IS 'Level hierarki akun (1=utama, 2=sub, 3=detail)';

CREATE INDEX idx_coa2_account_code ON chart_of_accounts_2(account_code);
CREATE INDEX idx_coa2_parent_code ON chart_of_accounts_2(parent_code);
CREATE INDEX idx_coa2_account_type ON chart_of_accounts_2(account_type);
CREATE INDEX idx_coa2_is_active ON chart_of_accounts_2(is_active);

-- Insert clean, organized data with proper parent_code relationships

-- LEVEL 1: Main Categories (no parent)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('1-0000', 'ASET', 'Aset', 1, NULL, true, 'Debit', 'Aset perusahaan'),
('2-0000', 'KEWAJIBAN', 'Kewajiban', 1, NULL, true, 'Kredit', 'Kewajiban perusahaan'),
('3-0000', 'EKUITAS', 'Ekuitas', 1, NULL, true, 'Kredit', 'Modal dan ekuitas pemilik'),
('4-0000', 'PENDAPATAN', 'Pendapatan', 1, NULL, true, 'Kredit', 'Pendapatan usaha'),
('5-0000', 'BEBAN POKOK PENJUALAN', 'Beban Pokok Penjualan', 1, NULL, true, 'Debit', 'Beban langsung produksi'),
('6-0000', 'BEBAN OPERASIONAL', 'Beban Operasional', 1, NULL, true, 'Debit', 'Beban operasional perusahaan'),
('7-0000', 'PENDAPATAN & BEBAN LAIN-LAIN', 'Pendapatan & Beban Lain-lain', 1, NULL, true, 'Debit', 'Pendapatan dan beban di luar usaha utama');

-- LEVEL 2: Sub Categories (parent = Level 1)
-- ASET (1-0000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('1-1000', 'Aset Lancar', 'Aset', 2, '1-0000', true, 'Debit', 'Aset yang dapat dicairkan dalam 1 tahun'),
('1-2000', 'Aset Tetap', 'Aset', 2, '1-0000', true, 'Debit', 'Aset jangka panjang'),
('1-3000', 'Aset Lain-lain', 'Aset', 2, '1-0000', true, 'Debit', 'Aset lainnya');

-- KEWAJIBAN (2-0000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('2-1000', 'Kewajiban Lancar', 'Kewajiban', 2, '2-0000', true, 'Kredit', 'Kewajiban jangka pendek'),
('2-2000', 'Kewajiban Jangka Panjang', 'Kewajiban', 2, '2-0000', true, 'Kredit', 'Kewajiban jangka panjang');

-- EKUITAS (3-0000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('3-1000', 'Modal', 'Ekuitas', 2, '3-0000', true, 'Kredit', 'Modal pemilik'),
('3-2000', 'Laba Ditahan', 'Ekuitas', 2, '3-0000', true, 'Kredit', 'Laba yang tidak dibagikan');

-- PENDAPATAN (4-0000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('4-1000', 'Pendapatan Usaha', 'Pendapatan', 2, '4-0000', true, 'Kredit', 'Pendapatan dari usaha utama'),
('4-2000', 'Pendapatan Jasa', 'Pendapatan', 2, '4-0000', true, 'Kredit', 'Pendapatan dari jasa');

-- BEBAN POKOK PENJUALAN (5-0000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('5-1000', 'Harga Pokok Penjualan', 'Beban Pokok Penjualan', 2, '5-0000', true, 'Debit', 'HPP barang dagangan');

-- BEBAN OPERASIONAL (6-0000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('6-1000', 'Beban Penjualan', 'Beban Operasional', 2, '6-0000', true, 'Debit', 'Beban untuk penjualan'),
('6-2000', 'Beban Administrasi & Umum', 'Beban Operasional', 2, '6-0000', true, 'Debit', 'Beban administrasi');

-- PENDAPATAN & BEBAN LAIN-LAIN (7-0000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('7-1000', 'Pendapatan Lain-lain', 'Pendapatan & Beban Lain-lain', 2, '7-0000', true, 'Kredit', 'Pendapatan di luar usaha'),
('7-2000', 'Beban Lain-lain', 'Pendapatan & Beban Lain-lain', 2, '7-0000', true, 'Debit', 'Beban di luar usaha');

-- LEVEL 3: Detail Accounts (parent = Level 2)
-- Aset Lancar (1-1000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('1-1100', 'Kas & Setara Kas', 'Aset', 3, '1-1000', false, 'Debit', 'Kas dan setara kas'),
('1-1110', 'Kas di Tangan', 'Aset', 3, '1-1000', false, 'Debit', 'Kas fisik'),
('1-1120', 'Kas Kecil', 'Aset', 3, '1-1000', false, 'Debit', 'Petty cash'),
('1-1200', 'Bank', 'Aset', 3, '1-1000', false, 'Debit', 'Rekening bank'),
('1-1210', 'Bank BCA', 'Aset', 3, '1-1000', false, 'Debit', 'Rekening BCA'),
('1-1220', 'Bank Mandiri', 'Aset', 3, '1-1000', false, 'Debit', 'Rekening Mandiri'),
('1-1230', 'Bank BRI', 'Aset', 3, '1-1000', false, 'Debit', 'Rekening BRI'),
('1-1300', 'Piutang Usaha', 'Aset', 3, '1-1000', false, 'Debit', 'Piutang dari pelanggan'),
('1-1400', 'Persediaan Barang', 'Aset', 3, '1-1000', false, 'Debit', 'Stok barang dagangan'),
('1-1500', 'Uang Muka', 'Aset', 3, '1-1000', false, 'Debit', 'Pembayaran di muka'),
('1-1600', 'Pajak Dibayar Dimuka', 'Aset', 3, '1-1000', false, 'Debit', 'Prepaid tax');

-- Aset Tetap (1-2000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('1-2100', 'Tanah', 'Aset', 3, '1-2000', false, 'Debit', 'Tanah perusahaan'),
('1-2200', 'Bangunan', 'Aset', 3, '1-2000', false, 'Debit', 'Gedung dan bangunan'),
('1-2300', 'Kendaraan', 'Aset', 3, '1-2000', false, 'Debit', 'Kendaraan operasional'),
('1-2400', 'Peralatan Kantor', 'Aset', 3, '1-2000', false, 'Debit', 'Furniture dan peralatan'),
('1-2500', 'Akumulasi Penyusutan', 'Aset', 3, '1-2000', false, 'Kredit', 'Akumulasi penyusutan aset');

-- Kewajiban Lancar (2-1000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('2-1100', 'Hutang Usaha', 'Kewajiban', 3, '2-1000', false, 'Kredit', 'Hutang kepada supplier'),
('2-1200', 'Hutang Pajak', 'Kewajiban', 3, '2-1000', false, 'Kredit', 'Hutang pajak'),
('2-1210', 'Hutang PPh 21', 'Kewajiban', 3, '2-1000', false, 'Kredit', 'Hutang PPh 21'),
('2-1220', 'Hutang PPh 23', 'Kewajiban', 3, '2-1000', false, 'Kredit', 'Hutang PPh 23'),
('2-1230', 'Hutang PPN', 'Kewajiban', 3, '2-1000', false, 'Kredit', 'Hutang PPN'),
('2-1300', 'Hutang Gaji', 'Kewajiban', 3, '2-1000', false, 'Kredit', 'Hutang gaji karyawan'),
('2-1400', 'Uang Muka Pelanggan', 'Kewajiban', 3, '2-1000', false, 'Kredit', 'Advance dari customer');

-- Kewajiban Jangka Panjang (2-2000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('2-2100', 'Hutang Bank', 'Kewajiban', 3, '2-2000', false, 'Kredit', 'Pinjaman bank jangka panjang'),
('2-2200', 'Hutang Obligasi', 'Kewajiban', 3, '2-2000', false, 'Kredit', 'Obligasi yang diterbitkan');

-- Modal (3-1000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('3-1100', 'Modal Disetor', 'Ekuitas', 3, '3-1000', false, 'Kredit', 'Modal yang disetor pemilik'),
('3-1200', 'Modal Saham', 'Ekuitas', 3, '3-1000', false, 'Kredit', 'Modal dari saham');

-- Laba Ditahan (3-2000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('3-2100', 'Laba Tahun Berjalan', 'Ekuitas', 3, '3-2000', false, 'Kredit', 'Laba periode berjalan'),
('3-2200', 'Laba Tahun Lalu', 'Ekuitas', 3, '3-2000', false, 'Kredit', 'Laba periode sebelumnya');

-- Pendapatan Usaha (4-1000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('4-1100', 'Penjualan Barang', 'Pendapatan', 3, '4-1000', false, 'Kredit', 'Pendapatan dari penjualan barang'),
('4-1200', 'Retur Penjualan', 'Pendapatan', 3, '4-1000', false, 'Debit', 'Pengembalian barang'),
('4-1300', 'Potongan Penjualan', 'Pendapatan', 3, '4-1000', false, 'Debit', 'Diskon penjualan');

-- Pendapatan Jasa (4-2000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('4-2100', 'Pendapatan Jasa Konsultasi', 'Pendapatan', 3, '4-2000', false, 'Kredit', 'Jasa konsultasi'),
('4-2200', 'Pendapatan Jasa Lainnya', 'Pendapatan', 3, '4-2000', false, 'Kredit', 'Jasa lainnya');

-- Harga Pokok Penjualan (5-1000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('5-1100', 'HPP Barang Dagangan', 'Beban Pokok Penjualan', 3, '5-1000', false, 'Debit', 'Harga pokok barang yang dijual'),
('5-1200', 'Biaya Angkut Pembelian', 'Beban Pokok Penjualan', 3, '5-1000', false, 'Debit', 'Ongkos kirim pembelian');

-- Beban Penjualan (6-1000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('6-1100', 'Beban Gaji Sales', 'Beban Operasional', 3, '6-1000', false, 'Debit', 'Gaji tim penjualan'),
('6-1200', 'Beban Iklan & Promosi', 'Beban Operasional', 3, '6-1000', false, 'Debit', 'Biaya marketing'),
('6-1300', 'Beban Transportasi', 'Beban Operasional', 3, '6-1000', false, 'Debit', 'Biaya transportasi penjualan');

-- Beban Administrasi & Umum (6-2000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('6-2100', 'Beban Gaji Karyawan', 'Beban Operasional', 3, '6-2000', false, 'Debit', 'Gaji karyawan administrasi'),
('6-2200', 'Beban Listrik & Air', 'Beban Operasional', 3, '6-2000', false, 'Debit', 'Utilitas kantor'),
('6-2300', 'Beban Telepon & Internet', 'Beban Operasional', 3, '6-2000', false, 'Debit', 'Komunikasi'),
('6-2400', 'Beban Perlengkapan Kantor', 'Beban Operasional', 3, '6-2000', false, 'Debit', 'ATK dan supplies'),
('6-2500', 'Beban Penyusutan', 'Beban Operasional', 3, '6-2000', false, 'Debit', 'Depresiasi aset'),
('6-2600', 'Beban Sewa', 'Beban Operasional', 3, '6-2000', false, 'Debit', 'Sewa gedung/kantor'),
('6-2700', 'Beban Asuransi', 'Beban Operasional', 3, '6-2000', false, 'Debit', 'Premi asuransi'),
('6-2800', 'Beban Pemeliharaan', 'Beban Operasional', 3, '6-2000', false, 'Debit', 'Maintenance');

-- Pendapatan Lain-lain (7-1000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('7-1100', 'Pendapatan Bunga', 'Pendapatan & Beban Lain-lain', 3, '7-1000', false, 'Kredit', 'Bunga dari deposito/bank'),
('7-1200', 'Keuntungan Penjualan Aset', 'Pendapatan & Beban Lain-lain', 3, '7-1000', false, 'Kredit', 'Gain dari penjualan aset'),
('7-1300', 'Pendapatan Lain-lain', 'Pendapatan & Beban Lain-lain', 3, '7-1000', false, 'Kredit', 'Pendapatan lainnya');

-- Beban Lain-lain (7-2000)
INSERT INTO chart_of_accounts_2 (account_code, account_name, account_type, level, parent_code, is_header, normal_balance, description) VALUES
('7-2100', 'Beban Bunga', 'Pendapatan & Beban Lain-lain', 3, '7-2000', false, 'Debit', 'Bunga pinjaman'),
('7-2200', 'Kerugian Penjualan Aset', 'Pendapatan & Beban Lain-lain', 3, '7-2000', false, 'Debit', 'Loss dari penjualan aset'),
('7-2300', 'Beban Denda', 'Pendapatan & Beban Lain-lain', 3, '7-2000', false, 'Debit', 'Denda dan penalti'),
('7-2400', 'Beban Lain-lain', 'Pendapatan & Beban Lain-lain', 3, '7-2000', false, 'Debit', 'Beban lainnya');

-- Enable RLS
ALTER TABLE chart_of_accounts_2 ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to view chart_of_accounts_2"
  ON chart_of_accounts_2 FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert chart_of_accounts_2"
  ON chart_of_accounts_2 FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update chart_of_accounts_2"
  ON chart_of_accounts_2 FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete chart_of_accounts_2"
  ON chart_of_accounts_2 FOR DELETE
  TO authenticated
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chart_of_accounts_2;
