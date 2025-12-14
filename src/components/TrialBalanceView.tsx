import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";

interface TrialBalanceEntry {
  account_id?: string;
  account_code: string;
  account_name: string;
  account_type?: string;
  debit_total: number;
  credit_total: number;
  balance: number;
}

export default function TrialBalanceView() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<TrialBalanceEntry[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchTrialBalance();
  }, [startDate, endDate]);

  const fetchTrialBalance = async () => {
    setLoading(true);

    // Use the view_general_ledger which has complete COA details
    let query = supabase
      .from("view_general_ledger")
      .select("account_id, account_code, account_name, account_type, debit, credit, date");

    if (startDate) {
      query = query.gte("date", startDate);
    }

    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Error",
        description: `Gagal memuat trial balance: ${error.message}`,
        variant: "destructive",
      });
    } else {
      // Group by account and sum debit/credit
      const grouped = (data || []).reduce((acc: any, entry: any) => {
        const key = entry.account_code;
        if (!acc[key]) {
          acc[key] = {
            account_id: entry.account_id,
            account_code: entry.account_code,
            account_name: entry.account_name || "",
            account_type: entry.account_type || "",
            debit_total: 0,
            credit_total: 0,
            balance: 0,
          };
        }
        acc[key].debit_total += entry.debit || 0;
        acc[key].credit_total += entry.credit || 0;
        acc[key].balance += (entry.debit || 0) - (entry.credit || 0);
        return acc;
      }, {});

      const trialBalanceData = Object.values(grouped).sort((a: any, b: any) =>
        a.account_code.localeCompare(b.account_code),
      );

      setEntries(trialBalanceData as TrialBalanceEntry[]);
    }

    setLoading(false);
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalDebit = entries.reduce((sum, e) => sum + e.debit_total, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit_total, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const exportToCSV = () => {
    const headers = ["Kode Akun", "Nama Akun", "Debit", "Kredit", "Saldo"];
    const rows = entries.map((e) => [
      e.account_code,
      e.account_name,
      e.debit_total,
      e.credit_total,
      e.balance,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trial-balance-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Dari Tanggal
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Sampai Tanggal
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <Button onClick={exportToCSV} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Balance Status */}
      {!loading && entries.length > 0 && (
        <div
          className={`p-4 rounded-lg ${isBalanced ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`font-semibold ${isBalanced ? "text-green-700" : "text-red-700"}`}
            >
              {isBalanced
                ? "✓ Trial Balance Seimbang"
                : "⚠ Trial Balance Tidak Seimbang"}
            </span>
            <span
              className={`text-sm ${isBalanced ? "text-green-600" : "text-red-600"}`}
            >
              Selisih: {formatRupiah(Math.abs(totalDebit - totalCredit))}
            </span>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Akun</TableHead>
                <TableHead>Nama Akun</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Kredit</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-slate-500"
                  >
                    Tidak ada data
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {entries.map((entry, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono">
                        {entry.account_code}
                      </TableCell>
                      <TableCell>{entry.account_name}</TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.debit_total > 0
                          ? formatRupiah(entry.debit_total)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.credit_total > 0
                          ? formatRupiah(entry.credit_total)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatRupiah(entry.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  <TableRow className="bg-slate-100 font-bold">
                    <TableCell colSpan={2}>TOTAL</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatRupiah(totalDebit)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatRupiah(totalCredit)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatRupiah(totalDebit - totalCredit)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
