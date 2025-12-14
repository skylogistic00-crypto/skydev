export type ReversalAudit = {
  wms_transaction_id: string;
  wms_reference: string;
  sku: string;
  qty: number;
  movement_value: number;
  account_code: string;
  debit: number;
  credit: number;
  entry_date: string;
  transaction_date: string;
  is_fatal: boolean;
};