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
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import { Loader2, ArrowLeft, CheckCircle, Search, Upload } from "lucide-react";
import OCRScanButton from "./OCRScanButton";

/* =====================================================
   TYPES — VIEW
===================================================== */
interface BankMutationView {
  id: string;
  date: string | null;
  description: string | null;
  category: string | null;
  debit: number | null;
  credit: number | null;
  debit_account_name: string | null;
  credit_account_name: string | null;
  balance: number | null;
  bukti_url: string | null;
  approval_status: "approved" | "rejected" | null;
  approved_by: string | null;
  approved_at: string | null;
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
  const [rows, setRows] = useState<BankMutationView[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  /* ================= FILTER ================= */
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchDesc, setSearchDesc] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("pending");

  /* =====================================================
     FETCH — VIEW ONLY
  ===================================================== */
  const fetchData = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("bank_mutations")
      .select(`
        id,
        date,
        description,
        category,
        debit,
        credit,
        debit_account_name,
        credit_account_name,
        balance,
        bukti_url,
        approval_status,
        approved_by,
        approved_at,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);
    if (searchDesc) query = query.ilike("description", `%${searchDesc}%`);
    
    // Filter berdasarkan status
    if (statusFilter === "pending") {
      query = query.is("approval_status", null);
    } else if (statusFilter === "approved") {
      query = query.eq("approval_status", "approved");
    }
    // "all" = tidak ada filter status

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

    setRows((data as BankMutationView[]) || []);
    setLoading(false);
  }, [dateFrom, dateTo, searchDesc, statusFilter, toast]);

  useEffect(() => {
    if (hasAccess) fetchData();
  }, [hasAccess, fetchData]);

  /* =====================================================
     APPROVE → UPDATE bank_mutations (TRIGGER HANDLE JURNAL)
  ===================================================== */
  const handleApprove = async (row: BankMutationView) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User tidak valid",
        variant: "destructive",
      });
      return;
    }

    if (row.approval_status) return;

    try {
      setApprovingId(row.id);

      const { error } = await supabase
        .from("bank_mutations")
        .update({
          approval_status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .is("approval_status", null);

      if (error) throw error;

      // Refresh data, dan kembalikan filter ke pending agar data yang baru di-approve hilang dari tampilan
      setStatusFilter("pending");
      fetchData();
    } catch (err: any) {
      toast({
        title: "Approve gagal",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setApprovingId(null);
    }
  };

  /* =====================================================
     UPLOAD BUKTI
  ===================================================== */
  const handleUploadBukti = async (rowId: string, file: File) => {
    try {
      setUploadingId(rowId);

      // Upload file ke storage bucket
      const fileExt = file.name.split(".").pop();
      const fileName = `${rowId}_${Date.now()}.${fileExt}`;
      const filePath = `mutation-evidence/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("mutation-evidence")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("mutation-evidence")
        .getPublicUrl(filePath);

      // Update bukti_url di bank_mutations
      const { error: updateError } = await supabase
        .from("bank_mutations")
        .update({ bukti_url: urlData.publicUrl })
        .eq("id", rowId);

      if (updateError) throw updateError;

      toast({
        title: "Berhasil",
        description: "Bukti berhasil diupload",
      });

      fetchData();
    } catch (err: any) {
      toast({
        title: "Upload gagal",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
    }
  };

  /* =====================================================
     HELPERS
  ===================================================== */
  const formatRupiah = (v: number | null) =>
    v === null
      ? "-"
      : new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(v);

  const statusVariant = (s: string | null) =>
    s === "approved" ? "default" : s === "rejected" ? "destructive" : "outline";

  /* =====================================================
     NO ACCESS
  ===================================================== */
  if (!hasAccess) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-red-500">Anda tidak memiliki akses.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
              Kembali
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
            <CardTitle>Bank Mutations (Journal View)</CardTitle>
            <CardDescription>
              Data mutasi + jurnal (read-only)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <OCRScanButton
              onImageUploaded={(url, filePath) => {
                toast({
                  title: "Gambar berhasil diupload",
                  description: `File: ${filePath}`,
                });
              }}
            />
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* FILTER */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Cari deskripsi..."
                value={searchDesc}
                onChange={(e) => setSearchDesc(e.target.value)}
              />
            </div>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "approved")}
            >
              <option value="pending">Belum Approve</option>
              <option value="approved">Approved</option>
              <option value="all">All</option>
            </select>
            <Button onClick={fetchData}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>

          {/* TABLE */}
          <div className="border rounded-lg overflow-x-auto">
            <Table className="min-w-[1400px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px] min-w-[100px]">Date</TableHead>
                  <TableHead className="w-[200px] min-w-[200px]">Description</TableHead>
                  <TableHead className="w-[180px] min-w-[180px]">Category</TableHead>
                  <TableHead className="w-[120px] min-w-[120px] text-right">Debit</TableHead>
                  <TableHead className="w-[120px] min-w-[120px] text-right">Credit</TableHead>
                  <TableHead className="w-[200px] min-w-[200px]">Account Name</TableHead>
                  <TableHead className="w-[150px] min-w-[150px] text-right">Balance</TableHead>
                  <TableHead className="w-[100px] min-w-[100px] text-center">Bukti</TableHead>
                  <TableHead className="w-[80px] min-w-[80px] text-center">Status</TableHead>
                  <TableHead className="w-[100px] min-w-[100px] text-center">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    // Gabungkan debit dan credit account, filter yang tidak "Bank Mandiri"
                    let accountName = "-";
                    if (row.debit_account_name && row.debit_account_name !== "Bank Mandiri") {
                      accountName = row.debit_account_name;
                    } else if (row.credit_account_name && row.credit_account_name !== "Bank Mandiri") {
                      accountName = row.credit_account_name;
                    }

                    return (
                      <TableRow key={row.id} className="hover:bg-muted/50">
                        <TableCell className="whitespace-nowrap text-sm">
                          {row.date ? new Date(row.date).toLocaleDateString("id-ID") : "-"}
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate" title={row.description || ""}>
                          {row.description || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {row.category || "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {row.debit ? formatRupiah(row.debit) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {row.credit ? formatRupiah(row.credit) : "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {accountName}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {row.balance ? formatRupiah(row.balance) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.bukti_url ? (
                            <a 
                              href={row.bukti_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs"
                            >
                              Lihat
                            </a>
                          ) : (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                disabled={uploadingId === row.id}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadBukti(row.id, file);
                                }}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={uploadingId === row.id}
                                className="h-8 px-2"
                                asChild
                              >
                                <span>
                                  {uploadingId === row.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4" />
                                  )}
                                </span>
                              </Button>
                            </label>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={statusVariant(row.approval_status)}
                            className="text-xs"
                          >
                            {row.approval_status || "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={approvingId === row.id || !!row.approval_status}
                            onClick={() => handleApprove(row)}
                            className="h-8 px-3"
                          >
                            {approvingId === row.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            Approve
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
