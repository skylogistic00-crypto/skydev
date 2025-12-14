import { useState, useEffect } from "react";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  ArrowLeft,
  RefreshCw,
  Receipt,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { navigateBack } from "@/utils/navigation";

interface POSTransaction {
  id: string;
  transaction_number: string;
  total_amount: number;
  payment_method: string;
  customer_name: string;
  transaction_date: string;
  status: string;
}

export default function POSDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<
    POSTransaction[]
  >([]);

  const [stats, setStats] = useState({
    todaySales: 0,
    todayTransactions: 0,
    todayProfit: 0,
    averageTransaction: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch today's transactions
      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from("pos_transactions")
          .select("*")
          .gte("transaction_date", today.toISOString())
          .eq("status", "completed")
          .order("transaction_date", { ascending: false });

      if (transactionsError) throw transactionsError;

      setRecentTransactions(transactionsData || []);

      // Calculate stats
      const todaySales =
        transactionsData?.reduce((sum, t) => sum + (t.total_amount || 0), 0) ||
        0;
      const todayTransactions = transactionsData?.length || 0;
      const averageTransaction =
        todayTransactions > 0 ? todaySales / todayTransactions : 0;

      setStats({
        todaySales,
        todayTransactions,
        todayProfit: 0,
        averageTransaction,
      });
    } catch (err: any) {
      console.error("Fetch dashboard error:", err);
      toast({
        title: "Error",
        description: "Gagal memuat data dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      cash: "bg-green-100 text-green-800",
      card: "bg-blue-100 text-blue-800",
      qris: "bg-purple-100 text-purple-800",
    };
    return colors[method] || "bg-slate-100 text-slate-800";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-6 px-4 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateBack(navigate)}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6" />
                  Dashboard POS
                </h1>
                <p className="text-emerald-100 text-sm">
                  Monitoring penjualan & transaksi
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchDashboardData}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Penjualan Hari Ini</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    Rp {stats.todaySales.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Transaksi</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.todayTransactions}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Rata-rata</p>
                  <p className="text-2xl font-bold text-purple-600">
                    Rp {stats.averageTransaction.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pelanggan</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {
                      recentTransactions.filter((t) => t.customer_name).length
                    }
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="bg-white shadow-md">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Transaksi Hari Ini
            </CardTitle>
            <CardDescription>
              Daftar transaksi yang telah selesai
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada transaksi hari ini</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {transaction.transaction_number}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-slate-500">
                            {new Date(
                              transaction.transaction_date
                            ).toLocaleTimeString("id-ID")}
                          </p>
                          {transaction.customer_name && (
                            <>
                              <span className="text-slate-300">•</span>
                              <p className="text-xs text-slate-500">
                                {transaction.customer_name}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">
                        Rp {transaction.total_amount.toLocaleString("id-ID")}
                      </p>
                      <Badge
                        className={`mt-1 ${getPaymentMethodBadge(
                          transaction.payment_method
                        )}`}
                      >
                        {transaction.payment_method.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white shadow-md mt-6">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
            <CardTitle className="text-lg">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Button
                className="h-20 flex-col gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => navigate("/pos")}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="text-sm">Buka POS</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => navigate("/pos-transactions")}
              >
                <Receipt className="h-5 w-5" />
                <span className="text-sm">Riwayat</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => navigate("/pos-reports")}
              >
                <Calendar className="h-5 w-5" />
                <span className="text-sm">Laporan</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
