import { useEffect, useState, useCallback, useMemo } from "react";
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
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import { Loader2, ArrowLeft, CheckCircle, Search } from "lucide-react";

/* =====================================================
   TYPES
===================================================== */
interface BankMutation {
  id: string;
  date: string;
  description: string | null;
  amount: number;
  status: "raw" | "pending" | "approved";
  source: string | null;
  created_at: string;
}

/* =====================================================
   COMPONENT
===================================================== */
export default function BankMutationsManagement() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  /* ================= ACCESS ================= */
  const hasAccess = useMemo(
    () =>
      [
        "admin",
        "finance",
        "accounting",
        "super_admin",
        "accounting_manager",
        "accounting_staff",
      ].includes((userRole ?? "").toLowerCase()),
    [userRole]
  );

  /* ================= STATE ================= */
  const [rows, setRows] = useState<BankMutation[]>([]);
  const [loading, setLoading] = useState(false);

  /* ================= FILTER ================= */
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "raw" | "pending" | "approved" | "all"
  >("raw");
  const [searchDesc, setSearchDesc] = useState("");

  /* =====================================================
     FETCH DATA
  ===================================================== */
  const fetchBankMutations = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("bank_mutations")
      .select("id, date, description, amount, status, source, created_at")
      .order("date", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);
    if (searchDesc) query = query.ilike("description", `%${searchDesc}%`);

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setRows((data as BankMutation[]) || []);
    setLoading(false);
  }, [statusFilter, dateFrom, dateTo, searchDesc, toast]);

  useEffect(() => {
    if (hasAccess) fetchBankMutations();
  }, [hasAccess, fetchBankMutations]);

  /* =====================================================
     APPROVE — AUTO (RPC)
  ===================================================== */
  const handleApprove = async (mutation: BankMutation) => {
  if (!user?.id) {
    toast({
      title: "Error",
      description: "User tidak valid",
      variant: "destructive",
    });
    return;
  }

  try {
    const { error } = await supabase.rpc(
      "approve_bank_mutation_auto",
      {
        p_mutation_id: mutation.id, // ✅ PAKAI PARAMETER
        p_user_id: user.id,
      }
    );

    if (error) throw error;

    toast({
      title: "Approval Berhasil",
      description: "Mutasi dijurnal otomatis",
    });

    fetchBankMutations(); // refresh tabel
  } catch (err: any) {
    toast({
      title: "Approval Gagal",
      description: err.message,
      variant: "destructive",
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
    }).format(v || 0);

  const statusVariant = (status: string) => {
    if (status === "approved") return "default";
    if (status === "pending") return "outline";
    return "secondary";
  };

  /* =====================================================
     NO ACCESS
  ===================================================== */
  if (!hasAccess) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-red-500">
              Anda tidak memiliki akses ke halaman ini.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
              Kembali ke Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <div className="container mx-auto py-6 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Bank Mutations Management</CardTitle>
            <CardDescription>
              Approval mutasi bank otomatis ke jurnal
            </CardDescription>
          </div>
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
          {/* FILTER */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="raw">Raw</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="all">Semua</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Cari deskripsi..."
                value={searchDesc}
                onChange={(e) => setSearchDesc(e.target.value)}
              />
            </div>

            <Button onClick={fetchBankMutations}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>

          {/* TABLE */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        {row.date
                          ? new Date(row.date).toLocaleDateString("id-ID")
                          : "-"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {row.description || "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatRupiah(row.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusVariant(row.status)}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.source || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={row.status === "approved"}
                          onClick={() => handleApprove(row)}
                          className={
                            row.status === "approved"
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-green-50 hover:border-green-500 hover:text-green-700"
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
