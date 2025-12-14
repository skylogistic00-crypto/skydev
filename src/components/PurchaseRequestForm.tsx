import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import AddStockItemModal from "./AddStockItemModal";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { useToast } from "./ui/use-toast";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, Upload, X, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface PurchaseRequestFormProps {
  onSuccess?: () => void;
}

interface Supplier {
  id: string;
  supplier_name: string;
  phone_number?: string;
  address?: string;
  email?: string;
  is_pkp?: string;
}

interface StockItem {
  id: string;
  item_name: string;
  hs_category?: string;
  supplier_name?: string;
  unit?: string;
  purchase_price?: number;
  selling_price?: number;
  ppn_on_purchase?: number;
}

interface PRItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax: number;
  shipping_cost: number;
  subtotal: number;
  hs_category?: string;
  foto_barang?: string;
}

interface PurchaseRequestForm {
  request_date: Date;
  name: string;
  item_name: string;
  supplier_id: string;
  qty: string;
  unit: string;
  unit_price: string;
  shipping_cost: string;
  tax: string;
  barcode: string;
  notes: string;
  email: string;
  status: string;
  hs_category: string;
}

export default function PurchaseRequestForm({
  onSuccess,
}: PurchaseRequestFormProps = {}) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [defaultPPNRate, setDefaultPPNRate] = useState(11);

  // PR Items state
  const [prItems, setPrItems] = useState<PRItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    item_name: "",
    brand: "",
    quantity: 1,
    unit: "",
    unit_price: 0,
    tax: 0,
    shipping_cost: 0,
    hs_category: "",
  });
  const [openItemCombobox, setOpenItemCombobox] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<any[]>([]);
  const [stockInfo, setStockInfo] = useState<any>(null);
  const [loadingStock, setLoadingStock] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [racks, setRacks] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedRack, setSelectedRack] = useState("");
  const [selectedLot, setSelectedLot] = useState("");
  const [openStockItemModal, setOpenStockItemModal] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [newSupplierData, setNewSupplierData] = useState({
    supplier_name: "",
    contact_person: "",
    phone_number: "",
    email: "",
    city: "",
    country: "",
    is_pkp: "",
    tax_id: "",
    bank_name: "",
    bank_account_holder: "",
    payment_terms: "",
    category: "",
    currency: "IDR",
    status: "ACTIVE",
    address: "",
  });
  const [formData, setFormData] = useState({
    request_date: new Date(),
    name: "",
    supplier_id: "",
    shipping_cost: 0,
    notes: "",
    email: user?.email || "",
    status: "PENDING",
  });

  useEffect(() => {
    if (userProfile?.full_name) {
      setFormData((prev) => ({ ...prev, name: userProfile.full_name }));
    }
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
    fetchSuppliers();
    fetchStockItems();
    fetchTaxSettings();
    fetchBrands();
    fetchWarehouses();
  }, [userProfile, user]);

  const fetchTaxSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("tax_settings")
        .select("rate")
        .eq("tax_type", "PPN")
        .eq("is_active", true)
        .single();

      if (error) throw error;
      if (data) {
        setDefaultPPNRate(data.rate);
      }
    } catch (error) {
      console.error("Error fetching tax settings:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, supplier_name, phone_number, address, email, is_pkp")
        .eq("status", "ACTIVE")
        .order("supplier_name");

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchStockItems = async () => {
    try {
      console.log("=== Fetching Stock Items ===");
      const { data, error } = await supabase
        .from("stock")
        .select(
          "id, item_name, hs_category, supplier_name, unit, purchase_price, selling_price, ppn_on_purchase",
        )
        .order("item_name");

      if (error) {
        console.error("Error fetching stock items:", error);
        throw error;
      }

      console.log("Stock items fetched:", data?.length || 0, "items");
      console.log("Sample stock item:", data?.[0]);
      setStockItems((data || []) as any);
    } catch (error) {
      console.error("Error fetching stock items:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data stock",
        variant: "destructive",
      });
    }
  };

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("brand_name");

      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const fetchStockInfo = async (itemName: string, brand: string) => {
    if (!itemName || !brand) {
      setStockInfo(null);
      return;
    }

    setLoadingStock(true);
    try {
      const { data, error } = await supabase
        .from("stock")
        .select(
          `
          *,
          warehouses!warehouse_id(name, code, address)
        `,
        )
        .eq("item_name", itemName)
        .eq("brand", brand)
        .maybeSingle();

      if (error) throw error;

      setStockInfo(data);
    } catch (error) {
      console.error("Error fetching stock info:", error);
      setStockInfo(null);
    } finally {
      setLoadingStock(false);
    }
  };

  // Filter brands based on selected item
  useEffect(() => {
    const filterBrandsByItem = async () => {
      if (!currentItem.item_name) {
        setFilteredBrands(brands);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("product_reference")
          .select("brand")
          .eq("item_name", currentItem.item_name);

        if (error) throw error;

        if (data && data.length > 0) {
          const brandNames = data.map((item) => item.brand).filter(Boolean);
          const filtered = brands.filter((b) =>
            brandNames.includes(b.brand_name),
          );
          setFilteredBrands(filtered);
        } else {
          setFilteredBrands(brands);
        }
      } catch (error) {
        console.error("Error filtering brands:", error);
        setFilteredBrands(brands);
      }
    };

    filterBrandsByItem();
  }, [currentItem.item_name, brands]);

  // Fetch stock info when item and brand change
  useEffect(() => {
    fetchStockInfo(currentItem.item_name, currentItem.brand);
  }, [currentItem.item_name, currentItem.brand]);

  const handleSupplierChange = (supplierId: string) => {
    if (supplierId === "add_new") {
      setIsSupplierDialogOpen(true);
      return;
    }

    setFormData({ ...formData, supplier_id: supplierId });

    const supplier = suppliers.find((s) => s.id === supplierId);
    setSelectedSupplier(supplier || null);

    // Auto-apply tax if supplier is PKP
    if (supplier?.is_pkp === "YES") {
      setCurrentItem((prev) => ({
        ...prev,
        tax: defaultPPNRate,
      }));

      toast({
        title: "Info",
        description: `Supplier PKP terdeteksi. PPN ${defaultPPNRate}% otomatis diterapkan.`,
      });
    } else {
      setCurrentItem((prev) => ({
        ...prev,
        tax: 0,
      }));
    }
  };

  const handleItemSelect = (item: StockItem) => {
    console.log("=== Item Selected ===");
    console.log("Selected item:", item);

    const taxValue = item.ppn_on_purchase || 0;

    setCurrentItem({
      item_name: item.item_name,
      brand: "", // Reset brand when item changes
      quantity: 1,
      unit: item.unit || "",
      unit_price: item.purchase_price || 0,
      tax: taxValue,
      shipping_cost: 0,
      hs_category: item.hs_category || "",
    });

    console.log("Current item updated with:", {
      item_name: item.item_name,
      hs_category: item.hs_category,
      supplier_name: item.supplier_name,
      unit: item.unit,
      unit_price: item.purchase_price,
      tax: taxValue,
    });

    // Find supplier by name if available
    if (item.supplier_name) {
      const supplier = suppliers.find(
        (s) => s.supplier_name === item.supplier_name,
      );
      console.log("Setting supplier by name:", supplier);
      if (supplier) {
        setSelectedSupplier(supplier);
        setFormData((prev) => ({ ...prev, supplier_id: supplier.id }));
      }
    }

    setOpenItemCombobox(false);
  };

  const calculateItemSubtotal = (
    quantity: number,
    unitPrice: number,
    tax: number,
    shippingCost: number,
  ) => {
    return quantity * unitPrice + tax + shippingCost;
  };

  const handleAddItem = async () => {
    if (
      !currentItem.item_name ||
      currentItem.quantity <= 0 ||
      currentItem.unit_price < 0
    ) {
      toast({
        title: "Error",
        description: "Mohon lengkapi data item (nama, quantity, dan harga)",
        variant: "destructive",
      });
      return;
    }

    const subtotal = calculateItemSubtotal(
      currentItem.quantity,
      currentItem.unit_price,
      currentItem.tax,
      currentItem.shipping_cost,
    );

    const newItem: PRItem = {
      id: Date.now().toString(),
      item_name: currentItem.item_name,
      quantity: currentItem.quantity,
      unit: currentItem.unit,
      unit_price: currentItem.unit_price,
      tax: currentItem.tax,
      shipping_cost: currentItem.shipping_cost,
      subtotal: subtotal,
      hs_category: currentItem.hs_category,
      foto_barang: photoUrl || undefined,
    };

    setPrItems([...prItems, newItem]);

    // Reset current item
    setCurrentItem({
      item_name: "",
      quantity: 1,
      unit: "",
      unit_price: 0,
      tax: 0,
      shipping_cost: 0,
      hs_category: "",
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoUrl(null);

    toast({
      title: "Item ditambahkan",
      description: `${newItem.item_name} berhasil ditambahkan ke daftar`,
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setPrItems(prItems.filter((item) => item.id !== itemId));
    toast({
      title: "Item dihapus",
      description: "Item berhasil dihapus dari daftar",
    });
  };

  const calculateTotalAmount = () => {
    const itemsTotal = prItems.reduce((sum, item) => sum + item.subtotal, 0);
    return itemsTotal;
  };

  const calculateTotalShipping = () => {
    return prItems.reduce((sum, item) => sum + item.shipping_cost, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (prItems.length === 0) {
      toast({
        title: "Error",
        description: "Mohon tambahkan minimal 1 item ke Purchase Request",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Generate base request code
      const baseRequestCode = `PR-${Date.now()}`;

      // Pastikan name tidak kosong
      const requesterName =
        formData.name ||
        userProfile?.full_name ||
        user?.email?.split("@")[0] ||
        "Unknown User";

      // Insert each item as a separate purchase request with unique code
      const insertPromises = prItems.map((item, index) =>
        supabase.from("purchase_requests").insert({
          request_code: `${baseRequestCode}-${index + 1}`, // Add index to make unique
          request_date: format(formData.request_date, "yyyy-MM-dd"),
          name: requesterName,
          item_name: item.item_name,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          shipping_cost: item.shipping_cost,
          total_amount: item.subtotal,
          requester_id: user?.id,
          status: "PENDING",
          email: formData.email || null,
          tax: item.tax,
          notes: formData.notes || null,
          supplier_id: formData.supplier_id || null,
          foto_barang: item.foto_barang || null,
          item_description: item.item_name,
          requester_name: requesterName,
        }),
      );

      const results = await Promise.all(insertPromises);

      // Check for errors
      const errors = results.filter((result) => result.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }

      toast({
        title: "Success",
        description: `Purchase request dengan ${prItems.length} item berhasil dibuat`,
      });

      // Reset form
      setFormData({
        request_date: new Date(),
        name: userProfile?.full_name || "",
        supplier_id: "",
        shipping_cost: 0,
        notes: "",
        email: user?.email || "",
        status: "PENDING",
      });
      setPrItems([]);
      setCurrentItem({
        item_name: "",
        quantity: 1,
        unit: "",
        unit_price: 0,
        tax: 0,
        shipping_cost: 0,
        hs_category: "",
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoUrl(null);
      setSelectedSupplier(null);

      if (onSuccess) {
        onSuccess();
      }
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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "File must be an image",
        variant: "destructive",
      });
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));

    // Upload to Supabase Storage
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `purchase-requests/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("purchase-request-photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("purchase-request-photos")
        .getPublicUrl(filePath);

      setPhotoUrl(urlData.publicUrl);

      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setPhotoFile(null);
      setPhotoPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoUrl(null);
  };

  const handleAddNewSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("suppliers")
        .insert([newSupplierData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Supplier berhasil ditambahkan",
      });

      // Add to suppliers list and select it
      setSuppliers([...suppliers, data]);
      setFormData({ ...formData, supplier_id: data.id });
      setSelectedSupplier(data);

      // Reset form and close dialog
      setNewSupplierData({
        supplier_name: "",
        contact_person: "",
        phone_number: "",
        email: "",
        city: "",
        country: "",
        is_pkp: "",
        tax_id: "",
        bank_name: "",
        bank_account_holder: "",
        payment_terms: "",
        category: "",
        currency: "IDR",
        status: "ACTIVE",
        address: "",
      });
      setIsSupplierDialogOpen(false);
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

  const totalAmount = calculateTotalAmount();
  const formatToRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Create Purchase Request</CardTitle>
          <CardDescription>
            Fill in the details for your purchase request with multiple items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="request_date">Request Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.request_date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.request_date}
                      onSelect={(date) =>
                        date && setFormData({ ...formData, request_date: date })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_id">Supplier Name</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={handleSupplierChange}
              >
                <SelectTrigger id="supplier_id">
                  <SelectValue placeholder="Pilih supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.filter((supplier) => supplier.id).map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.supplier_name}
                      {supplier.is_pkp === "YES" && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          PKP
                        </span>
                      )}
                    </SelectItem>
                  ))}
                  <SelectItem
                    value="add_new"
                    className="text-blue-600 font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />+ Tambah supplier baru
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedSupplier && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-slate-700">
                  Supplier Information
                </h4>

                <div className="grid md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-slate-600">Phone</Label>
                    <p className="font-medium">
                      {selectedSupplier.phone_number || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Email</Label>
                    <p className="font-medium">
                      {selectedSupplier.email || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Address</Label>
                    <p className="font-medium">
                      {selectedSupplier.address || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Status PKP</Label>
                    <p className="font-medium">
                      {selectedSupplier.is_pkp === "YES" ? (
                        <span className="text-green-600 font-semibold">
                          ✓ PKP (PPN {defaultPPNRate}%)
                        </span>
                      ) : (
                        <span className="text-gray-600">Non-PKP</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Add Item Section */}
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-slate-700">
                Tambah Item
              </h3>

              <div className="space-y-2">
                <Label htmlFor="item_name">Item Name *</Label>
                <Popover
                  open={openItemCombobox}
                  onOpenChange={setOpenItemCombobox}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openItemCombobox}
                      className="w-full justify-between"
                    >
                      {currentItem.item_name || "Select or type item name..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search or type new item name..."
                        value={currentItem.item_name}
                        onValueChange={(value) =>
                          setCurrentItem({ ...currentItem, item_name: value })
                        }
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-4 space-y-2">
                            <p className="text-sm text-slate-600">
                              Item "{currentItem.item_name}" tidak ditemukan di
                              list.
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setOpenItemCombobox(false);
                                setOpenStockItemModal(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Tambah Item & Stock Baru
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {stockItems.map((item) => (
                            <CommandItem
                              key={item.id}
                              value={item.item_name}
                              onSelect={() => handleItemSelect(item)}
                            >
                              {item.item_name}
                              {item.hs_category && (
                                <span className="ml-2 text-xs text-slate-500">
                                  ({item.hs_category})
                                </span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Brand Field */}
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Select
                  value={currentItem.brand}
                  onValueChange={(value) =>
                    setCurrentItem({ ...currentItem, brand: value })
                  }
                  disabled={!currentItem.item_name}
                >
                  <SelectTrigger id="brand">
                    <SelectValue
                      placeholder={
                        currentItem.item_name
                          ? "-- pilih brand --"
                          : "Pilih item terlebih dahulu"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBrands.filter((b) => b.brand_name).map((b) => (
                      <SelectItem key={b.id} value={b.brand_name}>
                        {b.brand_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stock Information Display */}
              {currentItem.item_name && currentItem.brand && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2 md:col-span-2">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    📦 Informasi Stock Saat Ini
                  </h4>
                  {loadingStock ? (
                    <p className="text-sm text-gray-600">
                      Memuat data stock...
                    </p>
                  ) : stockInfo ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Sisa Stock:
                        </span>
                        <span className="ml-2 text-gray-900 font-bold">
                          {stockInfo.quantity || 0} {stockInfo.unit || "pcs"}
                        </span>
                      </div>
                      {stockInfo.warehouses && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Gudang:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {stockInfo.warehouses.name} (
                            {stockInfo.warehouses.code})
                          </span>
                        </div>
                      )}
                      {stockInfo.location && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Lokasi:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {stockInfo.location}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600">
                      ⚠️ Stock tidak ditemukan untuk item dan brand ini
                    </p>
                  )}
                </div>
              )}

              {/* Warehouse Selection for New Stock */}
              <div className="space-y-2">
                <Label htmlFor="warehouse">Gudang Tujuan *</Label>
                <Select
                  value={selectedWarehouse}
                  onValueChange={setSelectedWarehouse}
                >
                  <SelectTrigger id="warehouse">
                    <SelectValue placeholder="-- Pilih Gudang --" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.filter((w) => w.id).map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hs_category">Kategori (HS Category)</Label>
                <Input
                  id="hs_category"
                  value={currentItem.hs_category}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      hs_category: e.target.value,
                    })
                  }
                  placeholder="Kategori barang"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="foto_barang">Foto Barang</Label>
                <div className="space-y-3">
                  {!photoPreview ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                      <input
                        id="foto_barang"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        disabled={uploading}
                      />
                      <label htmlFor="foto_barang" className="cursor-pointer">
                        <Upload className="mx-auto h-12 w-12 text-slate-400" />
                        <p className="mt-2 text-sm text-slate-600">
                          {uploading ? "Uploading..." : "Click to upload photo"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          PNG, JPG up to 5MB
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative border border-slate-300 rounded-lg p-2">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-4 right-4"
                        onClick={removePhoto}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) =>
                      setCurrentItem({
                        ...currentItem,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={currentItem.unit}
                    onChange={(e) =>
                      setCurrentItem({ ...currentItem, unit: e.target.value })
                    }
                    placeholder="pcs, kg, dll"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_price">Unit Price *</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentItem.unit_price}
                    onChange={(e) =>
                      setCurrentItem({
                        ...currentItem,
                        unit_price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax">Tax</Label>
                  <Input
                    id="tax"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentItem.tax}
                    onChange={(e) =>
                      setCurrentItem({
                        ...currentItem,
                        tax: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item_shipping_cost">Shipping Cost</Label>
                <Input
                  id="item_shipping_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentItem.shipping_cost}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      shipping_cost: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Biaya pengiriman untuk item ini"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="text-sm text-slate-600">
                  Subtotal:{" "}
                  <span className="font-semibold text-slate-900">
                    {formatToRupiah(
                      calculateItemSubtotal(
                        currentItem.quantity,
                        currentItem.unit_price,
                        currentItem.tax,
                        currentItem.shipping_cost,
                      ),
                    )}
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Barang
                </Button>
              </div>
            </div>

            {/* PR Items Table */}
            {prItems.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-700">
                  Daftar Item ({prItems.length})
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-[30%]">Item Name</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-center">Unit</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Tax</TableHead>
                        <TableHead className="text-right">Shipping</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-center w-[80px]">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.item_name}
                            {item.hs_category && (
                              <span className="block text-xs text-slate-500">
                                {item.hs_category}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.unit || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatToRupiah(item.unit_price)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatToRupiah(item.tax)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatToRupiah(item.shipping_cost)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatToRupiah(item.subtotal)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Shipping Cost & Notes */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipping_cost">Shipping Cost</Label>
                <Input
                  id="shipping_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.shipping_cost}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shipping_cost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any additional information"
                rows={3}
              />
            </div>

            {/* Total Amount */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Items Total:</span>
                  <span className="font-medium">
                    {formatToRupiah(
                      prItems.reduce(
                        (sum, item) =>
                          sum + (item.quantity * item.unit_price + item.tax),
                        0,
                      ),
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Shipping Cost:</span>
                  <span className="font-medium">
                    {formatToRupiah(calculateTotalShipping())}
                  </span>
                </div>
                <div className="border-t border-blue-300 pt-2 flex justify-between items-center">
                  <span className="font-semibold text-slate-700">
                    Total Amount:
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatToRupiah(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading || uploading || prItems.length === 0}
                className="flex-1"
              >
                {loading
                  ? "Submitting..."
                  : `Submit Purchase Request (${prItems.length} items)`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Add New Supplier Dialog */}
      <Dialog
        open={isSupplierDialogOpen}
        onOpenChange={setIsSupplierDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Supplier Baru</DialogTitle>
            <DialogDescription>Isi detail supplier baru</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddNewSupplier} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informasi Dasar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_supplier_name">Nama Supplier *</Label>
                  <Input
                    id="new_supplier_name"
                    value={newSupplierData.supplier_name}
                    onChange={(e) =>
                      setNewSupplierData({
                        ...newSupplierData,
                        supplier_name: e.target.value,
                      })
                    }
                    placeholder="PT. Supplier Indonesia"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold">Informasi Kontak</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_contact_person">Contact Person *</Label>
                  <Input
                    id="new_contact_person"
                    value={newSupplierData.contact_person}
                    onChange={(e) =>
                      setNewSupplierData({
                        ...newSupplierData,
                        contact_person: e.target.value,
                      })
                    }
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_phone_number">Phone *</Label>
                  <Input
                    id="new_phone_number"
                    value={newSupplierData.phone_number}
                    onChange={(e) =>
                      setNewSupplierData({
                        ...newSupplierData,
                        phone_number: e.target.value,
                      })
                    }
                    placeholder="+62 812 3456 7890"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_email">Email *</Label>
                  <Input
                    id="new_email"
                    type="email"
                    value={newSupplierData.email}
                    onChange={(e) =>
                      setNewSupplierData({
                        ...newSupplierData,
                        email: e.target.value,
                      })
                    }
                    placeholder="supplier@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_city">City</Label>
                  <Input
                    id="new_city"
                    value={newSupplierData.city}
                    onChange={(e) =>
                      setNewSupplierData({
                        ...newSupplierData,
                        city: e.target.value,
                      })
                    }
                    placeholder="Jakarta"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_country">Country</Label>
                  <Input
                    id="new_country"
                    value={newSupplierData.country}
                    onChange={(e) =>
                      setNewSupplierData({
                        ...newSupplierData,
                        country: e.target.value,
                      })
                    }
                    placeholder="Indonesia"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_address">Address</Label>
                <Textarea
                  id="new_address"
                  value={newSupplierData.address}
                  onChange={(e) =>
                    setNewSupplierData({
                      ...newSupplierData,
                      address: e.target.value,
                    })
                  }
                  placeholder="Jl. Contoh No. 123"
                  rows={3}
                />
              </div>
            </div>

            {/* Tax Information */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold">Informasi Pajak</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_is_pkp">PKP</Label>
                  <Select
                    value={newSupplierData.is_pkp}
                    onValueChange={(value) =>
                      setNewSupplierData({ ...newSupplierData, is_pkp: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status PKP" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YES">Ya</SelectItem>
                      <SelectItem value="NO">Tidak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_tax_id">Tax ID / No. PKP</Label>
                  <Input
                    id="new_tax_id"
                    value={newSupplierData.tax_id}
                    onChange={(e) =>
                      setNewSupplierData({
                        ...newSupplierData,
                        tax_id: e.target.value,
                      })
                    }
                    placeholder="01.234.567.8-901.000"
                  />
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold">Informasi Bank</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_bank_name">Bank Name</Label>
                  <Input
                    id="new_bank_name"
                    value={newSupplierData.bank_name}
                    onChange={(e) =>
                      setNewSupplierData({
                        ...newSupplierData,
                        bank_name: e.target.value,
                      })
                    }
                    placeholder="Bank Mandiri"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_bank_account_holder">
                    Bank Account Holder
                  </Label>
                  <Input
                    id="new_bank_account_holder"
                    value={newSupplierData.bank_account_holder}
                    onChange={(e) =>
                      setNewSupplierData({
                        ...newSupplierData,
                        bank_account_holder: e.target.value,
                      })
                    }
                    placeholder="PT. Supplier Indonesia"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold">Informasi Tambahan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_payment_terms">Payment Terms</Label>
                  <Input
                    id="new_payment_terms"
                    value={newSupplierData.payment_terms}
                    onChange={(e) =>
                      setNewSupplierData({
                        ...newSupplierData,
                        payment_terms: e.target.value,
                      })
                    }
                    placeholder="Net 30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_category">Category</Label>
                  <Select
                    value={newSupplierData.category}
                    onValueChange={(value) =>
                      setNewSupplierData({
                        ...newSupplierData,
                        category: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Raw Materials">Bahan Baku</SelectItem>
                      <SelectItem value="Work in Process">
                        Barang Dalam Proses
                      </SelectItem>
                      <SelectItem value="Finished Goods">
                        Barang Jadi
                      </SelectItem>
                      <SelectItem value="Resale/Merchandise">
                        Barang Dagangan
                      </SelectItem>
                      <SelectItem value="Spare Parts">Suku Cadang</SelectItem>
                      <SelectItem value="Food">Makanan</SelectItem>
                      <SelectItem value="Beverage">Minuman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_currency">Currency *</Label>
                  <Select
                    value={newSupplierData.currency}
                    onValueChange={(value) =>
                      setNewSupplierData({
                        ...newSupplierData,
                        currency: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDR">IDR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="SGD">SGD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_status">Status *</Label>
                  <Select
                    value={newSupplierData.status}
                    onValueChange={(value) =>
                      setNewSupplierData({ ...newSupplierData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Menyimpan..." : "Simpan Supplier"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSupplierDialogOpen(false)}
                className="flex-1"
              >
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Stock Item Modal */}
      <AddStockItemModal
        open={openStockItemModal}
        onClose={() => setOpenStockItemModal(false)}
        onAdded={() => {
          fetchStockItems();
          fetchBrands();
          toast({
            title: "✅ Berhasil",
            description: "Item dan stock berhasil ditambahkan!",
          });
        }}
      />
    </div>
  );
}
