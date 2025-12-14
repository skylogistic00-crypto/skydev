-- Memastikan semua akun COA yang diminta sudah ada
-- Menggunakan INSERT ... ON CONFLICT untuk menghindari duplikasi

-- A. ASET (1-0000) - Aset Lancar
INSERT INTO chart_of_accounts (account_code, account_name, account_type, level, is_header, normal_balance, description) VALUES
('1-1100', 'Kas di Tangan', 'Aset', 4, false, 'Debit', 'Kas fisik di tangan'),
('1-1200', 'Kas di Bank', 'Aset', 3, true, 'Debit', 'Rekening bank perusahaan'),
('1-1300', 'Piutang Usaha', 'Aset', 3, true, 'Debit', 'Piutang dari pelanggan'),
('1-1400', 'Persediaan Bahan Kemasan/Packaging', 'Aset', 3, true, 'Debit', 'Persediaan bahan kemasan untuk pembelian material'),
('1-1700', 'Piutang Pajak (PPN Masukan)', 'Aset', 3, true, 'Debit', 'Piutang pajak dari pemerintah')
ON CONFLICT (account_code) DO UPDATE SET
  account_name = EXCLUDED.account_name,
  description = EXCLUDED.description;

-- B. KEWAJIBAN (2-0000) - Kewajiban Lancar
INSERT INTO chart_of_accounts (account_code, account_name, account_type, level, is_header, normal_balance, description) VALUES
('2-1500', 'Hutang Pajak (PPN Keluaran, PPh 21,23,25)', 'Kewajiban', 3, true, 'Kredit', 'Hutang pajak kepada pemerintah')
ON CONFLICT (account_code) DO UPDATE SET
  account_name = EXCLUDED.account_name,
  description = EXCLUDED.description;

-- D. PENDAPATAN (4-0000) - Untuk Pemetaan
INSERT INTO chart_of_accounts (account_code, account_name, account_type, level, is_header, normal_balance, description) VALUES
('4-1000', 'Pendapatan Jasa Cargo', 'Pendapatan', 2, true, 'Kredit', 'Pendapatan dari jasa pengiriman'),
('4-1110', 'Pend. Cargo Udara Domestik', 'Pendapatan', 4, false, 'Kredit', 'Pendapatan cargo udara domestik'),
('4-1120', 'Pend. Cargo Udara Internasional', 'Pendapatan', 4, false, 'Kredit', 'Pendapatan cargo udara internasional'),
('4-1210', 'Pend. Cargo Laut (LCL)', 'Pendapatan', 4, false, 'Kredit', 'Pendapatan cargo laut Less than Container Load'),
('4-1220', 'Pend. Cargo Laut (FCL)', 'Pendapatan', 4, false, 'Kredit', 'Pendapatan cargo laut Full Container Load'),
('4-1300', 'Pend. Cargo Darat', 'Pendapatan', 4, false, 'Kredit', 'Pendapatan cargo darat'),
('4-1400', 'Pendapatan Layanan Tambahan', 'Pendapatan', 3, true, 'Kredit', 'Pendapatan layanan tambahan'),
('4-1410', 'Pend. Asuransi Pengiriman', 'Pendapatan', 4, false, 'Kredit', 'Pendapatan asuransi pengiriman'),
('4-1420', 'Pend. Jasa Packing/Kemasan', 'Pendapatan', 4, false, 'Kredit', 'Pendapatan jasa packing dan kemasan'),
('4-2000', 'Pendapatan Jasa Gudang', 'Pendapatan', 2, true, 'Kredit', 'Pendapatan dari jasa pergudangan'),
('4-2110', 'Pend. Sewa Gudang', 'Pendapatan', 4, false, 'Kredit', 'Pendapatan sewa gudang'),
('4-2120', 'Pend. Jasa Penyimpanan (Storage)', 'Pendapatan', 4, false, 'Kredit', 'Pendapatan jasa penyimpanan'),
('4-2210', 'Pend. Jasa Penanganan Barang', 'Pendapatan', 4, false, 'Kredit', 'Pendapatan jasa penanganan barang')
ON CONFLICT (account_code) DO UPDATE SET
  account_name = EXCLUDED.account_name,
  description = EXCLUDED.description;

-- E. BEBAN POKOK PENJUALAN (5-0000) - Untuk Pemetaan
INSERT INTO chart_of_accounts (account_code, account_name, account_type, level, is_header, normal_balance, description) VALUES
('5-1000', 'Beban Pokok Jasa Cargo', 'Beban Pokok Penjualan', 2, true, 'Debit', 'Biaya langsung jasa cargo'),
('5-1110', 'Biaya Angkut ke Agen Utama', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Biaya angkut ke agen utama (Udara/Laut/Darat)'),
('5-1120', 'Biaya Bongkar Muat', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Biaya bongkar muat di bandara/pelabuhan'),
('5-1130', 'Biaya Asuransi Pengiriman', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Biaya asuransi pengiriman'),
('5-1140', 'Biaya Kemasan/Packaging Material', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Biaya kemasan dan packaging material'),
('5-2000', 'Beban Pokok Jasa Gudang', 'Beban Pokok Penjualan', 2, true, 'Debit', 'Biaya langsung jasa gudang'),
('5-2110', 'Biaya Tenaga Kerja Langsung Gudang', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Biaya tenaga kerja langsung gudang'),
('5-2120', 'Biaya Listrik, Air, & Telepon Gudang', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Biaya listrik, air, dan telepon gudang'),
('5-2130', 'Biaya Sewa Gedung/Tanah', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Biaya sewa gedung/tanah (jika gudang disewa)'),
('5-2140', 'Biaya Perawatan Peralatan Gudang', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Biaya perawatan dan perbaikan peralatan gudang')
ON CONFLICT (account_code) DO UPDATE SET
  account_name = EXCLUDED.account_name,
  description = EXCLUDED.description;

COMMENT ON TABLE chart_of_accounts IS 'Chart of Accounts untuk PT. Solusi Logistik Nusantara - Semua akun yang diminta telah ditambahkan';
