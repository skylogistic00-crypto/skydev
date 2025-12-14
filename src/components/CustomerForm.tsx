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

interface CustomerFormData {
  customer_code: string;
  customer_name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  city: string;
  country: string;
  is_pkp: string;
  tax_id: string;
  bank_name: string;
  bank_account_holder: string;
  bank_account_number: string;
  payment_term_id: string;
  currency: string;
  status: string;
  address: string;
}

interface Customer {
  customer_code: string;
  customer_name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  is_pkp: string;
  category: string;
  status: string;
}

export default function CustomerForm() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pkpFilter, setPkpFilter] = useState("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState<any[]>([]);

  // Indonesian Banks List
  const indonesianBanks = [
    "Bank Mandiri",
    "Bank Rakyat Indonesia (BRI)",
    "Bank Central Asia (BCA)",
    "Bank Negara Indonesia (BNI)",
    "Bank Tabungan Negara (BTN)",
    "Bank CIMB Niaga",
    "Bank Danamon",
    "Bank Permata",
    "Bank Maybank Indonesia",
    "Bank OCBC NISP",
    "Bank Panin",
    "Bank UOB Indonesia",
    "Bank BTPN",
    "Bank Mega",
    "Bank Sinarmas",
    "Bank Commonwealth",
    "Bank BCA Syariah",
    "Bank Syariah Indonesia (BSI)",
    "Bank Muamalat",
    "Bank BRI Syariah",
    "Bank Mandiri Syariah",
    "Bank BNI Syariah",
    "Bank Jago",
    "Bank Neo Commerce",
    "Bank Seabank Indonesia",
  ];

  const [formData, setFormData] = useState<CustomerFormData>({
    customer_code: "",
    customer_name: "",
    contact_person: "",
    phone_number: "",
    email: "",
    city: "",
    country: "",
    is_pkp: "",
    tax_id: "",
    bank_name: "",
    bank_account_holder: "",
    bank_account_number: "",
    payment_term_id: "",
    currency: "IDR",
    status: "ACTIVE",
    address: "",
  });

  useEffect(() => {
    fetchCustomers();
    fetchPaymentTerms();

    const channel = supabase
      .channel("customers-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customers" },
        () => {
          fetchCustomers();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = customers;

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((cust) => cust.status === statusFilter);
    }

    if (pkpFilter !== "ALL") {
      filtered = filtered.filter((cust) => cust.is_pkp === pkpFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (cust) =>
          cust.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cust.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cust.contact_person.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredCustomers(filtered);
  }, [searchTerm, statusFilter, pkpFilter, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select(
          "customer_code, customer_name, contact_person, phone_number, email, is_pkp, category, status",
        )
        .order("customer_code", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
      setFilteredCustomers(data || []);
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

  const fetchPaymentTerms = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_terms")
        .select("*")
        .eq("is_active", true)
        .order("days", { ascending: true });

      if (error) throw error;
      setPaymentTerms(data || []);
    } catch (error: any) {
      console.error("Error loading payment terms:", error);
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
        .from("customers")
        .insert({
          customer_name: formData.customer_name,
          contact_person: formData.contact_person,
          phone_number: parseInt(formData.phone_number) || null,
          email: formData.email,
          city: formData.city,
          country: formData.country,
          is_pkp: formData.is_pkp,
          tax_id: formData.tax_id,
          bank_name: formData.bank_name,
          bank_account_holder: formData.bank_account_holder,
          bank_account_number: formData.bank_account_number,
          payment_term_id: formData.payment_term_id || null,
          currency: formData.currency,
          status: formData.status,
          address: formData.address,
        })
        .select();

      if (error) throw error;

      const generatedCode = data && data[0] ? data[0].customer_code : "";

      toast({
        title: "Success",
        description: `Customer berhasil ditambahkan dengan kode ${generatedCode}`,
      });

      // Reset form
      setFormData({
        customer_code: "",
        customer_name: "",
        contact_person: "",
        phone_number: "",
        email: "",
        city: "",
        country: "",
        is_pkp: "",
        tax_id: "",
        bank_name: "",
        bank_account_holder: "",
        bank_account_number: "",
        payment_term_id: "",
        currency: "IDR",
        status: "ACTIVE",
        address: "",
      });

      setIsDialogOpen(false);
      fetchCustomers();
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
    total: customers.length,
    active: customers.filter((c) => c.status === "ACTIVE").length,
    inactive: customers.filter((c) => c.status === "INACTIVE").length,
    pkp: customers.filter((c) => c.is_pkp === "YES").length,
  };

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
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Customers Management
                </h1>
                <p className="text-sm text-blue-100">
                  Kelola informasi customer Anda
                </p>
              </div>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              {canClick(userRole) && (
                <Button className="bg-white text-indigo-600 hover:bg-blue-50 shadow-md">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Customer
                </Button>
              )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambahkan Customer Baru</DialogTitle>
                <DialogDescription>Isi detail customer baru</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informasi Dasar</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer_name">Nama Customer *</Label>
                      <Input
                        id="customer_name"
                        value={formData.customer_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customer_name: e.target.value,
                          })
                        }
                        placeholder="PT. Customer Indonesia"
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
                        placeholder="customer@example.com"
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
                      <Select
                        value={formData.bank_name}
                        onValueChange={(value) =>
                          setFormData({ ...formData, bank_name: value })
                        }
                      >
                        <SelectTrigger id="bank_name">
                          <SelectValue placeholder="Pilih bank" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {indonesianBanks.filter((bank) => bank).map((bank) => (
                            <SelectItem key={bank} value={bank}>
                              {bank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        placeholder="PT. Customer Indonesia"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bank_account_number">
                        Bank Account Number
                      </Label>
                      <Input
                        id="bank_account_number"
                        value={formData.bank_account_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bank_account_number: e.target.value,
                          })
                        }
                        placeholder="1234567890"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Informasi Tambahan</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment_term_id">Payment Terms</Label>
                      <Select
                        value={formData.payment_term_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, payment_term_id: value })
                        }
                      >
                        <SelectTrigger id="payment_term_id">
                          <SelectValue placeholder="Pilih payment terms" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentTerms.filter((term) => term.id).map((term) => (
                            <SelectItem key={term.id} value={term.id}>
                              {term.term_name} - {term.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) =>
                          setFormData({ ...formData, currency: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih mata uang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IDR">IDR - Rupiah</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="SGD">
                            SGD - Singapore Dollar
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
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
                    {loading ? "Menyimpan..." : "Simpan Customer"}
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
                  Total Customers
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
                Semua customer
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
                Customer aktif
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
                  PKP Customers
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
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2">Memuat data customers...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-100 to-blue-100 hover:from-slate-100 hover:to-blue-100">
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Kode Customer
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Nama Customer
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
                  {filteredCustomers.map((customer, index) => (
                    <TableRow
                      key={customer.customer_code}
                      className={`${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      } hover:bg-indigo-50 transition-colors border-b border-slate-100`}
                    >
                      <TableCell className="font-mono font-semibold text-indigo-600">
                        {customer.customer_code}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {customer.customer_name}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {customer.contact_person}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {customer.phone_number}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {customer.email}
                      </TableCell>
                      <TableCell>{getPkpBadge(customer.is_pkp)}</TableCell>
                      <TableCell>
                        {getCategoryBadge(customer.category)}
                      </TableCell>
                      <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && filteredCustomers.length === 0 && (
            <div className="p-12 text-center">
              <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                <Users className="h-12 w-12 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium text-lg">
                Tidak ada customer ditemukan
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Coba ubah filter atau tambahkan customer baru
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
