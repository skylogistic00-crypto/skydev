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
import { Loader2, Save, RefreshCw } from "lucide-react";

interface COAAccount {
  account_code: string;
  account_name: string;
  account_type: string;
}

interface ServiceItem {
  id: string;
  item_name: string;
  price: number;
  coa_revenue_code: string | null;
  coa_expense_code: string | null;
}

interface InventoryItem {
  id: string;
  item_name: string;
  cost_per_unit: number;
  coa_inventory_code: string | null;
  coa_cogs_code: string | null;
}

export default function COAMappingManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"service" | "inventory">(
    "service",
  );

  const [coaAccounts, setCOAAccounts] = useState<COAAccount[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch COA accounts
    const { data: coa } = await supabase
      .from("chart_of_accounts")
      .select("account_code, account_name, account_type")
      .eq("is_active", true)
      .order("account_code");

    // Fetch service items
    const { data: services } = await supabase
      .from("service_items")
      .select("id, item_name, price, coa_revenue_code, coa_expense_code")
      .eq("is_active", true)
      .order("item_name");

    // Fetch inventory items - use correct field names from database
    const { data: inventory } = await supabase
      .from("inventory_items")
      .select(
        "id, nama_barang, cost_per_unit, coa_inventory_code, coa_cogs_code",
      )
      .order("nama_barang");

    setCOAAccounts(coa || []);
    setServiceItems(services || []);

    // Map nama_barang to item_name for consistency
    const mappedInventory = (inventory || []).map((item) => ({
      id: item.id,
      item_name: item.nama_barang,
      cost_per_unit: item.cost_per_unit,
      coa_inventory_code: item.coa_inventory_code,
      coa_cogs_code: item.coa_cogs_code,
    }));

    setInventoryItems(mappedInventory);
    setLoading(false);
  };

  const updateServiceCOA = async (
    itemId: string,
    field: "coa_revenue_code" | "coa_expense_code",
    value: string,
  ) => {
    const { error } = await supabase
      .from("service_items")
      .update({ [field]: value })
      .eq("id", itemId);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal update mapping COA",
        variant: "destructive",
      });
    } else {
      toast({
        title: "✅ Berhasil",
        description: "Mapping COA berhasil diupdate",
      });
      fetchData();
    }
  };

  const updateInventoryCOA = async (
    itemId: string,
    field: "coa_inventory_code" | "coa_cogs_code",
    value: string,
  ) => {
    const { error } = await supabase
      .from("inventory_items")
      .update({ [field]: value })
      .eq("id", itemId);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal update mapping COA",
        variant: "destructive",
      });
    } else {
      toast({
        title: "✅ Berhasil",
        description: "Mapping COA berhasil diupdate",
      });
      fetchData();
    }
  };

  const getRevenueAccounts = () =>
    coaAccounts.filter((acc) => acc.account_type === "Pendapatan");

  const getExpenseAccounts = () =>
    coaAccounts.filter((acc) => acc.account_type === "Beban Operasional");

  const getInventoryAccounts = () =>
    coaAccounts.filter((acc) => acc.account_code.startsWith("1-14"));

  const getCOGSAccounts = () =>
    coaAccounts.filter((acc) => acc.account_type === "Beban Pokok Penjualan");

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Card className="max-w-7xl mx-auto rounded-2xl shadow-md">
        <CardHeader className="p-4">
          <CardTitle className="text-2xl">Mapping Chart of Accounts</CardTitle>
          <CardDescription>
            Hubungkan setiap item barang/jasa dengan akun COA yang sesuai
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            <Button
              variant={activeTab === "service" ? "default" : "ghost"}
              onClick={() => setActiveTab("service")}
              className="rounded-b-none"
            >
              Service Items
            </Button>
            <Button
              variant={activeTab === "inventory" ? "default" : "ghost"}
              onClick={() => setActiveTab("inventory")}
              className="rounded-b-none"
            >
              Inventory Items
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Service Items Tab */}
              {activeTab === "service" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Service Items - COA Mapping
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchData}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Jasa</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead>Akun Pendapatan (Kredit)</TableHead>
                        <TableHead>Akun Beban (Debit)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.item_name}
                          </TableCell>
                          <TableCell>
                            Rp {item.price.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.coa_revenue_code || ""}
                              onValueChange={(value) =>
                                updateServiceCOA(
                                  item.id,
                                  "coa_revenue_code",
                                  value,
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih akun..." />
                              </SelectTrigger>
                              <SelectContent>
                                {getRevenueAccounts().map((acc) => (
                                  <SelectItem
                                    key={acc.account_code}
                                    value={acc.account_code}
                                  >
                                    {acc.account_code} - {acc.account_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.coa_expense_code || ""}
                              onValueChange={(value) =>
                                updateServiceCOA(
                                  item.id,
                                  "coa_expense_code",
                                  value,
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih akun..." />
                              </SelectTrigger>
                              <SelectContent>
                                {getExpenseAccounts().map((acc) => (
                                  <SelectItem
                                    key={acc.account_code}
                                    value={acc.account_code}
                                  >
                                    {acc.account_code} - {acc.account_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Inventory Items Tab */}
              {activeTab === "inventory" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Inventory Items - COA Mapping
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchData}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Barang</TableHead>
                        <TableHead>Cost per Unit</TableHead>
                        <TableHead>Akun Persediaan (Debit)</TableHead>
                        <TableHead>Akun HPP (Debit)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.item_name}
                          </TableCell>
                          <TableCell>
                            Rp{" "}
                            {(item.cost_per_unit || 0).toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.coa_inventory_code || ""}
                              onValueChange={(value) =>
                                updateInventoryCOA(
                                  item.id,
                                  "coa_inventory_code",
                                  value,
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih akun..." />
                              </SelectTrigger>
                              <SelectContent>
                                {getInventoryAccounts().map((acc) => (
                                  <SelectItem
                                    key={acc.account_code}
                                    value={acc.account_code}
                                  >
                                    {acc.account_code} - {acc.account_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.coa_cogs_code || ""}
                              onValueChange={(value) =>
                                updateInventoryCOA(
                                  item.id,
                                  "coa_cogs_code",
                                  value,
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih akun..." />
                              </SelectTrigger>
                              <SelectContent>
                                {getCOGSAccounts().map((acc) => (
                                  <SelectItem
                                    key={acc.account_code}
                                    value={acc.account_code}
                                  >
                                    {acc.account_code} - {acc.account_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
