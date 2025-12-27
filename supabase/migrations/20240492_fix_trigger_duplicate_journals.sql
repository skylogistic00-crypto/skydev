-- Fix trigger to only run on INSERT with approved status, or UPDATE changing status to approved
DROP TRIGGER IF EXISTS trigger_create_journal_from_cash_disbursement ON cash_disbursement CASCADE;

CREATE TRIGGER trigger_create_journal_from_cash_disbursement
  AFTER INSERT ON cash_disbursement
  FOR EACH ROW
  WHEN (NEW.approval_status = 'approved')
  EXECUTE FUNCTION create_journal_from_cash_disbursement();

-- Note: Removed UPDATE trigger to prevent duplicate journal entries
-- Journal entries should only be created once when record is inserted with approved status
