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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface AddStockItemModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddStockItemModal({
  open,
  onClose,
  onAdded,
}: AddStockItemModalProps) {
  const [itemName, setItemName] = useState("");
  const [jenisBarang, setJenisBarang] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState("");

  const [jenisBarangList, setJenisBarangList] = useState<string[]>([]);
  const [coaList, setCoaList] = useState<any[]>([]);
  const [selectedCOA, setSelectedCOA] = useState("");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      loadJenisBarang();
      loadCOA();
      loadWarehouses();
    }
  }, [open]);

  const loadJenisBarang = async () => {
    const { data } = await supabase.from("item_master").select("jenis_barang");

    if (data) {
      const uniqueJenis = Array.from(
        new Set(data.map((item) => item.jenis_barang).filter(Boolean)),
      );
      setJenisBarangList(uniqueJenis);
    }
  };

  const loadCOA = async () => {
    const { data } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .eq("is_active", true)
      .order("account_code");

    setCoaList(data || []);
  };

  const loadWarehouses = async () => {
    const { data } = await supabase
      .from("warehouses")
      .select("*")
      .eq("is_active", true)
      .order("name");

    setWarehouses(data || []);
  };

  // Auto-generate COA based on jenis_barang
  const generateCOAMapping = (jenis: string) => {
    let coa_usage_role = "";
    let coa_prefix = "";

    switch (jenis) {
      case "Minimarket":
      case "Retail":
      case "Minuman":
      case "Makanan":
        coa_usage_role = "pendapatan_barang";
        coa_prefix = "4-1100";
        break;

      case "Warehouse Material":
        coa_usage_role = "beban_operasional";
        coa_prefix = "6-2100";
        break;

      case "ATK":
      case "Kebersihan":
        coa_usage_role = "beban_administrasi";
        coa_prefix = "6-3100";
        break;

      case "Sparepart Kendaraan":
        coa_usage_role = "beban_kendaraan";
        coa_prefix = "6-5100";
        break;

      case "Alat Kesehatan":
      case "Elektronik":
        coa_usage_role = "pendapatan_barang";
        coa_prefix = "4-1100";
        break;

      default:
        coa_usage_role = "pendapatan_lain";
        coa_prefix = "4-9000";
        break;
    }

    return { coa_usage_role, coa_prefix };
  };

  // Auto-select COA when jenis_barang changes
  useEffect(() => {
    if (jenisBarang && coaList.length > 0) {
      const coaMapping = generateCOAMapping(jenisBarang);
      console.log("COA Mapping for", jenisBarang, ":", coaMapping);

      // Try exact match first
      let matchingCOA = coaList.find(
        (coa) => coa.account_code === coaMapping.coa_prefix,
      );

      // If no exact match, try prefix match
      if (!matchingCOA) {
        matchingCOA = coaList.find((coa) =>
          coa.account_code.startsWith(coaMapping.coa_prefix),
        );
      }

      // If still no match, try by usage_role
      if (!matchingCOA) {
        matchingCOA = coaList.find(
          (coa) => coa.usage_role === coaMapping.coa_usage_role,
        );
      }

      console.log("Matching COA found:", matchingCOA);

      if (matchingCOA) {
        setSelectedCOA(matchingCOA.account_code);
        toast({
          title: "✨ COA Auto-selected",
          description: `${matchingCOA.account_code} - ${matchingCOA.account_name}`,
        });
      } else {
        console.warn("No matching COA found for", jenisBarang);
        setSelectedCOA("");
      }
    }
  }, [jenisBarang, coaList]);

  const handleSave = async () => {
    // Validation
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

    if (!brand.trim()) {
      toast({
        title: "Error",
        description: "Brand tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Step 1: Check/Insert item_master
      const { data: existingItem } = await supabase
        .from("item_master")
        .select("*")
        .eq("item_name", itemName.trim())
        .maybeSingle();

      if (!existingItem) {
        const { error: itemError } = await supabase.from("item_master").insert({
          item_name: itemName.trim(),
          jenis_barang: jenisBarang,
        });

        if (itemError) throw itemError;
      }

      // Step 2: Check/Insert brand
      const { data: existingBrand } = await supabase
        .from("brands")
        .select("*")
        .eq("brand_name", brand.trim())
        .maybeSingle();

      if (!existingBrand) {
        const { error: brandError } = await supabase.from("brands").insert({
          brand_name: brand.trim(),
          category: jenisBarang,
        });

        if (brandError) throw brandError;
      }

      // Step 3: Insert stock
      const { error: stockError } = await supabase.from("stock").insert({
        item_name: itemName.trim(),
        brand: brand.trim(),
        jenis_barang: jenisBarang,
        description: description.trim(),
        quantity: quantity,
        unit: unit,
        coa_account_code: selectedCOA,
        warehouse_id: selectedWarehouse || null,
      });

      if (stockError) throw stockError;

      toast({
        title: "✅ Berhasil",
        description: "Item, brand, dan stock berhasil ditambahkan!",
      });

      // Reset form
      setItemName("");
      setJenisBarang("");
      setBrand("");
      setDescription("");
      setQuantity(0);
      setUnit("");
      setSelectedCOA("");
      setSelectedWarehouse("");

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
      <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Item & Stock Baru</DialogTitle>
        </DialogHeader>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-900">
            Form ini akan menambahkan item, brand, dan stock sekaligus dalam
            satu kali simpan.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {/* Item Name */}
          <div>
            <Label htmlFor="item_name">Nama Item *</Label>
            <Input
              id="item_name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Masukkan nama item"
            />
          </div>

          {/* Jenis Barang */}
          <div>
            <Label htmlFor="jenis_barang">Jenis Barang *</Label>
            <Select value={jenisBarang} onValueChange={setJenisBarang}>
              <SelectTrigger id="jenis_barang">
                <SelectValue placeholder="-- Pilih Jenis Barang --" />
              </SelectTrigger>
              <SelectContent>
                {jenisBarangList.map((jenis) => (
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

          {/* Brand */}
          <div>
            <Label htmlFor="brand">Brand *</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Masukkan nama brand"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Masukkan deskripsi (opsional)"
              rows={3}
            />
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="unit">Satuan</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pcs, kg, liter, dll"
              />
            </div>
          </div>

          {/* COA Account */}
          <div>
            <Label htmlFor="coa_account">COA Account</Label>
            <Select value={selectedCOA} onValueChange={setSelectedCOA}>
              <SelectTrigger id="coa_account">
                <SelectValue placeholder="Pilih COA Account" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {coaList.map((coa) => (
                  <SelectItem key={coa.account_code} value={coa.account_code}>
                    {coa.account_code} - {coa.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {jenisBarang && (
              <p className="text-xs text-blue-600 mt-1">
                💡 COA otomatis dipilih berdasarkan jenis barang
              </p>
            )}
          </div>

          {/* Warehouse */}
          <div>
            <Label htmlFor="warehouse">Gudang</Label>
            <Select
              value={selectedWarehouse}
              onValueChange={setSelectedWarehouse}
            >
              <SelectTrigger id="warehouse">
                <SelectValue placeholder="-- Pilih Gudang (opsional) --" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Semua"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
