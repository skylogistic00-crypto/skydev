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

interface LabaRugiDetail {
  account_code: string;
  account_name: string;
  account_type: string;
  display_amount: number;
}

export default function ProfitLossReport() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [revenues, setRevenues] = useState<LabaRugiDetail[]>([]);
  const [cogs, setCogs] = useState<LabaRugiDetail[]>([]);
  const [expenses, setExpenses] = useState<LabaRugiDetail[]>([]);

  const [filterType, setFilterType] = useState<"month" | "year" | "custom">(
    "month",
  );
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchProfitLossData();
  }, [dateFrom, dateTo]);

  const handleFilterChange = (type: "month" | "year" | "custom") => {
    setFilterType(type);
    const now = new Date();

    if (type === "month") {
      setDateFrom(
        new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0],
      );
      setDateTo(
        new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0],
      );
    } else if (type === "year") {
      setDateFrom(
        new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0],
      );
      setDateTo(
        new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0],
      );
    }
  };

  const fetchProfitLossData = async () => {
    setLoading(true);

    try {
      // Fetch data from vw_profit_loss_complete view with full COA details
      const { data, error } = await supabase
        .from("vw_profit_loss_complete")
        .select(
          "account_id, account_code, account_name, account_type, balance",
        );

      if (error) throw error;

      console.log("📊 Raw data from vw_profit_loss_complete:", data);

      // Categorize accounts by account_type
      const revenueAccounts: LabaRugiDetail[] = [];
      const cogsAccounts: LabaRugiDetail[] = [];
      const expenseAccounts: LabaRugiDetail[] = [];

      data?.forEach((row: any) => {
        const balance = Number(row.balance) || 0;

        // Skip zero balances
        if (balance === 0) return;

        const item: LabaRugiDetail = {
          account_code: row.account_code,
          account_name: row.account_name,
          account_type: row.account_type,
          display_amount: Math.abs(balance),
        };

        if (row.account_type === "Pendapatan") {
          revenueAccounts.push(item);
        } else if (row.account_type === "Beban Pokok Penjualan") {
          cogsAccounts.push(item);
        } else if (row.account_type === "Beban Operasional") {
          expenseAccounts.push(item);
        }
      });

      setRevenues(revenueAccounts);
      setCogs(cogsAccounts);
      setExpenses(expenseAccounts);

      console.log("📊 Categorized data:", {
        revenues: revenueAccounts,
        cogs: cogsAccounts,
        expenses: expenseAccounts,
        totalRows: data?.length || 0,
      });

      toast({
        title: "✅ Laporan diperbarui",
        description: `Data laporan berhasil dimuat (${data?.length || 0} baris)`,
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
      ["Akun", "Saldo"],
      [""],
      ["PENDAPATAN"],
      ...revenues.map((acc) => [
        `${acc.account_code} - ${acc.account_name}`,
        acc.display_amount.toFixed(0),
      ]),
      ["", `Total Pendapatan: ${totalRevenue.toFixed(0)}`],
      [""],
      ["BEBAN POKOK PENJUALAN"],
      ...cogs.map((acc) => [
        `${acc.account_code} - ${acc.account_name}`,
        acc.display_amount.toFixed(0),
      ]),
      ["", `Total HPP: ${totalCOGS.toFixed(0)}`],
      ["", `LABA KOTOR: ${grossProfit.toFixed(0)}`],
      [""],
      ["BEBAN OPERASIONAL"],
      ...expenses.map((acc) => [
        `${acc.account_code} - ${acc.account_name}`,
        acc.display_amount.toFixed(0),
      ]),
      ["", `Total Beban Operasional: ${totalExpenses.toFixed(0)}`],
      [""],
      ["LABA BERSIH", netProfit.toFixed(0)],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
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
          {/* Filter */}
          <div className="grid md:grid-cols-5 gap-3 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-2">
              <Label>Filter Waktu</Label>
              <Select
                value={filterType}
                onValueChange={(v: any) => handleFilterChange(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Per Bulan</SelectItem>
                  <SelectItem value="year">Per Tahun</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Dari Tanggal</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                disabled={filterType !== "custom"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Sampai Tanggal</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                disabled={filterType !== "custom"}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchProfitLossData}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button variant="outline" className="flex-1">
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
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
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenues.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-slate-500"
                        >
                          Tidak ada data pendapatan
                        </TableCell>
                      </TableRow>
                    ) : (
                      revenues.map((acc) => (
                        <TableRow key={acc.account_code}>
                          <TableCell className="font-mono">
                            {acc.account_code}
                          </TableCell>
                          <TableCell className="font-medium">
                            {acc.account_name}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatRupiah(acc.display_amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="bg-green-50 font-bold">
                      <TableCell colSpan={2}>Total Pendapatan</TableCell>
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
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cogs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-slate-500"
                        >
                          Tidak ada data beban pokok penjualan
                        </TableCell>
                      </TableRow>
                    ) : (
                      cogs.map((acc) => (
                        <TableRow key={acc.account_code}>
                          <TableCell className="font-mono">
                            {acc.account_code}
                          </TableCell>
                          <TableCell className="font-medium">
                            {acc.account_name}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatRupiah(acc.display_amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="bg-orange-50 font-bold">
                      <TableCell colSpan={2}>
                        Total Beban Pokok Penjualan
                      </TableCell>
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
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-slate-500"
                        >
                          Tidak ada data beban operasional
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((acc) => (
                        <TableRow key={acc.account_code}>
                          <TableCell className="font-mono">
                            {acc.account_code}
                          </TableCell>
                          <TableCell className="font-medium">
                            {acc.account_name}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatRupiah(acc.display_amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="bg-red-50 font-bold">
                      <TableCell colSpan={2}>Total Beban Operasional</TableCell>
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
