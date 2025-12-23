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
  XCircle,
  Loader2, 
  RefreshCw,
  FileCheck,
  AlertTriangle
} from "lucide-react";
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
  review_status: "REQUIRED" | "AUTO" | "APPROVED" | "REJECTED";
  is_ambiguous?: boolean;
  debit_account_code?: string;
  credit_account_code?: string;
  ai_confidence?: number;
  created_at: string;
}

interface ManualAccountSelection {
  [mutationId: string]: string;
}

export default function BankMutationReview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mutations, setMutations] = useState<BankMutationStaging[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [manualSelections, setManualSelections] = useState<ManualAccountSelection>({});

  useEffect(() => {
    loadMutations();
  }, []);

  const loadMutations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("bank_mutations_staging")
        .select("*")
        .in("review_status", ["REQUIRED", "AUTO"])
        .order("tanggal", { ascending: false });

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

  const handleApprove = async (mutation: BankMutationStaging) => {
    try {
      setProcessing(mutation.id);

      // Update to APPROVED
      const { error: updateError } = await supabase
        .from("bank_mutations_staging")
        .update({ review_status: "APPROVED" })
        .eq("id", mutation.id);

      if (updateError) {
        throw updateError;
      }

      // Call auto_match_bank_mutation RPC
      const { error: rpcError } = await supabase.rpc("auto_match_bank_mutation", {
        p_mutation_id: mutation.id
      });

      if (rpcError) {
        console.error("RPC error:", rpcError);
        toast({
          title: "Approved with Warning",
          description: "Mutasi approved tetapi auto match gagal",
          variant: "default",
        });
      } else {
        toast({
          title: "Berhasil",
          description: "Mutasi approved dan berhasil di-match",
        });
      }

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

  const handleReject = async (mutation: BankMutationStaging) => {
    try {
      setProcessing(mutation.id);

      const { error } = await supabase
        .from("bank_mutations_staging")
        .update({ review_status: "REJECTED" })
        .eq("id", mutation.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Rejected",
        description: "Mutasi berhasil di-reject",
      });

      loadMutations();
    } catch (err: any) {
      console.error("Error rejecting:", err);
      toast({
        title: "Error",
        description: err.message || "Gagal reject mutasi",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
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

  const getStatusBadge = (mutation: BankMutationStaging) => {
    if (mutation.is_ambiguous) {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Ambiguous
        </Badge>
      );
    }
    
    if (mutation.review_status === "AUTO") {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Auto
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        Required
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Bank Mutation Review
              </CardTitle>
              <CardDescription>
                Review dan approve mutasi bank sebelum matching
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
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-orange-50">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-orange-700">
                  {mutations.filter(m => m.is_ambiguous).length}
                </div>
                <div className="text-sm text-orange-600">Ambiguous</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-700">
                  {mutations.filter(m => m.review_status === "AUTO").length}
                </div>
                <div className="text-sm text-blue-600">Auto</div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-yellow-700">
                  {mutations.filter(m => m.review_status === "REQUIRED").length}
                </div>
                <div className="text-sm text-yellow-600">Required</div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : mutations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Tidak ada mutasi yang perlu direview</p>
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
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Manual Selection</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mutations.map((mutation) => (
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
                        {mutation.ai_confidence && (
                          <div className="text-xs text-gray-500">
                            Confidence: {mutation.ai_confidence}%
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {mutation.debit > 0 ? formatCurrency(mutation.debit) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {mutation.kredit > 0 ? formatCurrency(mutation.kredit) : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(mutation)}
                      </TableCell>
                      <TableCell>
                        {mutation.is_ambiguous ? (
                          <div className="w-[200px]">
                            <Select
                              value={manualSelections[mutation.id] || ""}
                              onValueChange={(value) => {
                                setManualSelections({
                                  ...manualSelections,
                                  [mutation.id]: value
                                });
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih Akun" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1-2100">Piutang Karyawan</SelectItem>
                                <SelectItem value="6-2000">Beban Operasional</SelectItem>
                                <SelectItem value="1-3100">Uang Muka Proyek</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(mutation)}
                            disabled={
                              processing === mutation.id ||
                              (mutation.is_ambiguous && !manualSelections[mutation.id])
                            }
                            className="text-green-600 border-green-300 hover:bg-green-50"
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(mutation)}
                            disabled={processing === mutation.id}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            {processing === mutation.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </>
                            )}
                          </Button>
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
