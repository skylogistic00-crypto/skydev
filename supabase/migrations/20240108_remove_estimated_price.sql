ALTER TABLE purchase_requests DROP COLUMN IF EXISTS estimated_price CASCADE;
ALTER TABLE purchase_requests DROP COLUMN IF EXISTS total_amount CASCADE;
ALTER TABLE purchase_requests DROP COLUMN IF EXISTS grand_total CASCADE;