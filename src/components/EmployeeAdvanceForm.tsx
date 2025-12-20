import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Receipt,
  RotateCcw,
  Loader2,
  Plus,
  Upload,
  ScanLine,
  Send,
  Check,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import OCRScanner from "@/components/OCRScanner";

interface Employee {
  id: string;
  full_name: string;
}

interface Advance {
  id: string;
  advance_number: string;
  employee_id: string;
  employee_name: string;
  advance_date: string;
  amount: number;
  remaining_balance: number;
  status: string;
  coa_account_code: string;
  disbursement_method?: string;
  disbursement_date?: string;
  reference_number?: string;
  disbursement_account_id?: string;
  manager_approval?: string;
  finance_approval?: string;
}

export default function EmployeeAdvanceForm() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [kasAccounts, setKasAccounts] = useState<any[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<any[]>([]);
  const [showDisburseDialog, setShowDisburseDialog] = useState(false);
  const [selectedAdvanceForDisburse, setSelectedAdvanceForDisburse] = useState<Advance | null>(null);
  const [showSettlementsDialog, setShowSettlementsDialog] = useState(false);
  const [selectedAdvanceSettlements, setSelectedAdvanceSettlements] = useState<any[]>([]);
  const [disburseForm, setDisburseForm] = useState({
    disbursement_method: "Kas",
    disbursement_account_id: "",
    disbursement_date: new Date().toISOString().split("T")[0],
    reference_number: "",
  });

  // Form states
  const [advanceForm, setAdvanceForm] = useState({
    employee_id: "",
    employee_name: "",
    amount: 0,
    advance_date: new Date().toISOString().split("T")[0],
    notes: "",
    bukti_url: "",
  });

  const [settlementForm, setSettlementForm] = useState({
    advance_id: "",
    merchant: "",
    category: "",
    expense_account_code: "",
    amount: 0,
    ppn: 0,
    total: 0,
    description: "",
    receipt_number: "",
    settlement_date: new Date().toISOString().split("T")[0],
    bukti_url: "",
  });

  const [returnForm, setReturnForm] = useState({
    advance_id: "",
    amount: 0,
    return_date: new Date().toISOString().split("T")[0],
    payment_method: "Kas",
    bank_account_id: "",
    kas_account_id: "",
    notes: "",
    bukti_url: "",
  });

  useEffect(() => {
    fetchEmployees();
    fetchAdvances();
    fetchBankAccounts();
    fetchKasAccounts();
    fetchExpenseAccounts();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name")
      .order("full_name");

    if (error) {
      console.error("Error fetching employees:", error);
      return;
    }

    setEmployees(data || []);
  };

  const fetchAdvances = async () => {
    const { data, error } = await supabase
      .from("vw_employee_advance_summary")
      .select("*")
      .order("advance_date", { ascending: false });

    if (error) {
      console.error("Error fetching advances:", error);
      return;
    }

    console.log("Fetched advances:", data);
    setAdvances(data || []);
  };

  const fetchSettlements = async (advanceId: string) => {
    // Fetch advance details including notes to extract history
    const { data: advanceData, error: advanceError } = await supabase
      .from("employee_advances")
      .select("*")
      .eq("id", advanceId)
      .single();

    // Fetch settlements
    const { data: settlements, error: settlementsError } = await supabase
      .from("employee_advance_settlements")
      .select("*")
      .eq("advance_id", advanceId)
      .order("settlement_date", { ascending: false });

    // Fetch returns
    const { data: returns, error: returnsError } = await supabase
      .from("employee_advance_returns")
      .select("*")
      .eq("advance_id", advanceId)
      .order("return_date", { ascending: false });

    if (settlementsError || returnsError || advanceError) {
      console.error("Error fetching data:", settlementsError || returnsError || advanceError);
      toast({
        title: "Error",
        description: "Gagal mengambil data",
        variant: "destructive",
      });
      return;
    }

    // Parse notes to extract addition history
    const additionHistory: any[] = [];
    let totalAdditions = 0;
    if (advanceData?.notes) {
      const lines = advanceData.notes.split('\n');
      lines.forEach((line: string) => {
        const match = line.match(/\[([^\]]+)\] Penambahan: Rp ([\d.,]+) - (.+)/);
        if (match) {
          const amount = parseFloat(match[2].replace(/[.,]/g, ''));
          totalAdditions += amount;
          additionHistory.push({
            type: 'addition',
            date: match[1],
            amount: amount,
            notes: match[3]
          });
        }
      });
    }

    // Calculate initial amount (total - all additions)
    const initialAmount = (advanceData?.amount || 0) - totalAdditions;

    // Add initial advance as first addition
    const initialAddition = {
      type: 'initial',
      date: new Date(advanceData?.advance_date).toLocaleDateString('id-ID'),
      amount: initialAmount,
      notes: 'Uang muka awal'
    };

    // Combine all with type indicator
    const combined = [
      initialAddition,
      ...additionHistory,
      ...(settlements || []).map(s => ({ ...s, type: 'settlement' })),
      ...(returns || []).map(r => ({ ...r, type: 'return' }))
    ];

    setSelectedAdvanceSettlements(combined);
    setShowSettlementsDialog(true);
  };

  const handleApproval = async (advanceId: string, approvalType: 'manager' | 'finance', status: 'approved' | 'rejected') => {
    try {
      const updateField = approvalType === 'manager' ? 'manager_approval' : 'finance_approval';
      
      // Get current advance to check other approval status
      const { data: currentAdvance } = await supabase
        .from("employee_advances")
        .select("manager_approval, finance_approval")
        .eq("id", advanceId)
        .single();

      // Determine new status
      let newStatus = 'requested';
      if (status === 'rejected') {
        newStatus = 'rejected';
      } else {
        // Check if both approvals will be approved
        const managerApproval = approvalType === 'manager' ? status : currentAdvance?.manager_approval;
        const financeApproval = approvalType === 'finance' ? status : currentAdvance?.finance_approval;
        
        if (managerApproval === 'approved' && financeApproval === 'approved') {
          newStatus = 'requested'; // Ready for disbursement
        } else if (managerApproval === 'rejected' || financeApproval === 'rejected') {
          newStatus = 'rejected';
        }
      }
      
      const { error } = await supabase
        .from("employee_advances")
        .update({ 
          [updateField]: status,
          status: newStatus
        })
        .eq("id", advanceId);

      if (error) throw error;

      toast({
        title: "Approval Updated",
        description: `${approvalType === 'manager' ? 'Manager' : 'Finance'} approval set to ${status}`,
      });

      fetchAdvances();
    } catch (error: any) {
      console.error("Error updating approval:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update approval",
        variant: "destructive",
      });
    }
  };

  const fetchBankAccounts = async () => {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("id, account_code, account_name")
      .like("account_code", "1-12%")
      .eq("is_postable", true)
      .eq("is_active", true)
      .order("account_code");

    if (error) {
      console.error("Error fetching bank accounts:", error);
      return;
    }

    setBankAccounts(data || []);
  };

  const fetchKasAccounts = async () => {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("id, account_code, account_name")
      .like("account_code", "1-11%")
      .eq("is_postable", true)
      .eq("is_active", true)
      .order("account_code");

    if (error) {
      console.error("Error fetching kas accounts:", error);
      return;
    }

    setKasAccounts(data || []);
  };

  const fetchExpenseAccounts = async () => {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("id, account_code, account_name")
      .like("account_code", "6-%")
      .eq("is_postable", true)
      .eq("is_active", true)
      .order("account_code");

    if (error) {
      console.error("Error fetching expense accounts:", error);
      return;
    }

    setExpenseAccounts(data || []);
  };

  const handleDisburseAdvance = async () => {
    if (!selectedAdvanceForDisburse || !disburseForm.disbursement_account_id) {
      toast({
        title: "Error",
        description: "Pilih akun sumber dana",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("🚀 DISBURSE PAYLOAD", {
        advance_id: selectedAdvanceForDisburse.id,
        employee_id: selectedAdvanceForDisburse.employee_id,
        employee_name: selectedAdvanceForDisburse.employee_name,
        amount: selectedAdvanceForDisburse.amount,
      });

      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-employee-advance-disburse",
        {
          body: {
            advance_id: selectedAdvanceForDisburse.id,
            disbursement_method: disburseForm.disbursement_method,
            disbursement_account_id: disburseForm.disbursement_account_id,
            disbursement_date: disburseForm.disbursement_date,
            reference_number: disburseForm.reference_number,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Success",
        description: "Uang muka berhasil dicairkan",
      });

      setShowDisburseDialog(false);
      setSelectedAdvanceForDisburse(null);
      setDisburseForm({
        disbursement_method: "Kas",
        disbursement_account_id: "",
        disbursement_date: new Date().toISOString().split("T")[0],
        reference_number: "",
      });

      fetchAdvances();
    } catch (error: any) {
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

  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if employee already has an active advance
      const { data: existingAdvances, error: fetchError } = await supabase
        .from("employee_advances")
        .select("id, amount, remaining_balance, notes")
        .eq("employee_id", advanceForm.employee_id)
        .in("status", ["draft", "requested", "disbursed", "partially_settled"])
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw fetchError;
      }

      if (existingAdvances) {
        // Add to existing advance balance
        const newAmount = existingAdvances.amount + advanceForm.amount;
        const newRemainingBalance = existingAdvances.remaining_balance + advanceForm.amount;
        const existingNotes = existingAdvances.notes || '';

        const { error: updateError } = await supabase
          .from("employee_advances")
          .update({
            amount: newAmount,
            remaining_balance: newRemainingBalance,
            notes: (existingNotes ? existingNotes + '\n' : '') + `[${new Date().toLocaleDateString()}] Penambahan: Rp ${advanceForm.amount.toLocaleString()} - ${advanceForm.notes || 'No notes'}`,
          })
          .eq("id", existingAdvances.id);

        if (updateError) throw updateError;

        // Create journal entry for addition using edge function
        const { error: journalError } = await supabase.functions.invoke(
          "supabase-functions-employee-advance-journal",
          {
            body: {
              type: "advance",
              advance_id: existingAdvances.id,
              employee_name: advanceForm.employee_name,
              amount: advanceForm.amount,
              date: advanceForm.advance_date,
              description: advanceForm.notes,
              bukti_url: advanceForm.bukti_url,
              is_addition: true,
            },
          }
        );

        if (journalError) {
          console.error("Journal entry error:", journalError);
          toast({
            title: "Warning",
            description: "Saldo berhasil ditambah tapi gagal membuat jurnal",
            variant: "destructive",
          });
        }

        toast({
          title: "Saldo Uang Muka Bertambah",
          description: `Saldo ${advanceForm.employee_name} bertambah Rp ${advanceForm.amount.toLocaleString()}. Total: Rp ${newAmount.toLocaleString()}`,
        });
      } else {
        // Create new advance record
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const tempAdvanceNumber = `ADV-${timestamp}-${randomSuffix}`;
        
        const { data: advanceData, error: insertError } = await supabase
          .from("employee_advances")
          .insert({
            employee_id: advanceForm.employee_id,
            employee_name: advanceForm.employee_name,
            advance_number: tempAdvanceNumber,
            amount: advanceForm.amount,
            remaining_balance: advanceForm.amount,
            advance_date: advanceForm.advance_date,
            notes: advanceForm.notes,
            bukti_url: advanceForm.bukti_url,
            status: "draft",
            created_by: user?.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        toast({
          title: "Uang Muka Berhasil Dibuat",
          description: `Uang muka sebesar Rp ${advanceForm.amount.toLocaleString()} untuk ${advanceForm.employee_name} menunggu approval`,
        });
      }

      // Reset form
      setAdvanceForm({
        employee_id: "",
        employee_name: "",
        amount: 0,
        advance_date: new Date().toISOString().split("T")[0],
        notes: "",
        payment_method: "Kas",
        bank_account_id: "",
        kas_account_id: "",
        bukti_url: "",
      });

      fetchAdvances();
    } catch (error: any) {
      console.error("Error creating advance:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Insert settlement record (without journal)
      const { data: settlementData, error: settlementError } = await supabase
        .from("employee_advance_settlements")
        .insert({
          advance_id: settlementForm.advance_id,
          merchant: settlementForm.merchant,
          category: settlementForm.category,
          expense_account_code: settlementForm.expense_account_code,
          amount: settlementForm.amount,
          ppn: settlementForm.ppn,
          total: settlementForm.total,
          description: settlementForm.description,
          receipt_number: settlementForm.receipt_number,
          settlement_date: settlementForm.settlement_date,
          bukti_url: settlementForm.bukti_url,
          created_by: user?.id,
        })
        .select()
        .single();

      if (settlementError) throw settlementError;

      // Call settlement function to create journal entries
      const { error: settlementJournalError } = await supabase.functions.invoke(
        "supabase-functions-employee-advance-settlement",
        {
          body: {
            settlement_id: settlementData.id,
            advance_id: settlementForm.advance_id,
            settlement_amount: settlementForm.total,
            settlement_date: settlementForm.settlement_date,
            description: settlementForm.description,
            expense_account_code: settlementForm.expense_account_code,
            coa_account_code: selectedAdvance?.coa_account_code,
            bukti_url: settlementForm.bukti_url,
          },
        }
      );

      if (settlementJournalError) throw settlementJournalError;

      toast({
        title: "Penyelesaian Berhasil",
        description: `Struk sebesar Rp ${settlementForm.total.toLocaleString()} telah dicatat sebagai beban`,
      });

      // Reset form
      setSettlementForm({
        advance_id: "",
        merchant: "",
        category: "",
        expense_account_code: "",
        amount: 0,
        ppn: 0,
        total: 0,
        description: "",
        receipt_number: "",
        settlement_date: new Date().toISOString().split("T")[0],
        bukti_url: "",
      });

      fetchAdvances();
    } catch (error: any) {
      console.error("Error creating settlement:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Insert return record
      const { data: returnData, error: returnError } = await supabase
        .from("employee_advance_returns")
        .insert({
          advance_id: returnForm.advance_id,
          amount: returnForm.amount,
          return_date: returnForm.return_date,
          payment_method: returnForm.payment_method,
          notes: returnForm.notes,
          bukti_url: returnForm.bukti_url,
          created_by: user?.id,
        })
        .select()
        .single();

      if (returnError) throw returnError;

      // Create journal entry
      const { error: journalError } = await supabase.functions.invoke(
        "supabase-functions-employee-advance-journal",
        {
          body: {
            type: "return",
            return_id: returnData.id,
            advance_id: returnForm.advance_id,
            employee_name: selectedAdvance?.employee_name,
            amount: returnForm.amount,
            date: returnForm.return_date,
            coa_account_code: selectedAdvance?.coa_account_code,
            bukti_url: returnForm.bukti_url,
          },
        }
      );

      if (journalError) throw journalError;

      toast({
        title: "Pengembalian Berhasil",
        description: `Sisa uang sebesar Rp ${returnForm.amount.toLocaleString()} telah dikembalikan`,
      });

      // Reset form
      setReturnForm({
        advance_id: "",
        amount: 0,
        return_date: new Date().toISOString().split("T")[0],
        payment_method: "Kas",
        bank_account_id: "",
        kas_account_id: "",
        notes: "",
        bukti_url: "",
      });

      fetchAdvances();
    } catch (error: any) {
      console.error("Error creating return:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      requested: "secondary",
      disbursed: "default",
      partially_settled: "default",
      settled: "default",
      returned: "default",
      cancelled: "destructive",
      waiting_manager_verification: "secondary",
      waiting_finance_verification: "secondary",
      rejected: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status === "draft" && "Draft"}
        {status === "requested" && "Menunggu Pencairan"}
        {status === "disbursed" && "Sudah Dicairkan"}
        {status === "partially_settled" && "Sebagian Diselesaikan"}
        {status === "settled" && "Selesai"}
        {status === "returned" && "Dikembalikan"}
        {status === "cancelled" && "Dibatalkan"}
        {status === "waiting_manager_verification" && "Menunggu Approval Manager"}
        {status === "waiting_finance_verification" && "Menunggu Approval Finance"}
        {status === "rejected" && "Ditolak"}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Uang Muka Karyawan / Kas Bon</h1>
          <p className="text-slate-600 mt-1">
            Kelola uang muka karyawan dengan jurnal otomatis
          </p>
        </div>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">
            <Plus className="h-4 w-4 mr-2" />
            Buat Uang Muka
          </TabsTrigger>
          <TabsTrigger value="settlement">
            <Receipt className="h-4 w-4 mr-2" />
            Serahkan Struk
          </TabsTrigger>
          <TabsTrigger value="return">
            <RotateCcw className="h-4 w-4 mr-2" />
            Kembalikan Sisa
          </TabsTrigger>
          <TabsTrigger value="list">
            <DollarSign className="h-4 w-4 mr-2" />
            Daftar Uang Muka
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Create Advance */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Berikan Uang Muka ke Karyawan</CardTitle>
              <CardDescription>
                Uang akan dicatat sebagai aset (piutang) sampai diselesaikan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAdvance} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Karyawan *</Label>
                    <Select
                      value={advanceForm.employee_id}
                      onValueChange={(value) => {
                        const employee = employees.find((e) => e.id === value);
                        setAdvanceForm({
                          ...advanceForm,
                          employee_id: value,
                          employee_name: employee?.full_name || "",
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih karyawan" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Show employee advance history */}
                    {advanceForm.employee_id && (() => {
                      const employeeAdvances = advances.filter(
                        (adv) => adv.employee_id === advanceForm.employee_id && 
                        ['draft', 'requested', 'disbursed', 'partially_settled'].includes(adv.status)
                      );
                      const totalBalance = employeeAdvances.reduce((sum, adv) => sum + (adv.remaining_balance || 0), 0);
                      
                      if (employeeAdvances.length > 0) {
                        return (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                            <p className="font-medium text-blue-900">
                              Saldo Uang Muka: Rp {totalBalance.toLocaleString()}
                            </p>
                            <p className="text-blue-700 text-xs mt-1">
                              {employeeAdvances.length} uang muka aktif
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="space-y-2">
                    <Label>Tanggal</Label>
                    <Input
                      type="date"
                      value={advanceForm.advance_date}
                      onChange={(e) =>
                        setAdvanceForm({
                          ...advanceForm,
                          advance_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Jumlah Uang Muka *</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={advanceForm.amount || ""}
                    onChange={(e) =>
                      setAdvanceForm({
                        ...advanceForm,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Textarea
                    placeholder="Keperluan uang muka..."
                    value={advanceForm.notes}
                    onChange={(e) =>
                      setAdvanceForm({ ...advanceForm, notes: e.target.value })
                    }
                  />
                </div>

                {/* Bukti Foto Transaksi */}
                <div className="space-y-2">
                  <Label htmlFor="bukti-foto-advance">Bukti Foto Transaksi</Label>
                  <Input
                    id="bukti-foto-advance"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        const fileExt = file.name.split(".").pop();
                        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                        const filePath = `transaksi-bukti/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                          .from("documents")
                          .upload(filePath, file);

                        if (uploadError) throw uploadError;

                        const {
                          data: { publicUrl },
                        } = supabase.storage.from("documents").getPublicUrl(filePath);

                        setAdvanceForm({
                          ...advanceForm,
                          bukti_url: publicUrl,
                        });

                        toast({
                          title: "✅ Bukti berhasil diupload",
                          description: "File bukti transaksi telah tersimpan",
                        });
                      } catch (error) {
                        console.error("Upload error:", error);
                        toast({
                          title: "❌ Upload gagal",
                          description: "Gagal mengupload bukti transaksi",
                          variant: "destructive",
                        });
                      }
                    }}
                  />
                  {advanceForm.bukti_url && (
                    <p className="text-sm text-green-600">✓ File berhasil diupload</p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    📝 Jurnal yang akan dibuat:
                  </h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>
                      <strong>Debit:</strong> Uang Muka Karyawan -{" "}
                      {advanceForm.employee_name || "[Nama Karyawan]"} (Rp{" "}
                      {advanceForm.amount.toLocaleString()})
                    </p>
                    <p>
                      <strong>Credit:</strong>{" "}
                      {advanceForm.payment_method === "Bank"
                        ? bankAccounts.find(
                            (b) => b.id === advanceForm.bank_account_id
                          )?.account_name || "Bank"
                        : kasAccounts.find(
                            (k) => k.id === advanceForm.kas_account_id
                          )?.account_name || "Kas"}{" "}
                      (Rp {advanceForm.amount.toLocaleString()})
                    </p>
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Berikan Uang Muka
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Settlement */}
        <TabsContent value="settlement">
          <Card>
            <CardHeader>
              <CardTitle>Serahkan Struk Belanja</CardTitle>
              <CardDescription>
                Uang muka akan dikonversi menjadi beban sesuai kategori
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSettlement} className="space-y-4">
                <div className="space-y-2">
                  <Label>Pilih Uang Muka *</Label>
                  <Select
                    value={settlementForm.advance_id}
                    onValueChange={(value) => {
                      const advance = advances.find((a) => a.id === value);
                      setSelectedAdvance(advance || null);
                      setSettlementForm({
                        ...settlementForm,
                        advance_id: value,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih uang muka yang akan diselesaikan" />
                    </SelectTrigger>
                    <SelectContent>
                      {advances
                        .filter((a) => 
                          a.remaining_balance > 0 && 
                          a.manager_approval === 'approved' && 
                          a.finance_approval === 'approved' &&
                          (a.status === 'disbursed' || a.status === 'partially_settled')
                        )
                        .map((adv) => (
                          <SelectItem key={adv.id} value={adv.id}>
                            {adv.advance_number} - {adv.employee_name} (Sisa: Rp{" "}
                            {(adv.remaining_balance ?? 0).toLocaleString()})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAdvance && (
                  <div className="bg-slate-50 border rounded-lg p-4">
                    <p className="text-sm">
                      <strong>Sisa Saldo:</strong> Rp{" "}
                      {(selectedAdvance?.remaining_balance ?? 0).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* OCR Scanner */}
                <OCRScanner
                  onResult={(result) => {
                    const ocrNominal = result.nominal || 0;
                    setSettlementForm({
                      ...settlementForm,
                      merchant: result.toko || settlementForm.merchant,
                      receipt_number: result.nomorNota || settlementForm.receipt_number,
                      amount: ocrNominal,
                      total: ocrNominal,
                      ppn: 0,
                      description: result.deskripsi || settlementForm.description,
                      bukti_url: result.imageUrl || settlementForm.bukti_url,
                    });
                    toast({
                      title: "✅ Data terisi otomatis",
                      description: "Data OCR dan foto bukti telah tersimpan",
                    });
                  }}
                  showPreview={true}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Merchant</Label>
                    <Input
                      placeholder="Nama toko/merchant"
                      value={settlementForm.merchant}
                      onChange={(e) =>
                        setSettlementForm({
                          ...settlementForm,
                          merchant: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>No. Struk</Label>
                    <Input
                      placeholder="Nomor struk"
                      value={settlementForm.receipt_number}
                      onChange={(e) =>
                        setSettlementForm({
                          ...settlementForm,
                          receipt_number: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Akun Beban *</Label>
                  <Select
                    value={settlementForm.expense_account_code}
                    onValueChange={(value) => {
                      const selectedAccount = expenseAccounts.find(
                        (acc) => acc.account_code === value
                      );
                      setSettlementForm({
                        ...settlementForm,
                        expense_account_code: value,
                        category: selectedAccount?.account_name || "",
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="-- pilih akun beban --" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseAccounts.map((account) => (
                        <SelectItem
                          key={account.id}
                          value={account.account_code}
                        >
                          {account.account_code} — {account.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Jumlah *</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={settlementForm.amount || ""}
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        setSettlementForm({
                          ...settlementForm,
                          amount,
                          total: amount + settlementForm.ppn,
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>PPN (10%)</Label>
                    <Input
                      type="number"
                      value={settlementForm.ppn}
                      onChange={(e) => {
                        const ppn = parseFloat(e.target.value) || 0;
                        setSettlementForm({
                          ...settlementForm,
                          ppn,
                          total: settlementForm.amount + ppn,
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Total</Label>
                    <Input
                      type="number"
                      value={settlementForm.total}
                      readOnly
                      className="bg-slate-50 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <Textarea
                    placeholder="Keterangan pembelian..."
                    value={settlementForm.description}
                    onChange={(e) =>
                      setSettlementForm({
                        ...settlementForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input
                    type="date"
                    value={settlementForm.settlement_date}
                    onChange={(e) =>
                      setSettlementForm({
                        ...settlementForm,
                        settlement_date: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Bukti Foto Transaksi */}
                <div className="space-y-2">
                  <Label htmlFor="bukti-foto-settlement">Bukti Foto Transaksi</Label>
                  <Input
                    id="bukti-foto-settlement"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        const fileExt = file.name.split(".").pop();
                        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                        const filePath = `transaksi-bukti/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                          .from("documents")
                          .upload(filePath, file);

                        if (uploadError) throw uploadError;

                        const {
                          data: { publicUrl },
                        } = supabase.storage.from("documents").getPublicUrl(filePath);

                        setSettlementForm({
                          ...settlementForm,
                          bukti_url: publicUrl,
                        });

                        toast({
                          title: "✅ Bukti berhasil diupload",
                          description: "File bukti transaksi telah tersimpan",
                        });
                      } catch (error) {
                        console.error("Upload error:", error);
                        toast({
                          title: "❌ Upload gagal",
                          description: "Gagal mengupload bukti transaksi",
                          variant: "destructive",
                        });
                      }
                    }}
                  />
                  {settlementForm.bukti_url && (
                    <div className="space-y-2">
                      <p className="text-sm text-green-600 font-medium">✓ Bukti foto transaksi tersimpan</p>
                      <img 
                        src={settlementForm.bukti_url} 
                        alt="Bukti transaksi" 
                        className="max-w-xs rounded border"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">
                    📝 Jurnal yang akan dibuat:
                  </h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <p>
                      <strong>Debit:</strong> {settlementForm.category} (Rp{" "}
                      {settlementForm.total.toLocaleString()})
                    </p>
                    <p>
                      <strong>Credit:</strong> Uang Muka Karyawan -{" "}
                      {selectedAdvance?.employee_name || "[Nama]"} (Rp{" "}
                      {settlementForm.total.toLocaleString()})
                    </p>
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Receipt className="mr-2 h-4 w-4" />
                      Catat Penyelesaian
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Return */}
        <TabsContent value="return">
          <Card>
            <CardHeader>
              <CardTitle>Kembalikan Sisa Uang</CardTitle>
              <CardDescription>
                Catat pengembalian sisa uang muka dari karyawan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateReturn} className="space-y-4">
                <div className="space-y-2">
                  <Label>Pilih Uang Muka *</Label>
                  <Select
                    value={returnForm.advance_id}
                    onValueChange={(value) => {
                      const advance = advances.find((a) => a.id === value);
                      setSelectedAdvance(advance || null);
                      setReturnForm({
                        ...returnForm,
                        advance_id: value,
                        amount: advance?.remaining_balance || 0,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih uang muka" />
                    </SelectTrigger>
                    <SelectContent>
                      {advances
                        .filter((a) => 
                          a.remaining_balance > 0 && 
                          a.manager_approval === 'approved' && 
                          a.finance_approval === 'approved' &&
                          (a.status === 'disbursed' || a.status === 'partially_settled')
                        )
                        .map((adv) => (
                          <SelectItem key={adv.id} value={adv.id}>
                            {adv.advance_number} - {adv.employee_name} (Sisa: Rp{" "}
                            {(adv.remaining_balance ?? 0).toLocaleString()})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAdvance && (
                  <div className="bg-slate-50 border rounded-lg p-4">
                    <p className="text-sm">
                      <strong>Sisa Saldo:</strong> Rp{" "}
                      {(selectedAdvance?.remaining_balance ?? 0).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jumlah Dikembalikan *</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={returnForm.amount || ""}
                      onChange={(e) =>
                        setReturnForm({
                          ...returnForm,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tanggal</Label>
                    <Input
                      type="date"
                      value={returnForm.return_date}
                      onChange={(e) =>
                        setReturnForm({
                          ...returnForm,
                          return_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Metode Pembayaran *</Label>
                    <Select
                      value={returnForm.payment_method}
                      onValueChange={(value) =>
                        setReturnForm({
                          ...returnForm,
                          payment_method: value,
                          bank_account_id: "",
                          kas_account_id: "",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih metode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kas">Kas</SelectItem>
                        <SelectItem value="Bank">Bank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {returnForm.payment_method === "Bank" && (
                    <div className="space-y-2">
                      <Label>Bank *</Label>
                      <Select
                        value={returnForm.bank_account_id}
                        onValueChange={(value) =>
                          setReturnForm({
                            ...returnForm,
                            bank_account_id: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih bank" />
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

                  {returnForm.payment_method === "Kas" && (
                    <div className="space-y-2">
                      <Label>Kas *</Label>
                      <Select
                        value={returnForm.kas_account_id}
                        onValueChange={(value) =>
                          setReturnForm({
                            ...returnForm,
                            kas_account_id: value,
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

                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Textarea
                    placeholder="Catatan pengembalian..."
                    value={returnForm.notes}
                    onChange={(e) =>
                      setReturnForm({ ...returnForm, notes: e.target.value })
                    }
                  />
                </div>

                {/* Bukti Foto Transaksi */}
                <div className="space-y-2">
                  <Label htmlFor="bukti-foto-return">Bukti Foto Transaksi</Label>
                  <Input
                    id="bukti-foto-return"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        const fileExt = file.name.split(".").pop();
                        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                        const filePath = `transaksi-bukti/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                          .from("documents")
                          .upload(filePath, file);

                        if (uploadError) throw uploadError;

                        const {
                          data: { publicUrl },
                        } = supabase.storage.from("documents").getPublicUrl(filePath);

                        setReturnForm({
                          ...returnForm,
                          bukti_url: publicUrl,
                        });

                        toast({
                          title: "✅ Bukti berhasil diupload",
                          description: "File bukti transaksi telah tersimpan",
                        });
                      } catch (error) {
                        console.error("Upload error:", error);
                        toast({
                          title: "❌ Upload gagal",
                          description: "Gagal mengupload bukti transaksi",
                          variant: "destructive",
                        });
                      }
                    }}
                  />
                  {returnForm.bukti_url && (
                    <p className="text-sm text-green-600">✓ File berhasil diupload</p>
                  )}
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">
                    📝 Jurnal yang akan dibuat:
                  </h4>
                  <div className="text-sm text-purple-800 space-y-1">
                    <p>
                      <strong>Debit:</strong>{" "}
                      {returnForm.payment_method === "Bank"
                        ? bankAccounts.find(
                            (b) => b.id === returnForm.bank_account_id
                          )?.account_name || "Bank"
                        : kasAccounts.find(
                            (k) => k.id === returnForm.kas_account_id
                          )?.account_name || "Kas"}{" "}
                      (Rp {returnForm.amount.toLocaleString()})
                    </p>
                    <p>
                      <strong>Credit:</strong> Uang Muka Karyawan -{" "}
                      {selectedAdvance?.employee_name || "[Nama]"} (Rp{" "}
                      {returnForm.amount.toLocaleString()})
                    </p>
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Catat Pengembalian
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: List */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Uang Muka Karyawan</CardTitle>
              <CardDescription>
                Semua transaksi uang muka dan statusnya
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Uang Muka</TableHead>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Sisa Saldo</TableHead>
                    <TableHead>Metode Pencairan</TableHead>
                    <TableHead>Tgl Pencairan</TableHead>
                    <TableHead>No. Bukti</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Akun COA</TableHead>
                    <TableHead>Approval Manager</TableHead>
                    <TableHead>Approval Finance</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advances.map((adv) => (
                    <TableRow 
                      key={adv.id}
                    >
                      <TableCell 
                        className="font-mono cursor-pointer hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => fetchSettlements(adv.id)}
                      >
                        {adv.advance_number}
                      </TableCell>
                      <TableCell>{adv.employee_name}</TableCell>
                      <TableCell>
                        {new Date(adv.advance_date).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        Rp {(adv.amount ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        Rp {(adv.remaining_balance ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {adv.disbursement_method || "-"}
                      </TableCell>
                      <TableCell>
                        {adv.disbursement_date ? new Date(adv.disbursement_date).toLocaleDateString("id-ID") : "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {adv.reference_number || "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(adv.status)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {adv.coa_account_code}
                      </TableCell>
                      <TableCell>
                        {adv.manager_approval ? (
                          <span className={`text-sm font-medium ${adv.manager_approval === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                            {adv.manager_approval === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                        ) : (
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproval(adv.id, 'manager', 'approved');
                              }}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproval(adv.id, 'manager', 'rejected');
                              }}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {adv.finance_approval ? (
                          <span className={`text-sm font-medium ${adv.finance_approval === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                            {adv.finance_approval === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                        ) : (
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproval(adv.id, 'finance', 'approved');
                              }}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproval(adv.id, 'finance', 'rejected');
                              }}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {adv.manager_approval === 'approved' && 
                         adv.finance_approval === 'approved' && 
                         adv.status !== 'disbursed' && 
                         adv.status !== 'settled' && 
                         adv.status !== 'partially_settled' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAdvanceForDisburse(adv);
                              setShowDisburseDialog(true);
                            }}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Cairkan
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Disburse Dialog */}
      <Dialog open={showDisburseDialog} onOpenChange={setShowDisburseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cairkan Uang Muka</DialogTitle>
            <DialogDescription>
              Proses pencairan uang muka dan buat jurnal otomatis
            </DialogDescription>
          </DialogHeader>

          {selectedAdvanceForDisburse && (
            <div className="space-y-6">
              {/* Selected Advance Details */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nomor Uang Muka</p>
                      <p className="font-mono font-bold">
                        {selectedAdvanceForDisburse.advance_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Karyawan</p>
                      <p className="font-bold">{selectedAdvanceForDisburse.employee_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Jumlah</p>
                      <p className="font-bold text-lg">
                        Rp {(selectedAdvanceForDisburse.amount ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tanggal Pengajuan</p>
                      <p className="font-bold">
                        {new Date(selectedAdvanceForDisburse.advance_date).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Disbursement Details */}
              <div className="space-y-4">
                <h3 className="font-semibold">Detail Pencairan</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Metode Pencairan *</Label>
                    <Select
                      value={disburseForm.disbursement_method}
                      onValueChange={(value) =>
                        setDisburseForm({
                          ...disburseForm,
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

                  {disburseForm.disbursement_method === "Bank" && (
                    <div className="space-y-2">
                      <Label>Rekening Bank *</Label>
                      <Select
                        value={disburseForm.disbursement_account_id}
                        onValueChange={(value) =>
                          setDisburseForm({
                            ...disburseForm,
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

                  {disburseForm.disbursement_method === "Kas" && (
                    <div className="space-y-2">
                      <Label>Kas *</Label>
                      <Select
                        value={disburseForm.disbursement_account_id}
                        onValueChange={(value) =>
                          setDisburseForm({
                            ...disburseForm,
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
                      value={disburseForm.disbursement_date}
                      onChange={(e) =>
                        setDisburseForm({
                          ...disburseForm,
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
                      value={disburseForm.reference_number}
                      onChange={(e) =>
                        setDisburseForm({
                          ...disburseForm,
                          reference_number: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={handleDisburseAdvance}
                disabled={isLoading || !disburseForm.disbursement_account_id}
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settlements Dialog */}
      <Dialog open={showSettlementsDialog} onOpenChange={setShowSettlementsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Data Serahkan Struk & Pengembalian</DialogTitle>
            <DialogDescription>
              Semua struk yang diserahkan dan uang yang dikembalikan untuk uang muka ini
            </DialogDescription>
          </DialogHeader>

          {selectedAdvanceSettlements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada data penyelesaian
            </div>
          ) : (
            <div className="space-y-3">
              {selectedAdvanceSettlements.map((settlement, index) => (
                <div 
                  key={settlement.id || index} 
                  className={`border-l-4 ${
                    settlement.type === 'return' ? 'border-l-green-500' : 
                    settlement.type === 'initial' ? 'border-l-purple-500' : 
                    settlement.type === 'addition' ? 'border-l-orange-500' : 
                    'border-l-blue-500'
                  } bg-gray-50 p-4 rounded`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      settlement.type === 'return' ? 'bg-green-100 text-green-800' : 
                      settlement.type === 'initial' ? 'bg-purple-100 text-purple-800' : 
                      settlement.type === 'addition' ? 'bg-orange-100 text-orange-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {settlement.type === 'return' ? '💰 Pengembalian' : 
                       settlement.type === 'initial' ? '🎯 Uang Muka Awal' : 
                       settlement.type === 'addition' ? '➕ Penambahan' : 
                       '🧾 Serahkan Struk'}
                    </span>
                  </div>
                  
                  {settlement.type === 'return' ? (
                    // Return layout
                    <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Tanggal:</span>{" "}
                        <span className="font-semibold">
                          {new Date(settlement.return_date).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Jumlah Dikembalikan:</span>{" "}
                        <span className="font-bold text-green-600">Rp {(settlement.amount || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Catatan:</span>{" "}
                        <span className="font-semibold">{settlement.notes || "-"}</span>
                      </div>
                      {settlement.bukti_url && (
                        <div>
                          <a
                            href={settlement.bukti_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Lihat Bukti →
                          </a>
                        </div>
                      )}
                    </div>
                  ) : settlement.type === 'initial' || settlement.type === 'addition' ? (
                    // Initial or Addition layout
                    <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Tanggal:</span>{" "}
                        <span className="font-semibold">{settlement.date}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Jumlah:</span>{" "}
                        <span className="font-bold text-purple-600">Rp {(settlement.amount || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Keterangan:</span>{" "}
                        <span className="font-semibold">{settlement.notes || "-"}</span>
                      </div>
                    </div>
                  ) : (
                    // Settlement layout
                    <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Tanggal:</span>{" "}
                        <span className="font-semibold">
                          {new Date(settlement.settlement_date).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Merchant:</span>{" "}
                        <span className="font-semibold">{settlement.merchant || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Kategori:</span>{" "}
                        <span className="font-semibold">{settlement.category || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Akun Beban:</span>{" "}
                        <span className="font-mono">{settlement.expense_account_code || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Jumlah:</span>{" "}
                        <span className="font-semibold">Rp {(settlement.amount || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">PPN:</span>{" "}
                        <span className="font-semibold">Rp {(settlement.ppn || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total:</span>{" "}
                        <span className="font-bold text-blue-600">Rp {(settlement.total || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">No. Struk:</span>{" "}
                        <span className="font-mono">{settlement.receipt_number || "-"}</span>
                      </div>
                      {settlement.bukti_url && (
                        <div>
                          <a
                            href={settlement.bukti_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Lihat Bukti →
                          </a>
                        </div>
                      )}
                      {settlement.description && (
                        <div className="col-span-3">
                          <span className="text-gray-600">Deskripsi:</span>{" "}
                          <span>{settlement.description}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
