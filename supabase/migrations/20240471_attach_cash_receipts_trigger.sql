-- Ensure trigger is properly attached to cash_and_bank_receipts table

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trigger_create_journal_from_cash_receipts ON cash_and_bank_receipts;

-- Create trigger
CREATE TRIGGER trigger_create_journal_from_cash_receipts
  AFTER INSERT OR UPDATE ON cash_and_bank_receipts
  FOR EACH ROW
  EXECUTE FUNCTION create_journal_from_cash_receipts();

COMMENT ON TRIGGER trigger_create_journal_from_cash_receipts ON cash_and_bank_receipts 
IS 'Automatically create journal entries when cash receipts are approved';
