import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle2, Database } from "lucide-react";

interface AuditLog {
  id: string;
  user_id: string;
  query: string;
  status: string;
  error?: string;
  executed_at: string;
}

export default function AdminSQLExecutor() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const executeQuery = async () => {
    if (!query.trim()) {
      setResult({ error: "Query cannot be empty" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setResult({ error: "Not authenticated" });
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-admin-sql-executor",
        {
          body: {
            query,
            userId: user.id
          }
        }
      );

      if (error) {
        setResult({ error: error.message });
      } else if (data?.error) {
        setResult({ error: data.error, message: data.details });
      } else {
        setResult({ success: true, message: data.message });
        setQuery(""); // Clear query on success
      }
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("sql_audit_logs")
        .select("*")
        .order("executed_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setAuditLogs(data || []);
      setShowLogs(true);
    } catch (error: any) {
      console.error("Failed to load audit logs:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Success</Badge>;
      case "error":
        return <Badge className="bg-red-500">Error</Badge>;
      case "forbidden":
        return <Badge className="bg-orange-500">Forbidden</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">Super Admin SQL Executor</CardTitle>
            </div>
            <CardDescription className="text-red-700">
              ⚠️ Danger Zone: Execute any SQL query including data modifications, schema changes, and deletions.
              All queries are logged for audit purposes.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>SQL Query Editor</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAuditLogs}
              >
                View Audit Logs
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Textarea
                placeholder="Enter SQL query here...&#10;&#10;Examples:&#10;- SELECT * FROM users LIMIT 10&#10;- UPDATE users SET role = 'admin' WHERE id = '...'&#10;- ALTER TABLE users ADD COLUMN new_field TEXT&#10;- DELETE FROM old_table WHERE created_at < '2023-01-01'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="font-mono text-sm min-h-[200px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={executeQuery}
                disabled={loading || !query.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  "Execute Query"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setResult(null);
                }}
              >
                Clear
              </Button>
            </div>

            {result && (
              <Alert className={result.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <AlertDescription className={result.success ? "text-green-900" : "text-red-900"}>
                      {result.success ? (
                        <div>
                          <strong>Success!</strong> {result.message}
                        </div>
                      ) : (
                        <div>
                          <strong>Error:</strong> {result.error}
                          {result.message && (
                            <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                              {result.message}
                            </pre>
                          )}
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>

        {showLogs && (
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs (Last 20)</CardTitle>
              <CardDescription>
                All SQL queries executed by super admins are logged here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No audit logs found</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(log.status)}
                          <span className="text-sm text-gray-500">
                            {new Date(log.executed_at).toLocaleString()}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">
                          {log.user_id.substring(0, 8)}...
                        </span>
                      </div>
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                        {log.query}
                      </pre>
                      {log.error && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          {log.error}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
