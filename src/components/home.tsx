import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canClick } from "@/utils/roleAccess";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Package,
  DollarSign,
  Users,
  FileText,
  Settings,
  TrendingUp,
  Warehouse,
  ShoppingCart,
  Truck,
  UserCheck,
  Building2,
  PackageOpen,
  ClipboardList,
  BarChart3,
  BookOpen,
  FileSpreadsheet,
  Calculator,
  Briefcase,
} from "lucide-react";

function Home() {
  const navigate = useNavigate();
  const { userProfile, userRole } = useAuth();

  const menuCards = [
    {
      title: "Dashboard Keuangan",
      description: "Lihat ringkasan keuangan dan laporan",
      icon: LayoutDashboard,
      path: "/dashboard-keuangan",
      color: "bg-purple-500",
      roles: [
        "super_admin",
        "accounting_manager",
        "accounting_staff",
        "read_only",
      ],
    },
    {
      title: "Transaksi Keuangan",
      description: "Kelola transaksi kas dan keuangan",
      icon: DollarSign,
      path: "/transaksi-keuangan",
      color: "bg-green-500",
      roles: ["super_admin", "accounting_manager", "accounting_staff"],
    },
    {
      title: "Manajemen Stok",
      description: "Kelola inventori dan stok barang",
      icon: Package,
      path: "/stock",
      color: "bg-blue-500",
      roles: ["super_admin", "warehouse_manager", "warehouse_staff"],
    },
    {
      title: "Gudang",
      description: "Kelola data gudang dan lokasi",
      icon: Warehouse,
      path: "/warehouses",
      color: "bg-orange-500",
      roles: ["super_admin", "warehouse_manager", "warehouse_staff"],
    },
    {
      title: "Delivery",
      description: "Kelola pengiriman barang",
      icon: Truck,
      path: "/delivery",
      color: "bg-cyan-600",
      roles: ["super_admin", "warehouse_manager", "warehouse_staff"],
    },
    {
      title: "Partners",
      description: "Kelola data supplier, customer, shipper & consignee",
      icon: Users,
      path: "/partners",
      color: "bg-teal-500",
      roles: [
        "super_admin",
        "purchasing",
        "accounting_manager",
        "accounting_staff",
        "warehouse_manager",
      ],
    },
    {
      title: "Barang Management",
      description: "Kelola barang lini, keluar, adjustment & import, serta AWB",
      icon: PackageOpen,
      path: "/barang-management",
      color: "bg-violet-500",
      roles: ["super_admin", "warehouse_manager", "warehouse_staff"],
    },
    {
      title: "COA Management",
      description: "Kelola chart of accounts",
      icon: BookOpen,
      path: "/coa-management",
      color: "bg-emerald-500",
      roles: ["super_admin", "accounting_manager"],
    },
    {
      title: "Stock Adjustment",
      description: "Kelola penyesuaian stok",
      icon: Calculator,
      path: "/stock-adjustment",
      color: "bg-slate-500",
      roles: ["super_admin", "warehouse_manager", "accounting_manager"],
    },
    {
      title: "Barang Import",
      description: "Kelola data stok barang import",
      icon: Package,
      path: "/stock-barang-import",
      color: "bg-violet-500",
      roles: [
        "super_admin",
        "warehouse_manager",
        "accounting_manager",
        "accounting_staff",
        "warehouse_staff",
        "read_only",
      ],
    },
    {
      title: "Laporan",
      description: "Lihat berbagai laporan keuangan",
      icon: FileText,
      path: "/laporan-keuangan",
      color: "bg-indigo-500",
      roles: [
        "super_admin",
        "accounting_manager",
        "accounting_staff",
        "read_only",
      ],
    },
    {
      title: "Manajemen User",
      description: "Kelola pengguna dan hak akses",
      icon: Users,
      path: "/users",
      color: "bg-red-500",
      roles: ["super_admin"],
    },
    {
      title: "Laporan Pajak",
      description: "Kelola pengguna dan hak akses",
      icon: BookOpen,
      path: "/tax-reports",
      color: "bg-red-500",
      roles: ["super_admin"],
    },
    {
      title: "HRD Management",
      description: "Kelola karyawan, absensi, payroll & kinerja",
      icon: Briefcase,
      path: "/hrd-dashboard",
      color: "bg-blue-600",
      roles: ["super_admin", "hr_manager", "hr_staff"],
    },
  ];

  const currentRole = userRole || "guest";
  const filteredMenus = menuCards.filter((menu) =>
    menu.roles.includes(currentRole),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Selamat Datang di Sistem Manajemen
          </h1>
          <p className="text-gray-600">Pilih menu di bawah untuk memulai</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMenus.map((menu) => {
            const Icon = menu.icon;
            return (
              <Card
                key={menu.path}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(menu.path)}
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 ${menu.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{menu.title}</CardTitle>
                  <CardDescription>{menu.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(menu.path);
                    }}
                  >
                    Buka Menu →
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Home;
