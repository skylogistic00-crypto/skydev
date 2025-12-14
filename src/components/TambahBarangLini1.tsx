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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useToast } from "./ui/use-toast";
import { Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface StockItem {
  id: string;
  item_name: string;
  barcode: string;
  tanggal_masuk_barang: string;
  ceisa_document_number: string;
  batas_waktu_pengambilan: string | null;
  berat: number | null;
  volume: string | null;
}

interface BarangLini1Form {
  barcode: string;
  tanggal_barang_masuk: string;
  nomor_dokumen_ceisa: string;
  nama_barang: string;
  total_biaya: string;
  berat: string;
  volume: string;
}

export default function TambahBarangLini1() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filteredStockItems, setFilteredStockItems] = useState<StockItem[]>([]);
  const [formData, setFormData] = useState<BarangLini1Form>({
    barcode: "",
    tanggal_barang_masuk: "",
    nomor_dokumen_ceisa: "",
    nama_barang: "",
    total_biaya: "",
    berat: "",
    volume: "",
  });

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from("stock")
        .select(
          "id, item_name, barcode, tanggal_masuk_barang, ceisa_document_number, batas_waktu_pengambilan, berat, volume",
        )
        .not("tanggal_masuk_barang", "is", null)
        .order("tanggal_masuk_barang", { ascending: false });

      if (error) throw error;
      setStockItems((data || []) as any);
    } catch (error) {
      console.error("Error fetching stock items:", error);
    }
  };

  const handleTanggalMasukChange = (tanggal: string) => {
    setFormData({
      ...formData,
      tanggal_barang_masuk: tanggal,
      barcode: "",
      nama_barang: "",
      nomor_dokumen_ceisa: "",
      berat: "",
      volume: "",
    });

    // Filter stock items by selected date
    const filtered = stockItems.filter(
      (item) => item.tanggal_masuk_barang === tanggal,
    );
    setFilteredStockItems(filtered);
  };

  const handleBarcodeSelect = (barcode: string) => {
    const selectedItem = filteredStockItems.find(
      (item) => item.barcode === barcode,
    );
    if (selectedItem) {
      setFormData({
        ...formData,
        barcode: selectedItem.barcode,
        nama_barang: selectedItem.item_name,
        nomor_dokumen_ceisa: selectedItem.ceisa_document_number || "",
        berat: selectedItem.berat?.toString() || "",
        volume: selectedItem.volume || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi field wajib
    if (
      !formData.barcode ||
      !formData.tanggal_barang_masuk ||
      !formData.nama_barang
    ) {
      toast({
        title: "Validasi Gagal",
        description:
          "Barcode, Tanggal Barang Masuk, dan Nama Barang wajib diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      const itemData = {
        sku: formData.barcode,
        item_name: formData.nama_barang,
        awb: formData.nomor_dokumen_ceisa || null,
        item_arrival_date: formData.tanggal_barang_masuk,
        total_price: formData.total_biaya
          ? parseFloat(formData.total_biaya)
          : null,
        weight: formData.berat ? parseFloat(formData.berat) : null,
        volume: formData.volume ? parseFloat(formData.volume) : null,
        status: "aktif",
      } as any;

      const { error } = await supabase.from("barang_lini_1").insert(itemData);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data barang lini 1 berhasil ditambahkan",
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
      barcode: "",
      tanggal_barang_masuk: "",
      nomor_dokumen_ceisa: "",
      nama_barang: "",
      total_biaya: "",
      berat: "",
      volume: "",
    });
    setFilteredStockItems([]);
  };

  // Get unique dates from stock items
  const uniqueDates = Array.from(
    new Set(stockItems.map((item) => item.tanggal_masuk_barang)),
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Barang Lini 1
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Tambah Barang Lini 1
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tanggal Barang Masuk */}
          <div className="space-y-2">
            <Label htmlFor="tanggal_barang_masuk">
              Tanggal Barang Masuk <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.tanggal_barang_masuk}
              onValueChange={handleTanggalMasukChange}
            >
              <SelectTrigger id="tanggal_barang_masuk">
                <SelectValue placeholder="Pilih tanggal barang masuk..." />
              </SelectTrigger>
              <SelectContent>
                {uniqueDates.length === 0 ? (
                  <SelectItem value="no-data" disabled>
                    Tidak ada data tanggal masuk barang
                  </SelectItem>
                ) : (
                  uniqueDates.filter((date) => date).map((date) => (
                    <SelectItem key={date} value={date}>
                      {new Date(date).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Barcode (shown after date selected) */}
          {formData.tanggal_barang_masuk && (
            <div className="space-y-2">
              <Label htmlFor="barcode">
                Barcode <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.barcode}
                onValueChange={handleBarcodeSelect}
              >
                <SelectTrigger id="barcode">
                  <SelectValue placeholder="Pilih barcode..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredStockItems.length === 0 ? (
                    <SelectItem value="no-data" disabled>
                      Tidak ada barang untuk tanggal ini
                    </SelectItem>
                  ) : (
                    filteredStockItems.filter((item) => item.barcode).map((item) => (
                      <SelectItem key={item.id} value={item.barcode}>
                        {item.barcode} - {item.item_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Nama Barang (auto-filled) */}
          {formData.barcode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nama_barang">
                  Nama Barang <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nama_barang"
                  value={formData.nama_barang}
                  readOnly
                  className="bg-gray-50"
                  placeholder="Nama barang akan terisi otomatis"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomor_dokumen_ceisa">Nomor Dokumen Ceisa</Label>
                <Input
                  id="nomor_dokumen_ceisa"
                  value={formData.nomor_dokumen_ceisa}
                  readOnly
                  className="bg-gray-50"
                  placeholder="Nomor dokumen ceisa akan terisi otomatis"
                />
              </div>
            </>
          )}

          {/* Total Biaya */}
          <div className="space-y-2">
            <Label htmlFor="total_biaya">Total Biaya (Rp)</Label>
            <Input
              id="total_biaya"
              type="number"
              step="0.01"
              value={formData.total_biaya}
              onChange={(e) =>
                setFormData({ ...formData, total_biaya: e.target.value })
              }
              placeholder="0.00"
            />
          </div>

          <DialogFooter className="gap-2 pt-4">
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
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
