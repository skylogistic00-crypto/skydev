-- Insert standard Chart of Accounts data
-- This will add comprehensive COA structure for Indonesian accounting

-- Clear existing data first (optional - remove if you want to keep existing data)
-- DELETE FROM chart_of_accounts;

-- 1. ASET (Assets)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, level, is_header, normal_balance, description) VALUES
('1', 'ASET', 'Aset', 1, true, 'Debit', 'Aset Perusahaan'),
('1-1', 'Aset Lancar', 'Aset', 2, true, 'Debit', 'Aset yang dapat dicairkan dalam waktu kurang dari 1 tahun'),
('1-1001', 'Kas', 'Aset', 3, false, 'Debit', 'Uang tunai di tangan'),
('1-1002', 'Bank', 'Aset', 3, false, 'Debit', 'Rekening bank perusahaan'),
('1-1003', 'Piutang Usaha', 'Aset', 3, false, 'Debit', 'Tagihan kepada pelanggan'),
('1-1004', 'Piutang Lain-lain', 'Aset', 3, false, 'Debit', 'Piutang non-usaha'),
('1-1005', 'Persediaan Barang', 'Aset', 3, false, 'Debit', 'Stok barang dagangan'),
('1-1006', 'Uang Muka Pembelian', 'Aset', 3, false, 'Debit', 'Pembayaran di muka untuk pembelian'),
('1-1007', 'Biaya Dibayar Dimuka', 'Aset', 3, false, 'Debit', 'Biaya yang dibayar untuk periode mendatang'),
('1-1008', 'PPN Masukan', 'Aset', 3, false, 'Debit', 'Pajak Pertambahan Nilai yang dapat dikreditkan'),

('1-2', 'Aset Tetap', 'Aset', 2, true, 'Debit', 'Aset jangka panjang'),
('1-2001', 'Tanah', 'Aset', 3, false, 'Debit', 'Tanah milik perusahaan'),
('1-2002', 'Bangunan', 'Aset', 3, false, 'Debit', 'Gedung dan bangunan'),
('1-2003', 'Kendaraan', 'Aset', 3, false, 'Debit', 'Kendaraan operasional'),
('1-2004', 'Peralatan Kantor', 'Aset', 3, false, 'Debit', 'Peralatan dan furniture kantor'),
('1-2005', 'Komputer & Elektronik', 'Aset', 3, false, 'Debit', 'Perangkat komputer dan elektronik'),
('1-2006', 'Akumulasi Penyusutan', 'Aset', 3, false, 'Kredit', 'Akumulasi penyusutan aset tetap'),

-- 2. KEWAJIBAN (Liabilities)
('2', 'KEWAJIBAN', 'Kewajiban', 1, true, 'Kredit', 'Kewajiban Perusahaan'),
('2-1', 'Kewajiban Lancar', 'Kewajiban', 2, true, 'Kredit', 'Kewajiban jangka pendek'),
('2-1001', 'Hutang Usaha', 'Kewajiban', 3, false, 'Kredit', 'Hutang kepada supplier'),
('2-1002', 'Hutang Lain-lain', 'Kewajiban', 3, false, 'Kredit', 'Hutang non-usaha'),
('2-1003', 'Hutang Bank Jangka Pendek', 'Kewajiban', 3, false, 'Kredit', 'Pinjaman bank < 1 tahun'),
('2-1004', 'Uang Muka Penjualan', 'Kewajiban', 3, false, 'Kredit', 'Pembayaran di muka dari pelanggan'),
('2-1005', 'PPN Keluaran', 'Kewajiban', 3, false, 'Kredit', 'Pajak Pertambahan Nilai yang harus disetor'),
('2-1006', 'PPh Pasal 21', 'Kewajiban', 3, false, 'Kredit', 'Pajak penghasilan karyawan'),
('2-1007', 'PPh Pasal 23', 'Kewajiban', 3, false, 'Kredit', 'Pajak penghasilan atas jasa'),
('2-1008', 'PPh Pasal 25', 'Kewajiban', 3, false, 'Kredit', 'Angsuran pajak penghasilan'),

