-- Fix: Swap the debit and credit accounts because they were entered backwards
-- For receipts: DEBIT should be Bank/Cash (asset), CREDIT should be Revenue/Liability

UPDATE cash_and_bank_receipts
SET 
  debit_account_code = credit_account_code,
  debit_account_name = credit_account_name,
  credit_account_code = debit_account_code,
  credit_account_name = debit_account_name
WHERE debit_account_code LIKE '2-%' OR debit_account_code LIKE '3-%' 
  OR debit_account_code LIKE '4-%' OR debit_account_code LIKE '5-%';

-- Now trigger the journal entry creation by updating approval status
UPDATE cash_and_bank_receipts
SET approval_status = 'pending'
WHERE approval_status = 'approved';

UPDATE cash_and_bank_receipts
SET approval_status = 'approved'
WHERE approval_status = 'pending';
