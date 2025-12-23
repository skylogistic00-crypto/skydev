import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Download,
  Filter,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { navigateBack } from "@/utils/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface LabaRugiDetail {
  account_code: string;
  account_name: string;
  account_type: string;
  display_amount: number;
  transactions?: TransactionDetail[];
}

interface TransactionDetail {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  reference_number?: string;
}

export default function ProfitLossReport() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const [revenues, setRevenues] = useState<LabaRugiDetail[]>([]);
  const [cogs, setCogs] = useState<LabaRugiDetail[]>([]);
  const [expenses, setExpenses] = useState<LabaRugiDetail[]>([]);

  useEffect(() => {
    fetchProfitLossData();
  }, []);

  const fetchProfitLossData = async () => {
    setLoading(true);

    console.log("🚀 fetchData() called - Starting to fetch profit loss data");
    
    try {
      // Step 1: Fetch ALL journal_entries (without entity_id filter)
      const { data: journalData, error: journalError } = await supabase
        .from("journal_entries")
        .select("id, account_code, account_name, debit, credit, entry_date, description, reference_number")
        .order("entry_date", { ascending: true });

      if (journalError) {
        console.error("❌ Error fetching journal_entries:", journalError);
        throw journalError;
      }

      console.log("📊 Journal Entries Data:", journalData?.length || 0);
      console.log("📊 Sample journal data:", journalData?.slice(0, 3));

      // Step 2: Group journal entries by account_code
      const accountMap = new Map<string, {
        account_code: string;
        account_name: string;
        transactions: TransactionDetail[];
        totalDebit: number;
        totalCredit: number;
      }>();

      journalData?.forEach((row: any) => {
        const key = row.account_code;
        
        if (!accountMap.has(key)) {
          accountMap.set(key, {
            account_code: row.account_code,
            account_name: row.account_name,
            transactions: [],
            totalDebit: 0,
            totalCredit: 0,
          });
        }

        const account = accountMap.get(key)!;
        account.transactions.push({
          id: row.id,
          date: row.entry_date,
          description: row.description || row.reference_number || '-',
          debit: Number(row.debit) || 0,
          credit: Number(row.credit) || 0,
          reference_number: row.reference_number,
        });
        account.totalDebit += Number(row.debit) || 0;
        account.totalCredit += Number(row.credit) || 0;
      });

      // Step 3: Categorize accounts based on account_code prefix
      const revenueAccounts: LabaRugiDetail[] = [];
      const cogsAccountsData: LabaRugiDetail[] = [];
      const expenseAccountsData: LabaRugiDetail[] = [];

      accountMap.forEach((account) => {
        console.log("🔍 Processing account:", account.account_code, account.account_name, {
          totalDebit: account.totalDebit,
          totalCredit: account.totalCredit,
          transactionCount: account.transactions.length
        });

        // Calculate saldo based on account type
        let saldo = 0;
        let accountType = "";
        
        if (account.account_code.startsWith("4-")) {
          // PENDAPATAN: Credit - Debit
          saldo = account.totalCredit - account.totalDebit;
          accountType = "Pendapatan";
          
          revenueAccounts.push({
            account_code: account.account_code,
            account_name: account.account_name,
            account_type: accountType,
            display_amount: Math.abs(saldo),
            transactions: account.transactions,
          });
        } else if (account.account_code.startsWith("5-")) {
          // BEBAN POKOK PENJUALAN: Debit - Credit
          saldo = account.totalDebit - account.totalCredit;
          accountType = "Beban Pokok Penjualan";
          
          cogsAccountsData.push({
            account_code: account.account_code,
            account_name: account.account_name,
            account_type: accountType,
            display_amount: Math.abs(saldo),
            transactions: account.transactions,
          });
        } else if (account.account_code.startsWith("6-")) {
          // BEBAN OPERASIONAL: Debit - Credit
          saldo = account.totalDebit - account.totalCredit;
          accountType = "Beban Operasional";
          
          expenseAccountsData.push({
            account_code: account.account_code,
            account_name: account.account_name,
            account_type: accountType,
            display_amount: Math.abs(saldo),
            transactions: account.transactions,
          });
        }
      });

      setRevenues(revenueAccounts);
      setCogs(cogsAccountsData);
      setExpenses(expenseAccountsData);

      console.log("📊 Categorized data:", {
        revenues: revenueAccounts.length,
        cogs: cogsAccountsData.length,
        expenses: expenseAccountsData.length,
        totalRows: journalData?.length || 0,
      });

      console.log("📊 Revenue accounts detail:", revenueAccounts);
      console.log("📊 COGS accounts detail:", cogsAccountsData);
      console.log("📊 Expense accounts detail:", expenseAccountsData);

      toast({
        title: "✅ Laporan diperbarui",
        description: `Data laporan berhasil dimuat (${journalData?.length || 0} transaksi)`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal memuat data laporan";
      toast({
        title: "Error",
        description: errorMessage,
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

  // Calculate totals using display_amount
  const totalRevenue = revenues.reduce(
    (sum, acc) => sum + (acc.display_amount || 0),
    0,
  );
  const totalCOGS = cogs.reduce(
    (sum, acc) => sum + (acc.display_amount || 0),
    0,
  );
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = expenses.reduce(
    (sum, acc) => sum + (acc.display_amount || 0),
    0,
  );
  const netProfit = totalRevenue - (totalCOGS + totalExpenses);

  const exportToCSV = () => {
    const csv = [
      ["LAPORAN LABA RUGI"],
      [`Periode: ${dateFrom} s/d ${dateTo}`],
      [""],
      ["Kode Akun", "Nama Akun", "Tanggal", "Deskripsi", "Saldo"],
      [""],
      ["PENDAPATAN"],
    ];

    revenues.forEach((acc) => {
      if (acc.transactions && acc.transactions.length > 0) {
        acc.transactions.forEach((trx) => {
          csv.push([
            acc.account_code,
            acc.account_name,
            new Date(trx.date).toLocaleDateString('id-ID'),
            trx.description,
            (trx.credit - trx.debit).toFixed(0),
          ]);
        });
      } else {
        csv.push([
          acc.account_code,
          acc.account_name,
          "-",
          "-",
          acc.display_amount.toFixed(0),
        ]);
      }
    });

    csv.push(["", "", "", "Total Pendapatan:", totalRevenue.toFixed(0)]);
    csv.push([""]);
    csv.push(["BEBAN POKOK PENJUALAN"]);

    cogs.forEach((acc) => {
      if (acc.transactions && acc.transactions.length > 0) {
        acc.transactions.forEach((trx) => {
          csv.push([
            acc.account_code,
            acc.account_name,
            new Date(trx.date).toLocaleDateString('id-ID'),
            trx.description,
            (trx.debit - trx.credit).toFixed(0),
          ]);
        });
      } else {
        csv.push([
          acc.account_code,
          acc.account_name,
          "-",
          "-",
          acc.display_amount.toFixed(0),
        ]);
      }
    });

    csv.push(["", "", "", "Total Beban Pokok Penjualan:", totalCOGS.toFixed(0)]);
    csv.push([""]);
    csv.push(["LABA KOTOR", "", "", "", grossProfit.toFixed(0)]);
    csv.push([""]);
    csv.push(["BEBAN OPERASIONAL"]);

    expenses.forEach((acc) => {
      if (acc.transactions && acc.transactions.length > 0) {
        acc.transactions.forEach((trx) => {
          csv.push([
            acc.account_code,
            acc.account_name,
            new Date(trx.date).toLocaleDateString('id-ID'),
            trx.description,
            (trx.debit - trx.credit).toFixed(0),
          ]);
        });
      } else {
        csv.push([
          acc.account_code,
          acc.account_name,
          "-",
          "-",
          acc.display_amount.toFixed(0),
        ]);
      }
    });

    csv.push(["", "", "", "Total Beban Operasional:", totalExpenses.toFixed(0)]);
    csv.push([""]);
    csv.push(["LABA BERSIH", "", "", "", netProfit.toFixed(0)]);

    const csvContent = csv
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laba_rugi_${dateFrom}_${dateTo}.csv`;
    a.click();

    toast({
      title: "✅ Berhasil",
      description: "Laporan berhasil diexport ke CSV",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Card className="max-w-7xl mx-auto bg-white shadow-md rounded-2xl border">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Laporan Laba Rugi</CardTitle>
              <CardDescription>
                Laporan keuangan yang menunjukkan pendapatan, beban, dan
                laba/rugi perusahaan
              </CardDescription>
            </div>
            <Button
              onClick={() => navigateBack(navigate)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Export Buttons */}
          <div className="flex justify-end items-center gap-2 mb-6">
            <Button
              onClick={exportToCSV}
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* PENDAPATAN */}
              <div className="border rounded-lg overflow-hidden bg-white">
                <div className="bg-green-100 px-4 py-2">
                  <h3 className="text-lg font-bold text-green-800">
                    PENDAPATAN
                  </h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Kode Akun</TableHead>
                      <TableHead>Nama Akun</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenues.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-slate-500"
                        >
                          Tidak ada data pendapatan
                        </TableCell>
                      </TableRow>
                    ) : (
                      revenues.map((acc) => (
                        acc.transactions && acc.transactions.length > 0 ? (
                          acc.transactions.map((trx, idx) => (
                            <TableRow key={`${acc.account_code}-${trx.id}`}>
                              {idx === 0 && (
                                <>
                                  <TableCell className="font-mono" rowSpan={acc.transactions!.length}>
                                    {acc.account_code}
                                  </TableCell>
                                  <TableCell className="font-medium" rowSpan={acc.transactions!.length}>
                                    {acc.account_name}
                                  </TableCell>
                                </>
                              )}
                              <TableCell>{new Date(trx.date).toLocaleDateString('id-ID')}</TableCell>
                              <TableCell className="text-sm">{trx.description}</TableCell>
                              <TableCell className="text-right">
                                {formatRupiah(trx.credit - trx.debit)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow key={acc.account_code}>
                            <TableCell className="font-mono">{acc.account_code}</TableCell>
                            <TableCell className="font-medium">{acc.account_name}</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatRupiah(acc.display_amount)}
                            </TableCell>
                          </TableRow>
                        )
                      ))
                    )}
                    <TableRow className="bg-green-50 font-bold">
                      <TableCell colSpan={4}>Total Pendapatan</TableCell>
                      <TableCell className="text-right text-green-700">
                        {formatRupiah(totalRevenue)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* BEBAN POKOK PENJUALAN */}
              <div className="border rounded-lg overflow-hidden bg-white">
                <div className="bg-orange-100 px-4 py-2">
                  <h3 className="text-lg font-bold text-orange-800">
                    BEBAN POKOK PENJUALAN
                  </h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Kode Akun</TableHead>
                      <TableHead>Nama Akun</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cogs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-slate-500"
                        >
                          Tidak ada data beban pokok penjualan
                        </TableCell>
                      </TableRow>
                    ) : (
                      cogs.map((acc) => (
                        acc.transactions && acc.transactions.length > 0 ? (
                          acc.transactions.map((trx, idx) => (
                            <TableRow key={`${acc.account_code}-${trx.id}`}>
                              {idx === 0 && (
                                <>
                                  <TableCell className="font-mono" rowSpan={acc.transactions!.length}>
                                    {acc.account_code}
                                  </TableCell>
                                  <TableCell className="font-medium" rowSpan={acc.transactions!.length}>
                                    {acc.account_name}
                                  </TableCell>
                                </>
                              )}
                              <TableCell>{new Date(trx.date).toLocaleDateString('id-ID')}</TableCell>
                              <TableCell className="text-sm">{trx.description}</TableCell>
                              <TableCell className="text-right">
                                {formatRupiah(trx.debit - trx.credit)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow key={acc.account_code}>
                            <TableCell className="font-mono">{acc.account_code}</TableCell>
                            <TableCell className="font-medium">{acc.account_name}</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatRupiah(acc.display_amount)}
                            </TableCell>
                          </TableRow>
                        )
                      ))
                    )}
                    <TableRow className="bg-orange-50 font-bold">
                      <TableCell colSpan={4}>Total Beban Pokok Penjualan</TableCell>
                      <TableCell className="text-right text-orange-700">
                        {formatRupiah(totalCOGS)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* LABA KOTOR */}
              <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-700">
                    LABA KOTOR = Total Pendapatan - Total Beban Pokok Penjualan
                  </span>
                  <span className="text-2xl font-bold text-blue-700">
                    {formatRupiah(grossProfit)}
                  </span>
                </div>
              </div>

              {/* BEBAN OPERASIONAL */}
              <div className="border rounded-lg overflow-hidden bg-white">
                <div className="bg-red-100 px-4 py-2">
                  <h3 className="text-lg font-bold text-red-800">
                    BEBAN OPERASIONAL
                  </h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Kode Akun</TableHead>
                      <TableHead>Nama Akun</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-slate-500"
                        >
                          Tidak ada data beban operasional
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((acc) => (
                        acc.transactions && acc.transactions.length > 0 ? (
                          acc.transactions.map((trx, idx) => (
                            <TableRow key={`${acc.account_code}-${trx.id}`}>
                              {idx === 0 && (
                                <>
                                  <TableCell className="font-mono" rowSpan={acc.transactions!.length}>
                                    {acc.account_code}
                                  </TableCell>
                                  <TableCell className="font-medium" rowSpan={acc.transactions!.length}>
                                    {acc.account_name}
                                  </TableCell>
                                </>
                              )}
                              <TableCell>{new Date(trx.date).toLocaleDateString('id-ID')}</TableCell>
                              <TableCell className="text-sm">{trx.description}</TableCell>
                              <TableCell className="text-right">
                                {formatRupiah(trx.debit - trx.credit)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow key={acc.account_code}>
                            <TableCell className="font-mono">{acc.account_code}</TableCell>
                            <TableCell className="font-medium">{acc.account_name}</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatRupiah(acc.display_amount)}
                            </TableCell>
                          </TableRow>
                        )
                      ))
                    )}
                    <TableRow className="bg-red-50 font-bold">
                      <TableCell colSpan={4}>Total Beban Operasional</TableCell>
                      <TableCell className="text-right text-red-700">
                        {formatRupiah(totalExpenses)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* LABA BERSIH */}
              <div
                className={`border-4 rounded-lg p-6 ${netProfit >= 0 ? "border-green-600 bg-green-50" : "border-red-600 bg-red-50"}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {netProfit >= 0 ? (
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    )}
                    <span
                      className={`text-1xl font-bold ${netProfit >= 0 ? "text-green-700" : "text-red-700"}`}
                    >
                      LABA BERSIH = Total Pendapatan - (Total Beban Pokok
                      Penjualan + Total Beban Operasional)
                    </span>
                  </div>
                  <span
                    className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-700" : "text-red-700"}`}
                  >
                    {formatRupiah(Math.abs(netProfit))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
