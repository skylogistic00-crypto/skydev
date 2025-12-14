import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

// Types for HRD operations
export interface EmployeeData {
  full_name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  birth_place?: string;
  gender?: string;
  religion?: string;
  marital_status?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  ktp_number?: string;
  npwp_number?: string;
  bpjs_kesehatan?: string;
  bpjs_ketenagakerjaan?: string;
  department_id?: string;
  position_id?: string;
  employment_status?: string;
  join_date?: string;
  basic_salary?: string | number;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  emergency_contact_address?: string;
  last_education?: string;
  institution_name?: string;
  major?: string;
  graduation_year?: string | number;
  status?: string;
  notes?: string;
}

export interface LeaveData {
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days?: number;
  reason?: string;
  status?: string;
  approved_by?: string;
  notes?: string;
}

export interface PayrollData {
  employee_id: string;
  period_month: number;
  period_year: number;
  basic_salary: number;
  allowances?: number;
  overtime_pay?: number;
  deductions?: number;
  tax?: number;
  bpjs_kesehatan?: number;
  bpjs_ketenagakerjaan?: number;
  net_salary: number;
  status?: string;
  notes?: string;
}

export interface AttendanceData {
  employee_id: string;
  attendance_date?: string;
  clock_in?: string;
  clock_out?: string;
  status?: string;
  overtime_hours?: number;
  notes?: string;
}

export interface ContractData {
  employee_id: string;
  contract_number: string;
  contract_type: string;
  start_date: string;
  end_date?: string;
  salary?: number;
  allowances?: number;
  status?: string;
  document_url?: string;
  notes?: string;
}

// Hook for HRD operations
export function useHRDOperations() {
  const { toast } = useToast();

  // Employee operations
  const saveEmployee = async (data: EmployeeData, id?: string) => {
    try {
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-employee",
        {
          body: {
            action: id ? "update" : "insert",
            data,
            id,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: responseData?.message || "Data karyawan berhasil disimpan",
      });

      return { success: true, data: responseData };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan data karyawan",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  // Leave operations
  const saveLeave = async (data: LeaveData, id?: string) => {
    try {
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-leave",
        {
          body: {
            action: id ? "update" : "insert",
            data,
            id,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: responseData?.message || "Pengajuan cuti berhasil disimpan",
      });

      return { success: true, data: responseData };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan pengajuan cuti",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const approveLeave = async (id: string, approvedBy: string) => {
    try {
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-leave",
        {
          body: {
            action: "approve",
            data: { approved_by: approvedBy },
            id,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Cuti berhasil disetujui",
      });

      return { success: true, data: responseData };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyetujui cuti",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const rejectLeave = async (id: string, approvedBy: string, notes?: string) => {
    try {
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-leave",
        {
          body: {
            action: "reject",
            data: { approved_by: approvedBy, notes },
            id,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Cuti berhasil ditolak",
      });

      return { success: true, data: responseData };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menolak cuti",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  // Payroll operations
  const savePayroll = async (data: PayrollData, id?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-payroll",
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: {
            action: id ? "update" : "insert",
            data,
            id,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: responseData?.message || "Data payroll berhasil disimpan",
      });

      return { success: true, data: responseData };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan data payroll",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const processPayroll = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-payroll",
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: {
            action: "process",
            data: {},
            id,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Payroll berhasil diproses",
      });

      return { success: true, data: responseData };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memproses payroll",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const payPayroll = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-payroll",
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: {
            action: "pay",
            data: {},
            id,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Payroll berhasil dibayarkan",
      });

      return { success: true, data: responseData };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal membayar payroll",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  // Attendance operations
  const clockIn = async (employeeId: string, notes?: string) => {
    try {
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-attendance",
        {
          body: {
            action: "clock_in",
            data: { employee_id: employeeId, notes },
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Clock in berhasil",
      });

      return { success: true, data: responseData };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal clock in",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const clockOut = async (attendanceId: string) => {
    try {
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-attendance",
        {
          body: {
            action: "clock_out",
            data: {},
            id: attendanceId,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Clock out berhasil",
      });

      return { success: true, data: responseData };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal clock out",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const saveAttendance = async (data: AttendanceData, id?: string) => {
    try {
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-attendance",
        {
          body: {
            action: id ? "update" : "insert",
            data,
            id,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: responseData?.message || "Data kehadiran berhasil disimpan",
      });

      return { success: true, data: responseData };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan data kehadiran",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  // Contract operations
  const saveContract = async (data: ContractData, id?: string) => {
    try {
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-contract",
        {
          body: {
            action: id ? "update" : "insert",
            data,
            id,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: responseData?.message || "Data kontrak berhasil disimpan",
      });

      return { success: true, data: responseData };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan data kontrak",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const terminateContract = async (id: string, notes?: string) => {
    try {
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-contract",
        {
          body: {
            action: "terminate",
            data: { notes },
            id,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Kontrak berhasil dihentikan",
      });

      return { success: true, data: responseData };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menghentikan kontrak",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const renewContract = async (id: string, data: Partial<ContractData>) => {
    try {
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-contract",
        {
          body: {
            action: "renew",
            data,
            id,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Kontrak berhasil diperpanjang",
      });

      return { success: true, data: responseData };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memperpanjang kontrak",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    // Employee
    saveEmployee,
    // Leave
    saveLeave,
    approveLeave,
    rejectLeave,
    // Payroll
    savePayroll,
    processPayroll,
    payPayroll,
    // Attendance
    clockIn,
    clockOut,
    saveAttendance,
    // Contract
    saveContract,
    terminateContract,
    renewContract,
  };
}
