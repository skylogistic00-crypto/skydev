export const TRANSACTION_CATEGORIES = {
  Pendapatan: {
    label: "Pendapatan",
    source: "other_income_items",
    sourceLabelKey: "income_name",
    sourceValueKey: "coa_account_code",
    description: "Pendapatan Non-Operasional seperti bunga bank, denda, sewa, dll.",
    categories: [
      "Pendapatan Bunga",
      "Pendapatan Sewa",
      "Pendapatan Lain-lain",
      "Pendapatan Denda",
    ],
  },

  Pengeluaran: {
    label: "Pengeluaran",
    source: "expense_items",
    sourceLabelKey: "expense_name",
    sourceValueKey: "coa_account_code",
    description: "Beban operasional: listrik, internet, transportasi, dll.",
    categories: [
      "Biaya Operasional",
      "Biaya Administrasi",
      "Biaya Penjualan",
      "Biaya Lain-lain",
    ],
  },

  Penjualan: {
    label: "Penjualan Barang",
    source: "stock",
    sourceLabelKey: "item_name",
    sourceValueKey: "sales_account_code",
    description: "Penjualan barang dari tabel stock.",
    categories: [
      "Penjualan Retail",
      "Penjualan Grosir",
      "Penjualan Online",
    ],
  },

  Pembelian: {
    label: "Pembelian Barang",
    source: "stock",
    sourceLabelKey: "item_name",
    sourceValueKey: "purchase_account_code",
    description: "Pembelian barang untuk stok.",
    categories: [
      "Pembelian Barang Dagang",
      "Pembelian Bahan Baku",
      "Pembelian Perlengkapan",
    ],
  },

  "Transfer Bank": {
    label: "Transfer Bank",
    source: "bank_accounts",
    sourceLabelKey: "bank_name",
    sourceValueKey: "coa_account_code",
    description: "Transfer antar akun bank.",
    categories: [
      "Transfer Masuk",
      "Transfer Keluar",
      "Mutasi Antar Rekening",
    ],
  },

  "Setoran Modal": {
    label: "Setoran Modal",
    source: "equity_items",
    sourceLabelKey: "equity_name",
    sourceValueKey: "coa_account_code",
    description: "Modal disetor pemilik.",
    categories: [
      "Setoran Modal Tunai",
      "Setoran Modal Barang",
    ],
  },

  Prive: {
    label: "Prive",
    source: "equity_items",
    sourceLabelKey: "equity_name",
    sourceValueKey: "coa_account_code",
    description: "Pengambilan dana oleh pemilik.",
    categories: [
      "Prive Tunai",
      "Prive Barang",
    ],
  },

  "Pelunasan Piutang": {
    label: "Pelunasan Piutang",
    source: "customers",
    sourceLabelKey: "customer_name",
    sourceValueKey: "receivable_account_code",
    description: "Pembayaran dari pelanggan.",
    categories: [
      "Pelunasan Piutang Dagang",
      "Pelunasan Piutang Lainnya",
    ],
  },

  "Pelunasan Hutang": {
    label: "Pelunasan Hutang",
    source: "suppliers",
    sourceLabelKey: "supplier_name",
    sourceValueKey: "payable_account_code",
    description: "Pembayaran hutang ke supplier.",
    categories: [
      "Pelunasan Hutang Dagang",
      "Pelunasan Hutang Bank",
      "Pelunasan Hutang Lainnya",
    ],
  },
};
