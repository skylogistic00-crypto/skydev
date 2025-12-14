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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  Plus,
  FileText,
  Download,
  Eye,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Employee {
  id: string;
  employee_number: string;
  full_name: string;
  basic_salary: number;
  bank_name: string;
  bank_account_number: string;
  departments?: { department_name: string };
  positions?: { position_name: string };
}

interface Payroll {
  id: string;
  employee_id: string;
  period_month: number;
  period_year: number;
  basic_salary: number;
  transport_allowance: number;
  meal_allowance: number;
  position_allowance: number;
  overtime_hours: number;
  overtime_pay: number;
  late_deduction: number;
  absence_deduction: number;
  loan_deduction: number;
  bpjs_kesehatan_deduction: number;
  bpjs_ketenagakerjaan_deduction: number;
  tax_pph21: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  payment_status: string;
  payment_date: string;
  employees?: {
    full_name: string;
    employee_number: string;
    bank_name: string;
    bank_account_number: string;
    departments?: { department_name: string };
    positions?: { position_name: string };
  };
}

export default function PayrollSystem() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const { toast } = useToast();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    employee_id: "",
    period_month: currentMonth.toString(),
    period_year: currentYear.toString(),
    basic_salary: "",
    transport_allowance: "0",
    meal_allowance: "0",
    position_allowance: "0",
    overtime_hours: "0",
    overtime_pay: "0",
    late_deduction: "0",
    absence_deduction: "0",
    loan_deduction: "0",
    bpjs_kesehatan_deduction: "0",
    bpjs_ketenagakerjaan_deduction: "0",
    tax_pph21: "0",
  });

  useEffect(() => {
    loadEmployees();
    loadPayrolls();
  }, []);

  const loadEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select(
        `
        id, 
        employee_number, 
        full_name, 
        basic_salary,
        bank_name,
        bank_account_number,
        departments(department_name),
        positions(position_name)
      `,
      )
      .eq("status", "active")
      .order("full_name");
    setEmployees(data || []);
  };

  const loadPayrolls = async () => {
    const { data, error } = await supabase
      .from("payroll")
      .select(
        `
        *,
        employees(
          full_name, 
          employee_number,
          bank_name,
          bank_account_number,
          departments(department_name),
          positions(position_name)
        )
      `,
      )
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false });
    
    console.log("Payroll data:", data);
    console.log("Payroll error:", error);
    
    setPayrolls(data || []);
  };

  const calculatePayroll = () => {
    const basic = parseFloat(formData.basic_salary) || 0;
    const transport = parseFloat(formData.transport_allowance) || 0;
    const meal = parseFloat(formData.meal_allowance) || 0;
    const position = parseFloat(formData.position_allowance) || 0;
    const overtimePay = parseFloat(formData.overtime_pay) || 0;

    const lateDeduction = parseFloat(formData.late_deduction) || 0;
    const absenceDeduction = parseFloat(formData.absence_deduction) || 0;
    const loanDeduction = parseFloat(formData.loan_deduction) || 0;
    const bpjsKesehatan = parseFloat(formData.bpjs_kesehatan_deduction) || 0;
    const bpjsKetenagakerjaan =
      parseFloat(formData.bpjs_ketenagakerjaan_deduction) || 0;
    const tax = parseFloat(formData.tax_pph21) || 0;

    const gross = basic + transport + meal + position + overtimePay;
    const totalDeductions =
      lateDeduction +
      absenceDeduction +
      loanDeduction +
      bpjsKesehatan +
      bpjsKetenagakerjaan +
      tax;
    const net = gross - totalDeductions;

    return { gross, totalDeductions, net };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { gross, totalDeductions, net } = calculatePayroll();

      // Call edge function for INSERT operation to database
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("User not authenticated");
      }

      const payrollData = {
        action: "insert",
        data: {
          employee_id: formData.employee_id,
          period_month: parseInt(formData.period_month),
          period_year: parseInt(formData.period_year),
          basic_salary: parseFloat(formData.basic_salary),
          allowances:
            parseFloat(formData.transport_allowance) +
            parseFloat(formData.meal_allowance) +
            parseFloat(formData.position_allowance),
          overtime_hours: parseFloat(formData.overtime_hours) || 0,
          overtime_pay: parseFloat(formData.overtime_pay),
          deductions:
            parseFloat(formData.late_deduction) +
            parseFloat(formData.absence_deduction) +
            parseFloat(formData.loan_deduction),
          tax: parseFloat(formData.tax_pph21),
          bpjs_kesehatan: parseFloat(formData.bpjs_kesehatan_deduction),
          bpjs_ketenagakerjaan: parseFloat(
            formData.bpjs_ketenagakerjaan_deduction,
          ),
          net_salary: net,
          status: "pending",
          notes: formData.notes || null,
        },
      };

      console.log("Sending payroll data:", payrollData);

      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-payroll",
        {
          body: payrollData,
        },
      );

      if (error) throw error;
      toast({ title: "Berhasil", description: "Payroll berhasil dibuat" });
      loadPayrolls();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePaymentStatus = async (id: string, status: string) => {
    try {
      // Call edge function for UPDATE operation to database
      const { data: { session } } = await supabase.auth.getSession();
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-payroll",
        {
          body: {
            action: status === "paid" ? "pay" : "process",
            data: {},
            id,
          },
        },
      );

      if (error) throw error;
      toast({
        title: "Berhasil",
        description: `Status pembayaran diupdate menjadi ${status}`,
      });
      loadPayrolls();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generatePayslipPDF = (payroll: Payroll) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("SLIP GAJI KARYAWAN", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("PT. Your Company Name", 105, 28, { align: "center" });
    doc.text("Jl. Alamat Perusahaan No. 123, Jakarta", 105, 33, {
      align: "center",
    });

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, 38, 190, 38);

    // Employee Info
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMASI KARYAWAN", 20, 48);

    doc.setFont("helvetica", "normal");
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

    const employeeInfo = [
      ["No. Karyawan", payroll.employees?.employee_number || "-"],
      ["Nama", payroll.employees?.full_name || "-"],
      ["Departemen", payroll.employees?.departments?.department_name || "-"],
      ["Jabatan", payroll.employees?.positions?.position_name || "-"],
      [
        "Periode",
        `${monthNames[payroll.period_month - 1]} ${payroll.period_year}`,
      ],
      ["Bank", payroll.employees?.bank_name || "-"],
      ["No. Rekening", payroll.employees?.bank_account_number || "-"],
    ];

    let yPos = 55;
    employeeInfo.forEach(([label, value]) => {
      doc.text(`${label}:`, 20, yPos);
      doc.text(value, 70, yPos);
      yPos += 6;
    });

    // Earnings Table
    yPos += 5;
    doc.setFont("helvetica", "bold");
    doc.text("PENDAPATAN", 20, yPos);

    autoTable(doc, {
      startY: yPos + 3,
      head: [["Keterangan", "Jumlah (Rp)"]],
      body: [
        ["Gaji Pokok", payroll.basic_salary.toLocaleString("id-ID")],
        [
          "Tunjangan Transport",
          payroll.transport_allowance.toLocaleString("id-ID"),
        ],
        ["Tunjangan Makan", payroll.meal_allowance.toLocaleString("id-ID")],
        [
          "Tunjangan Jabatan",
          payroll.position_allowance.toLocaleString("id-ID"),
        ],
        [
          "Lembur (" + payroll.overtime_hours + " jam)",
          payroll.overtime_pay.toLocaleString("id-ID"),
        ],
      ],
      foot: [
        ["TOTAL PENDAPATAN", payroll.gross_salary.toLocaleString("id-ID")],
      ],
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
      footStyles: {
        fillColor: [229, 231, 235],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
    });

    // Deductions Table
    yPos = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.text("POTONGAN", 20, yPos);

    autoTable(doc, {
      startY: yPos + 3,
      head: [["Keterangan", "Jumlah (Rp)"]],
      body: [
        [
          "Potongan Keterlambatan",
          payroll.late_deduction.toLocaleString("id-ID"),
        ],
        ["Potongan Absen", payroll.absence_deduction.toLocaleString("id-ID")],
        ["Potongan Pinjaman", payroll.loan_deduction.toLocaleString("id-ID")],
        [
          "BPJS Kesehatan",
          payroll.bpjs_kesehatan_deduction.toLocaleString("id-ID"),
        ],
        [
          "BPJS Ketenagakerjaan",
          payroll.bpjs_ketenagakerjaan_deduction.toLocaleString("id-ID"),
        ],
        ["Pajak PPh 21", payroll.tax_pph21.toLocaleString("id-ID")],
      ],
      foot: [
        ["TOTAL POTONGAN", payroll.total_deductions.toLocaleString("id-ID")],
      ],
      theme: "grid",
      headStyles: { fillColor: [239, 68, 68] },
      footStyles: {
        fillColor: [229, 231, 235],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
    });

    // Net Salary
    yPos = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(34, 197, 94);
    doc.rect(20, yPos, 170, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("GAJI BERSIH (TAKE HOME PAY)", 25, yPos + 8);
    doc.text(
      `Rp ${payroll.net_salary.toLocaleString("id-ID")}`,
      185,
      yPos + 8,
      { align: "right" },
    );

    // Footer
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    yPos += 20;
    doc.text(
      "Slip gaji ini dicetak secara otomatis dan tidak memerlukan tanda tangan.",
      105,
      yPos,
      { align: "center" },
    );
    doc.text(
      `Dicetak pada: ${new Date().toLocaleDateString("id-ID")}`,
      105,
      yPos + 5,
      { align: "center" },
    );

    // Save PDF
    doc.save(
      `Slip_Gaji_${payroll.employees?.employee_number}_${monthNames[payroll.period_month - 1]}_${payroll.period_year}.pdf`,
    );
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      period_month: currentMonth.toString(),
      period_year: currentYear.toString(),
      basic_salary: "",
      transport_allowance: "0",
      meal_allowance: "0",
      position_allowance: "0",
      overtime_hours: "0",
      overtime_pay: "0",
      late_deduction: "0",
      absence_deduction: "0",
      loan_deduction: "0",
      bpjs_kesehatan_deduction: "0",
      bpjs_ketenagakerjaan_deduction: "0",
      tax_pph21: "0",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: {
        variant: "secondary",
        label: "Pending",
        color: "bg-yellow-500",
      },
      paid: { variant: "default", label: "Dibayar", color: "bg-green-500" },
      cancelled: {
        variant: "destructive",
        label: "Dibatalkan",
        color: "bg-red-500",
      },
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Payroll Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Info Dasar</TabsTrigger>
                  <TabsTrigger value="earnings">Pendapatan</TabsTrigger>
                  <TabsTrigger value="deductions">Potongan</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
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
                            basic_salary: emp?.basic_salary?.toString() || "",
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
                          setFormData({
                            ...formData,
                            period_year: e.target.value,
                          })
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
                          setFormData({
                            ...formData,
                            basic_salary: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="earnings" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tunjangan Transport</Label>
                      <Input
                        type="number"
                        value={formData.transport_allowance}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            transport_allowance: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tunjangan Makan</Label>
                      <Input
                        type="number"
                        value={formData.meal_allowance}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            meal_allowance: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tunjangan Jabatan</Label>
                      <Input
                        type="number"
                        value={formData.position_allowance}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            position_allowance: e.target.value,
                          })
                        }
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
                          setFormData({
                            ...formData,
                            overtime_pay: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="deductions" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Potongan Keterlambatan</Label>
                      <Input
                        type="number"
                        value={formData.late_deduction}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            late_deduction: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Potongan Absen</Label>
                      <Input
                        type="number"
                        value={formData.absence_deduction}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            absence_deduction: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Potongan Pinjaman</Label>
                      <Input
                        type="number"
                        value={formData.loan_deduction}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            loan_deduction: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>BPJS Kesehatan</Label>
                      <Input
                        type="number"
                        value={formData.bpjs_kesehatan_deduction}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bpjs_kesehatan_deduction: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>BPJS Ketenagakerjaan</Label>
                      <Input
                        type="number"
                        value={formData.bpjs_ketenagakerjaan_deduction}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bpjs_ketenagakerjaan_deduction: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Pajak PPh 21</Label>
                      <Input
                        type="number"
                        value={formData.tax_pph21}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tax_pph21: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border-2 border-blue-200">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Gaji Kotor</p>
                    <p className="text-xl font-bold text-blue-600">
                      Rp {calculatePayroll().gross.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Potongan</p>
                    <p className="text-xl font-bold text-red-600">
                      Rp{" "}
                      {calculatePayroll().totalDeductions.toLocaleString(
                        "id-ID",
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gaji Bersih</p>
                    <p className="text-2xl font-bold text-green-600">
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>No. Karyawan</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Gaji Pokok</TableHead>
                  <TableHead>Gaji Kotor</TableHead>
                  <TableHead>Potongan</TableHead>
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
                      {monthNames[payroll.period_month - 1]}{" "}
                      {payroll.period_year}
                    </TableCell>
                    <TableCell>
                      Rp {payroll.basic_salary.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-blue-600 font-semibold">
                      Rp {payroll.gross_salary.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-red-600">
                      Rp {payroll.total_deductions.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="font-bold text-green-600">
                      Rp {payroll.net_salary.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payroll.payment_status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generatePayslipPDF(payroll)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        {payroll.payment_status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handlePaymentStatus(payroll.id, "paid")
                            }
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Bayar
                          </Button>
                        )}
                      </div>
                    </TableCell>
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
