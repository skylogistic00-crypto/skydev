-- Menambahkan kolom COA ke tabel stock
ALTER TABLE stock
ADD COLUMN IF NOT EXISTS coa_account_code TEXT,
ADD COLUMN IF NOT EXISTS coa_account_name TEXT;

-- Menambahkan foreign key constraint ke chart_of_accounts
ALTER TABLE stock
ADD CONSTRAINT fk_stock_coa 
FOREIGN KEY (coa_account_code) 
REFERENCES chart_of_accounts(account_code)
ON DELETE SET NULL;

-- Membuat index untuk performa query
CREATE INDEX IF NOT EXISTS idx_stock_coa_account_code ON stock(coa_account_code);

-- Membuat function untuk auto-update COA saat insert/update stock
CREATE OR REPLACE FUNCTION auto_assign_coa_to_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_mapping RECORD;
BEGIN
  -- Jika category dan jenis_barang ada, coba auto-assign COA
  IF NEW.category IS NOT NULL AND NEW.jenis_barang IS NOT NULL THEN
    -- Ambil mapping dari coa_category_mapping
    SELECT 
      COALESCE(asset_account_code, revenue_account_code) as account_code,
      COALESCE(
        (SELECT account_name FROM chart_of_accounts WHERE account_code = COALESCE(asset_account_code, revenue_account_code) LIMIT 1),
        ''
      ) as account_name
    INTO v_mapping
    FROM coa_category_mapping
    WHERE service_category = NEW.category[1]  -- Ambil kategori pertama dari array
      AND service_type = NEW.jenis_barang
      AND is_active = true
    LIMIT 1;

    -- Jika mapping ditemukan dan COA belum diisi, assign otomatis
    IF v_mapping.account_code IS NOT NULL AND (NEW.coa_account_code IS NULL OR NEW.coa_account_code = '') THEN
      NEW.coa_account_code := v_mapping.account_code;
      NEW.coa_account_name := v_mapping.account_name;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Membuat trigger untuk auto-assign COA
DROP TRIGGER IF EXISTS trigger_auto_assign_coa_to_stock ON stock;
CREATE TRIGGER trigger_auto_assign_coa_to_stock
  BEFORE INSERT OR UPDATE ON stock
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_coa_to_stock();

COMMENT ON COLUMN stock.coa_account_code IS 'Kode akun COA yang terhubung dengan item stock ini';
COMMENT ON COLUMN stock.coa_account_name IS 'Nama akun COA yang terhubung dengan item stock ini';
COMMENT ON FUNCTION auto_assign_coa_to_stock() IS 'Function untuk auto-assign COA berdasarkan kategori dan jenis barang';
