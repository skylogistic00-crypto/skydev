import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
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

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle,
} from "lucide-react";

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
  category?: string | null;
  approval_status?: "draft" | "approved" | "failed" | null;
}

/* =====================================================
   CONSTANT
===================================================== */
const PAGE_SIZE = 30;

/* =====================================================
   COMPONENT
===================================================== */
export default function BankMutationsManagement() {
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  /* ================= CURSOR ================= */
  const lastCursorRef = useRef<{ created_at: string; id: string } | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  /* =====================================================
     FETCH BANK MUTATIONS (CURSOR + ANTI DUPLICATE)
  ===================================================== */
  const fetchMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    let query = supabase
      .from("tabel_mutations")
      .select(`
        id,
        transaction_date,
        created_at,
        description,
        reference_number,
        amount,
        transaction_direction,
        category,
        approval_status
      `)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(PAGE_SIZE);

    if (lastCursorRef.current) {
      const c = lastCursorRef.current;
      query = query.or(
        `created_at.lt.${c.created_at},and(created_at.eq.${c.created_at},id.lt.${c.id})`
      );
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Load error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setHasMore(false);
      setLoading(false);
      return;
    }

    const last = data[data.length - 1];
    lastCursorRef.current = { created_at: last.created_at, id: last.id };

    setRows((prev) => {
      const map = new Map(prev.map((r) => [r.id, r]));
      data.forEach((r) => map.set(r.id, r));
      return Array.from(map.values());
    });

    setLoading(false);
  }, [loading, hasMore, toast]);

  useEffect(() => {
    fetchMore();
  }, [fetchMore]);

  /* =====================================================
     REALTIME UPDATE (AUTO REFRESH STATUS)
  ===================================================== */
  useEffect(() => {
    const channel = supabase
      .channel("bank-mutations-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tabel_mutations" },
        (payload) => {
          setRows((prev) =>
            prev.map((r) =>
              r.id === payload.new.id
                ? (payload.new as BankMutation)
                : r
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);



  /* =====================================================
     APPROVE BANK MUTATION
     → PROCESS INTO TRANSACTION (NO JOURNAL HERE)
  ===================================================== */
  const processMutation = async (mutationId: string) => {
  const { error } = await supabase.rpc(
    "approve_and_process_bank_mutation",
    {
      p_mutation_id: mutationId,
      p_approved_by: user?.id,
    }
  );

  if (error) {
    toast({
      title: "Approval gagal",
      description: error.message,
      variant: "destructive",
    });
  } else {
    toast({
      title: "Approved",
      description: "Mutation berhasil diproses",
    });
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
        <CardHeader>
          <CardTitle>Bank Mutations</CardTitle>
          <CardDescription>
            Auto Cash Mapping · One-Click Process · Realtime
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div
            ref={parentRef}
            className="h-[70vh] overflow-auto border rounded"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Status</TableHead>
                  {canApprove && <TableHead>Aksi</TableHead>}
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((row) => {
                  const expanded = expandedId === row.id;

                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setExpandedId(expanded ? null : row.id)
                          }
                        >
                          {expanded ? <ChevronDown /> : <ChevronRight />}
                        </Button>
                      </TableCell>

                      <TableCell>
                        {new Date(row.transaction_date).toLocaleDateString(
                          "id-ID"
                        )}
                      </TableCell>

                      <TableCell>
                        <div>{row.description}</div>
                        {expanded && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Ref: {row.reference_number}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {formatRupiah(row.amount)}
                      </TableCell>

                      <TableCell>
                        <Badge>{row.approval_status}</Badge>
                      </TableCell>

                      {canApprove && (
                        <TableCell>
                          {row.approval_status === "draft" && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => processMutation(row.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
