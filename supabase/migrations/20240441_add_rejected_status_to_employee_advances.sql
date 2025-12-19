-- Add 'rejected' to employee_advances status constraint

ALTER TABLE employee_advances
DROP CONSTRAINT IF EXISTS employee_advances_status_check;

ALTER TABLE employee_advances
ADD CONSTRAINT employee_advances_status_check 
CHECK (status IN ('draft', 'pending', 'requested', 'disbursed', 'settled', 'partially_settled', 'returned', 'cancelled', 'rejected'));
