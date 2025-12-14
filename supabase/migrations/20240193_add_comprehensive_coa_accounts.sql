INSERT INTO chart_of_accounts (account_code, account_name, account_type, level, is_header, normal_balance, description) VALUES

('1-1450', 'Persediaan Barang Dagangan', 'Aset', 4, false, 'Debit', 'Persediaan barang untuk dijual kembali'),
('1-1460', 'Persediaan Barang Dalam Perjalanan', 'Aset', 4, false, 'Debit', 'Barang yang sedang dalam pengiriman'),
('1-1470', 'Persediaan Suku Cadang', 'Aset', 4, false, 'Debit', 'Suku cadang kendaraan dan peralatan'),
('1-1480', 'Persediaan Bahan Baku', 'Aset', 4, false, 'Debit', 'Bahan baku untuk produksi'),
('1-1490', 'Persediaan Barang Jadi', 'Aset', 4, false, 'Debit', 'Produk jadi siap jual'),
('1-1495', 'Persediaan Barang Setengah Jadi', 'Aset', 4, false, 'Debit', 'Produk dalam proses produksi'),

('1-1550', 'Pajak Dibayar Dimuka - Lainnya', 'Aset', 4, false, 'Debit', 'Pajak lain yang dibayar dimuka'),
('1-1560', 'Biaya Maintenance Dibayar Dimuka', 'Aset', 4, false, 'Debit', 'Kontrak maintenance yang dibayar dimuka'),
('1-1570', 'Langganan & Subscription Dibayar Dimuka', 'Aset', 4, false, 'Debit', 'Biaya langganan software/layanan'),

('1-1640', 'Piutang Pemegang Saham', 'Aset', 4, false, 'Debit', 'Pinjaman kepada pemegang saham'),
('1-1650', 'Piutang Perusahaan Afiliasi', 'Aset', 4, false, 'Debit', 'Piutang dari perusahaan terkait'),
('1-1660', 'Klaim Asuransi', 'Aset', 4, false, 'Debit', 'Klaim yang diajukan ke perusahaan asuransi'),

('1-1760', 'PPh Pasal 4(2) Dibayar Dimuka', 'Aset', 4, false, 'Debit', 'PPh final yang dipotong pihak lain'),
('1-1770', 'PPh Pasal 15 Dibayar Dimuka', 'Aset', 4, false, 'Debit', 'PPh 15 yang dipotong'),
('1-1780', 'Pajak Pertambahan Nilai Lebih Bayar', 'Aset', 4, false, 'Debit', 'Kelebihan pembayaran PPN'),

('1-2700', 'Aset Dalam Penyelesaian', 'Aset', 3, true, 'Debit', 'Aset yang sedang dalam konstruksi'),
('1-2710', 'Bangunan Dalam Penyelesaian', 'Aset', 4, false, 'Debit', 'Konstruksi bangunan yang belum selesai'),
('1-2720', 'Instalasi Dalam Penyelesaian', 'Aset', 4, false, 'Debit', 'Instalasi peralatan yang belum selesai'),

('1-2800', 'Hak Atas Tanah', 'Aset', 3, false, 'Debit', 'Hak guna bangunan/hak pakai'),
('1-2900', 'Aset Tak Berwujud', 'Aset', 3, true, 'Debit', 'Aset tidak berwujud'),
('1-2910', 'Hak Paten', 'Aset', 4, false, 'Debit', 'Hak paten yang dimiliki'),
('1-2920', 'Hak Cipta', 'Aset', 4, false, 'Debit', 'Hak cipta yang dimiliki'),
('1-2930', 'Merek Dagang', 'Aset', 4, false, 'Debit', 'Merek dagang terdaftar'),
('1-2940', 'Lisensi', 'Aset', 4, false, 'Debit', 'Lisensi usaha dan operasional'),
('1-2950', 'Akumulasi Amortisasi Aset Tak Berwujud', 'Aset', 4, false, 'Kredit', 'Akumulasi amortisasi aset tak berwujud'),

('1-3300', 'Aset Pajak Tangguhan', 'Aset', 3, false, 'Debit', 'Aset pajak tangguhan'),
('1-3400', 'Jaminan & Deposit Jangka Panjang', 'Aset', 3, false, 'Debit', 'Deposit jangka panjang'),

('2-1160', 'Hutang Usaha - Vendor IT', 'Kewajiban', 4, false, 'Kredit', 'Hutang pembelian software/hardware'),
('2-1170', 'Hutang Usaha - Vendor Lainnya', 'Kewajiban', 4, false, 'Kredit', 'Hutang vendor lain'),

('2-1280', 'Hutang Retribusi', 'Kewajiban', 4, false, 'Kredit', 'Retribusi daerah yang belum dibayar'),

('2-1380', 'Hutang Pesangon', 'Kewajiban', 4, false, 'Kredit', 'Cadangan pesangon karyawan'),
('2-1390', 'Hutang Cuti', 'Kewajiban', 4, false, 'Kredit', 'Hutang cuti karyawan yang belum diambil'),

