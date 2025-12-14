import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddItemModal({
  open,
  onClose,
  onAdded,
}: AddItemModalProps) {
  const [itemName, setItemName] = useState("");
  const [jenisBarang, setJenisBarang] = useState("");
  const [jenisBarangList, setJenisBarangList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load unique jenis_barang from item_master
  useEffect(() => {
    const loadJenisBarang = async () => {
      const { data, error } = await supabase
        .from("item_master")
        .select("jenis_barang");

      if (!error && data) {
        const uniqueJenis = Array.from(
          new Set(data.map((item) => item.jenis_barang).filter(Boolean)),
        );
        setJenisBarangList(uniqueJenis);
      }
    };

    if (open) {
      loadJenisBarang();
    }
  }, [open]);

  const handleSave = async () => {
    if (!itemName.trim()) {
      toast({
        title: "Error",
        description: "Nama item tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    if (!jenisBarang) {
      toast({
        title: "Error",
        description: "Jenis barang harus dipilih",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("item_master").insert([
        {
          item_name: itemName.trim(),
          jenis_barang: jenisBarang,
        },
      ]);

      if (error) throw error;

      toast({
        title: "✅ Berhasil",
        description: "Item berhasil ditambahkan",
      });

      setItemName("");
      setJenisBarang("");
      onAdded();
      onClose();
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Tambah Item Baru</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="item_name">Nama Item</Label>
            <Input
              id="item_name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Masukkan nama item"
            />
          </div>
          <div>
            <Label htmlFor="jenis_barang">Jenis Barang</Label>
            <Select value={jenisBarang} onValueChange={setJenisBarang}>
              <SelectTrigger id="jenis_barang">
                <SelectValue placeholder="-- Pilih Jenis Barang --" />
              </SelectTrigger>
              <SelectContent>
                {jenisBarangList.filter((jenis) => jenis).map((jenis) => (
                  <SelectItem key={jenis} value={jenis}>
                    {jenis}
                  </SelectItem>
                ))}
                <SelectItem value="Minimarket">Minimarket</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Warehouse Material">
                  Warehouse Material
                </SelectItem>
                <SelectItem value="ATK">ATK</SelectItem>
                <SelectItem value="Sparepart Kendaraan">
                  Sparepart Kendaraan
                </SelectItem>
                <SelectItem value="Minuman">Minuman</SelectItem>
                <SelectItem value="Makanan">Makanan</SelectItem>
                <SelectItem value="Elektronik">Elektronik</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
