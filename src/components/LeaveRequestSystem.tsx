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
import { Calendar, Plus, Check, X, FileText, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Employee {
  id: string;
  employee_number: string;
  full_name: string;
  email: string;
}

interface LeaveType {
  id: string;
  leave_name: string;
  max_days: number;
  requires_document: boolean;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  document_url: string;
  status: string;
  rejection_reason: string;
  employees?: { full_name: string; employee_number: string; email: string };
  leave_types?: { leave_name: string };
}

interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  leave_types?: { leave_name: string };
}

export default function LeaveRequestSystem({ onUpdate }: { onUpdate?: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    employee_id: "",
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const [documentFile, setDocumentFile] = useState<File | null>(null);

  useEffect(() => {
    loadEmployees();
    loadLeaveTypes();
    loadLeaveRequests();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadLeaveBalances(selectedEmployee);
    }
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, employee_number, full_name, email")
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
        employees(full_name, employee_number, email),
        leave_types(leave_name)
      `)
      .order("created_at", { ascending: false });
    setLeaveRequests(data || []);
  };

  const loadLeaveBalances = async (employeeId: string) => {
    const currentYear = new Date().getFullYear();
    const { data } = await supabase
      .from("leave_balance")
      .select(`
        *,
        leave_types(leave_name)
      `)
      .eq("employee_id", employeeId)
      .eq("year", currentYear);
    
    setLeaveBalances(data || []);
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

  const uploadDocument = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `leave-documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('employee-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('employee-documents')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const sendEmailNotification = async (employeeEmail: string, employeeName: string, status: string, leaveType: string, startDate: string, endDate: string, rejectionReason?: string) => {
    try {
      // Call edge function to send email
      const { error } = await supabase.functions.invoke('supabase-functions-send-leave-notification', {
        body: {
          to: employeeEmail,
          employeeName,
          status,
          leaveType,
          startDate,
          endDate,
          rejectionReason,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingDoc(true);

    try {
      const totalDays = calculateDays();
      let documentUrl = "";

      // Upload document if provided
      if (documentFile) {
        documentUrl = await uploadDocument(documentFile);
      }

      const { data: leaveRequest, error } = await supabase.from("leave_requests").insert({
        employee_id: formData.employee_id,
        leave_type_id: formData.leave_type_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_days: totalDays,
        reason: formData.reason,
        document_url: documentUrl,
        status: "pending",
      }).select(`
        *,
        employees(full_name, email),
        leave_types(leave_name)
      `).single();

      if (error) throw error;

      // Send email notification
      if (leaveRequest) {
        await sendEmailNotification(
          leaveRequest.employees.email,
          leaveRequest.employees.full_name,
          "pending",
          leaveRequest.leave_types.leave_name,
          formData.start_date,
          formData.end_date
        );
      }

      toast({ title: "Berhasil", description: "Pengajuan cuti berhasil dibuat" });
      loadLeaveRequests();
      onUpdate?.();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleApproval = async (request: LeaveRequest, status: "approved" | "rejected") => {
    if (status === "rejected") {
      setRejectingRequest(request);
      setIsRejectDialogOpen(true);
      return;
    }

    try {
      const { error } = await supabase
        .from("leave_requests")
        .update({ 
          status,
          approved_at: new Date().toISOString()
        })
        .eq("id", request.id);

      if (error) throw error;

      // Send email notification
      await sendEmailNotification(
        request.employees?.email || "",
        request.employees?.full_name || "",
        status,
        request.leave_types?.leave_name || "",
        request.start_date,
        request.end_date
      );

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

  const handleReject = async () => {
    if (!rejectingRequest || !rejectionReason) {
      toast({ title: "Error", description: "Alasan penolakan harus diisi", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from("leave_requests")
        .update({ 
          status: "rejected",
          rejection_reason: rejectionReason,
          approved_at: new Date().toISOString()
        })
        .eq("id", rejectingRequest.id);

      if (error) throw error;

      // Send email notification
      await sendEmailNotification(
        rejectingRequest.employees?.email || "",
        rejectingRequest.employees?.full_name || "",
        "rejected",
        rejectingRequest.leave_types?.leave_name || "",
        rejectingRequest.start_date,
        rejectingRequest.end_date,
        rejectionReason
      );

      toast({ title: "Berhasil", description: "Pengajuan cuti ditolak" });
      loadLeaveRequests();
      onUpdate?.();
      setIsRejectDialogOpen(false);
      setRejectingRequest(null);
      setRejectionReason("");
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
    setDocumentFile(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", label: "Menunggu", color: "bg-yellow-500" },
      approved: { variant: "default", label: "Disetujui", color: "bg-green-500" },
      rejected: { variant: "destructive", label: "Ditolak", color: "bg-red-500" },
      cancelled: { variant: "outline", label: "Dibatalkan", color: "bg-gray-500" },
    };
    const config = variants[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Leave Balance Card */}
      <Card className="bg-gradient-to-br from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle>Saldo Cuti Karyawan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih karyawan untuk melihat saldo cuti" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.employee_number} - {emp.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedEmployee && leaveBalances.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {leaveBalances.map((balance) => (
                  <Card key={balance.id}>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600">{balance.leave_types?.leave_name}</div>
                      <div className="text-2xl font-bold text-blue-600">{balance.remaining_days} hari</div>
                      <div className="text-xs text-gray-500">
                        Terpakai: {balance.used_days} / Total: {balance.total_days}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Header */}
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
                        {type.requires_document && " - Perlu Dokumen"}
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

              <div className="space-y-2">
                <Label>Upload Dokumen Pendukung</Label>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-gray-500">Surat dokter, undangan, dll (jika diperlukan)</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={uploadingDoc}>
                  {uploadingDoc ? "Menyimpan..." : "Ajukan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daftar Pengajuan Cuti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>No. Karyawan</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Jenis Cuti</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Dokumen</TableHead>
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
                      {format(new Date(leave.start_date), "dd MMM", { locale: localeId })} - {format(new Date(leave.end_date), "dd MMM yyyy", { locale: localeId })}
                    </TableCell>
                    <TableCell>{leave.total_days} hari</TableCell>
                    <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                    <TableCell>
                      {leave.document_url ? (
                        <a href={leave.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Lihat
                        </a>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                    <TableCell className="text-right">
                      {leave.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproval(leave, "approved")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleApproval(leave, "rejected")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {leave.status === "rejected" && leave.rejection_reason && (
                        <div className="text-xs text-red-600">
                          Alasan: {leave.rejection_reason}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pengajuan Cuti</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alasan Penolakan *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Jelaskan alasan penolakan..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                <X className="h-4 w-4 mr-2" />
                Tolak Pengajuan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