('2-2', 'Kewajiban Jangka Panjang', 'Kewajiban', 2, true, 'Kredit', 'Kewajiban jangka panjang'),
('2-2001', 'Hutang Bank Jangka Panjang', 'Kewajiban', 3, false, 'Kredit', 'Pinjaman bank > 1 tahun'),
('2-2002', 'Hutang Obligasi', 'Kewajiban', 3, false, 'Kredit', 'Obligasi yang diterbitkan'),

-- 3. EKUITAS (Equity)
('3', 'EKUITAS', 'Ekuitas', 1, true, 'Kredit', 'Modal Perusahaan'),
('3-1001', 'Modal Saham', 'Ekuitas', 2, false, 'Kredit', 'Modal disetor pemilik'),
('3-1002', 'Laba Ditahan', 'Ekuitas', 2, false, 'Kredit', 'Akumulasi laba yang tidak dibagikan'),
('3-1003', 'Laba Tahun Berjalan', 'Ekuitas', 2, false, 'Kredit', 'Laba periode berjalan'),
('3-1004', 'Prive', 'Ekuitas', 2, false, 'Debit', 'Pengambilan pribadi pemilik'),

-- 4. PENDAPATAN (Revenue)
('4', 'PENDAPATAN', 'Pendapatan', 1, true, 'Kredit', 'Pendapatan Perusahaan'),
('4-1', 'Pendapatan Usaha', 'Pendapatan', 2, true, 'Kredit', 'Pendapatan dari kegiatan utama'),
('4-1001', 'Penjualan', 'Pendapatan', 3, false, 'Kredit', 'Pendapatan dari penjualan barang'),
('4-1002', 'Pendapatan Jasa', 'Pendapatan', 3, false, 'Kredit', 'Pendapatan dari jasa'),
('4-1003', 'Retur Penjualan', 'Pendapatan', 3, false, 'Debit', 'Pengembalian barang dari pelanggan'),
('4-1004', 'Potongan Penjualan', 'Pendapatan', 3, false, 'Debit', 'Diskon yang diberikan'),

-- 5. BEBAN POKOK PENJUALAN (Cost of Goods Sold)
('5', 'BEBAN POKOK PENJUALAN', 'Beban Pokok Penjualan', 1, true, 'Debit', 'HPP'),
('5-1001', 'Pembelian Barang Dagangan', 'Beban Pokok Penjualan', 2, false, 'Debit', 'Pembelian barang untuk dijual'),
('5-1002', 'Retur Pembelian', 'Beban Pokok Penjualan', 2, false, 'Kredit', 'Pengembalian barang ke supplier'),
('5-1003', 'Potongan Pembelian', 'Beban Pokok Penjualan', 2, false, 'Kredit', 'Diskon dari supplier'),
('5-1004', 'Ongkos Kirim Pembelian', 'Beban Pokok Penjualan', 2, false, 'Debit', 'Biaya pengiriman barang'),
('5-1005', 'Beban Produksi', 'Beban Pokok Penjualan', 2, false, 'Debit', 'Biaya produksi barang'),

-- 6. BEBAN OPERASIONAL (Operating Expenses)
('6', 'BEBAN OPERASIONAL', 'Beban Operasional', 1, true, 'Debit', 'Beban Usaha'),
('6-1', 'Beban Penjualan', 'Beban Operasional', 2, true, 'Debit', 'Beban terkait penjualan'),
('6-1001', 'Beban Gaji Penjualan', 'Beban Operasional', 3, false, 'Debit', 'Gaji tim penjualan'),
('6-1002', 'Beban Iklan & Promosi', 'Beban Operasional', 3, false, 'Debit', 'Biaya marketing'),
('6-1003', 'Beban Komisi Penjualan', 'Beban Operasional', 3, false, 'Debit', 'Komisi untuk sales'),
('6-1004', 'Beban Pengiriman', 'Beban Operasional', 3, false, 'Debit', 'Biaya kirim ke pelanggan'),

