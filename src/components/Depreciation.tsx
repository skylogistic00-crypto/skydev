import { useState } from "react";
import { TrendingDown, Loader2, Eye, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface DepreciationPreview {
  asset_id: string;
  asset_name: string;
  account_code: string;
  depreciation_amount: number;
  accumulated_depreciation: number;
  book_value_before: number;
  book_value_after: number;
}

export default function Depreciation() {
  const { userProfile } = useAuth();
  const [period, setPeriod] = useState("");
  const [preview, setPreview] = useState<DepreciationPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const roleValue = (userProfile as any)?.role_name || userProfile?.role;
  const isAdmin = roleValue === "super_admin" || roleValue === "accounting_manager";

  const handlePreview = async () => {
    if (!period) {
      setError("Periode tidak boleh kosong");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setPreview([]);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "supabase-functions-depreciation-preview",
        {
          body: { period }
        }
      );

      if (functionError) throw functionError;

      if (data.error) {
        setError(data.error);
      } else {
        setPreview(data.preview || []);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat preview");
    } finally {
      setLoading(false);
    }
  };

  const handleRunDepreciation = async () => {
    if (!period || preview.length === 0) return;

    setRunning(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "supabase-functions-depreciation-run",
        {
          body: { period }
        }
      );

      if (functionError) throw functionError;

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(`Depresiasi berhasil dijalankan untuk periode ${period}`);
        setPreview([]);
        setPeriod("");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat run depreciation");
    } finally {
      setRunning(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <TrendingDown className="w-8 h-8 text-amber-600" />
          <h1 className="text-3xl font-bold text-gray-900">Depreciation</h1>
        </div>
        <p className="text-gray-600">
          Kelola penyusutan aset tetap dan perhitungan depresiasi
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Preview Depresiasi</CardTitle>
            <CardDescription>
              Pilih periode untuk melihat preview perhitungan depresiasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  Periode (YYYY-MM)
                </label>
                <Input
                  type="month"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="2024-01"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handlePreview}
                  disabled={loading || !period}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {preview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview Depresiasi - {period}</CardTitle>
              <CardDescription>
                Preview perhitungan depresiasi (belum posting jurnal)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Account Code</TableHead>
                    <TableHead className="text-right">Depreciation Amount</TableHead>
                    <TableHead className="text-right">Accumulated Depreciation</TableHead>
                    <TableHead className="text-right">Book Value (Before)</TableHead>
                    <TableHead className="text-right">Book Value (After)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((item) => (
                    <TableRow key={item.asset_id}>
                      <TableCell className="font-medium">{item.asset_name}</TableCell>
                      <TableCell className="font-mono text-sm">{item.account_code}</TableCell>
                      <TableCell className="text-right text-amber-600 font-semibold">
                        {formatCurrency(item.depreciation_amount)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.accumulated_depreciation)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.book_value_before)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(item.book_value_after)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {isAdmin && (
                <div className="mt-6 pt-6 border-t">
                  <Button
                    onClick={handleRunDepreciation}
                    disabled={running}
                    className="w-full"
                    size="lg"
                  >
                    {running ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Run Depreciation
                      </>
                    )}
                  </Button>
                </div>
              )}

              {!isAdmin && (
                <Alert className="mt-6">
                  <AlertDescription>
                    Hanya Admin atau Accounting Manager yang dapat menjalankan depresiasi
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
