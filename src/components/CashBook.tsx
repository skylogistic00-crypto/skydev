import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import Header from "./Header";
import Navigation from "./Navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canClick, canDelete, canEdit } from "@/utils/roleAccess";
import { navigateBack } from "@/utils/navigation";

interface KasTransaksi {
  id?: string;
  tanggal: string;
  document_number: string;
  payment_type: string;
  service_category?: string;
  service_type?: string;
  account_number: string;
  account_name: string;
  nominal: string;
  keterangan?: string;
}

export default function CashBook() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coaAccounts, setCoaAccounts] = useState<any[]>([]);
  const [filteredCoaAccounts, setFilteredCoaAccounts] = useState<any[]>([]);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [categoryMappings, setCategoryMappings] = useState<any[]>([]);
  const { userRole } = useAuth();

  const [formData, setFormData] = useState<KasTransaksi>({
    tanggal: new Date().toISOString().split("T")[0],
    document_number: "",
    payment_type: "Penerimaan Kas",
    service_category: "",
    service_type: "",
    account_number: "",
    account_name: "",
    nominal: "0",
    keterangan: "",
  });

  useEffect(() => {
    fetchTransactions();
    fetchCoaAccounts();

    const channel = supabase
      .channel("kas-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kas_transaksi" },
        () => {
          fetchTransactions();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = transactions;

    if (paymentTypeFilter !== "ALL") {
      filtered = filtered.filter((t) => t.payment_type === paymentTypeFilter);
    }

    if (startDate) {
      filtered = filtered.filter((t) => t.tanggal >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter((t) => t.tanggal <= endDate);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.document_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.account_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.keterangan?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredTransactions(filtered);
  }, [searchTerm, paymentTypeFilter, startDate, endDate, transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("kas_transaksi")
        .select("*")
        .order("tanggal", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
      setFilteredTransactions(data || []);
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

  const fetchCoaAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("account_code, account_name, account_type")
        .eq("is_active", true)
        .eq("is_header", false)
        .order("account_code");

      if (error) throw error;
      setCoaAccounts(data || []);
      setFilteredCoaAccounts(data || []);
    } catch (error) {
      console.error("Error fetching COA accounts:", error);
    }
  };

  const fetchServiceCategories = async (paymentType?: string) => {
    try {
      const { data, error } = await supabase
        .from("coa_category_mapping")
        .select("service_category")
        .eq("is_active", true);

      if (error) throw error;

      let uniqueCategories = Array.from(
        new Set(data?.map((item) => item.service_category).filter(Boolean)),
      ) as string[];

      // Filter categories based on payment type
      if (paymentType === "Penerimaan Kas") {
        // Show categories for income: Pendapatan, Penerimaan, Pinjaman
        uniqueCategories = uniqueCategories.filter(
          (cat) =>
            cat.toLowerCase().includes("pendapatan") ||
            cat.toLowerCase().includes("penerimaan") ||
            cat.toLowerCase().includes("pinjaman"),
        );
      } else if (paymentType === "Pengeluaran Kas") {
        // Show categories for expenses: Pengeluaran, Beban, Pinjaman (for repayment)
        uniqueCategories = uniqueCategories.filter(
          (cat) =>
            cat.toLowerCase().includes("pengeluaran") ||
            cat.toLowerCase().includes("beban") ||
            cat.toLowerCase().includes("pinjaman"),
        );
      }

      setServiceCategories(uniqueCategories);
    } catch (err) {
      console.error("Error fetching service categories:", err);
    }
  };

  const fetchServiceTypesByCategory = async (category: string) => {
    if (!category) {
      setCategoryMappings([]);
      return;
    }

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "get_service_types_by_category",
        { p_category: category },
      );

      if (rpcError) throw rpcError;
      setCategoryMappings(data || []);
    } catch (error) {
      console.error("Error fetching service types:", error);
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      service_category: value,
      service_type: "",
      account_number: "",
      account_name: "",
    });
    setFilteredCoaAccounts(coaAccounts);
    fetchServiceTypesByCategory(value);
  };

  const handleServiceTypeChange = async (value: string) => {
    // Get current category from formData
    const currentCategory = formData.service_category;
    const currentPaymentType = formData.payment_type;

    // Update service_type first
    setFormData((prev) => ({ ...prev, service_type: value }));

    // Auto-fetch COA mapping and filter COA accounts
    if (currentCategory && value) {
      try {
        const { data, error } = await supabase.rpc("get_coa_mapping", {
          p_service_category: currentCategory,
          p_service_type: value,
        });

        if (error) throw error;

        if (data && data.length > 0) {
          const mapping = data[0];
          let accountCode = "";
          let accountName = "";

          // Untuk Persediaan, gunakan asset_account
          if (currentCategory === "Persediaan") {
            accountCode = mapping.asset_account_code || "";
            accountName = mapping.asset_account_name || "";
          }
          // Untuk kategori lain, gunakan revenue atau cogs berdasarkan payment type
          else if (currentPaymentType === "Penerimaan Kas") {
            accountCode = mapping.revenue_account_code || "";
            accountName = mapping.revenue_account_name || "";
          } else {
            accountCode =
              mapping.cogs_account_code || mapping.asset_account_code || "";
            accountName =
              mapping.cogs_account_name || mapping.asset_account_name || "";
          }

          // Filter COA accounts based on mapping
          const filtered = coaAccounts.filter((acc) => {
            if (currentCategory === "Persediaan") {
              return acc.account_code === mapping.asset_account_code;
            } else if (currentPaymentType === "Penerimaan Kas") {
              return acc.account_code === mapping.revenue_account_code;
            } else {
              return (
                acc.account_code === mapping.cogs_account_code ||
                acc.account_code === mapping.asset_account_code
              );
            }
          });

          setFilteredCoaAccounts(filtered);

          setFormData((prev) => ({
            ...prev,
            service_type: value,
            account_number: accountCode,
            account_name: accountName,
          }));

          toast({
            title: "✅ COA Auto-Selected",
            description: `${accountCode} - ${accountName}`,
          });
        } else {
          // If no mapping found, show all COA accounts
          setFilteredCoaAccounts(coaAccounts);
          toast({
            title: "ℹ️ Info",
            description: "Mapping COA tidak ditemukan untuk kategori ini",
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Error fetching COA mapping:", error);
        setFilteredCoaAccounts(coaAccounts);
        toast({
          title: "❌ Error",
          description: "Gagal mengambil mapping COA",
          variant: "destructive",
        });
      }
    } else {
      // Reset filtered COA if no category/service type
      setFilteredCoaAccounts(coaAccounts);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const transactionData = {
        tanggal: formData.tanggal,
        document_number: formData.document_number,
        payment_type: formData.payment_type,
        service_category: formData.service_category,
        service_type: formData.service_type,
        account_number: formData.account_number,
        account_name: formData.account_name,
        nominal: parseFloat(formData.nominal),
        keterangan: formData.keterangan || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("kas_transaksi")
          .update(transactionData)
          .eq("id", editingItem.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Transaksi berhasil diupdate",
        });
      } else {
        const { error } = await supabase
          .from("kas_transaksi")
          .insert(transactionData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Transaksi berhasil ditambahkan",
        });
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan transaksi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      tanggal: item.tanggal,
      document_number: item.document_number,
      payment_type: item.payment_type,
      service_category: item.service_category,
      service_type: item.service_type,
      account_number: item.account_number,
      account_name: item.account_name,
      nominal: item.nominal.toString(),
      keterangan: item.keterangan || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;

    try {
      const { error } = await supabase
        .from("kas_transaksi")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaksi berhasil dihapus",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      tanggal: new Date().toISOString().split("T")[0],
      document_number: "",
      payment_type: "Penerimaan Kas",
      service_category: "",
      service_type: "",
      account_number: "",
      account_name: "",
      nominal: "0",
      keterangan: "",
    });
    setEditingItem(null);
    setFilteredCoaAccounts(coaAccounts);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const summaryData = {
    totalTransactions: filteredTransactions.length,
    totalPenerimaan: filteredTransactions
      .filter((t) => t.payment_type === "Penerimaan Kas")
      .reduce((sum, t) => sum + parseFloat(t.nominal || 0), 0),
    totalPengeluaran: filteredTransactions
      .filter((t) => t.payment_type === "Pengeluaran Kas")
      .reduce((sum, t) => sum + parseFloat(t.nominal || 0), 0),
  };

  const netAmount = summaryData.totalPenerimaan - summaryData.totalPengeluaran;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Navigation />

      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 shadow-lg">
          <div className="container mx-auto px-4 py-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigateBack(navigate)}
                variant="outline"
                className="bg-white/20 text-white hover:bg-white/30 border-white/30"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Cash Book</h1>
                  <p className="text-sm text-blue-100">
                    Pencatatan Penerimaan dan Pengeluaran Kas
                  </p>
                </div>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={resetForm}
                  className="bg-white text-indigo-600 hover:bg-blue-50 shadow-md"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Transaksi" : "Tambah Transaksi Baru"}
                  </DialogTitle>
                  <DialogDescription>
                    Isi detail transaksi kas
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tanggal">Tanggal *</Label>
                      <Input
                        id="tanggal"
                        type="date"
                        value={formData.tanggal}
                        onChange={(e) =>
                          setFormData({ ...formData, tanggal: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payment_type">Payment Type *</Label>
                      <Select
                        value={formData.payment_type}
                        onValueChange={(value) => {
                          setFormData({
                            ...formData,
                            payment_type: value,
                            service_category: "",
                            service_type: "",
                            account_number: "",
                            account_name: "",
                          });

                          // Fetch filtered categories based on payment type
                          fetchServiceCategories(value);
                        }}
                      >
                        <SelectTrigger id="payment_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Penerimaan Kas">
                            Penerimaan Kas
                          </SelectItem>
                          <SelectItem value="Pengeluaran Kas">
                            Pengeluaran Kas
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="service_category">
                        Kategori Layanan/Produk
                      </Label>
                      <Select
                        value={formData.service_category}
                        onValueChange={(value) => handleCategoryChange(value)}
                      >
                        <SelectTrigger id="service_category">
                          <SelectValue placeholder="Pilih kategori (opsional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceCategories.filter((category) => category).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Pilih untuk auto-select COA
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="service_type">Jenis Layanan/Barang</Label>
                      <Select
                        value={formData.service_type}
                        onValueChange={(value) =>
                          handleServiceTypeChange(value)
                        }
                        disabled={!formData.service_category}
                      >
                        <SelectTrigger id="service_type">
                          <SelectValue
                            placeholder={
                              formData.service_category
                                ? "Pilih jenis"
                                : "Pilih kategori dulu"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryMappings.map((mapping) => (
                            <SelectItem
                              key={mapping.service_type}
                              value={mapping.service_type}
                            >
                              {mapping.service_type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account_number">Account Number *</Label>
                      <Select
                        value={formData.account_number}
                        onValueChange={(value) => {
                          const selectedAccount = filteredCoaAccounts.find(
                            (acc) => acc.account_code === value,
                          );
                          setFormData({
                            ...formData,
                            account_number: value,
                            account_name: selectedAccount?.account_name || "",
                          });
                        }}
                        required
                      >
                        <SelectTrigger id="account_number">
                          <SelectValue placeholder="Pilih akun COA" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {filteredCoaAccounts.length > 0 ? (
                            filteredCoaAccounts.map((account) => (
                              <SelectItem
                                key={account.account_code}
                                value={account.account_code}
                              >
                                {account.account_code} - {account.account_name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-4 text-sm text-gray-500 text-center">
                              {formData.service_category &&
                              formData.service_type
                                ? "Tidak ada COA yang sesuai"
                                : "Pilih kategori dan jenis layanan terlebih dahulu"}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      {formData.service_category && formData.service_type && (
                        <p className="text-xs text-gray-500">
                          {filteredCoaAccounts.length} akun COA tersedia untuk
                          kategori ini
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account_name">Account Name</Label>
                      <Input
                        id="account_name"
                        value={formData.account_name}
                        readOnly
                        className="bg-gray-50"
                        placeholder="Nama akun akan terisi otomatis"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nominal">Nominal *</Label>
                      <Input
                        id="nominal"
                        type="number"
                        step="0.01"
                        value={formData.nominal}
                        onChange={(e) =>
                          setFormData({ ...formData, nominal: e.target.value })
                        }
                        placeholder="0"
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="keterangan">Keterangan</Label>
                      <Textarea
                        id="keterangan"
                        value={formData.keterangan}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            keterangan: e.target.value,
                          })
                        }
                        placeholder="Keterangan transaksi"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
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
                    <Button type="submit" disabled={loading}>
                      {loading
                        ? "Menyimpan..."
                        : editingItem
                          ? "Update"
                          : "Simpan"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-none shadow-lg bg-blue-400/90 text-white hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-white/90">
                    Total Transaksi
                  </CardDescription>
                  <Receipt className="h-8 w-8 text-white/80" />
                </div>
                <CardTitle className="text-4xl font-bold">
                  {summaryData.totalTransactions}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-white/90">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Total transaksi kas
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-emerald-400/90 text-white hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-white/90">
                    Total Penerimaan
                  </CardDescription>
                  <TrendingUp className="h-8 w-8 text-white/80" />
                </div>
                <CardTitle className="text-3xl font-bold">
                  {
                    formatCurrency(summaryData.totalPenerimaan)
                      .replace("Rp", "")
                      .trim()
                      .split(",")[0]
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-white/90">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Kas masuk
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-pink-400/90 text-white hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-white/90">
                    Total Pengeluaran
                  </CardDescription>
                  <TrendingDown className="h-8 w-8 text-white/80" />
                </div>
                <CardTitle className="text-3xl font-bold">
                  {
                    formatCurrency(summaryData.totalPengeluaran)
                      .replace("Rp", "")
                      .trim()
                      .split(",")[0]
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-white/90">
                  <TrendingDown className="mr-2 h-4 w-4" />
                  Kas keluar
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border-none shadow-lg text-white hover:shadow-xl transition-shadow ${
                netAmount >= 0 ? "bg-purple-400/90" : "bg-red-400/90"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-white/90">
                    Net
                  </CardDescription>
                  <DollarSign className="h-8 w-8 text-white/80" />
                </div>
                <CardTitle className="text-3xl font-bold">
                  {
                    formatCurrency(netAmount)
                      .replace("Rp", "")
                      .trim()
                      .split(",")[0]
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-white/90">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Saldo bersih
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Cari transaksi..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <Select
                    value={paymentTypeFilter}
                    onValueChange={setPaymentTypeFilter}
                  >
                    <SelectTrigger className="border-slate-300 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="Payment Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua</SelectItem>
                      <SelectItem value="Penerimaan Kas">
                        Penerimaan Kas
                      </SelectItem>
                      <SelectItem value="Pengeluaran Kas">
                        Pengeluaran Kas
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    placeholder="Tanggal Mulai"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <Input
                    type="date"
                    placeholder="Tanggal Akhir"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2">Memuat data transaksi...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-100 to-blue-100 hover:from-slate-100 hover:to-blue-100">
                      <TableHead className="font-semibold text-slate-700">
                        Tanggal
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Document Number
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Payment Type
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Account Number
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Account Name
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Nominal
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Keterangan
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 text-center">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-slate-500 py-8"
                        >
                          Tidak ada transaksi ditemukan
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => {
                        const nominal = parseFloat(transaction.nominal || 0);
                        const displayNominal =
                          transaction.payment_type === "Pengeluaran Kas"
                            ? -Math.abs(nominal)
                            : Math.abs(nominal);

                        return (
                          <TableRow
                            key={transaction.id}
                            className="hover:bg-indigo-50 transition-colors border-b border-slate-100"
                          >
                            <TableCell className="text-slate-700">
                              {new Date(transaction.tanggal).toLocaleDateString(
                                "id-ID",
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-slate-900">
                              {transaction.document_number}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  transaction.payment_type === "Penerimaan Kas"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {transaction.payment_type}
                              </span>
                            </TableCell>
                            <TableCell className="text-slate-700 font-mono">
                              {transaction.account_number}
                            </TableCell>
                            <TableCell className="text-slate-700">
                              {transaction.account_name}
                            </TableCell>
                            <TableCell
                              className={`font-bold ${
                                displayNominal >= 0
                                  ? "text-green-700"
                                  : "text-red-700"
                              }`}
                            >
                              {formatCurrency(displayNominal)}
                            </TableCell>
                            <TableCell className="text-slate-600 text-sm">
                              {transaction.keterangan || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center gap-2">
                                {canEdit(userRole) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(transaction)}
                                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                )}
                                {canDelete(userRole) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(transaction.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
