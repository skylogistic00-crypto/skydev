import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Download, Filter, FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { navigateBack } from "@/utils/navigation";

interface BalanceSheetData {
  account_code: string;
  account_name: string;
  section: string;
  balance: number;
}

export default function BalanceSheetReport() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [assets, setAssets] = useState<BalanceSheetData[]>([]);
  const [liabilities, setLiabilities] = useState<BalanceSheetData[]>([]);
  const [equity, setEquity] = useState<BalanceSheetData[]>([]);

  const [periodStart, setPeriodStart] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
  );
  const [periodEnd, setPeriodEnd] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    fetchBalanceSheetData();
  }, []);

  const fetchBalanceSheetData = async () => {
    setLoading(true);

    try {
      // Fetch from vw_balance_sheet_complete view with full COA details
      const { data, error } = await supabase
        .from("vw_balance_sheet_complete")
        .select("account_id, account_code, account_name, account_type, balance");

      if (error) throw error;

      // Group by account_code and sum balance
      const accountMap = new Map<string, BalanceSheetData>();

      data?.forEach((row: any) => {
        const key = row.account_code;
        const balance = Number(row.balance) || 0;

        if (accountMap.has(key)) {
          const existing = accountMap.get(key)!;
          existing.balance += balance;
        } else {
          accountMap.set(key, {
            account_code: row.account_code,
            account_name: row.account_name,
            section: row.account_type,
            balance,
          });
        }
      });

      // Filter by account type
      const assetAccounts: BalanceSheetData[] = [];
      const liabilityAccounts: BalanceSheetData[] = [];
      const equityAccounts: BalanceSheetData[] = [];

      accountMap.forEach((acc) => {
        if (acc.balance === 0) return;

        if (acc.section === "Aset") {
          assetAccounts.push(acc);
        } else if (acc.section === "Kewajiban") {
          liabilityAccounts.push(acc);
        } else if (acc.section === "Ekuitas") {
          equityAccounts.push(acc);
        }
      });

      setAssets(assetAccounts);
      setLiabilities(liabilityAccounts);
      setEquity(equityAccounts);

      toast({
        title: "✅ Laporan diperbarui",
        description: `Data neraca periode ${periodStart} - ${periodEnd} berhasil dimuat`,
      });
    } catch (error) {
      console.error("❌ Error loading balance sheet:", err);
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
  const totalLiabilities = liabilities.reduce(
    (sum, acc) => sum + acc.balance,
    0,
  );
  const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  // totalKewajibanEkuitas dari view sudah negatif, jadi gunakan absolute value
  const balanceDifference = totalAssets - Math.abs(totalLiabilitiesAndEquity);

  const exportToCSV = () => {
    const csv = [
      ["LAPORAN NERACA (BALANCE SHEET)"],
      [`Periode: ${periodStart} - ${periodEnd}`],
      [""],
      ["Akun", "Saldo"],
      [""],
      ["ASET"],
      ...assets.map((acc) => [
        `${acc.account_code} - ${acc.account_name}`,
        acc.balance.toFixed(2),
      ]),
      ["", "TOTAL ASET", totalAssets.toFixed(2)],
      [""],
      ["KEWAJIBAN"],
      ...liabilities.map((acc) => [
        `${acc.account_code} - ${acc.account_name}`,
        acc.balance.toFixed(2),
      ]),
      ["", "TOTAL KEWAJIBAN", totalLiabilities.toFixed(2)],
      [""],
      ["EKUITAS"],
      ...equity.map((acc) => [
        `${acc.account_code} - ${acc.account_name}`,
        acc.balance.toFixed(2),
      ]),
      ["", "TOTAL EKUITAS", totalEquity.toFixed(2)],
      [""],
      ["", "TOTAL KEWAJIBAN & EKUITAS", totalLiabilitiesAndEquity.toFixed(2)],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neraca_${periodStart}_${periodEnd}.csv`;
    a.click();

    toast({
      title: "✅ Berhasil",
      description: "Laporan berhasil diexport ke CSV",
    });
  };

  const isBalanced = Math.abs(balanceDifference) < 0.01;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Card className="max-w-7xl mx-auto bg-white shadow-md rounded-2xl border">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Laporan Neraca</CardTitle>
              <CardDescription>
                Laporan posisi keuangan yang menunjukkan aset, kewajiban, dan
                ekuitas perusahaan
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
          {/* Filter Date */}
          <div className="grid md:grid-cols-4 gap-3 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-2">
              <Label htmlFor="periodStart">Periode Awal</Label>
              <Input
                id="periodStart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodEnd">Periode Akhir</Label>
              <Input
                id="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchBalanceSheetData}
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
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-blue-50 border-2 border-blue-500">
              <CardHeader className="p-4">
                <CardTitle className="text-sm text-blue-600">
                  Total Aset
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xl font-bold text-blue-700">
                  {formatRupiah(totalAssets)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-2 border-red-500">
              <CardHeader className="p-4">
                <CardTitle className="text-sm text-red-600">
                  Total Kewajiban
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xl font-bold text-red-700">
                  {formatRupiah(totalLiabilities)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-2 border-green-500">
              <CardHeader className="p-4">
                <CardTitle className="text-sm text-green-600">
                  Total Ekuitas
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 pt-0">
                <p
                  className={`text-xl font-bold ${
                    totalEquity < 0 ? "text-red-700" : "text-green-700"
                  }`}
                >
                  {formatRupiah(totalEquity)}
                </p>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Grid 3 Kolom */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* ASET */}
                <div className="border rounded-lg overflow-hidden bg-white shadow-md">
                  <div className="bg-blue-100 px-4 py-2">
                    <h3 className="text-lg font-bold text-blue-800">ASET</h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Akun</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets.map((acc) => (
                        <TableRow key={acc.account_code}>
                          <TableCell className="text-sm">
                            {acc.account_code}
                            <br />
                            <span className="text-xs text-gray-600">
                              {acc.account_name}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm">
                            {formatRupiah(acc.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-blue-50 font-bold">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-right text-blue-700">
                          {formatRupiah(totalAssets)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* KEWAJIBAN */}
                <div className="border rounded-lg overflow-hidden bg-white shadow-md">
                  <div className="bg-red-100 px-4 py-2">
                    <h3 className="text-lg font-bold text-red-800">
                      KEWAJIBAN
                    </h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Akun</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {liabilities.map((acc) => (
                        <TableRow key={acc.account_code}>
                          <TableCell className="text-sm">
                            {acc.account_code}
                            <br />
                            <span className="text-xs text-gray-600">
                              {acc.account_name}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm">
                            {formatRupiah(Math.abs(acc.balance))}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-red-50 font-bold">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-right text-red-700">
                          {formatRupiah(Math.abs(totalLiabilities))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* EKUITAS */}
                <div className="border rounded-lg overflow-hidden bg-white shadow-md">
                  <div className="bg-green-100 px-4 py-2">
                    <h3 className="text-lg font-bold text-green-800">
                      EKUITAS
                    </h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Akun</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equity.map((acc) => (
                        <TableRow key={acc.account_code}>
                          <TableCell className="text-sm">
                            {acc.account_code}
                            <br />
                            <span className="text-xs text-gray-600">
                              {acc.account_name}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm">
                            {formatRupiah(Math.abs(acc.balance))}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-green-50 font-bold">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-right text-green-700">
                          {formatRupiah(Math.abs(totalEquity))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* RINGKASAN NERACA */}
              <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                <h3 className="text-xl font-bold mb-4 text-center">
                  Ringkasan Neraca
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-semibold text-blue-700">
                      Total Aset
                    </span>
                    <span className="text-xl font-bold text-blue-700">
                      {formatRupiah(totalAssets)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-semibold text-purple-700">
                      Total Kewajiban + Ekuitas
                    </span>
                    <span className="text-xl font-bold text-purple-700">
                      {formatRupiah(Math.abs(totalLiabilitiesAndEquity))}
                    </span>
                  </div>
                  <div
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      isBalanced ? "bg-green-50" : "bg-yellow-50"
                    }`}
                  >
                    <span
                      className={`font-semibold ${isBalanced ? "text-green-700" : "text-yellow-700"}`}
                    >
                      Selisih Neraca
                    </span>
                    <span
                      className={`text-xl font-bold ${isBalanced ? "text-green-700" : "text-yellow-700"}`}
                    >
                      {formatRupiah(Math.abs(balanceDifference))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Balance Warning */}
              {!isBalanced && (
                <div className="p-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
                  <p className="text-yellow-800 font-semibold text-center flex items-center justify-center gap-2">
                    ⚠️ Perhatian: Neraca belum seimbang, periksa transaksi
                    jurnal.
                  </p>
                  <p className="text-sm text-yellow-700 text-center mt-2">
                    Selisih: {formatRupiah(balanceDifference)}
                    {balanceDifference > 0
                      ? " (Aset lebih besar)"
                      : " (Kewajiban + Ekuitas lebih besar)"}
                  </p>
                </div>
              )}

              {/* Balance Check */}
              {isBalanced && (
                <div className="p-4 bg-green-100 border-2 border-green-400 rounded-lg">
                  <p className="text-green-700 font-semibold text-center">
                    ✅ Neraca Balance! Total Aset = Total Kewajiban + Ekuitas
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
