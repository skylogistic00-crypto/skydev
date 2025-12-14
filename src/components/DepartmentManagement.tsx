import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Briefcase } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface Department {
  id: string;
  department_name: string;
  description: string;
}

interface Position {
  id: string;
  position_name: string;
  department_id: string;
  level: string;
  description: string;
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
  const [isPosDialogOpen, setIsPosDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const { toast } = useToast();

  const [deptForm, setDeptForm] = useState({
    department_name: "",
    description: "",
  });

  const [posForm, setPosForm] = useState({
    position_name: "",
    department_id: "",
    level: "",
    description: "",
  });

  useEffect(() => {
    loadDepartments();
    loadPositions();
  }, []);

  const loadDepartments = async () => {
    const { data } = await supabase.from("departments").select("*").order("department_name");
    setDepartments(data || []);
  };

  const loadPositions = async () => {
    const { data } = await supabase.from("positions").select("*").order("position_name");
    setPositions(data || []);
  };

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDept) {
        const { error } = await supabase
          .from("departments")
          .update(deptForm)
          .eq("id", editingDept.id);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Departemen berhasil diupdate" });
      } else {
        const { error } = await supabase.from("departments").insert(deptForm);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Departemen berhasil ditambahkan" });
      }
      loadDepartments();
      setIsDeptDialogOpen(false);
      resetDeptForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handlePosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPos) {
        const { error } = await supabase
          .from("positions")
          .update(posForm)
          .eq("id", editingPos.id);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Jabatan berhasil diupdate" });
      } else {
        const { error } = await supabase.from("positions").insert(posForm);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Jabatan berhasil ditambahkan" });
      }
      loadPositions();
      setIsPosDialogOpen(false);
      resetPosForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm("Yakin ingin menghapus departemen ini?")) return;
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: "Departemen berhasil dihapus" });
      loadDepartments();
    }
  };

  const handleDeletePos = async (id: string) => {
    if (!confirm("Yakin ingin menghapus jabatan ini?")) return;
    const { error } = await supabase.from("positions").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: "Jabatan berhasil dihapus" });
      loadPositions();
    }
  };

  const resetDeptForm = () => {
    setDeptForm({ department_name: "", description: "" });
    setEditingDept(null);
  };

  const resetPosForm = () => {
    setPosForm({ position_name: "", department_id: "", level: "", description: "" });
    setEditingPos(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Departments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Departemen
          </CardTitle>
          <Dialog open={isDeptDialogOpen} onOpenChange={(open) => {
            setIsDeptDialogOpen(open);
            if (!open) resetDeptForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingDept ? "Edit Departemen" : "Tambah Departemen"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleDeptSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Departemen *</Label>
                  <Input
                    required
                    value={deptForm.department_name}
                    onChange={(e) => setDeptForm({ ...deptForm, department_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <Textarea
                    value={deptForm.description}
                    onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDeptDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Simpan
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Departemen</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{dept.department_name}</div>
                      {dept.description && (
                        <div className="text-sm text-gray-500">{dept.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingDept(dept);
                          setDeptForm({
                            department_name: dept.department_name,
                            description: dept.description || "",
                          });
                          setIsDeptDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteDept(dept.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Positions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Jabatan
          </CardTitle>
          <Dialog open={isPosDialogOpen} onOpenChange={(open) => {
            setIsPosDialogOpen(open);
            if (!open) resetPosForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPos ? "Edit Jabatan" : "Tambah Jabatan"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePosSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Jabatan *</Label>
                  <Input
                    required
                    value={posForm.position_name}
                    onChange={(e) => setPosForm({ ...posForm, position_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Departemen *</Label>
                  <select
                    required
                    className="w-full border rounded-md p-2"
                    value={posForm.department_id}
                    onChange={(e) => setPosForm({ ...posForm, department_id: e.target.value })}
                  >
                    <option value="">Pilih Departemen</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Input
                    value={posForm.level}
                    onChange={(e) => setPosForm({ ...posForm, level: e.target.value })}
                    placeholder="Contoh: Staff, Supervisor, Manager"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <Textarea
                    value={posForm.description}
                    onChange={(e) => setPosForm({ ...posForm, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsPosDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Simpan
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Jabatan</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((pos) => {
                const dept = departments.find(d => d.id === pos.department_id);
                return (
                  <TableRow key={pos.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{pos.position_name}</div>
                        {pos.level && (
                          <div className="text-sm text-gray-500">{pos.level}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{dept?.department_name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingPos(pos);
                            setPosForm({
                              position_name: pos.position_name,
                              department_id: pos.department_id,
                              level: pos.level || "",
                              description: pos.description || "",
                            });
                            setIsPosDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeletePos(pos.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
