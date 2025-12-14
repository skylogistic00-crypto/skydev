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
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  MapPin,
  Smartphone,
  Edit2,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Employee {
  id: string;
  employee_number: string;
  full_name: string;
}

interface Attendance {
  id: string;
  employee_id: string;
  attendance_date: string;
  clock_in: string;
  clock_out: string;
  clock_in_location: string;
  clock_out_location: string;
  work_hours: number;
  overtime_hours: number;
  status: string;
  notes: string;
  employees?: { full_name: string; employee_number: string };
}

export default function AttendanceSystem() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [deviceInfo, setDeviceInfo] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(
    null,
  );
  const { toast } = useToast();

  const [editForm, setEditForm] = useState({
    clock_in: "",
    clock_out: "",
    status: "",
    notes: "",
  });

  useEffect(() => {
    loadEmployees();
    loadAttendances();
    getLocation();
    getDeviceFingerprint();
  }, [selectedDate]);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Peringatan",
            description:
              "Tidak dapat mengakses lokasi. Pastikan izin lokasi diaktifkan.",
            variant: "destructive",
          });
        },
      );
    }
  };

  const getDeviceFingerprint = () => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const screenResolution = `${window.screen.width}x${window.screen.height}`;

    const fingerprint = `${userAgent}|${platform}|${language}|${screenResolution}`;
    setDeviceInfo(fingerprint);
  };

  const loadEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, employee_number, full_name")
      .eq("status", "active")
      .order("full_name");
    setEmployees(data || []);
  };

  const loadAttendances = async () => {
    const { data } = await supabase
      .from("attendance")
      .select(
        `
        *,
        employees(full_name, employee_number)
      `,
      )
      .eq("attendance_date", selectedDate)
      .order("clock_in", { ascending: false });
    setAttendances(data || []);
  };

  const handleClockIn = async () => {
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Pilih karyawan terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (!location) {
      toast({
        title: "Error",
        description: "Lokasi belum terdeteksi",
        variant: "destructive",
      });
      return;
    }

    try {
      const now = new Date().toISOString();
      const locationString = `${location.lat},${location.lng}`;

      // Check if already clocked in today
      const { data: existing } = await supabase
        .from("attendance")
        .select("id")
        .eq("employee_id", selectedEmployee)
        .eq("attendance_date", selectedDate)
        .single();

      if (existing) {
        toast({
          title: "Error",
          description: "Karyawan sudah melakukan clock in hari ini",
          variant: "destructive",
        });
        return;
      }

      // Call edge function for INSERT operation to database
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-attendance",
        {
          body: {
            action: "clock_in",
            data: {
              employee_id: selectedEmployee,
              attendance_date: selectedDate,
              clock_in_location: locationString,
              notes: `Device: ${deviceInfo}, Location: ${locationString}`,
            },
          },
        },
      );

      if (error) throw error;
      toast({ title: "Berhasil", description: "Clock in berhasil dicatat" });
      loadAttendances();
      setSelectedEmployee("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleClockOut = async (attendanceId: string) => {
    if (!location) {
      toast({
        title: "Error",
        description: "Lokasi belum terdeteksi",
        variant: "destructive",
      });
      return;
    }

    try {
      // Call edge function for UPDATE operation to database
      const locationString = `${location.lat},${location.lng}`;
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-attendance",
        {
          body: {
            action: "clock_out",
            data: {
              clock_out_location: locationString,
            },
            id: attendanceId,
          },
        },
      );

      if (error) throw error;
      toast({ title: "Berhasil", description: "Clock out berhasil dicatat" });
      loadAttendances();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditAttendance = (attendance: Attendance) => {
    setEditingAttendance(attendance);
    setEditForm({
      clock_in: attendance.clock_in
        ? format(new Date(attendance.clock_in), "yyyy-MM-dd'T'HH:mm")
        : "",
      clock_out: attendance.clock_out
        ? format(new Date(attendance.clock_out), "yyyy-MM-dd'T'HH:mm")
        : "",
      status: attendance.status,
      notes: attendance.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttendance) return;

    try {
      const { error } = await supabase
        .from("attendance")
        .update({
          clock_in: editForm.clock_in
            ? new Date(editForm.clock_in).toISOString()
            : null,
          clock_out: editForm.clock_out
            ? new Date(editForm.clock_out).toISOString()
            : null,
          status: editForm.status,
          notes: editForm.notes,
        })
        .eq("id", editingAttendance.id);

      if (error) throw error;
      toast({ title: "Berhasil", description: "Absensi berhasil diupdate" });
      loadAttendances();
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      present: { variant: "default", label: "Hadir", color: "bg-green-500" },
      late: {
        variant: "secondary",
        label: "Terlambat",
        color: "bg-yellow-500",
      },
      absent: {
        variant: "destructive",
        label: "Tidak Hadir",
        color: "bg-red-500",
      },
      leave: { variant: "outline", label: "Cuti", color: "bg-blue-500" },
      sick: { variant: "outline", label: "Sakit", color: "bg-purple-500" },
      permission: { variant: "outline", label: "Izin", color: "bg-orange-500" },
      holiday: { variant: "outline", label: "Libur", color: "bg-gray-500" },
      remote: { variant: "outline", label: "Remote", color: "bg-indigo-500" },
    };
    const config = variants[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatLocation = (locationString: string) => {
    if (!locationString) return "-";
    const [lat, lng] = locationString.split(",");
    return (
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline flex items-center gap-1"
      >
        <MapPin className="h-3 w-3" />
        Lihat Lokasi
      </a>
    );
  };

  return (
    <div className="space-y-6">
      {/* Clock In/Out Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Absensi Karyawan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Pilih Karyawan</Label>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
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
              <Label>Status Lokasi</Label>
              <div className="flex items-center gap-2 p-2 border rounded-md bg-white">
                <MapPin
                  className={`h-4 w-4 ${location ? "text-green-500" : "text-red-500"}`}
                />
                <span className="text-sm">
                  {location ? "Terdeteksi" : "Tidak Terdeteksi"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                onClick={handleClockIn}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Clock In
              </Button>
            </div>
          </div>

          {location && (
            <div className="mt-4 p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Smartphone className="h-4 w-4" />
                <span>
                  Device: {navigator.platform} |{" "}
                  {navigator.userAgent.split(" ")[0]}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daftar Absensi -{" "}
            {format(new Date(selectedDate), "dd MMMM yyyy", {
              locale: localeId,
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>No. Karyawan</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Lokasi In</TableHead>
                  <TableHead>Lokasi Out</TableHead>
                  <TableHead>Jam Kerja</TableHead>
                  <TableHead>Lembur</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendances.map((att) => (
                  <TableRow key={att.id}>
                    <TableCell className="font-medium">
                      {att.employees?.employee_number}
                    </TableCell>
                    <TableCell>{att.employees?.full_name}</TableCell>
                    <TableCell>
                      {att.clock_in
                        ? format(new Date(att.clock_in), "HH:mm:ss")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {att.clock_out
                        ? format(new Date(att.clock_out), "HH:mm:ss")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {formatLocation(att.clock_in_location)}
                    </TableCell>
                    <TableCell>
                      {formatLocation(att.clock_out_location)}
                    </TableCell>
                    <TableCell>
                      {att.work_hours
                        ? `${att.work_hours.toFixed(2)} jam`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {att.overtime_hours > 0 ? (
                        <Badge variant="secondary">
                          {att.overtime_hours.toFixed(2)} jam
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(att.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!att.clock_out && (
                          <Button
                            size="sm"
                            onClick={() => handleClockOut(att.id)}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Clock Out
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditAttendance(att)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Attendance Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Koreksi Absensi</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateAttendance} className="space-y-4">
            <div className="space-y-2">
              <Label>Clock In</Label>
              <Input
                type="datetime-local"
                value={editForm.clock_in}
                onChange={(e) =>
                  setEditForm({ ...editForm, clock_in: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Clock Out</Label>
              <Input
                type="datetime-local"
                value={editForm.clock_out}
                onChange={(e) =>
                  setEditForm({ ...editForm, clock_out: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Hadir</SelectItem>
                  <SelectItem value="late">Terlambat</SelectItem>
                  <SelectItem value="absent">Tidak Hadir</SelectItem>
                  <SelectItem value="leave">Cuti</SelectItem>
                  <SelectItem value="sick">Sakit</SelectItem>
                  <SelectItem value="permission">Izin</SelectItem>
                  <SelectItem value="holiday">Libur</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
                placeholder="Catatan koreksi..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Simpan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
