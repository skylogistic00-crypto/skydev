import { useState, useEffect } from "react";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Barcode,
  FileText,
  ArrowLeft,
  RefreshCw,
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

interface StockItem {
  id: string;
  sku: string;
  item_name: string;
  item_quantity: number;
  unit: string;
  rack_location: string;
  status: string;
}

interface StockMovement {
  id: string;
  sku: string;
  movement_type: string;
  quantity: number;
  created_at: string;
}

export default function WarehouseDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([]);

  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    stockIn: 0,
    stockOut: 0,
    lowStock: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch stock items
      const { data: stockData, error: stockError } = await supabase
        .from("stock")
        .select("*")
        .order("item_quantity", { ascending: true });

      if (stockError) throw stockError;

      // Fetch recent movements
      const { data: movementsData, error: movementsError } = await supabase
        .from("stock_movements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (movementsError) throw movementsError;

      setStockItems(stockData || []);
      setRecentMovements(movementsData || []);

      // Calculate low stock items (quantity < 10)
      const lowStock = (stockData || []).filter(
        (item) => item.item_quantity < 10
      );
      setLowStockItems(lowStock);

      // Calculate stats
      const totalItems = stockData?.length || 0;
      const stockInToday = (movementsData || []).filter(
        (m) =>
          m.movement_type === "in" &&
          new Date(m.created_at).toDateString() === new Date().toDateString()
      ).length;
      const stockOutToday = (movementsData || []).filter(
        (m) =>
          m.movement_type === "out" &&
          new Date(m.created_at).toDateString() === new Date().toDateString()
      ).length;

      setStats({
        totalItems,
        totalValue: 0,
        stockIn: stockInToday,
        stockOut: stockOutToday,
        lowStock: lowStock.length,
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6 px-4 shadow-lg">
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
                  <Package className="h-6 w-6" />
                  Dashboard Gudang
                </h1>
                <p className="text-indigo-100 text-sm">
                  Monitoring stok & pergerakan barang
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
                  <p className="text-sm text-slate-500">Total Item</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {stats.totalItems}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Masuk Hari Ini</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.stockIn}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Keluar Hari Ini</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.stockOut}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Stok Rendah</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.lowStock}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alert */}
          <Card className="bg-white shadow-md">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Peringatan Stok Rendah
              </CardTitle>
              <CardDescription>
                Item dengan stok kurang dari 10 unit
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {lowStockItems.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada stok rendah</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">
                          {item.item_name}
                        </p>
                        <p className="text-sm text-slate-500">
                          SKU: {item.sku}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">
                          {item.item_quantity} {item.unit}
                        </Badge>
                        <p className="text-xs text-slate-500 mt-1">
                          {item.rack_location || "-"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Movements */}
          <Card className="bg-white shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Pergerakan Terbaru
              </CardTitle>
              <CardDescription>10 transaksi terakhir</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {recentMovements.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada pergerakan</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {recentMovements.map((movement) => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {movement.movement_type === "in" ? (
                          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <TrendingDown className="h-4 w-4 text-orange-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-800">
                            {movement.sku}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(movement.created_at).toLocaleString(
                              "id-ID"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            movement.movement_type === "in"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {movement.movement_type === "in" ? "+" : "-"}
                          {movement.quantity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white shadow-md mt-6">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
            <CardTitle className="text-lg">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => navigate("/barang-masuk")}
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm">Barang Masuk</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => navigate("/barang-keluar")}
              >
                <TrendingDown className="h-5 w-5" />
                <span className="text-sm">Barang Keluar</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => navigate("/stock-form")}
              >
                <Package className="h-5 w-5" />
                <span className="text-sm">Tambah Stok</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => navigate("/stock-adjustment")}
              >
                <FileText className="h-5 w-5" />
                <span className="text-sm">Penyesuaian</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
