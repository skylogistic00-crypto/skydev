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
} from "lucide-react";

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

export default function EmployeeAdvanceForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);

  // Form states
  const [advanceForm, setAdvanceForm] = useState({
    employee_id: "",
    employee_name: "",
    amount: 0,
    advance_date: new Date().toISOString().split("T")[0],
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
    settlement_date: new Date().toISOString().split("T")[0],
  });

  const [returnForm, setReturnForm] = useState({
    advance_id: "",
    amount: 0,
    return_date: new Date().toISOString().split("T")[0],
    payment_method: "Cash",
    notes: "",
  });

  useEffect(() => {
    fetchEmployees();
    fetchAdvances();
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

    setAdvances(data || []);
  };

  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Insert advance record
      const { data: advanceData, error: advanceError } = await supabase
        .from("employee_advances")
        .insert({
          employee_id: advanceForm.employee_id,
          employee_name: advanceForm.employee_name,
          amount: advanceForm.amount,
          remaining_balance: advanceForm.amount,
          advance_date: advanceForm.advance_date,
          notes: advanceForm.notes,
          created_by: user?.id,
        })
        .select()
        .single();

      if (advanceError) throw advanceError;

      // Create journal entry
      const { error: journalError } = await supabase.functions.invoke(
        "supabase-functions-employee-advance-journal",
        {
          body: {
            type: "advance",
            advance_id: advanceData.id,
            employee_name: advanceForm.employee_name,
            amount: advanceForm.amount,
            date: advanceForm.advance_date,
            coa_account_code: advanceData.coa_account_code,
          },
        }
      );

      if (journalError) throw journalError;

      toast({
        title: "Uang Muka Berhasil Dibuat",
        description: `Uang muka sebesar Rp ${advanceForm.amount.toLocaleString()} telah diberikan kepada ${advanceForm.employee_name}`,
      });

      // Reset form
      setAdvanceForm({
        employee_id: "",
        employee_name: "",
        amount: 0,
        advance_date: new Date().toISOString().split("T")[0],
        notes: "",
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
      // Insert settlement record
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
          created_by: user?.id,
        })
        .select()
        .single();

      if (settlementError) throw settlementError;

      // Create journal entry
      const { error: journalError } = await supabase.functions.invoke(
        "supabase-functions-employee-advance-journal",
        {
          body: {
            type: "settlement",
            settlement_id: settlementData.id,
            advance_id: settlementForm.advance_id,
            employee_name: selectedAdvance?.employee_name,
            amount: settlementForm.total,
            date: settlementForm.settlement_date,
            description: settlementForm.description,
            expense_account_code: settlementForm.expense_account_code,
            coa_account_code: selectedAdvance?.coa_account_code,
          },
        }
      );

      if (journalError) throw journalError;

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
        payment_method: "Cash",
        notes: "",
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
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      partially_settled: "default",
      settled: "default",
      returned: "default",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status === "pending" && "Belum Diselesaikan"}
        {status === "partially_settled" && "Sebagian Diselesaikan"}
        {status === "settled" && "Selesai"}
        {status === "returned" && "Dikembalikan"}
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
                      <strong>Credit:</strong> Kas (Rp{" "}
                      {advanceForm.amount.toLocaleString()})
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
                        .filter((a) => a.remaining_balance > 0)
                        .map((adv) => (
                          <SelectItem key={adv.id} value={adv.id}>
                            {adv.advance_number} - {adv.employee_name} (Sisa: Rp{" "}
                            {adv.remaining_balance.toLocaleString()})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAdvance && (
                  <div className="bg-slate-50 border rounded-lg p-4">
                    <p className="text-sm">
                      <strong>Sisa Saldo:</strong> Rp{" "}
                      {selectedAdvance.remaining_balance.toLocaleString()}
                    </p>
                  </div>
                )}

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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kategori Beban *</Label>
                    <Select
                      value={settlementForm.category}
                      onValueChange={(value) =>
                        setSettlementForm({
                          ...settlementForm,
                          category: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beban Operasional">
                          Beban Operasional
                        </SelectItem>
                        <SelectItem value="Beban Penjualan">
                          Beban Penjualan
                        </SelectItem>
                        <SelectItem value="Beban Administrasi">
                          Beban Administrasi
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Akun Beban *</Label>
                    <Input
                      placeholder="6-2011"
                      value={settlementForm.expense_account_code}
                      onChange={(e) =>
                        setSettlementForm({
                          ...settlementForm,
                          expense_account_code: e.target.value,
                        })
                      }
                    />
                  </div>
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
                        const ppn = amount * 0.1;
                        setSettlementForm({
                          ...settlementForm,
                          amount,
                          ppn,
                          total: amount + ppn,
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>PPN (10%)</Label>
                    <Input
                      type="number"
                      value={settlementForm.ppn}
                      readOnly
                      className="bg-slate-50"
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
                        .filter((a) => a.remaining_balance > 0)
                        .map((adv) => (
                          <SelectItem key={adv.id} value={adv.id}>
                            {adv.advance_number} - {adv.employee_name} (Sisa: Rp{" "}
                            {adv.remaining_balance.toLocaleString()})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAdvance && (
                  <div className="bg-slate-50 border rounded-lg p-4">
                    <p className="text-sm">
                      <strong>Sisa Saldo:</strong> Rp{" "}
                      {selectedAdvance.remaining_balance.toLocaleString()}
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
                    <Label>Metode Pembayaran</Label>
                    <Select
                      value={returnForm.payment_method}
                      onValueChange={(value) =>
                        setReturnForm({ ...returnForm, payment_method: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">
                    📝 Jurnal yang akan dibuat:
                  </h4>
                  <div className="text-sm text-purple-800 space-y-1">
                    <p>
                      <strong>Debit:</strong> Kas (Rp{" "}
                      {returnForm.amount.toLocaleString()})
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
                    <TableHead>Status</TableHead>
                    <TableHead>Akun COA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advances.map((adv) => (
                    <TableRow key={adv.id}>
                      <TableCell className="font-mono">
                        {adv.advance_number}
                      </TableCell>
                      <TableCell>{adv.employee_name}</TableCell>
                      <TableCell>
                        {new Date(adv.advance_date).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        Rp {adv.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-bold">
                        Rp {adv.remaining_balance.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(adv.status)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {adv.coa_account_code}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
