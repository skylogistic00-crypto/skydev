import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ArrowLeft,
  Search,
  Filter,
  Eye,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  ScanLine,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canEdit, canDelete, canView, canClick } from "@/utils/roleAccess";
import OCRScanButton from "./OCRScanButton";
import BarcodeScanButton from "./BarcodeScanButton";
import { useWarehouseScan } from "@/hooks/useWarehouseScan";

interface StockAdjustment {
  id: string;
  transaction_type: string;
  reference_number: string;
  transaction_date: string;
  item_name: string;
  sku: string;
  quantity: number;
  unit: string;
  reason: string;
  notes: string;
  warehouse: string;
  zone: string;
  rack: string;
  lot: string;
  before_quantity: number;
  after_quantity: number;
  adjustment_value: number;
  approved_by: string;
  approval_date: string;
  status: string;
  created_by: string;
  supplier_id?: string;
  stock_id?: string;
  created_at: string;
  suppliers?: {
    supplier_name: string;
    supplier_code: string;
  };
}

interface StockItem {
  id: string;
  item_name: string;
  sku: string;
  unit: string;
  item_quantity: number;
  warehouses: string;
  zones: string;
  racks: string;
  lots: string;
  supplier_id?: string;
}

interface Supplier {
  id: string;
  supplier_name: string;
  supplier_code: string;
}

const TRANSACTION_TYPES = [
  {
    value: "stock_in",
    label: "Barang Masuk (Non-Pembelian)",
    icon: TrendingUp,
  },
  {
    value: "stock_out",
    label: "Barang Keluar (Non-Penjualan)",
    icon: TrendingDown,
  },
  { value: "adjustment", label: "Koreksi Stok", icon: RefreshCw },
  { value: "opname", label: "Stock Opname", icon: ClipboardList },
];

const REASONS = {
  stock_in: [
    "Retur dari Customer",
    "Barang Rusak Diganti",
    "Barang Hilang Ditemukan",
    "Koreksi Data",
    "Lainnya",
  ],
  stock_out: [
    "Barang Rusak",
    "Barang Hilang",
    "Barang Kadaluarsa",
    "Penggunaan Internal",
    "Sample/Demo",
    "Lainnya",
  ],
  adjustment: ["Kesalahan Input", "Selisih Fisik", "Koreksi Sistem", "Lainnya"],
  opname: [
    "Stock Opname Rutin",
    "Stock Opname Tahunan",
    "Audit Internal",
    "Lainnya",
  ],
};

