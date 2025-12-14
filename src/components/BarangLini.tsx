import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useToast } from "./ui/use-toast";
import {
  Pencil,
  Trash2,
  Plus,
  Package,
  ArrowLeft,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useNavigate } from "react-router-dom";
import { canClick, canDelete, canView, canEdit } from "@/utils/roleAccess";

export default function BarangLini() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("lini1");

  // Lini 1 states
  const [lini1Items, setLini1Items] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isLini1DialogOpen, setIsLini1DialogOpen] = useState(false);
  const [selectedStockItems, setSelectedStockItems] = useState<any[]>([]);
  const { user, userRole } = useAuth();

  // Lini 2 states
  const [lini2Items, setLini2Items] = useState<any[]>([]);
  const [lini2ItemsWithStock, setLini2ItemsWithStock] = useState<any[]>([]);
  const [isLini2DialogOpen, setIsLini2DialogOpen] = useState(false);
  const [lini2FormData, setLini2FormData] = useState({
    item_name: "",
    sku: "",
    awb: "",
    item_arrival_date: "",
    item_arrival_date_lini_2: new Date().toISOString().split("T")[0],
    storage_duration: 0,
    storage_duration_lini_2: 0,
    status: "Lini 2",
    total_price: "",
    total_price_lini_2: "",
    final_price: "",
  });

  useEffect(() => {
    fetchLini1Items();
    fetchLini2Items();
    fetchStockItems();

    const channel1 = supabase
      .channel("barang_lini_1_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "barang_lini_1" },
        () => {
          fetchLini1Items();
        },
      )
      .subscribe();

    const channel2 = supabase
      .channel("barang_lini_2_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "barang_lini_2" },
        () => {
          fetchLini2Items();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    };
  }, []);

  const fetchStockItems = async () => {
    try {
      console.log("🔍 Fetching stock items...");

      const { data, error } = await supabase
        .from("stock")
        .select(
          "id, item_name, sku, item_arrival_date, airwaybills, item_quantity, unit, warehouses, zones, racks, lots",
        )
        .not("item_arrival_date", "is", null)
        .order("item_arrival_date", { ascending: false });

      console.log("📦 Stock data received:", data);
      console.log("❌ Error (if any):", error);

      if (error) throw error;

      setStockItems((data || []) as any);

      // Extract unique dates
      const dates = [
        ...new Set(data?.map((item) => item.item_arrival_date).filter(Boolean)),
      ];
      console.log("📅 Available dates:", dates);
      setAvailableDates(dates);
    } catch (error) {
      console.error("❌ Error fetching stock items:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil data stock: " + (error as any).message,
        variant: "destructive",
      });
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);

    // Filter stock items by selected date
    const filtered = stockItems.filter(
      (item) => item.item_arrival_date === date,
    );
    setSelectedStockItems(filtered);
  };

  const handleAddAllToLini1 = async () => {
    if (selectedStockItems.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada barang yang dipilih",
        variant: "destructive",
      });
      return;
    }

    try {
      const itemsToInsert = selectedStockItems.map((stock) => {
        let storageDuration = 0;
        if (stock.item_arrival_date) {
          const arrivalDate = new Date(stock.item_arrival_date);
          const today = new Date();
          const diffTime = today.getTime() - arrivalDate.getTime();
          storageDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        const totalPrice = storageDuration * 5000;

        return {
          stock_id: stock.id,
          item_name: stock.item_name,
          sku: stock.sku,
          awb: stock.airwaybills || null,
          item_arrival_date: stock.item_arrival_date,
          item_quantity: stock.item_quantity || null,
          unit: stock.unit || null,
          warehouses: stock.warehouses || null,
          zones: stock.zones || null,
          racks: stock.racks || null,
          lots: stock.lots || null,
          storage_duration: storageDuration,
          status: "Lini 1",
          total_price: totalPrice,
        };
      });

      const { error } = await supabase
        .from("barang_lini_1")
        .insert(itemsToInsert);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${itemsToInsert.length} barang berhasil ditambahkan ke Lini 1`,
      });

      setIsLini1DialogOpen(false);
      setSelectedDate("");
      setSelectedStockItems([]);
      fetchLini1Items();
    } catch (error) {
      console.error("Error adding items:", error);
      const errorMessage = error instanceof Error ? error.message : "Gagal menambahkan barang";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Lini 1 functions
  const fetchLini1Items = async () => {
    try {
      const { data, error } = await supabase
        .from("barang_lini_1")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLini1Items(data || []);
    } catch (error) {
      console.error("Error fetching lini 1 items:", error);
    }
  };

  const handleLini1Delete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    try {
      const { error } = await supabase
        .from("barang_lini_1")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Data barang berhasil dihapus" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus data",
        variant: "destructive",
      });
    }
  };

  // Lini 2 functions
  const fetchLini2Items = async () => {
    try {
      const { data, error } = await supabase
        .from("barang_lini_2")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch stock data for each item based on SKU
      const itemsWithStock = await Promise.all(
        (data || []).map(async (item) => {
          const { data: stockData } = await supabase
            .from("stock")
            .select("quantity, unit, warehouses, zones, racks, lots")
            .eq("sku", item.sku)
            .single();

          return {
            ...item,
            stock_quantity: stockData?.quantity || item.item_quantity,
            stock_unit: stockData?.unit || item.unit,
            stock_warehouses: stockData?.warehouses || item.warehouses,
            stock_zones: stockData?.zones || item.zones,
            stock_racks: stockData?.racks || item.racks,
            stock_lots: stockData?.lots || item.lots,
          };
        }),
      );

      setLini2Items(data || []);
      setLini2ItemsWithStock(itemsWithStock);
    } catch (error) {
      console.error("Error fetching lini 2 items:", error);
    }
  };

  const handlePindahkanLini2 = async (item: any) => {
    if (!confirm(`Pindahkan ${item.item_name} ke Lini 2?`)) return;

    try {
      console.log("Starting move to Lini 2 for item:", item);

      let storageDurationLini1 = 0;
      if (item.item_arrival_date) {
        const arrivalDate = new Date(item.item_arrival_date);
        const today = new Date();
        const diffTime = today.getTime() - arrivalDate.getTime();
        storageDurationLini1 = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      const biayaLini1 = storageDurationLini1 * 5000;

      console.log("Calculated values:", {
        storageDurationLini1,
        biayaLini1,
      });

      // Update Lini 1
      const { error: updateLini1Error } = await supabase
        .from("barang_lini_1")
        .update({
          total_price: biayaLini1,
          storage_duration: storageDurationLini1,
          status: "Lini 2",
        })
        .eq("id", item.id);

      if (updateLini1Error) {
        console.error("Error updating Lini 1:", updateLini1Error);
        throw updateLini1Error;
      }

      console.log("Lini 1 updated successfully");

      // Prepare data for Lini 2 - Include stock-related fields
      const dataToInsert = {
        item_name: item.item_name,
        sku: item.sku,
        awb: item.awb || null,
        item_arrival_date: item.item_arrival_date || null,
        item_arrival_date_lini_2: new Date().toISOString(),
        storage_duration: storageDurationLini1,
        storage_duration_lini_2: 0,
        status: "Lini 2",
        total_price: biayaLini1,
        total_price_lini_2: 0,
        final_price: biayaLini1 + 0,
        item_quantity: item.item_quantity || null,
        unit: item.unit || null,
        warehouses: item.warehouses || null,
        zones: item.zones || null,
        racks: item.racks || null,
        lots: item.lots || null,
      };

      console.log("Data to insert into Lini 2:", dataToInsert);

      // Insert to Lini 2
      const { data: insertedData, error: insertError } = await supabase
        .from("barang_lini_2")
        .insert(dataToInsert)
        .select();

      if (insertError) {
        console.error("Error inserting to Lini 2:", insertError);
        throw insertError;
      }

      console.log("Successfully inserted to Lini 2:", insertedData);

      toast({
        title: "Berhasil",
        description: `${item.item_name} berhasil dipindahkan ke Lini 2`,
      });

      fetchLini1Items();
      fetchLini2Items();
    } catch (error: any) {
      console.error("Error moving to lini 2:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memindahkan barang ke Lini 2",
        variant: "destructive",
      });
    }
  };

  const handleDiambilSupplier = async (item: any) => {
    if (!confirm(`Tandai ${item.item_name} sebagai diambil oleh supplier?`))
      return;

    try {
      // Delete dari Lini 1
      const { error } = await supabase
        .from("barang_lini_1")
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `${item.item_name} telah diambil oleh supplier`,
      });

      fetchLini1Items();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengupdate status barang",
        variant: "destructive",
      });
    }
  };

  const handleDiambilSupplierLini2 = async (item: any) => {
    if (!confirm(`Tandai ${item.item_name} sebagai diambil oleh supplier?`))
      return;

    try {
      // Calculate current lama simpan lini 2
      let lamaSimpanLini2 = 0;
      if (item.item_arrival_date_lini_2) {
        const arrivalDateLini2 = new Date(item.item_arrival_date_lini_2);
        const today = new Date();
        const diffTime = today.getTime() - arrivalDateLini2.getTime();
        lamaSimpanLini2 = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      const biayaLini1 = item.total_price || 0;
      const biayaLini2 = lamaSimpanLini2 * 2000;
      const totalBiaya = biayaLini1 + biayaLini2;

      // Update status and save calculated prices
      const { error } = await supabase
        .from("barang_lini_2")
        .update({
          status: "Diambil",
          storage_duration_lini_2: lamaSimpanLini2,
          total_price_lini_2: biayaLini2,
          final_price: totalBiaya,
        })
        .eq("id", item.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `${item.item_name} telah diambil oleh supplier`,
      });

      fetchLini2Items();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengupdate status barang",
        variant: "destructive",
      });
    }
  };

  const handleLini2Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Calculate storage duration lini 2 if date is provided
      let storageDurationLini2 = lini2FormData.storage_duration_lini_2;
      if (lini2FormData.item_arrival_date_lini_2) {
        const arrivalDateLini2 = new Date(
          lini2FormData.item_arrival_date_lini_2,
        );
        const today = new Date();
        const diffTime = today.getTime() - arrivalDateLini2.getTime();
        storageDurationLini2 = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Calculate prices
      const totalPrice = parseFloat(lini2FormData.total_price) || 0;
      const totalPriceLini2 = storageDurationLini2 * 2000;
      const finalPrice = totalPrice + totalPriceLini2;

      const dataToInsert = {
        item_name: lini2FormData.item_name,
        sku: lini2FormData.sku,
        awb: lini2FormData.awb || null,
        item_arrival_date: lini2FormData.item_arrival_date || null,
        item_arrival_date_lini_2: lini2FormData.item_arrival_date_lini_2,
        storage_duration: lini2FormData.storage_duration,
        storage_duration_lini_2: storageDurationLini2,
        status: lini2FormData.status,
        total_price: totalPrice || null,
        total_price_lini_2: totalPriceLini2,
        final_price: finalPrice,
      };

      const { error } = await supabase
        .from("barang_lini_2")
        .insert(dataToInsert);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Barang berhasil ditambahkan ke Lini 2",
      });

      setIsLini2DialogOpen(false);
      resetLini2Form();
      fetchLini2Items();
    } catch (error: any) {
      console.error("Error adding lini 2 item:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan barang",
        variant: "destructive",
      });
    }
  };

  const resetLini2Form = () => {
    setLini2FormData({
      item_name: "",
      sku: "",
      awb: "",
      item_arrival_date: "",
      item_arrival_date_lini_2: new Date().toISOString().split("T")[0],
      storage_duration: 0,
      storage_duration_lini_2: 0,
      status: "Lini 2",
      total_price: "",
      total_price_lini_2: "",
      final_price: "",
    });
  };

  const handleLini2Delete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    try {
      const { error } = await supabase
        .from("barang_lini_2")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Data barang berhasil dihapus" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus data",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header with gradient */}
      <div className="border-b bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 shadow-lg">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Manajemen Barang Lini
                </h1>
                <p className="text-sm text-blue-100">
                  Kelola barang lini 1 dan lini 2
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-none shadow-lg bg-purple-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Barang Lini 1
                </CardDescription>
                <Package className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {lini1Items.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <Package className="mr-2 h-4 w-4" />
                Total barang di lini 1
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-emerald-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Barang Lini 2
                </CardDescription>
                <Package className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {lini2Items.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <Package className="mr-2 h-4 w-4" />
                Total barang di lini 2
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 bg-gradient-to-r from-indigo-100 to-blue-100">
                <TabsTrigger
                  value="lini1"
                  className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                >
                  Barang Lini 1
                </TabsTrigger>
                <TabsTrigger
                  value="lini2"
                  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  Barang Lini 2
                </TabsTrigger>
              </TabsList>

              {/* Lini 1 Tab */}
              <TabsContent value="lini1">
                <div className="flex justify-end mb-4">
                  <Dialog
                    open={isLini1DialogOpen}
                    onOpenChange={setIsLini1DialogOpen}
                  >
                    <DialogTrigger asChild>
                      {canClick(userRole) && (
                        <Button
                          onClick={() => {
                            setSelectedDate("");
                            setSelectedStockItems([]);
                            fetchStockItems();
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Tambah Barang Lini 1
                        </Button>
                      )}
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Tambah Barang ke Lini 1</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="date_select">
                            Pilih Tanggal Barang Masuk *
                          </Label>
                          {availableDates.length === 0 ? (
                            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                              ⚠️ Tidak ada data stock dengan tanggal masuk
                              barang.
                            </div>
                          ) : (
                            <>
                              <Select
                                value={selectedDate}
                                onValueChange={handleDateSelect}
                              >
                                <SelectTrigger id="date_select">
                                  <SelectValue placeholder="-- Pilih tanggal --" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableDates.filter((date) => date).map((date) => (
                                    <SelectItem key={date} value={date}>
                                      {new Date(date).toLocaleDateString(
                                        "id-ID",
                                        {
                                          weekday: "long",
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        },
                                      )}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-slate-500">
                                Total {availableDates.length} tanggal tersedia
                              </p>
                            </>
                          )}
                        </div>

                        {selectedDate && selectedStockItems.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <h3 className="text-sm font-semibold text-slate-700">
                                Barang yang akan ditambahkan (
                                {selectedStockItems.length} item)
                              </h3>
                              <Button onClick={handleAddAllToLini1}>
                                Tambahkan Semua ke Lini 1
                              </Button>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-slate-50">
                                    <TableHead>Nama Barang</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>AWB</TableHead>
                                    <TableHead>Tanggal Masuk</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead>Satuan</TableHead>
                                    <TableHead>Gudang</TableHead>
                                    <TableHead>Zona</TableHead>
                                    <TableHead>Rak</TableHead>
                                    <TableHead>Lot</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedStockItems.map((stock) => (
                                    <TableRow key={stock.id}>
                                      <TableCell className="font-medium">
                                        {stock.item_name}
                                      </TableCell>
                                      <TableCell className="font-mono text-indigo-600">
                                        {stock.sku}
                                      </TableCell>
                                      <TableCell>
                                        {stock.airwaybills || "-"}
                                      </TableCell>
                                      <TableCell>
                                        {stock.item_arrival_date
                                          ? new Date(
                                              stock.item_arrival_date,
                                            ).toLocaleDateString("id-ID")
                                          : "-"}
                                      </TableCell>
                                      <TableCell className="font-semibold">
                                        {stock.item_quantity || "-"}
                                      </TableCell>
                                      <TableCell>{stock.unit || "-"}</TableCell>
                                      <TableCell>
                                        {stock.warehouses || "-"}
                                      </TableCell>
                                      <TableCell>
                                        {stock.zones || "-"}
                                      </TableCell>
                                      <TableCell>
                                        {stock.racks || "-"}
                                      </TableCell>
                                      <TableCell>{stock.lots || "-"}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-100 to-blue-100 hover:from-slate-100 hover:to-blue-100">
                        <TableHead className="font-semibold text-slate-700">
                          Nama Barang
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          SKU
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          AWB
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Tanggal Masuk
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Jumlah
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Satuan
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Gudang
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Zona
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Rak
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Lot
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Lama Simpan
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Total Biaya
                        </TableHead>
                        <TableHead className="text-right font-semibold text-slate-700">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lini1Items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={14}
                            className="text-center text-slate-500 py-12"
                          >
                            <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                              <Package className="h-12 w-12 text-slate-300" />
                            </div>
                            <p className="font-medium text-lg">
                              Belum ada data barang
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                              Klik tombol "Tambah Barang Lini 1" untuk
                              menambahkan data
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        lini1Items.map((item) => {
                          const lamaSimpan = item.storage_duration || 0;
                          const lamaSimpanText =
                            lamaSimpan >= 0 ? `${lamaSimpan} hari` : "0 hari";
                          const totalPrice = item.total_price || 0;

                          return (
                            <TableRow
                              key={item.id}
                              className="hover:bg-indigo-50 transition-colors"
                            >
                              <TableCell className="font-medium">
                                {item.item_name}
                              </TableCell>
                              <TableCell className="font-mono text-indigo-600">
                                {item.sku}
                              </TableCell>
                              <TableCell>{item.awb || "-"}</TableCell>
                              <TableCell>
                                {item.item_arrival_date
                                  ? new Date(
                                      item.item_arrival_date,
                                    ).toLocaleDateString("id-ID")
                                  : "-"}
                              </TableCell>
                              <TableCell className="font-semibold">
                                {item.item_quantity || "-"}
                              </TableCell>
                              <TableCell>{item.unit || "-"}</TableCell>
                              <TableCell>{item.warehouses || "-"}</TableCell>
                              <TableCell>{item.zones || "-"}</TableCell>
                              <TableCell>{item.racks || "-"}</TableCell>
                              <TableCell>{item.lots || "-"}</TableCell>
                              <TableCell>
                                <span className="font-semibold text-blue-600">
                                  {lamaSimpanText}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    item.status === "Lini 2"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </TableCell>
                              <TableCell className="font-bold text-emerald-600">
                                {formatCurrency(totalPrice)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePindahkanLini2(item)}
                                    disabled={item.status === "Lini 2"}
                                    className="text-purple-600 hover:bg-purple-50 disabled:opacity-50"
                                    title="Dipindahkan Ke Lini 2"
                                  >
                                    <ArrowRight className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDiambilSupplier(item)}
                                    disabled={item.status === "Lini 2"}
                                    className="text-green-600 hover:bg-green-50 disabled:opacity-50"
                                    title="Diambil oleh Supplier"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </Button>
                                  {canDelete(userRole) && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleLini1Delete(item.id)}
                                      className="hover:bg-red-50"
                                      title="Hapus Data"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Lini 2 Tab */}
              <TabsContent value="lini2">
                <div className="flex justify-end mb-4">
                  <Dialog
                    open={isLini2DialogOpen}
                    onOpenChange={setIsLini2DialogOpen}
                  >
                    <DialogTrigger asChild>
                      {canClick(userRole) && (
                        <Button onClick={resetLini2Form}>
                          <Plus className="w-4 h-4 mr-2" />
                          Tambah Barang Lini 2
                        </Button>
                      )}
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Tambah Barang ke Lini 2</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleLini2Submit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="item_name">Nama Barang *</Label>
                            <Input
                              id="item_name"
                              value={lini2FormData.item_name}
                              onChange={(e) =>
                                setLini2FormData({
                                  ...lini2FormData,
                                  item_name: e.target.value,
                                })
                              }
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="sku">SKU *</Label>
                            <Input
                              id="sku"
                              value={lini2FormData.sku}
                              onChange={(e) =>
                                setLini2FormData({
                                  ...lini2FormData,
                                  sku: e.target.value,
                                })
                              }
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="awb">AWB</Label>
                            <Input
                              id="awb"
                              value={lini2FormData.awb}
                              onChange={(e) =>
                                setLini2FormData({
                                  ...lini2FormData,
                                  awb: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="item_arrival_date">
                              Tanggal Masuk Barang
                            </Label>
                            <Input
                              id="item_arrival_date"
                              type="date"
                              value={lini2FormData.item_arrival_date}
                              onChange={(e) =>
                                setLini2FormData({
                                  ...lini2FormData,
                                  item_arrival_date: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="item_arrival_date_lini_2">
                              Tanggal Masuk Barang Lini 2 *
                            </Label>
                            <Input
                              id="item_arrival_date_lini_2"
                              type="date"
                              value={lini2FormData.item_arrival_date_lini_2}
                              onChange={(e) =>
                                setLini2FormData({
                                  ...lini2FormData,
                                  item_arrival_date_lini_2: e.target.value,
                                })
                              }
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="storage_duration">
                              Lama Simpan Lini 1 (hari)
                            </Label>
                            <Input
                              id="storage_duration"
                              type="number"
                              value={lini2FormData.storage_duration}
                              onChange={(e) =>
                                setLini2FormData({
                                  ...lini2FormData,
                                  storage_duration:
                                    parseInt(e.target.value) || 0,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="storage_duration_lini_2">
                              Lama Simpan Lini 2 (hari)
                            </Label>
                            <Input
                              id="storage_duration_lini_2"
                              type="number"
                              value={lini2FormData.storage_duration_lini_2}
                              onChange={(e) =>
                                setLini2FormData({
                                  ...lini2FormData,
                                  storage_duration_lini_2:
                                    parseInt(e.target.value) || 0,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="status">Status *</Label>
                            <Select
                              value={lini2FormData.status}
                              onValueChange={(value) =>
                                setLini2FormData({
                                  ...lini2FormData,
                                  status: value,
                                })
                              }
                            >
                              <SelectTrigger id="status">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Lini 2">Lini 2</SelectItem>
                                <SelectItem value="Diambil">Diambil</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="total_price">
                              Total Biaya di Lini 1
                            </Label>
                            <Input
                              id="total_price"
                              type="number"
                              step="0.01"
                              value={lini2FormData.total_price}
                              onChange={(e) =>
                                setLini2FormData({
                                  ...lini2FormData,
                                  total_price: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="total_price_lini_2">
                              Total Biaya di Lini 2
                            </Label>
                            <Input
                              id="total_price_lini_2"
                              type="number"
                              step="0.01"
                              value={lini2FormData.total_price_lini_2}
                              onChange={(e) =>
                                setLini2FormData({
                                  ...lini2FormData,
                                  total_price_lini_2: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2 col-span-2">
                            <Label>Total Biaya (Final)</Label>
                            <div className="text-2xl font-bold text-emerald-600">
                              {formatCurrency(
                                (parseFloat(lini2FormData.total_price) || 0) +
                                  (parseFloat(
                                    lini2FormData.total_price_lini_2,
                                  ) || 0),
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsLini2DialogOpen(false);
                              resetLini2Form();
                            }}
                          >
                            Batal
                          </Button>
                          <Button type="submit">Simpan</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-100 to-emerald-100 hover:from-slate-100 hover:to-emerald-100">
                        <TableHead className="font-semibold text-slate-700">
                          SKU
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Nama Barang
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          AWB
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Tanggal Masuk (L1)
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Tanggal Masuk L2
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Lama Simpan L2
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Harga Total (L1)
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Harga Total L2
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Harga Final
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Jumlah
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Satuan
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Gudang
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Zona
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Rak
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Lot
                        </TableHead>
                        <TableHead className="text-right font-semibold text-slate-700">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lini2Items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={17}
                            className="text-center text-slate-500 py-12"
                          >
                            <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                              <Package className="h-12 w-12 text-slate-300" />
                            </div>
                            <p className="font-medium text-lg">
                              Belum ada data barang
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                              Klik tombol "Tambah Barang Lini 2" untuk
                              menambahkan data
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        lini2ItemsWithStock.map((item) => {
                          const lamaSimpanLini2 =
                            item.storage_duration_lini_2 || 0;
                          const lamaSimpanLini2Text =
                            lamaSimpanLini2 >= 0
                              ? `${lamaSimpanLini2} hari`
                              : "0 hari";
                          const biayaLini1 = item.total_price || 0;
                          const biayaLini2 = item.total_price_lini_2 || 0;
                          const totalBiaya = item.final_price || 0;

                          return (
                            <TableRow
                              key={item.id}
                              className="hover:bg-emerald-50 transition-colors"
                            >
                              <TableCell className="font-mono text-indigo-600">
                                {item.sku}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    item.status === "Diambil"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium">
                                {item.item_name || item.nama_barang}
                              </TableCell>
                              <TableCell>{item.awb || "-"}</TableCell>
                              <TableCell>
                                {item.item_arrival_date
                                  ? new Date(
                                      item.item_arrival_date,
                                    ).toLocaleDateString("id-ID")
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                {item.item_arrival_date_lini_2
                                  ? new Date(
                                      item.item_arrival_date_lini_2,
                                    ).toLocaleDateString("id-ID")
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                <span className="font-semibold text-purple-600">
                                  {lamaSimpanLini2Text}
                                </span>
                              </TableCell>
                              <TableCell>
                                {formatCurrency(biayaLini1)}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(biayaLini2)}
                              </TableCell>
                              <TableCell className="font-bold text-emerald-600">
                                {formatCurrency(totalBiaya)}
                              </TableCell>
                              <TableCell>
                                {item.stock_quantity || "-"}
                              </TableCell>
                              <TableCell>{item.stock_unit || "-"}</TableCell>
                              <TableCell>
                                {item.stock_warehouses || "-"}
                              </TableCell>
                              <TableCell>{item.stock_zones || "-"}</TableCell>
                              <TableCell>{item.stock_racks || "-"}</TableCell>
                              <TableCell>{item.stock_lots || "-"}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleDiambilSupplierLini2(item)
                                    }
                                    disabled={item.status === "Diambil"}
                                    className="text-green-600 hover:bg-green-50 disabled:opacity-50"
                                    title="Diambil oleh Supplier"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </Button>
                                  {canDelete(userRole) && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleLini2Delete(item.id)}
                                      className="hover:bg-red-50"
                                      title="Hapus Data"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
