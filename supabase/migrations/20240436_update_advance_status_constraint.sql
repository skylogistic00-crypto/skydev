-- Update the status constraint to include 'draft', 'disbursed' and 'requested' status
-- First, update any invalid status values to 'draft'
UPDATE employee_advances 
SET status = 'draft' 
WHERE status NOT IN ('draft', 'requested', 'disbursed', 'settled', 'partially_settled', 'returned', 'cancelled');

ALTER TABLE employee_advances
DROP CONSTRAINT IF EXISTS employee_advances_status_check;

ALTER TABLE employee_advances
ADD CONSTRAINT employee_advances_status_check 
CHECK (status IN ('draft', 'requested', 'disbursed', 'settled', 'partially_settled', 'returned', 'cancelled'));
