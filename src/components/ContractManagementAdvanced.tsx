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
import { FileText, Plus, Download, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Employee {
  id: string;
  employee_number: string;
  full_name: string;
}

interface Contract {
  id: string;
  employee_id: string;
  contract_number: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  basic_salary: number;
  allowances: any;
  benefits: string;
  terms: string;
  contract_file_url: string;
  status: string;
  employees?: { full_name: string; employee_number: string };
}

export default function ContractManagementAdvanced({ onUpdate }: { onUpdate?: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [expiringContracts, setExpiringContracts] = useState<Contract[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    employee_id: "",
    contract_type: "PKWT",
    start_date: "",
    end_date: "",
    basic_salary: "",
    transport_allowance: "0",
    meal_allowance: "0",
    position_allowance: "0",
    benefits: "",
    terms: "",
  });

  const [contractFile, setContractFile] = useState<File | null>(null);

  useEffect(() => {
    loadEmployees();
    loadContracts();
    checkExpiringContracts();
  }, []);

  const loadEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, employee_number, full_name")
      .eq("status", "active")
      .order("full_name");
    setEmployees(data || []);
  };

  const loadContracts = async () => {
    const { data } = await supabase
      .from("employment_contracts")
      .select(`
        *,
        employees(full_name, employee_number)
      `)
      .order("created_at", { ascending: false });
    setContracts(data || []);
  };

  const checkExpiringContracts = async () => {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    const { data } = await supabase
      .from("employment_contracts")
      .select(`
        *,
        employees(full_name, employee_number)
      `)
      .eq("status", "active")
      .gte("end_date", today.toISOString().split("T")[0])
      .lte("end_date", thirtyDaysLater.toISOString().split("T")[0]);

    setExpiringContracts(data || []);
  };

  const uploadContractFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `contracts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('employee-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('employee-documents')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingFile(true);

    try {
      let contractFileUrl = "";
      if (contractFile) {
        contractFileUrl = await uploadContractFile(contractFile);
      }

      const { data: contractNumber } = await supabase.rpc("generate_contract_number");

      const allowances = {
        transport: parseFloat(formData.transport_allowance) || 0,
        meal: parseFloat(formData.meal_allowance) || 0,
        position: parseFloat(formData.position_allowance) || 0,
      };

      const { error } = await supabase.from("employment_contracts").insert({
        contract_number: contractNumber,
        employee_id: formData.employee_id,
        contract_type: formData.contract_type,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        basic_salary: parseFloat(formData.basic_salary),
        allowances: allowances,
        benefits: formData.benefits,
        terms: formData.terms,
        contract_file_url: contractFileUrl,
        status: "active",
      });

      if (error) throw error;
      toast({ title: "Berhasil", description: "Kontrak berhasil dibuat" });
      loadContracts();
      checkExpiringContracts();
      onUpdate?.();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase
      .from("employment_contracts")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: `Status kontrak diubah menjadi ${status}` });
      loadContracts();
      checkExpiringContracts();
      onUpdate?.();
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      contract_type: "PKWT",
      start_date: "",
      end_date: "",
      basic_salary: "",
      transport_allowance: "0",
      meal_allowance: "0",
      position_allowance: "0",
      benefits: "",
      terms: "",
    });
    setContractFile(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { variant: "default", label: "Aktif", color: "bg-green-500" },
      expired: { variant: "destructive", label: "Kadaluarsa", color: "bg-red-500" },
      terminated: { variant: "secondary", label: "Diberhentikan", color: "bg-gray-500" },
      renewed: { variant: "outline", label: "Diperpanjang", color: "bg-blue-500" },
    };
    const config = variants[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    return differenceInDays(end, today);
  };

  return (
    <div className="space-y-6">
      {/* Expiring Contracts Alert */}
      {expiringContracts.length > 0 && (
        <Card className="border-orange-500 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Kontrak Akan Berakhir ({expiringContracts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringContracts.map((contract) => {
                const daysRemaining = getDaysRemaining(contract.end_date);
                return (
                  <div key={contract.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                    <div>
                      <p className="font-semibold">{contract.employees?.full_name}</p>
                      <p className="text-sm text-gray-600">
                        {contract.contract_number} - {contract.contract_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="mb-1">
                        {daysRemaining} hari lagi
                      </Badge>
                      <p className="text-xs text-gray-600">
                        Berakhir: {format(new Date(contract.end_date), "dd MMM yyyy", { locale: localeId })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Kontrak Kerja</h2>
          <p className="text-gray-600">Kelola kontrak karyawan</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Buat Kontrak
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Kontrak Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label>Jenis Kontrak *</Label>
                  <Select value={formData.contract_type} onValueChange={(value) => setFormData({ ...formData, contract_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PKWT">PKWT (Kontrak)</SelectItem>
                      <SelectItem value="PKWTT">PKWTT (Tetap)</SelectItem>
                      <SelectItem value="Magang">Magang</SelectItem>
                      <SelectItem value="Freelance">Freelance</SelectItem>
                      <SelectItem value="Probation">Probation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                  <Label>Tanggal Berakhir</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">Kosongkan untuk kontrak permanen</p>
                </div>

                <div className="space-y-2">
                  <Label>Gaji Pokok *</Label>
                  <Input
                    type="number"
                    required
                    value={formData.basic_salary}
                    onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tunjangan Transport</Label>
                  <Input
                    type="number"
                    value={formData.transport_allowance}
                    onChange={(e) => setFormData({ ...formData, transport_allowance: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tunjangan Makan</Label>
                  <Input
                    type="number"
                    value={formData.meal_allowance}
                    onChange={(e) => setFormData({ ...formData, meal_allowance: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tunjangan Jabatan</Label>
                  <Input
                    type="number"
                    value={formData.position_allowance}
                    onChange={(e) => setFormData({ ...formData, position_allowance: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Benefit</Label>
                <Textarea
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="BPJS Kesehatan, BPJS Ketenagakerjaan, Asuransi, dll"
                />
              </div>

              <div className="space-y-2">
                <Label>Syarat & Ketentuan</Label>
                <Textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Syarat dan ketentuan kontrak..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Upload File Kontrak (PDF)</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={uploadingFile}>
                  {uploadingFile ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Daftar Kontrak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>No. Kontrak</TableHead>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Tanggal Mulai</TableHead>
                  <TableHead>Tanggal Berakhir</TableHead>
                  <TableHead>Gaji Pokok</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sisa Hari</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => {
                  const daysRemaining = contract.end_date ? getDaysRemaining(contract.end_date) : null;
                  return (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{contract.contract_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{contract.employees?.full_name}</p>
                          <p className="text-xs text-gray-500">{contract.employees?.employee_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{contract.contract_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(contract.start_date), "dd MMM yyyy", { locale: localeId })}
                      </TableCell>
                      <TableCell>
                        {contract.end_date ? format(new Date(contract.end_date), "dd MMM yyyy", { locale: localeId }) : "Permanen"}
                      </TableCell>
                      <TableCell>Rp {contract.basic_salary.toLocaleString("id-ID")}</TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell>
                        {daysRemaining !== null ? (
                          daysRemaining > 0 ? (
                            <Badge variant={daysRemaining <= 30 ? "destructive" : "secondary"}>
                              {daysRemaining} hari
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Kadaluarsa</Badge>
                          )
                        ) : (
                          <Badge variant="outline">-</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {contract.contract_file_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(contract.contract_file_url, "_blank")}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {contract.status === "active" && daysRemaining !== null && daysRemaining <= 0 && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleStatusChange(contract.id, "expired")}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Tandai Kadaluarsa
                            </Button>
                          )}
                          {contract.status === "active" && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleStatusChange(contract.id, "renewed")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Perpanjang
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
