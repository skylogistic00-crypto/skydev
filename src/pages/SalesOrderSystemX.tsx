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

type QuotationX = {
  id: string;
  quotation_no: string;
  customer_id: string;
  grand_total: string;
  currency_id: string;
  warehouse_id: string | null;
};

type SalesOrderX = {
  id: string;
  order_no: string;
  quotation_id: string | null;
  customer_id: string;
  status: string;
  order_date: string;
  warehouse_id: string | null;
  grand_total: string;
  created_at: string;
};

function generateDocNo(prefix: string) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${y}${m}${day}-${rand}`;
}

export default function SalesOrderSystemX() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [quotations, setQuotations] = useState<QuotationX[]>([]);
  const [orders, setOrders] = useState<SalesOrderX[]>([]);

  const [quotationId, setQuotationId] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((r) => r.order_no.toLowerCase().includes(q));
  }, [orders, search]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [qRes, soRes] = await Promise.all([
        supabase
          .from("quotationsx")
          .select("id, quotation_no, customer_id, grand_total, currency_id, warehouse_id")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("sales_ordersx")
          .select(
            "id, order_no, quotation_id, customer_id, status, order_date, warehouse_id, grand_total, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (qRes.error) throw qRes.error;
      if (soRes.error) throw soRes.error;

      setQuotations(qRes.data ?? []);
      setOrders(soRes.data ?? []);

      const firstQuotation = (qRes.data ?? [])[0]?.id ?? "";
      setQuotationId((prev) => prev || firstQuotation);
    } catch (e: any) {
      toast({
        title: "Gagal memuat Sales Order (x)",
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function createSalesOrderFromQuotation() {
    if (!quotationId) {
      toast({
        title: "Pilih quotation",
        description: "Quotation wajib dipilih untuk membuat Sales Order.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const quotation = quotations.find((q) => q.id === quotationId);
      if (!quotation) {
        toast({
          title: "Quotation tidak ditemukan",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        order_no: generateDocNo("SOX"),
        quotation_id: quotation.id,
        customer_id: quotation.customer_id,
        currency_id: quotation.currency_id,
        exchange_rate: 1,
        warehouse_id: quotation.warehouse_id,
        grand_total: Number(quotation.grand_total || 0),
        subtotal: Number(quotation.grand_total || 0),
        tax_total: 0,
      };

      const { error } = await supabase.from("sales_ordersx").insert([payload]);
      if (error) throw error;

      toast({ title: "Sales Order dibuat", description: payload.order_no });
      await fetchAll();
    } catch (e: any) {
      toast({
        title: "Gagal membuat Sales Order",
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
        <h1 className="text-2xl font-semibold tracking-tight">Sales Order System (x)</h1>
        <p className="text-sm text-muted-foreground">
          Buat Sales Order dari Quotation (tabel suffix <span className="font-medium">x</span>).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Create</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Quotation</Label>
              <Select value={quotationId} onValueChange={setQuotationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih quotation" />
                </SelectTrigger>
                <SelectContent>
                  {quotations.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.quotation_no}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              onClick={createSalesOrderFromQuotation}
              disabled={loading || creating}
              className="w-full"
            >
              {creating ? "Membuat..." : "Buat Sales Order"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Sales Orders (x)</CardTitle>
              <div className="w-full sm:w-72">
                <Input
                  placeholder="Cari nomor sales order..."
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
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-sm">
                          Belum ada data.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium">{o.order_no}</TableCell>
                          <TableCell>{o.order_date}</TableCell>
                          <TableCell>{o.status}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {Number(o.grand_total || 0).toLocaleString()}
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
