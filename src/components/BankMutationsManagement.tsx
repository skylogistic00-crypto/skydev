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
import { cn } from "@/lib/utils";
import OCRScanButton from "./OCRScanButton";
import { TaxExtractionModal } from "./TaxExtractionModal";
import { OCRBankMutationMatchDialog } from "@/components/OCRBankMutationMatchDialog";
import {
  InvoiceExtractionConfirmDialog,
  type InvoiceExtractionPreview,
} from "@/components/InvoiceExtractionConfirmDialog";
import {
  TaxInvoiceExtractionConfirmDialog,
  type TaxInvoiceExtractionPreview,
} from "@/components/TaxInvoiceExtractionConfirmDialog";
import {
  BankMutationJournalPreviewDialog,
  type JournalDraftLine,
} from "@/components/BankMutationJournalPreviewDialog";

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

  // Bukti pendukung
  bukti_url: string | null;

  approval_status: "approved" | "rejected" | "waiting_approval" | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  ocr_text: string | null;

  // Tax extraction result (legacy/denormalized fields)
  // NOTE: source-of-truth hasil extract ada di tables `invoices` dan `tax_invoices`.
  // Relasi ke setiap row `bank_mutations` melalui `transaction_links`.
  // Field di bawah ini hanya untuk compatibility UI lama.
  invoice_id: string | null;
  dpp_amount: number | null;
  ppn_amount: number | null;
  pph_amount: number | null;
  gross_amount: number | null;
  tax_extraction_status: string | null;

  // Derived (loaded from transaction_links)
  linked_invoice_id?: string | null;
  linked_tax_invoice_id?: string | null;

  vat_amount?: number | null;
  stamp_amount?: number | null;
  transaction_type?: string | null;
  revenue_account_code?: string | null;
  expense_account_code?: string | null;
  vat_output_account_code?: string | null;
  vat_input_account_code?: string | null;

  // Invoice attachment
  invoice_url?: string | null;
  invoice_storage_bucket?: string | null;
  invoice_file_path?: string | null;

  // Taxable selection (Pajak / Non Pajak)
  is_taxable?: boolean | null;

  // Invoice number (display)
  invoice_number?: string | null;

  // Faktur Pajak attachment
  faktur_pajak_url?: string | null;
  faktur_pajak_storage_bucket?: string | null;
  faktur_pajak_file_path?: string | null;
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

  const [journalPreview, setJournalPreview] = useState<{
    open: boolean;
    bankMutationId: string | null;
    transactionLinkId: string | null;
    defaultLines: JournalDraftLine[];
    bankMutationDate: string | null;
    jenisTransaksi: string | null;
  }>({
    open: false,
    bankMutationId: null,
    transactionLinkId: null,
    defaultLines: [],
    bankMutationDate: null,
    jenisTransaksi: null,
  });
  const [taxExtractionModal, setTaxExtractionModal] = useState<{
    open: boolean;
    bankMutationId: string;
    ocrText: string;
  }>({ open: false, bankMutationId: "", ocrText: "" });

  const [invoiceExtractConfirm, setInvoiceExtractConfirm] = useState<{
    open: boolean;
    bankMutationId: string;
    preview: InvoiceExtractionPreview | null;
    mode?: "confirm" | "view";
  }>({ open: false, bankMutationId: "", preview: null, mode: "confirm" });

  const [invoiceExtractSaving, setInvoiceExtractSaving] = useState(false);

  const [taxInvoiceExtractConfirm, setTaxInvoiceExtractConfirm] = useState<{
    open: boolean;
    bankMutationId: string;
    preview: TaxInvoiceExtractionPreview | null;
    mode?: "confirm" | "view";
  }>({ open: false, bankMutationId: "", preview: null, mode: "confirm" });

  const [taxInvoiceExtractSaving, setTaxInvoiceExtractSaving] = useState(false);

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
        invoice_number,
        invoice_date,
        tax_invoice_number,
        tax_invoice_date,
        ocr_result,
        confidence_score,
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
        invoice_url,
        invoice_storage_bucket,
        invoice_file_path,
        is_taxable,
        faktur_pajak_url,
        faktur_pajak_storage_bucket,
        faktur_pajak_file_path
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

    const baseRows = ((data as BankMutationView[]) || []) as BankMutationView[];

    // Load persistent extraction status from `transaction_links`
    const ids = baseRows.map((r) => r.id).filter(Boolean);
    if (ids.length) {
      const { data: links } = await supabase
        .from("transaction_links" as any)
        .select("bank_mutation_id, invoice_id, tax_invoice_id")
        .in("bank_mutation_id", ids);

      const linkMap = new Map<string, { invoice_id?: string | null; tax_invoice_id?: string | null }>();
      (links ?? []).forEach((l: any) => {
        if (!l?.bank_mutation_id) return;
        linkMap.set(l.bank_mutation_id, {
          invoice_id: l.invoice_id ?? null,
          tax_invoice_id: l.tax_invoice_id ?? null,
        });
      });

      baseRows.forEach((r) => {
        const link = linkMap.get(r.id);
        r.linked_invoice_id = link?.invoice_id ?? null;
        r.linked_tax_invoice_id = link?.tax_invoice_id ?? null;
      });
    }

    setRows(baseRows);
    setLoading(false);
  }, [dateFrom, dateTo, searchDesc, statusFilter, toast]);

  useEffect(() => {
    if (hasAccess) fetchData();
  }, [hasAccess, fetchData]);

  /* =====================================================
     APPROVE → OPEN PREVIEW (SAVE/POST/CANCEL to bank_mutation_journal_drafts)
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

      const { data: link, error: linkError } = await supabase
        .from("transaction_links" as any)
        .select("id")
        .eq("bank_mutation_id", row.id)
        .maybeSingle();

      if (linkError) throw linkError;
      if (!(link as any)?.id) {
        throw new Error("Transaction link belum ada untuk mutasi ini");
      }

      const { data: existingDraft, error: draftError } = await supabase
        .from("bank_mutation_journal_drafts" as any)
        .select("draft_lines, status")
        .eq("bank_mutation_id", row.id)
        .maybeSingle();

      if (draftError) throw draftError;

      // Start blank on first open. (If there's an existing draft, it will load below.)
      const defaultLinesFromRow: JournalDraftLine[] = [];

      const defaultLines: JournalDraftLine[] = Array.isArray((existingDraft as any)?.draft_lines)
        ? (((existingDraft as any).draft_lines ?? []) as any)
        : defaultLinesFromRow;

      setJournalPreview({
        open: true,
        bankMutationId: row.id,
        transactionLinkId: (link as any).id,
        defaultLines,
        bankMutationDate: (row as any).date ?? null,
        jenisTransaksi: (row as any).direction ?? null,
      });
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

      // Update bukti_url di bank_mutations (Bukti pendukung ONLY)
      const { error: updateError } = await supabase
        .from("bank_mutations")
        .update({
          bukti_url: urlData.publicUrl,
        })
        .eq("id", rowId);

      if (updateError) throw updateError;

      toast({
        title: "Berhasil",
        description: "Bukti berhasil diupload",
      });

      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, bukti_url: urlData.publicUrl } : r))
      );
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
                  <TableHead className="w-[120px] min-w-[120px] text-center">Pajak/Non Pajak</TableHead>
                  <TableHead className="w-[120px] min-w-[120px] text-center">Bukti</TableHead>
                  <TableHead className="w-[120px] min-w-[120px] text-center">Invoice</TableHead>
                  <TableHead className="w-[180px] min-w-[180px] text-center">Invoice Extraction</TableHead>
                  <TableHead className="w-[220px] min-w-[220px] text-center">Faktur Pajak</TableHead>
                  <TableHead className="w-[180px] min-w-[180px] text-center">Tax Extraction</TableHead>
                  {statusFilter !== "pending" && (
                    <TableHead className="w-[80px] min-w-[80px] text-center">Status</TableHead>
                  )}
                  <TableHead className="w-[100px] min-w-[100px] text-center">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={statusFilter === "pending" ? 14 : 15} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={statusFilter === "pending" ? 14 : 15} className="text-center py-10 text-muted-foreground">
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
                          <div className="flex items-center justify-center gap-1">
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant={row.is_taxable === true ? "default" : "outline"}
                                onClick={async () => {
                                  const nextVal = true;

                                  const { data, error, status } = await supabase
                                    .from("bank_mutations")
                                    .update({ is_taxable: nextVal })
                                    .eq("id", row.id)
                                    .select("id, is_taxable")
                                    .maybeSingle();

                                  if (error) {
                                    toast({
                                      title: "Gagal update",
                                      description: `${error.message} (status: ${status ?? "?"})`,
                                      variant: "destructive",
                                    });
                                    fetchData();
                                    return;
                                  }

                                  if (!data) {
                                    toast({
                                      title: "Tidak ada perubahan",
                                      description: "Update tidak mengembalikan data. Cek Network tab untuk response Supabase.",
                                      variant: "destructive",
                                    });
                                    fetchData();
                                    return;
                                  }

                                  setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_taxable: data.is_taxable } : r)));
                                }}
                                className={cn("h-7 px-2 text-xs", row.is_taxable === true && "bg-green-600 hover:bg-green-700")}
                                title="Pajak"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={row.is_taxable === false ? "default" : "outline"}
                                onClick={async () => {
                                  const nextVal = false;

                                  const { data, error, status } = await supabase
                                    .from("bank_mutations")
                                    .update({ is_taxable: nextVal })
                                    .eq("id", row.id)
                                    .select("id, is_taxable")
                                    .maybeSingle();

                                  if (error) {
                                    toast({
                                      title: "Gagal update",
                                      description: `${error.message} (status: ${status ?? "?"})`,
                                      variant: "destructive",
                                    });
                                    fetchData();
                                    return;
                                  }

                                  if (!data) {
                                    toast({
                                      title: "Tidak ada perubahan",
                                      description: "Update tidak mengembalikan data. Cek Network tab untuk response Supabase.",
                                      variant: "destructive",
                                    });
                                    fetchData();
                                    return;
                                  }

                                  setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_taxable: data.is_taxable } : r)));
                                }}
                                className={cn("h-7 px-2 text-xs", row.is_taxable === false && "bg-red-600 hover:bg-red-700")}
                                title="Non Pajak"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          </div>
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
                                }}
                                onImageUploaded={() => {
                                  // Upload != OCR success. Keep quiet here; we'll toast only after edge function success.
                                }}
                                onPersisted={({ bankMutationId, publicUrl }) => {
                                  if (!bankMutationId) return;
                                  setRows((prev) =>
                                    prev.map((r) =>
                                      r.id === bankMutationId
                                        ? { ...r, bukti_url: publicUrl, tax_extraction_status: null }
                                        : r
                                    )
                                  );
                                }}
                              />
                            </div>
                          )}
                        </TableCell>

                        {/* Invoice (upload/link only) */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {row.invoice_url ? (
                              <a
                                href={row.invoice_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  "text-blue-600 hover:underline text-xs",
                                  row.is_taxable !== true && "pointer-events-none opacity-50"
                                )}
                                title={row.invoice_number ?? undefined}
                              >
                                Lihat
                              </a>
                            ) : (
                              <div
                                className={cn(row.is_taxable !== true && "pointer-events-none opacity-50")}
                                title={
                                  row.is_taxable === null
                                    ? "Pilih Pajak/Non Pajak dulu"
                                    : row.is_taxable === false
                                      ? "Non Pajak"
                                      : undefined
                                }
                              >
                                <OCRScanButton
                                  bankMutationId={row.id}
                                  bucketName="ocr-receipts"
                                  folderPath="invoice"
                                  extractedFields={{
                                    invoice_url: row.invoice_url ?? null,
                                    invoice_number: row.invoice_number ?? null,
                                  }}
                                  onPersisted={({ bankMutationId, publicUrl, filePath, ocrText }) => {
                                    if (!bankMutationId) return;

                                    supabase
                                      .from("bank_mutations")
                                      .update({
                                        invoice_url: publicUrl,
                                        invoice_storage_bucket: "ocr-receipts",
                                        invoice_file_path: filePath,
                                        ocr_text: ocrText,
                                      })
                                      .eq("id", bankMutationId)
                                      .then(() => {
                                        setRows((prev) =>
                                          prev.map((r) =>
                                            r.id === bankMutationId
                                              ? {
                                                  ...r,
                                                  invoice_url: publicUrl,
                                                  invoice_storage_bucket: "ocr-receipts",
                                                  invoice_file_path: filePath,
                                                  ocr_text: ocrText,
                                                }
                                              : r
                                          )
                                        );
                                      });
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Invoice Extraction (extract + view result) */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {(!!row.linked_invoice_id || !!row.invoice_number) && (
                              <Badge variant="secondary" className="text-[10px]">
                                Extracted
                              </Badge>
                            )}

                            {!!row.invoice_url && !!row.ocr_text && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={row.is_taxable !== true || !!row.linked_invoice_id || !!row.invoice_number || !!row.invoice_id}
                                onClick={async () => {
                                  try {
                                    const { data, error } = await supabase.functions.invoke(
                                      "supabase-functions-ai-invoice-extractor",
                                      {
                                        body: {
                                          bank_mutation_id: row.id,
                                          document_type: "invoice",
                                          ocr_text: row.ocr_text,
                                        },
                                      }
                                    );

                                    if (error) {
                                      toast({
                                        title: "Extract Invoice gagal",
                                        description: error.message,
                                        variant: "destructive",
                                      });
                                      return;
                                    }

                                    const extracted = (data as any)?.data as InvoiceExtractionPreview | undefined;
                                    if (!extracted) {
                                      toast({
                                        title: "Extract Invoice gagal",
                                        description: "Response tidak valid",
                                        variant: "destructive",
                                      });
                                      return;
                                    }

                                    setInvoiceExtractConfirm({
                                      open: true,
                                      bankMutationId: row.id,
                                      preview: extracted,
                                      mode: "confirm",
                                    });
                                  } catch (e: any) {
                                    toast({
                                      title: "Extract Invoice gagal",
                                      description: e?.message ?? "Unknown error",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                className="h-8 px-2"
                                title={row.is_taxable !== true ? "Hanya untuk Pajak" : "Extract Invoice Information"}
                              >
                                <FileText
                                  className={cn(
                                    "h-4 w-4",
                                    row.is_taxable !== true ? "text-muted-foreground" : "text-indigo-600"
                                  )}
                                />
                              </Button>
                            )}

                            {(!!row.linked_invoice_id || !!row.invoice_number || !!row.invoice_id) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2"
                                title="Lihat hasil extract invoice"
                                onClick={async () => {
                                  const invoiceId = row.linked_invoice_id ?? row.invoice_id;
                                  if (invoiceId) {
                                    const { data, error } = await supabase
                                      .from("invoices")
                                      .select("invoice_number, invoice_date, dpp, total, ppn, pph, ocr_result, confidence_score")
                                      .eq("id", invoiceId)
                                      .maybeSingle();

                                    if (!error && data) {
                                      setInvoiceExtractConfirm({
                                        open: true,
                                        bankMutationId: row.id,
                                        preview: {
                                          invoice_number: data.invoice_number ?? null,
                                          invoice_date: data.invoice_date ?? null,
                                          dpp: (data as any).dpp ?? null,
                                          total: (data as any).total ?? null,
                                          ppn: (data as any).ppn ?? null,
                                          pph: (data as any).pph ?? null,
                                          ocr_result: (data as any).ocr_result ?? (row as any).ocr_result ?? "",
                                          confidence_score: (data as any).confidence_score ?? (row as any).confidence_score ?? 0,
                                        },
                                        mode: "view",
                                      });
                                      return;
                                    }
                                  }

                                  setInvoiceExtractConfirm({
                                    open: true,
                                    bankMutationId: row.id,
                                    preview: {
                                      invoice_number: row.invoice_number ?? null,
                                      invoice_date: (row as any).invoice_date ?? null,
                                      dpp: (row as any).dpp_amount ?? null,
                                      total: (row as any).total_amount ?? (row as any).gross_amount ?? null,
                                      ppn: (row as any).ppn_amount ?? null,
                                      pph: (row as any).pph_amount ?? null,
                                      ocr_result: (row as any).ocr_result ?? "",
                                      confidence_score: (row as any).confidence_score ?? 0,
                                    },
                                    mode: "view",
                                  });
                                }}
                              >
                                Lihat hasil
                              </Button>
                            )}

                            {row.invoice_number ? (
                              <span className="text-[10px] font-mono text-muted-foreground">{row.invoice_number}</span>
                            ) : null}
                          </div>
                        </TableCell>

                        {/* Faktur Pajak (upload/link only) */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {row.faktur_pajak_url ? (
                              <a
                                href={row.faktur_pajak_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  "text-blue-600 hover:underline text-xs",
                                  row.is_taxable !== true && "pointer-events-none opacity-50"
                                )}
                                title={row.invoice_id ?? undefined}
                              >
                                Lihat
                              </a>
                            ) : (
                              <div
                                className={cn(row.is_taxable !== true && "pointer-events-none opacity-50")}
                                title={row.is_taxable === null ? "Pilih Pajak/Non Pajak dulu" : row.is_taxable === false ? "Non Pajak" : undefined}
                              >
                                <OCRScanButton
                                  bankMutationId={row.id}
                                  bucketName="ocr-receipts"
                                  folderPath="faktur-pajak"
                                  extractedFields={{
                                    faktur_pajak_url: row.faktur_pajak_url ?? null,
                                    invoice_id: row.invoice_id ?? null,
                                    dpp_amount: row.dpp_amount ?? null,
                                    ppn_amount: row.ppn_amount ?? null,
                                    pph_amount: row.pph_amount ?? null,
                                    gross_amount: row.gross_amount ?? null,
                                    tax_extraction_status: row.tax_extraction_status ?? null,
                                  }}
                                  onPersisted={({ bankMutationId, publicUrl, filePath }) => {
                                    if (!bankMutationId) return;

                                    // Persist link + file meta (best-effort)
                                    supabase
                                      .from("bank_mutations")
                                      .update({
                                        faktur_pajak_url: publicUrl,
                                        faktur_pajak_storage_bucket: "ocr-receipts",
                                        faktur_pajak_file_path: filePath,
                                        tax_extraction_status: null,
                                      })
                                      .eq("id", bankMutationId)
                                      .then(() => {
                                        setRows((prev) =>
                                          prev.map((r) =>
                                            r.id === bankMutationId
                                              ? {
                                                  ...r,
                                                  faktur_pajak_url: publicUrl,
                                                  faktur_pajak_storage_bucket: "ocr-receipts",
                                                  faktur_pajak_file_path: filePath,
                                                  tax_extraction_status: null,
                                                }
                                              : r
                                          )
                                        );
                                      });
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Tax Extraction (extract + view result) */}
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            {(!!row.linked_tax_invoice_id || row.tax_extraction_status === "extracted" || extractedTaxIds.has(row.id)) && (
                              <Badge
                                variant="secondary"
                                className={cn("text-[10px]", row.is_taxable !== true && "opacity-50")}
                              >
                                Tax Extracted
                              </Badge>
                            )}

                            {!!row.faktur_pajak_url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={row.is_taxable !== true || !!row.linked_tax_invoice_id || row.tax_extraction_status === "extracted" || extractedTaxIds.has(row.id)}
                                onClick={async () => {
                                  try {
                                    const { data, error } = await supabase.functions.invoke(
                                      "supabase-functions-ai-invoice-extractor",
                                      {
                                        body: {
                                          bank_mutation_id: row.id,
                                          document_type: "tax_invoice",
                                          faktur_pajak_url: row.faktur_pajak_url,
                                        },
                                      }
                                    );

                                    if (error) {
                                      toast({
                                        title: "Extract Tax Info gagal",
                                        description: error.message,
                                        variant: "destructive",
                                      });
                                      return;
                                    }

                                    const extracted = (data as any)?.data as TaxInvoiceExtractionPreview | undefined;
                                    if (!extracted) {
                                      toast({
                                        title: "Extract Tax Info gagal",
                                        description: "Response tidak valid",
                                        variant: "destructive",
                                      });
                                      return;
                                    }

                                    setTaxInvoiceExtractConfirm({
                                      open: true,
                                      bankMutationId: row.id,
                                      preview: extracted,
                                      mode: "confirm",
                                    });
                                  } catch (e: any) {
                                    toast({
                                      title: "Extract Tax Info gagal",
                                      description: e?.message ?? "Unknown error",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                className="h-8 px-2"
                                title={
                                  row.is_taxable !== true
                                    ? "Hanya untuk Pajak"
                                    : !row.faktur_pajak_url
                                      ? "Upload Faktur Pajak dulu"
                                      : "Extract Tax Info"
                                }
                              >
                                <FileText className={cn("h-4 w-4", row.is_taxable !== true ? "text-muted-foreground" : "text-purple-600")} />
                                {(!!row.linked_tax_invoice_id || row.tax_extraction_status === "extracted" || extractedTaxIds.has(row.id)) && (
                                  <CheckCircle className={cn("h-3 w-3 ml-1", row.is_taxable !== true ? "text-muted-foreground" : "text-green-600")} />
                                )}
                              </Button>
                            )}

                            {(!!row.linked_tax_invoice_id || row.tax_extraction_status === "extracted" || extractedTaxIds.has(row.id)) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className={cn("h-7 px-2", row.is_taxable !== true && "opacity-50")}
                                title="Lihat hasil extract faktur pajak"
                                disabled={row.is_taxable !== true}
                                onClick={async () => {
                                  if (row.linked_tax_invoice_id) {
                                    const { data } = await supabase
                                      .from("tax_invoices" as any)
                                      .select("tax_invoice_number, tax_invoice_date, dpp, ppn, pph, total, ocr_result, confidence_score")
                                      .eq("id", row.linked_tax_invoice_id)
                                      .maybeSingle();

                                    if (data) {
                                      setTaxInvoiceExtractConfirm({
                                        open: true,
                                        bankMutationId: row.id,
                                        preview: {
                                          tax_invoice_number: data.tax_invoice_number ?? null,
                                          tax_invoice_date: data.tax_invoice_date ?? null,
                                          dpp: data.dpp ?? null,
                                          ppn: data.ppn ?? null,
                                          pph: data.pph ?? null,
                                          total: data.total ?? null,
                                          ocr_result: data.ocr_result ?? "",
                                          confidence_score: data.confidence_score ?? 0,
                                        },
                                        mode: "view",
                                      });
                                      return;
                                    }
                                  }

                                  setTaxInvoiceExtractConfirm({
                                    open: true,
                                    bankMutationId: row.id,
                                    preview: {
                                      tax_invoice_number: (row as any).tax_invoice_number ?? null,
                                      tax_invoice_date: (row as any).tax_invoice_date ?? null,
                                      dpp: row.dpp_amount ?? null,
                                      ppn: row.ppn_amount ?? null,
                                      pph: row.pph_amount ?? null,
                                      total: row.gross_amount ?? null,
                                      ocr_result: (row as any).ocr_result ?? "",
                                      confidence_score: (row as any).confidence_score ?? 0,
                                    },
                                    mode: "view",
                                  });
                                }}
                              >
                                Lihat hasil
                              </Button>
                            )}
                          </div>
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

      {/* Invoice Extraction Confirm Dialog */}
      <InvoiceExtractionConfirmDialog
        open={invoiceExtractConfirm.open}
        onOpenChange={(open) => setInvoiceExtractConfirm((prev) => ({ ...prev, open }))}
        preview={invoiceExtractConfirm.preview}
        mode={invoiceExtractConfirm.mode}
        isSaving={invoiceExtractSaving}
        onConfirm={async (next) => {
          if (!invoiceExtractConfirm.bankMutationId) return;
          setInvoiceExtractSaving(true);

          try {
            const { data: inserted, error } = await supabase
              .from("invoices")
              .insert({
                bank_mutation_id: invoiceExtractConfirm.bankMutationId,
                invoice_number: next.invoice_number,
                invoice_date: next.invoice_date,
                dpp: next.dpp,
                total: next.total,
                ppn: next.ppn,
                pph: next.pph,
                ocr_result: next.ocr_result,
                confidence_score: next.confidence_score,
              })
              .select("id")
              .maybeSingle();

            if (error) {
              toast({
                title: "Gagal simpan",
                description: error.message,
                variant: "destructive",
              });
              return;
            }

            toast({
              title: "Tersimpan",
              description: `Invoice berhasil disimpan${inserted?.id ? ` (ID: ${inserted.id})` : ""}`,
            });

            // Link to bank_mutations via transaction_links
            // `transaction_links.match_status` is NOT NULL, so we must provide it.
            if (inserted?.id) {
              const { data: existingLink } = await supabase
                .from("transaction_links" as any)
                .select("tax_invoice_id")
                .eq("bank_mutation_id", invoiceExtractConfirm.bankMutationId)
                .maybeSingle();

              await supabase
                .from("transaction_links" as any)
                .upsert(
                  {
                    bank_mutation_id: invoiceExtractConfirm.bankMutationId,
                    invoice_id: inserted.id,
                    tax_invoice_id: (existingLink as any)?.tax_invoice_id ?? null,
                    match_status: (existingLink as any)?.tax_invoice_id ? "full" : "partial",
                  } as any,
                  { onConflict: "bank_mutation_id" } as any
                );
            }

            setInvoiceExtractConfirm({ open: false, bankMutationId: "", preview: null, mode: "confirm" });
          } finally {
            setInvoiceExtractSaving(false);
          }
        }}
      />

      {/* Tax Invoice Extraction Confirm Dialog */}
      <TaxInvoiceExtractionConfirmDialog
        open={taxInvoiceExtractConfirm.open}
        onOpenChange={(open) => setTaxInvoiceExtractConfirm((prev) => ({ ...prev, open }))}
        preview={taxInvoiceExtractConfirm.preview}
        mode={taxInvoiceExtractConfirm.mode}
        isSaving={taxInvoiceExtractSaving}
        onConfirm={async (next) => {
          if (!taxInvoiceExtractConfirm.bankMutationId) return;
          setTaxInvoiceExtractSaving(true);

          try {
            const { data: inserted, error } = await supabase
              .from("tax_invoices")
              .insert({
                bank_mutation_id: taxInvoiceExtractConfirm.bankMutationId,
                tax_invoice_number: next.tax_invoice_number,
                tax_invoice_date: next.tax_invoice_date,
                dpp: next.dpp,
                ppn: next.ppn,
                pph: next.pph,
                total: next.total,
                ocr_result: next.ocr_result,
                confidence_score: next.confidence_score,
              })
              .select("id")
              .maybeSingle();

            if (error) {
              toast({
                title: "Gagal simpan",
                description: error.message,
                variant: "destructive",
              });
              return;
            }

            toast({
              title: "Tersimpan",
              description: `Faktur Pajak berhasil disimpan${inserted?.id ? ` (ID: ${inserted.id})` : ""}`,
            });

            // Link to bank_mutations via transaction_links
            // `transaction_links.match_status` is NOT NULL, so we must provide it.
            if (inserted?.id) {
              const { data: existingLink } = await supabase
                .from("transaction_links" as any)
                .select("invoice_id")
                .eq("bank_mutation_id", taxInvoiceExtractConfirm.bankMutationId)
                .maybeSingle();

              await supabase
                .from("transaction_links" as any)
                .upsert(
                  {
                    bank_mutation_id: taxInvoiceExtractConfirm.bankMutationId,
                    invoice_id: (existingLink as any)?.invoice_id ?? null,
                    tax_invoice_id: inserted.id,
                    match_status: (existingLink as any)?.invoice_id ? "full" : "partial",
                  } as any,
                  { onConflict: "bank_mutation_id" } as any
                );
            }

            // NOTE: hasil extract Faktur Pajak disimpan ke `tax_invoices`.
            // Jangan persist hasil extract ke `bank_mutations`.
            // Status setelah refresh akan ditentukan dari relasi `transaction_links` (tax_invoice_id).

            setExtractedTaxIds((prev) => {
              const nextSet = new Set(prev);
              nextSet.add(taxInvoiceExtractConfirm.bankMutationId);
              return nextSet;
            });

            setTaxInvoiceExtractConfirm({ open: false, bankMutationId: "", preview: null, mode: "confirm" });
          } finally {
            setTaxInvoiceExtractSaving(false);
          }
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
        onExtracted={(data) => {
          setRows((prev) =>
            prev.map((r) =>
              r.id === taxExtractionModal.bankMutationId
                ? {
                    ...r,
                    dpp_amount: data.dpp_amount,
                    ppn_amount: data.ppn_amount,
                    pph_amount: data.pph_amount,
                    gross_amount: data.gross_amount,
                    invoice_id: data.invoice_id,
                    tax_extraction_status: "extracted",
                  }
                : r
            )
          );

          setTaxExtractionModal((prev) => ({ ...prev, open: false }));
        }}
        onSuccess={() => {
          toast({
            title: "Success",
            description: "Tax data extracted successfully",
          });
          markTaxExtracted(taxExtractionModal.bankMutationId);
        }}
      />

      <BankMutationJournalPreviewDialog
        open={journalPreview.open}
        onOpenChange={(open) => setJournalPreview((prev) => ({ ...prev, open }))}
        bankMutationId={journalPreview.bankMutationId}
        transactionLinkId={journalPreview.transactionLinkId}
        bankMutationDate={journalPreview.bankMutationDate}
        jenisTransaksi={journalPreview.jenisTransaksi}
        defaultLines={journalPreview.defaultLines}
        onSaved={() => fetchData()}
        onCancelled={() => fetchData()}
        onPosted={() => fetchData()}
      />
    </div>
  );
}
