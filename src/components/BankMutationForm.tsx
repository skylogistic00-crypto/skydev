import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AlertCircle, CheckCircle2, Loader2, Upload, FileSpreadsheet, Trash2, Check } from "lucide-react";

interface BankAccount {
  id: string;
  account_code: string;
  account_name: string;
}

interface COAAccount {
  id: string;
  account_code: string;
  account_name: string;
}

interface MutationRow {
  id: string;
  tanggal: string;
  keterangan: string;
  debit: number;
  kredit: number;
  saldo: number;
  debit_account_id: string;
  kredit_account_id: string;
  debit_account_name?: string;
  kredit_account_name?: string;
}

export default function BankMutationForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [coaAccounts, setCoaAccounts] = useState<COAAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [mutations, setMutations] = useState<MutationRow[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState("");

  const [formData, setFormData] = useState({
    mutation_date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    selectedBankAccount: "",
    selectedExpenseAccount: "",
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoadingAccounts(true);

      // Load bank accounts (1-12xx)
      const { data: banks, error: banksError } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name")
        .like("account_code", "1-12%")
        .order("account_code");

      if (banksError) throw banksError;
      setBankAccounts(banks || []);

      // Load all COA accounts for dropdown
      const { data: coa, error: coaError } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name")
        .order("account_code");

      if (coaError) throw coaError;
      setCoaAccounts(coa || []);
    } catch (error) {
      console.error("Error loading accounts:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data akun",
        variant: "destructive",
      });
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedBankAccount) {
      toast({
        title: "Error",
        description: "Pilih akun bank terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      const selectedBank = bankAccounts.find((b) => b.id === selectedBankAccount);
      if (!selectedBank) {
        throw new Error("Akun bank tidak ditemukan");
      }

      // Parse file locally (tanpa edge function)
      await handleLocalParsing(file, selectedBank);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLocalParsing = async (file: File, selectedBank: BankAccount) => {
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error("File kosong atau format tidak valid");
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const parsedMutations: MutationRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || "";
      });

      parsedMutations.push({
        id: `temp-${i}`,
        tanggal: row.tanggal || row.date || row.tgl || "",
        keterangan: row.keterangan || row.description || row.ket || row.uraian || "",
        debit: parseFloat(row.debit || row.db || "0") || 0,
        kredit: parseFloat(row.kredit || row.credit || row.cr || row.kr || "0") || 0,
        saldo: parseFloat(row.saldo || row.balance || "0") || 0,
        debit_account_id: "",
        kredit_account_id: selectedBankAccount,
        debit_account_name: "",
        kredit_account_name: selectedBank.account_name,
      });
    }

    setMutations(parsedMutations);

    toast({
      title: "Berhasil",
      description: `${parsedMutations.length} baris mutasi berhasil diupload (local parsing)`,
    });
  };

  const callAIMapping = async (uploadId: string, mutationsData: MutationRow[]) => {
    try {
      // Local keyword-based mapping (tanpa edge function)
      const suggestAccount = (description: string, isDebit: boolean): string | null => {
        const desc = description.toLowerCase();
        
        // Find matching account from coaAccounts based on keywords
        if (desc.includes("gaji") || desc.includes("salary")) {
          const acc = coaAccounts.find((a) => a.account_code?.startsWith("6-1") && a.account_name?.toLowerCase().includes("gaji"));
          return acc?.id || null;
        }
        if (desc.includes("listrik") || desc.includes("pln")) {
          const acc = coaAccounts.find((a) => a.account_name?.toLowerCase().includes("listrik"));
          return acc?.id || null;
        }
        if (desc.includes("sewa") || desc.includes("rent")) {
          const acc = coaAccounts.find((a) => a.account_name?.toLowerCase().includes("sewa"));
          return acc?.id || null;
        }
        if (desc.includes("penjualan") || desc.includes("sales") || desc.includes("pendapatan")) {
          const acc = coaAccounts.find((a) => a.account_code?.startsWith("4-") && a.account_name?.toLowerCase().includes("penjualan"));
          return acc?.id || null;
        }
        if (desc.includes("pembelian") || desc.includes("purchase")) {
          const acc = coaAccounts.find((a) => a.account_code?.startsWith("5-"));
          return acc?.id || null;
        }
        
        // Default: find beban lain-lain or pendapatan lain-lain
        if (isDebit) {
          const acc = coaAccounts.find((a) => a.account_code?.startsWith("6-9") || a.account_name?.toLowerCase().includes("beban lain"));
          return acc?.id || null;
        } else {
          const acc = coaAccounts.find((a) => a.account_code?.startsWith("4-9") || a.account_name?.toLowerCase().includes("pendapatan lain"));
          return acc?.id || null;
        }
      };

      // Map mutations locally
      setMutations((prev) =>
        prev.map((row) => {
          const isDebit = row.debit > 0;
          const suggestedAccountId = suggestAccount(row.keterangan, isDebit);
          if (suggestedAccountId) {
            const account = coaAccounts.find((a) => a.id === suggestedAccountId);
            return {
              ...row,
              debit_account_id: isDebit ? suggestedAccountId : row.debit_account_id,
              debit_account_name: isDebit ? account?.account_name || "" : row.debit_account_name,
            };
          }
          return row;
        })
      );

      toast({
        title: "AI Mapping",
        description: "Akun berhasil disarankan secara otomatis",
      });
    } catch (error) {
      console.error("AI mapping error:", error);
    }
  };

  const handleAccountChange = (rowId: string, field: "debit_account_id" | "kredit_account_id", value: string) => {
    setMutations((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          const account = coaAccounts.find((a) => a.id === value);
          return {
            ...row,
            [field]: value,
            [`${field.replace("_id", "_name")}`]: account?.account_name || "",
          };
        }
        return row;
      })
    );
  };

  const handleDeleteRow = (rowId: string) => {
    setMutations((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleApproveAll = async () => {
    try {
      if (mutations.length === 0) {
        throw new Error("Tidak ada data mutasi untuk diposting");
      }

      // Validate all rows have accounts
      const invalidRows = mutations.filter((row) => !row.debit_account_id || !row.kredit_account_id);
      if (invalidRows.length > 0) {
        throw new Error(`${invalidRows.length} baris belum memiliki akun lengkap`);
      }

      setLoading(true);

      // Post to journal_entries
      const journalEntries = mutations.map((row) => ({
        entry_date: row.tanggal,
        description: row.keterangan,
        debit_account_id: row.debit_account_id,
        credit_account_id: row.kredit_account_id,
        amount: row.debit > 0 ? row.debit : row.kredit,
        created_by: user?.id,
        source: "bank_mutation",
        approval_status: "approved",
      }));

      const { error: journalError } = await supabase.from("journal_entries").insert(journalEntries);

      if (journalError) throw journalError;

      toast({
        title: "Berhasil",
        description: `${mutations.length} mutasi berhasil diposting ke jurnal`,
      });

      // Clear mutations
      setMutations([]);
    } catch (error: any) {
      console.error("Approve error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal posting mutasi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ WAJIB: Pastikan user sudah login
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User belum login. Silakan login terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    console.log("AUTH USER:", user);

    try {
      if (!formData.selectedBankAccount || !formData.selectedExpenseAccount) {
        throw new Error("Pilih akun bank dan akun beban");
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error("Nominal harus lebih dari 0");
      }

      if (!formData.description.trim()) {
        throw new Error("Deskripsi wajib diisi");
      }

      setLoading(true);

      const selectedBank = bankAccounts.find(
        (b) => b.account_code === formData.selectedBankAccount
      );
      const selectedExpense = coaAccounts.find(
        (e) => e.account_code === formData.selectedExpenseAccount
      );

      if (!selectedBank || !selectedExpense) {
        throw new Error("Akun tidak ditemukan");
      }

      const { data: uploadBatch, error: uploadErr } = await supabase
        .from("bank_mutation_uploads")
        .insert({
          file_name: "Manual Bank Transaction",
          file_type: "manual",
          bank_name: selectedBank.account_name,
          status: "posted",
          original_filename: "Manual Bank Transaction", // ✅ WAJIB: original_filename (NOT NULL)
          user_id: user.id, // ✅ WAJIB: user_id (NOT NULL)
          created_by: user.id,
          bank_account_id: selectedBank.id,
          bank_account_code: selectedBank.account_code,
          bank_account_name: selectedBank.account_name,
          file_size: 0, // ✅ WAJIB: file_size (NOT NULL) - manual entry
          mime_type: "application/json", // ✅ WAJIB: mime_type (NOT NULL) - manual entry
        })
        .select()
        .single();

      if (uploadErr) {
        console.error("Upload batch error:", uploadErr);
        throw new Error("Gagal membuat upload batch bank");
      }

      console.log("Upload batch created:", uploadBatch);

      const { data: bankMutation, error: bankErr } = await supabase
        .from("bank_mutations")
        .insert({
          upload_id: uploadBatch.id,
          mutation_date: formData.mutation_date,
          description: formData.description,
          debit: parseFloat(formData.amount),
          credit: 0,
          kas_bank: selectedBank.account_code,
          akun: selectedExpense.account_code,
          approval_status: "approved",
          user_id: user.id, // ✅ WAJIB: user_id (NOT NULL constraint)
          created_by: user.id,
          bank_name: selectedBank.account_name, // ✅ WAJIB: bank_name (NOT NULL constraint)
          bank_account_id: selectedBank.id,
          bank_account_code: selectedBank.account_code,
          bank_account_name: selectedBank.account_name,
          transaction_date: formData.mutation_date, // ✅ WAJIB: transaction_date (NOT NULL constraint)
          transaction_type: "expense", // ✅ WAJIB: transaction_type (NOT NULL constraint)
        })
        .select()
        .single();

      if (bankErr) {
        console.error("Bank mutation insert error:", bankErr);
        throw new Error("Gagal menyimpan bank mutation");
      }

      console.log("Bank mutation saved successfully:", bankMutation);

      const { data: postResult, error: postErr } = await supabase.rpc(
        "post_journal_bank_mutation",
        {
          p_bank_mutation_id: bankMutation.id,
        }
      );

      if (postErr) {
        console.error("Post journal error:", postErr);
        throw new Error("Gagal posting jurnal bank");
      }

      console.log("Journal posted for bank mutation");

      toast({
        title: "Berhasil",
        description: "Mutasi bank berhasil disimpan dan diposting",
      });

      setFormData({
        mutation_date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        selectedBankAccount: "",
        selectedExpenseAccount: "",
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Gagal",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingAccounts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6" />
              Upload Mutasi Bank
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Bank Account Selection */}
            <div>
              <Label htmlFor="bank-account">Pilih Akun Bank</Label>
              <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                <SelectTrigger id="bank-account">
                  <SelectValue placeholder="Pilih akun bank..." />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.account_code} - {bank.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div>
              <Label htmlFor="file-upload">Upload File Mutasi (CSV/Excel)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={!selectedBankAccount || uploading}
                />
                {uploading && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Format: tanggal, keterangan, debit, kredit, saldo
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mutations Table */}
        {mutations.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Data Mutasi ({mutations.length} baris)</CardTitle>
                <Button onClick={handleApproveAll} disabled={loading} className="bg-green-600 hover:bg-green-700">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Approve & Post Semua
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Kredit</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead>Akun Debit</TableHead>
                      <TableHead>Akun Kredit</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mutations.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap">{row.tanggal}</TableCell>
                        <TableCell className="max-w-xs truncate">{row.keterangan}</TableCell>
                        <TableCell className="text-right">
                          {row.debit > 0 ? row.debit.toLocaleString("id-ID") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.kredit > 0 ? row.kredit.toLocaleString("id-ID") : "-"}
                        </TableCell>
                        <TableCell className="text-right">{row.saldo.toLocaleString("id-ID")}</TableCell>
                        <TableCell>
                          <Select
                            value={row.debit_account_id}
                            onValueChange={(value) => handleAccountChange(row.id, "debit_account_id", value)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Pilih akun..." />
                            </SelectTrigger>
                            <SelectContent>
                              {coaAccounts.map((acc) => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.account_code} - {acc.account_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.kredit_account_id}
                            onValueChange={(value) => handleAccountChange(row.id, "kredit_account_id", value)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Pilih akun..." />
                            </SelectTrigger>
                            <SelectContent>
                              {coaAccounts.map((acc) => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.account_code} - {acc.account_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRow(row.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
