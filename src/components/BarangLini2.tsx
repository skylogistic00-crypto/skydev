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
import { Plus, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface BarangLini2Form {
  id?: string;
  sku: string;
  status: string;
  item_name: string;
  awb: string;
  item_arrival_date: string;
  item_arrival_date_lini_2: string;
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
}

export default function BarangLini2() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<BarangLini2Form>({
    sku: "",
    status: "Aktif",
    item_name: "",
    awb: "",
    item_arrival_date: "",
    item_arrival_date_lini_2: new Date().toISOString().split("T")[0],
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
  });

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel("barang_lini_2_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "barang_lini_2" },
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
        .from("barang_lini_2")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const itemData = {
        sku: formData.sku,
        status: formData.status,
        item_name: formData.item_name,
        awb: formData.awb || null,
        item_arrival_date: formData.item_arrival_date || null,
        item_arrival_date_lini_2: formData.item_arrival_date_lini_2 || null,
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
        tgl_masuk:
          formData.item_arrival_date_lini_2 ||
          new Date().toISOString().split("T")[0],
      } as any;

      const { error } = await supabase.from("barang_lini_2").insert(itemData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Data barang Lini 2 berhasil ditambahkan",
      });

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

  const resetForm = () => {
    setFormData({
      sku: "",
      status: "Aktif",
      item_name: "",
      awb: "",
      item_arrival_date: "",
      item_arrival_date_lini_2: new Date().toISOString().split("T")[0],
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
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Barang Lini 2</h1>
              <p className="text-sm text-blue-100">
                Kelola data barang di Lini 2
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Daftar Barang Lini 2
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Informasi barang yang ada di Lini 2
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={resetForm}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Barang Lini 2
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Tambah Barang Lini 2</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU *</Label>
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) =>
                            setFormData({ ...formData, sku: e.target.value })
                          }
                          required
                        />
                      </div>

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
                            <SelectItem value="Aktif">Aktif</SelectItem>
                            <SelectItem value="Proses">Proses</SelectItem>
                            <SelectItem value="Selesai">Selesai</SelectItem>
                            <SelectItem value="Diambil">Diambil</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="awb">AWB</Label>
                        <Input
                          id="awb"
                          value={formData.awb}
                          onChange={(e) =>
                            setFormData({ ...formData, awb: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="item_arrival_date">
                          Tanggal Masuk (Lini 1)
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
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="item_arrival_date_lini_2">
                          Tanggal Masuk Lini 2 *
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
                          required
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
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="total_price">
                          Harga Total (Lini 1)
                        </Label>
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
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="final_price">Harga Final</Label>
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
                        />
                      </div>
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
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Simpan
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-100 to-blue-100 hover:from-slate-100 hover:to-blue-100">
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
                      Tgl Masuk (L1)
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Tgl Masuk L2
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={16}
                        className="text-center text-slate-500 py-12"
                      >
                        <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                          <Package className="h-12 w-12 text-slate-300" />
                        </div>
                        <p className="font-medium text-lg">
                          Belum ada data barang Lini 2
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          Klik tombol "Tambah Barang Lini 2" untuk menambahkan
                          data
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <TableCell className="font-mono text-indigo-600">
                          {item.sku}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.status === "Aktif"
                                ? "bg-green-100 text-green-800"
                                : item.status === "Proses"
                                  ? "bg-blue-100 text-blue-800"
                                  : item.status === "Selesai"
                                    ? "bg-gray-100 text-gray-800"
                                    : "bg-purple-100 text-purple-800"
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
