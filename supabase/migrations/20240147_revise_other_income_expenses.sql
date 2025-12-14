-- Revisi PENDAPATAN & BEBAN LAIN-LAIN
-- Menghapus akun kategori 7 yang lama dan memasukkan struktur baru

-- Hapus akun kategori 7 yang lama
DELETE FROM chart_of_accounts WHERE account_code LIKE '7-%';

-- G. PENDAPATAN & BEBAN LAIN-LAIN (7-0000)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, level, is_header, normal_balance, description) VALUES
('7-0000', 'PENDAPATAN & BEBAN LAIN-LAIN', 'Pendapatan & Beban Lain-lain', 1, true, 'Kredit', 'Pendapatan dan beban di luar operasional'),

-- Pendapatan Lain-lain (7-1000)
('7-1000', 'Pendapatan Lain-lain', 'Pendapatan & Beban Lain-lain', 2, true, 'Kredit', 'Pendapatan non-operasional'),
('7-1100', 'Pendapatan Bunga Bank', 'Pendapatan & Beban Lain-lain', 3, false, 'Kredit', 'Bunga dari deposito dan tabungan bank'),
('7-1200', 'Keuntungan Selisih Kurs', 'Pendapatan & Beban Lain-lain', 3, false, 'Kredit', 'Keuntungan dari selisih nilai tukar mata uang'),
('7-1300', 'Keuntungan Penjualan Aset Tetap', 'Pendapatan & Beban Lain-lain', 3, false, 'Kredit', 'Keuntungan dari penjualan aset tetap'),

-- Beban Lain-lain (7-2000)
('7-2000', 'Beban Lain-lain', 'Pendapatan & Beban Lain-lain', 2, true, 'Debit', 'Beban non-operasional'),
('7-2100', 'Beban Bunga Bank', 'Pendapatan & Beban Lain-lain', 3, false, 'Debit', 'Bunga atas pinjaman bank dan leasing'),
('7-2200', 'Kerugian Selisih Kurs', 'Pendapatan & Beban Lain-lain', 3, false, 'Debit', 'Kerugian dari selisih nilai tukar mata uang'),
('7-2300', 'Kerugian Penjualan Aset Tetap', 'Pendapatan & Beban Lain-lain', 3, false, 'Debit', 'Kerugian dari penjualan aset tetap');
