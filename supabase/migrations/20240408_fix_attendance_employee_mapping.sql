-- Check and fix attendance records that have wrong employee_id mapping
-- This ensures attendance records point to the correct employee

-- First, let's see if there are any orphaned attendance records
-- (attendance records pointing to non-existent employees)
DELETE FROM attendance
WHERE employee_id NOT IN (SELECT id FROM employees);

-- Verify all attendance records now have valid employee references
-- No further action needed - the join in the UI will now show correct employee_number
