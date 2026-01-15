-- Add tax extraction fields to bank_mutations table
-- These fields are used to extract tax information from OCR documents (invoices/Faktur Pajak)

ALTER TABLE bank_mutations
ADD COLUMN IF NOT EXISTS invoice_id TEXT,
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS dpp_amount DECIMAL(18,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ppn_amount DECIMAL(18,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pph_amount DECIMAL(18,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gross_amount DECIMAL(18,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_extraction_status TEXT DEFAULT 'pending' CHECK (tax_extraction_status IN ('pending', 'extracted', 'manual', 'failed')),
ADD COLUMN IF NOT EXISTS tax_extraction_confidence DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_extraction_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tax_document_type TEXT; -- 'coretax_faktur', 'commercial_invoice', 'receipt', etc.

-- Create index for invoice lookups
CREATE INDEX IF NOT EXISTS idx_bank_mutations_invoice_id ON bank_mutations(invoice_id);
CREATE INDEX IF NOT EXISTS idx_bank_mutations_invoice_number ON bank_mutations(invoice_number);
CREATE INDEX IF NOT EXISTS idx_bank_mutations_tax_extraction_status ON bank_mutations(tax_extraction_status);

-- Add comment for documentation
COMMENT ON COLUMN bank_mutations.dpp_amount IS 'Dasar Pengenaan Pajak - Tax Base Amount';
COMMENT ON COLUMN bank_mutations.ppn_amount IS 'Pajak Pertambahan Nilai - VAT Amount';
COMMENT ON COLUMN bank_mutations.pph_amount IS 'Pajak Penghasilan - Income Tax / Withholding Tax';
COMMENT ON COLUMN bank_mutations.gross_amount IS 'Total Amount Including All Taxes';
COMMENT ON COLUMN bank_mutations.invoice_id IS 'Nomor Faktur Pajak or Invoice ID';
