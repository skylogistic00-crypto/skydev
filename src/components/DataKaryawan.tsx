import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  ArrowLeft,
  Users,
  CheckCircle,
  XCircle,
  Filter,
  Phone,
  Mail,
  User,
  MapPin,
  Briefcase,
  Building2,
  Calendar,
  CreditCard,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { canClick } from "@/utils/roleAccess";

interface EmployeeFormData {
  full_name: string;
  email: string;
  phone: string;
  birth_date: string;
  birth_place: string;
  gender: string;
  religion: string;
  marital_status: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  ktp_number: string;
  npwp_number: string;
  bpjs_kesehatan: string;
  bpjs_ketenagakerjaan: string;
  department_id: string;
  position_id: string;
  employment_status: string;
  join_date: string;
  basic_salary: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
  emergency_contact_address: string;
  last_education: string;
  institution_name: string;
  major: string;
  graduation_year: string;
  status: string;
  notes: string;
}

interface Employee {
  id: string;
  employee_number: string;
  full_name: string;
  email: string;
  phone: string;
  department_id: string;
  position_id: string;
  employment_status: string;
  status: string;
  join_date: string;
  departments?: { department_name: string };
  positions?: { position_name: string };
}

interface Department {
  id: string;
  department_name: string;
}

interface Position {
  id: string;
  position_name: string;
  department_id: string;
}