('2-1460', 'Hutang Pemegang Saham', 'Kewajiban', 4, false, 'Kredit', 'Pinjaman dari pemegang saham'),
('2-1470', 'Hutang Perusahaan Afiliasi', 'Kewajiban', 4, false, 'Kredit', 'Hutang ke perusahaan terkait'),
('2-1480', 'Pendapatan Diterima Dimuka', 'Kewajiban', 4, false, 'Kredit', 'Pendapatan yang belum direalisasi'),
('2-1490', 'Hutang Jaminan Pelanggan', 'Kewajiban', 4, false, 'Kredit', 'Deposit jaminan dari pelanggan'),

('2-2500', 'Kewajiban Pajak Tangguhan', 'Kewajiban', 3, false, 'Kredit', 'Kewajiban pajak tangguhan'),
('2-2600', 'Kewajiban Imbalan Kerja', 'Kewajiban', 3, false, 'Kredit', 'Kewajiban imbalan pasca kerja'),
('2-2700', 'Kewajiban Kontinjensi', 'Kewajiban', 3, false, 'Kredit', 'Kewajiban yang mungkin terjadi'),

('3-7000', 'Saldo Laba Belum Ditentukan Penggunaannya', 'Ekuitas', 2, false, 'Kredit', 'Laba yang belum dialokasikan'),
('3-8000', 'Cadangan Umum', 'Ekuitas', 2, false, 'Kredit', 'Cadangan untuk keperluan umum'),
('3-9000', 'Selisih Penilaian Kembali Aset Tetap', 'Ekuitas', 2, false, 'Kredit', 'Revaluasi aset tetap'),

('4-1350', 'Pendapatan Jasa Dokumentasi', 'Pendapatan', 3, false, 'Kredit', 'Jasa pengurusan dokumen ekspor/impor'),
('4-1360', 'Pendapatan Jasa Konsultasi Logistik', 'Pendapatan', 3, false, 'Kredit', 'Konsultasi supply chain'),
('4-1370', 'Pendapatan Jasa Tracking & Monitoring', 'Pendapatan', 3, false, 'Kredit', 'Layanan pelacakan barang'),

('4-2800', 'Pendapatan Jasa Kitting & Assembly', 'Pendapatan', 3, false, 'Kredit', 'Perakitan dan pengemasan khusus'),
('4-2900', 'Pendapatan Jasa Quality Control', 'Pendapatan', 3, false, 'Kredit', 'Inspeksi dan quality check'),
('4-3000', 'Pendapatan Jasa Fumigasi', 'Pendapatan', 3, false, 'Kredit', 'Jasa fumigasi barang ekspor'),
('4-3100', 'Pendapatan Jasa Cold Storage', 'Pendapatan', 3, false, 'Kredit', 'Penyimpanan barang berpendingin'),
('4-3200', 'Pendapatan Jasa Stuffing & Unstuffing', 'Pendapatan', 3, false, 'Kredit', 'Muat dan bongkar kontainer'),

('4-9600', 'Laba Selisih Kurs Realisasi', 'Pendapatan', 3, false, 'Kredit', 'Keuntungan kurs yang direalisasi'),
('4-9700', 'Pendapatan Klaim Asuransi', 'Pendapatan', 3, false, 'Kredit', 'Klaim asuransi yang diterima'),
('4-9800', 'Pendapatan Subsidi Pemerintah', 'Pendapatan', 3, false, 'Kredit', 'Subsidi atau bantuan pemerintah'),

