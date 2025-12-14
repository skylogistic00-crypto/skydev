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
  Plus,
  Edit,
  Trash2,
  Search,
  UserPlus,
  Upload,
  FileText,
  Download,
  Eye,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface Employee {
  id: string;
  employee_number: string;
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
  ktp_document_url: string;
  npwp_number: string;
  npwp_file_url: string;
  bpjs_kesehatan: string;
  bpjs_ketenagakerjaan: string;
  department_id: string;
  position_id: string;
  employment_status: string;
  join_date: string;
  basic_salary: number;
  bank_name: string;
  ethnicity: string;
  bank_account_number: string;
  bank_account_holder: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
  last_education: string;
  institution_name: string;
  major: string;
  graduation_year: number;
  selfie_url: string;
  cv_file_url: string;
  contract_file_url: string;
  status: string;
  notes: string;
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

export default function EmployeeManagementAdvanced({
  onUpdate,
}: {
  onUpdate?: () => void;
}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEmploymentStatus, setFilterEmploymentStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: "",
    ethnicity: "",
    email: "",
    phone: "",
    birth_date: "",
    birth_place: "",
    gender: "Laki-laki",
    religion: "",
    marital_status: "Belum Menikah",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    ktp_number: "",
    ktp_document_url: "",
    npwp_number: "",
    bpjs_kesehatan: "",
    bpjs_ketenagakerjaan: "",
    department_id: "",
    position_id: "",
    employment_status: "Tetap",
    join_date: "",
    basic_salary: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_holder: "",
    emergency_contact_name: "",
    emergency_contact_relation: "",
    emergency_contact_phone: "",
    last_education: "",
    institution_name: "",
    major: "",
    graduation_year: "",
    notes: "",
  });

  const [files, setFiles] = useState({
    photo: null as File | null,
    ktp: null as File | null,
    npwp: null as File | null,
    cv: null as File | null,
    contract: null as File | null,
  });

  useEffect(() => {
    loadEmployees();
    loadDepartments();
    loadPositions();
  }, []);

  useEffect(() => {
    if (formData.department_id) {
      setFilteredPositions(
        positions.filter((p) => p.department_id === formData.department_id),
      );
    } else {
      setFilteredPositions(positions);
    }
  }, [formData.department_id, positions]);

  const loadEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select(
        `
        *,
        departments(department_name),
        positions(position_name)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setEmployees(data || []);
    }
  };

  const loadDepartments = async () => {
    const { data } = await supabase
      .from("departments")
      .select("*")
      .order("department_name");
    setDepartments(data || []);
  };

  const loadPositions = async () => {
    const { data } = await supabase
      .from("positions")
      .select("*")
      .order("position_name");
    setPositions(data || []);
  };

  const uploadFile = async (file: File, path: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from("employee-documents")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("employee-documents").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let selfieUrl = editingEmployee?.selfie_url || "";
      let ktpUrl = editingEmployee?.ktp_document_url || "";
      let npwpUrl = editingEmployee?.npwp_file_url || "";
      let cvUrl = editingEmployee?.cv_file_url || "";
      let contractUrl = editingEmployee?.contract_file_url || "";

      // Upload files if selected
      if (files.photo) {
        selfieUrl = await uploadFile(files.photo, "selfie");
      }
      if (files.ktp) {
        ktpUrl = await uploadFile(files.ktp, "ktp");
      }
      if (files.npwp) {
        npwpUrl = await uploadFile(files.npwp, "npwp");
      }
      if (files.cv) {
        cvUrl = await uploadFile(files.cv, "cv");
      }
      if (files.contract) {
        contractUrl = await uploadFile(files.contract, "contracts");
      }

      const employeeData = {
        ...formData,
        basic_salary: parseFloat(formData.basic_salary) || 0,
        graduation_year: formData.graduation_year
          ? parseInt(formData.graduation_year)
          : null,
        selfie_url: selfieUrl,
        ktp_document_url: ktpUrl,
        npwp_file_url: npwpUrl,
        cv_file_url: cvUrl,
        contract_file_url: contractUrl,
        updated_at: new Date().toISOString(),
      };

      if (editingEmployee) {
        const { error } = await supabase
          .from("employees")
          .update(employeeData)
          .eq("id", editingEmployee.id);

        if (error) throw error;
        toast({
          title: "Berhasil",
          description: "Data karyawan berhasil diupdate",
        });
      } else {
        const { data: empNumber } = await supabase.rpc(
          "generate_employee_number",
        );

        const { error } = await supabase.from("employees").insert({
          employee_number: empNumber,
          ...employeeData,
          status: "active",
        });

        if (error) throw error;
        toast({
          title: "Berhasil",
          description: "Karyawan baru berhasil ditambahkan",
        });
      }

      loadEmployees();
      onUpdate?.();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      full_name: employee.full_name,
      ethnicity: employee.ethnicity,
      email: employee.email,
      phone: employee.phone || "",
      birth_date: employee.birth_date || "",
      birth_place: employee.birth_place || "",
      gender: employee.gender || "Laki-laki",
      religion: employee.religion || "",
      marital_status: employee.marital_status || "Belum Menikah",
      address: employee.address || "",
      city: employee.city || "",
      province: employee.province || "",
      postal_code: employee.postal_code || "",
      ktp_number: employee.ktp_number || "",
      ktp_document_url: employee.ktp_document_url || "",
      npwp_number: employee.npwp_number || "",
      bpjs_kesehatan: employee.bpjs_kesehatan || "",
      bpjs_ketenagakerjaan: employee.bpjs_ketenagakerjaan || "",
      department_id: employee.department_id || "",
      position_id: employee.position_id || "",
      employment_status: employee.employment_status || "Tetap",
      join_date: employee.join_date,
      basic_salary: employee.basic_salary?.toString() || "",
      bank_name: employee.bank_name || "",
      bank_account_number: employee.bank_account_number || "",
      bank_account_holder: employee.bank_account_holder || "",
      emergency_contact_name: employee.emergency_contact_name || "",
      emergency_contact_relation: employee.emergency_contact_relation || "",
      emergency_contact_phone: employee.emergency_contact_phone || "",
      last_education: employee.last_education || "",
      institution_name: employee.institution_name || "",
      major: employee.major || "",
      graduation_year: employee.graduation_year?.toString() || "",
      notes: employee.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus karyawan ini?")) return;

    const { error } = await supabase.from("employees").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Berhasil", description: "Karyawan berhasil dihapus" });
      loadEmployees();
      onUpdate?.();
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase
      .from("employees")
      .update({ status, updated_at: new Date().toISOString() })
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
        description: `Status karyawan diubah menjadi ${status}`,
      });
      loadEmployees();
      onUpdate?.();
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      birth_date: "",
      birth_place: "",
      gender: "Laki-laki",
      religion: "",
      marital_status: "Belum Menikah",
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
      employment_status: "Tetap",
      join_date: "",
      basic_salary: "",
      bank_name: "",
      bank_account_number: "",
      bank_account_holder: "",
      emergency_contact_name: "",
      emergency_contact_relation: "",
      emergency_contact_phone: "",
      last_education: "",
      institution_name: "",
      major: "",
      graduation_year: "",
      notes: "",
    });
    setFiles({
      selfie: null,
      ktp: null,
      npwp: null,
      cv: null,
      contract: null,
    });
    setEditingEmployee(null);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      filterDepartment === "all" || emp.department_id === filterDepartment;
    const matchesStatus = filterStatus === "all" || emp.status === filterStatus;
    const matchesEmploymentStatus =
      filterEmploymentStatus === "all" ||
      emp.employment_status === filterEmploymentStatus;

    return (
      matchesSearch &&
      matchesDepartment &&
      matchesStatus &&
      matchesEmploymentStatus
    );
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { variant: "default", label: "Aktif", color: "bg-green-500" },
      inactive: {
        variant: "secondary",
        label: "Tidak Aktif",
        color: "bg-gray-500",
      },
      terminated: {
        variant: "destructive",
        label: "Diberhentikan",
        color: "bg-red-500",
      },
      resigned: { variant: "outline", label: "Resign", color: "bg-orange-500" },
    };
    const config = variants[status] || {
      variant: "default",
      label: status,
      color: "bg-gray-500",
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari karyawan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filterDepartment}
              onValueChange={setFilterDepartment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua Departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Departemen</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.department_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterEmploymentStatus}
              onValueChange={setFilterEmploymentStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status Kepegawaian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Tetap">Tetap</SelectItem>
                <SelectItem value="Kontrak">Kontrak</SelectItem>
                <SelectItem value="Magang">Magang</SelectItem>
                <SelectItem value="Freelance">Freelance</SelectItem>
                <SelectItem value="Probation">Probation</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status Karyawan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
                <SelectItem value="terminated">Diberhentikan</SelectItem>
                <SelectItem value="resigned">Resign</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Add Employee Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Karyawan</h2>
          <p className="text-gray-600">
            Total: {filteredEmployees.length} karyawan
          </p>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Tambah Karyawan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Edit Karyawan" : "Tambah Karyawan Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="personal">Data Pribadi</TabsTrigger>
                  <TabsTrigger value="employment">Kepegawaian</TabsTrigger>
                  <TabsTrigger value="documents">Dokumen</TabsTrigger>
                  <TabsTrigger value="education">Pendidikan</TabsTrigger>
                  <TabsTrigger value="emergency">Kontak Darurat</TabsTrigger>
                </TabsList>

                {/* Personal Data */}
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Lengkap *</Label>
                      <Input
                        required
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            full_name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>No. Telepon</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Jenis Kelamin</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) =>
                          setFormData({ ...formData, gender: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                          <SelectItem value="Perempuan">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tempat Lahir</Label>
                      <Input
                        value={formData.birth_place}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            birth_place: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tanggal Lahir</Label>
                      <Input
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            birth_date: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Agama</Label>
                      <Select
                        value={formData.religion}
                        onValueChange={(value) =>
                          setFormData({ ...formData, religion: value })
                        }
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
                      <Label>Ethnicity</Label>
                      <Select
                        value={formData.ethnicity}
                        onValueChange={(value) =>
                          setFormData({ ...formData, ethnicity: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Suku" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sunda">Sunda</SelectItem>
                          <SelectItem value="Jawa">Jawa</SelectItem>
                          <SelectItem value="Batak">Batak</SelectItem>
                          <SelectItem value="Ambon">Ambon</SelectItem>
                          <SelectItem value="Madura">Madura</SelectItem>
                          <SelectItem value="Betawi">Betawi</SelectItem>
                          <SelectItem value="Melayu">Melayu</SelectItem>
                          <SelectItem value="Bugis">Bugis</SelectItem>
                          <SelectItem value="Bali">Bali</SelectItem>
                          <SelectItem value="Dayak">Dayak</SelectItem>
                          <SelectItem value="Tionghoa">Tionghoa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Status Pernikahan</Label>
                      <Select
                        value={formData.marital_status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, marital_status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Belum Menikah">
                            Belum Menikah
                          </SelectItem>
                          <SelectItem value="Menikah">Menikah</SelectItem>
                          <SelectItem value="Cerai">Cerai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Alamat</Label>
                      <Textarea
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Kota</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Provinsi</Label>
                      <Input
                        value={formData.province}
                        onChange={(e) =>
                          setFormData({ ...formData, province: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Kode Pos</Label>
                      <Input
                        value={formData.postal_code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            postal_code: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Foto Profil</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setFiles({
                            ...files,
                            photo: e.target.files?.[0] || null,
                          })
                        }
                      />
                      {editingEmployee?.selfie_url && (
                        <a
                          href={editingEmployee.selfie_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" /> Lihat foto saat ini
                        </a>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Employment Data */}
                <TabsContent value="employment" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Departemen *</Label>
                      <Select
                        required
                        value={formData.department_id}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            department_id: value,
                            position_id: "",
                          })
                        }
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
                      <Label>Jabatan *</Label>
                      <Select
                        required
                        value={formData.position_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, position_id: value })
                        }
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
                      <Label>Status Kepegawaian *</Label>
                      <Select
                        value={formData.employment_status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, employment_status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                      <Label>Tanggal Bergabung *</Label>
                      <Input
                        type="date"
                        required
                        value={formData.join_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            join_date: e.target.value,
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

                    <div className="space-y-2">
                      <Label>Nama Bank</Label>
                      <Input
                        value={formData.bank_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bank_name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>No. Rekening</Label>
                      <Input
                        value={formData.bank_account_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bank_account_number: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Nama Pemilik Rekening</Label>
                      <Input
                        value={formData.bank_account_holder}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bank_account_holder: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Documents */}
                <TabsContent value="documents" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>No. KTP</Label>
                      <Input
                        value={formData.ktp_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ktp_number: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Upload KTP</Label>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          setFiles({
                            ...files,
                            ktp: e.target.files?.[0] || null,
                          })
                        }
                      />
                      {editingEmployee?.ktp_document_url && (
                        <a
                          href={editingEmployee.ktp_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" /> Download KTP
                        </a>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>No. NPWP</Label>
                      <Input
                        value={formData.npwp_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            npwp_number: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Upload NPWP</Label>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          setFiles({
                            ...files,
                            npwp: e.target.files?.[0] || null,
                          })
                        }
                      />
                      {editingEmployee?.npwp_file_url && (
                        <a
                          href={editingEmployee.npwp_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" /> Download NPWP
                        </a>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>No. BPJS Kesehatan</Label>
                      <Input
                        value={formData.bpjs_kesehatan}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bpjs_kesehatan: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>No. BPJS Ketenagakerjaan</Label>
                      <Input
                        value={formData.bpjs_ketenagakerjaan}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bpjs_ketenagakerjaan: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Upload CV</Label>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) =>
                          setFiles({
                            ...files,
                            cv: e.target.files?.[0] || null,
                          })
                        }
                      />
                      {editingEmployee?.cv_file_url && (
                        <a
                          href={editingEmployee.cv_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" /> Download CV
                        </a>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Upload Kontrak</Label>
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) =>
                          setFiles({
                            ...files,
                            contract: e.target.files?.[0] || null,
                          })
                        }
                      />
                      {editingEmployee?.contract_file_url && (
                        <a
                          href={editingEmployee.contract_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" /> Download Kontrak
                        </a>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Education */}
                <TabsContent value="education" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pendidikan Terakhir</Label>
                      <Select
                        value={formData.last_education}
                        onValueChange={(value) =>
                          setFormData({ ...formData, last_education: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pendidikan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SD">SD</SelectItem>
                          <SelectItem value="SMP">SMP</SelectItem>
                          <SelectItem value="SMA/SMK">SMA/SMK</SelectItem>
                          <SelectItem value="D1">D1</SelectItem>
                          <SelectItem value="D2">D2</SelectItem>
                          <SelectItem value="D3">D3</SelectItem>
                          <SelectItem value="S1">S1</SelectItem>
                          <SelectItem value="S2">S2</SelectItem>
                          <SelectItem value="S3">S3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Nama Institusi</Label>
                      <Input
                        value={formData.institution_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            institution_name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Jurusan</Label>
                      <Input
                        value={formData.major}
                        onChange={(e) =>
                          setFormData({ ...formData, major: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tahun Lulus</Label>
                      <Input
                        type="number"
                        value={formData.graduation_year}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            graduation_year: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Emergency Contact */}
                <TabsContent value="emergency" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Kontak Darurat</Label>
                      <Input
                        value={formData.emergency_contact_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergency_contact_name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Hubungan</Label>
                      <Input
                        value={formData.emergency_contact_relation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergency_contact_relation: e.target.value,
                          })
                        }
                        placeholder="Contoh: Orang Tua, Saudara, Pasangan"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>No. Telepon Darurat</Label>
                      <Input
                        value={formData.emergency_contact_phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergency_contact_phone: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Catatan</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        placeholder="Catatan tambahan tentang karyawan..."
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={uploading}
                >
                  {uploading
                    ? "Menyimpan..."
                    : editingEmployee
                      ? "Update"
                      : "Simpan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>No. Karyawan</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Status Kerja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {employee.employee_code}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {employee.selfie_url && (
                          <img
                            src={employee.selfie_url}
                            alt={employee.full_name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        )}
                        {employee.full_name}
                      </div>
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      {employee.departments?.department_name}
                    </TableCell>
                    <TableCell>{employee.positions?.position_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {employee.employment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {employee.status === "active" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              handleStatusChange(employee.id, "inactive")
                            }
                          >
                            Nonaktifkan
                          </Button>
                        )}
                        {employee.status === "inactive" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              handleStatusChange(employee.id, "active")
                            }
                          >
                            Aktifkan
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(employee.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
}
