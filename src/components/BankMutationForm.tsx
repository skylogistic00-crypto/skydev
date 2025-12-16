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
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface BankAccount {
  id: string;
  account_code: string;
  account_name: string;
}

interface ExpenseAccount {
  id: string;
  account_code: string;
  account_name: string;
}

export default function BankMutationForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<ExpenseAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

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

      const { data: banks, error: banksError } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name")
        .like("account_code", "1-12%")
        .order("account_code");

      if (banksError) throw banksError;
      setBankAccounts(banks || []);

      const { data: expenses, error: expensesError } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name")
        .like("account_code", "6-%")
        .order("account_code");

      if (expensesError) throw expensesError;
      setExpenseAccounts(expenses || []);
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const selectedExpense = expenseAccounts.find(
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
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6" />
              Mutasi Bank
            </CardTitle>
            <p className="text-sm text-blue-100 mt-2">
              Input pengeluaran melalui bank dengan posting otomatis ke jurnal
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="mutation_date">Tanggal Mutasi</Label>
                <Input
                  id="mutation_date"
                  type="date"
                  value={formData.mutation_date}
                  onChange={(e) =>
                    handleInputChange("mutation_date", e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank">Akun Bank</Label>
                <Select
                  value={formData.selectedBankAccount}
                  onValueChange={(value) =>
                    handleInputChange("selectedBankAccount", value)
                  }
                >
                  <SelectTrigger id="bank">
                    <SelectValue placeholder="Pilih akun bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((bank) => (
                      <SelectItem key={bank.id} value={bank.account_code}>
                        {bank.account_code} - {bank.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense">Akun Beban</Label>
                <Select
                  value={formData.selectedExpenseAccount}
                  onValueChange={(value) =>
                    handleInputChange("selectedExpenseAccount", value)
                  }
                >
                  <SelectTrigger id="expense">
                    <SelectValue placeholder="Pilih akun beban" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseAccounts.map((expense) => (
                      <SelectItem key={expense.id} value={expense.account_code}>
                        {expense.account_code} - {expense.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Nominal</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Contoh: Pembayaran listrik bulan Januari"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={4}
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold">Informasi:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Mutasi bank akan otomatis diposting ke jurnal</li>
                    <li>Status approval langsung &quot;approved&quot;</li>
                    <li>Tidak perlu approval manual</li>
                  </ul>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Mutasi Bank"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