('5-1800', 'Biaya Dokumen Ekspor/Impor', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Biaya pengurusan dokumen'),
('5-1900', 'Biaya Fumigasi', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Biaya fumigasi barang'),
('5-2000', 'Biaya Stuffing & Unstuffing', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Biaya muat bongkar kontainer'),

('5-2700', 'Biaya Sewa Peralatan Gudang', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Sewa forklift, pallet jack'),
('5-2800', 'Biaya Keamanan Gudang', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Security dan CCTV gudang'),
('5-2900', 'Biaya Air Gudang', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Tagihan air gudang'),
('5-3000', 'Biaya Kebersihan Gudang', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Cleaning service gudang'),

('5-3400', 'Penyusutan Peralatan Handling', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Penyusutan pallet jack, hand truck'),
('5-4000', 'Biaya Tenaga Kerja Langsung', 'Beban Pokok Penjualan', 2, true, 'Debit', 'Upah tenaga kerja langsung'),
('5-4100', 'Upah Buruh Harian', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Upah buruh harian lepas'),
('5-4200', 'Upah Lembur Operasional', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Lembur untuk operasional langsung'),

('5-5000', 'Biaya Overhead Pabrik', 'Beban Pokok Penjualan', 2, true, 'Debit', 'Biaya overhead manufaktur'),
('5-5100', 'Biaya Bahan Penolong', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Bahan pendukung produksi'),
('5-5200', 'Biaya Listrik Pabrik', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Listrik untuk produksi'),
('5-5300', 'Biaya Air Pabrik', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Air untuk produksi'),
('5-5400', 'Biaya Maintenance Mesin Produksi', 'Beban Pokok Penjualan', 3, false, 'Debit', 'Perawatan mesin produksi'),

('6-2900', 'Biaya Pos & Kurir', 'Beban Operasional', 3, false, 'Debit', 'Pengiriman dokumen'),
('6-3000', 'Biaya Fotokopi & Cetak', 'Beban Operasional', 3, false, 'Debit', 'Biaya cetak dokumen'),

('6-3700', 'Biaya Website & Digital Marketing', 'Beban Operasional', 3, false, 'Debit', 'Biaya marketing digital'),
('6-3800', 'Biaya Sponsorship', 'Beban Operasional', 3, false, 'Debit', 'Sponsorship acara'),
('6-3900', 'Biaya Riset Pasar', 'Beban Operasional', 3, false, 'Debit', 'Riset dan survei pasar'),

('6-4600', 'Biaya Sewa Kendaraan', 'Beban Operasional', 3, false, 'Debit', 'Sewa kendaraan operasional'),

('6-5500', 'Biaya Backup & Cloud Storage', 'Beban Operasional', 3, false, 'Debit', 'Biaya penyimpanan data cloud'),
('6-5600', 'Biaya Cybersecurity', 'Beban Operasional', 3, false, 'Debit', 'Biaya keamanan sistem'),

('6-7000', 'Beban Penelitian & Pengembangan', 'Beban Operasional', 2, true, 'Debit', 'Biaya R&D'),
('6-7100', 'Biaya Riset & Pengembangan Produk', 'Beban Operasional', 3, false, 'Debit', 'R&D produk baru'),
('6-7200', 'Biaya Prototype & Testing', 'Beban Operasional', 3, false, 'Debit', 'Biaya pembuatan prototype'),

('6-8000', 'Beban Kualitas & Sertifikasi', 'Beban Operasional', 2, true, 'Debit', 'Biaya quality assurance'),
('6-8100', 'Biaya Sertifikasi ISO', 'Beban Operasional', 3, false, 'Debit', 'Biaya sertifikasi ISO'),
('6-8200', 'Biaya Audit Eksternal', 'Beban Operasional', 3, false, 'Debit', 'Biaya audit laporan keuangan'),
('6-8300', 'Biaya Quality Control', 'Beban Operasional', 3, false, 'Debit', 'Biaya pengendalian kualitas'),

('6-9000', 'Beban Lingkungan & K3', 'Beban Operasional', 2, true, 'Debit', 'Biaya lingkungan dan keselamatan kerja'),
('6-9100', 'Biaya Pengelolaan Limbah', 'Beban Operasional', 3, false, 'Debit', 'Biaya pembuangan limbah'),
('6-9200', 'Biaya Keselamatan Kerja (K3)', 'Beban Operasional', 3, false, 'Debit', 'APD dan pelatihan K3'),
('6-9300', 'Biaya Amdal & Lingkungan', 'Beban Operasional', 3, false, 'Debit', 'Biaya analisis dampak lingkungan'),

('7-1500', 'Pendapatan Dividen', 'Pendapatan & Beban Lain-lain', 3, false, 'Kredit', 'Dividen dari investasi'),
('7-1600', 'Pendapatan Royalti', 'Pendapatan & Beban Lain-lain', 3, false, 'Kredit', 'Pendapatan dari royalti'),
('7-1700', 'Laba Pelepasan Investasi', 'Pendapatan & Beban Lain-lain', 3, false, 'Kredit', 'Keuntungan jual investasi'),

('7-2600', 'Beban Provisi & Komisi Bank', 'Pendapatan & Beban Lain-lain', 3, false, 'Debit', 'Provisi kredit dan komisi'),
('7-2700', 'Rugi Pelepasan Investasi', 'Pendapatan & Beban Lain-lain', 3, false, 'Debit', 'Kerugian jual investasi'),
('7-2800', 'Beban Penurunan Nilai Aset', 'Pendapatan & Beban Lain-lain', 3, false, 'Debit', 'Impairment loss'),
('7-2900', 'Beban Restrukturisasi', 'Pendapatan & Beban Lain-lain', 3, false, 'Debit', 'Biaya restrukturisasi perusahaan'),

('8-0000', 'AKUN PENUTUP', 'Beban Operasional', 1, true, 'Debit', 'Akun untuk penutupan periode'),
('8-1000', 'Ikhtisar Laba Rugi', 'Beban Operasional', 2, false, 'Debit', 'Akun penutup laba rugi'),
('8-2000', 'Penutup Pendapatan', 'Beban Operasional', 2, false, 'Debit', 'Akun penutup pendapatan'),
('8-3000', 'Penutup Beban', 'Beban Operasional', 2, false, 'Kredit', 'Akun penutup beban')

ON CONFLICT (account_code) DO NOTHING;
