-- Function to create journal entries for stock adjustments
CREATE OR REPLACE FUNCTION create_journal_entry_for_stock_adjustment()
RETURNS TRIGGER AS $$
DECLARE
  v_debit_account TEXT;
  v_credit_account TEXT;
  v_amount NUMERIC;
  v_description TEXT;
BEGIN
  -- Only create journal entry if status is approved
  IF NEW.status = 'approved' THEN
    
    -- Calculate amount (adjustment_value * unit price from stock)
    SELECT COALESCE(unit_price, 0) * ABS(NEW.adjustment_value)
    INTO v_amount
    FROM stock
    WHERE sku = NEW.sku;
    
    -- Set default amount if stock not found
    IF v_amount IS NULL OR v_amount = 0 THEN
      v_amount := ABS(NEW.adjustment_value) * 1000;
    END IF;
    
    -- Determine accounts based on adjustment type
    IF NEW.adjustment_value > 0 THEN
      -- Stock increase (Debit: Persediaan, Credit: Pendapatan Lain-lain)
      v_debit_account := '1-1300';  -- Persediaan
      v_credit_account := '4-9500'; -- Pendapatan Lain-lain (Selisih Lebih Stock)
      v_description := 'Stock Adjustment - Penambahan: ' || NEW.item_name || ' (' || NEW.reason || ')';
    ELSE
      -- Stock decrease (Debit: Beban Lain-lain, Credit: Persediaan)
      v_debit_account := '7-2500';  -- Beban Lain-lain (Selisih Kurang Stock)
      v_credit_account := '1-1300'; -- Persediaan
      v_description := 'Stock Adjustment - Pengurangan: ' || NEW.item_name || ' (' || NEW.reason || ')';
    END IF;
    
    -- Insert journal entry (Debit)
    INSERT INTO journal_entries (
      transaction_date,
      account_code,
      description,
      debit,
      credit,
      reference_type,
      reference_id,
      created_by
    ) VALUES (
      NEW.transaction_date,
      v_debit_account,
      v_description,
      v_amount,
      0,
      'stock_adjustment',
      NEW.id,
      NEW.created_by
    );
    
    -- Insert journal entry (Credit)
    INSERT INTO journal_entries (
      transaction_date,
      account_code,
      description,
      debit,
      credit,
      reference_type,
      reference_id,
      created_by
    ) VALUES (
      NEW.transaction_date,
      v_credit_account,
      v_description,
      0,
      v_amount,
      'stock_adjustment',
      NEW.id,
      NEW.created_by
    );
    
    RAISE NOTICE 'Journal entries created for stock adjustment %', NEW.reference_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS trigger_journal_entry_stock_adjustment_insert ON stock_adjustments;
CREATE TRIGGER trigger_journal_entry_stock_adjustment_insert
AFTER INSERT ON stock_adjustments
FOR EACH ROW
WHEN (NEW.status = 'approved')
EXECUTE FUNCTION create_journal_entry_for_stock_adjustment();

-- Create trigger for UPDATE (when status changes to approved)
DROP TRIGGER IF EXISTS trigger_journal_entry_stock_adjustment_update ON stock_adjustments;
CREATE TRIGGER trigger_journal_entry_stock_adjustment_update
AFTER UPDATE ON stock_adjustments
FOR EACH ROW
WHEN (OLD.status != 'approved' AND NEW.status = 'approved')
EXECUTE FUNCTION create_journal_entry_for_stock_adjustment();
