export type JournalEntryLine = {
  account: string;
  debit: number;
  credit: number;
};

export function mapJournalEntries(
  transactionType: string,
  categoryItem: any,
  amount: number
): JournalEntryLine[] {
  switch (transactionType) {
    case "Penjualan":
      return [
        { account: categoryItem.sales_account_code, debit: 0, credit: amount },
        { account: "1-1001", debit: amount, credit: 0 },
      ];

    case "Pembelian":
      return [
        { account: "1-1500", debit: amount, credit: 0 },
        { account: categoryItem.purchase_account_code, debit: 0, credit: amount },
      ];

    case "Pendapatan":
      return [
        { account: categoryItem.coa_account_code, debit: 0, credit: amount },
        { account: "1-1001", debit: amount, credit: 0 },
      ];

    case "Pengeluaran":
      return [
        { account: categoryItem.coa_account_code, debit: amount, credit: 0 },
        { account: "1-1001", debit: 0, credit: amount },
      ];

    case "Pelunasan Piutang":
      return [
        { account: "1-1001", debit: amount, credit: 0 },
        { account: categoryItem.receivable_account_code, debit: 0, credit: amount },
      ];

    case "Pelunasan Hutang":
      return [
        { account: categoryItem.payable_account_code, debit: amount, credit: 0 },
        { account: "1-1001", debit: 0, credit: amount },
      ];

    case "Transfer Bank":
      return [
        { account: categoryItem.fromAccount, debit: 0, credit: amount },
        { account: categoryItem.toAccount, debit: amount, credit: 0 },
      ];

    default:
      return [];
  }
}
