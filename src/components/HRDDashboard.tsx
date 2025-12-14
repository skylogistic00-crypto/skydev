import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Briefcase, Clock, DollarSign, FileText, Calendar, TrendingUp, Bell } from "lucide-react";
import EmployeeManagementAdvanced from "./EmployeeManagementAdvanced";
import DepartmentManagement from "./DepartmentManagement";
import AttendanceSystem from "./AttendanceSystem";
import PayrollSystem from "./PayrollSystem";
import LeaveRequestSystem from "./LeaveRequestSystem";
import ContractManagementAdvanced from "./ContractManagementAdvanced";
import PerformanceReviewSystem from "./PerformanceReviewSystem";
import HRDNotifications from "./HRDNotifications";

interface DashboardStats {
  totalEmployees: number;
  activeContracts: number;
  pendingLeaves: number;
  todayAttendance: number;
}

export default function HRDDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeContracts: 0,
    pendingLeaves: 0,
    todayAttendance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const [employees, contracts, leaves, attendance] = await Promise.all([
        supabase.from("employees").select("id", { count: "exact" }).eq("status", "active"),
        supabase.from("employment_contracts").select("id", { count: "exact" }).eq("status", "active"),
        supabase.from("leave_requests").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("attendance").select("id", { count: "exact" }).eq("attendance_date", new Date().toISOString().split("T")[0]),
      ]);

      setStats({
        totalEmployees: employees.count || 0,
        activeContracts: contracts.count || 0,
        pendingLeaves: leaves.count || 0,
        todayAttendance: attendance.count || 0,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">HRD Management System</h1>
            <p className="text-gray-600 mt-1">Kelola seluruh aspek SDM perusahaan Anda</p>
          </div>
          <HRDNotifications />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Karyawan</CardTitle>
              <Users className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs opacity-80 mt-1">Karyawan aktif</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Kontrak Aktif</CardTitle>
              <FileText className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeContracts}</div>
              <p className="text-xs opacity-80 mt-1">Kontrak berjalan</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pengajuan Cuti</CardTitle>
              <Calendar className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pendingLeaves}</div>
              <p className="text-xs opacity-80 mt-1">Menunggu approval</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Absensi Hari Ini</CardTitle>
              <Clock className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.todayAttendance}</div>
              <p className="text-xs opacity-80 mt-1">Sudah absen</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-6">
            <Tabs defaultValue="employees" className="space-y-6">
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2 bg-gray-100 p-2 rounded-lg">
                <TabsTrigger value="employees" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Karyawan</span>
                </TabsTrigger>
                <TabsTrigger value="departments" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Departemen</span>
                </TabsTrigger>
                <TabsTrigger value="attendance" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Absensi</span>
                </TabsTrigger>
                <TabsTrigger value="payroll" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">Payroll</span>
                </TabsTrigger>
                <TabsTrigger value="leave" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Cuti</span>
                </TabsTrigger>
                <TabsTrigger value="contracts" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Kontrak</span>
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Kinerja</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Notifikasi</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="employees">
                <EmployeeManagementAdvanced onUpdate={loadDashboardStats} />
              </TabsContent>

              <TabsContent value="departments">
                <DepartmentManagement />
              </TabsContent>

              <TabsContent value="attendance">
                <AttendanceSystem />
              </TabsContent>

              <TabsContent value="payroll">
                <PayrollSystem />
              </TabsContent>

              <TabsContent value="leave">
                <LeaveRequestSystem onUpdate={loadDashboardStats} />
              </TabsContent>

              <TabsContent value="contracts">
                <ContractManagementAdvanced onUpdate={loadDashboardStats} />
              </TabsContent>

              <TabsContent value="performance">
                <PerformanceReviewSystem />
              </TabsContent>

              <TabsContent value="notifications">
                <HRDNotifications />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
