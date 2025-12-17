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
} from "lucide-react";

/* =========================
   SANITIZER (LOCAL)
========================= */
function sanitizePayload<T extends Record<string, any>>(payload: T): T {
  const clean: any = {};
  Object.entries(payload).forEach(([k, v]) => {
    if (v === "" || v === undefined) {
      clean[k] = null;
      return;
    }
    if (typeof v === "string") {
      const t = v.trim();
      clean[k] = t === "" ? null : t;
      return;
    }
    clean[k] = v;
  });
  return clean;
}

/* =========================
   TYPES
========================= */
interface Employee {
  id: string;
  full_name: string;
}

interface Advance {
  id: string;
  advance_number: string;
  employee_name: string;
  advance_date: string;
  amount: number;
  remaining_balance: number;
  status: string;
  coa_account_code: string;
}

/* =========================
   COMPONENT
========================= */
export default function EmployeeAdvanceForm() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);

  /* =========================
     FORM STATES
  ========================= */
  const [advanceForm, setAdvanceForm] = useState({
    employee_id: "",
    employee_name: "",
    amount: 0,
    advance_date: new Date().toISOString().slice(0, 10),
    notes: "",
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
    settlement_date: new Date().toISOString().slice(0, 10),
  });

  const [returnForm, setReturnForm] = useState({
    advance_id: "",
    amount: 0,
    return_date: new Date().toISOString().slice(0, 10),
    payment_method: "Cash",
    notes: "",
  });

  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {
    fetchEmployees();
    fetchAdvances();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name")
      .order("full_name");
    if (!error) setEmployees(data || []);
  };

  const fetchAdvances = async () => {
    const { data, error } = await supabase
      .from("vw_employee_advance_summary")
      .select("*")
      .order("advance_date", { ascending: false });
    if (!error) setAdvances(data || []);
  };

  /* =========================
     CREATE ADVANCE
  ========================= */
  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = sanitizePayload({
        employee_id: advanceForm.employee_id,
        employee_name: advanceForm.employee_name,
        amount: advanceForm.amount,
        remaining_balance: advanceForm.amount,
        advance_date: advanceForm.advance_date,
        notes: advanceForm.notes,
        created_by: user?.id,
      });

      if (!payload.employee_id) {
        throw new Error("Karyawan wajib dipilih");
      }
      if (payload.amount <= 0) {
        throw new Error("Jumlah uang muka harus > 0");
      }

      const { data: advanceData, error } = await supabase
        .from("employee_advances")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      await supabase.functions.invoke(
        "supabase-functions-employee-advance-journal",
        {
          body: sanitizePayload({
            type: "advance",
            advance_id: advanceData.id,
            employee_name: advanceForm.employee_name,
            amount: advanceForm.amount,
            date: advanceForm.advance_date,
            coa_account_code: advanceData.coa_account_code,
          }),
        }
      );

      toast({
        title: "Uang Muka Dibuat",
        description: "Uang muka berhasil dicatat",
      });

      setAdvanceForm({
        employee_id: "",
        employee_name: "",
        amount: 0,
        advance_date: new Date().toISOString().slice(0, 10),
        notes: "",
      });

      fetchAdvances();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     CREATE SETTLEMENT
  ========================= */
  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = sanitizePayload({
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
        created_by: user?.id,
      });

      if (!payload.advance_id) throw new Error("Uang muka wajib dipilih");

      const { data, error } = await supabase
        .from("employee_advance_settlements")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      await supabase.functions.invoke(
        "supabase-functions-employee-advance-journal",
        {
          body: sanitizePayload({
            type: "settlement",
            settlement_id: data.id,
            advance_id: payload.advance_id,
            amount: payload.total,
            expense_account_code: payload.expense_account_code,
          }),
        }
      );

      toast({ title: "Penyelesaian dicatat" });
      fetchAdvances();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     CREATE RETURN
  ========================= */
  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = sanitizePayload({
        advance_id: returnForm.advance_id,
        amount: returnForm.amount,
        return_date: returnForm.return_date,
        payment_method: returnForm.payment_method,
        notes: returnForm.notes,
        created_by: user?.id,
      });

      if (!payload.advance_id) throw new Error("Uang muka wajib dipilih");
      if (payload.amount <= 0) throw new Error("Jumlah harus > 0");

      const { data, error } = await supabase
        .from("employee_advance_returns")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      await supabase.functions.invoke(
        "supabase-functions-employee-advance-journal",
        {
          body: sanitizePayload({
            type: "return",
            return_id: data.id,
            advance_id: payload.advance_id,
            amount: payload.amount,
          }),
        }
      );

      toast({ title: "Pengembalian dicatat" });
      fetchAdvances();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     STATUS BADGE
  ========================= */
  const getStatusBadge = (status: string) => (
    <Badge>{status}</Badge>
  );

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Uang Muka Karyawan</h1>

      <Tabs defaultValue="create">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="create">Buat</TabsTrigger>
          <TabsTrigger value="settlement">Realisasi</TabsTrigger>
          <TabsTrigger value="return">Pengembalian</TabsTrigger>
          <TabsTrigger value="list">Daftar</TabsTrigger>
        </TabsList>

        {/* CREATE */}
        <TabsContent value="create">
          <form onSubmit={handleCreateAdvance}>
            <Button disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : "Simpan"}
            </Button>
          </form>
        </TabsContent>

        {/* LIST */}
        <TabsContent value="list">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Karyawan</TableHead>
                <TableHead>Sisa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advances.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.advance_number}</TableCell>
                  <TableCell>{a.employee_name}</TableCell>
                  <TableCell>{a.remaining_balance}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
