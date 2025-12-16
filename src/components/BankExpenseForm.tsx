// BANK EXPENSE FORM — UNTUK PENGELUARAN BANK SAJA
// Tidak ada KAS, tidak ada CASH, tidak ada TUNAI

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface BankExpenseFormProps {
  onSuccess?: () => void;
}

export default function BankExpenseForm({ onSuccess }: BankExpenseFormProps) {
  const { toast } = useToast();

  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [payeeName, setPayeeName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<any[]>([]);

  const [bankAccountId, setBankAccountId] = useState("");
  const [expenseAccountId, setExpenseAccountId] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCOA();
  }, []);

  const loadCOA = async () => {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .order("account_code");

    if (error) {
      toast({ title: "Error", description: "Gagal load COA", variant: "destructive" });
      return;
    }

    // 🔒 BANK ONLY - akun bank (1-12xx)
    const bank = data.filter((a: any) => a.account_code.startsWith("1-12"));
    const beban = data.filter((a: any) => a.account_code.startsWith("6-"));

    setBankAccounts(bank);
    setExpenseAccounts(beban);

    if (bank[0]) setBankAccountId(bank[0].id);
    if (beban[0]) setExpenseAccountId(beban[0].id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!payeeName || !description || !amount) {
      return toast({
        title: "Data belum lengkap",
        description: "Nama, deskripsi, dan jumlah wajib diisi",
        variant: "destructive",
      });
    }

    if (!bankAccountId) {
      return toast({
        title: "Rekening Bank wajib dipilih",
        description: "Pilih rekening bank untuk pengeluaran",
        variant: "destructive",
      });
    }

    setSaving(true);

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;

    // Get bank account details
    const selectedBank = bankAccounts.find((b: any) => b.id === bankAccountId);
    const selectedExpense = expenseAccounts.find((e: any) => e.id === expenseAccountId);

    // 🔒 BANK EXPENSE → langsung ke journal_entries
    const { error } = await supabase
      .from("journal_entries")
      .insert({
        transaction_date: format(transactionDate, "yyyy-MM-dd"),
        account_code: selectedExpense?.account_code || "6-1100",
        account_name: selectedExpense?.account_name || "Beban",
        account_type: selectedExpense?.account_type || "Expense",
        debit: Number(amount),
        credit: 0,
        description: description,
        source: "bank_expense_form",
        // 🔒 BANK ONLY
        payment_method: "bank",
        bank_account: selectedBank?.account_code || "",
        jenis_transaksi: "Pengeluaran Bank",
        kategori: category,
        approval_status: "approved",
        created_by: userId,
      });

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Berhasil", description: "Pengeluaran bank tersimpan" });
    
    // Reset form
    setPayeeName("");
    setDescription("");
    setCategory("");
    setAmount("");
    setNotes("");
    
    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengeluaran Bank</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(transactionDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar 
                  mode="single" 
                  selected={transactionDate} 
                  onSelect={(date) => date && setTransactionDate(date)} 
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Nama Penerima</Label>
            <Input value={payeeName} onChange={e => setPayeeName(e.target.value)} placeholder="Nama penerima pembayaran" />
          </div>

          <div className="space-y-2">
            <Label>Rekening Bank *</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger><SelectValue placeholder="Pilih rekening bank" /></SelectTrigger>
              <SelectContent>
                {bankAccounts.map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.account_code} - {a.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Akun Beban</Label>
            <Select value={expenseAccountId} onValueChange={setExpenseAccountId}>
              <SelectTrigger><SelectValue placeholder="Pilih akun beban" /></SelectTrigger>
              <SelectContent>
                {expenseAccounts.map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.account_code} - {a.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Kategori</Label>
            <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Kategori pengeluaran" />
          </div>

          <div className="space-y-2">
            <Label>Jumlah *</Label>
            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
          </div>

          <div className="space-y-2">
            <Label>Deskripsi *</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Keterangan pengeluaran" />
          </div>

          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tambahan (opsional)" />
          </div>

          <Button disabled={saving} type="submit" className="w-full">
            {saving ? "Menyimpan..." : "Simpan Pengeluaran Bank"}
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}
