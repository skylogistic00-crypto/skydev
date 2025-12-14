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
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { differenceInDays } from "date-fns";

interface Employee {
  id: string;
  employee_number: string;
  full_name: string;
  salary: number;
}

interface Contract {
  id: string;
  employee_id: string;
  contract_number: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  salary: number;
  status: string;
  employees?: { full_name: string; employee_number: string };
}

export default function ContractManagement({
  onUpdate,
}: {
  onUpdate?: () => void;
}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    employee_id: "",
    contract_type: "PKWT",
    start_date: "",
    end_date: "",
    salary: "",
    terms: "",
  });

  useEffect(() => {
    loadEmployees();
    loadContracts();
    checkExpiringContracts();
  }, []);

  const loadEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, employee_number, full_name, salary")
      .eq("status", "active")
      .order("full_name");
    setEmployees(data || []);
  };

  const loadContracts = async () => {
    const { data } = await supabase
      .from("employment_contracts")
      .select(
        `
        *,
        employees(full_name, employee_number)
      `,
      )
      .order("created_at", { ascending: false });
    setContracts(data || []);
  };

  const checkExpiringContracts = async () => {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    const { data } = await supabase
      .from("employment_contracts")
      .select(
        `
        *,
        employees(full_name, user_id)
      `,
      )
      .eq("status", "active")
      .lte("end_date", thirtyDaysLater.toISOString().split("T")[0])
      .gte("end_date", today.toISOString().split("T")[0]);

    if (data && data.length > 0) {
      for (const contract of data) {
        await supabase.from("hrd_notifications").insert({
          user_id: contract.employees?.user_id,
          title: "Kontrak Akan Berakhir",
          message: `Kontrak kerja ${contract.employees?.full_name} akan berakhir pada ${new Date(contract.end_date).toLocaleDateString("id-ID")}`,
          type: "contract_expiry",
          related_id: contract.id,
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Generate contract number
      const contractNumber = `CTR-${Date.now()}`;

      // Call edge function for INSERT operation to database
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-contract",
        {
          body: {
            action: "insert",
            data: {
              employee_id: formData.employee_id,
              contract_number: contractNumber,
              contract_type: formData.contract_type,
              start_date: formData.start_date,
              end_date: formData.end_date || null,
              salary: parseFloat(formData.salary),
              notes: formData.terms,
              status: "active",
            },
          },
        },
      );

      if (error) throw error;
      toast({ title: "Berhasil", description: "Kontrak berhasil dibuat" });
      loadContracts();
      onUpdate?.();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      // Call edge function for UPDATE operation to database
      const { data: responseData, error } = await supabase.functions.invoke(
        "supabase-functions-hrd-save-contract",
        {
          body: {
            action: status === "terminated" ? "terminate" : "update",
            data: { status },
            id,
          },
        },
      );

      if (error) throw error;
      toast({
        title: "Berhasil",
        description: `Status kontrak diupdate menjadi ${status}`,
      });
      loadContracts();
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      contract_type: "PKWT",
      start_date: "",
      end_date: "",
      salary: "",
      terms: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { variant: "default", label: "Aktif" },
      expired: { variant: "secondary", label: "Kadaluarsa" },
      terminated: { variant: "destructive", label: "Diakhiri" },
    };
    const config = variants[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDaysRemaining = (endDate: string) => {
    if (!endDate) return null;
    const days = differenceInDays(new Date(endDate), new Date());
    if (days < 0) return <span className="text-red-600">Sudah berakhir</span>;
    if (days <= 30)
      return <span className="text-orange-600">{days} hari lagi</span>;
    return <span className="text-gray-600">{days} hari lagi</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Kontrak Kerja</h2>
          <p className="text-gray-600">Kelola kontrak kerja karyawan</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Buat Kontrak
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Buat Kontrak Kerja Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Karyawan *</Label>
                  <Select
                    required
                    value={formData.employee_id}
                    onValueChange={(value) => {
                      const emp = employees.find((e) => e.id === value);
                      setFormData({
                        ...formData,
                        employee_id: value,
                        salary: emp?.salary?.toString() || "",
                      });
                    }}
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
                  <Label>Jenis Kontrak *</Label>
                  <Select
                    value={formData.contract_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, contract_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PKWT">PKWT (Kontrak)</SelectItem>
                      <SelectItem value="PKWTT">PKWTT (Tetap)</SelectItem>
                      <SelectItem value="Magang">Magang</SelectItem>
                      <SelectItem value="Freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Mulai *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Tanggal Berakhir {formData.contract_type !== "PKWTT" && "*"}
                  </Label>
                  <Input
                    type="date"
                    required={formData.contract_type !== "PKWTT"}
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    disabled={formData.contract_type === "PKWTT"}
                  />
                  {formData.contract_type === "PKWTT" && (
                    <p className="text-xs text-gray-500">
                      PKWTT tidak memiliki tanggal berakhir
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Gaji *</Label>
                  <Input
                    type="number"
                    required
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData({ ...formData, salary: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Ketentuan Kontrak</Label>
                  <Textarea
                    value={formData.terms}
                    onChange={(e) =>
                      setFormData({ ...formData, terms: e.target.value })
                    }
                    placeholder="Masukkan ketentuan dan syarat kontrak..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Simpan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Daftar Kontrak Kerja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>No. Kontrak</TableHead>
                <TableHead>Karyawan</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Sisa Waktu</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    {contract.contract_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {contract.employees?.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contract.employees?.employee_number}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{contract.contract_type}</TableCell>
                  <TableCell>
                    {new Date(contract.start_date).toLocaleDateString("id-ID")}
                    {contract.end_date &&
                      ` - ${new Date(contract.end_date).toLocaleDateString("id-ID")}`}
                  </TableCell>
                  <TableCell>
                    {contract.end_date
                      ? getDaysRemaining(contract.end_date)
                      : "Tidak terbatas"}
                  </TableCell>
                  <TableCell>{getStatusBadge(contract.status)}</TableCell>
                  <TableCell className="text-right">
                    {contract.status === "active" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handleStatusChange(contract.id, "terminated")
                        }
                      >
                        Akhiri
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
