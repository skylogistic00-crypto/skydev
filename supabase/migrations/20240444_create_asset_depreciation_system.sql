-- Create asset_depreciation table for tracking depreciation records
DROP TABLE IF EXISTS asset_depreciation CASCADE;

CREATE TABLE asset_depreciation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  period DATE NOT NULL,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  depreciation_amount DECIMAL(15, 2) NOT NULL,
  accumulated_depreciation DECIMAL(15, 2) DEFAULT 0,
  book_value DECIMAL(15, 2) DEFAULT 0,
  depreciation_method TEXT DEFAULT 'straight_line',
  journal_entry_id UUID REFERENCES journal_entries(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index to prevent duplicate depreciation for same asset/period
CREATE UNIQUE INDEX idx_asset_depreciation_unique ON asset_depreciation(asset_id, period_year, period_month);

-- Create indexes for common queries
CREATE INDEX idx_asset_depreciation_asset_id ON asset_depreciation(asset_id);
CREATE INDEX idx_asset_depreciation_period ON asset_depreciation(period);
CREATE INDEX idx_asset_depreciation_status ON asset_depreciation(status);
CREATE INDEX idx_asset_depreciation_journal ON asset_depreciation(journal_entry_id);

-- Enable RLS
ALTER TABLE asset_depreciation ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Allow all for authenticated users on asset_depreciation" ON asset_depreciation;
CREATE POLICY "Allow all for authenticated users on asset_depreciation" 
  ON asset_depreciation FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_asset_depreciation_updated_at ON asset_depreciation;
CREATE TRIGGER trigger_asset_depreciation_updated_at
  BEFORE UPDATE ON asset_depreciation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add depreciation-related columns to assets table if not exists
ALTER TABLE assets ADD COLUMN IF NOT EXISTS salvage_value DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS depreciation_method TEXT DEFAULT 'straight_line';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS depreciation_start_date DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS total_depreciation DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS current_book_value DECIMAL(15, 2);

-- Update current_book_value default to acquisition_cost
UPDATE assets SET current_book_value = acquisition_cost WHERE current_book_value IS NULL;

-- Add COA accounts for depreciation if not exists
INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_postable, is_active, normal_balance)
SELECT '6-4100', 'Beban Penyusutan Kendaraan', 'Beban Operasional', true, true, 'Debit'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE account_code = '6-4100');

INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_postable, is_active, normal_balance)
SELECT '6-4200', 'Beban Penyusutan Peralatan', 'Beban Operasional', true, true, 'Debit'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE account_code = '6-4200');

INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_postable, is_active, normal_balance)
SELECT '6-4300', 'Beban Penyusutan Bangunan', 'Beban Operasional', true, true, 'Debit'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE account_code = '6-4300');

INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_postable, is_active, normal_balance)
SELECT '1-5900', 'Akumulasi Penyusutan Kendaraan', 'Aset', true, true, 'Kredit'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE account_code = '1-5900');

INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_postable, is_active, normal_balance)
SELECT '1-5910', 'Akumulasi Penyusutan Peralatan', 'Aset', true, true, 'Kredit'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE account_code = '1-5910');

INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_postable, is_active, normal_balance)
SELECT '1-5920', 'Akumulasi Penyusutan Bangunan', 'Aset', true, true, 'Kredit'
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE account_code = '1-5920');

COMMENT ON TABLE asset_depreciation IS 'Records depreciation entries for fixed assets';
