import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Employee {
  id: string;
  employee_number: string;
  full_name: string;
  salary: number;
}

interface Payroll {
  id: string;
  employee_id: string;
  period_month: number;
  period_year: number;
  basic_salary: number;
  gross_salary: number;
  net_salary: number;
  payment_status: string;
  employees?: { full_name: string; employee_number: string };
}

export default function PayrollManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    employee_id: "",
    period_month: currentMonth.toString(),
    period_year: currentYear.toString(),
    basic_salary: "",
    allowances: "",
    deductions: "",
    overtime_hours: "0",
    overtime_pay: "0",
    tax: "0",
    bpjs_kesehatan: "0",
    bpjs_ketenagakerjaan: "0",
    notes: "",
  });

  useEffect(() => {
    loadEmployees();
    loadPayrolls();
  }, []);

  const loadEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, employee_number, full_name, salary")
      .eq("status", "active")
      .order("full_name");
    setEmployees(data || []);
  };

  const loadPayrolls = async () => {
    const { data } = await supabase
      .from("payroll")
      .select(
        `
        *,
        employees(full_name, employee_number)
      `,
      )
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false });
    setPayrolls(data || []);
  };

  const calculatePayroll = () => {
    const basic = parseFloat(formData.basic_salary) || 0;
    const allowances = parseFloat(formData.allowances) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    const overtimePay = parseFloat(formData.overtime_pay) || 0;
    const tax = parseFloat(formData.tax) || 0;
    const bpjsKesehatan = parseFloat(formData.bpjs_kesehatan) || 0;
    const bpjsKetenagakerjaan = parseFloat(formData.bpjs_ketenagakerjaan) || 0;

    const gross = basic + allowances + overtimePay;
    const totalDeductions = deductions + tax + bpjsKesehatan + bpjsKetenagakerjaan;
    const net = gross - totalDeductions;

    return { gross, totalDeductions, net };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { gross, totalDeductions, net } = calculatePayroll();

      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-payroll",
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: {
            action: "insert",
            data: {
              employee_id: formData.employee_id,
              period_month: parseInt(formData.period_month),
              period_year: parseInt(formData.period_year),
              basic_salary: parseFloat(formData.basic_salary),
              allowances: parseFloat(formData.allowances) || 0,
              overtime_hours: parseFloat(formData.overtime_hours) || 0,
              overtime_pay: parseFloat(formData.overtime_pay) || 0,
              deductions: parseFloat(formData.deductions) || 0,
              tax: parseFloat(formData.tax) || 0,
              bpjs_kesehatan: parseFloat(formData.bpjs_kesehatan) || 0,
              bpjs_ketenagakerjaan: parseFloat(formData.bpjs_ketenagakerjaan) || 0,
              status: "pending",
              notes: formData.notes || null,
            },
          },
        },
      );

      if (error) throw error;
      toast({ title: "Berhasil", description: "Payroll berhasil dibuat" });
      loadPayrolls();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Payroll save error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan payroll",
        variant: "destructive",
      });
    }
  };

  const handlePaymentStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("payroll")
      .update({
        payment_status: status,
        payment_date:
          status === "paid" ? new Date().toISOString().split("T")[0] : null,
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: `Status pembayaran diupdate menjadi ${status}`,
      });
      loadPayrolls();
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      period_month: currentMonth.toString(),
      period_year: currentYear.toString(),
      basic_salary: "",
      allowances: "",
      deductions: "",
      overtime_hours: "0",
      overtime_pay: "0",
      tax: "0",
      bpjs_kesehatan: "0",
      bpjs_ketenagakerjaan: "0",
      notes: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", label: "Pending" },
      paid: { variant: "default", label: "Dibayar" },
      cancelled: { variant: "destructive", label: "Dibatalkan" },
    };
    const config = variants[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Payroll</h2>
          <p className="text-gray-600">Kelola penggajian karyawan</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Buat Payroll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Buat Payroll Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Karyawan *</Label>
                  <Select
                    required
                    value={formData.employee_id}
                    onValueChange={(value) => {
                      const emp = employees.find((e) => e.id === value);
                      setFormData({
                        ...formData,
                        employee_id: value,
                        basic_salary: emp?.salary?.toString() || "",
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih karyawan" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.employee_number} - {emp.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Periode Bulan *</Label>
                  <Select
                    value={formData.period_month}
                    onValueChange={(value) =>
                      setFormData({ ...formData, period_month: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthNames.map((month, idx) => (
                        <SelectItem key={idx} value={(idx + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tahun *</Label>
                  <Input
                    type="number"
                    required
                    value={formData.period_year}
                    onChange={(e) =>
                      setFormData({ ...formData, period_year: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gaji Pokok *</Label>
                  <Input
                    type="number"
                    required
                    value={formData.basic_salary}
                    onChange={(e) =>
                      setFormData({ ...formData, basic_salary: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tunjangan</Label>
                  <Input
                    type="number"
                    value={formData.allowances}
                    onChange={(e) =>
                      setFormData({ ...formData, allowances: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Potongan</Label>
                  <Input
                    type="number"
                    value={formData.deductions}
                    onChange={(e) =>
                      setFormData({ ...formData, deductions: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Jam Lembur</Label>
                  <Input
                    type="number"
                    value={formData.overtime_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        overtime_hours: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bayaran Lembur</Label>
                  <Input
                    type="number"
                    value={formData.overtime_pay}
                    onChange={(e) =>
                      setFormData({ ...formData, overtime_pay: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pajak</Label>
                  <Input
                    type="number"
                    value={formData.tax}
                    onChange={(e) =>
                      setFormData({ ...formData, tax: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Gaji Kotor</p>
                    <p className="text-xl font-bold text-blue-600">
                      Rp {calculatePayroll().gross.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gaji Bersih</p>
                    <p className="text-xl font-bold text-green-600">
                      Rp {calculatePayroll().net.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Simpan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Daftar Payroll
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>No. Karyawan</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Gaji Pokok</TableHead>
                <TableHead>Gaji Bersih</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrolls.map((payroll) => (
                <TableRow key={payroll.id}>
                  <TableCell className="font-medium">
                    {payroll.employees?.employee_number}
                  </TableCell>
                  <TableCell>{payroll.employees?.full_name}</TableCell>
                  <TableCell>
                    {monthNames[payroll.period_month - 1]} {payroll.period_year}
                  </TableCell>
                  <TableCell>
                    Rp {payroll.basic_salary.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="font-bold text-green-600">
                    Rp {payroll.net_salary.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(payroll.payment_status)}
                  </TableCell>
                  <TableCell className="text-right">
                    {payroll.payment_status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handlePaymentStatus(payroll.id, "paid")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Bayar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
