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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, LogIn, LogOut, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

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
  work_hours: number;
  status: string;
  employees?: { full_name: string; employee_number: string };
}

export default function AttendanceManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
    loadAttendances();
  }, [selectedDate]);

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

    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from("attendance").insert({
        employee_id: selectedEmployee,
        attendance_date: selectedDate,
        clock_in: now,
        status: "present",
      });

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
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("attendance")
        .update({ clock_out: now })
        .eq("id", attendanceId);

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      present: { variant: "default", label: "Hadir" },
      late: { variant: "secondary", label: "Terlambat" },
      absent: { variant: "destructive", label: "Tidak Hadir" },
      leave: { variant: "outline", label: "Cuti" },
      sick: { variant: "outline", label: "Sakit" },
      permission: { variant: "outline", label: "Izin" },
    };
    const config = variants[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </CardContent>
      </Card>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daftar Absensi - {format(new Date(selectedDate), "dd MMMM yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>No. Karyawan</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Jam Kerja</TableHead>
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
                    {att.work_hours ? `${att.work_hours.toFixed(2)} jam` : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(att.status)}</TableCell>
                  <TableCell className="text-right">
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
