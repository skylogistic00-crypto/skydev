import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestWarehouseCount() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testDirectCount = async () => {
    setLoading(true);
    try {
      // Direct count using Supabase client
      const { count, error } = await supabase
        .from("warehouses")
        .select("*", { count: "exact", head: true });

      setResults((prev: any) => ({
        ...prev,
        directCount: { count, error: error?.message }
      }));
    } catch (err: any) {
      setResults((prev: any) => ({
        ...prev,
        directCount: { error: err.message }
      }));
    }
    setLoading(false);
  };

  const testAIQuery = async () => {
    setLoading(true);
    try {
      // Test via AI router
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-ai-router",
        {
          body: { prompt: "berapa jumlah gudang yang ada" }
        }
      );

      setResults((prev: any) => ({
        ...prev,
        aiQuery: { data, error: error?.message }
      }));
    } catch (err: any) {
      setResults((prev: any) => ({
        ...prev,
        aiQuery: { error: err.message }
      }));
    }
    setLoading(false);
  };

  const testSQLDirect = async () => {
    setLoading(true);
    try {
      // Test execute_sql RPC directly
      const { data, error } = await supabase.rpc("execute_sql", {
        query: "SELECT COUNT(*) as count FROM warehouses"
      });

      setResults((prev: any) => ({
        ...prev,
        sqlDirect: { data, error: error?.message }
      }));
    } catch (err: any) {
      setResults((prev: any) => ({
        ...prev,
        sqlDirect: { error: err.message }
      }));
    }
    setLoading(false);
  };

  const testAllWarehouses = async () => {
    setLoading(true);
    try {
      // Get all warehouses
      const { data, error } = await supabase
        .from("warehouses")
        .select("*");

      setResults((prev: any) => ({
        ...prev,
        allWarehouses: { 
          count: data?.length || 0,
          data: data?.slice(0, 5), // Show first 5
          error: error?.message 
        }
      }));
    } catch (err: any) {
      setResults((prev: any) => ({
        ...prev,
        allWarehouses: { error: err.message }
      }));
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white">
      <CardHeader>
        <CardTitle>🔍 Test Warehouse Count</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={testDirectCount} disabled={loading}>
            Test Direct Count
          </Button>
          <Button onClick={testSQLDirect} disabled={loading}>
            Test SQL RPC
          </Button>
          <Button onClick={testAIQuery} disabled={loading}>
            Test AI Query
          </Button>
          <Button onClick={testAllWarehouses} disabled={loading}>
            Get All Warehouses
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            {results.directCount && (
              <div className="p-4 bg-blue-50 rounded">
                <h3 className="font-bold mb-2">Direct Count (Supabase Client):</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(results.directCount, null, 2)}
                </pre>
              </div>
            )}

            {results.sqlDirect && (
              <div className="p-4 bg-green-50 rounded">
                <h3 className="font-bold mb-2">SQL RPC Direct:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(results.sqlDirect, null, 2)}
                </pre>
              </div>
            )}

            {results.aiQuery && (
              <div className="p-4 bg-purple-50 rounded">
                <h3 className="font-bold mb-2">AI Query Result:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(results.aiQuery, null, 2)}
                </pre>
              </div>
            )}

            {results.allWarehouses && (
              <div className="p-4 bg-yellow-50 rounded">
                <h3 className="font-bold mb-2">All Warehouses (First 5):</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(results.allWarehouses, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
