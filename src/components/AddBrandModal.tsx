import { useState } from "react";
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
import { useToast } from "@/components/ui/use-toast";

interface AddBrandModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddBrandModal({
  open,
  onClose,
  onAdded,
}: AddBrandModalProps) {
  const [brandName, setBrandName] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!brandName.trim()) {
      toast({
        title: "Error",
        description: "Nama brand tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("brands").insert([
        {
          brand_name: brandName,
          category: category || "Umum",
        },
      ]);

      if (error) throw error;

      toast({
        title: "✅ Berhasil",
        description: "Brand berhasil ditambahkan",
      });

      setBrandName("");
      setCategory("");
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
          <DialogTitle>Tambah Brand Baru</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="brand_name">Nama Brand</Label>
            <Input
              id="brand_name"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Masukkan nama brand"
            />
          </div>
          <div>
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Masukkan kategori (opsional)"
            />
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
