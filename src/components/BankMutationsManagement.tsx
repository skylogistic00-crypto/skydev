import { useCallback, useEffect, useMemo, useState } from "react";
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

import { Loader2, ArrowLeft, CheckCircle, Search, Upload, FileText, XCircle } from "lucide-react";
import OCRScanButton from "./OCRScanButton";
import { TaxExtractionModal } from "./TaxExtractionModal";
import { OCRBankMutationMatchDialog } from "@/components/OCRBankMutationMatchDialog";

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
  approval_status: "approved" | "rejected" | "waiting_approval" | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  ocr_text: string | null;
  invoice_id: string | null;
  dpp_amount: number | null;
  ppn_amount: number | null;
  pph_amount: number | null;
  gross_amount: number | null;
  tax_extraction_status: string | null;

  vat_amount?: number | null;
  stamp_amount?: number | null;
  transaction_type?: string | null;
  revenue_account_code?: string | null;
  expense_account_code?: string | null;
  vat_output_account_code?: string | null;
  vat_input_account_code?: string | null;

  invoice_storage_bucket?: string | null;
  invoice_file_path?: string | null;
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
  const [cancelingOcrId, setCancelingOcrId] = useState<string | null>(null);
  const [taxExtractionModal, setTaxExtractionModal] = useState<{
    open: boolean;
    bankMutationId: string;
    ocrText: string;
  }>({ open: false, bankMutationId: "", ocrText: "" });

  const [extractedTaxIds, setExtractedTaxIds] = useState<Set<string>>(new Set());

  const [globalOcrMatch, setGlobalOcrMatch] = useState<{
    open: boolean;
    candidates: Array<{ row: { id: string; date: string | null; description: string | null; debit: number | null; credit: number | null }; score: number }>;
    selectedId: string | null;
    fallbackMatch: { date?: string | null; amount?: number | null; description?: string | null };
    ocrText: string;
    filePath: string;
    publicUrl: string;
  }>({
    open: false,
    candidates: [],
    selectedId: null,
    fallbackMatch: {},
    ocrText: "",
    filePath: "",
    publicUrl: "",
  });

  /* ================= FILTER ================= */
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchDesc, setSearchDesc] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("pending");

  /* =====================================================
     FETCH — VIEW ONLY
  ===================================================== */
  const markTaxExtracted = useCallback(
    (bankMutationId: string) => {
      setExtractedTaxIds((prev) => {
        const next = new Set(prev);
        next.add(bankMutationId);
        return next;
      });

      // Also update current rows immediately for better UX
      setRows((prev) =>
        prev.map((r) =>
          r.id === bankMutationId ? { ...r, tax_extraction_status: "extracted" } : r
        )
      );
    },
    [setRows]
  );

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
        created_at,
        ocr_text,
        invoice_id,
        dpp_amount,
        ppn_amount,
        pph_amount,
        gross_amount,
        tax_extraction_status,
        vat_amount,
        stamp_amount,
        transaction_type,
        revenue_account_code,
        expense_account_code,
        vat_output_account_code,
        vat_input_account_code,
        invoice_storage_bucket,
        invoice_file_path
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
     APPROVE → UPDATE bank_mutations.approval_status
     Catatan: Tombol Approve di UI HANYA mengubah kolom approval_status.
     Proses jurnal (jika ada) ditangani oleh trigger/database.
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

      // Button Approve: ONLY update approval_status on bank_mutations
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

      toast({
        title: "Approved",
        description: "Mutasi berhasil di-approve",
      });

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
        .update({
          bukti_url: urlData.publicUrl,
          invoice_storage_bucket: "mutation-evidence",
          invoice_file_path: filePath,
        })
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
     HANDLE OCR RESULT (persist to bank_mutations)
  ===================================================== */
  const handleOCRPersisted = async (rowId: string, publicUrl: string, filePath: string) => {
    try {
      const { error: updateError } = await supabase
        .from("bank_mutations")
        .update({
          bukti_url: publicUrl,
          invoice_storage_bucket: "mutation-evidence",
          invoice_file_path: filePath,
        })
        .eq("id", rowId);

      if (updateError) throw updateError;

      fetchData();
    } catch (err: any) {
      toast({
        title: "Simpan bukti gagal",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  /* =====================================================
     CANCEL OCR (WAJIB)
  ===================================================== */
  const handleCancelOCR = async (row: BankMutationView) => {
    if (row.approval_status === "approved") return;

    try {
      setCancelingOcrId(row.id);

      // Hapus evidence + OCR fields di row (client-side). Jika perlu juga hapus file storage,
      // sebaiknya dilakukan via edge function/service role, karena client (anon) sering tidak
      // punya izin delete file.
      const { error } = await supabase
        .from("bank_mutations")
        .update({
          bukti_url: null,
          ocr_text: null,
          invoice_storage_bucket: null,
          invoice_file_path: null,
        })
        .eq("id", row.id)
        .is("approval_status", null);

      if (error) throw error;

      toast({
        title: "OCR dibatalkan",
        description: "Bukti + hasil OCR dihapus dari data mutasi",
      });

      fetchData();
    } catch (err: any) {
      toast({
        title: "Cancel OCR gagal",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCancelingOcrId(null);
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
              // Global scan: ALWAYS fallback mode (no bankMutationId). Persist only after user confirms in dialog.
              bucketName="mutation-evidence"
              folderPath="mutation-evidence"
              onFallbackCandidates={({ candidates, fallbackMatch, ocrText, filePath, publicUrl }) => {
                setGlobalOcrMatch({
                  open: true,
                  candidates,
                  selectedId: candidates?.[0]?.row?.id ?? null,
                  fallbackMatch,
                  ocrText,
                  filePath,
                  publicUrl,
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
                  <TableHead className="w-[200px] min-w-[200px]">Account Name</TableHead>
                  <TableHead className="w-[120px] min-w-[120px] text-right">Debit</TableHead>
                  <TableHead className="w-[120px] min-w-[120px] text-right">Credit</TableHead>
                  <TableHead className="w-[150px] min-w-[150px] text-right">Balance</TableHead>
                  <TableHead className="w-[120px] min-w-[120px] text-right">Amount</TableHead>
                  <TableHead className="w-[100px] min-w-[100px] text-center">Direction</TableHead>
                  <TableHead className="w-[100px] min-w-[100px] text-center">Bukti</TableHead>
                  {statusFilter !== "pending" && (
                    <TableHead className="w-[80px] min-w-[80px] text-center">Status</TableHead>
                  )}
                  <TableHead className="w-[100px] min-w-[100px] text-center">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={statusFilter === "pending" ? 11 : 12} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={statusFilter === "pending" ? 11 : 12} className="text-center py-10 text-muted-foreground">
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
                        <TableCell className="text-sm">
                          {accountName}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {row.debit ? formatRupiah(row.debit) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {row.credit ? formatRupiah(row.credit) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {row.balance ? formatRupiah(row.balance) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {row.debit ? formatRupiah(row.debit) : row.credit ? formatRupiah(row.credit) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.debit ? (
                            <span className="text-red-600 font-semibold">OUT</span>
                          ) : row.credit ? (
                            <span className="text-green-600 font-semibold">IN</span>
                          ) : (
                            "-"
                          )}
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
                            <div className="flex items-center justify-center">
                              <OCRScanButton
                                bankMutationId={row.id}
                                bucketName="mutation-evidence"
                                folderPath="mutation-evidence"
                                extractedFields={{
                                  bukti_url: row.bukti_url ?? null,
                                  dpp_amount: row.dpp_amount ?? null,
                                  vat_amount: (row as any).vat_amount ?? null,
                                  stamp_amount: (row as any).stamp_amount ?? null,
                                  transaction_type: (row as any).transaction_type ?? null,
                                  revenue_account_code: (row as any).revenue_account_code ?? null,
                                  expense_account_code: (row as any).expense_account_code ?? null,
                                  vat_output_account_code: (row as any).vat_output_account_code ?? null,
                                  vat_input_account_code: (row as any).vat_input_account_code ?? null,
                                }}
                                onImageUploaded={() => {
                                  // Upload != OCR success. Keep quiet here; we'll toast only after edge function success.
                                }}
                              />
                            </div>
                          )}
                        </TableCell>
                        {statusFilter !== "pending" && (
                          <TableCell className="text-center">
                            {row.approval_status ? (
                              <Badge 
                                variant={statusVariant(row.approval_status)}
                                className="text-xs"
                              >
                                {row.approval_status}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {(row.tax_extraction_status === "extracted" || extractedTaxIds.has(row.id)) && (
                              <Badge variant="secondary" className="text-[10px]">
                                Tax Extracted
                              </Badge>
                            )}
                            {row.ocr_text && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setTaxExtractionModal({
                                    open: true,
                                    bankMutationId: row.id,
                                    ocrText: row.ocr_text || "",
                                  });
                                }}
                                className="h-8 px-2"
                                title="Extract Tax Info"
                              >
                                <FileText className="h-4 w-4 text-purple-600" />
                                {(row.tax_extraction_status === "extracted" || extractedTaxIds.has(row.id)) && (
                                  <CheckCircle className="h-3 w-3 text-green-600 ml-1" />
                                )}
                              </Button>
                            )}

                            {/* Cancel OCR (wajib). Locked when approved, only allowed when waiting_approval */}
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={
                                cancelingOcrId === row.id ||
                                row.approval_status === "approved" ||
                                row.approval_status !== "waiting_approval" ||
                                !row.bukti_url
                              }
                              onClick={() => handleCancelOCR(row)}
                              className="h-8 px-2"
                              title={
                                row.approval_status === "approved"
                                  ? "Tidak bisa cancel: sudah approved"
                                  : row.approval_status !== "waiting_approval"
                                    ? "Cancel OCR hanya boleh saat waiting_approval"
                                    : "Cancel OCR"
                              }
                            >
                              {cancelingOcrId === row.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </Button>

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
                          </div>
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

      {/* Global OCR Match Dialog */}
      <OCRBankMutationMatchDialog
        open={globalOcrMatch.open}
        onOpenChange={(open) => setGlobalOcrMatch((s) => ({ ...s, open }))}
        candidates={globalOcrMatch.candidates}
        selectedId={globalOcrMatch.selectedId}
        onSelect={(id) => setGlobalOcrMatch((s) => ({ ...s, selectedId: id }))}
        target={globalOcrMatch.fallbackMatch}
        onCancel={() =>
          setGlobalOcrMatch({
            open: false,
            candidates: [],
            selectedId: null,
            fallbackMatch: {},
            ocrText: "",
            filePath: "",
            publicUrl: "",
          })
        }
        onConfirm={async () => {
          if (!globalOcrMatch.selectedId) return;

          const { error } = await supabase.functions.invoke(
            "supabase-functions-ai-ocr-bank-mutation",
            {
              body: {
                bank_mutation_id: globalOcrMatch.selectedId,
                image_url: globalOcrMatch.publicUrl,
                bucket: "mutation-evidence",
                filePath: globalOcrMatch.filePath,
                ocrText: globalOcrMatch.ocrText,
                extracted: {
                  bukti_url: globalOcrMatch.publicUrl,
                },
              },
            }
          );

          if (error) {
            console.error("[OCR][SAVE][GLOBAL_CONFIRM] gagal simpan OCR ke bank_mutations", {
              bankMutationId: globalOcrMatch.selectedId,
              filePath: globalOcrMatch.filePath,
              publicUrl: globalOcrMatch.publicUrl,
              error,
            });
            toast({
              title: "Gagal menyimpan OCR",
              description: error.message,
              variant: "destructive",
            });
            return;
          }

          toast({
            title: "Berhasil",
            description: "OCR tersimpan ke baris mutasi yang dipilih",
          });

          setGlobalOcrMatch({
            open: false,
            candidates: [],
            selectedId: null,
            fallbackMatch: {},
            ocrText: "",
            filePath: "",
            publicUrl: "",
          });

          fetchData();
        }}
      />

      {/* Tax Extraction Modal */}
      <TaxExtractionModal
        bankMutationId={taxExtractionModal.bankMutationId}
        ocrText={taxExtractionModal.ocrText}
        open={taxExtractionModal.open}
        onOpenChange={(open) =>
          setTaxExtractionModal({ ...taxExtractionModal, open })
        }
        onSuccess={() => {
          toast({
            title: "Success",
            description: "Tax data extracted successfully",
          });
          markTaxExtracted(taxExtractionModal.bankMutationId);
          fetchData(); // Refresh data
        }}
      />
    </div>
  );
}
