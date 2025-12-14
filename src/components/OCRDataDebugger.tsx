import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export default function OCRDataDebugger() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const checkUsersTable = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-debug-ocr-data",
        {
          body: { action: "get_all_users_with_ocr" },
        }
      );

      if (error) throw error;

      setResult(data);
      toast({
        title: "Success",
        description: "Data retrieved successfully",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkTableSchema = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-debug-ocr-data",
        {
          body: { action: "check_columns" },
        }
      );

      if (error) throw error;

      setResult(data);
      toast({
        title: "Success",
        description: "Schema retrieved successfully",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch schema",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>OCR Data Debugger - KTP & KK</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkUsersTable} disabled={loading}>
            Check Users with KTP/KK Data
          </Button>
          <Button onClick={checkTableSchema} disabled={loading} variant="outline">
            Check Table Schema
          </Button>
        </div>

        {result && (
          <div className="bg-slate-50 p-4 rounded-lg overflow-auto max-h-96">
            <pre className="text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-sm text-slate-600 space-y-2">
          <p><strong>Note:</strong> Data KTP dan KK disimpan di tabel <code className="bg-slate-200 px-1 rounded">users</code>, bukan tabel terpisah.</p>
          <p>Field KTP: <code className="bg-slate-200 px-1 rounded">nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, status_perkawinan, pekerjaan</code></p>
          <p>Field KK: <code className="bg-slate-200 px-1 rounded">nomor_kk, nama_kepala_keluarga, rt_rw, kelurahan_desa, kecamatan, kabupaten_kota, provinsi, anggota_keluarga (JSONB)</code></p>
        </div>
      </CardContent>
    </Card>
  );
}