export default function DataKaryawan() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>({
    full_name: "",
    email: "",
    phone: "",
    birth_date: "",
    birth_place: "",
    gender: "",
    religion: "",
    marital_status: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    ktp_number: "",
    npwp_number: "",
    bpjs_kesehatan: "",
    bpjs_ketenagakerjaan: "",
    department_id: "",
    position_id: "",
    employment_status: "",
    join_date: "",
    basic_salary: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_holder: "",
    emergency_contact_name: "",
    emergency_contact_relation: "",
    emergency_contact_phone: "",
    emergency_contact_address: "",
    last_education: "",
    institution_name: "",
    major: "",
    graduation_year: "",
    status: "active",
    notes: "",
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchPositions();

    const channel = supabase
      .channel("employees-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        () => {
          fetchEmployees();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = employees;

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((emp) => emp.status === statusFilter);
    }

    if (departmentFilter !== "ALL") {
      filtered = filtered.filter((emp) => emp.department_id === departmentFilter);
    }

    if (employmentStatusFilter !== "ALL") {
      filtered = filtered.filter((emp) => emp.employment_status === employmentStatusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (emp) =>
          emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.employee_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredEmployees(filtered);
  }, [searchTerm, statusFilter, departmentFilter, employmentStatusFilter, employees]);

  useEffect(() => {
    if (formData.department_id) {
      const filtered = positions.filter(p => p.department_id === formData.department_id);
      setFilteredPositions(filtered);
    } else {
      setFilteredPositions(positions);
    }
  }, [formData.department_id, positions]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          id,
          employee_number,
          full_name,
          email,
          phone,
          department_id,
          position_id,
          employment_status,
          status,
          join_date,
          departments(department_name),
          positions(position_name)
        `)
        .order("employee_number", { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
      setFilteredEmployees(data || []);
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

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("id, department_name")
        .order("department_name");

      if (error) throw error;
      setDepartments(data || []);
    } catch (error: any) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from("positions")
        .select("id, position_name, department_id")
        .order("position_name");

      if (error) throw error;
      setPositions(data || []);
      setFilteredPositions(data || []);
    } catch (error: any) {
      console.error("Error fetching positions:", error);
    }
  };

  const handleBack = () => {
    if (isDialogOpen) {
      setIsDialogOpen(false);
    }
    navigate("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call edge function for INSERT operation to database
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-employee",
        {
          body: {
            action: "insert",
            data: {
              full_name: formData.full_name,
              email: formData.email,
              phone: formData.phone || null,
              birth_date: formData.birth_date && formData.birth_date.trim() !== "" ? formData.birth_date : null,
              birth_place: formData.birth_place || null,
              gender: formData.gender || null,
              religion: formData.religion || null,
              marital_status: formData.marital_status || null,
              address: formData.address || null,
              city: formData.city || null,
              province: formData.province || null,
              postal_code: formData.postal_code || null,
              ktp_number: formData.ktp_number || null,
              npwp_number: formData.npwp_number || null,
              bpjs_kesehatan: formData.bpjs_kesehatan || null,
              bpjs_ketenagakerjaan: formData.bpjs_ketenagakerjaan || null,
              department_id: formData.department_id || null,
              position_id: formData.position_id || null,
              employment_status: formData.employment_status || null,
              join_date: formData.join_date && formData.join_date.trim() !== "" ? formData.join_date : null,
              basic_salary: formData.basic_salary || null,
              bank_name: formData.bank_name || null,
              bank_account_number: formData.bank_account_number || null,
              bank_account_holder: formData.bank_account_holder || null,
              emergency_contact_name: formData.emergency_contact_name || null,
              emergency_contact_relation: formData.emergency_contact_relation || null,
              emergency_contact_phone: formData.emergency_contact_phone || null,
              emergency_contact_address: formData.emergency_contact_address || null,
              last_education: formData.last_education || null,
              institution_name: formData.institution_name || null,
              major: formData.major || null,
              graduation_year: formData.graduation_year || null,
              status: formData.status,
              notes: formData.notes || null,
            },
          },
        }
      );

      if (error) throw error;

      const generatedCode = responseData?.data?.employee_number || "";

      toast({
        title: "Success",
        description: `Karyawan berhasil ditambahkan${generatedCode ? ` dengan kode ${generatedCode}` : ""}`,
      });

      // Reset form
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        birth_date: "",
        birth_place: "",
        gender: "",
        religion: "",
        marital_status: "",
        address: "",
        city: "",
        province: "",
        postal_code: "",
        ktp_number: "",
        npwp_number: "",
        bpjs_kesehatan: "",
        bpjs_ketenagakerjaan: "",
        department_id: "",
        position_id: "",
        employment_status: "",
        join_date: "",
        basic_salary: "",
        bank_name: "",
        bank_account_number: "",
        bank_account_holder: "",
        emergency_contact_name: "",
        emergency_contact_relation: "",
        emergency_contact_phone: "",
        emergency_contact_address: "",
        last_education: "",
        institution_name: "",
        major: "",
        graduation_year: "",
        status: "active",
        notes: "",
      });

      setIsDialogOpen(false);
      fetchEmployees();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="flex items-center gap-1 w-fit bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-300">
            <CheckCircle className="h-3 w-3" />
            Aktif
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="flex items-center gap-1 w-fit bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300">
            <XCircle className="h-3 w-3" />
            Tidak Aktif
          </Badge>
        );
      case "terminated":
        return (
          <Badge className="flex items-center gap-1 w-fit bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-300">
            <UserX className="h-3 w-3" />
            Diberhentikan
          </Badge>
        );
      case "resigned":
        return (
          <Badge className="flex items-center gap-1 w-fit bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-300">
            <UserX className="h-3 w-3" />
            Resign
          </Badge>
        );
      default:
        return (
          <Badge className="flex items-center gap-1 w-fit bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300">
            {status || "-"}
          </Badge>
        );
    }
  };

  const getEmploymentStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      "Tetap": "bg-blue-100 text-blue-700 border-blue-300",
      "Kontrak": "bg-purple-100 text-purple-700 border-purple-300",
      "Magang": "bg-cyan-100 text-cyan-700 border-cyan-300",
      "Freelance": "bg-orange-100 text-orange-700 border-orange-300",
      "Probation": "bg-amber-100 text-amber-700 border-amber-300",
    };

    const colorClass = colors[status] || "bg-slate-100 text-slate-700 border-slate-300";

    return (
      <Badge className={`flex items-center gap-1 ${colorClass}`}>
        <Briefcase className="h-3 w-3" />
        <span className="text-xs">{status || "-"}</span>
      </Badge>
    );
  };

  const summaryData = {
    total: employees.length,
    active: employees.filter((e) => e.status === "active").length,
    inactive: employees.filter((e) => e.status === "inactive" || e.status === "terminated" || e.status === "resigned").length,
    tetap: employees.filter((e) => e.employment_status === "Tetap").length,
    kontrak: employees.filter((e) => e.employment_status === "Kontrak").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="hover:bg-slate-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    Data Karyawan
                  </h1>
                  <p className="text-sm text-slate-500">
                    Kelola data karyawan perusahaan
                  </p>
                </div>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  disabled={!canClick(userRole)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Karyawan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Tambah Karyawan Baru
                  </DialogTitle>
                  <DialogDescription>
                    Isi data karyawan dengan lengkap
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Data Pribadi */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-700 border-b pb-2">Data Pribadi</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Nama Lengkap *</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">No. Telepon</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Jenis Kelamin</Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(value) => setFormData({ ...formData, gender: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis kelamin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                            <SelectItem value="Perempuan">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birth_place">Tempat Lahir</Label>
                        <Input
                          id="birth_place"
                          value={formData.birth_place}
                          onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birth_date">Tanggal Lahir</Label>
                        <Input
                          id="birth_date"
                          type="date"
                          value={formData.birth_date}
                          onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="religion">Agama</Label>
                        <Select
                          value={formData.religion}
                          onValueChange={(value) => setFormData({ ...formData, religion: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih agama" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Islam">Islam</SelectItem>
                            <SelectItem value="Kristen">Kristen</SelectItem>
                            <SelectItem value="Katolik">Katolik</SelectItem>
                            <SelectItem value="Hindu">Hindu</SelectItem>
                            <SelectItem value="Buddha">Buddha</SelectItem>
                            <SelectItem value="Konghucu">Konghucu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="marital_status">Status Pernikahan</Label>
                        <Select
                          value={formData.marital_status}
                          onValueChange={(value) => setFormData({ ...formData, marital_status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Belum Menikah">Belum Menikah</SelectItem>
                            <SelectItem value="Menikah">Menikah</SelectItem>
                            <SelectItem value="Cerai">Cerai</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Alamat */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-700 border-b pb-2">Alamat</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Alamat Lengkap</Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Kota</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="province">Provinsi</Label>
                        <Input
                          id="province"
                          value={formData.province}
                          onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Kode Pos</Label>
                        <Input
                          id="postal_code"
                          value={formData.postal_code}
                          onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dokumen Identitas */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-700 border-b pb-2">Dokumen Identitas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ktp_number">No. KTP</Label>
                        <Input
                          id="ktp_number"
                          value={formData.ktp_number}
                          onChange={(e) => setFormData({ ...formData, ktp_number: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="npwp_number">No. NPWP</Label>
                        <Input
                          id="npwp_number"
                          value={formData.npwp_number}
                          onChange={(e) => setFormData({ ...formData, npwp_number: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bpjs_kesehatan">No. BPJS Kesehatan</Label>
                        <Input
                          id="bpjs_kesehatan"
                          value={formData.bpjs_kesehatan}
                          onChange={(e) => setFormData({ ...formData, bpjs_kesehatan: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bpjs_ketenagakerjaan">No. BPJS Ketenagakerjaan</Label>
                        <Input
                          id="bpjs_ketenagakerjaan"
                          value={formData.bpjs_ketenagakerjaan}
                          onChange={(e) => setFormData({ ...formData, bpjs_ketenagakerjaan: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Data Kepegawaian */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-700 border-b pb-2">Data Kepegawaian</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="department_id">Departemen</Label>
                        <Select
                          value={formData.department_id}
                          onValueChange={(value) => setFormData({ ...formData, department_id: value, position_id: "" })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih departemen" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.department_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position_id">Jabatan</Label>
                        <Select
                          value={formData.position_id}
                          onValueChange={(value) => setFormData({ ...formData, position_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jabatan" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredPositions.map((pos) => (
                              <SelectItem key={pos.id} value={pos.id}>
                                {pos.position_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employment_status">Status Kepegawaian</Label>
                        <Select
                          value={formData.employment_status}
                          onValueChange={(value) => setFormData({ ...formData, employment_status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tetap">Tetap</SelectItem>
                            <SelectItem value="Kontrak">Kontrak</SelectItem>
                            <SelectItem value="Magang">Magang</SelectItem>
                            <SelectItem value="Freelance">Freelance</SelectItem>
                            <SelectItem value="Probation">Probation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="join_date">Tanggal Bergabung *</Label>
                        <Input
                          id="join_date"
                          type="date"
                          value={formData.join_date}
                          onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="basic_salary">Gaji Pokok</Label>
                        <Input
                          id="basic_salary"
                          type="number"
                          value={formData.basic_salary}
                          onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="inactive">Tidak Aktif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Data Bank */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-700 border-b pb-2">Data Bank</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bank_name">Nama Bank</Label>
                        <Select
                          value={formData.bank_name}
                          onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih bank" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BCA">BCA</SelectItem>
                            <SelectItem value="BNI">BNI</SelectItem>
                            <SelectItem value="BRI">BRI</SelectItem>
                            <SelectItem value="Mandiri">Mandiri</SelectItem>
                            <SelectItem value="CIMB Niaga">CIMB Niaga</SelectItem>
                            <SelectItem value="Permata">Permata</SelectItem>
                            <SelectItem value="Danamon">Danamon</SelectItem>
                            <SelectItem value="BSI">BSI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_account_number">No. Rekening</Label>
                        <Input
                          id="bank_account_number"
                          value={formData.bank_account_number}
                          onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_account_holder">Nama Pemilik Rekening</Label>
                        <Input
                          id="bank_account_holder"
                          value={formData.bank_account_holder}
                          onChange={(e) => setFormData({ ...formData, bank_account_holder: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Kontak Darurat */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-700 border-b pb-2">Kontak Darurat</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_name">Nama</Label>
                        <Input
                          id="emergency_contact_name"
                          value={formData.emergency_contact_name}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_relation">Hubungan</Label>
                        <Input
                          id="emergency_contact_relation"
                          value={formData.emergency_contact_relation}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                          placeholder="Contoh: Orang Tua, Suami/Istri"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_phone">No. Telepon</Label>
                        <Input
                          id="emergency_contact_phone"
                          value={formData.emergency_contact_phone}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_address">Alamat</Label>
                        <Input
                          id="emergency_contact_address"
                          value={formData.emergency_contact_address}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_address: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pendidikan */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-700 border-b pb-2">Pendidikan Terakhir</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="last_education">Jenjang Pendidikan</Label>
                        <Select
                          value={formData.last_education}
                          onValueChange={(value) => setFormData({ ...formData, last_education: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenjang" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SD">SD</SelectItem>
                            <SelectItem value="SMP">SMP</SelectItem>
                            <SelectItem value="SMA/SMK">SMA/SMK</SelectItem>
                            <SelectItem value="D1">D1</SelectItem>
                            <SelectItem value="D2">D2</SelectItem>
                            <SelectItem value="D3">D3</SelectItem>
                            <SelectItem value="D4">D4</SelectItem>
                            <SelectItem value="S1">S1</SelectItem>
                            <SelectItem value="S2">S2</SelectItem>
                            <SelectItem value="S3">S3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="institution_name">Nama Institusi</Label>
                        <Input
                          id="institution_name"
                          value={formData.institution_name}
                          onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="major">Jurusan</Label>
                        <Input
                          id="major"
                          value={formData.major}
                          onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="graduation_year">Tahun Lulus</Label>
                        <Input
                          id="graduation_year"
                          type="number"
                          value={formData.graduation_year}
                          onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                          placeholder="2020"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Catatan */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-700 border-b pb-2">Catatan</h3>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Catatan Tambahan</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {loading ? "Menyimpan..." : "Simpan Karyawan"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {summaryData.total}
                  </p>
                  <p className="text-xs text-slate-500">Total Karyawan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {summaryData.active}
                  </p>
                  <p className="text-xs text-slate-500">Aktif</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <UserX className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-rose-600">
                    {summaryData.inactive}
                  </p>
                  <p className="text-xs text-slate-500">Tidak Aktif</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {summaryData.tetap}
                  </p>
                  <p className="text-xs text-slate-500">Karyawan Tetap</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {summaryData.kontrak}
                  </p>
                  <p className="text-xs text-slate-500">Karyawan Kontrak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari nama, kode, atau email karyawan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                    <SelectItem value="terminated">Diberhentikan</SelectItem>
                    <SelectItem value="resigned">Resign</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Departemen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Departemen</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={employmentStatusFilter} onValueChange={setEmploymentStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Briefcase className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Kepegawaian" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Tipe</SelectItem>
                    <SelectItem value="Tetap">Tetap</SelectItem>
                    <SelectItem value="Kontrak">Kontrak</SelectItem>
                    <SelectItem value="Magang">Magang</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                    <SelectItem value="Probation">Probation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-800">
              Daftar Karyawan
            </CardTitle>
            <CardDescription>
              Menampilkan {filteredEmployees.length} dari {employees.length} karyawan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">Kode</TableHead>
                    <TableHead className="font-semibold">Nama</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Telepon</TableHead>
                    <TableHead className="font-semibold">Departemen</TableHead>
                    <TableHead className="font-semibold">Jabatan</TableHead>
                    <TableHead className="font-semibold">Tipe</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          <span className="text-slate-500">Memuat data...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-10 w-10 text-slate-300" />
                          <span className="text-slate-500">Tidak ada data karyawan</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <TableRow key={employee.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium text-blue-600">
                          {employee.employee_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{employee.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span className="text-sm">{employee.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {employee.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-slate-400" />
                              <span className="text-sm">{employee.phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {employee.departments?.department_name || (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {employee.positions?.position_name || (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getEmploymentStatusBadge(employee.employment_status)}
                        </TableCell>
                        <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
