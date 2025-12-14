interface JournalParams {
  jenisTransaksi: string;
  kategori: string;
  nominal: string | number;
}

interface JournalEntry {
  debit: { account: string; amount: number };
  kredit: { account: string; amount: number };
}

export function generateJournal(params: JournalParams): JournalEntry | null {
  const { jenisTransaksi, kategori, nominal } = params;
  const amount = typeof nominal === "string" ? parseFloat(nominal) : nominal;

  if (!amount || amount <= 0) return null;

  // Penjualan Barang
  if (jenisTransaksi === "Penjualan Barang") {
    return {
      debit: { account: "1-1100 Kas", amount },
      kredit: { account: "4-1000 Pendapatan Penjualan", amount },
    };
  }

  // Penjualan Jasa
  if (jenisTransaksi === "Penjualan Jasa") {
    return {
      debit: { account: "1-1100 Kas", amount },
      kredit: { account: "4-2000 Pendapatan Jasa", amount },
    };
  }

  // Pembelian
  if (jenisTransaksi === "Pembelian") {
    return {
      debit: { account: "1-1400 Persediaan Barang Dagangan", amount },
      kredit: { account: "1-1100 Kas", amount },
    };
  }

  // Penerimaan Kas
  if (jenisTransaksi === "Penerimaan Kas") {
    return {
      debit: { account: "1-1100 Kas", amount },
      kredit: { account: "4-1000 Pendapatan Lain-lain", amount },
    };
  }

  // Pengeluaran Kas
  if (jenisTransaksi === "Pengeluaran Kas") {
    return {
      debit: { account: "6-1000 Beban Operasional", amount },
      kredit: { account: "1-1100 Kas", amount },
    };
  }

  // Pinjaman Masuk
  if (jenisTransaksi === "Pinjaman Masuk") {
    return {
      debit: { account: "1-1100 Kas", amount },
      kredit: { account: "2-1410 Hutang Bank Jangka Pendek", amount },
    };
  }

  // Pembayaran Pinjaman
  if (jenisTransaksi === "Pembayaran Pinjaman") {
    return {
      debit: { account: "2-1410 Hutang Bank Jangka Pendek", amount },
      kredit: { account: "1-1100 Kas", amount },
    };
  }

  return null;
}
