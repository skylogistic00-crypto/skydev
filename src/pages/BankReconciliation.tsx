import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  Link2,
  ArrowRightLeft,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BankMutationStaging {
  id: string;
  tanggal: string;
  keterangan: string;
  debit: number;
  kredit: number;
  saldo: number;
  bank_account_id: string;
  bank_account_name?: string;
  review_status: "PENDING" | "APPROVED" | "MATCHED" | "REJECTED";
  matched_transaction_id?: string;
  created_at: string;
}

interface MatchResult {
  mutation_id: string;
  matched: boolean;
  matched_transaction_id?: string;
  match_type?: string;
  confidence?: number;
}

export default function BankReconciliation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mutations, setMutations] = useState<BankMutationStaging[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("APPROVED");
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadMutations();
  }, [selectedStatus]);

  // C1️⃣ LOAD DATA
  const loadMutations = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("bank_mutations_staging")
        .select("*")
        .order("tanggal", { ascending: false });
      
      if (selectedStatus !== "ALL") {
        query = query.eq("review_status", selectedStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading mutations:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data mutasi bank",
          variant: "destructive",
        });
        return;
      }

      setMutations(data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // C2️⃣ APPROVE MUTATION
  const handleApproveMutation = async (mutation: BankMutationStaging) => {
    try {
      setProcessing(mutation.id);

      const { error } = await supabase
        .from("bank_mutations_staging")
        .update({ review_status: "APPROVED" })
        .eq("id", mutation.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Berhasil",
        description: "Mutasi berhasil di-approve",
      });

      loadMutations();
    } catch (err: any) {
      console.error("Error approving:", err);
      toast({
        title: "Error",
        description: err.message || "Gagal approve mutasi",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  // C3️⃣ AUTO MATCH CALL
  const handleAutoMatch = async (mutation: BankMutationStaging) => {
    try {
      setProcessing(mutation.id);

      const { data, error } = await supabase.rpc("auto_match_bank_mutation", {
        p_mutation_id: mutation.id
      });

      if (error) {
        throw error;
      }

      const result = data as MatchResult;

      if (result?.matched) {
        toast({
          title: "Match Ditemukan",
          description: `Mutasi berhasil di-match dengan transaksi ${result.match_type || "existing"}`,
        });
      } else {
        toast({
          title: "Info",
          description: "Tidak ditemukan transaksi yang cocok",
          variant: "default",
        });
      }

      loadMutations();
    } catch (err: any) {
      console.error("Error auto matching:", err);
      toast({
        title: "Error",
        description: err.message || "Gagal melakukan auto match",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  // Batch auto match for all approved mutations
  const handleBatchAutoMatch = async () => {
    const approvedMutations = mutations.filter(m => m.review_status === "APPROVED");
    
    if (approvedMutations.length === 0) {
      toast({
        title: "Info",
        description: "Tidak ada mutasi dengan status APPROVED",
      });
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const mutation of approvedMutations) {
      try {
        const { data, error } = await supabase.rpc("auto_match_bank_mutation", {
          p_mutation_id: mutation.id
        });

        if (error) throw error;
        if (data?.matched) successCount++;
        else failCount++;
      } catch (err) {
        failCount++;
      }
    }

    toast({
      title: "Batch Match Selesai",
      description: `${successCount} berhasil match, ${failCount} tidak ditemukan match`,
    });

    loadMutations();
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "APPROVED":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Approved</Badge>;
      case "MATCHED":
        return <Badge variant="default" className="bg-green-100 text-green-800">Matched</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredMutations = mutations.filter(m => 
    m.keterangan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.bank_account_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                Bank Reconciliation
              </CardTitle>
              <CardDescription>
                Review dan match mutasi bank dengan transaksi
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMutations}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label>Filter Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="MATCHED">Matched</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Label>Cari</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari keterangan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Button
              onClick={handleBatchAutoMatch}
              disabled={loading || mutations.filter(m => m.review_status === "APPROVED").length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Batch Auto Match
            </Button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-yellow-50">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-yellow-700">
                  {mutations.filter(m => m.review_status === "PENDING").length}
                </div>
                <div className="text-sm text-yellow-600">Pending</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-700">
                  {mutations.filter(m => m.review_status === "APPROVED").length}
                </div>
                <div className="text-sm text-blue-600">Approved</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-700">
                  {mutations.filter(m => m.review_status === "MATCHED").length}
                </div>
                <div className="text-sm text-green-600">Matched</div>
              </CardContent>
            </Card>
            <Card className="bg-red-50">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-700">
                  {mutations.filter(m => m.review_status === "REJECTED").length}
                </div>
                <div className="text-sm text-red-600">Rejected</div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : filteredMutations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Tidak ada data mutasi</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[100px]">Tanggal</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Kredit</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMutations.map((mutation) => (
                    <TableRow key={mutation.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(mutation.tanggal)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[300px] truncate" title={mutation.keterangan}>
                          {mutation.keterangan}
                        </div>
                        {mutation.bank_account_name && (
                          <div className="text-xs text-gray-500">
                            {mutation.bank_account_name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {mutation.debit > 0 ? formatCurrency(mutation.debit) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {mutation.kredit > 0 ? formatCurrency(mutation.kredit) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(mutation.saldo)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(mutation.review_status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          {mutation.review_status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveMutation(mutation)}
                              disabled={processing === mutation.id}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              {processing === mutation.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                          )}
                          {mutation.review_status === "APPROVED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAutoMatch(mutation)}
                              disabled={processing === mutation.id}
                              className="text-purple-600 border-purple-300 hover:bg-purple-50"
                            >
                              {processing === mutation.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Link2 className="w-4 h-4 mr-1" />
                                  Auto Match
                                </>
                              )}
                            </Button>
                          )}
                          {mutation.review_status === "MATCHED" && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              Matched
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
