import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  FileText,
  Scale,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { Link } from "react-router-dom";
import MonthlyFinanceChart from "./MonthlyFinanceChart";
import { canClick } from "@/utils/roleAccess";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TransactionDetailModal from "./TransactionDetailModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FinancialSummary {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  totalAssets: number;
}

interface GeneralLedgerEntry {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  saldo: number;
}

export default function FinancialDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { userRole } = useAuth();
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalExpense: 0,
    netProfit: 0,
    totalAssets: 0,
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"pendapatan" | "beban" | "laba">("pendapatan");

  // Month and year filters
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = Semua
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    fetchFinancialSummary();
  }, [selectedMonth, selectedYear]);

  const fetchFinancialSummary = async () => {
    setLoading(true);

    try {
      let startDate: string;
      let endDate: string;

      if (selectedMonth === 0) {
        // Semua bulan - ambil data untuk seluruh tahun
        startDate = `${selectedYear}-01-01`;
        endDate = `${selectedYear}-12-31`;
      } else {
        // Bulan tertentu
        startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        endDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      }

      // Fetch Penjualan Barang
      const { data: salesBarang, error: errorSalesBarang } = await supabase
        .from("sales_transactions")
        .select("total_amount")
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate)
        .eq("transaction_type", "Barang")
        .eq("approval_status", "approved");

      console.log("📊 Sales Barang:", { startDate, endDate, data: salesBarang, error: errorSalesBarang });

      // Fetch Penjualan Jasa
      const { data: salesJasa, error: errorSalesJasa } = await supabase
        .from("sales_transactions")
        .select("total_amount")
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate)
        .eq("transaction_type", "Jasa")
        .eq("approval_status", "approved");

      console.log("📊 Sales Jasa:", { data: salesJasa, error: errorSalesJasa });

      // Fetch Penerimaan Kas & Bank
      const { data: receipts, error: errorReceipts } = await supabase
        .from("cash_and_bank_receipts")
        .select("amount")
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate)
        .eq("approval_status", "approved");

      console.log("📊 Receipts:", { data: receipts, error: errorReceipts });

      // Fetch Pembelian Barang
      const { data: purchaseBarang, error: errorPurchaseBarang } = await supabase
        .from("purchase_transactions")
        .select("total_amount")
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate)
        .eq("transaction_type", "Barang")
        .eq("approval_status", "approved");

      // Fetch Pembelian Jasa
      const { data: purchaseJasa, error: errorPurchaseJasa } = await supabase
        .from("purchase_transactions")
        .select("total_amount")
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate)
        .eq("transaction_type", "Jasa")
        .eq("approval_status", "approved");

      // Fetch Pengeluaran Kas dari kas_transaksi (payment_type = 'Pengeluaran Kas')
      const { data: disbursements, error: errorDisbursements } = await supabase
        .from("kas_transaksi")
        .select("amount")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate)
        .eq("payment_type", "Pengeluaran Kas")
        .eq("approval_status", "approved");

      // Calculate totals
      const totalPenjualanBarang = (salesBarang || []).reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const totalPenjualanJasa = (salesJasa || []).reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const totalPenerimaanKas = (receipts || []).reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const totalPembelianBarang = (purchaseBarang || []).reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const totalPembelianJasa = (purchaseJasa || []).reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const totalPengeluaranKas = (disbursements || []).reduce((sum, t) => sum + (t.amount || 0), 0);

      const totalRevenue = totalPenjualanBarang + totalPenjualanJasa + totalPenerimaanKas;
      const totalExpense = totalPembelianBarang + totalPembelianJasa + totalPengeluaranKas;
      const netProfit = totalRevenue - totalExpense;

      console.log("💰 Summary:", {
        totalPenjualanBarang,
        totalPenjualanJasa,
        totalPenerimaanKas,
        totalRevenue,
        totalPembelianBarang,
        totalPembelianJasa,
        totalPengeluaranKas,
        totalExpense,
        netProfit
      });

      // Fetch total assets (unchanged)
      const { data: assetsData } = await supabase
        .from("chart_of_accounts")
        .select("account_code")
        .eq("account_type", "Aset");

      let totalAssets = 0;
      if (assetsData && assetsData.length > 0) {
        const accountCodes = assetsData.map((a) => a.account_code);
        const { data: glData } = await supabase
          .from("general_ledger")
          .select("debit, credit")
          .in("account_code", accountCodes);

        totalAssets = (glData || []).reduce(
          (sum, item) => sum + (item.debit || 0) - (item.credit || 0),
          0
        );
      }

      setSummary({
        totalRevenue,
        totalExpense,
        netProfit,
        totalAssets,
      });

      console.log("📊 Calculated summary:", {
        totalRevenue,
        totalExpense,
        netProfit,
        totalAssets,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memuat ringkasan keuangan",
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

  const handleBack = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-0">
      {/* Header with gradient */}
      <div className="border-b bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 shadow-lg">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Dashboard Keuangan
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Keuangan
            </h1>
            <p className="text-gray-600 mt-1">Ringkasan keuangan bulan ini</p>
          </div>

          {/* Month and Year Filters */}
          <div className="flex gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={0}>Semua</option>
              <option value={1}>Januari</option>
              <option value={2}>Februari</option>
              <option value={3}>Maret</option>
              <option value={4}>April</option>
              <option value={5}>Mei</option>
              <option value={6}>Juni</option>
              <option value={7}>Juli</option>
              <option value={8}>Agustus</option>
              <option value={9}>September</option>
              <option value={10}>Oktober</option>
              <option value={11}>November</option>
              <option value={12}>Desember</option>
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from(
                { length: 5 },
                (_, i) => currentDate.getFullYear() - 2 + i,
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              {/* Total Pendapatan */}
              <Card 
                className="bg-white shadow-md rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  if (canClick(userRole)) {
                    setModalType("pendapatan");
                    setModalOpen(true);
                  }
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Revenue Bulan Ini
                  </CardTitle>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">
                    {formatRupiah(summary.totalRevenue)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Klik untuk detail
                  </p>
                </CardContent>
              </Card>

              {/* Total Beban */}
              <Card 
                className="bg-white shadow-md rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  if (canClick(userRole)) {
                    setModalType("beban");
                    setModalOpen(true);
                  }
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Expense Bulan Ini
                  </CardTitle>
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700">
                    - {formatRupiah(summary.totalExpense)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Klik untuk detail
                  </p>
                </CardContent>
              </Card>

              {/* Laba Bersih */}
              <Card
                className={`shadow-md rounded-2xl border-2 hover:shadow-lg transition-shadow cursor-pointer ${
                  summary.netProfit >= 0
                    ? "bg-blue-50 border-blue-500"
                    : "bg-orange-50 border-orange-500"
                }`}
                onClick={() => {
                  if (canClick(userRole)) {
                    setModalType("laba");
                    setModalOpen(true);
                  }
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Profit Bersih Bulan Ini
                  </CardTitle>
                  <DollarSign
                    className={`h-5 w-5 ${
                      summary.netProfit >= 0
                        ? "text-blue-600"
                        : "text-orange-600"
                    }`}
                  />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      summary.netProfit >= 0
                        ? "text-blue-700"
                        : "text-orange-700"
                    }`}
                  >
                    {summary.netProfit < 0 ? "- " : ""}
                    {formatRupiah(Math.abs(summary.netProfit))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {summary.netProfit >= 0 ? "Laba" : "Rugi"}
                  </p>
                </CardContent>
              </Card>

              {/* Total Aset */}
              {/*<Link to="/balance-sheet">*/}
              <Link
                to="/balance-sheet"
                onClick={(e) => {
                  if (!canClick(userRole)) {
                    e.preventDefault();
                  }
                }}
              >
                <Card className="bg-white shadow-md rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Aset Saat Ini
                    </CardTitle>
                    <Wallet className="h-5 w-5 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-700">
                      {formatRupiah(summary.totalAssets)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Klik untuk detail
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Financial Reports Stats Cards */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📊 Laporan Keuangan
              </h2>
              <div className="grid md:grid-cols-4 gap-4">
                {/* Laporan Keuangan Terintegrasi */}
                {/*    <Link to="/laporan-keuangan">*/}
                <Link
                  to="/laporan-keuangan"
                  onClick={(e) => {
                    if (!canClick(userRole)) {
                      e.preventDefault();
                    }
                  }}
                >
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-purple-800">
                        Laporan Keuangan
                      </CardTitle>
                      <FileText className="h-5 w-5 text-purple-600" />
                    </CardHeader>

                    <CardContent>
                      <p className="text-xs text-purple-700">
                        Laporan keuangan terintegrasi lengkap
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                {/* Laba Rugi */}
                {/*<Link to="/profit-loss"> */}
                <Link
                  to="/profit-loss"
                  onClick={(e) => {
                    if (!canClick(userRole)) {
                      e.preventDefault();
                    }
                  }}
                >
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-green-800">
                        Laba Rugi
                      </CardTitle>
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-green-700">
                        Detail pendapatan, beban, dan laba/rugi
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                {/* Neraca */}
                {/*<Link to="/balance-sheet"> */}
                <Link
                  to="/balance-sheet"
                  onClick={(e) => {
                    if (!canClick(userRole)) {
                      e.preventDefault();
                    }
                  }}
                >
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-blue-800">
                        Neraca
                      </CardTitle>
                      <Scale className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-blue-700">
                        Posisi aset, kewajiban, dan ekuitas
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                {/* Arus Kas */}
                {/*<Link to="/cash-flow"> */}
                <Link
                  to="/cash-flow"
                  onClick={(e) => {
                    if (!canClick(userRole)) {
                      e.preventDefault();
                    }
                  }}
                >
                  <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-300 hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-cyan-800">
                        Arus Kas
                      </CardTitle>
                      <Wallet className="h-5 w-5 text-cyan-600" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-cyan-700">
                        Laporan kas masuk dan kas keluar
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Additional Reports Section */}
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  📚 Laporan Detail
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* General Ledger */}
                  <Link
                    to="/general-ledger"
                    onClick={(e) => {
                      if (!canClick(userRole)) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-orange-800">
                          General Ledger
                        </CardTitle>
                        <BookOpen className="h-5 w-5 text-orange-600" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-orange-700">
                          Buku besar per akun COA
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Trial Balance */}
                  <Link
                    to="/trial-balance"
                    onClick={(e) => {
                      if (!canClick(userRole)) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-300 hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-800">
                          Trial Balance
                        </CardTitle>
                        <Scale className="h-5 w-5 text-indigo-600" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-indigo-700">
                          Neraca saldo per akun
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* COA Management */}
                  <Link
                    to="/coa-management"
                    onClick={(e) => {
                      if (!canClick(userRole)) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-300 hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-pink-800">
                          Chart of Accounts
                        </CardTitle>
                        <FileText className="h-5 w-5 text-pink-600" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-pink-700">
                          Kelola akun COA
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </div>
            </div>

            {/* Monthly Finance Chart */}
            <Card className="bg-white shadow-md rounded-2xl border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  📈 Tren Keuangan (Line Chart)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyFinanceChart />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type={modalType}
        month={selectedMonth}
        year={selectedYear}
      />
    </div>
  );
}
