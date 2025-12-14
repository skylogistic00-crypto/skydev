DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_disbursement' AND column_name = 'ocr_data') THEN
        ALTER TABLE cash_disbursement ADD COLUMN ocr_data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_transactions' AND column_name = 'ocr_data') THEN
        ALTER TABLE sales_transactions ADD COLUMN ocr_data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_transactions' AND column_name = 'ocr_data') THEN
        ALTER TABLE purchase_transactions ADD COLUMN ocr_data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_and_bank_receipts' AND column_name = 'ocr_data') THEN
        ALTER TABLE cash_and_bank_receipts ADD COLUMN ocr_data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kas_transaksi' AND column_name = 'ocr_data') THEN
        ALTER TABLE kas_transaksi ADD COLUMN ocr_data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'finance_transactions' AND column_name = 'ocr_data') THEN
        ALTER TABLE finance_transactions ADD COLUMN ocr_data JSONB;
    END IF;
END $$;
