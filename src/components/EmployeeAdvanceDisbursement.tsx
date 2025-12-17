import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send } from "lucide-react";

interface Advance {
  id: string;
  advance_number: string;
  employee_name: string;
  advance_date: string;
  advance_amount: number;
  remaining_balance: number;
  status: string;
  coa_account_code: string;
}

interface COAAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
}

export default function EmployeeAdvanceDisbursement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [kasAccounts, setKasAccounts] = useState<COAAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<COAAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<string>("");
  const [disbursementForm, setDisbursementForm] = useState({
    disbursement_method: "Kas",
    disbursement_account_id: "",
    disbursement_date: new Date().toISOString().split("T")[0],
    reference_number: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load pending advances
      const { data: advancesData, error: advancesError } = await supabase
        .from("vw_employee_advance_summary")
        .select("*")
        .eq("status", "requested")
        .order("advance_date", { ascending: false });

      if (advancesError) throw advancesError;
      setAdvances(advancesData || []);

      // Load Kas accounts
      const { data: kasData, error: kasError } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .in("account_code", ["1-1101", "1-1102"]);

      if (kasError) throw kasError;
      setKasAccounts(kasData || []);

      // Load Bank accounts
      const { data: bankData, error: bankError } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .like("account_code", "1-12%");

      if (bankError) throw bankError;
      setBankAccounts(bankData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
    }
  };

  const handleDisburse = async () => {
    if (!selectedAdvance || !disbursementForm.disbursement_account_id) {
      toast({
        title: "Error",
        description: "Pilih uang muka dan akun sumber dana",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-employee-advance-disburse",
        {
          body: {
            advance_id: selectedAdvance,
            disbursement_method: disbursementForm.disbursement_method,
            disbursement_account_id: disbursementForm.disbursement_account_id,
            disbursement_date: disbursementForm.disbursement_date,
            reference_number: disbursementForm.reference_number,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Success",
        description: "Uang muka berhasil dicairkan",
      });

      // Reset form
      setSelectedAdvance("");
      setDisbursementForm({
        disbursement_method: "Kas",
        disbursement_account_id: "",
        disbursement_date: new Date().toISOString().split("T")[0],
        reference_number: "",
      });

      // Reload data
      loadData();
    } catch (error) {
      console.error("Error disbursing advance:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mencairkan uang muka",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      requested: "default",
      disbursed: "secondary",
      settled: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const selectedAdvanceData = advances.find((a) => a.id === selectedAdvance);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cairkan Uang Muka</CardTitle>
          <CardDescription>
            Proses pencairan uang muka karyawan dan buat jurnal otomatis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Select Advance */}
          <div className="space-y-2">
            <Label>Pilih Uang Muka *</Label>
            <Select value={selectedAdvance} onValueChange={setSelectedAdvance}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih uang muka yang akan dicairkan" />
              </SelectTrigger>
              <SelectContent>
                {advances.map((adv) => (
                  <SelectItem key={adv.id} value={adv.id}>
                    {adv.advance_number} - {adv.employee_name} (Rp{" "}
                    {adv.advance_amount.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Advance Details */}
          {selectedAdvanceData && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nomor Uang Muka</p>
                    <p className="font-mono font-bold">
                      {selectedAdvanceData.advance_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Karyawan</p>
                    <p className="font-bold">{selectedAdvanceData.employee_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Jumlah</p>
                    <p className="font-bold text-lg">
                      Rp {selectedAdvanceData.advance_amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tanggal Pengajuan</p>
                    <p className="font-bold">
                      {new Date(selectedAdvanceData.advance_date).toLocaleDateString(
                        "id-ID"
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disbursement Details */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Detail Pencairan</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Metode Pencairan *</Label>
                <Select
                  value={disbursementForm.disbursement_method}
                  onValueChange={(value) =>
                    setDisbursementForm({
                      ...disbursementForm,
                      disbursement_method: value,
                      disbursement_account_id: "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kas">Kas</SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {disbursementForm.disbursement_method === "Bank" && (
                <div className="space-y-2">
                  <Label>Rekening Bank *</Label>
                  <Select
                    value={disbursementForm.disbursement_account_id}
                    onValueChange={(value) =>
                      setDisbursementForm({
                        ...disbursementForm,
                        disbursement_account_id: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih rekening bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.account_code} - {bank.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {disbursementForm.disbursement_method === "Kas" && (
                <div className="space-y-2">
                  <Label>Kas *</Label>
                  <Select
                    value={disbursementForm.disbursement_account_id}
                    onValueChange={(value) =>
                      setDisbursementForm({
                        ...disbursementForm,
                        disbursement_account_id: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kas" />
                    </SelectTrigger>
                    <SelectContent>
                      {kasAccounts.map((kas) => (
                        <SelectItem key={kas.id} value={kas.id}>
                          {kas.account_code} - {kas.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Pencairan *</Label>
                <Input
                  type="date"
                  value={disbursementForm.disbursement_date}
                  onChange={(e) =>
                    setDisbursementForm({
                      ...disbursementForm,
                      disbursement_date: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>No. Bukti / Reference</Label>
                <Input
                  type="text"
                  placeholder="Nomor bukti atau referensi"
                  value={disbursementForm.reference_number}
                  onChange={(e) =>
                    setDisbursementForm({
                      ...disbursementForm,
                      reference_number: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleDisburse}
            disabled={isLoading || !selectedAdvance}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Cairkan Uang Muka
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Disbursed Advances List */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pencairan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Uang Muka</TableHead>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Tgl Pencairan</TableHead>
                  <TableHead>No. Bukti</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advances
                  .filter((a) => a.status === "disbursed")
                  .map((adv) => (
                    <TableRow key={adv.id}>
                      <TableCell className="font-mono">{adv.advance_number}</TableCell>
                      <TableCell>{adv.employee_name}</TableCell>
                      <TableCell>Rp {adv.advance_amount.toLocaleString()}</TableCell>
                      <TableCell>{adv.disbursement_method || "-"}</TableCell>
                      <TableCell>
                        {adv.disbursement_date
                          ? new Date(adv.disbursement_date).toLocaleDateString("id-ID")
                          : "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {adv.reference_number || "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(adv.status)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
