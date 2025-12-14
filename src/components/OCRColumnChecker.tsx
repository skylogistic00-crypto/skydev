import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, XCircle, Loader2, Copy, Check } from "lucide-react";

export default function OCRColumnChecker() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const sqlToRun = `-- Jalankan SQL ini di Supabase Dashboard → SQL Editor
ALTER TABLE cash_disbursement ADD COLUMN IF NOT EXISTS ocr_data JSONB;
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS ocr_data JSONB;
ALTER TABLE purchase_transactions ADD COLUMN IF NOT EXISTS ocr_data JSONB;
ALTER TABLE cash_and_bank_receipts ADD COLUMN IF NOT EXISTS ocr_data JSONB;
ALTER TABLE kas_transaksi ADD COLUMN IF NOT EXISTS ocr_data JSONB;`;

  const checkOCRColumns = async () => {
    setLoading(true);
    setResult(null);

    try {
      const tables = [
        "cash_disbursement",
        "sales_transactions",
        "purchase_transactions",
        "cash_and_bank_receipts",
        "kas_transaksi",
      ];

      const results: any = {
        checked: [],
        missing: [],
        errors: [],
      };

      for (const tableName of tables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select("ocr_data")
            .limit(1);

          if (error && error.message.includes("column")) {
            results.missing.push(tableName);
          } else {
            results.checked.push(tableName);
          }
        } catch (err: any) {
          results.errors.push({ table: tableName, error: err.message });
        }
      }

      setResult({
        success: true,
        results,
      });
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const copySQL = () => {
    navigator.clipboard.writeText(sqlToRun);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white">
      <CardHeader>
        <CardTitle>🔍 OCR Column Checker</CardTitle>
        <CardDescription>
          Periksa dan tambahkan kolom ocr_data ke tabel transaksi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={checkOCRColumns}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memeriksa...
            </>
          ) : (
            "Periksa Kolom OCR"
          )}
        </Button>

        {result && (
          <div className="space-y-3">
            {result.success ? (
              <>
                {/* Tables already have column */}
                {result.results.checked.length > 0 && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>✅ Kolom ocr_data sudah ada di:</strong>
                      <ul className="list-disc ml-5 mt-2">
                        {result.results.checked.map((table: string) => (
                          <li key={table}>{table}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Tables missing column */}
                {result.results.missing.length > 0 && (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>❌ Kolom ocr_data BELUM ada di:</strong>
                      <ul className="list-disc ml-5 mt-2">
                        {result.results.missing.map((table: string) => (
                          <li key={table}>{table}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Errors */}
                {result.results.errors.length > 0 && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertDescription className="text-yellow-800">
                      <strong>⚠️ Error:</strong>
                      <ul className="list-disc ml-5 mt-2">
                        {result.results.errors.map((err: any, idx: number) => (
                          <li key={idx}>
                            {err.table}: {err.error}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Error:</strong> {result.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* SQL to run */}
        <div className="border rounded-lg p-4 bg-slate-50">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-slate-700">
              📝 SQL untuk menambahkan kolom:
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={copySQL}
              className="h-8"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy SQL
                </>
              )}
            </Button>
          </div>
          <pre className="text-xs bg-slate-900 text-green-400 p-3 rounded overflow-x-auto">
            {sqlToRun}
          </pre>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            <strong>📋 Langkah-langkah:</strong>
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              <li>Klik "Copy SQL" di atas</li>
              <li>Buka Supabase Dashboard → SQL Editor</li>
              <li>Paste dan jalankan SQL</li>
              <li>Refresh halaman ini</li>
              <li>Klik "Periksa Kolom OCR" untuk verifikasi</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
