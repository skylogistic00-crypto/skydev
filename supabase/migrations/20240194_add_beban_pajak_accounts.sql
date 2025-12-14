INSERT INTO chart_of_accounts (account_code, account_name, account_type, level, is_header, normal_balance, description) VALUES

('6-6000', 'BEBAN PAJAK', 'Beban Operasional', 2, true, 'Debit', 'Kelompok beban pajak perusahaan'),

('6-6100', 'Beban Pajak Penghasilan Badan', 'Beban Operasional', 3, false, 'Debit', 'PPh Badan Pasal 25 dan 29'),
('6-6110', 'Beban PPh Pasal 25', 'Beban Operasional', 4, false, 'Debit', 'Angsuran PPh Badan bulanan'),
('6-6120', 'Beban PPh Pasal 29', 'Beban Operasional', 4, false, 'Debit', 'Kurang bayar PPh Badan tahunan'),

('6-6200', 'Beban PPh Pasal 21', 'Beban Operasional', 3, false, 'Debit', 'PPh 21 karyawan yang ditanggung perusahaan'),
('6-6210', 'Beban PPh 21 Karyawan Tetap', 'Beban Operasional', 4, false, 'Debit', 'PPh 21 untuk karyawan tetap'),
('6-6220', 'Beban PPh 21 Karyawan Tidak Tetap', 'Beban Operasional', 4, false, 'Debit', 'PPh 21 untuk karyawan kontrak/harian'),
('6-6230', 'Beban PPh 21 Tenaga Ahli', 'Beban Operasional', 4, false, 'Debit', 'PPh 21 untuk konsultan/tenaga ahli'),

('6-6300', 'Beban PPh Pasal 23', 'Beban Operasional', 3, false, 'Debit', 'PPh 23 atas jasa yang diterima'),
('6-6310', 'Beban PPh 23 Jasa', 'Beban Operasional', 4, false, 'Debit', 'PPh 23 atas jasa konsultan, sewa, dll'),
('6-6320', 'Beban PPh 23 Sewa', 'Beban Operasional', 4, false, 'Debit', 'PPh 23 atas sewa gedung/kendaraan'),
('6-6330', 'Beban PPh 23 Royalti', 'Beban Operasional', 4, false, 'Debit', 'PPh 23 atas royalti'),

('6-6400', 'Beban PPh Pasal 4 Ayat 2 (Final)', 'Beban Operasional', 3, false, 'Debit', 'PPh Final yang ditanggung perusahaan'),
('6-6410', 'Beban PPh Final Sewa Tanah/Bangunan', 'Beban Operasional', 4, false, 'Debit', 'PPh Final 10% sewa properti'),
('6-6420', 'Beban PPh Final Jasa Konstruksi', 'Beban Operasional', 4, false, 'Debit', 'PPh Final jasa konstruksi'),
('6-6430', 'Beban PPh Final Bunga Deposito', 'Beban Operasional', 4, false, 'Debit', 'PPh Final 20% bunga deposito'),

('6-6500', 'Beban PPh Pasal 15', 'Beban Operasional', 3, false, 'Debit', 'PPh 15 untuk perusahaan pelayaran'),
('6-6510', 'Beban PPh 15 Pelayaran Dalam Negeri', 'Beban Operasional', 4, false, 'Debit', 'PPh 15 untuk pelayaran domestik'),
('6-6520', 'Beban PPh 15 Pelayaran Luar Negeri', 'Beban Operasional', 4, false, 'Debit', 'PPh 15 untuk pelayaran internasional'),

('6-6600', 'Beban PPh Pasal 22', 'Beban Operasional', 3, false, 'Debit', 'PPh 22 impor dan pembelian'),
('6-6610', 'Beban PPh 22 Impor', 'Beban Operasional', 4, false, 'Debit', 'PPh 22 atas impor barang'),
('6-6620', 'Beban PPh 22 Pembelian Barang', 'Beban Operasional', 4, false, 'Debit', 'PPh 22 pembelian dari bendahara'),

('6-6700', 'Beban PPh Pasal 26', 'Beban Operasional', 3, false, 'Debit', 'PPh 26 untuk wajib pajak luar negeri'),
('6-6710', 'Beban PPh 26 Dividen', 'Beban Operasional', 4, false, 'Debit', 'PPh 26 atas dividen ke luar negeri'),
('6-6720', 'Beban PPh 26 Bunga', 'Beban Operasional', 4, false, 'Debit', 'PPh 26 atas bunga ke luar negeri'),
('6-6730', 'Beban PPh 26 Royalti', 'Beban Operasional', 4, false, 'Debit', 'PPh 26 atas royalti ke luar negeri'),
('6-6740', 'Beban PPh 26 Jasa', 'Beban Operasional', 4, false, 'Debit', 'PPh 26 atas jasa ke luar negeri'),

('6-6800', 'Beban Pajak Daerah', 'Beban Operasional', 3, false, 'Debit', 'Pajak daerah dan retribusi'),
('6-6810', 'Beban Pajak Bumi dan Bangunan (PBB)', 'Beban Operasional', 4, false, 'Debit', 'PBB tanah dan bangunan'),
('6-6820', 'Beban Pajak Kendaraan Bermotor', 'Beban Operasional', 4, false, 'Debit', 'Pajak kendaraan operasional'),
('6-6830', 'Beban Pajak Reklame', 'Beban Operasional', 4, false, 'Debit', 'Pajak papan reklame'),
('6-6840', 'Beban Retribusi Daerah', 'Beban Operasional', 4, false, 'Debit', 'Retribusi izin dan perizinan'),
('6-6850', 'Beban Pajak Hotel & Restoran', 'Beban Operasional', 4, false, 'Debit', 'Pajak untuk penginapan dinas'),

('6-6900', 'Beban Bea Masuk & Cukai', 'Beban Operasional', 3, false, 'Debit', 'Bea masuk dan cukai'),
('6-6910', 'Beban Bea Masuk', 'Beban Operasional', 4, false, 'Debit', 'Bea masuk impor barang'),
('6-6920', 'Beban Bea Keluar', 'Beban Operasional', 4, false, 'Debit', 'Bea keluar ekspor barang'),
('6-6930', 'Beban Cukai', 'Beban Operasional', 4, false, 'Debit', 'Cukai barang tertentu'),

('6-6950', 'Beban Denda & Sanksi Pajak', 'Beban Operasional', 3, false, 'Debit', 'Denda keterlambatan pajak'),
('6-6960', 'Beban Bunga Pajak', 'Beban Operasional', 3, false, 'Debit', 'Bunga atas keterlambatan pajak'),
('6-6970', 'Beban Koreksi Pajak', 'Beban Operasional', 3, false, 'Debit', 'Koreksi fiskal dari pemeriksaan pajak')

ON CONFLICT (account_code) DO NOTHING;
