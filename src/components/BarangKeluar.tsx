import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
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
import { useToast } from "./ui/use-toast";
import {
  Pencil,
  Trash2,
  Plus,
  TruckIcon,
  ArrowLeft,
  Package,
  ScanLine,
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
import { canEdit, canDelete } from "@/utils/roleAccess";
import { useAuth } from "@/contexts/AuthContext";
import { canClick } from "@/utils/roleAccess";
import OCRScanButton from "./OCRScanButton";
import BarcodeScanButton from "./BarcodeScanButton";
import { useWarehouseScan } from "@/hooks/useWarehouseScan";

interface BarangKeluarForm {
  id?: string;
  item_name: string;
  sku: string;
  status: string;
  awb: string;
  item_arrival_date: string;
  item_arrival_date_lini_2: string;
  storage_duration: string;
  storage_duration_lini_2: string;
  total_price: string;
  total_price_lini_2: string;
  final_price: string;
  item_quantity: string;
  unit: string;
  warehouses: string;
  zones: string;
  racks: string;
  lots: string;
  picked_up_by: string;
  pick_up_date: string;
  payment: string;
  payment_status: string;
  notes: string;
}

export default function BarangKeluar() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [barangLini2Items, setBarangLini2Items] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedBarang, setSelectedBarang] = useState<any>(null);
  const { userRole } = useAuth();
  const [formData, setFormData] = useState<BarangKeluarForm>({
    item_name: "",
    sku: "",
    status: "Pending",
    awb: "",
    item_arrival_date: "",
    item_arrival_date_lini_2: "",
    storage_duration: "",
    storage_duration_lini_2: "",
    total_price: "",
    total_price_lini_2: "",
    final_price: "",
    item_quantity: "",
    unit: "",
    warehouses: "",
    zones: "",
    racks: "",
    lots: "",
    picked_up_by: "",
    pick_up_date: new Date().toISOString().split("T")[0],
    payment: "",
    payment_status: "Belum Lunas",
    notes: "",
    batch_number: "",
    expired_date: "",
  });

  // Warehouse scan hook for autofill (Outbound)
  const { processBarcodeScan, processOCRScan, isProcessing: isScanProcessing } = useWarehouseScan({
    formType: "outbound",
    onAutofill: (data) => {
      setFormData((prev) => ({
        ...prev,
        sku: data.sku || prev.sku,
        item_name: data.item_name || prev.item_name,
        item_quantity: data.quantity?.toString() || prev.item_quantity,
        unit: data.unit || prev.unit,
        racks: data.location || prev.racks,
        batch_number: data.batch_number || prev.batch_number || "",
        expired_date: data.expired_date || prev.expired_date || "",
      }));
    },
  });

  useEffect(() => {
    fetchItems();
    fetchBarangLini2();

    const channel = supabase
      .channel("barang_keluar_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "barang_keluar" },
        () => {
          fetchItems();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("barang_keluar")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", err);
    }
  };

  const fetchBarangLini2 = async () => {
    try {
      const { data, error } = await supabase
        .from("barang_lini_2")
        .select("*")
        .eq("status", "Diambil")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBarangLini2Items(data || []);
    } catch (error) {
      console.error("Error fetching barang lini 2:", err);
    }
  };

  const handleBarangSelect = async (sku: string) => {
    const barang = barangLini2Items.find((item) => item.sku === sku);
    if (barang) {
      setSelectedBarang(barang);

      // Calculate storage duration
      const calculateDuration = (arrivalDate: string) => {
        if (!arrivalDate) return "";
        const arrival = new Date(arrivalDate);
        const today = new Date();
        const diffTime = today.getTime() - arrival.getTime();
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return days.toString();
      };

      // Fetch data from stock table based on SKU
      try {
        const { data: stockData, error } = await supabase
          .from("stock")
          .select("quantity, unit, warehouses, zones, racks, lots")
          .eq("sku", sku)
          .single();

        if (error) {
          console.error("Error fetching stock data:", err);
        }

        setFormData({
          ...formData,
          item_name: barang.nama_barang || barang.item_name || "",
          sku: barang.sku || "",
          awb: barang.awb || "",
          item_arrival_date: barang.item_arrival_date || "",
          item_arrival_date_lini_2: barang.item_arrival_date_lini_2 || "",
          storage_duration: calculateDuration(barang.item_arrival_date),
          storage_duration_lini_2: calculateDuration(
            barang.item_arrival_date_lini_2,
          ),
          total_price: barang.total_price?.toString() || "",
          total_price_lini_2: barang.total_price_lini_2?.toString() || "",
          // Use stock data if available, otherwise fallback to barang_lini_2 data
          item_quantity:
            stockData?.quantity?.toString() ||
            barang.item_quantity?.toString() ||
            "",
          unit: stockData?.unit || barang.unit || "",
          warehouses: stockData?.warehouses || barang.warehouses || "",
          zones: stockData?.zones || barang.zones || "",
          racks: stockData?.racks || barang.racks || "",
          lots: stockData?.lots || barang.lots || "",
        });
      } catch (error) {
        console.error("Error in handleBarangSelect:", err);
        toast({
          title: "Error",
          description: "Gagal mengambil data dari stock",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const itemData = {
        item_name: formData.item_name,
        sku: formData.sku,
        status: formData.status,
        awb: formData.awb || null,
        item_arrival_date: formData.item_arrival_date || null,
        item_arrival_date_lini_2: formData.item_arrival_date_lini_2 || null,
        storage_duration: formData.storage_duration
          ? parseInt(formData.storage_duration)
          : null,
        storage_duration_lini_2: formData.storage_duration_lini_2
          ? parseInt(formData.storage_duration_lini_2)
          : null,
        total_price: formData.total_price
          ? parseFloat(formData.total_price)
          : null,
        total_price_lini_2: formData.total_price_lini_2
          ? parseFloat(formData.total_price_lini_2)
          : null,
        final_price: formData.final_price
          ? parseFloat(formData.final_price)
          : null,
        item_quantity: formData.item_quantity
          ? parseFloat(formData.item_quantity)
          : null,
        unit: formData.unit || null,
        warehouses: formData.warehouses || null,
        zones: formData.zones || null,
        racks: formData.racks || null,
        lots: formData.lots || null,
        picked_up_by: formData.picked_up_by || null,
        pick_up_date: formData.pick_up_date || null,
        payment: formData.payment || null,
        payment_status: formData.payment_status,
        notes: formData.notes || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("barang_keluar")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Data barang keluar berhasil diupdate",
        });
      } else {
        const { error } = await supabase.from("barang_keluar").insert(itemData);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Data barang keluar berhasil ditambahkan",
        });
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menyimpan data";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name || "",
      sku: item.sku || "",
      status: item.status || "Pending",
      awb: item.awb || "",
      item_arrival_date: item.item_arrival_date || "",
      item_arrival_date_lini_2: item.item_arrival_date_lini_2 || "",
      storage_duration: item.storage_duration?.toString() || "",
      storage_duration_lini_2: item.storage_duration_lini_2?.toString() || "",
      total_price: item.total_price?.toString() || "",
      total_price_lini_2: item.total_price_lini_2?.toString() || "",
      final_price: item.final_price?.toString() || "",
      item_quantity: item.item_quantity?.toString() || "",
      unit: item.unit || "",
      warehouses: item.warehouses || "",
      zones: item.zones || "",
      racks: item.racks || "",
      lots: item.lots || "",
      picked_up_by: item.picked_up_by || "",
      pick_up_date: item.pick_up_date || new Date().toISOString().split("T")[0],
      payment: item.payment || "",
      payment_status: item.payment_status || "Belum Lunas",
      notes: item.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    try {
      const { error } = await supabase
        .from("barang_keluar")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Data barang keluar berhasil dihapus",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menghapus data";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      item_name: "",
      sku: "",
      status: "Pending",
      awb: "",
      item_arrival_date: "",
      item_arrival_date_lini_2: "",
      storage_duration: "",
      storage_duration_lini_2: "",
      total_price: "",
      total_price_lini_2: "",
      final_price: "",
      item_quantity: "",
      unit: "",
      warehouses: "",
      zones: "",
      racks: "",
      lots: "",
      picked_up_by: "",
      pick_up_date: new Date().toISOString().split("T")[0],
      payment: "",
      payment_status: "Belum Lunas",
      notes: "",
    });
    setEditingItem(null);
    setSelectedBarang(null);
  };

  const pendingCount = items.filter(
    (item) => item.payment_status === "Belum Lunas",
  ).length;
  const completedCount = items.filter(
    (item) => item.payment_status === "Lunas",
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50">
      {/* Header with gradient */}
      <div className="border-b bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 shadow-lg">
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
                <TruckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Barang Keluar</h1>
                <p className="text-sm text-orange-100">
                  Kelola barang yang keluar dari gudang
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-none shadow-lg bg-orange-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Total Barang Keluar
                </CardDescription>
                <TruckIcon className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {items.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <Package className="mr-2 h-4 w-4" />
                Total transaksi keluar
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-yellow-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Belum Lunas
                </CardDescription>
                <Package className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {pendingCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <Package className="mr-2 h-4 w-4" />
                Menunggu pembayaran
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-green-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Lunas
                </CardDescription>
                <Package className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {completedCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <Package className="mr-2 h-4 w-4" />
                Sudah dibayar
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Daftar Barang Keluar
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Kelola data barang yang keluar dari gudang
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  {canClick(userRole) && (
                    <Button
                      onClick={resetForm}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Barang Keluar
                    </Button>
                  )}
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <DialogTitle>
                        {editingItem
                          ? "Edit Barang Keluar"
                          : "Tambah Barang Keluar"}
                      </DialogTitle>
                      <div className="flex gap-2">
                        <OCRScanButton
                          onImageUploaded={(url, filePath) => {
                            toast({
                              title: "Gambar berhasil diupload",
                              description: `File: ${filePath}`,
                            });
                          }}
                          onTextExtracted={(text) => {
                            processOCRScan(text);
                          }}
                        />
                        <BarcodeScanButton
                          onBarcodeScanned={(code, format) => {
                            processBarcodeScan(code, format);
                          }}
                          onAutofill={(data) => {
                            if (data.sku) {
                              setFormData((prev) => ({
                                ...prev,
                                sku: data.sku || prev.sku,
                                item_name: data.product_name || prev.item_name,
                              }));
                            }
                          }}
                        />
                      </div>
                    </div>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!editingItem && (
                      <div className="space-y-2 p-4 bg-orange-50 rounded-lg">
                        <Label htmlFor="select_barang">
                          Pilih Barang dari Lini 2 (Status: Diambil) *
                        </Label>
                        <Select onValueChange={handleBarangSelect}>
                          <SelectTrigger id="select_barang">
                            <SelectValue placeholder="Pilih barang..." />
                          </SelectTrigger>
                          <SelectContent>
                            {barangLini2Items.length === 0 ? (
                              <SelectItem value="no-data" disabled>
                                Tidak ada barang dengan status Diambil
                              </SelectItem>
                            ) : (
                              barangLini2Items.filter((item) => item.sku).map((item) => (
                                <SelectItem key={item.id} value={item.sku}>
                                  {item.sku} -{" "}
                                  {item.nama_barang || item.item_name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="item_name">Nama Barang *</Label>
                        <Input
                          id="item_name"
                          value={formData.item_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              item_name: e.target.value,
                            })
                          }
                          required
                          readOnly={!editingItem && !!selectedBarang}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU *</Label>
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) =>
                            setFormData({ ...formData, sku: e.target.value })
                          }
                          required
                          readOnly={!editingItem && !!selectedBarang}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="awb">AWB</Label>
                        <Input
                          id="awb"
                          value={formData.awb}
                          onChange={(e) =>
                            setFormData({ ...formData, awb: e.target.value })
                          }
                          readOnly={!editingItem && !!selectedBarang}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="item_arrival_date">
                          Tanggal Masuk Lini 1
                        </Label>
                        <Input
                          id="item_arrival_date"
                          type="date"
                          value={formData.item_arrival_date}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              item_arrival_date: e.target.value,
                            })
                          }
                          readOnly={!editingItem && !!selectedBarang}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="item_arrival_date_lini_2">
                          Tanggal Masuk Lini 2
                        </Label>
                        <Input
                          id="item_arrival_date_lini_2"
                          type="date"
                          value={formData.item_arrival_date_lini_2}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              item_arrival_date_lini_2: e.target.value,
                            })
                          }
                          readOnly={!editingItem && !!selectedBarang}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="storage_duration">
                          Lama Simpan Lini 1 (hari)
                        </Label>
                        <Input
                          id="storage_duration"
                          type="number"
                          value={formData.storage_duration}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              storage_duration: e.target.value,
                            })
                          }
                          readOnly={!editingItem && !!selectedBarang}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="storage_duration_lini_2">
                          Lama Simpan Lini 2 (hari)
                        </Label>
                        <Input
                          id="storage_duration_lini_2"
                          type="number"
                          value={formData.storage_duration_lini_2}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              storage_duration_lini_2: e.target.value,
                            })
                          }
                          readOnly={!editingItem && !!selectedBarang}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="total_price">Harga Total Lini 1</Label>
                        <Input
                          id="total_price"
                          type="number"
                          value={formData.total_price}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              total_price: e.target.value,
                            })
                          }
                          readOnly={!editingItem && !!selectedBarang}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="total_price_lini_2">
                          Harga Total Lini 2
                        </Label>
                        <Input
                          id="total_price_lini_2"
                          type="number"
                          value={formData.total_price_lini_2}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              total_price_lini_2: e.target.value,
                            })
                          }
                          readOnly={!editingItem && !!selectedBarang}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="final_price">Harga Final *</Label>
                        <Input
                          id="final_price"
                          type="number"
                          value={formData.final_price}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              final_price: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="item_quantity">Jumlah Barang</Label>
                        <Input
                          id="item_quantity"
                          type="number"
                          value={formData.item_quantity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              item_quantity: e.target.value,
                            })
                          }
                          readOnly={!editingItem && !!selectedBarang}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unit">Satuan</Label>
                        <Input
                          id="unit"
                          value={formData.unit}
                          onChange={(e) =>
                            setFormData({ ...formData, unit: e.target.value })
                          }
                          readOnly={!editingItem && !!selectedBarang}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="warehouses">Gudang</Label>
                        <Input
                          id="warehouses"
                          value={formData.warehouses}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              warehouses: e.target.value,
                            })
                          }
                          readOnly={!editingItem && !!selectedBarang}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zones">Zona</Label>
                        <Input
                          id="zones"
                          value={formData.zones}
                          onChange={(e) =>
                            setFormData({ ...formData, zones: e.target.value })
                          }
                          readOnly={!editingItem && !!selectedBarang}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="racks">Rak</Label>
                        <Input
                          id="racks"
                          value={formData.racks}
                          onChange={(e) =>
                            setFormData({ ...formData, racks: e.target.value })
                          }
                          readOnly={!editingItem && !!selectedBarang}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lots">Lot</Label>
                        <Input
                          id="lots"
                          value={formData.lots}
                          onChange={(e) =>
                            setFormData({ ...formData, lots: e.target.value })
                          }
                          readOnly={!editingItem && !!selectedBarang}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="picked_up_by">Diambil Oleh *</Label>
                        <Input
                          id="picked_up_by"
                          value={formData.picked_up_by}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              picked_up_by: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pick_up_date">
                          Tanggal Pengambilan *
                        </Label>
                        <Input
                          id="pick_up_date"
                          type="date"
                          value={formData.pick_up_date}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pick_up_date: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payment">Metode Pembayaran</Label>
                        <Input
                          id="payment"
                          value={formData.payment}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              payment: e.target.value,
                            })
                          }
                          placeholder="Contoh: Transfer, Cash, dll"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payment_status">
                          Status Pembayaran *
                        </Label>
                        <Select
                          value={formData.payment_status}
                          onValueChange={(value) =>
                            setFormData({ ...formData, payment_status: value })
                          }
                        >
                          <SelectTrigger id="payment_status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Belum Lunas">
                              Belum Lunas
                            </SelectItem>
                            <SelectItem value="Lunas">Lunas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) =>
                            setFormData({ ...formData, status: value })
                          }
                        >
                          <SelectTrigger id="status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Dalam Proses">
                              Dalam Proses
                            </SelectItem>
                            <SelectItem value="Selesai">Selesai</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 md:col-span-3">
                        <Label htmlFor="notes">Catatan</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                          placeholder="Catatan tambahan (opsional)"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      {canClick(userRole) && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false);
                            resetForm();
                          }}
                        >
                          Batal
                        </Button>
                      )}
                      {canEdit(userRole) && (
                        <>
                          <Button
                            type="submit"
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            {editingItem ? "Update" : "Simpan"}
                          </Button>
                        </>
                      )}
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-100 to-orange-100 hover:from-slate-100 hover:to-orange-100">
                    <TableHead className="font-semibold text-slate-700">
                      Nama Barang
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      SKU
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      AWB
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Tgl Masuk L1
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Tgl Masuk L2
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Lama L1
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Lama L2
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Harga L1
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Harga L2
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
                    <TableHead className="font-semibold text-slate-700">
                      Diambil Oleh
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Tgl Ambil
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Pembayaran
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Status Bayar
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={22}
                        className="text-center text-slate-500 py-12"
                      >
                        <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                          <TruckIcon className="h-12 w-12 text-slate-300" />
                        </div>
                        <p className="font-medium text-lg">
                          Belum ada data barang keluar
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          Klik tombol "Tambah Barang Keluar" untuk menambahkan
                          data
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-orange-50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {item.item_name}
                        </TableCell>
                        <TableCell className="font-mono text-indigo-600">
                          {item.sku}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : item.status === "Dalam Proses"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            {item.status}
                          </span>
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
                          {item.storage_duration
                            ? `${item.storage_duration} hari`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {item.storage_duration_lini_2
                            ? `${item.storage_duration_lini_2} hari`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {item.total_price
                            ? `Rp ${item.total_price.toLocaleString("id-ID")}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {item.total_price_lini_2
                            ? `Rp ${item.total_price_lini_2.toLocaleString("id-ID")}`
                            : "-"}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {item.final_price
                            ? `Rp ${item.final_price.toLocaleString("id-ID")}`
                            : "-"}
                        </TableCell>
                        <TableCell>{item.item_quantity || "-"}</TableCell>
                        <TableCell>{item.unit || "-"}</TableCell>
                        <TableCell>{item.warehouses || "-"}</TableCell>
                        <TableCell>{item.zones || "-"}</TableCell>
                        <TableCell>{item.racks || "-"}</TableCell>
                        <TableCell>{item.lots || "-"}</TableCell>
                        <TableCell>{item.picked_up_by || "-"}</TableCell>
                        <TableCell>
                          {item.pick_up_date
                            ? new Date(item.pick_up_date).toLocaleDateString(
                                "id-ID",
                              )
                            : "-"}
                        </TableCell>
                        <TableCell>{item.payment || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.payment_status === "Lunas"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.payment_status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {canEdit(userRole) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                className="hover:bg-orange-50"
                              >
                                <Pencil className="w-4 h-4 text-orange-600" />
                              </Button>
                            )}
                            {canEdit(userRole) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                  className="hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
