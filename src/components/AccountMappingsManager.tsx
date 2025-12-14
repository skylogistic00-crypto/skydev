import { useState, useEffect } from "react";
import {
  Settings,
  Save,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAccountingIntegration, AccountMapping, IntegrationLog } from "@/hooks/useAccountingIntegration";

const accountTypeLabels: Record<string, string> = {
  cash: "Kas",
  bank: "Bank",
  sales: "Pendapatan Penjualan",
  inventory: "Persediaan/Inventory",
  cogs: "HPP/COGS",
  accounts_payable: "Hutang Usaha (AP)",
  expense_adjustment: "Beban Penyesuaian",
};

export default function AccountMappingsManager() {
  const { toast } = useToast();
  const {
    isLoading,
    accountMappings,
    integrationLogs,
    fetchAccountMappings,
    updateAccountMapping,
    fetchIntegrationLogs,
  } = useAccountingIntegration();

  const [editingMapping, setEditingMapping] = useState<AccountMapping | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchAccountMappings();
    fetchIntegrationLogs({ limit: 50 });
  }, []);

  const handleEdit = (mapping: AccountMapping) => {
    setEditingMapping(mapping);
    setEditCode(mapping.account_code);
    setEditName(mapping.account_name);
  };

  const handleSave = async () => {
    if (!editingMapping) return;

    await updateAccountMapping(editingMapping.account_type, editCode, editName);
    setEditingMapping(null);
    fetchAccountMappings();
  };

  const handleCancel = () => {
    setEditingMapping(null);
    setEditCode("");
    setEditName("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      case "skipped":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Skipped
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Mappings */}
      <Card className="bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Mapping Akun
              </CardTitle>
              <CardDescription>
                Konfigurasi akun untuk integrasi POS & Gudang ke Akunting
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAccountMappings()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipe Akun</TableHead>
                <TableHead>Kode Akun</TableHead>
                <TableHead>Nama Akun</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountMappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell className="font-medium">
                    {accountTypeLabels[mapping.account_type] || mapping.account_type}
                  </TableCell>
                  <TableCell>
                    {editingMapping?.id === mapping.id ? (
                      <Input
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                        className="w-32"
                      />
                    ) : (
                      <code className="bg-slate-100 px-2 py-1 rounded">
                        {mapping.account_code}
                      </code>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingMapping?.id === mapping.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-48"
                      />
                    ) : (
                      mapping.account_name
                    )}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {mapping.description}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingMapping?.id === mapping.id ? (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" onClick={handleSave} disabled={isLoading}>
                          <Save className="h-4 w-4 mr-1" />
                          Simpan
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                          Batal
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(mapping)}
                      >
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Integration Logs */}
      <Card className="bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Log Integrasi
              </CardTitle>
              <CardDescription>
                Riwayat pembuatan jurnal dari POS & Gudang
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchIntegrationLogs({ limit: 50 })}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Sumber</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Referensi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pesan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrationLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      Belum ada log integrasi
                    </TableCell>
                  </TableRow>
                ) : (
                  integrationLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-slate-500">
                        {new Date(log.created_at).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.source}</Badge>
                      </TableCell>
                      <TableCell>{log.reference_type}</TableCell>
                      <TableCell>
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                          {log.reference_number}
                        </code>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {log.error_message || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
