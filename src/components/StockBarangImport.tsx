import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface StockBarangImport {
  id: string;
  tanggal_barang_masuk?: string;
  mawb?: string;
  hawb?: string;
  plp?: string;
  consignee?: string;
  jenis_barang?: string;
  deskripsi_barang?: string;
  hs_code?: string;
  jumlah?: number;
  unit?: string;
  berat?: number;
  volume?: number;
  warehouses?: string;
  zones?: string;
  racks?: string;
  lots?: string;
}

export default function StockBarangImport() {
  const [items, setItems] = useState<StockBarangImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockBarangImport | null>(
    null,
  );
  const [formData, setFormData] = useState<Partial<StockBarangImport>>({});
  const itemsPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("stock_barang_import")
        .select("*")
        .order("tanggal_barang_masuk", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: StockBarangImport) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({});
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingItem) {
        const { error } = await supabase
          .from("stock_barang_import")
          .update(formData)
          .eq("id", editingItem.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data berhasil diupdate",
        });
      } else {
        const { error } = await supabase
          .from("stock_barang_import")
          .insert(formData);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data berhasil ditambahkan",
        });
      }

      handleCloseDialog();
      fetchItems();
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
        .from("stock_barang_import")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data berhasil dihapus",
      });

      fetchItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const totalPages = Math.ceil(items.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6">
            <h1 className="text-3xl font-bold text-white">Barang Import</h1>
            <p className="text-violet-100 mt-2">
              Kelola data stok barang import
            </p>
          </div>

          {/* Actions */}
          <div className="p-6 border-b border-slate-200">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem
                      ? "Edit Barang Import"
                      : "Tambah Barang Import"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tanggal_barang_masuk">
                        Tanggal Barang Masuk
                      </Label>
                      <Input
                        id="tanggal_barang_masuk"
                        type="date"
                        value={formData.tanggal_barang_masuk || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tanggal_barang_masuk: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mawb">MAWB</Label>
                      <Input
                        id="mawb"
                        value={formData.mawb || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, mawb: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hawb">HAWB</Label>
                      <Input
                        id="hawb"
                        value={formData.hawb || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, hawb: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plp">PLP</Label>
                      <Input
                        id="plp"
                        value={formData.plp || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, plp: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="consignee">Consignee</Label>
                      <Input
                        id="consignee"
                        value={formData.consignee || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            consignee: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jenis_barang">Jenis Barang</Label>
                      <Input
                        id="jenis_barang"
                        value={formData.jenis_barang || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            jenis_barang: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="deskripsi_barang">Deskripsi Barang</Label>
                      <Textarea
                        id="deskripsi_barang"
                        value={formData.deskripsi_barang || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deskripsi_barang: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hs_code">HS Code</Label>
                      <Input
                        id="hs_code"
                        value={formData.hs_code || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, hs_code: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jumlah">Jumlah</Label>
                      <Input
                        id="jumlah"
                        type="number"
                        value={formData.jumlah || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            jumlah: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        value={formData.unit || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, unit: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="berat">Berat (kg)</Label>
                      <Input
                        id="berat"
                        type="number"
                        step="0.01"
                        value={formData.berat || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            berat: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="volume">Volume (m³)</Label>
                      <Input
                        id="volume"
                        type="number"
                        step="0.01"
                        value={formData.volume || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            volume: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="warehouses">Warehouses</Label>
                      <Input
                        id="warehouses"
                        value={formData.warehouses || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            warehouses: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zones">Zones</Label>
                      <Input
                        id="zones"
                        value={formData.zones || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, zones: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="racks">Racks</Label>
                      <Input
                        id="racks"
                        value={formData.racks || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, racks: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lots">Lots</Label>
                      <Input
                        id="lots"
                        value={formData.lots || ""}
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
                      onClick={handleCloseDialog}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      {editingItem ? "Update" : "Simpan"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>MAWB</TableHead>
                  <TableHead>HAWB</TableHead>
                  <TableHead>PLP</TableHead>
                  <TableHead>Consignee</TableHead>
                  <TableHead>Jenis Barang</TableHead>
                  <TableHead>HS Code</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Berat</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Warehouses</TableHead>
                  <TableHead>Zones</TableHead>
                  <TableHead>Racks</TableHead>
                  <TableHead>Lots</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={17} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={17} className="text-center py-8">
                      <p className="text-slate-500">Belum ada data</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell>
                        {item.tanggal_barang_masuk
                          ? new Date(
                              item.tanggal_barang_masuk,
                            ).toLocaleDateString("id-ID")
                          : "-"}
                      </TableCell>
                      <TableCell>{item.mawb || "-"}</TableCell>
                      <TableCell>{item.hawb || "-"}</TableCell>
                      <TableCell>{item.plp || "-"}</TableCell>
                      <TableCell>{item.consignee || "-"}</TableCell>
                      <TableCell>{item.jenis_barang || "-"}</TableCell>
                      <TableCell>{item.hs_code || "-"}</TableCell>
                      <TableCell>{item.jumlah || "-"}</TableCell>
                      <TableCell>{item.unit || "-"}</TableCell>
                      <TableCell>{item.berat || "-"}</TableCell>
                      <TableCell>{item.volume || "-"}</TableCell>
                      <TableCell>{item.warehouses || "-"}</TableCell>
                      <TableCell>{item.zones || "-"}</TableCell>
                      <TableCell>{item.racks || "-"}</TableCell>
                      <TableCell>{item.lots || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {items.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <div className="text-sm text-slate-600">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, items.length)} dari{" "}
                {items.length} item
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="text-sm text-slate-600">
                  Halaman {currentPage} dari {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
