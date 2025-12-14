import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Info } from "lucide-react";

interface ItemMaster {
  id: string;
  item_name: string;
  jenis_barang: string;
  description?: string;
}

interface COAAccount {
  account_code: string;
  account_name: string;
  account_type: string;
}

export default function StockEngineForm() {
  const { toast } = useToast();

  // State for dropdowns
  const [itemNameList, setItemNameList] = useState<ItemMaster[]>([]);
  const [brandList, setBrandList] = useState<string[]>([]);
  const [coaList, setCoaList] = useState<COAAccount[]>([]);

  // Form state
  const [itemName, setItemName] = useState("");
  const [isManualItem, setIsManualItem] = useState(false);
  const [manualItemName, setManualItemName] = useState("");
  const [jenisBarang, setJenisBarang] = useState("");

  const [brand, setBrand] = useState("");
  const [isManualBrand, setIsManualBrand] = useState(false);
  const [manualBrand, setManualBrand] = useState("");

  const [selectedCOA, setSelectedCOA] = useState("");
  const [description, setDescription] = useState("");
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadItemNames();
    loadBrands();
    loadCOAAccounts();
  }, []);

  const loadItemNames = async () => {
    const { data, error } = await supabase
      .from("item_master")
      .select("*")
      .order("item_name");

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setItemNameList(data || []);
  };

  const loadBrands = async () => {
    const { data, error } = await supabase
      .from("brands")
      .select("brand_name")
      .order("brand_name");

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const uniqueBrands = [...new Set(data?.map((b) => b.brand_name) || [])];
    setBrandList(uniqueBrands);
  };

  // Load brands filtered by item name
  const loadBrandsByItemName = async (itemName: string) => {
    const { data, error } = await supabase
      .from("item_brand_mapping")
      .select("brand_name")
      .eq("item_name", itemName)
      .eq("is_active", true)
      .order("brand_name");

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setBrandList([]);
      return;
    }

    const uniqueBrands = [
      ...new Set(data?.map((b) => b.brand_name).filter(Boolean) || []),
    ];

    // Always set the filtered brands, even if empty
    setBrandList(uniqueBrands);

    if (uniqueBrands.length > 0) {
      toast({
        title: "Brand Filter Applied",
        description: `Showing ${uniqueBrands.length} brands for ${itemName}`,
      });
    } else {
      toast({
        title: "No Brands Found",
        description: `No brands available for ${itemName}. Please add brand mapping or use manual input.`,
        variant: "destructive",
      });
    }
  };

  const loadCOAAccounts = async () => {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("account_code, account_name, account_type")
      .eq("is_active", true)
      .order("account_code");

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setCoaList(data || []);
  };

  const handleItemNameChange = (value: string) => {
    if (value === "manual") {
      setIsManualItem(true);
      setItemName("");
      setJenisBarang("");
    } else {
      setIsManualItem(false);
      setItemName(value);
      setManualItemName("");

      // Get jenis_barang from selected item
      const selectedItem = itemNameList.find((i) => i.item_name === value);
      if (selectedItem) {
        setJenisBarang(selectedItem.jenis_barang);
      }

      // Load brands filtered by this item name
      loadBrandsByItemName(value);
    }
  };

  const handleBrandChange = async (value: string) => {
    if (value === "manual") {
      setIsManualBrand(true);
      setBrand("");
    } else {
      setIsManualBrand(false);
      setBrand(value);
      setManualBrand("");

      // Auto-populate fields when both item name and brand are selected
      const finalItemName = isManualItem ? manualItemName : itemName;
      if (finalItemName) {
        await autoPopulateFields(finalItemName, value);
      }
    }
  };

  // Auto-populate fields based on product_reference and brand data
  const autoPopulateFields = async (itemName: string, brand: string) => {
    try {
      // First, try to get data from product_reference
      const { data: productRef, error: refError } = await supabase
        .from("product_reference")
        .select("*")
        .eq("item_name", itemName)
        .eq("brand", brand)
        .maybeSingle();

      if (productRef) {
        // Use product_reference data
        setDescription(productRef.description || `${itemName} - ${brand}`);

        if (productRef.coa_account_code) {
          setSelectedCOA(productRef.coa_account_code);
        }

        toast({
          title: "✨ Auto-populated from Product Reference",
          description: `${productRef.kategori_layanan || "-"} - ${productRef.jenis_layanan || "-"} | COA: ${productRef.coa_account_code || "-"}`,
        });
        return;
      }

      // Fallback to brands table if not found in product_reference
      const { data: brandData, error } = await supabase
        .from("brands")
        .select(
          "brand_name, satuan, berat, volume, kategori_layanan, jenis_layanan, coa_account_code, coa_account_name",
        )
        .eq("brand_name", brand)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (brandData) {
        setDescription(
          `${itemName} - ${brand} (${brandData.kategori_layanan || "-"}, ${brandData.satuan || "-"}, ${brandData.berat || "-"} kg)`,
        );

        // Set COA if available
        if (brandData.coa_account_code) {
          setSelectedCOA(brandData.coa_account_code);
        }

        toast({
          title: "Auto-populated from Brand",
          description: `${brandData.kategori_layanan || "-"} - ${brandData.jenis_layanan || "-"} | COA: ${brandData.coa_account_code || "-"}`,
        });
      }
    } catch (error: any) {
      console.log("No data found, user can fill manually");
    }
  };

  // Validation function
  const validateInput = (form: any) => {
    const err: string[] = [];

    if (!form.item_name) err.push("Nama barang wajib diisi");
    if (!form.jenis_barang) err.push("Jenis barang wajib dipilih");
    if (!form.brand) err.push("Brand wajib diisi / dipilih");

    if (err.length > 0) {
      throw { message: "Validasi gagal", detail: err };
    }

    return { ok: true };
  };

  // Normalize input function
  const normalizeInput = (form: any) => {
    return {
      item_name: form.item_name.trim(),
      jenis_barang: form.jenis_barang?.trim() || "",
      brand: form.brand.trim(),
      description: form.description ?? "",
    };
  };

  // Generate COA Mapping based on jenis_barang
  const generateCOAMapping = (jenis: string) => {
    let coa_usage_role = "";
    let coa_prefix = "";

    switch (jenis) {
      case "Minimarket":
      case "Retail":
        coa_usage_role = "pendapatan_barang";
        coa_prefix = "4-1100";
        break;

      case "Warehouse Material":
        coa_usage_role = "beban_operasional";
        coa_prefix = "6-2100";
        break;

      case "ATK":
        coa_usage_role = "beban_administrasi";
        coa_prefix = "6-3100";
        break;

      case "Sparepart Kendaraan":
        coa_usage_role = "beban_kendaraan";
        coa_prefix = "6-5100";
        break;

      default:
        coa_usage_role = "pendapatan_lain";
        coa_prefix = "4-9000";
        break;
    }

    return {
      coa_usage_role,
      coa_prefix,
    };
  };

  const saveStock = async () => {
    try {
      const finalItemName = isManualItem ? manualItemName : itemName;
      const finalBrand = isManualBrand ? manualBrand : brand;

      // Get jenis_barang from item_master
      let jenisBarang = "";
      if (!isManualItem) {
        const selectedItem = itemNameList.find(
          (i) => i.item_name === finalItemName,
        );
        jenisBarang = selectedItem?.jenis_barang || "";
      }

      // Prepare form data
      const formData = {
        item_name: finalItemName,
        jenis_barang: jenisBarang,
        brand: finalBrand,
        description: description,
      };

      // Step 1: Validate Input
      validateInput(formData);

      // Step 2: Normalize Input
      const normalized = normalizeInput(formData);

      // Step 3: Generate COA Mapping
      const coaMapping = generateCOAMapping(normalized.jenis_barang);

      // Step 4: Search for existing COA with usage_role
      const { data: existingCOA, error: coaSearchError } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("usage_role", coaMapping.coa_usage_role)
        .limit(1)
        .maybeSingle();

      if (coaSearchError && coaSearchError.code !== "PGRST116") {
        throw coaSearchError;
      }

      let finalCOA = selectedCOA;

      // Step 5: Insert COA if it doesn't exist
      if (!existingCOA) {
        const accountTypeMap: Record<string, string> = {
          pendapatan_barang: "Pendapatan",
          beban_operasional: "Beban",
          beban_administrasi: "Beban",
          beban_kendaraan: "Beban",
          pendapatan_lain: "Pendapatan",
        };

        const normalBalanceMap: Record<string, string> = {
          Pendapatan: "Kredit",
          Beban: "Debit",
        };

        const accountType =
          accountTypeMap[coaMapping.coa_usage_role] || "Pendapatan";
        const normalBalance = normalBalanceMap[accountType];

        const { data: newCOA, error: insertCOAError } = await supabase
          .from("chart_of_accounts")
          .insert({
            account_code: coaMapping.coa_prefix,
            account_name: `${accountType} ${normalized.jenis_barang}`,
            account_type: accountType,
            normal_balance: normalBalance,
            is_active: true,
            usage_role: coaMapping.coa_usage_role,
            kategori_layanan: normalized.jenis_barang,
          })
          .select()
          .single();

        if (insertCOAError) {
          console.error("Error creating COA:", insertCOAError);
          // Continue with manual COA selection
        } else {
          finalCOA = newCOA.account_code;
          toast({
            title: "✨ COA Created",
            description: `New COA account created: ${newCOA.account_code} - ${newCOA.account_name}`,
          });
        }
      } else {
        finalCOA = existingCOA.account_code;
        toast({
          title: "COA Auto-mapped",
          description: `${coaMapping.coa_usage_role}: ${existingCOA.account_code} - ${existingCOA.account_name}`,
        });
      }

      // Use manually selected COA if provided
      if (selectedCOA) {
        finalCOA = selectedCOA;
      }

      if (!finalCOA) {
        toast({
          title: "Error",
          description:
            "COA account wajib dipilih atau tidak ditemukan untuk jenis barang ini",
          variant: "destructive",
        });
        return;
      }

      // Check if product exists in product_reference
      const { data: productRef } = await supabase
        .from("product_reference")
        .select("*")
        .eq("item_name", normalized.item_name)
        .eq("brand", normalized.brand)
        .maybeSingle();

      // Step 6: Insert into item_master (if not exists)
      const { data: existingItem } = await supabase
        .from("item_master")
        .select("*")
        .eq("item_name", normalized.item_name)
        .maybeSingle();

      if (!existingItem) {
        const { error: itemError } = await supabase.from("item_master").insert({
          item_name: normalized.item_name,
          jenis_barang: normalized.jenis_barang,
          coa_account_code: finalCOA,
        });

        if (itemError) {
          console.error("Error inserting item_master:", itemError);
        }
      }

      // Insert stock with normalized data
      const { error: stockError } = await supabase.from("stock").insert({
        item_name: normalized.item_name,
        brand: normalized.brand,
        description: normalized.description,
        coa_account_code: finalCOA,
        jenis_barang: normalized.jenis_barang,
      });

      if (stockError) {
        toast({
          title: "Error",
          description: stockError.message,
          variant: "destructive",
        });
        return;
      }

      // Step 7: Return success result
      toast({
        title: "✅ Item berhasil dibuat",
        description: `Stock berhasil disimpan! ${productRef ? "(Data dari product reference)" : ""} | COA: ${finalCOA}`,
      });

      // Clear form
      setItemName("");
      setBrand("");
      setDescription("");
      setSelectedCOA("");
      setJenisBarang("");
      setIsManualItem(false);
      setIsManualBrand(false);
      setManualItemName("");
      setManualBrand("");

      // Reload data
      loadItemNames();
      loadBrands();
      loadCOA();
    } catch (error: any) {
      // Step 8: Error Handler
      if (error.detail && Array.isArray(error.detail)) {
        toast({
          title: error.message || "Validasi gagal",
          description: error.detail.join(", "),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Terjadi kesalahan",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            Stock Engine Auto Generator
          </CardTitle>
          <CardDescription>
            Sistem otomatis untuk membuat stock dengan COA terintegrasi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Alert */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              <strong>Validasi & COA Mapping Otomatis:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Item name, jenis barang, dan brand wajib diisi</li>
                <li>COA otomatis dipilih berdasarkan jenis barang:</li>
                <ul className="ml-6 mt-1 space-y-0.5 text-xs">
                  <li>Minimarket/Retail → Pendapatan Barang (4-1100)</li>
                  <li>Warehouse Material → Beban Operasional (6-2100)</li>
                  <li>ATK → Beban Administrasi (6-3100)</li>
                  <li>Sparepart Kendaraan → Beban Kendaraan (6-5100)</li>
                  <li>Lainnya → Pendapatan Lain (4-9000)</li>
                </ul>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Item Name & Brand Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Item Name */}
            <div className="space-y-2">
              <Label htmlFor="item_name">Item Name</Label>
              {isManualItem ? (
                <div className="flex gap-2">
                  <Input
                    value={manualItemName}
                    onChange={(e) => setManualItemName(e.target.value)}
                    placeholder="Masukkan nama item"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsManualItem(false);
                      setManualItemName("");
                    }}
                  >
                    Batal
                  </Button>
                </div>
              ) : (
                <Select value={itemName} onValueChange={handleItemNameChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih item name" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">+ Input Manual</SelectItem>
                    {itemNameList.filter((item) => item.item_name).map((item) => (
                      <SelectItem key={item.id} value={item.item_name}>
                        {item.item_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              {isManualBrand ? (
                <div className="flex gap-2">
                  <Input
                    value={manualBrand}
                    onChange={(e) => setManualBrand(e.target.value)}
                    placeholder="Masukkan nama brand"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsManualBrand(false);
                      setManualBrand("");
                    }}
                  >
                    Batal
                  </Button>
                </div>
              ) : (
                <Select value={brand} onValueChange={handleBrandChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">+ Input Manual</SelectItem>
                    {brandList.filter((brandName) => brandName).map((brandName) => (
                      <SelectItem key={brandName} value={brandName}>
                        {brandName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Jenis Barang (Read-only, auto-filled) */}
          {jenisBarang && (
            <div className="space-y-2">
              <Label htmlFor="jenis_barang">Jenis Barang</Label>
              <Input
                id="jenis_barang"
                value={jenisBarang}
                disabled
                className="bg-gray-100"
              />
            </div>
          )}

          {/* COA Account */}
          <div className="space-y-2">
            <Label htmlFor="coa_account">COA Account</Label>
            <Select value={selectedCOA} onValueChange={setSelectedCOA}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih COA Account" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {coaList.filter((coa) => coa.account_code).map((coa) => (
                  <SelectItem key={coa.account_code} value={coa.account_code}>
                    {coa.account_code} - {coa.account_name} ({coa.account_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {jenisBarang && (
              <p className="text-xs text-blue-600 mt-1">
                💡 COA akan otomatis dipilih berdasarkan jenis barang:{" "}
                {jenisBarang}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Masukkan deskripsi barang"
              rows={3}
            />
          </div>

          {/* Save Button */}
          <Button onClick={saveStock} className="w-full">
            Simpan Stock
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
