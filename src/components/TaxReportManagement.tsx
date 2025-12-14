import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  FileText,
  Download,
  Calendar,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Send,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TaxReport {
  id: string;
  report_type: string;
  period_month: number;
  period_year: number;
  total_dpp: number;
  total_ppn: number;
  total_pph: number;
  status: string;
  created_at: string;
}

interface TaxReminder {
  id: string;
  reminder_type: string;
  due_date: string;
  period_month: number;
  period_year: number;
  is_completed: boolean;
  notes: string;
}

interface TaxSetting {
  id: string;
  tax_type: string;
  rate: number;
  effective_date: string;
  is_active: boolean;
  description: string;
}

export default function TaxReportManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [taxReports, setTaxReports] = useState<TaxReport[]>([]);
  const [reminders, setReminders] = useState<TaxReminder[]>([]);
  const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([]);
  const [selectedType, setSelectedType] = useState("Pajak Masukan");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const navigate = useNavigate();

  useEffect(() => {
    fetchTaxReports();
    fetchReminders();
    fetchTaxSettings();
  }, []);

  const fetchTaxSettings = async () => {
    const { data, error } = await supabase
      .from("tax_settings")
      .select("*")
      .eq("is_active", true)
      .order("tax_type");

    if (error) {
      console.error("Error fetching tax settings:", error);
    } else {
      setTaxSettings(data || []);
    }
  };

  const fetchTaxReports = async () => {
    const { data, error } = await supabase
      .from("tax_reports")
      .select("*")
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data laporan pajak",
        variant: "destructive",
      });
    } else {
      setTaxReports(data || []);
    }
  };

  const fetchReminders = async () => {
    const { data, error } = await supabase
      .from("tax_reminders")
      .select("*")
      .eq("is_completed", false)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching reminders:", error);
    } else {
      setReminders(data || []);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      // Check if report already exists
      const { data: existingReport, error: checkError } = await supabase
        .from("tax_reports")
        .select("id, status")
        .eq("report_type", selectedType)
        .eq("period_month", selectedMonth)
        .eq("period_year", selectedYear)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingReport) {
        toast({
          title: "Laporan Sudah Ada",
          description: `Laporan ${selectedType} untuk periode ${selectedMonth}/${selectedYear} sudah dibuat dengan status ${existingReport.status}`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      let totalDPP = 0;
      let totalPPN = 0;
      let totalPPH = 0;

      if (selectedType === "Pajak Masukan") {
        const { data: purchases } = await supabase
          .from("purchase_requests")
          .select("total_amount, ppn_amount, pph_amount")
          .gte(
            "created_at",
            `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`,
          )
          .lt(
            "created_at",
            `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`,
          );

        purchases?.forEach((p) => {
          const dpp =
            Number(p.total_amount || 0) -
            Number(p.ppn_amount || 0) -
            Number(p.pph_amount || 0);
          totalDPP += dpp;
          totalPPN += Number(p.ppn_amount || 0);
          totalPPH += Number(p.pph_amount || 0);
        });
      } else if (selectedType === "Pajak Keluaran") {
        const { data: sales } = await supabase
          .from("sales_transactions")
          .select("subtotal, ppn_amount, pph_amount")
          .gte(
            "transaction_date",
            `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`,
          )
          .lt(
            "transaction_date",
            `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`,
          );

        sales?.forEach((s) => {
          totalDPP += Number(s.subtotal || 0);
          totalPPN += Number(s.ppn_amount || 0);
          totalPPH += Number(s.pph_amount || 0);
        });
      }

      const { error } = await supabase.from("tax_reports").insert({
        report_type: selectedType,
        period_month: selectedMonth,
        period_year: selectedYear,
        total_dpp: totalDPP,
        total_ppn: totalPPN,
        total_pph: totalPPH,
        status: "Draft",
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Laporan pajak berhasil dibuat",
      });

      fetchTaxReports();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async (reportId: string) => {
    const report = taxReports.find((r) => r.id === reportId);
    if (!report) return;

    const csvContent = `Laporan ${report.report_type}\nPeriode: ${report.period_month}/${report.period_year}\n\nDPP,${report.total_dpp}\nPPN,${report.total_ppn}\nPPH,${report.total_pph}\nTotal,${report.total_dpp + report.total_ppn}`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.report_type}_${report.period_month}_${report.period_year}.csv`;
    a.click();
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tax_reports")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Status laporan berhasil diubah menjadi ${newStatus}`,
      });

      fetchTaxReports();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    navigate("/dashboard");
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-0">
      {/* Header with gradient */}
      <div className="border-b bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 shadow-lg">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Manajemen Perpajakan
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manajemen Perpajakan
          </h1>
          <p className="text-gray-600 mt-2">
            Kelola laporan pajak masukan, keluaran, SPT, dan upload coretax
          </p>
        </div>

        {/* Tax Settings Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <FileText className="h-5 w-5" />
              Tarif Pajak Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {taxSettings.map((setting) => (
                <div key={setting.id} className="bg-white p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">
                    {setting.tax_type}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {setting.rate}%
                  </p>
                  <p className="text-xs text-gray-500">{setting.description}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-3">
              ℹ️ Tarif pajak akan otomatis diupdate sesuai peraturan terbaru
              dari database
            </p>
          </CardContent>
        </Card>

        {/* Tax Reminders */}
        {reminders.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                Pengingat Pajak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {reminder.reminder_type}
                        </p>
                        <p className="text-sm text-gray-600">
                          Periode: {monthNames[reminder.period_month - 1]}{" "}
                          {reminder.period_year}
                        </p>
                      </div>
                    </div>
                    <Badge variant="destructive">
                      Jatuh Tempo:{" "}
                      {new Date(reminder.due_date).toLocaleDateString("id-ID")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate Report */}
        <Card>
          <CardHeader>
            <CardTitle>Buat Laporan Pajak</CardTitle>
            <CardDescription>
              Generate laporan pajak berdasarkan periode dan jenis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Jenis Laporan</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pajak Masukan">Pajak Masukan</SelectItem>
                    <SelectItem value="Pajak Keluaran">
                      Pajak Keluaran
                    </SelectItem>
                    <SelectItem value="SPT Masa PPN">SPT Masa PPN</SelectItem>
                    <SelectItem value="SPT Tahunan">SPT Tahunan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bulan</Label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(v) => setSelectedMonth(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames
                      .filter((month) => month)
                      .map((month, idx) => (
                        <SelectItem key={idx} value={(idx + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tahun</Label>
                <Input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={generateReport}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Generating..." : "Generate Laporan"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Reports Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daftar Laporan Pajak</CardTitle>
              <Button variant="outline" size="sm" onClick={fetchTaxReports}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jenis Laporan</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-right">DPP</TableHead>
                  <TableHead className="text-right">PPN</TableHead>
                  <TableHead className="text-right">PPH</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.report_type}
                    </TableCell>
                    <TableCell>
                      {monthNames[report.period_month - 1]} {report.period_year}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(report.total_dpp)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(report.total_ppn)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(report.total_pph)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          report.status === "Approved"
                            ? "default"
                            : report.status === "Submitted"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {report.status === "Draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateReportStatus(report.id, "Submitted")
                            }
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Submit
                          </Button>
                        )}
                        {report.status === "Submitted" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateReportStatus(report.id, "Approved")
                            }
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => exportToExcel(report.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
