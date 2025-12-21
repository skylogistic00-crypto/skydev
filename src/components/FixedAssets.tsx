import { useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

interface FixedAsset {
  id: string;
  asset_name: string;
  account_code: string;
  acquisition_cost: number;
  accumulated_depreciation: number;
  book_value: number;
  status: "active" | "disposed";
}

export default function FixedAssets() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke(
        "supabase-functions-fixed-assets-list",
        { body: {} }
      );

      if (fetchError) throw fetchError;

      if (data.error) {
        setError(data.error);
      } else {
        setAssets(data.assets || []);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
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
          <Building2 className="w-8 h-8 text-teal-600" />
          <h1 className="text-3xl font-bold text-gray-900">Fixed Assets</h1>
        </div>
        <p className="text-gray-600">
          Kelola aset tetap perusahaan dan pencatatan nilai aset
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Aset Tetap</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Tidak ada data aset tetap
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Account Code</TableHead>
                  <TableHead className="text-right">Acquisition Cost</TableHead>
                  <TableHead className="text-right">Accumulated Depreciation</TableHead>
                  <TableHead className="text-right">Book Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.asset_name}</TableCell>
                    <TableCell className="font-mono text-sm">{asset.account_code}</TableCell>
                    <TableCell className="text-right">{formatCurrency(asset.acquisition_cost)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(asset.accumulated_depreciation)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(asset.book_value)}</TableCell>
                    <TableCell>
                      <Badge variant={asset.status === "active" ? "default" : "secondary"}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
