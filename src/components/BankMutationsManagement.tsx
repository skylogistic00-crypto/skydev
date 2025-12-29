import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { Loader2, ArrowLeft } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

/* =====================================================
   TYPES
===================================================== */
interface BankMutation {
  id: string;
  transaction_date: string;
  created_at: string;
  description?: string | null;
  reference_number?: string | null;
  amount: number;
  transaction_direction: "IN" | "OUT";
  approval_status?: "draft" | "approved" | "posted" | "failed" | null;
}

interface Summary {
  total_in: number;
  total_out: number;
  saldo: number;
}

/* =====================================================
   CONST
===================================================== */
const PAGE_SIZE = 30;
const HIGHLIGHT_MS = 2500;

/* =====================================================
   COMPONENT
===================================================== */
export default function BankMutationsManagement() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const canApprove = useMemo(
    () =>
      ["admin", "finance", "super_admin"].includes(
        (userRole ?? "").toLowerCase()
      ),
    [userRole]
  );

  /* ================= STATE ================= */
  const [rows, setRows] = useState<BankMutation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());

  /* ================= FILTER ================= */
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState<"draft" | "all">("draft");
  const [search, setSearch] = useState("");

  /* ================= SUMMARY ================= */
  const [summary, setSummary] = useState<Summary | null>(null);

  /* ================= CURSOR ================= */
  const cursorRef = useRef<{ created_at: string; id: string } | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  /* ================= VIRTUAL ================= */
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 8,
  });

  /* =====================================================
     RESET + RELOAD
  ===================================================== */
  const resetAndReload = useCallback(() => {
    cursorRef.current = null;
    setRows([]);
    setSelected(new Set());
    setHasMore(true);
  }, []);

  useEffect(() => {
    resetAndReload();
  }, [fromDate, toDate, status, search, resetAndReload]);

  /* =====================================================
     FETCH DATA
  ===================================================== */
  const fetchMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    let q = supabase
      .from("tabel_mutations")
      .select(`
        id,
        transaction_date,
        created_at,
        description,
        reference_number,
        amount,
        transaction_direction,
        approval_status
      `)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(PAGE_SIZE);

    if (fromDate) q = q.gte("transaction_date", fromDate);
    if (toDate) q = q.lte("transaction_date", toDate);
    if (status !== "all") q = q.eq("approval_status", status);
    if (search) q = q.ilike("description", `%${search}%`);

    if (cursorRef.current) {
      const c = cursorRef.current;
      q = q.or(
        `created_at.lt.${c.created_at},and(created_at.eq.${c.created_at},id.lt.${c.id})`
      );
    }

    const { data, error } = await q;
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setHasMore(false);
      setLoading(false);
      return;
    }

    cursorRef.current = {
      created_at: data[data.length - 1].created_at,
      id: data[data.length - 1].id,
    };

    setRows((prev) => {
      const map = new Map(prev.map((r) => [r.id, r]));
      data.forEach((r) => map.set(r.id, r));
      return Array.from(map.values());
    });

    setLoading(false);
  }, [loading, hasMore, fromDate, toDate, status, search, toast]);

  useEffect(() => {
    fetchMore();
  }, [fetchMore]);

  /* =====================================================
     AUTO LOAD NEXT
  ===================================================== */
  useEffect(() => {
    const last = rowVirtualizer.getVirtualItems().at(-1);
    if (last && last.index >= rows.length - 5) fetchMore();
  }, [rowVirtualizer.getVirtualItems(), rows.length, fetchMore]);

  /* =====================================================
     SUMMARY
  ===================================================== */
  useEffect(() => {
    supabase
      .from("vw_mutation_summary_global")
      .select("*")
      .single()
      .then(({ data }) => setSummary(data as Summary));
  }, []);

  /* =====================================================
     REALTIME UPDATE
  ===================================================== */
  useEffect(() => {
    const ch = supabase
      .channel("bank-mutations-rt")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tabel_mutations" },
        (p) => {
          const u = p.new as BankMutation;

          setRows((prev) =>
            prev.map((r) => (r.id === u.id ? { ...r, ...u } : r))
          );

          setHighlighted((s) => new Set(s).add(u.id));
          setTimeout(() => {
            setHighlighted((s) => {
              const n = new Set(s);
              n.delete(u.id);
              return n;
            });
          }, HIGHLIGHT_MS);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  /* =====================================================
     BULK APPROVE
  ===================================================== */
  const bulkApprove = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    const { error } = await supabase.rpc(
      "approve_and_process_bank_mutations_bulk",
      {
        p_mutation_ids: ids,
        p_approved_by: user?.id,
      }
    );

    if (error) {
      toast({ title: "Bulk gagal", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bulk approve sukses", description: `${ids.length} transaksi` });
      setSelected(new Set());
    }
  };

  /* =====================================================
     HELPERS
  ===================================================== */
  const formatRupiah = (v: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(v);

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Bank Mutations</CardTitle>
            <CardDescription>
              Default Draft · Bulk Approve · Realtime
            </CardDescription>
          </div>

          {/* 🔙 BACK TO HOME */}
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>
        </CardHeader>

        <CardContent>
          {/* SUMMARY */}
          {summary && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card><CardContent>IN<br />{formatRupiah(summary.total_in)}</CardContent></Card>
              <Card><CardContent>OUT<br />{formatRupiah(summary.total_out)}</CardContent></Card>
              <Card><CardContent>SALDO<br />{formatRupiah(summary.saldo)}</CardContent></Card>
            </div>
          )}

          {/* FILTER */}
          <div className="grid grid-cols-6 gap-2 mb-3">
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} onKeyDown={(e) => e.key === "Enter" && resetAndReload()} />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} onKeyDown={(e) => e.key === "Enter" && resetAndReload()} />
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger />
              <SelectContent>
                <SelectItem value="draft">Draft (Default)</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Cari deskripsi" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && resetAndReload()} />
            <Button onClick={resetAndReload}>Refresh</Button>
            {canApprove && (
              <Button disabled={selected.size === 0} className="bg-green-600" onClick={bulkApprove}>
                Bulk Approve ({selected.size})
              </Button>
            )}
          </div>

          {/* LIST */}
          <div ref={parentRef} className="h-[70vh] overflow-auto border rounded relative">
            <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
              {rowVirtualizer.getVirtualItems().map((v) => {
                const r = rows[v.index];
                if (!r) return null;

                const selectable = r.approval_status === "draft";

                return (
                  <div
                    key={r.id}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${v.start}px)`,
                    }}
                    className={`border-b p-2 grid grid-cols-5 gap-2 items-center ${
                      highlighted.has(r.id) ? "bg-yellow-100 animate-pulse" : ""
                    }`}
                  >
                    <Checkbox
                      disabled={!selectable}
                      checked={selected.has(r.id)}
                      onCheckedChange={(v) => {
                        if (!selectable) return;
                        setSelected((s) => {
                          const n = new Set(s);
                          v ? n.add(r.id) : n.delete(r.id);
                          return n;
                        });
                      }}
                    />
                    <div>{new Date(r.transaction_date).toLocaleDateString("id-ID")}</div>
                    <div className="truncate">{r.description}</div>
                    <div className="text-right">{formatRupiah(r.amount)}</div>
                    <Badge>{r.approval_status}</Badge>
                  </div>
                );
              })}
            </div>

            {loading && (
              <div className="absolute bottom-2 w-full flex justify-center">
                <Loader2 className="animate-spin" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
