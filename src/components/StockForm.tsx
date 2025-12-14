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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Package,
  ArrowLeft,
  Search,
  Filter,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canEdit, canDelete, canView } from "@/utils/roleAccess";
import { canClick } from "@/utils/roleAccess";
import OCRScanButton from "./OCRScanButton";
import BarcodeScanButton from "./BarcodeScanButton";
import { useWarehouseScan } from "@/hooks/useWarehouseScan";

interface StockItem {
  id: string;
  item_name: string;
  service_category: string;
  service_type: string;
  description: string;
  coa_account_code: string;
  coa_account_name: string;
  item_arrival_date: string;
  unit: string;
  sku: string;
  weight: string;
  volume: string;
  supplier_id: string;
  supplier_name: string;
  warehouses: string;
  zones: string;
  racks: string;
  lots: string;
  wms_reference_number: string;
  ceisa_document_number: string;
  ceisa_document_type: string;
  ceisa_document_date: string;
  ceisa_status: string;
  wms_notes: string;
  ceisa_notes: string;
  item_quantity: number;
  ppn_status: string;
  purchase_price: number;
  selling_price: number;
  ppn_on_purchase: number;
  ppn_on_sale: number;
  purchase_price_after_ppn: number;
  selling_price_after_ppn: number;
  airwaybills: string;
  hs_code: string;
  hs_category: string;
  hs_sub_category: string;
  hs_description: string;
  cost_per_unit?: number;
  qty_available?: number;
  created_at?: string;
}

interface CategoryMapping {
  service_category: string;
  service_type: string;
  description: string;
}

interface COAAccount {
  account_code: string;
  account_name: string;
  account_type?: string;
}

