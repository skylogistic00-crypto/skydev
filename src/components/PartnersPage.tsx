import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Package, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PartnersPage() {
  const navigate = useNavigate();

  const items = [
    {
      title: "Suppliers",
      description: "Kelola data pemasok",
      icon: Package,
      path: "/supplier",
    },
    {
      title: "Customers",
      description: "Kelola data pelanggan",
      icon: Users,
      path: "/customer",
    },
    {
      title: "Shippers",
      description: "Kelola data pengirim",
      icon: Truck,
      path: "/shipper",
    },
    {
      title: "Consignees",
      description: "Kelola data penerima",
      icon: Package,
      path: "/consignee",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Partners</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