export default function StockAdjustmentForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);

  const [formData, setFormData] = useState({
    transaction_type: "stock_in",
    reference_number: "",
    transaction_date: new Date().toISOString().split("T")[0],
    item_name: "",
    sku: "",
    quantity: 0,
    unit: "",
    reason: "",
    notes: "",
    warehouse: "",
    zone: "",
    rack: "",
    lot: "",
    before_quantity: 0,
    after_quantity: 0,
    adjustment_value: 0,
    approved_by: "",
    approval_date: "",
    status: "pending",
    created_by: "",
    supplier_id: "",
    stock_id: "",
    batch_number: "",
    expired_date: "",
  });

  // Warehouse scan hook for autofill
  const { processBarcodeScan, processOCRScan, isProcessing: isScanProcessing } = useWarehouseScan({
    formType: "adjustment",
    onAutofill: (data) => {
      setFormData((prev) => ({
        ...prev,
        sku: data.sku || prev.sku,
        item_name: data.item_name || prev.item_name,
        quantity: data.quantity || prev.quantity,
        unit: data.unit || prev.unit,
        rack: data.location || prev.rack,
        batch_number: data.batch_number || prev.batch_number || "",
        expired_date: data.expired_date || prev.expired_date || "",
      }));
      // Try to find and select the stock item
      if (data.sku) {
        const foundStock = stockItems.find((s) => s.sku === data.sku);
        if (foundStock) {
          setSelectedStock(foundStock);
          setFormData((prev) => ({
            ...prev,
            stock_id: foundStock.id,
            before_quantity: foundStock.item_quantity || 0,
          }));
        }
      }
    },
  });

  useEffect(() => {
    fetchAdjustments();
    fetchStockItems();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (!editingId && showForm) {
      generateReferenceNumber();
    }
  }, [formData.transaction_type, editingId, showForm]);

  useEffect(() => {
    calculateAdjustment();
  }, [formData.quantity, formData.before_quantity, formData.transaction_type]);

  const generateReferenceNumber = () => {
    const prefix = {
      stock_in: "SI",
      stock_out: "SO",
      adjustment: "ADJ",
      opname: "OP",
    }[formData.transaction_type];

    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");

    setFormData((prev) => ({
      ...prev,
      reference_number: `${prefix}-${year}${month}-${random}`,
    }));
  };

  const calculateAdjustment = () => {
    let afterQty = formData.before_quantity;
    let adjValue = 0;

    if (formData.transaction_type === "stock_in") {
      afterQty = formData.before_quantity + formData.quantity;
      adjValue = formData.quantity;
    } else if (formData.transaction_type === "stock_out") {
      afterQty = formData.before_quantity - formData.quantity;
      adjValue = -formData.quantity;
    } else if (
      formData.transaction_type === "adjustment" ||
      formData.transaction_type === "opname"
    ) {
      adjValue = formData.quantity - formData.before_quantity;
      afterQty = formData.quantity;
    }

    setFormData((prev) => ({
      ...prev,
      after_quantity: afterQty,
      adjustment_value: adjValue,
    }));
  };

  const fetchAdjustments = async () => {
    try {
      // Fetch adjustments without join first
      const { data: adjustmentsData, error: adjError } = await supabase
        .from("stock_adjustments")
        .select("*")
        .order("created_at", { ascending: false });

      if (adjError) throw adjError;

      // Fetch suppliers separately
      const { data: suppliersData, error: suppError } = await supabase
        .from("suppliers")
        .select("id, supplier_name, supplier_code");

      if (suppError) throw suppError;

      // Manually join the data
      const adjustmentsWithSuppliers =
        adjustmentsData?.map((adj) => ({
          ...adj,
          suppliers:
            suppliersData?.find((s) => s.id === adj.supplier_id) || null,
        })) || [];

      setAdjustments(adjustmentsWithSuppliers);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, supplier_name, supplier_code")
        .order("supplier_name");

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from("stock")
        .select(
          `
          id, 
          item_name, 
          sku, 
          unit, 
          item_quantity, 
          warehouses, 
          zones, 
          racks, 
          supplier_id,
          warehouse_id,
          warehouses:warehouse_id(id, name, code)
        `,
        )
        .order("item_name");

      if (error) throw error;
      setStockItems((data || []) as any);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStockSelect = (sku: string) => {
    const stock = stockItems.find((item) => item.sku === sku);
    if (stock) {
      console.log("Selected stock:", stock);
      console.log("Supplier ID from stock:", stock.supplier_id);
      console.log("Warehouse from stock:", stock.warehouses);

      setSelectedStock(stock);

      // Get warehouse name from the joined data
      const warehouseName = stock.warehouses?.name || stock.warehouses || "";

      setFormData((prev) => ({
        ...prev,
        item_name: stock.item_name,
        sku: stock.sku,
        unit: stock.unit,
        warehouse: warehouseName,
        zone: stock.zones || "",
        rack: stock.racks || "",
        lot: stock.lots || "",
        before_quantity: stock.item_quantity || 0,
        supplier_id: stock.supplier_id || "",
        stock_id: stock.id,
      }));

      // Show success toast
      const supplierName = stock.supplier_id
        ? suppliers.find((s) => s.id === stock.supplier_id)?.supplier_name
        : "Tidak ada";

      toast({
        title: "✅ Data Auto-Filled",
        description: `Supplier: ${supplierName || "Tidak ada"}\nGudang: ${warehouseName || "-"}\nZone: ${stock.zones || "-"}\nRak: ${stock.racks || "-"}\nLot: ${stock.lots || "-"}`,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data - remove empty strings for optional fields
      const submitData = {
        transaction_type: formData.transaction_type,
        reference_number: formData.reference_number,
        transaction_date: formData.transaction_date,
        item_name: formData.item_name,
        sku: formData.sku,
        quantity: formData.quantity,
        unit: formData.unit,
        reason: formData.reason,
        notes: formData.notes || null,
        warehouse: formData.warehouse || null,
        zone: formData.zone || null,
        rack: formData.rack || null,
        lot: formData.lot || null,
        before_quantity: formData.before_quantity,
        after_quantity: formData.after_quantity,
        adjustment_value: formData.adjustment_value,
        approved_by: formData.approved_by || null,
        approval_date: formData.approval_date || null,
        status: formData.status,
        created_by: formData.created_by || null,
        supplier_id: formData.supplier_id || null,
        stock_id: formData.stock_id || null,
      };

      let insertedId = editingId;

      if (editingId) {
        const { error } = await supabase
          .from("stock_adjustments")
          .update(submitData)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "✅ Berhasil",
          description: "Data adjustment berhasil diupdate",
        });
      } else {
        const { data, error } = await supabase
          .from("stock_adjustments")
          .insert([submitData])
          .select()
          .single();

        if (error) throw error;
        insertedId = data.id;

        toast({
          title: "✅ Berhasil",
          description: "Data adjustment berhasil ditambahkan",
        });
      }

      // Post to journal if status is approved
      if (formData.status === "approved" && insertedId) {
        try {
          const { data: journalData, error: journalError } =
            await supabase.functions.invoke(
              "supabase-functions-auto-post-journal",
              {
                body: {
                  type: "stock_adjustment",
                  record: {
                    id: insertedId,
                    ...submitData,
                  },
                },
              },
            );

          if (journalError) {
            console.error("Journal posting error:", journalError);
            toast({
              title: "⚠️ Peringatan",
              description:
                "Data tersimpan tapi gagal posting ke jurnal: " +
                journalError.message,
              variant: "destructive",
            });
          } else {
            toast({
              title: "✅ Jurnal Posted",
              description: `${journalData.entries} entri jurnal berhasil dibuat`,
            });
          }
        } catch (journalError: any) {
          console.error("Journal posting error:", journalError);
          toast({
            title: "⚠️ Peringatan",
            description: "Data tersimpan tapi gagal posting ke jurnal",
            variant: "destructive",
          });
        }
      }

      resetForm();
      fetchAdjustments();
      setShowForm(false);
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan saat menyimpan data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("stock_adjustments")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData(data);
      setEditingId(id);
      setShowForm(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    try {
      const { error } = await supabase
        .from("stock_adjustments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "✅ Berhasil",
        description: "Data adjustment berhasil dihapus",
      });

      fetchAdjustments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      transaction_type: "stock_in",
      reference_number: "",
      transaction_date: new Date().toISOString().split("T")[0],
      item_name: "",
      sku: "",
      quantity: 0,
      unit: "",
      reason: "",
      notes: "",
      warehouse: "",
      zone: "",
      rack: "",
      lot: "",
      before_quantity: 0,
      after_quantity: 0,
      adjustment_value: 0,
      approved_by: "",
      approval_date: "",
      status: "pending",
      created_by: "",
      supplier_id: "",
      stock_id: "",
    });
    setEditingId(null);
    setSelectedStock(null);
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  const filteredAdjustments = adjustments.filter(
    (adj) =>
      adj.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.reference_number.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getTransactionTypeLabel = (type: string) => {
    return TRANSACTION_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getTransactionTypeBadge = (type: string) => {
    const colors = {
      stock_in: "bg-blue-100 text-blue-800",
      stock_out: "bg-orange-100 text-orange-800",
      adjustment: "bg-purple-100 text-purple-800",
      opname: "bg-indigo-100 text-indigo-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 shadow-lg">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Stock In/Out & Adjustment
                </h1>
                <p className="text-sm text-purple-100">
                  Kelola opname, koreksi stok, dan transaksi
                  non-pembelian/penjualan
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {canClick(userRole) && (
              <>
                <Button
                  onClick={() => {
                    toast({
                      title: "📊 Export Data",
                      description: "Fitur export akan segera tersedia",
                    });
                  }}
                  variant="outline"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button
                  onClick={() => {
                    toast({
                      title: "📄 Laporan",
                      description: "Fitur laporan akan segera tersedia",
                    });
                  }}
                  variant="outline"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Laporan
                </Button>
                <Button
                  onClick={() => {
                    resetForm();
                    setShowForm(!showForm);
                  }}
                  className="bg-white text-purple-600 hover:bg-blue-50 shadow-md"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {showForm ? "Tutup Form" : "Tambah Transaksi"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Form Input */}
        {showForm && (
          <Card className="mb-6 bg-white shadow-lg rounded-xl border border-slate-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {editingId ? "✏️ Edit Transaksi" : "+ Tambah Transaksi"}
                  </CardTitle>
                  <CardDescription>
                    {editingId
                      ? "Perbarui informasi transaksi"
                      : "Tambahkan transaksi stock baru"}
                  </CardDescription>
                </div>
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
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Transaction Type Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                    Jenis Transaksi
                  </h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    {TRANSACTION_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              transaction_type: type.value,
                            })
                          }
                          className={`p-4 rounded-lg border-2 transition-all ${
                            formData.transaction_type === type.value
                              ? "border-purple-600 bg-purple-50"
                              : "border-slate-200 hover:border-purple-300"
                          }`}
                        >
                          <Icon
                            className={`h-8 w-8 mx-auto mb-2 ${
                              formData.transaction_type === type.value
                                ? "text-purple-600"
                                : "text-slate-400"
                            }`}
                          />
                          <p
                            className={`text-sm font-medium ${
                              formData.transaction_type === type.value
                                ? "text-purple-600"
                                : "text-slate-600"
                            }`}
                          >
                            {type.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                    Informasi Dasar
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Nomor Referensi *</Label>
                      <Input
                        value={formData.reference_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            reference_number: e.target.value,
                          })
                        }
                        required
                        readOnly
                        className="bg-slate-50"
                      />
                    </div>

                    <div>
                      <Label>Tanggal Transaksi *</Label>
                      <Input
                        type="date"
                        value={formData.transaction_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            transaction_date: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label>Status *</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Item Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                    Pilih Barang
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Pilih dari Stock *</Label>
                      <Select onValueChange={handleStockSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih barang..." />
                        </SelectTrigger>
                        <SelectContent>
                          {stockItems.filter((item) => item.sku).map((item) => (
                            <SelectItem key={item.id} value={item.sku}>
                              {item.sku} - {item.item_name} (Qty:{" "}
                              {item.item_quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Supplier</Label>
                      {selectedStock && formData.supplier_id ? (
                        <Input
                          value={
                            suppliers.find((s) => s.id === formData.supplier_id)
                              ? `${suppliers.find((s) => s.id === formData.supplier_id)?.supplier_code} - ${suppliers.find((s) => s.id === formData.supplier_id)?.supplier_name}`
                              : "Supplier tidak ditemukan"
                          }
                          readOnly
                          className="bg-slate-50"
                        />
                      ) : (
                        <Select
                          value={formData.supplier_id}
                          onValueChange={(value) =>
                            setFormData({ ...formData, supplier_id: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih supplier..." />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.filter((supplier) => supplier.id).map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.supplier_code} -{" "}
                                {supplier.supplier_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div>
                      <Label>Nama Barang *</Label>
                      <Input
                        value={formData.item_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            item_name: e.target.value,
                          })
                        }
                        required
                        readOnly={!!selectedStock}
                        className={selectedStock ? "bg-slate-50" : ""}
                      />
                    </div>

                    <div>
                      <Label>SKU *</Label>
                      <Input
                        value={formData.sku}
                        onChange={(e) =>
                          setFormData({ ...formData, sku: e.target.value })
                        }
                        required
                        readOnly={!!selectedStock}
                        className={selectedStock ? "bg-slate-50" : ""}
                      />
                    </div>

                    <div>
                      <Label>Satuan *</Label>
                      <Input
                        value={formData.unit}
                        onChange={(e) =>
                          setFormData({ ...formData, unit: e.target.value })
                        }
                        required
                        readOnly={!!selectedStock}
                        className={selectedStock ? "bg-slate-50" : ""}
                      />
                    </div>
                  </div>
                </div>

                {/* Quantity Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                    Informasi Kuantitas
                  </h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <Label>Stok Sebelumnya</Label>
                      <Input
                        type="number"
                        value={formData.before_quantity}
                        readOnly
                        className="bg-slate-50"
                      />
                    </div>

                    <div>
                      <Label>
                        {formData.transaction_type === "adjustment" ||
                        formData.transaction_type === "opname"
                          ? "Stok Aktual *"
                          : "Jumlah *"}
                      </Label>
                      <Input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            quantity: parseFloat(e.target.value) || 0,
                          })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label>Stok Setelahnya</Label>
                      <Input
                        type="number"
                        value={formData.after_quantity}
                        readOnly
                        className="bg-slate-50"
                      />
                    </div>

                    <div>
                      <Label>Nilai Adjustment</Label>
                      <Input
                        type="number"
                        value={formData.adjustment_value}
                        readOnly
                        className={`bg-slate-50 ${
                          formData.adjustment_value > 0
                            ? "text-green-600 font-semibold"
                            : formData.adjustment_value < 0
                              ? "text-red-600 font-semibold"
                              : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                    Lokasi Penyimpanan
                  </h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <Label>Gudang</Label>
                      <Input
                        value={formData.warehouse}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            warehouse: e.target.value,
                          })
                        }
                        readOnly={!!selectedStock}
                        className={selectedStock ? "bg-slate-50" : ""}
                      />
                    </div>

                    <div>
                      <Label>Zona</Label>
                      <Input
                        value={formData.zone}
                        onChange={(e) =>
                          setFormData({ ...formData, zone: e.target.value })
                        }
                        readOnly={!!selectedStock}
                        className={selectedStock ? "bg-slate-50" : ""}
                      />
                    </div>

                    <div>
                      <Label>Rak</Label>
                      <Input
                        value={formData.rack}
                        onChange={(e) =>
                          setFormData({ ...formData, rack: e.target.value })
                        }
                        readOnly={!!selectedStock}
                        className={selectedStock ? "bg-slate-50" : ""}
                      />
                    </div>

                    <div>
                      <Label>Lot</Label>
                      <Input
                        value={formData.lot}
                        onChange={(e) =>
                          setFormData({ ...formData, lot: e.target.value })
                        }
                        readOnly={!!selectedStock}
                        className={selectedStock ? "bg-slate-50" : ""}
                      />
                    </div>
                  </div>
                </div>

                {/* Reason & Notes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                    Alasan & Catatan
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Alasan *</Label>
                      <Select
                        value={formData.reason}
                        onValueChange={(value) =>
                          setFormData({ ...formData, reason: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih alasan..." />
                        </SelectTrigger>
                        <SelectContent>
                          {REASONS[
                            formData.transaction_type as keyof typeof REASONS
                          ]?.filter((reason) => reason).map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Catatan</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Approval Information */}
                {formData.status === "approved" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                      Informasi Approval
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Disetujui Oleh</Label>
                        <Input
                          value={formData.approved_by}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              approved_by: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label>Tanggal Approval</Label>
                        <Input
                          type="date"
                          value={formData.approval_date}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              approval_date: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin mr-2" />
                    ) : (
                      <Plus className="mr-2" />
                    )}
                    {editingId ? "Update Transaksi" : "Simpan Transaksi"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Batal
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Table Data */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Filter className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-lg">Riwayat Transaksi</span>
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari berdasarkan nama barang, SKU, atau nomor referensi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-100 to-purple-100 hover:from-slate-100 hover:to-purple-100">
                  <TableHead className="font-semibold text-slate-700">
                    No. Referensi
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Tanggal
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Jenis Transaksi
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Nama Barang
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    SKU
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Supplier
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Stok Sebelum
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Adjustment
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Stok Setelah
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Alasan
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Status
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-700">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdjustments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="text-center text-slate-500 py-12"
                    >
                      <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                        <ClipboardList className="h-12 w-12 text-slate-300" />
                      </div>
                      <p className="font-medium text-lg">
                        Belum ada data transaksi
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Tambahkan transaksi baru untuk memulai
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdjustments.map((adj, index) => (
                    <TableRow
                      key={adj.id}
                      className={`${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      } hover:bg-purple-50 transition-colors border-b border-slate-100`}
                    >
                      <TableCell className="font-mono text-purple-600">
                        {adj.reference_number}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {new Date(adj.transaction_date).toLocaleDateString(
                          "id-ID",
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeBadge(adj.transaction_type)}`}
                        >
                          {getTransactionTypeLabel(adj.transaction_type)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {adj.item_name}
                      </TableCell>
                      <TableCell className="font-mono text-indigo-600">
                        {adj.sku}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {adj.suppliers?.supplier_name || "-"}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {adj.before_quantity}
                      </TableCell>
                      <TableCell
                        className={`font-semibold ${
                          adj.adjustment_value > 0
                            ? "text-green-600"
                            : adj.adjustment_value < 0
                              ? "text-red-600"
                              : "text-slate-600"
                        }`}
                      >
                        {adj.adjustment_value > 0 ? "+" : ""}
                        {adj.adjustment_value}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {adj.after_quantity}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {adj.reason}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(adj.status)}`}
                        >
                          {adj.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          {canEdit(userRole) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(adj.id)}
                            >
                              <Pencil className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                          {canDelete(userRole) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(adj.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
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
  );
}
