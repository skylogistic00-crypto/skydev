-- Remove Penjualan Barang and Penjualan Jasa from approval_transaksi table
-- These transactions should only exist in sales_transactions table

DELETE FROM approval_transaksi 
WHERE type IN ('Penjualan Barang', 'Penjualan Jasa');
