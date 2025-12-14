import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Employee {
  id: string;
  employee_number: string;
  full_name: string;
  email: string;
  phone: string;
  birth_date: string;
  gender: string;
  address: string;
  department_id: string;
  position_id: string;
  employment_status: string;
  join_date: string;
  salary: number;
  bank_account: string;
  bank_name: string;
  status: string;
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

export default function EmployeeManagement({ onUpdate }: { onUpdate?: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    birth_date: "",
    gender: "Laki-laki",
    address: "",
    department_id: "",
    position_id: "",
    employment_status: "Tetap",
    join_date: "",
    salary: "",
    bank_account: "",
    bank_name: "",
  });

  useEffect(() => {
    loadEmployees();
    loadDepartments();
    loadPositions();
  }, []);

  useEffect(() => {
    if (formData.department_id) {
      setFilteredPositions(positions.filter(p => p.department_id === formData.department_id));
    } else {
      setFilteredPositions(positions);
    }
  }, [formData.department_id, positions]);

  const loadEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select(`
        *,
        departments(department_name),
        positions(position_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setEmployees(data || []);
    }
  };

  const loadDepartments = async () => {
    const { data } = await supabase.from("departments").select("*").order("department_name");
    setDepartments(data || []);
  };

  const loadPositions = async () => {
    const { data } = await supabase.from("positions").select("*").order("position_name");
    setPositions(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingEmployee) {
        const { error } = await supabase
          .from("employees")
          .update({
            ...formData,
            salary: parseFloat(formData.salary),
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingEmployee.id);

        if (error) throw error;
        toast({ title: "Berhasil", description: "Data karyawan berhasil diupdate" });
      } else {
        const { data: empNumber } = await supabase.rpc("generate_employee_number");
        
        const { error } = await supabase.from("employees").insert({
          employee_number: empNumber,
          ...formData,
          salary: parseFloat(formData.salary),
          status: "active",
        });

        if (error) throw error;
        toast({ title: "Berhasil", description: "Karyawan baru berhasil ditambahkan" });
      }

      loadEmployees();
      onUpdate?.();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      full_name: employee.full_name,
      email: employee.email,
      phone: employee.phone || "",
      birth_date: employee.birth_date || "",
      gender: employee.gender || "Laki-laki",
      address: employee.address || "",
      department_id: employee.department_id || "",
      position_id: employee.position_id || "",
      employment_status: employee.employment_status || "Tetap",
      join_date: employee.join_date,
      salary: employee.salary?.toString() || "",
      bank_account: employee.bank_account || "",
      bank_name: employee.bank_name || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus karyawan ini?")) return;

    const { error } = await supabase.from("employees").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: "Karyawan berhasil dihapus" });
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
      gender: "Laki-laki",
      address: "",
      department_id: "",
      position_id: "",
      employment_status: "Tetap",
      join_date: "",
      salary: "",
      bank_account: "",
      bank_name: "",
    });
    setEditingEmployee(null);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari karyawan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Tambah Karyawan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? "Edit Karyawan" : "Tambah Karyawan Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Lengkap *</Label>
                  <Input
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>No. Telepon</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Lahir</Label>
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Jenis Kelamin</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
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
                  <Label>Departemen *</Label>
                  <Select 
                    required
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
                  <Label>Jabatan *</Label>
                  <Select 
                    required
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
                  <Label>Status Kepegawaian *</Label>
                  <Select value={formData.employment_status} onValueChange={(value) => setFormData({ ...formData, employment_status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tetap">Tetap</SelectItem>
                      <SelectItem value="Kontrak">Kontrak</SelectItem>
                      <SelectItem value="Magang">Magang</SelectItem>
                      <SelectItem value="Freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Bergabung *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.join_date}
                    onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gaji Pokok *</Label>
                  <Input
                    type="number"
                    required
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nama Bank</Label>
                  <Input
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>No. Rekening</Label>
                  <Input
                    value={formData.bank_account}
                    onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Alamat</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingEmployee ? "Update" : "Simpan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>No. Karyawan</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Departemen</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.employee_number}</TableCell>
                <TableCell>{employee.full_name}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.departments?.department_name}</TableCell>
                <TableCell>{employee.positions?.position_name}</TableCell>
                <TableCell>
                  <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                    {employee.status === "active" ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(employee)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(employee.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
