import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MonthlyData {
  period: string;
  revenue: number;
  expense: number;
  profit: number;
}

interface YearlySummary {
  totalRevenue: number;
  totalExpense: number;
  totalProfit: number;
}

export default function MonthlyFinanceChart() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [yearlySummary, setYearlySummary] = useState<YearlySummary>({
    totalRevenue: 0,
    totalExpense: 0,
    totalProfit: 0,
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    fetchMonthlyData();

    // Real-time subscription
    const channel = supabase
      .channel('realtime:journal_entries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journal_entries' }, () => {
        fetchMonthlyData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedYear]);

  const fetchMonthlyData = async () => {
    setLoading(true);

    try {
      // Fetch journal entries for the selected year
      const { data: journalEntries, error: journalError } = await supabase
        .from("journal_entries")
        .select("account_code, debit, credit, transaction_date")
        .gte("transaction_date", `${selectedYear}-01-01`)
        .lte("transaction_date", `${selectedYear}-12-31`);

      if (journalError) throw journalError;

      // Fetch COA accounts
      const { data: coaAccounts, error: coaError } = await supabase
        .from("chart_of_accounts")
        .select("account_code, account_type, normal_balance")
        .eq("is_active", true);

      if (coaError) throw coaError;

      // Create account type map
      const accountTypeMap: { [key: string]: { type: string; normalBalance: string } } = {};
      coaAccounts?.forEach((acc) => {
        accountTypeMap[acc.account_code] = {
          type: acc.account_type,
          normalBalance: acc.normal_balance,
        };
      });

      // Group by month
      const monthlyMap: { [key: string]: { revenue: number; expense: number } } = {};
      let yearlyRevenue = 0;
      let yearlyExpense = 0;

      journalEntries?.forEach((entry) => {
        const date = new Date(entry.transaction_date);
        const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        if (!monthlyMap[period]) {
          monthlyMap[period] = { revenue: 0, expense: 0 };
        }

        const accountInfo = accountTypeMap[entry.account_code];
        if (!accountInfo) return;

        const balance = entry.debit - entry.credit;
        const finalBalance = accountInfo.normalBalance === "Kredit" ? -balance : balance;

        if (accountInfo.type === "Pendapatan") {
          monthlyMap[period].revenue += finalBalance;
          yearlyRevenue += finalBalance;
        } else if (
          accountInfo.type === "Beban Pokok Penjualan" ||
          accountInfo.type === "Beban Operasional"
        ) {
          monthlyMap[period].expense += finalBalance;
          yearlyExpense += finalBalance;
        }
      });

      // Convert to array and calculate profit
      const data: MonthlyData[] = Object.keys(monthlyMap)
        .sort()
        .map((period) => ({
          period: formatPeriod(period),
          revenue: monthlyMap[period].revenue,
          expense: monthlyMap[period].expense,
          profit: monthlyMap[period].revenue - monthlyMap[period].expense,
        }));

      setChartData(data);
      setYearlySummary({
        totalRevenue: yearlyRevenue,
        totalExpense: yearlyExpense,
        totalProfit: yearlyRevenue - yearlyExpense,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memuat data grafik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPeriod = (period: string) => {
    const [year, month] = period.split("-");
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className="space-y-6">
      {/* Header with Year Filter */}
      <Card className="bg-white shadow-lg rounded-2xl border border-gray-200">
        <CardHeader className="p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800">
              📊 Grafik Keuangan Bulanan ({selectedYear})
            </CardTitle>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 border rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.filter((year) => year).map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Yearly Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl shadow-sm text-center border border-blue-200">
              <h3 className="text-sm text-gray-600 mb-2">💰 Total Revenue Tahun Ini</h3>
              <p className="text-lg font-semibold text-blue-600">{formatRupiah(yearlySummary.totalRevenue)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl shadow-sm text-center border border-red-200">
              <h3 className="text-sm text-gray-600 mb-2">💸 Total Expense Tahun Ini</h3>
              <p className="text-lg font-semibold text-red-600">{formatRupiah(yearlySummary.totalExpense)}</p>
            </div>
            <div className={`p-4 rounded-xl shadow-sm text-center border-2 ${
              yearlySummary.totalProfit >= 0 
                ? "bg-green-50 border-green-300" 
                : "bg-orange-50 border-orange-300"
            }`}>
              <h3 className="text-sm text-gray-600 mb-2">📈 Profit Bersih Tahun Ini</h3>
              <p className={`text-lg font-semibold ${
                yearlySummary.totalProfit >= 0 ? "text-green-600" : "text-orange-600"
              }`}>
                {formatRupiah(Math.abs(yearlySummary.totalProfit))}
              </p>
            </div>
          </div>

          {/* Line Chart */}
          <Card className="bg-white shadow-lg rounded-2xl border border-gray-200">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-semibold text-gray-800">Tren Keuangan (Line Chart)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`} />
                  <Tooltip
                    formatter={(value: number) => formatRupiah(value)}
                    labelStyle={{ color: "#000" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    name="Revenue"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#dc2626"
                    strokeWidth={2}
                    name="Expense"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#16a34a"
                    strokeWidth={2}
                    name="Profit"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="bg-white shadow-lg rounded-2xl border border-gray-200">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-semibold text-gray-800">Perbandingan Pendapatan vs Beban (Bar Chart)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`} />
                  <Tooltip
                    formatter={(value: number) => formatRupiah(value)}
                    labelStyle={{ color: "#000" }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#2563eb" name="Revenue" />
                  <Bar dataKey="expense" fill="#dc2626" name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}