interface ItemMaster {
  id: string;
  item_name: string;
  jenis_barang: string;
  brand: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface Zone {
  id: string;
  name: string;
  code: string;
}

interface Rack {
  id: string;
  name: string;
  code: string;
}

interface Lot {
  id: string;
  lot_number: string;
}

interface Supplier {
  id: string;
  supplier_name: string;
  phone_number?: string;
  email?: string;
  address?: string;
}

interface HSCode {
  id: string;
  hs_code: string;
  description: string;
  category: string;
  sub_category: string;
}

const CEISA_DOCUMENT_TYPES = [
  "BC 2.0 – Pemberitahuan Impor Barang",
  "BC 2.3 �� Pemberitahuan Impor Barang untuk ditimbun di Tempat Penimbunan Berikat",
  "BC 2.5 – Pemberitahuan Impor Barang dari Tempat Penimbunan Berikat",
  "BC 2.7 – Pemberitahuan Pengeluaran untuk diangkut dari Tempat Penimbunan Berikat ke Tempat Penimbunan Berikat lainnya",
  "BC 2.8 – Pemberitahuan Impor Barang dari Pusat Logistik Berikat",
  "BC 3.0 – Pemberitahuan Ekspor Barang",
  "BC 3.3 – Pemberitahuan Ekspor Barang melalui/dari Pusat Logistik Berikat",
  "BC 4.0 – Pemberitahuan Pemasukan Barang asal Tempat Lain dalam Daerah Pabean ke Tempat Penimbunan Berikat",
];

const CEISA_STATUS_OPTIONS = ["Approved", "Rejected", "Completed"];

export default function StockForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [coaAccounts, setCOAAccounts] = useState<COAAccount[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [itemNameList, setItemNameList] = useState<ItemMaster[]>([]);
  const [brandList, setBrandList] = useState<string[]>([]);
  const [hsCategories, setHsCategories] = useState<string[]>([]);
  const [hsSubCategories, setHsSubCategories] = useState<HSCode[]>([]);
  const [hsDescriptions, setHsDescriptions] = useState<HSCode[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(
    null,
  );
  const [openCategoryCombobox, setOpenCategoryCombobox] = useState(false);
  const [openServiceTypeCombobox, setOpenServiceTypeCombobox] = useState(false);
  const [openDescriptionCombobox, setOpenDescriptionCombobox] = useState(false);
  const [openCOACombobox, setOpenCOACombobox] = useState(false);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const { userRole } = useAuth();
  const { user } = useAuth();

  const [itemType, setItemType] = useState<"barang" | "jasa">("barang");
  const [formData, setFormData] = useState({
    item_name: "",
    brand: "",
    isManualItem: false,
    manualItemName: "",
    isManualBrand: false,
    manualBrand: "",
    service_category: "",
    service_type: "",
    description: "",
    coa_account_code: "",
    coa_account_name: "",
    item_arrival_date: "",
    unit: "",
    sku: "",
    weight: "",
    volume: "",
    supplier_id: "",
    supplier_name: "",
    warehouses: "",
    warehouse_name: "",
    zones: "",
    racks: "",
    lots: "",
    wms_reference_number: "",
    ceisa_document_number: "",
    ceisa_document_type: "",
    ceisa_document_date: "",
    ceisa_status: "",
    wms_notes: "",
    ceisa_notes: "",
    item_quantity: 0,
    ppn_status: "No",
    purchase_price: 0,
    selling_price: 0,
    ppn_on_purchase: 0,
    ppn_on_sale: 0,
    purchase_price_after_ppn: 0,
    selling_price_after_ppn: 0,
    airwaybills: "",
    hs_code: "",
    hs_category: "",
    hs_sub_category: "",
    hs_description: "",
    batch_number: "",
    expired_date: "",
  });

  // Separate state for display-only supplier info
  const [supplierInfo, setSupplierInfo] = useState({
    phone_number: "",
    email: "",
    address: "",
  });

  // Warehouse scan hook for autofill (GRN - Goods Receipt Note)
  const { processBarcodeScan, processOCRScan, isProcessing: isScanProcessing } = useWarehouseScan({
    formType: "grn",
    onAutofill: (data) => {
      setFormData((prev) => ({
        ...prev,
        sku: data.sku || prev.sku,
        item_name: data.item_name || prev.item_name,
        item_quantity: data.quantity || prev.item_quantity,
        unit: data.unit || prev.unit,
        racks: data.location || prev.racks,
        batch_number: data.batch_number || prev.batch_number || "",
        expired_date: data.expired_date || prev.expired_date || "",
      }));
      if (data.is_new_item) {
        toast({
          title: "Item Baru",
          description: `SKU ${data.sku} telah dibuat otomatis`,
        });
      }
    },
  });

  useEffect(() => {
    fetchStockItems();
    fetchCategories();
    fetchWarehouses();
    fetchZones();
    fetchRacks();
    fetchLots();
    fetchSuppliers();
    fetchHSCategories();
    fetchItemNames();
    fetchBrands();
  }, []);

  // Re-fetch categories when item type changes
  useEffect(() => {
    fetchCategories();
    // Reset category-related fields when item type changes
    setFormData({
      ...formData,
      service_category: "",
      service_type: "",
      description: "",
    });
  }, [itemType]);

  useEffect(() => {
    if (formData.service_category) {
      fetchServiceTypes(formData.service_category);
    }
  }, [formData.service_category]);

  useEffect(() => {
    if (formData.coa_account_code) {
      const account = coaAccounts.find(
        (acc) => acc.account_code === formData.coa_account_code,
      );
      if (account) {
        setFormData((prev) => ({
          ...prev,
          coa_account_name: account.account_name,
        }));
      }
    }
  }, [formData.coa_account_code, coaAccounts]);

  useEffect(() => {
    if (formData.ppn_status === "Yes") {
      calculatePPNPrices();
    }
  }, [
    formData.purchase_price,
    formData.selling_price,
    formData.ppn_on_purchase,
    formData.ppn_on_sale,
    formData.ppn_status,
  ]);

  useEffect(() => {
    if (formData.hs_category) {
      fetchHSSubCategories(formData.hs_category);
    }
  }, [formData.hs_category]);

  useEffect(() => {
    if (formData.hs_category && formData.hs_sub_category) {
      fetchHSDescriptions(formData.hs_category, formData.hs_sub_category);
    }
  }, [formData.hs_category, formData.hs_sub_category]);

  const calculatePPNPrices = () => {
    const purchaseAfterPPN =
      formData.purchase_price * (1 + formData.ppn_on_purchase / 100);
    const sellingAfterPPN =
      formData.selling_price * (1 + formData.ppn_on_sale / 100);

    setFormData((prev) => ({
      ...prev,
      purchase_price_after_ppn: purchaseAfterPPN,
      selling_price_after_ppn: sellingAfterPPN,
    }));
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const DetailDialog = ({ item }: { item: StockItem }) => {
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
              Detail Stock: {item.item_name}
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
                  <p className="font-medium">{item.item_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">SKU</p>
                  <p className="font-medium font-mono text-indigo-600">
                    {item.sku || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">
                    Kategori Layanan/Produk
                  </p>
                  <p className="font-medium">{item.service_category || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Jenis Layanan/Produk</p>
                  <p className="font-medium">{item.service_type || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Deskripsi</p>
                  <p className="font-medium">{item.description || "-"}</p>
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
                  <p className="text-sm text-slate-500">Satuan</p>
                  <p className="font-medium">{item.unit || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Jumlah</p>
                  <p className="font-medium">{item.item_quantity || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Berat</p>
                  <p className="font-medium">
                    {item.weight ? `${item.weight} kg` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Volume</p>
                  <p className="font-medium">
                    {item.volume ? `${item.volume} m³` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Nama Supplier</p>
                  <p className="font-medium">{item.supplier_name || "-"}</p>
                </div>
              </div>
            </div>

            {/* COA Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                Informasi COA
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Kode Akun COA</p>
                  <p className="font-medium">{item.coa_account_code || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Nama Akun COA</p>
                  <p className="font-medium">{item.coa_account_name || "-"}</p>
                </div>
              </div>
            </div>

            {/* AWB & HS Code Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                Informasi AWB & HS Code
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">AWB (Air Waybill)</p>
                  <p className="font-medium">{item.airwaybills || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">HS Code</p>
                  <p className="font-medium font-mono text-indigo-600">
                    {item.hs_code || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">HS Category</p>
                  <p className="font-medium">{item.hs_category || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">HS Sub Category</p>
                  <p className="font-medium">{item.hs_sub_category || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">HS Description</p>
                  <p className="font-medium">{item.hs_description || "-"}</p>
                </div>
              </div>
            </div>

            {/* Warehouse Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                Informasi Gudang
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Gudang</p>
                  <p className="font-medium">{item.warehouses || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Zona</p>
                  <p className="font-medium">{item.zones || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Rak</p>
                  <p className="font-medium">{item.racks || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Lot</p>
                  <p className="font-medium">{item.lots || "-"}</p>
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
                  <p className="text-sm text-slate-500">
                    Nomor Referensi CEISA
                  </p>
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

            {/* Pricing Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                Informasi Harga
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Status PPN</p>
                  <p className="font-medium">{item.ppn_status || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Harga Beli</p>
                  <p className="font-medium text-green-600">
                    {formatRupiah(item.purchase_price || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Harga Jual</p>
                  <p className="font-medium text-blue-600">
                    {formatRupiah(item.selling_price || 0)}
                  </p>
                </div>
                {item.ppn_status === "Yes" && (
                  <>
                    <div>
                      <p className="text-sm text-slate-500">PPN Beli (%)</p>
                      <p className="font-medium">
                        {item.ppn_on_purchase || 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">PPN Jual (%)</p>
                      <p className="font-medium">{item.ppn_on_sale || 0}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">
                        Harga Beli Setelah PPN
                      </p>
                      <p className="font-medium text-green-600">
                        {formatRupiah(item.purchase_price_after_ppn || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">
                        Harga Jual Setelah PPN
                      </p>
                      <p className="font-medium text-blue-600">
                        {formatRupiah(item.selling_price_after_ppn || 0)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const fetchStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from("stock")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems((data || []) as any);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("stock")
        .select("jenis_barang")
        .not("jenis_barang", "is", null)
        .order("jenis_barang");

      if (error) throw error;

      // Get unique values from jenis_barang
      const uniqueCategories = [
        ...new Set(
          data?.map((item) => item.jenis_barang).filter(Boolean) || [],
        ),
      ];

      setCategories(uniqueCategories);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchServiceTypes = async (category: string) => {
    try {
      const { data, error } = await supabase
        .from("stock")
        .select("service_type")
        .eq("service_category", category)
        .not("service_type", "is", null)
        .order("service_type");

      if (error) throw error;

      // Get unique values from service_type
      const uniqueTypes = [
        ...new Set(
          data?.map((item) => item.service_type).filter(Boolean) || [],
        ),
      ];
      setServiceTypes(uniqueTypes);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Fetch categories filtered by item name from stock table (jenis_barang column)
  const fetchCategoriesByItemName = async (itemName: string) => {
    try {
      const { data, error } = await supabase
        .from("stock")
        .select("jenis_barang")
        .eq("item_name", itemName)
        .not("jenis_barang", "is", null)
        .order("jenis_barang");

      if (error) throw error;

      const uniqueCategories = [
        ...new Set(data?.map((b) => b.jenis_barang).filter(Boolean) || []),
      ];

      setCategories(uniqueCategories);

      if (uniqueCategories.length > 0) {
        toast({
          title: "Jenis Barang Loaded",
          description: `Showing ${uniqueCategories.length} jenis barang for ${itemName}`,
        });
      } else {
        toast({
          title: "No Jenis Barang Found",
          description: `No jenis barang available for ${itemName}.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setCategories([]);
    }
  };

  // Fetch brands filtered by item name and jenis_barang from stock table
  const fetchBrandsByItemAndCategory = async (
    itemName: string,
    category: string,
  ) => {
    try {
      const { data, error } = await supabase
        .from("stock")
        .select("brand")
        .eq("item_name", itemName)
        .eq("jenis_barang", category)
        .not("brand", "is", null)
        .order("brand");

      if (error) throw error;

      const uniqueBrands = [
        ...new Set(data?.map((b) => b.brand).filter(Boolean) || []),
      ];

      setBrandList(uniqueBrands);

      if (uniqueBrands.length > 0) {
        toast({
          title: "Brand Filter Applied",
          description: `Showing ${uniqueBrands.length} brands for ${itemName} - ${category}`,
        });
      } else {
        toast({
          title: "No Brands Found",
          description: `No brands available for ${itemName} - ${category}.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setBrandList([]);
    }
  };

  const fetchDescriptions = async (serviceType: string) => {
    // Description is no longer fetched from COA, it's auto-populated from brands
    // This function is kept for compatibility but does nothing
  };

  const fetchCOAAccounts = async (description: string) => {
    // COA accounts are now auto-populated from brands
    // This function is kept for compatibility but does nothing
  };

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from("warehouses")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchZones = async () => {
    try {
      const { data, error } = await supabase
        .from("zones")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setZones(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchRacks = async () => {
    try {
      const { data, error } = await supabase
        .from("racks")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setRacks(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchLots = async () => {
    try {
      const { data, error } = await supabase
        .from("lots")
        .select("id, lot_number")
        .eq("is_active", true)
        .order("lot_number");

      if (error) throw error;
      setLots(data || []);
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
        .select("id, supplier_name, phone_number, email, address")
        .eq("is_active", true)
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

  const fetchHSCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("hs_codes")
        .select("category")
        .eq("is_active", true)
        .order("category");

      if (error) throw error;

      const uniqueCategories = [
        ...new Set(data?.map((item) => item.category).filter(Boolean) || []),
      ];
      setHsCategories(uniqueCategories);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchItemNames = async () => {
    try {
      // Fetch distinct item names from stock table
      const { data, error } = await supabase
        .from("stock")
        .select("item_name")
        .not("item_name", "is", null)
        .order("item_name");

      if (error) throw error;

      // Create unique list of item names
      const uniqueItems = Array.from(
        new Set(data?.map((item) => item.item_name) || []),
      ).map((name, index) => ({
        id: index.toString(),
        item_name: name,
      }));

      setItemNameList(uniqueItems);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchBrands = async () => {
    try {
      // Fetch distinct brands from stock table
      const { data, error } = await supabase
        .from("stock")
        .select("brand")
        .not("brand", "is", null)
        .order("brand");

      if (error) throw error;

      const uniqueBrands = [...new Set(data?.map((b) => b.brand) || [])];
      setBrandList(uniqueBrands);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Fetch brands filtered by item name from stock table
  const fetchBrandsByItemName = async (itemName: string) => {
    try {
      const { data, error } = await supabase
        .from("stock")
        .select("brand")
        .eq("item_name", itemName)
        .not("brand", "is", null)
        .order("brand");

      if (error) throw error;

      const uniqueBrands = [
        ...new Set(data?.map((b) => b.brand).filter(Boolean) || []),
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
          description: `No brands available for ${itemName}. Please use manual input.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setBrandList([]);
    }
  };

  // Auto-populate fields based on stock data
  const autoPopulateFields = async (itemName: string, brand: string) => {
    try {
      console.log("🔍 Auto-populate called with:", { itemName, brand });

      // Fetch stock data with matching item_name and brand
      const { data, error } = await supabase
        .from("stock")
        .select("*")
        .eq("item_name", itemName)
        .eq("brand", brand)
        .limit(1)
        .maybeSingle();

      console.log("📊 FULL Stock data result:", { data, error });

      if (error) {
        console.error("❌ Error fetching stock data:", error);
        throw error;
      }

      if (data) {
        console.log("✅ Found stock data:", data);
        console.log("📝 Field values:", {
          unit: data.unit,
          weight: data.weight,
          volume: data.volume,
          service_category: data.service_category,
          service_type: data.service_type,
          coa_account_code: data.coa_account_code,
          coa_account_name: data.coa_account_name,
        });

        // Force update with explicit values from stock
        const newFormData = {
          ...formData,
          service_category: data.service_category || "",
          service_type: data.service_type || "",
          unit: data.unit || "",
          weight: data.weight ? data.weight.toString() : "",
          volume: data.volume ? data.volume.toString() : "",
          coa_account_code: data.coa_account_code || "",
          coa_account_name: data.coa_account_name || "",
          description: data.description || "",
          sku: data.sku || "",
        };

        console.log("🔄 Setting new form data:", newFormData);
        setFormData(newFormData);

        // Close comboboxes after state update
        setTimeout(() => {
          setOpenCategoryCombobox(false);
          setOpenServiceTypeCombobox(false);
        }, 100);

        toast({
          title: "✅ Auto-populated",
          description: `${data.service_category || "-"} - ${data.service_type || "-"} | Satuan: ${data.unit || "-"}`,
        });
      } else {
        console.warn("⚠️ No data returned from query");
      }
    } catch (error: any) {
      console.log("⚠️ No stock data found:", error.message);
      toast({
        title: "Info",
        description: "Tidak ada data stock. Silakan isi manual.",
        variant: "default",
      });
    }
  };

  const fetchHSSubCategories = async (category: string) => {
    try {
      const { data, error } = await supabase
        .from("hs_codes")
        .select("id, hs_code, sub_category, description")
        .eq("category", category)
        .eq("is_active", true)
        .order("sub_category");

      if (error) throw error;
      setHsSubCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchHSDescriptions = async (category: string, subCategory: string) => {
    try {
      const { data, error } = await supabase
        .from("hs_codes")
        .select("id, hs_code, description")
        .eq("category", category)
        .eq("sub_category", subCategory)
        .eq("is_active", true)
        .order("hs_code");

      if (error) throw error;
      setHsDescriptions(data || []);

      // Auto-fill hs_description if only one result
      if (data && data.length === 1) {
        setFormData((prev) => ({
          ...prev,
          hs_description: data[0].description,
          hs_code: data[0].hs_code,
        }));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determine target table based on item type
      const targetTable = itemType === "jasa" ? "service_items" : "stock";

      // Prepare data with proper date handling and user ID
      const dataToSubmit = {
        ...formData,
        item_arrival_date: formData.item_arrival_date || null,
        ceisa_document_date: formData.ceisa_document_date || null,
        created_by: user?.id || null,
      };

      // 🔥 Wajib: ubah "" menjadi null
      Object.keys(dataToSubmit).forEach((key) => {
        if (dataToSubmit[key] === "") {
          dataToSubmit[key] = null;
        }
      });

      // Buang field yang tidak boleh dikirim ketika itemType = 'jasa'
      if (itemType === "jasa") {
        delete dataToSubmit.sku;
        delete dataToSubmit.weight;
        delete dataToSubmit.volume;
        delete dataToSubmit.supplier_id;
        delete dataToSubmit.supplier_name;
        delete dataToSubmit.warehouses;
        delete dataToSubmit.warehouse_name;
        delete dataToSubmit.zones;
        delete dataToSubmit.racks;
        delete dataToSubmit.lots;
        delete dataToSubmit.item_quantity;

        // AWB & HS Code
        delete dataToSubmit.airwaybills;
        delete dataToSubmit.hs_code;
        delete dataToSubmit.hs_category;
        delete dataToSubmit.hs_sub_category;
        delete dataToSubmit.hs_description;

        // WMS & CEISA fields
        delete dataToSubmit.wms_reference_number;
        delete dataToSubmit.wms_notes;
        delete dataToSubmit.ceisa_document_number;
        delete dataToSubmit.ceisa_document_type;
        delete dataToSubmit.ceisa_document_date;
        delete dataToSubmit.ceisa_status;
        delete dataToSubmit.ceisa_notes;

        // Harga Beli tidak digunakan untuk jasa
        delete dataToSubmit.purchase_price;
        delete dataToSubmit.purchase_price_after_ppn;
        delete dataToSubmit.ppn_on_purchase;
      }

      // ✅ PASTIKAN COA SUDAH ADA DI chart_of_accounts SEBELUM INSERT KE STOCK
      if (dataToSubmit.coa_account_code) {
        // Cek apakah COA code sudah ada di database
        const { data: exists } = await supabase
          .from("chart_of_accounts")
          .select("account_code")
          .eq("account_code", dataToSubmit.coa_account_code)
          .maybeSingle();

        // Jika TIDAK ADA ➜ buat COA baru
        if (!exists) {
          // Validasi: pastikan kategori, jenis, dan deskripsi ada
          if (
            !dataToSubmit.service_category ||
            !dataToSubmit.service_type ||
            !dataToSubmit.description
          ) {
            toast({
              title: "⚠️ Data Tidak Lengkap",
              description:
                "Kategori Layanan, Jenis Layanan, dan Deskripsi harus diisi untuk membuat COA baru",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          // Validasi: pastikan nama akun COA ada
          if (!dataToSubmit.coa_account_name) {
            toast({
              title: "⚠️ Nama Akun COA Kosong",
              description: "Silakan isi Nama Akun COA untuk kode akun baru ini",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          // Buat COA baru di chart_of_accounts
          const payload = {
            account_code: dataToSubmit.coa_account_code,
            account_name: dataToSubmit.coa_account_name,
            kategori_layanan: dataToSubmit.service_category,
            jenis_layanan: dataToSubmit.service_type,
            description: dataToSubmit.description,
            account_type: "Revenue", // Default untuk jasa
            parent_code: null,
            is_active: true,
            created_by: user?.id || null,
          };

          const { error: insertErr } = await supabase
            .from("chart_of_accounts")
            .insert([payload]);

          if (insertErr) {
            toast({
              title: "❌ Gagal Membuat COA",
              description: `Error: ${insertErr.message}`,
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          toast({
            title: "✅ COA Baru Dibuat",
            description: `Kode akun ${dataToSubmit.coa_account_code} - ${dataToSubmit.coa_account_name} berhasil dibuat`,
          });
        }
        // Jika ADA ➜ lanjut insert stock (tidak perlu else, langsung lanjut)
      }

      if (editingId) {
        const { error } = await supabase
          .from(targetTable)
          .update(dataToSubmit)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "✅ Berhasil",
          description: `Data ${itemType === "jasa" ? "jasa" : "stock"} berhasil diupdate`,
        });
      } else {
        const { error } = await supabase
          .from(targetTable)
          .insert([dataToSubmit]);

        if (error) throw error;

        toast({
          title: "✅ Berhasil",
          description: `Data ${itemType === "jasa" ? "jasa" : "stock"} berhasil ditambahkan`,
        });
      }

      resetForm();
      fetchStockItems();
      setShowForm(false);
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

  const handleEdit = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("stock")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Find warehouse from warehouse name
      const warehouse = warehouses.find((wh) => wh.name === data.warehouses);
      if (warehouse) {
        setSelectedWarehouseId(warehouse.id);
      }

      // Set warehouse_name for display
      setFormData({
        ...data,
        warehouse_name: data.warehouses || "",
      });
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
      const { error } = await supabase.from("stock").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "✅ Berhasil",
        description: "Data stock berhasil dihapus",
      });

      fetchStockItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSupplierChange = (supplierName: string) => {
    const selectedSupplier = suppliers.find(
      (supplier) => supplier.supplier_name === supplierName,
    );

    if (selectedSupplier) {
      setFormData({
        ...formData,
        supplier_name: supplierName,
        supplier_id: selectedSupplier.id,
      });
      // Set display-only info in separate state
      setSupplierInfo({
        phone_number: selectedSupplier.phone_number || "",
        email: selectedSupplier.email || "",
        address: selectedSupplier.address || "",
      });
    } else {
      setFormData({
        ...formData,
        supplier_name: supplierName,
        supplier_id: "",
      });
      setSupplierInfo({
        phone_number: "",
        email: "",
        address: "",
      });
    }
  };

  // Check if selected warehouse is "Gudang Penjualan" (code: 222)
  const isGudangPenjualan = () => {
    const selectedWarehouse = warehouses.find(
      (wh) => wh.name === formData.warehouses,
    );
    // Check by code instead of ID
    const isGP = selectedWarehouse?.code === "222";
    console.log("Checking Gudang Penjualan:", {
      warehouseName: formData.warehouses,
      warehouseCode: selectedWarehouse?.code,
      isGudangPenjualan: isGP,
    });
    return isGP;
  };

  const handleWarehouseSelection = (warehouseId: string) => {
    const warehouse = warehouses.find((wh) => wh.id === warehouseId);
    if (warehouse) {
      setSelectedWarehouseId(warehouseId);
      setFormData({
        ...formData,
        warehouses: warehouse.name, // Store warehouse name in warehouses column
        warehouse_name: warehouse.name, // Store name for display
        warehouse_id: warehouseId, // Store warehouse_id for foreign key
      });
      setShowWarehouseModal(false);
      setShowForm(true);
    }
  };

  const handleAddNewStock = () => {
    if (showForm) {
      // If form is already open, close it
      resetForm();
      setShowForm(false);
    } else {
      // If form is closed, open warehouse modal
      resetForm();
      setShowWarehouseModal(true);
    }
  };

  const handleCOARecommendation = async () => {
    if (
      !formData.item_name ||
      !formData.service_category ||
      !formData.service_type ||
      !formData.description
    ) {
      toast({
        title: "⚠️ Data Tidak Lengkap",
        description:
          "Mohon isi Nama Barang, Kategori, Jenis Produk, dan Deskripsi terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setLoadingRecommendation(true);

    try {
      // Fetch all COA accounts
      const { data: allCOA, error } = await supabase
        .from("chart_of_accounts")
        .select(
          "account_code, account_name, kategori_layanan, jenis_layanan, description",
        )
        .eq("is_active", true);

      if (error) throw error;

      if (!allCOA || allCOA.length === 0) {
        toast({
          title: "❌ Tidak Ditemukan",
          description: "Tidak ditemukan rekomendasi COA",
        });
        return;
      }

      // Calculate scores for each COA
      const scoredCOA = allCOA.map((coa) => {
        let score = 0;

        // Category match: +3
        if (
          coa.kategori_layanan?.toLowerCase() ===
          formData.service_category.toLowerCase()
        ) {
          score += 3;
        }

        // Service type match: +2
        if (
          coa.jenis_layanan?.toLowerCase() ===
          formData.service_type.toLowerCase()
        ) {
          score += 2;
        }

        // Description similarity: +1 for each matching word
        if (coa.description && formData.description) {
          const coaWords = coa.description.toLowerCase().split(/\s+/);
          const formWords = formData.description.toLowerCase().split(/\s+/);

          const matchingWords = coaWords.filter((word) =>
            formWords.some(
              (formWord) => formWord.includes(word) || word.includes(formWord),
            ),
          );

          if (matchingWords.length > 0) {
            score += 1;
          }
        }

        return { ...coa, score };
      });

      // Sort by score (highest first)
      const sortedCOA = scoredCOA.sort((a, b) => b.score - a.score);

      // Get the best match
      const bestMatch = sortedCOA[0];

      if (bestMatch.score === 0) {
        toast({
          title: "❌ Tidak Ditemukan",
          description: "Tidak ditemukan rekomendasi COA yang cocok",
        });
        return;
      }

      // Auto-fill COA fields
      setFormData({
        ...formData,
        coa_account_code: bestMatch.account_code,
        coa_account_name: bestMatch.account_name,
      });

      toast({
        title: "✅ Rekomendasi COA Ditemukan",
        description: `${bestMatch.account_code} - ${bestMatch.account_name} (Skor: ${bestMatch.score})`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const resetForm = () => {
    setItemType("barang");
    setFormData({
      item_name: "",
      service_category: "",
      service_type: "",
      description: "",
      coa_account_code: "",
      coa_account_name: "",
      item_arrival_date: "",
      unit: "",
      sku: "",
      weight: "",
      volume: "",
      supplier_id: "",
      supplier_name: "",
      warehouses: "",
      warehouse_name: "",
      zones: "",
      racks: "",
      lots: "",
      wms_reference_number: "",
      ceisa_document_number: "",
      ceisa_document_type: "",
      ceisa_document_date: "",
      ceisa_status: "",
      wms_notes: "",
      ceisa_notes: "",
      item_quantity: 0,
      ppn_status: "No",
      purchase_price: 0,
      selling_price: 0,
      ppn_on_purchase: 0,
      ppn_on_sale: 0,
      purchase_price_after_ppn: 0,
      selling_price_after_ppn: 0,
      airwaybills: "",
      hs_code: "",
      hs_category: "",
      hs_sub_category: "",
      hs_description: "",
    });
    setSupplierInfo({
      phone_number: "",
      email: "",
      address: "",
    });
    setEditingId(null);
    setSelectedWarehouseId(null);
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  const filteredItems = items.filter(
    (item) =>
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.warehouses &&
        item.warehouses.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header with gradient */}
      <div className="border-b bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 shadow-lg">
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
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Stock Management
                </h1>
                <p className="text-sm text-blue-100">
                  Kelola data stock barang Anda
                </p>
              </div>
            </div>
          </div>
          {canClick(userRole) && (
            <Button
              onClick={handleAddNewStock}
              className="bg-white text-indigo-600 hover:bg-blue-50 shadow-md"
            >
              <Plus className="mr-2 h-4 w-4" />
              {showForm ? "Tutup Form" : "Tambah Stock"}
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Warehouse Selection Modal */}
        <Dialog open={showWarehouseModal} onOpenChange={setShowWarehouseModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-indigo-600">
                Pilih Gudang
              </DialogTitle>
              <p className="text-sm text-slate-600 mt-2">
                Pilih gudang terlebih dahulu untuk melanjutkan input stock
              </p>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {warehouses.map((warehouse) => (
                <Button
                  key={warehouse.id}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-4 hover:bg-indigo-50 hover:border-indigo-300"
                  onClick={() => handleWarehouseSelection(warehouse.id)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-slate-900">
                      {warehouse.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      Kode: {warehouse.code}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Form Input */}
        {showForm && (
          <Card className="mb-6 bg-white shadow-lg rounded-xl border border-slate-200">
            <CardHeader className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {editingId ? "✏️ Edit Stock" : "+ Tambah Stock"}
                  </CardTitle>
                  <CardDescription>
                    {editingId
                      ? "Perbarui informasi stock"
                      : "Tambahkan stock baru ke sistem"}
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
                {/* Item Type Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                    Tipe Item
                  </h3>
                  <div>
                    <Label>Pilih Tipe Item *</Label>
                    <Select
                      value={itemType}
                      onValueChange={(value: "barang" | "jasa") => {
                        setItemType(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="barang">Barang</SelectItem>
                        <SelectItem value="jasa">Jasa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                    Informasi Dasar
                  </h3>
                  {/* Row 1: Item Name */}
                  <div>
                    <Label>
                      Nama {itemType === "barang" ? "Barang" : "Jasa"} *
                    </Label>
                    {formData.isManualItem ? (
                      <div className="flex gap-2">
                        <Input
                          value={formData.manualItemName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              manualItemName: e.target.value,
                            })
                          }
                          placeholder="Masukkan nama item"
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              isManualItem: false,
                              manualItemName: "",
                            });
                          }}
                        >
                          Batal
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={formData.item_name}
                        onValueChange={(value) => {
                          if (value === "manual") {
                            setFormData({
                              ...formData,
                              isManualItem: true,
                              item_name: "",
                            });
                          } else {
                            setFormData({
                              ...formData,
                              item_name: value,
                            });
                            // Fetch categories specific to this item
                            fetchCategoriesByItemName(value);
                          }
                        }}
                      >
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

                  {/* Row 2: Jenis Barang and Brand */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Jenis Barang *</Label>
                      <Select
                        value={formData.service_category}
                        onValueChange={(value) => {
                          setFormData({
                            ...formData,
                            service_category: value,
                          });
                          // Fetch brands specific to this item and category
                          if (formData.item_name) {
                            fetchBrandsByItemAndCategory(
                              formData.item_name,
                              value,
                            );
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis barang" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter((cat) => cat).map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Brand */}
                    <div>
                      <Label>Brand</Label>
                      {formData.isManualBrand ? (
                        <div className="flex gap-2">
                          <Input
                            value={formData.manualBrand}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                manualBrand: e.target.value,
                              })
                            }
                            placeholder="Masukkan nama brand"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                isManualBrand: false,
                                manualBrand: "",
                              });
                            }}
                          >
                            Batal
                          </Button>
                        </div>
                      ) : (
                        <Select
                          value={formData.brand}
                          onValueChange={(value) => {
                            console.log(
                              "🎯 Brand selected:",
                              value,
                              "Item name:",
                              formData.item_name,
                            );
                            if (value === "manual") {
                              setFormData({
                                ...formData,
                                isManualBrand: true,
                                brand: "",
                              });
                            } else {
                              setFormData({
                                ...formData,
                                brand: value,
                              });
                              // Auto-populate fields when item name, category and brand are selected
                              if (
                                formData.item_name &&
                                formData.service_category
                              ) {
                                console.log("🚀 Calling autoPopulateFields...");
                                autoPopulateFields(formData.item_name, value);
                              } else {
                                console.warn(
                                  "⚠️ Item name or category not selected yet",
                                );
                              }
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">
                              + Input Manual
                            </SelectItem>
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

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Jenis Layanan/Produk *</Label>
                      <Input
                        value={formData.service_type}
                        readOnly
                        className="bg-slate-50"
                        placeholder="Auto-filled dari brand"
                      />
                    </div>

                    <div>
                      <Label>Kode Akun COA *</Label>
                      <Input
                        value={formData.coa_account_code}
                        readOnly
                        className="bg-slate-50"
                        placeholder="Auto-filled dari brand"
                      />
                    </div>

                    <div>
                      <Label>Nama Akun COA</Label>
                      <Input
                        value={formData.coa_account_name}
                        readOnly
                        className="bg-slate-50"
                        placeholder="Auto-filled dari brand"
                      />
                    </div>

                    <div>
                      <Label>Tanggal Masuk Barang *</Label>
                      <Input
                        type="date"
                        value={formData.item_arrival_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            item_arrival_date: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    {/* Hide these fields for Jasa */}
                    {itemType === "barang" && (
                      <>
                        <div>
                          <Label>SKU *</Label>
                          <Input
                            value={formData.sku}
                            onChange={(e) =>
                              setFormData({ ...formData, sku: e.target.value })
                            }
                            required
                          />
                        </div>

                        <div>
                          <Label>Satuan *</Label>
                          <Input
                            value={formData.unit}
                            readOnly
                            className="bg-slate-50"
                            placeholder="Auto-filled dari brand"
                            required
                          />
                        </div>

                        <div>
                          <Label>Berat (kg)</Label>
                          <Input
                            value={formData.weight}
                            readOnly
                            className="bg-slate-50"
                            placeholder="Auto-filled dari brand"
                          />
                        </div>

                        <div>
                          <Label>Volume (m³)</Label>
                          <Input
                            value={formData.volume}
                            readOnly
                            className="bg-slate-50"
                            placeholder="Auto-filled dari brand"
                          />
                        </div>
                      </>
                    )}

                    {/* Removed duplicate Gudang, Zona, Rak, Lot, Jumlah fields - they are in Informasi Gudang section */}
                  </div>

                  {/* 6. Pricing Information - Hidden for Jasa */}
                  {itemType === "barang" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                        Informasi Harga
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Status PPN *</Label>
                          <Select
                            value={formData.ppn_status}
                            onValueChange={(value) =>
                              setFormData({ ...formData, ppn_status: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Harga Beli *</Label>
                          <Input
                            type="number"
                            value={formData.purchase_price}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                purchase_price: parseFloat(e.target.value),
                              })
                            }
                            required
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            {formatRupiah(formData.purchase_price)}
                          </p>
                        </div>

                        <div>
                          <Label>Harga Jual *</Label>
                          <Input
                            type="number"
                            value={formData.selling_price}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                selling_price: parseFloat(e.target.value),
                              })
                            }
                            required
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            {formatRupiah(formData.selling_price)}
                          </p>
                        </div>

                        {formData.ppn_status === "Yes" && (
                          <>
                            <div>
                              <Label>PPN Beli (%)</Label>
                              <Input
                                type="number"
                                value={formData.ppn_on_purchase}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    ppn_on_purchase: parseFloat(e.target.value),
                                  })
                                }
                              />
                            </div>

                            <div>
                              <Label>PPN Jual (%)</Label>
                              <Input
                                type="number"
                                value={formData.ppn_on_sale}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    ppn_on_sale: parseFloat(e.target.value),
                                  })
                                }
                              />
                            </div>

                            <div>
                              <Label>Harga Beli Setelah PPN</Label>
                              <Input
                                type="number"
                                value={formData.purchase_price_after_ppn}
                                disabled
                                className="bg-slate-50"
                              />
                              <p className="text-xs text-slate-500 mt-1">
                                {formatRupiah(
                                  formData.purchase_price_after_ppn,
                                )}
                              </p>
                            </div>

                            <div>
                              <Label>Harga Jual Setelah PPN</Label>
                              <Input
                                type="number"
                                value={formData.selling_price_after_ppn}
                                disabled
                                className="bg-slate-50"
                              />
                              <p className="text-xs text-slate-500 mt-1">
                                {formatRupiah(formData.selling_price_after_ppn)}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. Supplier Information - Hidden for Jasa */}
                  {itemType === "barang" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                        Informasi Supplier
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* COA Recommendation Button */}
                        <div className="flex justify-start mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCOARecommendation}
                            disabled={
                              loadingRecommendation ||
                              !formData.item_name ||
                              !formData.service_category ||
                              !formData.service_type ||
                              !formData.description
                            }
                            className="bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border-indigo-300"
                          >
                            {loadingRecommendation ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Mencari Rekomendasi...
                              </>
                            ) : (
                              <>
                                <Search className="mr-2 h-4 w-4" />
                                Rekomendasi COA
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Nama Supplier</Label>
                        <Select
                          value={formData.supplier_name}
                          onValueChange={handleSupplierChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem
                                key={supplier.id}
                                value={supplier.supplier_name}
                              >
                                {supplier.supplier_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.supplier_name && (
                        <>
                          <div>
                            <Label>Nomor Telepon</Label>
                            <Input
                              value={supplierInfo.phone_number}
                              disabled
                              className="bg-slate-50"
                            />
                          </div>

                          <div>
                            <Label>Email</Label>
                            <Input
                              value={supplierInfo.email}
                              disabled
                              className="bg-slate-50"
                            />
                          </div>

                          <div>
                            <Label>Alamat</Label>
                            <Input
                              value={supplierInfo.address}
                              disabled
                              className="bg-slate-50"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Warehouse Information - Hidden for Jasa */}
                {itemType === "barang" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                      Informasi Gudang
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Gudang *</Label>
                        {editingId ? (
                          <Select
                            value={formData.warehouses}
                            onValueChange={(value) => {
                              const warehouse = warehouses.find(
                                (wh) => wh.name === value,
                              );
                              if (warehouse) {
                                setFormData({
                                  ...formData,
                                  warehouses: warehouse.name,
                                  warehouse_name: warehouse.name,
                                });
                                setSelectedWarehouseId(warehouse.id);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih gudang" />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouses.map((warehouse) => (
                                <SelectItem
                                  key={warehouse.id}
                                  value={warehouse.name}
                                >
                                  {warehouse.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <>
                            <Input
                              value={formData.warehouse_name}
                              disabled
                              className="bg-slate-50 font-medium"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              Gudang dipilih saat membuat stock baru
                            </p>
                          </>
                        )}
                      </div>

                      <div>
                        <Label>Zona</Label>
                        <Input
                          value={formData.zones}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              zones: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label>Rak</Label>
                        <Input
                          value={formData.racks}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              racks: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label>Lot</Label>
                        <Input
                          value={formData.lots}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              lots: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label>Jumlah *</Label>
                        <Input
                          type="number"
                          value={formData.item_quantity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              item_quantity: parseFloat(e.target.value),
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. AWB & HS Code Information - Hidden for Gudang Penjualan and Jasa */}
                {itemType === "barang" && !isGudangPenjualan() && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                      Informasi AWB & HS Code
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>AWB (Air Waybill)</Label>
                        <Input
                          value={formData.airwaybills}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              airwaybills: e.target.value,
                            })
                          }
                          placeholder="Nomor AWB"
                        />
                      </div>

                      <div>
                        <Label>HS Category</Label>
                        <Select
                          value={formData.hs_category}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              hs_category: value,
                              hs_sub_category: "",
                              hs_description: "",
                              hs_code: "",
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori HS" />
                          </SelectTrigger>
                          <SelectContent>
                            {hsCategories.filter((cat) => cat).map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>HS Sub Category</Label>
                        <Select
                          value={formData.hs_sub_category}
                          onValueChange={(value) =>
                            setFormData({ ...formData, hs_sub_category: value })
                          }
                          disabled={!formData.hs_category}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih sub kategori HS" />
                          </SelectTrigger>
                          <SelectContent>
                            {hsSubCategories.map((sub) => (
                              <SelectItem
                                key={sub.id}
                                value={sub.sub_category || ""}
                              >
                                {sub.sub_category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>HS Description</Label>
                        <Select
                          value={formData.hs_description}
                          onValueChange={(value) => {
                            const selectedHS = hsDescriptions.find(
                              (hs) => hs.description === value,
                            );
                            setFormData({
                              ...formData,
                              hs_description: value,
                              hs_code: selectedHS?.hs_code || "",
                            });
                          }}
                          disabled={!formData.hs_sub_category}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih deskripsi HS" />
                          </SelectTrigger>
                          <SelectContent>
                            {hsDescriptions.map((desc) => (
                              <SelectItem
                                key={desc.id}
                                value={desc.description}
                              >
                                {desc.hs_code} - {desc.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>HS Code</Label>
                        <Input
                          value={formData.hs_code}
                          disabled
                          className="bg-slate-50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. WMS & CEISA Information - Hidden for Gudang Penjualan and Jasa */}
                {itemType === "barang" && !isGudangPenjualan() && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                      Informasi WMS & CEISA
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nomor Referensi WMS</Label>
                        <Input
                          value={formData.wms_reference_number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              wms_reference_number: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label>Nomor Referensi CEISA</Label>
                        <Input
                          value={formData.ceisa_document_number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ceisa_document_number: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label>Jenis Dokumen CEISA</Label>
                        <Select
                          value={formData.ceisa_document_type}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              ceisa_document_type: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis dokumen" />
                          </SelectTrigger>
                          <SelectContent>
                            {CEISA_DOCUMENT_TYPES.filter((type) => type).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Tanggal Dokumen CEISA</Label>
                        <Input
                          type="date"
                          value={formData.ceisa_document_date}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ceisa_document_date: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label>Status CEISA</Label>
                        <Select
                          value={formData.ceisa_status}
                          onValueChange={(value) =>
                            setFormData({ ...formData, ceisa_status: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                          <SelectContent>
                            {CEISA_STATUS_OPTIONS.filter((status) => status).map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Catatan WMS</Label>
                        <Textarea
                          value={formData.wms_notes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              wms_notes: e.target.value,
                            })
                          }
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label>Catatan CEISA</Label>
                        <Textarea
                          value={formData.ceisa_notes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ceisa_notes: e.target.value,
                            })
                          }
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin mr-2" />
                    ) : (
                      <Plus className="mr-2" />
                    )}
                    {editingId ? "Update Stock" : "Tambah Stock"}
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

        {/* Table Data Stock */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Filter className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-lg">Data Stock</span>
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari berdasarkan nama barang, SKU, atau gudang..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-100 to-blue-100 hover:from-slate-100 hover:to-blue-100">
                  <TableHead className="font-semibold text-slate-700">
                    Nama Barang
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    SKU
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Gudang
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Jumlah
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Unit
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-700">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-slate-500 py-12"
                    >
                      <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                        <Package className="h-12 w-12 text-slate-300" />
                      </div>
                      <p className="font-medium text-lg">
                        Belum ada data stock
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Tambahkan stock baru untuk memulai
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage,
                    )
                    .map((item, index) => (
                      <TableRow
                        key={item.id}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                        } hover:bg-indigo-50 transition-colors border-b border-slate-100`}
                      >
                        <TableCell className="font-medium text-slate-900">
                          {item.item_name}
                        </TableCell>
                        <TableCell className="font-mono text-indigo-600">
                          {item.sku}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {item.warehouses || "-"}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {item.quantity || 0}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {item.unit || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <DetailDialog item={item} />
                            {canView(userRole) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item.id)}
                              >
                                <Pencil className="w-4 h-4 text-blue-600" />
                              </Button>
                            )}
                            {canDelete(userRole) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {filteredItems.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <div className="text-sm text-slate-600">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredItems.length)}{" "}
                dari {filteredItems.length} item
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
                  Halaman {currentPage} dari{" "}
                  {Math.ceil(filteredItems.length / itemsPerPage)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(
                        Math.ceil(filteredItems.length / itemsPerPage),
                        prev + 1,
                      ),
                    )
                  }
                  disabled={
                    currentPage >=
                    Math.ceil(filteredItems.length / itemsPerPage)
                  }
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
