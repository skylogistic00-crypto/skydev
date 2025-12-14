import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Database } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function CreateProfitLossView() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const createView = async () => {
    setLoading(true);
    try {
      // Check if general_ledger has data
      const { data: glData, error: glError } = await supabase
        .from("general_ledger")
        .select("*")
        .limit(5);

      if (glError) throw glError;

      // Check chart_of_accounts
      const { data: coaData, error: coaError } = await supabase
        .from("chart_of_accounts")
        .select("account_code, account_name, account_type")
        .in("account_type", ["Pendapatan", "Beban Pokok Penjualan", "Beban Operasional"])
        .limit(10);

      if (coaError) throw coaError;

      // Try to query the view (it might already exist)
      const { data: viewData, error: viewError } = await supabase
        .from("vw_profit_and_loss")
        .select("*")
        .limit(5);

      setResult({
        general_ledger_count: glData?.length || 0,
        general_ledger_sample: glData,
        coa_count: coaData?.length || 0,
        coa_sample: coaData,
        view_exists: !viewError,
        view_data: viewData,
        view_error: viewError?.message,
      });

      if (viewError) {
        toast({
          title: "View belum ada",
          description: "View vw_profit_and_loss belum dibuat. Silakan jalankan migration SQL secara manual.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "View sudah ada",
          description: `View berhasil diquery dengan ${viewData?.length || 0} baris data`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Create Profit & Loss View
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={createView} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Check Database & View
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-bold mb-2">Result:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold mb-2">SQL untuk membuat view:</h3>
            <pre className="text-xs bg-white p-3 rounded overflow-auto">
{`CREATE OR REPLACE VIEW vw_profit_and_loss AS
SELECT 
  coa.account_code,
  coa.account_name,
  coa.account_type,
  COALESCE(SUM(gl.debit), 0) as debit,
  COALESCE(SUM(gl.credit), 0) as credit,
  CASE 
    WHEN coa.account_type IN ('Pendapatan') THEN 
      COALESCE(SUM(gl.credit), 0) - COALESCE(SUM(gl.debit), 0)
    WHEN coa.account_type IN ('Beban Pokok Penjualan', 'Beban Operasional') THEN 
      COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.credit), 0)
    ELSE 0
  END as balance
FROM chart_of_accounts coa
LEFT JOIN general_ledger gl ON coa.account_code = gl.account_code
WHERE coa.account_type IN ('Pendapatan', 'Beban Pokok Penjualan', 'Beban Operasional')
GROUP BY coa.account_code, coa.account_name, coa.account_type
ORDER BY 
  CASE coa.account_type
    WHEN 'Pendapatan' THEN 1
    WHEN 'Beban Pokok Penjualan' THEN 2
    WHEN 'Beban Operasional' THEN 3
  END,
  coa.account_code;`}
            </pre>
            <p className="text-sm text-gray-600 mt-2">
              Jalankan SQL ini di Supabase SQL Editor untuk membuat view.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
