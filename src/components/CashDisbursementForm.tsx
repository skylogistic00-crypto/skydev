// CASH DISBURSEMENT — FINAL (KAS ONLY)
// Tidak ada BANK, tidak ada TRANSFER, tidak ada GIRO

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

export default function CashDisbursementForm({ onSuccess }) {
  const { toast } = useToast();

  const [transactionDate, setTransactionDate] = useState(new Date());
  const [payeeName, setPayeeName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [cashAccounts, setCashAccounts] = useState([]);
  const [expenseAccounts, setExpenseAccounts] = useState([]);

  const [cashAccountId, setCashAccountId] = useState("");
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

    const kas = data.filter(a => a.account_code.startsWith("1-11"));
    const beban = data.filter(a => a.account_code.startsWith("6-"));

    setCashAccounts(kas);
    setExpenseAccounts(beban);

    if (kas[0]) setCashAccountId(kas[0].id);
    if (beban[0]) setExpenseAccountId(beban[0].id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!payeeName || !description || !amount) {
      return toast({
        title: "Data belum lengkap",
        description: "Nama, deskripsi, dan jumlah wajib diisi",
        variant: "destructive",
      });
    }

    setSaving(true);

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;

    const payload = {
      transaction_date: format(transactionDate, "yyyy-MM-dd"),
      payee_name: payeeName,
      description,
      category,
      amount: Number(amount),
      tax_amount: taxAmount ? Number(taxAmount) : 0,

      // 🔒 KAS ONLY
      coa_cash_id: cashAccountId,
      coa_expense_id: expenseAccountId,
      cash_account_id: cashAccountId,

      notes: notes || null,
      created_by: userId,
      approval_status: "approved",
    };

    const { error } = await supabase
      .from("cash_disbursement")
      .insert(payload);

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Berhasil", description: "Pengeluaran kas tersimpan" });
    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengeluaran Kas</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          <Label>Tanggal</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(transactionDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar mode="single" selected={transactionDate} onSelect={setTransactionDate} />
            </PopoverContent>
          </Popover>

          <Label>Nama Penerima</Label>
          <Input value={payeeName} onChange={e => setPayeeName(e.target.value)} />

          <Label>Akun Kas</Label>
          <Select value={cashAccountId} onValueChange={setCashAccountId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {cashAccounts.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  {a.account_code} - {a.account_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label>Akun Beban</Label>
          <Select value={expenseAccountId} onValueChange={setExpenseAccountId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {expenseAccounts.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  {a.account_code} - {a.account_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label>Jumlah</Label>
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} />

          <Label>Catatan</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} />

          <Button disabled={saving} type="submit">
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}
