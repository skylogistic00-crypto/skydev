import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "./ui/use-toast";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Plus, Edit, Trash2, Search, Zap, Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { COA_ENGINE, generateCOAForItem } from "@/lib/coaEngine";
import { Checkbox } from "./ui/checkbox";
import Header from "./Header";
import Navigation from "./Navigation";
import { canClick, canDelete, canEdit, canView } from "@/utils/roleAccess";
import { useAuth } from "@/contexts/AuthContext";

interface COAAccount {
  id?: string;
  account_code: string;
  account_name: string;
  account_type: string;
  level: number;
  is_header: boolean;
  normal_balance: string;
  balance?: number;
  description?: string;
  is_active: boolean;
}

interface COAMapping {
  id?: string;
  service_category: string;
  service_type: string;
  revenue_account_code?: string;
  cogs_account_code?: string;
  asset_account_code?: string;
  description?: string;
  is_active: boolean;
}

export default function COAManagement() {
  const { toast } = useToast();
  const [coaAccounts, setCoaAccounts] = useState<COAAccount[]>([]);
  const [coaMappings, setCoaMappings] = useState<COAMapping[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCoaDialogOpen, setIsCoaDialogOpen] = useState(false);
  const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
  const [editingCoa, setEditingCoa] = useState<COAAccount | null>(null);
  const [editingMapping, setEditingMapping] = useState<COAMapping | null>(null);
  const { userRole } = useAuth();

  const [coaForm, setCoaForm] = useState<COAAccount>({
    account_code: "",
    account_name: "",
    account_type: "Aset",
    level: 1,
    is_header: false,
    normal_balance: "Debit",
    description: "",
    is_active: true,
  });

  const [mappingForm, setMappingForm] = useState<COAMapping>({
    service_category: "",
    service_type: "",
    revenue_account_code: "",
    cogs_account_code: "",
    asset_account_code: "",
    description: "",
    is_active: true,
  });

  const [engineForm, setEngineForm] = useState({
    type: "VEHICLE" as
      | "VEHICLE"
      | "SPKLU"
      | "WAREHOUSE"
      | "DRIVER"
      | "BARANG"
      | "JASA",
    identifier: "",
    meta: "",
    autoGenerateItem: false,
    itemName: "",
    itemCode: "",
  });
  const [isEngineLoading, setIsEngineLoading] = useState(false);
  
  // CSV Import states
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    records_processed?: number;
    records_skipped?: number;
    total_coa_rows?: number;
  } | null>(null);

  useEffect(() => {
    fetchCoaAccounts();
    fetchCoaMappings();

    const coaChannel = supabase
      .channel("coa-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chart_of_accounts" },
        () => {
          fetchCoaAccounts();
        },
      )
      .subscribe();

    const mappingChannel = supabase
      .channel("mapping-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coa_category_mapping" },
        () => {
          fetchCoaMappings();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(coaChannel);
      supabase.removeChannel(mappingChannel);
    };
  }, []);

  const fetchCoaAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .order("account_code", { ascending: true });

      if (error) throw error;
      setCoaAccounts(data || []);
    } catch (error) {
      console.error("Error fetching COA accounts:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data COA",
        variant: "destructive",
      });
    }
  };

  const formatRupiah = (amount: number | null | undefined): string => {
    const value = amount || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const fetchCoaMappings = async () => {
    try {
      const { data, error } = await supabase
        .from("coa_category_mapping")
        .select("*")
        .order("service_category, service_type");

      if (error) throw error;
      setCoaMappings(data || []);
    } catch (error) {
      console.error("Error fetching COA mappings:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data mapping",
        variant: "destructive",
      });
    }
  };

  const handleSaveCoa = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCoa?.id) {
        const { error } = await supabase
          .from("chart_of_accounts")
          .update(coaForm)
          .eq("id", editingCoa.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Akun COA berhasil diupdate",
        });
      } else {
        const { error } = await supabase
          .from("chart_of_accounts")
          .insert([coaForm]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Akun COA berhasil ditambahkan",
        });
      }

      setIsCoaDialogOpen(false);
      resetCoaForm();
      fetchCoaAccounts();
    } catch (error: any) {
      console.error("Error saving COA:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan akun COA",
        variant: "destructive",
      });
    }
  };

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingMapping?.id) {
        const { error } = await supabase
          .from("coa_category_mapping")
          .update(mappingForm)
          .eq("id", editingMapping.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Mapping berhasil diupdate",
        });
      } else {
        const { error } = await supabase
          .from("coa_category_mapping")
          .insert([mappingForm]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Mapping berhasil ditambahkan",
        });
      }

      setIsMappingDialogOpen(false);
      resetMappingForm();
      fetchCoaMappings();
    } catch (error: any) {
      console.error("Error saving mapping:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan mapping",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCoa = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus akun COA ini?")) return;

    try {
      const { error } = await supabase
        .from("chart_of_accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Akun COA berhasil dihapus",
      });

      fetchCoaAccounts();
    } catch (error: any) {
      console.error("Error deleting COA:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus akun COA",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus mapping ini?")) return;

    try {
      const { error } = await supabase
        .from("coa_category_mapping")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Mapping berhasil dihapus",
      });

      fetchCoaMappings();
    } catch (error: any) {
      console.error("Error deleting mapping:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus mapping",
        variant: "destructive",
      });
    }
  };

  const handleEngineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEngineLoading(true);

    try {
      // Generate item COA if checkbox is checked
      if (
        engineForm.autoGenerateItem &&
        engineForm.itemName &&
        engineForm.itemCode
      ) {
        await generateCOAForItem(engineForm.itemName, engineForm.itemCode);
        toast({
          title: "Berhasil",
          description: `COA untuk item ${engineForm.itemName} berhasil dibuat`,
        });
      }

      // Generate blueprint COA
      const result = await COA_ENGINE(
        engineForm.type,
        engineForm.identifier,
        engineForm.meta || undefined,
      );

      if (result && "message" in result && result.message) {
        toast({
          title: "Info",
          description: result.message,
        });
      } else {
        toast({
          title: "Berhasil",
          description: `COA untuk ${engineForm.type} berhasil dibuat`,
        });
        setEngineForm({
          type: "VEHICLE",
          identifier: "",
          meta: "",
          autoGenerateItem: false,
          itemName: "",
          itemCode: "",
        });
        fetchCoaAccounts();
      }
    } catch (error: any) {
      console.error("Error creating COA:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat COA",
        variant: "destructive",
      });
    } finally {
      setIsEngineLoading(false);
    }
  };

  const resetCoaForm = () => {
    setCoaForm({
      account_code: "",
      account_name: "",
      account_type: "Aset",
      level: 1,
      is_header: false,
      normal_balance: "Debit",
      description: "",
      is_active: true,
    });
    setEditingCoa(null);
  };

  const resetMappingForm = () => {
    setMappingForm({
      service_category: "",
      service_type: "",
      revenue_account_code: "",
      cogs_account_code: "",
      asset_account_code: "",
      description: "",
      is_active: true,
    });
    setEditingMapping(null);
  };

  const openEditCoa = (coa: COAAccount) => {
    setEditingCoa(coa);
    setCoaForm(coa);
    setIsCoaDialogOpen(true);
  };

  const openEditMapping = (mapping: COAMapping) => {
    setEditingMapping(mapping);
    setMappingForm(mapping);
    setIsMappingDialogOpen(true);
  };

  const filteredCoaAccounts = coaAccounts.filter(
    (coa) =>
      coa.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coa.account_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredMappings = coaMappings.filter(
    (mapping) =>
      mapping.service_category
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      mapping.service_type.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Navigation />

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              COA Management
            </h1>
            <p className="text-slate-600">
              Kelola Chart of Accounts dan Mapping Rules
            </p>
          </div>

          <Tabs defaultValue="coa" className="space-y-6">
            <TabsList className="grid w-full max-w-3xl grid-cols-4">
              <TabsTrigger value="coa">Chart of Accounts</TabsTrigger>
              <TabsTrigger value="mapping">Mapping Rules</TabsTrigger>
              <TabsTrigger value="engine">
                <Zap className="w-4 h-4 mr-2" />
                COA Engine
              </TabsTrigger>
              <TabsTrigger value="import">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </TabsTrigger>
            </TabsList>

            {/* COA Tab */}
            <TabsContent value="coa" className="space-y-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      placeholder="Cari kode atau nama akun..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Dialog
                    open={isCoaDialogOpen}
                    onOpenChange={setIsCoaDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={resetCoaForm}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Akun COA
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingCoa
                            ? "Edit Akun COA"
                            : "Tambah Akun COA Baru"}
                        </DialogTitle>
                      </DialogHeader>

                      <form onSubmit={handleSaveCoa} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="account_code">Kode Akun *</Label>
                            <Input
                              id="account_code"
                              value={coaForm.account_code}
                              onChange={(e) =>
                                setCoaForm({
                                  ...coaForm,
                                  account_code: e.target.value,
                                })
                              }
                              placeholder="Contoh: 1-1100"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="account_name">Nama Akun *</Label>
                            <Input
                              id="account_name"
                              value={coaForm.account_name}
                              onChange={(e) =>
                                setCoaForm({
                                  ...coaForm,
                                  account_name: e.target.value,
                                })
                              }
                              placeholder="Contoh: Kas di Tangan"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="account_type">Tipe Akun *</Label>
                            <Select
                              value={coaForm.account_type}
                              onValueChange={(value) =>
                                setCoaForm({ ...coaForm, account_type: value })
                              }
                            >
                              <SelectTrigger id="account_type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Aset">Aset</SelectItem>
                                <SelectItem value="Kewajiban">
                                  Kewajiban
                                </SelectItem>
                                <SelectItem value="Ekuitas">Ekuitas</SelectItem>
                                <SelectItem value="Pendapatan">
                                  Pendapatan
                                </SelectItem>
                                <SelectItem value="Beban Pokok Penjualan">
                                  Beban Pokok Penjualan
                                </SelectItem>
                                <SelectItem value="Beban Operasional">
                                  Beban Operasional
                                </SelectItem>
                                <SelectItem value="Lain-lain">
                                  Lain-lain
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="level">Level *</Label>
                            <Select
                              value={coaForm.level.toString()}
                              onValueChange={(value) =>
                                setCoaForm({
                                  ...coaForm,
                                  level: parseInt(value),
                                })
                              }
                            >
                              <SelectTrigger id="level">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">
                                  Level 1 (Header Utama)
                                </SelectItem>
                                <SelectItem value="2">
                                  Level 2 (Sub Header)
                                </SelectItem>
                                <SelectItem value="3">
                                  Level 3 (Detail)
                                </SelectItem>
                                <SelectItem value="4">
                                  Level 4 (Sub Detail)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="normal_balance">
                              Normal Balance *
                            </Label>
                            <Select
                              value={coaForm.normal_balance}
                              onValueChange={(value) =>
                                setCoaForm({
                                  ...coaForm,
                                  normal_balance: value,
                                })
                              }
                            >
                              <SelectTrigger id="normal_balance">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Debit">Debit</SelectItem>
                                <SelectItem value="Kredit">Kredit</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="is_header">Tipe Akun</Label>
                            <Select
                              value={coaForm.is_header ? "true" : "false"}
                              onValueChange={(value) =>
                                setCoaForm({
                                  ...coaForm,
                                  is_header: value === "true",
                                })
                              }
                            >
                              <SelectTrigger id="is_header">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="false">
                                  Detail Account
                                </SelectItem>
                                <SelectItem value="true">
                                  Header Account
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <Input
                              id="description"
                              value={coaForm.description || ""}
                              onChange={(e) =>
                                setCoaForm({
                                  ...coaForm,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Deskripsi akun (opsional)"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsCoaDialogOpen(false);
                              resetCoaForm();
                            }}
                          >
                            Batal
                          </Button>
                          <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {editingCoa ? "Update" : "Simpan"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode Akun</TableHead>
                        <TableHead>Nama Akun</TableHead>
                        <TableHead>Tipe Akun</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Normal Balance</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCoaAccounts.map((coa) => (
                        <TableRow key={coa.id}>
                          <TableCell className="font-mono font-semibold">
                            {coa.account_code}
                          </TableCell>
                          <TableCell
                            className={coa.is_header ? "font-bold" : ""}
                          >
                            {coa.account_name}
                          </TableCell>
                          <TableCell>{coa.account_type}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {coa.description || "-"}
                          </TableCell>
                          <TableCell>Level {coa.level}</TableCell>
                          <TableCell>{coa.normal_balance}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatRupiah(coa.balance)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                coa.is_active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {coa.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {canEdit(userRole) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditCoa(coa)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                              {canDelete(userRole) && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteCoa(coa.id!)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* Mapping Tab */}
            <TabsContent value="mapping" className="space-y-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      placeholder="Cari kategori atau jenis layanan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Dialog
                    open={isMappingDialogOpen}
                    onOpenChange={setIsMappingDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={resetMappingForm}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Mapping
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingMapping
                            ? "Edit Mapping Rule"
                            : "Tambah Mapping Rule Baru"}
                        </DialogTitle>
                      </DialogHeader>

                      <form onSubmit={handleSaveMapping} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="service_category">
                              Kategori Layanan *
                            </Label>
                            <Input
                              id="service_category"
                              value={mappingForm.service_category}
                              onChange={(e) =>
                                setMappingForm({
                                  ...mappingForm,
                                  service_category: e.target.value,
                                })
                              }
                              placeholder="Contoh: Jasa Cargo"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="service_type">
                              Jenis Layanan *
                            </Label>
                            <Input
                              id="service_type"
                              value={mappingForm.service_type}
                              onChange={(e) =>
                                setMappingForm({
                                  ...mappingForm,
                                  service_type: e.target.value,
                                })
                              }
                              placeholder="Contoh: Cargo Udara Domestik"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="revenue_account_code">
                              Akun Pendapatan
                            </Label>
                            <Select
                              value={mappingForm.revenue_account_code || ""}
                              onValueChange={(value) =>
                                setMappingForm({
                                  ...mappingForm,
                                  revenue_account_code: value,
                                })
                              }
                            >
                              <SelectTrigger id="revenue_account_code">
                                <SelectValue placeholder="Pilih akun pendapatan" />
                              </SelectTrigger>
                              <SelectContent>
                                {coaAccounts
                                  .filter(
                                    (coa) =>
                                      coa.account_type === "Pendapatan" &&
                                      !coa.is_header,
                                  )
                                  .map((coa) => (
                                    <SelectItem
                                      key={coa.id}
                                      value={coa.account_code}
                                    >
                                      {coa.account_code} - {coa.account_name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="cogs_account_code">
                              Akun HPP/Beban
                            </Label>
                            <Select
                              value={mappingForm.cogs_account_code || ""}
                              onValueChange={(value) =>
                                setMappingForm({
                                  ...mappingForm,
                                  cogs_account_code: value,
                                })
                              }
                            >
                              <SelectTrigger id="cogs_account_code">
                                <SelectValue placeholder="Pilih akun HPP/Beban" />
                              </SelectTrigger>
                              <SelectContent>
                                {coaAccounts
                                  .filter(
                                    (coa) =>
                                      coa.account_type ===
                                        "Beban Pokok Penjualan" &&
                                      !coa.is_header,
                                  )
                                  .map((coa) => (
                                    <SelectItem
                                      key={coa.id}
                                      value={coa.account_code}
                                    >
                                      {coa.account_code} - {coa.account_name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="asset_account_code">
                              Akun Aset (Persediaan)
                            </Label>
                            <Select
                              value={mappingForm.asset_account_code || ""}
                              onValueChange={(value) =>
                                setMappingForm({
                                  ...mappingForm,
                                  asset_account_code: value,
                                })
                              }
                            >
                              <SelectTrigger id="asset_account_code">
                                <SelectValue placeholder="Pilih akun aset" />
                              </SelectTrigger>
                              <SelectContent>
                                {coaAccounts
                                  .filter(
                                    (coa) =>
                                      coa.account_type === "Aset" &&
                                      !coa.is_header,
                                  )
                                  .map((coa) => (
                                    <SelectItem
                                      key={coa.id}
                                      value={coa.account_code}
                                    >
                                      {coa.account_code} - {coa.account_name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="mapping_description">
                              Deskripsi
                            </Label>
                            <Input
                              id="mapping_description"
                              value={mappingForm.description || ""}
                              onChange={(e) =>
                                setMappingForm({
                                  ...mappingForm,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Deskripsi mapping (opsional)"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsMappingDialogOpen(false);
                              resetMappingForm();
                            }}
                          >
                            Batal
                          </Button>
                          <Button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {editingMapping ? "Update" : "Simpan"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Jenis Layanan</TableHead>
                        <TableHead>Akun Pendapatan</TableHead>
                        <TableHead>Akun HPP</TableHead>
                        <TableHead>Akun Aset</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMappings.map((mapping) => (
                        <TableRow key={mapping.id}>
                          <TableCell className="font-semibold">
                            {mapping.service_category}
                          </TableCell>
                          <TableCell>{mapping.service_type}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {mapping.revenue_account_code || "-"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {mapping.cogs_account_code || "-"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {mapping.asset_account_code || "-"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                mapping.is_active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {mapping.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {canEdit(userRole) && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditMapping(mapping)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      handleDeleteMapping(mapping.id!)
                                    }
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* COA Engine Tab */}
            <TabsContent value="engine" className="space-y-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    COA Auto-Generator
                  </h2>
                  <p className="text-slate-600 text-sm">
                    Buat COA otomatis untuk Kendaraan, SPKLU, Warehouse, atau
                    Driver
                  </p>
                </div>

                <form onSubmit={handleEngineSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="engine-type">Tipe Blueprint</Label>
                      <Select
                        value={engineForm.type}
                        onValueChange={(value: any) =>
                          setEngineForm({ ...engineForm, type: value })
                        }
                      >
                        <SelectTrigger id="engine-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VEHICLE">Kendaraan</SelectItem>
                          <SelectItem value="SPKLU">SPKLU</SelectItem>
                          <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                          <SelectItem value="DRIVER">Driver</SelectItem>
                          <SelectItem value="BARANG">Barang</SelectItem>
                          <SelectItem value="JASA">Jasa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="engine-identifier">
                        Identifier
                        {engineForm.type === "VEHICLE" && " (Plat Nomor)"}
                        {engineForm.type === "SPKLU" && " (Lokasi)"}
                        {engineForm.type === "WAREHOUSE" && " (Kode Rak)"}
                        {engineForm.type === "DRIVER" && " (ID Driver)"}
                        {engineForm.type === "BARANG" && " (Nama Barang)"}
                        {engineForm.type === "JASA" && " (Nama Jasa)"}
                      </Label>
                      <Input
                        id="engine-identifier"
                        value={engineForm.identifier}
                        onChange={(e) =>
                          setEngineForm({
                            ...engineForm,
                            identifier: e.target.value,
                          })
                        }
                        placeholder={
                          engineForm.type === "VEHICLE"
                            ? "B 1234 XYZ"
                            : engineForm.type === "SPKLU"
                              ? "Jakarta Selatan"
                              : engineForm.type === "WAREHOUSE"
                                ? "RAK-A1"
                                : engineForm.type === "DRIVER"
                                  ? "DRV001"
                                  : engineForm.type === "BARANG"
                                    ? "Laptop Dell XPS"
                                    : "Jasa Konsultasi"
                        }
                        required
                      />
                    </div>

                    {engineForm.type === "VEHICLE" && (
                      <div className="space-y-2">
                        <Label htmlFor="engine-meta">
                          Jenis Kendaraan (Opsional)
                        </Label>
                        <Input
                          id="engine-meta"
                          value={engineForm.meta}
                          onChange={(e) =>
                            setEngineForm({
                              ...engineForm,
                              meta: e.target.value,
                            })
                          }
                          placeholder="Truk, Mobil Box, dll"
                        />
                      </div>
                    )}

                    {engineForm.type === "DRIVER" && (
                      <div className="space-y-2">
                        <Label htmlFor="engine-meta">Nama Driver</Label>
                        <Input
                          id="engine-meta"
                          value={engineForm.meta}
                          onChange={(e) =>
                            setEngineForm({
                              ...engineForm,
                              meta: e.target.value,
                            })
                          }
                          placeholder="Nama lengkap driver"
                          required
                        />
                      </div>
                    )}

                    {(engineForm.type === "BARANG" ||
                      engineForm.type === "JASA") && (
                      <div className="space-y-2">
                        <Label htmlFor="engine-meta">
                          {engineForm.type === "BARANG"
                            ? "Kode Barang"
                            : "Kode Jasa"}
                        </Label>
                        <Input
                          id="engine-meta"
                          value={engineForm.meta}
                          onChange={(e) =>
                            setEngineForm({
                              ...engineForm,
                              meta: e.target.value,
                            })
                          }
                          placeholder={
                            engineForm.type === "BARANG" ? "BRG001" : "JSA001"
                          }
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Auto-generate Item COA Section */}
                  <div className="border-t pt-6 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="auto-generate-item"
                        checked={engineForm.autoGenerateItem}
                        onCheckedChange={(checked) =>
                          setEngineForm({
                            ...engineForm,
                            autoGenerateItem: checked as boolean,
                          })
                        }
                      />
                      <Label
                        htmlFor="auto-generate-item"
                        className="font-semibold"
                      >
                        Buat COA untuk Item/Barang secara otomatis
                      </Label>
                    </div>

                    {engineForm.autoGenerateItem && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                        <div className="space-y-2">
                          <Label htmlFor="item-name">Nama Item</Label>
                          <Input
                            id="item-name"
                            value={engineForm.itemName}
                            onChange={(e) =>
                              setEngineForm({
                                ...engineForm,
                                itemName: e.target.value,
                              })
                            }
                            placeholder="Contoh: Laptop Dell XPS"
                            required={engineForm.autoGenerateItem}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="item-code">Kode Item</Label>
                          <Input
                            id="item-code"
                            value={engineForm.itemCode}
                            onChange={(e) =>
                              setEngineForm({
                                ...engineForm,
                                itemCode: e.target.value,
                              })
                            }
                            placeholder="Contoh: LPT001"
                            required={engineForm.autoGenerateItem}
                          />
                        </div>

                        <div className="col-span-2 bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-800 font-semibold mb-1">
                            COA Item yang akan dibuat:
                          </p>
                          <ul className="text-xs text-green-700 space-y-1">
                            <li>
                              • Pendapatan {engineForm.itemName || "Item"}
                            </li>
                            <li>• HPP {engineForm.itemName || "Item"}</li>
                            <li>
                              • Beban Komisi {engineForm.itemName || "Item"}
                            </li>
                            <li>
                              • Beban Operasional{" "}
                              {engineForm.itemName || "Item"}
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Akun yang akan dibuat:
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {engineForm.type === "VEHICLE" && (
                        <>
                          <li>• Aset Kendaraan</li>
                          <li>• Pendapatan Transportasi</li>
                          <li>• HPP Kendaraan</li>
                          <li>• BBM Kendaraan</li>
                          <li>• Servis Kendaraan</li>
                          <li>• Asuransi Kendaraan</li>
                          <li>• Penyusutan Kendaraan</li>
                        </>
                      )}
                      {engineForm.type === "SPKLU" && (
                        <>
                          <li>• Aset SPKLU</li>
                          <li>• Pendapatan Charging</li>
                          <li>• HPP Charging</li>
                          <li>• Beban Operasional SPKLU</li>
                          <li>• Penyusutan SPKLU</li>
                        </>
                      )}
                      {engineForm.type === "WAREHOUSE" && (
                        <>
                          <li>• Aset Warehouse</li>
                          <li>• Pendapatan Sewa Rak</li>
                          <li>• HPP Warehouse</li>
                          <li>• Beban Operasional Warehouse</li>
                          <li>• Penyusutan Warehouse</li>
                        </>
                      )}
                      {engineForm.type === "DRIVER" && (
                        <>
                          <li>• Pendapatan Driver</li>
                          <li>• Beban Driver</li>
                        </>
                      )}
                      {engineForm.type === "BARANG" && (
                        <>
                          <li>• Persediaan Barang</li>
                          <li>• Pendapatan Barang</li>
                          <li>• HPP Barang</li>
                          <li>• Beban Komisi</li>
                          <li>• Beban Operasional Barang</li>
                        </>
                      )}
                      {engineForm.type === "JASA" && (
                        <>
                          <li>• Pendapatan Jasa</li>
                          <li>• Beban Langsung Jasa</li>
                          <li>• Beban Komisi Jasa</li>
                          <li>• Beban Operasional Jasa</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isEngineLoading || !canEdit(userRole)}
                      className="bg-yellow-500 hover:bg-yellow-600"
                    >
                      {isEngineLoading ? (
                        <>Membuat COA...</>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Generate COA
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>

            {/* Import CSV Tab */}
            <TabsContent value="import" className="space-y-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    Import COA dari CSV
                  </h2>
                  <p className="text-slate-600 text-sm">
                    Upload file CSV untuk mengimpor data Chart of Accounts secara massal.
                    Data yang sudah ada akan di-update (UPSERT).
                  </p>
                </div>

                <div className="space-y-6">
                  {/* CSV Format Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Format CSV yang Diharapkan:</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      File CSV harus memiliki kolom-kolom berikut (header wajib):
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-blue-600">
                      <span className="bg-blue-100 px-2 py-1 rounded">account_code *</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">account_name *</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">account_type</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">level</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">is_header</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">normal_balance</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">description</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">is_active</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">kategori_layanan</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">jenis_layanan</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">balance</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">current_balance</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">created_by</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">trans_type</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">flow_type</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">usage_role</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">parent_code</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">status</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">* Kolom wajib diisi</p>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="csv-file">Pilih File CSV</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setCsvFile(file || null);
                        setImportResult(null);
                      }}
                      className="cursor-pointer"
                    />
                    {csvFile && (
                      <p className="text-sm text-slate-600">
                        File dipilih: <span className="font-medium">{csvFile.name}</span> ({(csvFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>

                  {/* Import Button */}
                  <Button
                    onClick={async () => {
                      if (!csvFile) {
                        toast({
                          title: "Error",
                          description: "Pilih file CSV terlebih dahulu",
                          variant: "destructive",
                        });
                        return;
                      }

                      setIsImporting(true);
                      setImportResult(null);

                      try {
                        // Parse CSV file
                        const text = await csvFile.text();
                        const lines = text.split("\n").filter(line => line.trim());
                        
                        if (lines.length < 2) {
                          throw new Error("File CSV kosong atau tidak memiliki data");
                        }

                        // Parse header
                        const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
                        
                        // Parse data rows
                        const csvData = [];
                        for (let i = 1; i < lines.length; i++) {
                          const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
                          if (values.length >= 2) {
                            const row: Record<string, string> = {};
                            headers.forEach((header, index) => {
                              row[header] = values[index] || "";
                            });
                            csvData.push(row);
                          }
                        }

                        if (csvData.length === 0) {
                          throw new Error("Tidak ada data valid dalam file CSV");
                        }

                        // Call Edge Function
                        const { data, error } = await supabase.functions.invoke(
                          "supabase-functions-import-coa-csv",
                          {
                            body: { csv_data: csvData },
                          }
                        );

                        if (error) throw error;

                        setImportResult(data);
                        
                        if (data.success) {
                          toast({
                            title: "Berhasil",
                            description: `${data.records_processed} record berhasil diimpor`,
                          });
                          fetchCoaAccounts();
                        } else {
                          throw new Error(data.error || "Import gagal");
                        }
                      } catch (error: any) {
                        console.error("Import error:", error);
                        setImportResult({
                          success: false,
                          message: error.message || "Terjadi kesalahan saat import",
                        });
                        toast({
                          title: "Error",
                          description: error.message || "Gagal mengimpor data COA",
                          variant: "destructive",
                        });
                      } finally {
                        setIsImporting(false);
                      }
                    }}
                    disabled={!csvFile || isImporting}
                    className="w-full"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mengimpor...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                      </>
                    )}
                  </Button>

                  {/* Import Result */}
                  {importResult && (
                    <div className={`p-4 rounded-lg ${importResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                      <h3 className={`font-medium mb-2 ${importResult.success ? "text-green-800" : "text-red-800"}`}>
                        {importResult.success ? "✅ Import Berhasil" : "❌ Import Gagal"}
                      </h3>
                      {importResult.success ? (
                        <div className="text-sm text-green-700 space-y-1">
                          <p>Record diproses: <span className="font-medium">{importResult.records_processed}</span></p>
                          <p>Record dilewati: <span className="font-medium">{importResult.records_skipped}</span></p>
                          <p>Total COA di database: <span className="font-medium">{importResult.total_coa_rows}</span></p>
                        </div>
                      ) : (
                        <p className="text-sm text-red-700">{importResult.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