('6-2', 'Beban Administrasi & Umum', 'Beban Operasional', 2, true, 'Debit', 'Beban administrasi'),
('6-2001', 'Beban Gaji Karyawan', 'Beban Operasional', 3, false, 'Debit', 'Gaji karyawan administrasi'),
('6-2002', 'Beban Sewa Kantor', 'Beban Operasional', 3, false, 'Debit', 'Sewa gedung/ruangan'),
('6-2003', 'Beban Listrik & Air', 'Beban Operasional', 3, false, 'Debit', 'Utilitas kantor'),
('6-2004', 'Beban Telepon & Internet', 'Beban Operasional', 3, false, 'Debit', 'Komunikasi'),
('6-2005', 'Beban Perlengkapan Kantor', 'Beban Operasional', 3, false, 'Debit', 'ATK dan supplies'),
('6-2006', 'Beban Pemeliharaan & Perbaikan', 'Beban Operasional', 3, false, 'Debit', 'Maintenance'),
('6-2007', 'Beban Penyusutan', 'Beban Operasional', 3, false, 'Debit', 'Depresiasi aset'),
('6-2008', 'Beban Asuransi', 'Beban Operasional', 3, false, 'Debit', 'Premi asuransi'),
('6-2009', 'Beban Perjalanan Dinas', 'Beban Operasional', 3, false, 'Debit', 'Biaya perjalanan'),
('6-2010', 'Beban Konsultan & Profesional', 'Beban Operasional', 3, false, 'Debit', 'Jasa konsultan'),
('6-2011', 'Beban Lain-lain', 'Beban Operasional', 3, false, 'Debit', 'Beban operasional lainnya'),

-- 7. PENDAPATAN & BEBAN LAIN-LAIN (Other Income & Expenses)
('7', 'PENDAPATAN & BEBAN LAIN-LAIN', 'Pendapatan & Beban Lain-lain', 1, true, 'Kredit', 'Non-operasional'),
('7-1', 'Pendapatan Lain-lain', 'Pendapatan & Beban Lain-lain', 2, true, 'Kredit', 'Pendapatan non-usaha'),
('7-1001', 'Pendapatan Bunga', 'Pendapatan & Beban Lain-lain', 3, false, 'Kredit', 'Bunga dari bank/investasi'),
('7-1002', 'Pendapatan Sewa', 'Pendapatan & Beban Lain-lain', 3, false, 'Kredit', 'Pendapatan dari sewa aset'),
('7-1003', 'Laba Penjualan Aset', 'Pendapatan & Beban Lain-lain', 3, false, 'Kredit', 'Keuntungan jual aset'),
('7-1004', 'Pendapatan Lain', 'Pendapatan & Beban Lain-lain', 3, false, 'Kredit', 'Pendapatan lain-lain'),

('7-2', 'Beban Lain-lain', 'Pendapatan & Beban Lain-lain', 2, true, 'Debit', 'Beban non-usaha'),
('7-2001', 'Beban Bunga', 'Pendapatan & Beban Lain-lain', 3, false, 'Debit', 'Bunga pinjaman'),
('7-2002', 'Beban Administrasi Bank', 'Pendapatan & Beban Lain-lain', 3, false, 'Debit', 'Biaya bank'),
('7-2003', 'Rugi Penjualan Aset', 'Pendapatan & Beban Lain-lain', 3, false, 'Debit', 'Kerugian jual aset'),
('7-2004', 'Beban Denda', 'Pendapatan & Beban Lain-lain', 3, false, 'Debit', 'Denda dan penalti'),
('7-2005', 'Beban Pajak', 'Pendapatan & Beban Lain-lain', 3, false, 'Debit', 'Beban pajak penghasilan'),
('7-2006', 'Beban Lain', 'Pendapatan & Beban Lain-lain', 3, false, 'Debit', 'Beban lain-lain')

ON CONFLICT (account_code) DO UPDATE SET
  account_name = EXCLUDED.account_name,
  account_type = EXCLUDED.account_type,
  level = EXCLUDED.level,
  is_header = EXCLUDED.is_header,
  normal_balance = EXCLUDED.normal_balance,
  description = EXCLUDED.description,
  updated_at = NOW();
