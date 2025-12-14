import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Plus, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useHRDOperations } from "@/hooks/useHRDOperations";

interface Employee {
  id: string;
  employee_number: string;
  full_name: string;
}

interface LeaveType {
  id: string;
  leave_name: string;
  max_days: number;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  employees?: { full_name: string; employee_number: string };
  leave_types?: { leave_name: string };
}

export default function LeaveManagement({ onUpdate }: { onUpdate?: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    employee_id: "",
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  useEffect(() => {
    loadEmployees();
    loadLeaveTypes();
    loadLeaveRequests();
  }, []);

  const loadEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, employee_number, full_name")
      .eq("status", "active")
      .order("full_name");
    setEmployees(data || []);
  };

  const loadLeaveTypes = async () => {
    const { data } = await supabase.from("leave_types").select("*").order("leave_name");
    setLeaveTypes(data || []);
  };

  const loadLeaveRequests = async () => {
    const { data } = await supabase
      .from("leave_requests")
      .select(`
        *,
        employees(full_name, employee_number),
        leave_types(leave_name)
      `)
      .order("created_at", { ascending: false });
    setLeaveRequests(data || []);
  };

  const calculateDays = () => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const totalDays = calculateDays();

      // Call edge function for INSERT operation to database
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-leave",
        {
          body: {
            action: "insert",
            data: {
              employee_id: formData.employee_id,
              leave_type: formData.leave_type_id,
              start_date: formData.start_date,
              end_date: formData.end_date,
              total_days: totalDays,
              reason: formData.reason,
              status: "pending",
            },
          },
        }
      );

      if (error) throw error;
      toast({ title: "Berhasil", description: "Pengajuan cuti berhasil dibuat" });
      loadLeaveRequests();
      onUpdate?.();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleApproval = async (id: string, status: "approved" | "rejected") => {
    try {
      // Call edge function for UPDATE operation to database
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-leave",
        {
          body: {
            action: status === "approved" ? "approve" : "reject",
            data: { approved_by: "current_user" },
            id,
          },
        }
      );

      if (error) throw error;
      
      toast({ 
        title: "Berhasil", 
        description: `Pengajuan cuti ${status === "approved" ? "disetujui" : "ditolak"}` 
      });
      loadLeaveRequests();
      onUpdate?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      leave_type_id: "",
      start_date: "",
      end_date: "",
      reason: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", label: "Menunggu" },
      approved: { variant: "default", label: "Disetujui" },
      rejected: { variant: "destructive", label: "Ditolak" },
      cancelled: { variant: "outline", label: "Dibatalkan" },
    };
    const config = variants[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Cuti & Izin</h2>
          <p className="text-gray-600">Kelola pengajuan cuti karyawan</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajukan Cuti
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Ajukan Cuti Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Karyawan *</Label>
                <Select required value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })}>
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
                <Label>Jenis Cuti *</Label>
                <Select required value={formData.leave_type_id} onValueChange={(value) => setFormData({ ...formData, leave_type_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis cuti" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.leave_name} (Max: {type.max_days} hari)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal Mulai *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Selesai *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              {formData.start_date && formData.end_date && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Total Hari Cuti</p>
                  <p className="text-2xl font-bold text-blue-600">{calculateDays()} hari</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Alasan *</Label>
                <Textarea
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Jelaskan alasan pengajuan cuti..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  Ajukan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daftar Pengajuan Cuti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>No. Karyawan</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Jenis Cuti</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="font-medium">{leave.employees?.employee_number}</TableCell>
                  <TableCell>{leave.employees?.full_name}</TableCell>
                  <TableCell>{leave.leave_types?.leave_name}</TableCell>
                  <TableCell>
                    {new Date(leave.start_date).toLocaleDateString("id-ID")} - {new Date(leave.end_date).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>{leave.total_days} hari</TableCell>
                  <TableCell>{getStatusBadge(leave.status)}</TableCell>
                  <TableCell className="text-right">
                    {leave.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproval(leave.id, "approved")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleApproval(leave.id, "rejected")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
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
