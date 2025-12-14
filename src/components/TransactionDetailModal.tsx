import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Transaction {
  id: string;
  tanggal: string;
  deskripsi: string;
  nominal: number;
  jenis_transaksi: string;
}

interface TransactionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "pendapatan" | "beban" | "laba";
  month: number;
  year: number;
}

export default function TransactionDetailModal({
  open,
  onOpenChange,
  type,
  month,
  year,
}: TransactionDetailModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<{
    penjualanBarang: Transaction[];
    penjualanJasa: Transaction[];
    pembelianBarang: Transaction[];
    pembelianJasa: Transaction[];
    penerimaanKas: Transaction[];
    pengeluaranKas: Transaction[];
  }>({
    penjualanBarang: [],
    penjualanJasa: [],
    pembelianBarang: [],
    pembelianJasa: [],
    penerimaanKas: [],
    pengeluaranKas: [],
  });

  useEffect(() => {
    if (open) {
      fetchTransactions();
    }
  }, [open, month, year, type]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Fetch from different tables based on transaction type
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      // Get last day of the selected month
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      // Penjualan Barang - from sales_transactions
      const { data: salesBarang } = await supabase
        .from("sales_transactions")
        .select("id, tanggal, deskripsi, nominal, jenis_transaksi")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate)
        .eq("jenis_transaksi", "Penjualan Barang")
        .order("tanggal", { ascending: true });

      // Penjualan Jasa - from sales_transactions
      const { data: salesJasa } = await supabase
        .from("sales_transactions")
        .select("id, tanggal, deskripsi, nominal, jenis_transaksi")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate)
        .eq("jenis_transaksi", "Penjualan Jasa")
        .order("tanggal", { ascending: true });

      // Pembelian Barang - from purchase_transactions
      const { data: purchaseBarang } = await supabase
        .from("purchase_transactions")
        .select("id, tanggal, deskripsi, nominal, jenis_transaksi")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate)
        .eq("jenis_transaksi", "Pembelian Barang")
        .order("tanggal", { ascending: true });

      // Pembelian Jasa - from purchase_transactions
      const { data: purchaseJasa } = await supabase
        .from("purchase_transactions")
        .select("id, tanggal, deskripsi, nominal, jenis_transaksi")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate)
        .eq("jenis_transaksi", "Pembelian Jasa")
        .order("tanggal", { ascending: true });

      // Penerimaan Kas & Bank - from cash_and_bank_receipts
      const { data: receipts } = await supabase
        .from("cash_and_bank_receipts")
        .select("id, tanggal, deskripsi, nominal")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate)
        .order("tanggal", { ascending: true });

      // Pengeluaran Kas - from cash_disbursement
      const { data: disbursements } = await supabase
        .from("cash_disbursement")
        .select("id, transaction_date, description, amount")
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate)
        .order("transaction_date", { ascending: true });

      setTransactions({
        penjualanBarang: (salesBarang || []).map((t) => ({
          ...t,
          jenis_transaksi: "Penjualan Barang",
        })),
        penjualanJasa: (salesJasa || []).map((t) => ({
          ...t,
          jenis_transaksi: "Penjualan Jasa",
        })),
        pembelianBarang: (purchaseBarang || []).map((t) => ({
          ...t,
          jenis_transaksi: "Pembelian Barang",
        })),
        pembelianJasa: (purchaseJasa || []).map((t) => ({
          ...t,
          jenis_transaksi: "Pembelian Jasa",
        })),
        penerimaanKas: (receipts || []).map((t) => ({
          ...t,
          jenis_transaksi: "Penerimaan Kas & Bank",
        })),
        pengeluaranKas: (disbursements || []).map((t) => ({
          id: t.id,
          tanggal: t.transaction_date,
          deskripsi: t.description,
          nominal: t.amount,
          jenis_transaksi: "Pengeluaran Kas",
        })),
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memuat data transaksi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const calculateTotal = (transactions: Transaction[]) => {
    return transactions.reduce((sum, t) => sum + (t.nominal || 0), 0);
  };

  const renderTable = (title: string, data: Transaction[]) => {
    const total = calculateTotal(data);

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[120px]">Tanggal</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right w-[150px]">Nominal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {data.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {formatDate(transaction.tanggal)}
                      </TableCell>
                      <TableCell>{transaction.deskripsi}</TableCell>
                      <TableCell className="text-right">
                        {formatRupiah(transaction.nominal)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-blue-50 font-bold">
                    <TableCell colSpan={2} className="text-right">
                      Total Nominal
                    </TableCell>
                    <TableCell className="text-right text-blue-700">
                      {formatRupiah(total)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const getTitle = () => {
    if (type === "pendapatan") return "Detail Pendapatan";
    if (type === "beban") return "Detail Beban";
    return "Detail Laba Bersih";
  };

  const getMonthName = (month: number) => {
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return months[month - 1];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {getTitle()} - {getMonthName(month)} {year}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {(type === "pendapatan" || type === "laba") && (
              <>
                {renderTable(
                  "Penjualan Barang",
                  transactions.penjualanBarang
                )}
                {renderTable("Penjualan Jasa", transactions.penjualanJasa)}
                {renderTable(
                  "Penerimaan Kas & Bank",
                  transactions.penerimaanKas
                )}
              </>
            )}

            {(type === "beban" || type === "laba") && (
              <>
                {renderTable(
                  "Pembelian Barang",
                  transactions.pembelianBarang
                )}
                {renderTable("Pembelian Jasa", transactions.pembelianJasa)}
                {renderTable("Pengeluaran Kas", transactions.pengeluaranKas)}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
