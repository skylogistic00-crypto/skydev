-- Revisi BEBAN POKOK PENJUALAN dan BEBAN OPERASIONAL
-- Menghapus akun lama dan memasukkan struktur baru yang lebih detail

-- Hapus akun kategori 5 dan 6 yang lama
DELETE FROM chart_of_accounts WHERE account_code LIKE '5-%';
DELETE FROM chart_of_accounts WHERE account_code LIKE '6-%';

-- E. BEBAN POKOK PENJUALAN / COST OF REVENUE (5-0000)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, level, is_header, normal_balance, description) VALUES
('5-0000', 'BEBAN POKOK PENJUALAN', 'Beban Pokok Penjualan', 1, true, 'Debit', 'Biaya langsung untuk menghasilkan pendapatan - KRUSIAL UNTUK MENGUKUR PROFITABILITAS LAYANAN'),

-- Beban Pokok Jasa Cargo (5-1000)
('5-1000', 'Beban Pokok Jasa Cargo', 'Beban Pokok Penjualan', 2, true, 'Debit', 'Biaya langsung jasa cargo/pengiriman'),
('5-1110', 'Biaya Angkut ke Agen Utama (Udara/Laut/Darat)', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Biaya pengiriman ke agen utama'),
('5-1120', 'Biaya Bongkar Muat di Bandara/Pelabuhan', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Biaya handling di terminal'),
('5-1130', 'Biaya Asuransi Pengiriman', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Premi asuransi yang dibayar ke pihak asuransi'),
('5-1140', 'Biaya Kemasan/Packaging Material', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Biaya bahan kemasan untuk cargo'),
('5-1150', 'Biaya Cetak Dokumen (Air Waybill, Manifest)', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Biaya cetak dokumen pengiriman'),

-- Beban Pokok Jasa Gudang (5-2000)
('5-2000', 'Beban Pokok Jasa Gudang', 'Beban Pokok Penjualan', 2, true, 'Debit', 'Biaya langsung jasa pergudangan'),
('5-2110', 'Biaya Tenaga Kerja Langsung Gudang', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Gaji staff gudang yang terlibat langsung'),
('5-2120', 'Biaya Listrik, Air, & Telepon Gudang', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Utilitas operasional gudang'),
('5-2130', 'Biaya Sewa Gedung/Tanah (jika gudang disewa)', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Sewa gudang untuk operasional'),
('5-2140', 'Biaya Perawatan & Perbaikan Peralatan Gudang', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Maintenance forklift, rak, dll'),
('5-2150', 'Biaya Keamanan Gudang', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Biaya security gudang');

-- F. BEBAN OPERASIONAL (6-0000)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, level, is_header, normal_balance, description) VALUES
('6-0000', 'BEBAN OPERASIONAL', 'Beban Operasional', 1, true, 'Debit', 'Biaya untuk menjalankan bisnis'),

-- Beban Penjualan & Pemasaran (6-1000)
('6-1000', 'Beban Penjualan & Pemasaran', 'Beban Operasional', 2, true, 'Debit', 'Biaya marketing dan sales'),
('6-1110', 'Gaji & Komisi Sales/Marketing', 'Beban Operasional', 3, false, 'Debit', 'Gaji dan komisi tim penjualan'),
('6-1120', 'Biaya Iklan dan Promosi', 'Beban Operasional', 3, false, 'Debit', 'Biaya iklan online dan offline'),
('6-1130', 'Biaya Perjalanan Dinas & Hiburan', 'Beban Operasional', 3, false, 'Debit', 'Transport, hotel, dan entertainment'),
('6-1140', 'Biaya Komisi dan Fee Penjualan', 'Beban Operasional', 3, false, 'Debit', 'Komisi dan fee untuk sales'),

-- Beban Umum & Administrasi (6-2000)
('6-2000', 'Beban Umum & Administrasi', 'Beban Operasional', 2, true, 'Debit', 'Biaya administrasi dan umum'),
('6-2110', 'Gaji & Tunjangan Karyawan Kantor (Admin, Akuntansi, HR)', 'Beban Operasional', 3, false, 'Debit', 'Gaji karyawan kantor'),
('6-2120', 'Biaya Sewa Kantor', 'Beban Operasional', 3, false, 'Debit', 'Sewa gedung kantor'),
('6-2130', 'Biaya Listrik, Air, Telepon & Internet Kantor', 'Beban Operasional', 3, false, 'Debit', 'Utilitas kantor'),
('6-2140', 'Biaya Perlengkapan Kantor', 'Beban Operasional', 3, false, 'Debit', 'ATK dan supplies kantor'),
('6-2150', 'Biaya Legal, Perizinan, dan Konsultan', 'Beban Operasional', 3, false, 'Debit', 'Biaya legal dan konsultan'),
('6-2160', 'Biaya Asuransi Kendaraan dan Gedung', 'Beban Operasional', 3, false, 'Debit', 'Premi asuransi aset'),
('6-2170', 'Biaya Penyusutan Aset Tetap Kantor', 'Beban Operasional', 3, false, 'Debit', 'Penyusutan aset kantor'),
('6-2180', 'Biaya Perbaikan & Pemeliharaan Umum', 'Beban Operasional', 3, false, 'Debit', 'Maintenance umum'),
('6-2190', 'Biaya Pelatihan dan Pengembangan', 'Beban Operasional', 3, false, 'Debit', 'Training karyawan'),

-- Beban Pajak Langsung & Bukan Pajak Penghasilan (6-2800)
('6-2800', 'Beban Pajak Langsung & Bukan Pajak Penghasilan', 'Beban Operasional', 2, true, 'Debit', 'Pajak non-PPh'),
('6-2810', 'Beban Pajak Kendaraan Bermotor', 'Beban Operasional', 3, false, 'Debit', 'Pajak kendaraan tahunan'),
('6-2820', 'Beban Pajak Reklame', 'Beban Operasional', 3, false, 'Debit', 'Pajak reklame/papan nama'),
('6-2830', 'Beban Retribusi Daerah', 'Beban Operasional', 3, false, 'Debit', 'Retribusi pemerintah daerah'),
('6-2840', 'Beban Materai', 'Beban Operasional', 3, false, 'Debit', 'Biaya materai dokumen'),

-- Beban Pajak Penghasilan (PPh) (6-2900)
('6-2900', 'Beban Pajak Penghasilan (PPh)', 'Beban Operasional', 2, true, 'Debit', 'Beban PPh perusahaan'),
('6-2910', 'Beban PPh Pasal 21', 'Beban Operasional', 3, false, 'Debit', 'PPh 21 atas gaji karyawan'),
('6-2920', 'Beban PPh Pasal 23', 'Beban Operasional', 3, false, 'Debit', 'PPh 23 atas jasa'),
('6-2930', 'Beban PPh Pasal 25/29', 'Beban Operasional', 3, false, 'Debit', 'PPh 25 angsuran dan PPh 29'),
('6-2940', 'Beban Pajak Final (Ps 4(2))', 'Beban Operasional', 3, false, 'Debit', 'PPh Final Pasal 4 ayat 2');
