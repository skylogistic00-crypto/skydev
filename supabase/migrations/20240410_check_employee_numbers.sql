-- Check all employee numbers in the database
SELECT id, full_name, employee_number, created_at
FROM employees
ORDER BY employee_number;

-- Check if there are any NULL employee_numbers
SELECT COUNT(*) as null_count
FROM employees
WHERE employee_number IS NULL;

-- Check the maximum employee number
SELECT MAX(employee_number) as max_employee_number
FROM employees;
