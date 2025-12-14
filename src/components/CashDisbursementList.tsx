import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Download, Calendar, XCircle, RefreshCw, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface CashDisbursement {
  id: string;
  transaction_date: string;
  document_number: string;
  payee_name: string;
  description: string;
  category?: string;
  amount: number;
  tax_amount?: number;
  payment_method: string;
  approval_status: string;
  journal_ref?: string;
  coa_expense_code?: string;
  coa_cash_code?: string;
  account_code?: string;
  account_name?: string;
  notes?: string;
  created_at: string;
}

export default function CashDisbursementList() {
  const [disbursements, setDisbursements] = useState<CashDisbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [postingId, setPostingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [selectedDisbursement, setSelectedDisbursement] = useState<CashDisbursement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDisbursements();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("cash-disbursement-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cash_disbursement" },
        () => {
          fetchDisbursements();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDisbursements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("cash_disbursement")
        .select("*")
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      setDisbursements(data || []);
    } catch (error: any) {
      console.error("Error fetching cash disbursements:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengeluaran kas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelJournal = async () => {
    if (!selectedDisbursement || !selectedDisbursement.journal_ref) {
      toast({
        title: "⚠️ Peringatan",
        description: "Tidak ada jurnal yang terkait dengan transaksi ini",
        variant: "destructive",
      });
      setShowCancelDialog(false);
      return;
    }

    try {
      setCancellingId(selectedDisbursement.id);

      // Call RPC cancel_journal
      const { data: rpcResult, error: rpcError } = await supabase.rpc("cancel_journal", {
        p_journal_ref: selectedDisbursement.journal_ref
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      // Check RPC result
      if (rpcResult && !rpcResult.success) {
        throw new Error(rpcResult.error || "Gagal membatalkan jurnal");
      }

      // Update cash_disbursement status back to "approved"
      const { error: updateError } = await supabase
        .from("cash_disbursement")
        .update({ 
          approval_status: "approved",
          journal_ref: null
        })
        .eq("id", selectedDisbursement.id);

      if (updateError) {
        throw new Error(`Jurnal dibatalkan tapi gagal update status: ${updateError.message}`);
      }

      toast({
        title: "✅ Berhasil",
        description: "Jurnal berhasil dibatalkan",
      });

      // Refresh data
      fetchDisbursements();

    } catch (error: any) {
      console.error("Error cancelling journal:", error);
      toast({
        title: "❌ Error",
        description: error.message || "Gagal membatalkan jurnal",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
      setShowCancelDialog(false);
      setSelectedDisbursement(null);
    }
  };

  const openCancelDialog = (disbursement: CashDisbursement) => {
    setSelectedDisbursement(disbursement);
    setShowCancelDialog(true);
  };

  const handlePostJournal = async () => {
    if (!selectedDisbursement) {
      toast({
        title: "⚠️ Peringatan",
        description: "Tidak ada transaksi yang dipilih",
        variant: "destructive",
      });
      setShowPostDialog(false);
      return;
    }

    try {
      setPostingId(selectedDisbursement.id);

      // Call edge function to post journal via Pica passthrough
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-post-journal",
        {
          body: {
            disbursement_id: selectedDisbursement.id
          }
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      // Check result
      if (data && !data.success) {
        throw new Error(data.error || "Gagal posting jurnal");
      }

      toast({
        title: "✅ Berhasil",
        description: "Jurnal berhasil diposting",
      });

      // Refresh data
      fetchDisbursements();

    } catch (error: any) {
      console.error("Error posting journal:", error);
      toast({
        title: "❌ Error",
        description: error.message || "Gagal posting jurnal",
        variant: "destructive",
      });
    } finally {
      setPostingId(null);
      setShowPostDialog(false);
      setSelectedDisbursement(null);
    }
  };

  const openPostDialog = (disbursement: CashDisbursement) => {
    setSelectedDisbursement(disbursement);
    setShowPostDialog(true);
  };

  const filteredDisbursements = disbursements.filter((item) => {
    // Date range filter
    if (filterDateFrom || filterDateTo) {
      const itemDate = new Date(item.transaction_date);
      if (filterDateFrom) {
        const fromDate = new Date(filterDateFrom);
        if (itemDate < fromDate) return false;
      }
      if (filterDateTo) {
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (itemDate > toDate) return false;
      }
    }

    // Search query filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.document_number?.toLowerCase().includes(query) ||
      item.payee_name?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query)
    );
  });

  const totalAmount = filteredDisbursements.reduce(
    (sum, item) => sum + (item.amount || 0),
    0,
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "waiting_approval":
        return <Badge className="bg-yellow-100 text-yellow-800">Menunggu</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Tanggal",
      "No. Dokumen",
      "Penerima",
      "Deskripsi",
      "Kategori",
      "Jumlah",
      "Status",
      "Journal Ref",
    ];
    const rows = filteredDisbursements.map((item) => [
      new Date(item.transaction_date).toLocaleDateString("id-ID"),
      item.document_number,
      item.payee_name,
      item.description,
      item.category || "-",
      item.amount,
      item.approval_status,
      item.journal_ref || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cash-disbursement-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4 bg-white">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-2xl font-bold text-slate-800">
              💸 Daftar Pengeluaran Kas
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDisbursements}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={filteredDisbursements.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari dokumen, penerima, deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                placeholder="Dari Tanggal"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                placeholder="Sampai Tanggal"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="text-sm text-red-600 font-medium">
                  Total Pengeluaran
                </div>
                <div className="text-2xl font-bold text-red-700 mt-1">
                  Rp {new Intl.NumberFormat("id-ID").format(totalAmount)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-sm text-blue-600 font-medium">
                  Jumlah Transaksi
                </div>
                <div className="text-2xl font-bold text-blue-700 mt-1">
                  {filteredDisbursements.length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="text-sm text-green-600 font-medium">
                  Dengan Jurnal
                </div>
                <div className="text-2xl font-bold text-green-700 mt-1">
                  {filteredDisbursements.filter(d => d.journal_ref).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="font-semibold">Tanggal</TableHead>
                  <TableHead className="font-semibold">No. Dokumen</TableHead>
                  <TableHead className="font-semibold">Penerima</TableHead>
                  <TableHead className="font-semibold">Deskripsi</TableHead>
                  <TableHead className="font-semibold text-right">Jumlah</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Journal Ref</TableHead>
                  <TableHead className="font-semibold text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        Memuat data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredDisbursements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Tidak ada data pengeluaran kas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDisbursements.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50">
                      <TableCell>
                        {new Date(item.transaction_date).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.document_number}
                      </TableCell>
                      <TableCell>{item.payee_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        Rp {new Intl.NumberFormat("id-ID").format(item.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.approval_status)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.journal_ref || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          {!item.journal_ref && item.approval_status === "approved" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openPostDialog(item)}
                              disabled={postingId === item.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {postingId === item.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Posting Jurnal
                                </>
                              )}
                            </Button>
                          )}
                          {item.journal_ref && item.approval_status === "approved" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openCancelDialog(item)}
                              disabled={cancellingId === item.id}
                            >
                              {cancellingId === item.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Batalkan Jurnal
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Jurnal?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan membatalkan jurnal dengan referensi:{" "}
              <strong>{selectedDisbursement?.journal_ref}</strong>
              <br /><br />
              Tindakan ini akan:
              <ul className="list-disc list-inside mt-2">
                <li>Membuat jurnal reversal otomatis</li>
                <li>Mengubah status transaksi kembali ke "Approved"</li>
                <li>Menghapus referensi jurnal dari transaksi</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelJournal}
              className="bg-red-600 hover:bg-red-700"
            >
              Ya, Batalkan Jurnal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Post Journal Confirmation Dialog */}
      <AlertDialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Posting Jurnal?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan memposting jurnal untuk transaksi:{" "}
              <strong>{selectedDisbursement?.document_number}</strong>
              <br /><br />
              <strong>Penerima:</strong> {selectedDisbursement?.payee_name}
              <br />
              <strong>Jumlah:</strong> Rp {new Intl.NumberFormat("id-ID").format(selectedDisbursement?.amount || 0)}
              <br /><br />
              Tindakan ini akan:
              <ul className="list-disc list-inside mt-2">
                <li>Membuat jurnal entry otomatis</li>
                <li>Mengubah status transaksi menjadi "Posted"</li>
                <li>Menambahkan referensi jurnal ke transaksi</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePostJournal}
              className="bg-green-600 hover:bg-green-700"
            >
              Ya, Posting Jurnal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
