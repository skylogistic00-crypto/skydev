import { useEffect, useMemo, useState } from "react";
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

type SalesOrderX = {
  id: string;
  order_no: string;
  customer_id: string;
  warehouse_id: string | null;
  grand_total: string;
  status: string;
  created_at: string;
};

type DeliveryStatus = "draft" | "sent" | "confirmed" | "done" | "cancelled";

type DeliveryLine = {
  id?: string;
  product_id?: string | null;
  product_name: string;
  qty: number;
  uom: string;
  unit_price?: number | null;
  notes?: string | null;
  line_no?: number;
};

type DeliveryX = {
  id: string;
  delivery_no: string;
  sales_order_id: string | null;
  origin_ref: string | null;
  customer_name: string | null;
  status: DeliveryStatus;
  delivery_date: string | null;
  created_at: string;
  updated_at: string | null;
  lines?: DeliveryLine[];
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_LABEL: Record<DeliveryStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  confirmed: "Confirmed",
  done: "Done",
  cancelled: "Cancelled",
};

export default function DeliverySystemX() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);

  const [orders, setOrders] = useState<SalesOrderX[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryX[]>([]);

  const [selectedId, setSelectedId] = useState<string>("");

  const [salesOrderId, setSalesOrderId] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>(todayISO());
  const [customerName, setCustomerName] = useState<string>("");
  const [originRef, setOriginRef] = useState<string>("");

  const [lines, setLines] = useState<DeliveryLine[]>([
    { product_name: "", qty: 1, uom: "Unit", unit_price: null, notes: null, line_no: 1 },
  ]);

  const [search, setSearch] = useState<string>("");

  const filteredDeliveries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return deliveries;
    return deliveries.filter((r) => {
      const hay = `${r.delivery_no} ${r.customer_name ?? ""} ${r.origin_ref ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [deliveries, search]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [soRes, dRes] = await Promise.all([
        supabase
          .from("sales_ordersx")
          .select("id, so_no, customer_id, warehouse_id, grand_total, status, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.functions.invoke("supabase-functions-deliveryx-crud/list"),
      ]);

      if (soRes.error) throw soRes.error;
      if (dRes.error) throw dRes.error;

      setOrders(soRes.data ?? []);
      setDeliveries((dRes.data as any)?.data ?? []);

      const firstOrder = (soRes.data ?? [])[0]?.id ?? "";
      setSalesOrderId((prev) => prev || firstOrder);
    } catch (e: any) {
      toast({
        title: "Gagal memuat Delivery (x)",
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadDelivery(id: string) {
    setSelectedId(id);
    try {
      const { data, error: e } = await supabase.functions.invoke("supabase-functions-deliveryx-crud/get", {
        body: { id },
      });
      if (e) throw e;
      const record = (data as any)?.data as DeliveryX;
      if (!record) return;

      setSalesOrderId(record.sales_order_id ?? "");
      setDeliveryDate((record.delivery_date ?? todayISO()).slice(0, 10));
      setCustomerName(record.customer_name ?? "");
      setOriginRef(record.origin_ref ?? "");

      const recordLines = (record.lines ?? []).map((l, idx) => ({
        ...l,
        qty: Number(l.qty ?? 0),
        line_no: l.line_no ?? idx + 1,
      }));

      setLines(
        recordLines.length
          ? recordLines
          : [{ product_name: "", qty: 1, uom: "Unit", unit_price: null, notes: null, line_no: 1 }],
      );
    } catch (e: any) {
      toast({ title: "Gagal memuat Delivery", description: e?.message ?? String(e), variant: "destructive" });
    }
  }

  async function createDeliveryDraft() {
    if (!salesOrderId) {
      toast({
        title: "Pilih sales order",
        description: "Sales Order wajib dipilih untuk membuat Delivery.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const so = orders.find((o) => o.id === salesOrderId);
      if (!so) {
        toast({ title: "Sales Order tidak ditemukan", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke("supabase-functions-deliveryx-crud/upsert", {
        body: {
          sales_order_id: so.id,
          delivery_date: deliveryDate || todayISO(),
          status: "draft",
          customer_name: customerName || null,
          origin_ref: originRef || null,
          lines,
        },
      });
      if (error) throw error;

      const id = (data as any)?.data?.id as string | undefined;
      if (id) {
        await fetchAll();
        await loadDelivery(id);
      } else {
        await fetchAll();
      }

      toast({ title: "Delivery dibuat" });
    } catch (e: any) {
      toast({
        title: "Gagal membuat Delivery",
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  async function saveDraft() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("supabase-functions-deliveryx-crud/upsert", {
        body: {
          id: selectedId,
          sales_order_id: salesOrderId || null,
          delivery_date: deliveryDate || null,
          customer_name: customerName || null,
          origin_ref: originRef || null,
          lines,
        },
      });
      if (error) throw error;
      toast({ title: "Tersimpan" });
      await fetchAll();
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function doAction(action: "send" | "confirm" | "done" | "cancel" | "reset") {
    if (!selectedId) return;
    setActing(true);
    try {
      const { error } = await supabase.functions.invoke("supabase-functions-deliveryx-crud/action", {
        body: { id: selectedId, action },
      });
      if (error) throw error;
      await fetchAll();
      await loadDelivery(selectedId);
    } catch (e: any) {
      toast({ title: "Gagal menjalankan aksi", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setActing(false);
    }
  }

  function addLine() {
    setLines((prev) => {
      const nextNo = (prev.at(-1)?.line_no ?? prev.length) + 1;
      return [...prev, { product_name: "", qty: 1, uom: "Unit", unit_price: null, notes: null, line_no: nextNo }];
    });
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  useEffect(() => {
    fetchAll();
  }, []);

  const selected = useMemo(() => deliveries.find((d) => d.id === selectedId) ?? null, [deliveries, selectedId]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Delivery System (x)</h1>
        <p className="text-sm text-muted-foreground">Flow mirip Odoo: draft → sent → confirmed → done (+ cancelled).</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Deliveries</CardTitle>
              <div className="w-full sm:w-60">
                <Input
                  placeholder="Cari (no / customer / origin)..."
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
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeliveries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-10 text-center text-sm">
                          Belum ada data.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDeliveries.map((d) => (
                        <TableRow
                          key={d.id}
                          className={d.id === selectedId ? "bg-muted/40" : "cursor-pointer"}
                          onClick={() => loadDelivery(d.id)}
                        >
                          <TableCell className="font-medium">{d.delivery_no}</TableCell>
                          <TableCell>{d.customer_name ?? "-"}</TableCell>
                          <TableCell>{STATUS_LABEL[d.status]}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">Delivery</CardTitle>
                <div className="text-xs text-muted-foreground">{selected ? selected.delivery_no : "Pilih delivery dari list"}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={!selectedId || acting || loading}
                  onClick={() => doAction("send")}
                >
                  Send
                </Button>
                <Button disabled={!selectedId || acting || loading} onClick={() => doAction("confirm")}>
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  disabled={!selectedId || acting || loading}
                  onClick={() => doAction("done")}
                >
                  Mark Done
                </Button>
                <Button
                  variant="destructive"
                  disabled={!selectedId || acting || loading}
                  onClick={() => doAction("cancel")}
                >
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  disabled={!selectedId || acting || loading}
                  onClick={() => doAction("reset")}
                >
                  Reset to Draft
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Sales Order</Label>
                <Select value={salesOrderId} onValueChange={setSalesOrderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih sales order" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.order_no}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tanggal Delivery</Label>
                <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Customer</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nama customer" />
              </div>

              <div className="space-y-2">
                <Label>Origin</Label>
                <Input value={originRef} onChange={(e) => setOriginRef(e.target.value)} placeholder="Mis. SOX/2026/01/0001" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={createDeliveryDraft}
                disabled={loading || creating}
                className="min-w-40"
              >
                {creating ? "Membuat..." : "Create Draft"}
              </Button>
              <Button type="button" variant="secondary" onClick={saveDraft} disabled={!selectedId || saving || loading}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>

            <div className="rounded-md border">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="text-sm font-medium">Delivery Lines</div>
                <Button type="button" size="sm" variant="outline" onClick={addLine}>
                  Add line
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[44%]">Product</TableHead>
                      <TableHead className="w-[14%]">Qty</TableHead>
                      <TableHead className="w-[14%]">UoM</TableHead>
                      <TableHead className="w-[18%]">Unit Price</TableHead>
                      <TableHead className="w-[10%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((l, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input
                            value={l.product_name}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, product_name: e.target.value } : x)),
                              )
                            }
                            placeholder="Nama produk"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={l.qty}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, qty: Number(e.target.value || 0) } : x)),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={l.uom}
                            onChange={(e) =>
                              setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, uom: e.target.value } : x)))
                            }
                            placeholder="Unit"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={l.unit_price ?? ""}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, unit_price: e.target.value === "" ? null : Number(e.target.value) } : x,
                                ),
                              )
                            }
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(idx)}>
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Status: <span className="font-medium">{selected ? STATUS_LABEL[selected.status] : "-"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
