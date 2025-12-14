import { useState, useEffect } from "react";
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
import { useToast } from "./ui/use-toast";
import {
  Pencil,
  Trash2,
  Plus,
  Calculator,
  ArrowRight,
  PackageCheck,
  Eye,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface BarangLini1 {
  stock_id: string;
  item_name: string;
  item_arrival_date: string;
  sku: string;
  awb: string;
  storage_duration: number;
  status: string;
  total_price: string;
}

export default function BarangLini1() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [filteredStockItems, setFilteredStockItems] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [formData, setFormData] = useState<BarangLini1>({
    stock_id: "",
    item_name: "",
    item_arrival_date: "",
    sku: "",
    awb: "",
    storage_duration: 0,
    status: "Lini 1",
    total_price: "",
  });

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    tanggal_masuk: true,
    nama_barang: true,
    sku: true,
    awb: true,
    lama_simpan: true,
    status: true,
    harga_total: true,
  });

  const toggleColumn = (column: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  useEffect(() => {
    fetchItems();
    fetchStockItems();

    const channel = supabase
      .channel("barang_lini_1_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "barang_lini_1" },
        () => {
          fetchItems();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStockItems = async () => {
    try {
      console.log("🔍 Fetching stock items...");
      const { data, error } = await supabase
        .from("stock")
        .select("id, item_name, sku, item_arrival_date, airwaybills")
        .not("item_arrival_date", "is", null)
        .order("item_arrival_date", { ascending: false });

      if (error) {
        console.error("❌ Error fetching stock:", error);
        throw error;
      }

      console.log("✅ Stock items fetched:", data);
      setStockItems((data || []) as any);

      // Extract unique dates
      const dates = [
        ...new Set(data?.map((item) => item.item_arrival_date).filter(Boolean)),
      ];
      console.log("📅 Available dates:", dates);
      setAvailableDates(dates);

      if (!data || data.length === 0) {
        toast({
          title: "Info",
          description: "Tidak ada data stock dengan tanggal masuk barang.",
        });
      }
    } catch (error: any) {
      console.error("❌ Error fetching stock items:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data stock: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleDateSelect = (date: string) => {
    console.log("📅 Selected date:", date);
    setSelectedDate(date);

    // Filter stock items by selected date
    const filtered = stockItems.filter(
      (item) => item.item_arrival_date === date,
    );
    console.log("📦 Filtered stock items:", filtered);
    setFilteredStockItems(filtered);

    // Reset stock selection
    setSelectedStock(null);
    setFormData({
      stock_id: "",
      item_name: "",
      item_arrival_date: date,
      sku: "",
      awb: "",
      storage_duration: 0,
      status: "Lini 1",
      total_price: "",
    });
  };

  const handleStockSelect = (stockId: string) => {
    console.log("🎯 Selected stock ID:", stockId);
    const stock = filteredStockItems.find((item) => item.id === stockId);
    console.log("📦 Found stock:", stock);

    if (stock) {
      setSelectedStock(stock);

      // Calculate storage duration
      let storageDuration = 0;
      if (stock.item_arrival_date) {
        const arrivalDate = new Date(stock.item_arrival_date);
        const today = new Date();
        const diffTime = today.getTime() - arrivalDate.getTime();
        storageDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        console.log("📅 Storage duration calculated:", storageDuration, "days");
      }

      setFormData({
        stock_id: stock.id,
        item_name: stock.item_name || "",
        item_arrival_date: stock.item_arrival_date || "",
        sku: stock.sku || "",
        awb: stock.airwaybills || "",
        storage_duration: storageDuration,
        status: "Lini 1",
        total_price: "",
      });

      console.log("✅ Form data updated:", {
        item_name: stock.item_name,
        item_arrival_date: stock.item_arrival_date,
        sku: stock.sku,
        awb: stock.airwaybills,
        storage_duration: storageDuration,
      });
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("barang_lini_1")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch stock data for each item based on SKU (which is barcode in stock table)
      const itemsWithStockData = await Promise.all(
        (data || []).map(async (item) => {
          // Get stock data by barcode
          const { data: stockData } = await supabase
            .from("stock")
            .select("berat, volume")
            .eq("barcode", item.sku)
            .single();

          return {
            ...item,
            berat: item.berat || stockData?.berat || null,
            volume: item.volume || stockData?.volume || null,
          };
        }),
      );

      setItems(itemsWithStockData);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data barang",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const itemData = {
        stock_id: formData.stock_id || null,
        item_name: formData.item_name,
        item_arrival_date: formData.item_arrival_date,
        sku: formData.sku,
        awb: formData.awb || null,
        storage_duration: formData.storage_duration,
        status: formData.status,
        total_price: formData.total_price
          ? parseFloat(formData.total_price)
          : null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("barang_lini_1")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Data barang berhasil diupdate",
        });
      } else {
        const { error } = await supabase.from("barang_lini_1").insert(itemData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Data barang berhasil ditambahkan",
        });
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving item:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan data",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      stock_id: item.id,
      item_name: item.item_name || "",
      item_arrival_date: item.item_arrival_date || "",
      sku: item.sku || "",
      awb: item.awb || "",
      storage_duration: item.storage_duration || 0,
      status: item.status || "Lini 1",
      total_price: item.total_price || "",
    });
    setSelectedStock(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    try {
      const { error } = await supabase
        .from("barang_lini_1")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Data barang berhasil dihapus",
      });
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus data",
        variant: "destructive",
      });
    }
  };

  const handleHitungUlangSewa = async (item: any) => {
    toast({
      title: "Hitung Ulang Sewa",
      description: `Menghitung ulang biaya sewa untuk ${item.nama_barang}`,
    });
  };

  const handlePindahkanLini2 = async (item: any) => {
    if (!confirm(`Pindahkan ${item.nama_barang} ke Lini 2?`)) return;

    try {
      const { error: updateError } = await supabase
        .from("barang_lini_1")
        .update({ status: "dipindahkan" })
        .eq("id", item.id);

      if (updateError) throw updateError;

      const { error: insertError } = await supabase
        .from("barang_lini_2")
        .insert({
          item_name: item.nama_barang || item.item_name,
          sku: item.sku,
          kode_barang: item.kode_barang,
          nomor_dokumen_pabean: item.nomor_dokumen_pabean,
          tanggal_masuk: item.tanggal_masuk,
          lama_simpan: item.lama_simpan,
          berat: item.berat,
          volume: item.volume,
          lokasi: item.lokasi,
          status: "aktif",
          total_biaya: item.total_biaya,
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: `${item.nama_barang} berhasil dipindahkan ke Lini 2`,
      });
    } catch (error: any) {
      console.error("Error moving to lini 2:", error);
      toast({
        title: "Error",
        description: "Gagal memindahkan barang ke Lini 2",
        variant: "destructive",
      });
    }
  };

  const handleBarangDiambil = async (item: any) => {
    if (!confirm(`Tandai ${item.nama_barang} sebagai diambil supplier?`))
      return;

    try {
      const { error } = await supabase
        .from("barang_lini_1")
        .update({ status: "diambil" })
        .eq("id", item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${item.nama_barang} ditandai sebagai diambil supplier`,
      });
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Gagal mengupdate status barang",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      stock_id: "",
      item_name: "",
      item_arrival_date: "",
      sku: "",
      awb: "",
      storage_duration: 0,
      status: "Lini 1",
      total_price: "",
    });
    setSelectedStock(null);
    setSelectedDate("");
    setFilteredStockItems([]);
    setEditingItem(null);
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const DetailDialog = ({ item }: { item: any }) => {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4 text-indigo-600" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-indigo-600">
              Detail Barang Lini 1: {item.nama_barang}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Basic Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                Informasi Dasar
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Nama Barang</p>
                  <p className="font-medium">{item.nama_barang || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">SKU</p>
                  <p className="font-medium font-mono text-indigo-600">
                    {item.sku || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">AWB (Air Waybill)</p>
                  <p className="font-medium">{item.awb || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Tanggal Masuk Barang</p>
                  <p className="font-medium">
                    {item.item_arrival_date
                      ? new Date(item.item_arrival_date).toLocaleDateString(
                          "id-ID",
                        )
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Lama Simpan</p>
                  <p className="font-medium">
                    {item.storage_duration
                      ? `${item.storage_duration} hari`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <p className="font-medium">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        item.status === "Lini 1"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {item.status || "-"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Harga Total</p>
                  <p className="font-medium text-green-600">
                    {item.total_price ? formatRupiah(item.total_price) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Kode Barang</p>
                  <p className="font-medium">{item.kode_barang || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Nomor Dokumen Pabean</p>
                  <p className="font-medium">
                    {item.nomor_dokumen_pabean || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">
                    Batas Waktu Pengambilan
                  </p>
                  <p className="font-medium">
                    {item.batas_waktu_pengambilan
                      ? new Date(
                          item.batas_waktu_pengambilan,
                        ).toLocaleDateString("id-ID")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Berat</p>
                  <p className="font-medium">
                    {item.berat ? `${item.berat} kg` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Volume</p>
                  <p className="font-medium">
                    {item.volume ? `${item.volume} m³` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Lokasi</p>
                  <p className="font-medium">{item.lokasi || "-"}</p>
                </div>
              </div>
            </div>

            {/* WMS & CEISA Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                Informasi WMS & CEISA
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Nomor Referensi WMS</p>
                  <p className="font-medium">
                    {item.wms_reference_number || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Nomor Dokumen CEISA</p>
                  <p className="font-medium">
                    {item.ceisa_document_number || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Jenis Dokumen CEISA</p>
                  <p className="font-medium">
                    {item.ceisa_document_type || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">
                    Tanggal Dokumen CEISA
                  </p>
                  <p className="font-medium">
                    {item.ceisa_document_date
                      ? new Date(item.ceisa_document_date).toLocaleDateString(
                          "id-ID",
                        )
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status CEISA</p>
                  <p className="font-medium">{item.ceisa_status || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Catatan WMS</p>
                  <p className="font-medium">{item.wms_notes || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Catatan CEISA</p>
                  <p className="font-medium">{item.ceisa_notes || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Barang Lini 1</h1>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter Kolom
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">
                    Pilih Kolom yang Ditampilkan
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="col_tanggal_masuk"
                        checked={visibleColumns.tanggal_masuk}
                        onCheckedChange={() => toggleColumn("tanggal_masuk")}
                      />
                      <label
                        htmlFor="col_tanggal_masuk"
                        className="text-sm cursor-pointer"
                      >
                        Tanggal Barang Masuk
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="col_nama_barang"
                        checked={visibleColumns.nama_barang}
                        onCheckedChange={() => toggleColumn("nama_barang")}
                      />
                      <label
                        htmlFor="col_nama_barang"
                        className="text-sm cursor-pointer"
                      >
                        Nama Barang
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="col_sku"
                        checked={visibleColumns.sku}
                        onCheckedChange={() => toggleColumn("sku")}
                      />
                      <label
                        htmlFor="col_sku"
                        className="text-sm cursor-pointer"
                      >
                        SKU
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="col_awb"
                        checked={visibleColumns.awb}
                        onCheckedChange={() => toggleColumn("awb")}
                      />
                      <label
                        htmlFor="col_awb"
                        className="text-sm cursor-pointer"
                      >
                        AWB
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="col_lama_simpan"
                        checked={visibleColumns.lama_simpan}
                        onCheckedChange={() => toggleColumn("lama_simpan")}
                      />
                      <label
                        htmlFor="col_lama_simpan"
                        className="text-sm cursor-pointer"
                      >
                        Lama Simpan
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="col_status"
                        checked={visibleColumns.status}
                        onCheckedChange={() => toggleColumn("status")}
                      />
                      <label
                        htmlFor="col_status"
                        className="text-sm cursor-pointer"
                      >
                        Lini 1/2
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="col_harga_total"
                        checked={visibleColumns.harga_total}
                        onCheckedChange={() => toggleColumn("harga_total")}
                      />
                      <label
                        htmlFor="col_harga_total"
                        className="text-sm cursor-pointer"
                      >
                        Harga Total
                      </label>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetForm();
                    fetchStockItems();
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Barang Lini 1
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem
                      ? "Edit Barang Lini 1"
                      : "Tambah Barang Lini 1"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-4">
                    {/* Step 1: Select Date */}
                    <div className="space-y-2">
                      <Label htmlFor="date_select">
                        1. Pilih Tanggal Barang Masuk *
                      </Label>
                      {availableDates.length === 0 ? (
                        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                          ⚠️ Tidak ada data stock dengan tanggal masuk barang.
                        </div>
                      ) : (
                        <>
                          <Select
                            value={selectedDate}
                            onValueChange={handleDateSelect}
                            disabled={!!editingItem}
                          >
                            <SelectTrigger id="date_select">
                              <SelectValue placeholder="-- Pilih tanggal --" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableDates.filter((date) => date).map((date) => (
                                <SelectItem key={date} value={date}>
                                  {new Date(date).toLocaleDateString("id-ID", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
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

                    {/* Step 2: Select SKU based on date */}
                    {selectedDate && (
                      <div className="space-y-2">
                        <Label htmlFor="sku_select">2. Pilih SKU *</Label>
                        {filteredStockItems.length === 0 ? (
                          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                            ⚠️ Tidak ada SKU tersedia untuk tanggal ini.
                          </div>
                        ) : (
                          <>
                            <Select
                              value={formData.stock_id}
                              onValueChange={handleStockSelect}
                              disabled={!!editingItem}
                            >
                              <SelectTrigger id="sku_select">
                                <SelectValue placeholder="-- Pilih SKU --" />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredStockItems.filter((stock) => stock.id).map((stock) => (
                                  <SelectItem key={stock.id} value={stock.id}>
                                    SKU: {stock.sku} - {stock.item_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500">
                              {filteredStockItems.length} SKU tersedia pada
                              tanggal ini
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    {/* Show details after SKU selected */}
                    {selectedStock && (
                      <>
                        <div className="border-t pt-4 mt-4">
                          <h3 className="text-sm font-semibold text-slate-700 mb-3">
                            Detail Barang
                          </h3>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="item_arrival_date">
                            Tanggal Barang Masuk
                          </Label>
                          <Input
                            id="item_arrival_date"
                            type="date"
                            value={formData.item_arrival_date}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sku">SKU</Label>
                          <Input
                            id="sku"
                            value={formData.sku}
                            disabled
                            className="bg-gray-50 font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="item_name">Nama Barang</Label>
                          <Input
                            id="item_name"
                            value={formData.item_name}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="awb">AWB (Air Waybill)</Label>
                          <Input
                            id="awb"
                            value={formData.awb}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="storage_duration">
                            Lama Simpan (hari)
                          </Label>
                          <Input
                            id="storage_duration"
                            type="number"
                            value={formData.storage_duration}
                            disabled
                            className="bg-gray-50"
                          />
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
                              <SelectItem value="Lini 1">Lini 1</SelectItem>
                              <SelectItem value="Lini 2">Lini 2</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="total_price">Harga Total</Label>
                          <Input
                            id="total_price"
                            type="number"
                            step="0.01"
                            value={formData.total_price}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                total_price: e.target.value,
                              })
                            }
                            placeholder="Masukkan harga total"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
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
                    <Button type="submit" disabled={!selectedStock}>
                      {editingItem ? "Update" : "Simpan"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.tanggal_masuk && (
                  <TableHead>Tanggal Barang Masuk</TableHead>
                )}
                {visibleColumns.nama_barang && (
                  <TableHead>Nama Barang</TableHead>
                )}
                {visibleColumns.sku && <TableHead>SKU</TableHead>}
                {visibleColumns.awb && <TableHead>AWB</TableHead>}
                {visibleColumns.lama_simpan && (
                  <TableHead>Lama Simpan</TableHead>
                )}
                {visibleColumns.status && <TableHead>Lini 1/2</TableHead>}
                {visibleColumns.harga_total && (
                  <TableHead>Harga Total</TableHead>
                )}
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      Object.values(visibleColumns).filter(Boolean).length + 1
                    }
                    className="text-center text-slate-500"
                  >
                    Belum ada data barang
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  // Calculate lama simpan (days from item_arrival_date to today)
                  let lamaSimpan = "-";

                  if (item.item_arrival_date) {
                    try {
                      const tanggalMasuk = new Date(item.item_arrival_date);
                      const today = new Date();

                      if (!isNaN(tanggalMasuk.getTime())) {
                        today.setHours(0, 0, 0, 0);
                        tanggalMasuk.setHours(0, 0, 0, 0);
                        const diffTime =
                          today.getTime() - tanggalMasuk.getTime();
                        const days = Math.ceil(
                          diffTime / (1000 * 60 * 60 * 24),
                        );
                        lamaSimpan = days >= 0 ? `${days} hari` : "0 hari";
                      }
                    } catch (error) {
                      console.error("Error calculating lama simpan:", error);
                    }
                  }

                  return (
                    <TableRow key={item.id}>
                      {visibleColumns.tanggal_masuk && (
                        <TableCell>
                          {item.item_arrival_date
                            ? new Date(
                                item.item_arrival_date,
                              ).toLocaleDateString("id-ID")
                            : "-"}
                        </TableCell>
                      )}
                      {visibleColumns.nama_barang && (
                        <TableCell className="font-medium">
                          {item.item_name || item.nama_barang}
                        </TableCell>
                      )}
                      {visibleColumns.sku && (
                        <TableCell className="font-mono text-indigo-600">
                          {item.sku}
                        </TableCell>
                      )}
                      {visibleColumns.awb && (
                        <TableCell>{item.awb || "-"}</TableCell>
                      )}
                      {visibleColumns.lama_simpan && (
                        <TableCell>
                          <span className="font-semibold text-blue-600">
                            {lamaSimpan}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.status && (
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.status === "Lini 1"
                                ? "bg-blue-100 text-blue-800"
                                : item.status === "Lini 2"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item.status || "-"}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.harga_total && (
                        <TableCell>
                          {item.total_price
                            ? formatRupiah(item.total_price)
                            : "-"}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <DetailDialog item={item} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
