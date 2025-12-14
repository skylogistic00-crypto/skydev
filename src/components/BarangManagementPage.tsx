import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, PackageOpen, Plane, Warehouse } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BarangManagementPage() {
  const navigate = useNavigate();

  const items = [
    {
      title: "Barang Lini",
      description: "Kelola barang lini 1 & 2",
      icon: Warehouse,
      path: "/barang-lini",
    },
    {
      title: "Barang Keluar",
      description: "Kelola barang keluar",
      icon: PackageOpen,
      path: "/barang-keluar",
    },
    {
      title: "Stock Adjustment",
      description: "Kelola penyesuaian stok",
      icon: ClipboardList,
      path: "/stock-adjustment",
    },
    {
      title: "Barang Import",
      description: "Kelola barang import",
      icon: PackageOpen,
      path: "/stock-barang-import",
    },
    {
      title: "Air Waybill",
      description: "Kelola air waybill",
      icon: Plane,
      path: "/air-waybill",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Barang Management</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.path}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(item.path)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">
                    {item.title}
                  </CardTitle>
                  <Icon className="h-5 w-5 text-slate-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{item.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                  >
                    Buka
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
