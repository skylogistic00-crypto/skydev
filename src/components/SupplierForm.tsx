import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useToast } from "./ui/use-toast";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Search,
  Plus,
  ArrowLeft,
  Building2,
  CheckCircle,
  XCircle,
  Filter,
  Phone,
  Mail,
  User,
  MapPin,
  Package,
  TrendingUp,
  Users,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { canClick } from "@/utils/roleAccess";

interface SupplierFormData {
  supplier_code: string;
  supplier_name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  city: string;
  country: string;
  is_pkp: string;
  tax_id: string;
  bank_name: string;
  bank_account_holder: string;
  payment_terms: string;
  category: string;
  currency: string;
  status: string;
  address: string;
}

interface Supplier {
  supplier_code: string;
  supplier_name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  is_pkp: string;
  category: string;
  status: string;
}

export default function SupplierForm() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pkpFilter, setPkpFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    supplier_code: "",
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

  useEffect(() => {
    fetchSuppliers();

    const channel = supabase
      .channel("suppliers-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "suppliers" },
        () => {
          fetchSuppliers();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = suppliers;

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((sup) => sup.status === statusFilter);
    }

    if (pkpFilter !== "ALL") {
      filtered = filtered.filter((sup) => sup.is_pkp === pkpFilter);
    }

    if (categoryFilter !== "ALL") {
      filtered = filtered.filter((sup) => sup.category === categoryFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (sup) =>
          sup.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sup.supplier_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sup.contact_person.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredSuppliers(filtered);
  }, [searchTerm, statusFilter, pkpFilter, categoryFilter, suppliers]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select(
          "supplier_code, supplier_name, contact_person, phone_number, email, is_pkp, category, status",
        )
        .order("supplier_code", { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
      setFilteredSuppliers(data || []);
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

  const handleBack = () => {
    if (isDialogOpen) {
      setIsDialogOpen(false);
    }
    navigate("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("suppliers")
        .insert({
          supplier_name: formData.supplier_name,
          contact_person: formData.contact_person,
          phone_number: formData.phone_number,
          email: formData.email,
          city: formData.city,
          country: formData.country,
          is_pkp: formData.is_pkp,
          tax_id: formData.tax_id,
          bank_name: formData.bank_name,
          bank_account_holder: formData.bank_account_holder,
          payment_terms: formData.payment_terms,
          category: formData.category,
          currency: formData.currency,
          status: formData.status,
          address: formData.address,
        })
        .select();

      if (error) throw error;

      const generatedCode = data && data[0] ? data[0].supplier_code : "";

      toast({
        title: "Success",
        description: `Supplier berhasil ditambahkan dengan kode ${generatedCode}`,
      });

      // Reset form
      setFormData({
        supplier_code: "",
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

      setIsDialogOpen(false);
      fetchSuppliers();
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

  const getCategoryIcon = (category: string) => {
    const iconClass = "h-4 w-4";
    switch (category) {
      case "Raw Materials":
      case "Work in Process":
      case "Finished Goods":
        return <Package className={iconClass} />;
      case "Food":
      case "Beverage":
        return <Package className={iconClass} />;
      default:
        return <Package className={iconClass} />;
    }
  };

  const getCategoryBadge = (category: string) => {
    if (!category) return <span className="text-sm text-slate-400">-</span>;

    const colors: Record<string, string> = {
      "Raw Materials": "bg-amber-100 text-amber-700 border-amber-300",
      "Work in Process": "bg-orange-100 text-orange-700 border-orange-300",
      "Finished Goods": "bg-green-100 text-green-700 border-green-300",
      "Resale/Merchandise": "bg-purple-100 text-purple-700 border-purple-300",
      Food: "bg-pink-100 text-pink-700 border-pink-300",
      Beverage: "bg-cyan-100 text-cyan-700 border-cyan-300",
      "Spare Parts": "bg-slate-100 text-slate-700 border-slate-300",
    };

    const colorClass =
      colors[category] || "bg-slate-100 text-slate-700 border-slate-300";

    return (
      <Badge className={`flex items-center gap-1 ${colorClass}`}>
        {getCategoryIcon(category)}
        <span className="text-xs">{category}</span>
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === "ACTIVE") {
      return (
        <Badge className="flex items-center gap-1 w-fit bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-300">
          <CheckCircle className="h-3 w-3" />
          Active
        </Badge>
      );
    }
    return (
      <Badge className="flex items-center gap-1 w-fit bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-300">
        <XCircle className="h-3 w-3" />
        Inactive
      </Badge>
    );
  };

  const getPkpBadge = (isPkp: string) => {
    if (isPkp === "YES") {
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300">
          PKP
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300">
        Non-PKP
      </Badge>
    );
  };

  const summaryData = {
    total: suppliers.length,
    active: suppliers.filter((s) => s.status === "ACTIVE").length,
    inactive: suppliers.filter((s) => s.status === "INACTIVE").length,
    pkp: suppliers.filter((s) => s.is_pkp === "YES").length,
  };

  // Get unique categories for filter
  const uniqueCategories = Array.from(
    new Set(suppliers.map((s) => s.category).filter(Boolean)),
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
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Suppliers Management
                </h1>
                <p className="text-sm text-blue-100">
                  Kelola informasi supplier Anda
                </p>
              </div>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              {canClick(userRole) && (
                <Button className="bg-white text-indigo-600 hover:bg-blue-50 shadow-md">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Supplier
                </Button>
              )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambahkan Supplier Baru</DialogTitle>
                <DialogDescription>Isi detail supplier baru</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informasi Dasar</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supplier_name">Nama Supplier *</Label>
                      <Input
                        id="supplier_name"
                        value={formData.supplier_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
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
                      <Label htmlFor="contact_person">Contact Person *</Label>
                      <Input
                        id="contact_person"
                        value={formData.contact_person}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact_person: e.target.value,
                          })
                        }
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone *</Label>
                      <Input
                        id="phone_number"
                        value={formData.phone_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone_number: e.target.value,
                          })
                        }
                        placeholder="+62 812 3456 7890"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="supplier@example.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        placeholder="Jakarta"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                        placeholder="Indonesia"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
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
                      <Label htmlFor="is_pkp">PKP</Label>
                      <Select
                        value={formData.is_pkp}
                        onValueChange={(value) =>
                          setFormData({ ...formData, is_pkp: value })
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
                      <Label htmlFor="tax_id">Tax ID / No. PKP</Label>
                      <Input
                        id="tax_id"
                        value={formData.tax_id}
                        onChange={(e) =>
                          setFormData({ ...formData, tax_id: e.target.value })
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
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        value={formData.bank_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bank_name: e.target.value,
                          })
                        }
                        placeholder="Bank Mandiri"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bank_account_holder">
                        Bank Account Holder
                      </Label>
                      <Input
                        id="bank_account_holder"
                        value={formData.bank_account_holder}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
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
                      <Label htmlFor="payment_terms">Payment Terms</Label>
                      <Input
                        id="payment_terms"
                        value={formData.payment_terms}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            payment_terms: e.target.value,
                          })
                        }
                        placeholder="Net 30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Raw Materials">
                            Bahan Baku
                          </SelectItem>
                          <SelectItem value="Work in Process">
                            Barang Dalam Proses
                          </SelectItem>
                          <SelectItem value="Finished Goods">
                            Barang Jadi
                          </SelectItem>
                          <SelectItem value="Resale/Merchandise">
                            Barang Dagangan
                          </SelectItem>
                          <SelectItem value="Kits/Bundles">
                            Paket/Bundle
                          </SelectItem>
                          <SelectItem value="Spare Parts">
                            Suku Cadang
                          </SelectItem>
                          <SelectItem value="MRO">
                            MRO (Pemeliharaan, Perbaikan, Operasi)
                          </SelectItem>
                          <SelectItem value="Consumables">
                            Barang Habis Pakai
                          </SelectItem>
                          <SelectItem value="Packaging">Kemasan</SelectItem>
                          <SelectItem value="Food">Makanan</SelectItem>
                          <SelectItem value="Beverage">Minuman</SelectItem>
                          <SelectItem value="Rentable Units">
                            Unit Sewa
                          </SelectItem>
                          <SelectItem value="Demo/Loaner Units">
                            Unit Demo/Pinjaman
                          </SelectItem>
                          <SelectItem value="Returns">Barang Retur</SelectItem>
                          <SelectItem value="Defective/Damaged">
                            Barang Cacat/Rusak
                          </SelectItem>
                          <SelectItem value="Obsolete/Expired">
                            Barang Usang/Kadaluarsa
                          </SelectItem>
                          <SelectItem value="Goods in Transit">
                            Barang Dalam Perjalanan
                          </SelectItem>
                          <SelectItem value="Consignment">
                            Konsinyasi
                          </SelectItem>
                          <SelectItem value="Third Party/Owner">
                            Pihak Ketiga/Pemilik
                          </SelectItem>
                          <SelectItem value="Samples/Marketing">
                            Sampel/Pemasaran
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency *</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) =>
                          setFormData({ ...formData, currency: value })
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
                      <Label htmlFor="status">Status *</Label>
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
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards with icons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-lg bg-purple-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Total Suppliers
                </CardDescription>
                <Users className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {summaryData.total}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <Building2 className="mr-2 h-4 w-4" />
                Semua supplier
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-emerald-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Active
                </CardDescription>
                <TrendingUp className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {summaryData.active}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <CheckCircle className="mr-2 h-4 w-4" />
                Supplier aktif
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-pink-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Inactive
                </CardDescription>
                <XCircle className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {summaryData.inactive}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <XCircle className="mr-2 h-4 w-4" />
                Tidak aktif
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-blue-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  PKP Suppliers
                </CardDescription>
                <ShieldCheck className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {summaryData.pkp}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <CheckCircle className="mr-2 h-4 w-4" />
                Terdaftar PKP
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Filter className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-lg">Filter & Pencarian</span>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cari berdasarkan nama, kode, atau contact person..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] border-slate-300 focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Status</SelectItem>
                    <SelectItem value="ACTIVE">✓ Active</SelectItem>
                    <SelectItem value="INACTIVE">✗ Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={pkpFilter} onValueChange={setPkpFilter}>
                  <SelectTrigger className="w-[180px] border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="PKP Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua PKP</SelectItem>
                    <SelectItem value="YES">PKP</SelectItem>
                    <SelectItem value="NO">Non-PKP</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-[200px] border-slate-300 focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Kategori</SelectItem>
                    {uniqueCategories.filter((cat) => cat).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2">Memuat data suppliers...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-100 to-blue-100 hover:from-slate-100 hover:to-blue-100">
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Kode Supplier
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Nama Supplier
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Contact Person
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        No. Telepon
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        PKP
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Kategori
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Status
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier, index) => (
                    <TableRow
                      key={supplier.supplier_code}
                      className={`${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      } hover:bg-indigo-50 transition-colors border-b border-slate-100`}
                    >
                      <TableCell className="font-mono font-semibold text-indigo-600">
                        {supplier.supplier_code}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {supplier.supplier_name}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {supplier.contact_person}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {supplier.phone_number}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {supplier.email}
                      </TableCell>
                      <TableCell>{getPkpBadge(supplier.is_pkp)}</TableCell>
                      <TableCell>
                        {getCategoryBadge(supplier.category)}
                      </TableCell>
                      <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && filteredSuppliers.length === 0 && (
            <div className="p-12 text-center">
              <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                <Building2 className="h-12 w-12 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium text-lg">
                Tidak ada supplier ditemukan
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Coba ubah filter atau tambahkan supplier baru
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
