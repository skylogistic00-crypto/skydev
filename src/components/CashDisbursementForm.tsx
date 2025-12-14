// FINAL VERSION — USES UUID FOR COA CASH & COA EXPENSE
// No more auto-BRI bug, correct bank mapping 100%

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [bankAccount, setBankAccount] = useState("");

  const [cashAccountId, setCashAccountId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");

  const [notes, setNotes] = useState("");

  const [coaExpenseId, setCoaExpenseId] = useState("");
  const [coaCashId, setCoaCashId] = useState(""); // UUID
  const [coaCashCode, setCoaCashCode] = useState(""); // read-only displayed code

  const [attachmentFile, setAttachmentFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [cashAccounts, setCashAccounts] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  useEffect(() => {
    loadCOA();
  }, []);

  const loadCOA = async () => {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .order("account_code");

    if (error) {
      toast({
        title: "❌ Error",
        description: "Gagal memuat COA",
        variant: "destructive",
      });
      return;
    }

    const expenses = data.filter((acc) => acc.account_code.startsWith("6-"));

    const cash = data.filter((acc) => acc.account_code.startsWith("1-11"));

    const banks = data.filter(
      (acc) =>
        acc.account_code.startsWith("1-1") &&
        !acc.account_code.startsWith("1-11"),
    );

    setExpenseAccounts(expenses);
    setCashAccounts(cash);
    setBankAccounts(banks);

    if (expenses.length > 0) setCoaExpenseId(expenses[0].id);

    if (cash.length > 0) {
      setCashAccountId(cash[0].id);
      setCoaCashId(cash[0].id);
      setCoaCashCode(cash[0].account_code);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) setAttachmentFile(file);
  };

  const uploadAttachment = async () => {
    if (!attachmentFile) return null;

    setUploading(true);

    const ext = attachmentFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;
    const filePath = `cash-disbursements/${fileName}`;

    const { error } = await supabase.storage
      .from("documents")
      .upload(filePath, attachmentFile);

    setUploading(false);

    if (error) return null;

    const { data } = supabase.storage.from("documents").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!payeeName || !description || !amount) {
      return toast({
        title: "⚠️ Data tidak lengkap",
        description: "Nama penerima, deskripsi, dan jumlah wajib diisi",
        variant: "destructive",
      });
    }

    setSaving(true);

    const attachmentUrl = attachmentFile ? await uploadAttachment() : null;

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;

    let finalCashId = coaCashId;

    if (paymentMethod !== "Tunai") {
      const b = bankAccounts.find((x) => x.id === bankAccountId);
      if (b) {
        finalCashId = b.id;
        setCoaCashCode(b.account_code);
      }
    }

    const payload = {
      transaction_date: format(transactionDate, "yyyy-MM-dd"),
      payee_name,
      description,
      category,
      amount: Number(amount),
      tax_amount: taxAmount ? Number(taxAmount) : 0,
      payment_method: paymentMethod,
      bank_account: bankAccount || null,

      // UUID, not text!
      coa_cash_id: finalCashId,
      coa_expense_id: coaExpenseId,

      cash_account_id: paymentMethod === "Tunai" ? cashAccountId : null,
      bank_account_id: paymentMethod !== "Tunai" ? bankAccountId : null,

      notes: notes || null,
      attachment_url: attachmentUrl,
      created_by: userId,
      approval_status: "approved",
    };

    const { error } = await supabase.from("cash_disbursement").insert(payload);

    setSaving(false);

    if (error) {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "✅ Berhasil",
      description: "Pengeluaran kas berhasil disimpan",
    });

    if (onSuccess) onSuccess();
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader className="bg-gradient-to-r from-red-500 to-red-600">
        <CardTitle className="text-white text-xl">
          Form Pengeluaran Kas
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tanggal & pembayaran */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
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
                    onSelect={(d) => d && setTransactionDate(d)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Metode Pembayaran</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => {
                  setPaymentMethod(v);

                  if (v === "Tunai" && cashAccounts.length > 0) {
                    const acc = cashAccounts[0];
                    setCashAccountId(acc.id);
                    setCoaCashId(acc.id);
                    setCoaCashCode(acc.account_code);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tunai">Tunai</SelectItem>
                  <SelectItem value="Transfer Bank">Transfer Bank</SelectItem>
                  <SelectItem value="Cek">Cek</SelectItem>
                  <SelectItem value="Giro">Giro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Nama/Kategori */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nama Penerima *</Label>
              <Input
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
              />
            </div>
            <div>
              <Label>Kategori</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          {/* Jumlah */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Jumlah *</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Pajak</Label>
              <Input
                type="number"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
              />
            </div>
          </div>

          {/* BANK / KAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethod === "Tunai" ? (
              <div>
                <Label>Akun Kas</Label>
                <Select
                  value={cashAccountId}
                  onValueChange={(v) => {
                    const acc = cashAccounts.find((x) => x.id === v);
                    setCashAccountId(v);
                    setCoaCashId(v);
                    setCoaCashCode(acc?.account_code || "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih akun kas" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.account_code} - {acc.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div>
                  <Label>Akun Bank</Label>
                  <Select
                    value={bankAccountId}
                    onValueChange={(v) => {
                      const bank = bankAccounts.find((b) => b.id === v);
                      setBankAccountId(v);
                      setCoaCashId(v);
                      setCoaCashCode(bank?.account_code || "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih akun bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.account_code} - {acc.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Nomor Rekening</Label>
                  <Input
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Beban */}
          <div>
            <Label>Akun Beban</Label>
            <Select
              value={coaExpenseId}
              onValueChange={(v) => setCoaExpenseId(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {expenseAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.account_code} - {acc.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Display COA Kas selected */}
          <div>
            <Label>Akun Kas / Bank (otomatis)</Label>
            <Input value={coaCashCode} readOnly className="bg-gray-100" />
          </div>

          {/* Catatan */}
          <div>
            <Label>Catatan</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Lampiran */}
          <div>
            <Label>Lampiran</Label>
            <Input type="file" onChange={handleFile} />
            {attachmentFile && <p>{attachmentFile.name}</p>}
          </div>

          <div className="flex justify-end">
            <Button disabled={saving || uploading} type="submit">
              {saving ? "Menyimpan..." : "Simpan Pengeluaran"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
