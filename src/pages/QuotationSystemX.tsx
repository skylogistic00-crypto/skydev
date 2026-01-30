import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

type CurrencyX = {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  precision: number;
};

type PartnerX = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

type WarehouseX = {
  id: string;
  code: string;
  name: string;
};

type QuotationX = {
  id: string;
  quotation_no: string;
  customer_id: string;
  status: string;
  quotation_date: string;
  valid_until: string | null;
  currency_id: string;
  exchange_rate: string;
  warehouse_id: string | null;
  grand_total: string;
  created_at: string;
};

const defaultSeed = {
  currency: { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", precision: 0 },
  warehouse: { code: "WH-01", name: "Main Warehouse" },
  partner: { name: "PT Contoh Customer", email: "customer@example.com", phone: "" },
};

function generateDocNo(prefix: string) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${y}${m}${day}-${rand}`;
}

export default function QuotationSystemX() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [creating, setCreating] = useState(false);

  const [currencies, setCurrencies] = useState<CurrencyX[]>([]);
  const [partners, setPartners] = useState<PartnerX[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseX[]>([]);
  const [quotations, setQuotations] = useState<QuotationX[]>([]);

  const [customerId, setCustomerId] = useState<string>("");
  const [currencyId, setCurrencyId] = useState<string>("");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [validUntil, setValidUntil] = useState<string>("");
  const [grandTotal, setGrandTotal] = useState<string>("0");
  const [search, setSearch] = useState<string>("");

  const filteredQuotations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quotations;
    return quotations.filter((r) => r.quotation_no.toLowerCase().includes(q));
  }, [quotations, search]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [currRes, partnerRes, whRes, qRes] = await Promise.all([
        supabase
          .from("currenciesx")
          .select("id, code, name, symbol, precision")
          .order("code", { ascending: true }),
        supabase
          .from("partnersx")
          .select("id, name, email, phone")
          .eq("is_customer", true)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("warehousesx")
          .select("id, code, name")
          .order("code", { ascending: true }),
        supabase
          .from("quotationsx")
          .select(
            "id, quotation_no, customer_id, status, quotation_date, valid_until, currency_id, exchange_rate, warehouse_id, grand_total, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (currRes.error) throw currRes.error;
      if (partnerRes.error) throw partnerRes.error;
      if (whRes.error) throw whRes.error;
      if (qRes.error) throw qRes.error;

      setCurrencies(currRes.data ?? []);
      setPartners(partnerRes.data ?? []);
      setWarehouses(whRes.data ?? []);
      setQuotations(qRes.data ?? []);

      const firstCustomer = (partnerRes.data ?? [])[0]?.id ?? "";
      const firstCurrency = (currRes.data ?? [])[0]?.id ?? "";
      const firstWarehouse = (whRes.data ?? [])[0]?.id ?? "";

      setCustomerId((prev) => prev || firstCustomer);
      setCurrencyId((prev) => prev || firstCurrency);
      setWarehouseId((prev) => prev || firstWarehouse);
    } catch (e: any) {
      toast({
        title: "Gagal memuat data quotation system (x)",
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function seedMinimal() {
    setSeeding(true);
    try {
      const { data: existingCurrency, error: currencyCheckErr } = await supabase
        .from("currenciesx")
        .select("id")
        .eq("code", defaultSeed.currency.code)
        .maybeSingle();
      if (currencyCheckErr) throw currencyCheckErr;

      let currency = existingCurrency;
      if (!currency) {
        const { data, error } = await supabase
          .from("currenciesx")
          .insert([defaultSeed.currency])
          .select("id")
          .single();
        if (error) throw error;
        currency = data;
      }

      const { data: existingWarehouse, error: whCheckErr } = await supabase
        .from("warehousesx")
        .select("id")
        .eq("code", defaultSeed.warehouse.code)
        .maybeSingle();
      if (whCheckErr) throw whCheckErr;

      if (!existingWarehouse) {
        const { error } = await supabase.from("warehousesx").insert([
          { ...defaultSeed.warehouse, default_currency_id: currency!.id },
        ]);
        if (error) throw error;
      }

      const { data: existingPartner, error: pCheckErr } = await supabase
        .from("partnersx")
        .select("id")
        .eq("name", defaultSeed.partner.name)
        .maybeSingle();
      if (pCheckErr) throw pCheckErr;

      if (!existingPartner) {
        const { error } = await supabase.from("partnersx").insert([
          { ...defaultSeed.partner, is_customer: true, is_vendor: false },
        ]);
        if (error) throw error;
      }

      toast({ title: "Seed berhasil", description: "Data minimal berhasil dibuat." });
      await fetchAll();
    } catch (e: any) {
      toast({
        title: "Seed gagal",
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  }

  async function createQuotation() {
    if (!customerId || !currencyId) {
      toast({
        title: "Lengkapi data",
        description: "Customer dan Currency wajib dipilih.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const payload = {
        quotation_no: generateDocNo("QTNX"),
        customer_id: customerId,
        currency_id: currencyId,
        exchange_rate: 1,
        warehouse_id: warehouseId || null,
        valid_until: validUntil || null,
        grand_total: Number(grandTotal || 0),
        subtotal: Number(grandTotal || 0),
        tax_total: 0,
      };

      const { error } = await supabase.from("quotationsx").insert([payload]);
      if (error) throw error;

      toast({ title: "Quotation dibuat", description: payload.quotation_no });
      setGrandTotal("0");
      setValidUntil("");
      await fetchAll();
    } catch (e: any) {
      toast({
        title: "Gagal membuat quotation",
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Quotation System (x)
        </h1>
        <p className="text-sm text-muted-foreground">
          Halaman awal untuk membuat dan melihat quotation menggunakan tabel baru
          dengan akhiran <span className="font-medium">x</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Setup & Create</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              onClick={seedMinimal}
              disabled={loading || seeding}
              className="w-full"
              variant="secondary"
            >
              {seeding ? "Seeding..." : "Seed data minimal"}
            </Button>

            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih customer" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currencyId} onValueChange={setCurrencyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.code} — {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grandTotal">Grand total</Label>
                <Input
                  id="grandTotal"
                  inputMode="decimal"
                  value={grandTotal}
                  onChange={(e) => setGrandTotal(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={createQuotation}
              disabled={loading || creating}
              className="w-full"
            >
              {creating ? "Membuat..." : "Buat quotation"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Quotations (x)</CardTitle>
              <div className="w-full sm:w-72">
                <Input
                  placeholder="Cari nomor quotation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">Loading...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuotations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-sm">
                          Belum ada data.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredQuotations.map((q) => (
                        <TableRow key={q.id}>
                          <TableCell className="font-medium">
                            {q.quotation_no}
                          </TableCell>
                          <TableCell>{q.quotation_date}</TableCell>
                          <TableCell>{q.status}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {Number(q.grand_total || 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
