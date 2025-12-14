import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type TransactionType = "Penerimaan" | "Pengeluaran";

interface COAAccount {
  id: string;
  account_name: string;
  account_type: string;
  account_code?: string;
}

interface JournalEntry {
  id?: string;
  journal_ref: string;
  account_id: string;
  debit: number;
  credit: number;
  description: string;
  tanggal: string;
  created_at?: string;
}

const allowedAccountTypes: Record<TransactionType, string[]> = {
  Penerimaan: ["Pendapatan", "Aset", "Kewajiban", "Ekuitas"],
  Pengeluaran: ["Beban", "Aset", "Kewajiban", "Ekuitas"],
};

export default function TransaksiKeuanganModule() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [kasBankAccounts, setKasBankAccounts] = useState<COAAccount[]>([]);
  const [lawanAccounts, setLawanAccounts] = useState<COAAccount[]>([]);
  const [recentJournals, setRecentJournals] = useState<JournalEntry[]>([]);
  const [warning, setWarning] = useState<string | null>(null);

  // Form state
  const [transactionType, setTransactionType] =
    useState<TransactionType>("Penerimaan");
  const [paymentMethod, setPaymentMethod] = useState<string>("Kas");
  const [kasBankAccountId, setKasBankAccountId] = useState<string>("");
  const [lawanAccountType, setLawanAccountType] = useState<string>("");
  const [lawanAccountId, setLawanAccountId] = useState<string>("");
  const [nominal, setNominal] = useState<string>("");
  const [tanggal, setTanggal] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState<string>("");

  // Load Kas/Bank accounts on mount
  useEffect(() => {
    fetchKasBankAccounts();
    fetchRecentJournals();
  }, []);

  // Reset lawan account when transaction type changes
  useEffect(() => {
    setLawanAccountType("");
    setLawanAccountId("");
    setLawanAccounts([]);
    setWarning(null);
  }, [transactionType]);

  // Fetch lawan accounts when account type changes
  useEffect(() => {
    if (lawanAccountType) {
      fetchLawanAccounts(lawanAccountType);
    } else {
      setLawanAccounts([]);
    }
  }, [lawanAccountType]);

  const fetchKasBankAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-transaksi-keuangan-journal",
        {
          body: { action: "fetch_kas_bank_accounts" },
        }
      );

      if (error) throw error;

      if (data?.success && data?.data) {
        setKasBankAccounts(data.data);
      }
    } catch (error) {
      console.error("Error fetching Kas/Bank accounts:", error);
      toast({
        title: "Error",
        description: "Gagal memuat akun Kas/Bank",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLawanAccounts = async (accountType: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-transaksi-keuangan-journal",
        {
          body: { action: "fetch_lawan_accounts", account_type: accountType },
        }
      );

      if (error) throw error;

      if (data?.success && data?.data) {
        setLawanAccounts(data.data);
      }
    } catch (error) {
      console.error("Error fetching lawan accounts:", error);
      toast({
        title: "Error",
        description: "Gagal memuat akun lawan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentJournals = async () => {
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecentJournals(data || []);
    } catch (error) {
      console.error("Error fetching recent journals:", error);
    }
  };

  const validateForm = (): boolean => {
    if (!kasBankAccountId) {
      setWarning("Pilih akun Kas/Bank terlebih dahulu");
      return false;
    }
    if (!lawanAccountType) {
      setWarning("Pilih tipe akun lawan terlebih dahulu");
      return false;
    }
    if (!lawanAccountId) {
      setWarning("Pilih akun lawan terlebih dahulu");
      return false;
    }
    if (!nominal || parseFloat(nominal) <= 0) {
      setWarning("Nominal harus lebih dari 0");
      return false;
    }
    if (!tanggal) {
      setWarning("Tanggal harus diisi");
      return false;
    }

    // Validate account type matches transaction type
    const allowed = allowedAccountTypes[transactionType];
    const selectedLawanAccount = lawanAccounts.find(
      (acc) => acc.id === lawanAccountId
    );
    if (selectedLawanAccount) {
      const isAllowed = allowed.some(
        (type) =>
          selectedLawanAccount.account_type
            .toLowerCase()
            .includes(type.toLowerCase()) ||
          type
            .toLowerCase()
            .includes(selectedLawanAccount.account_type.toLowerCase())
      );
      if (!isAllowed) {
        setWarning(
          `Akun lawan tidak cocok dengan jenis transaksi. Untuk ${transactionType}, account_type harus salah satu dari: ${allowed.join(", ")}`
        );
        return false;
      }
    }

    setWarning(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const selectedLawanAccount = lawanAccounts.find(
        (acc) => acc.id === lawanAccountId
      );

      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-transaksi-keuangan-journal",
        {
          body: {
            action: "create_journal",
            transaction_type: transactionType,
            kas_bank_account_id: kasBankAccountId,
            lawan_account_id: lawanAccountId,
            lawan_account_type: selectedLawanAccount?.account_type || "",
            nominal: parseFloat(nominal),
            description: description,
            date: tanggal,
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Berhasil",
          description: `Jurnal ${data.journal_ref} berhasil dibuat`,
        });

        // Reset form
        setKasBankAccountId("");
        setLawanAccountType("");
        setLawanAccountId("");
        setNominal("");
        setDescription("");
        setTanggal(new Date().toISOString().split("T")[0]);

        // Refresh journals
        fetchRecentJournals();
      } else {
        throw new Error(data?.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error creating journal:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal membuat jurnal",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSelectedKasBankAccount = () => {
    return kasBankAccounts.find((acc) => acc.id === kasBankAccountId);
  };

  const getSelectedLawanAccount = () => {
    return lawanAccounts.find((acc) => acc.id === lawanAccountId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Transaksi Keuangan
            </h1>
            <p className="text-gray-600 mt-1">
              Modul Penerimaan & Pengeluaran Kas/Bank dengan Jurnal Otomatis
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              fetchKasBankAccounts();
              fetchRecentJournals();
            }}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Card */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Input Transaksi Baru
              </CardTitle>
              <CardDescription className="text-indigo-100">
                Pilih jenis transaksi dan isi detail transaksi
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Warning Alert */}
              {warning && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              )}

              {/* Transaction Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Jenis Transaksi *</Label>
                <Select
                  value={transactionType}
                  onValueChange={(value: TransactionType) =>
                    setTransactionType(value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih jenis transaksi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Penerimaan">
                      <div className="flex items-center gap-2">
                        <ArrowDownCircle className="h-4 w-4 text-green-600" />
                        Penerimaan Kas/Bank
                      </div>
                    </SelectItem>
                    <SelectItem value="Pengeluaran">
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4 text-red-600" />
                        Pengeluaran Kas/Bank
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Metode Pembayaran</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih metode pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kas">Kas</SelectItem>
                    <SelectItem value="Bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Kas/Bank Account */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Akun Kas/Bank *</Label>
                <Select
                  value={kasBankAccountId}
                  onValueChange={setKasBankAccountId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih akun Kas/Bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {kasBankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lawan Account Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Tipe Akun Lawan *
                </Label>
                <Select
                  value={lawanAccountType}
                  onValueChange={setLawanAccountType}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih tipe akun lawan" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedAccountTypes[transactionType].map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {transactionType === "Penerimaan"
                    ? "Untuk penerimaan: Pendapatan, Aset (Piutang), Kewajiban, Ekuitas"
                    : "Untuk pengeluaran: Beban, Aset, Kewajiban, Ekuitas (Prive)"}
                </p>
              </div>

              {/* Lawan Account Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Akun Lawan *</Label>
                <Select
                  value={lawanAccountId}
                  onValueChange={setLawanAccountId}
                  disabled={!lawanAccountType || lawanAccounts.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        lawanAccountType
                          ? "Pilih akun lawan"
                          : "Pilih tipe akun terlebih dahulu"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {lawanAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nominal */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nominal *</Label>
                <Input
                  type="number"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  placeholder="Masukkan nominal"
                  min="0"
                />
              </div>

              {/* Tanggal */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tanggal *</Label>
                <Input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Deskripsi</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Masukkan deskripsi transaksi"
                  rows={3}
                />
              </div>

              {/* Journal Preview */}
              {kasBankAccountId && lawanAccountId && nominal && (
                <Card className="bg-gray-50 border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Preview Jurnal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                        <span className="font-medium">DEBIT:</span>
                        <span>
                          {transactionType === "Penerimaan"
                            ? getSelectedKasBankAccount()?.account_name
                            : getSelectedLawanAccount()?.account_name}
                        </span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(parseFloat(nominal) || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span className="font-medium">KREDIT:</span>
                        <span>
                          {transactionType === "Penerimaan"
                            ? getSelectedLawanAccount()?.account_name
                            : getSelectedKasBankAccount()?.account_name}
                        </span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(parseFloat(nominal) || 0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Submit Button */}
              <Button
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Simpan Transaksi & Buat Jurnal
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Journals Card */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
              <CardTitle>Jurnal Terbaru</CardTitle>
              <CardDescription className="text-emerald-100">
                20 jurnal terakhir yang dibuat
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead>Ref</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Kredit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentJournals.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-gray-500 py-8"
                        >
                          Belum ada jurnal
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentJournals.map((journal, index) => (
                        <TableRow key={journal.id || index}>
                          <TableCell className="font-mono text-xs">
                            {journal.journal_ref?.substring(0, 15) || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {journal.tanggal
                              ? new Date(journal.tanggal).toLocaleDateString(
                                  "id-ID"
                                )
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {journal.debit > 0 ? (
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700"
                              >
                                {formatCurrency(journal.debit)}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {journal.credit > 0 ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700"
                              >
                                {formatCurrency(journal.credit)}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Aturan Jurnal Otomatis:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700">
                  <li>
                    <strong>Penerimaan Kas/Bank:</strong> Debit Kas/Bank, Kredit
                    Akun Lawan (Pendapatan/Piutang/Kewajiban/Ekuitas)
                  </li>
                  <li>
                    <strong>Pengeluaran Kas/Bank:</strong> Debit Akun Lawan
                    (Beban/Aset/Kewajiban/Ekuitas), Kredit Kas/Bank
                  </li>
                  <li>
                    Setiap transaksi menghasilkan tepat 2 jurnal entry (Debit &
                    Kredit)
                  </li>
                  <li>
                    General Ledger (GL) akan terisi otomatis melalui trigger
                    Supabase
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
