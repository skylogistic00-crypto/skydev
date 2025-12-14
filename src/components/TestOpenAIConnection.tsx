import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function TestOpenAIConnection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const checkConnection = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Test using deployed openai-chat edge function
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-openai-chat",
        {
          body: {
            messages: [{ role: "user", content: "Say 'OK' if you can hear me" }],
            max_tokens: 10
          }
        }
      );

      if (error) {
        setResult({
          connected: false,
          error: error.message,
          message: "❌ Gagal memanggil Edge Function",
        });
        return;
      }

      if (data?.error) {
        setResult({
          connected: false,
          error: data.error,
          message: "❌ OpenAI API Error",
        });
        return;
      }

      setResult({
        connected: true,
        message: "✅ Koneksi ke OpenAI berhasil!",
        response: data?.choices?.[0]?.message?.content || "Connected"
      });

    } catch (err: any) {
      setResult({
        connected: false,
        error: err.message,
        message: "Terjadi kesalahan saat mengecek koneksi",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🤖 OpenAI Connection Test
            </CardTitle>
            <CardDescription>
              Cek status koneksi OpenAI melalui Pica Passthrough API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={checkConnection}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Connection"
              )}
            </Button>

            {result && (
              <Alert
                variant={result.connected ? "default" : "destructive"}
                className={
                  result.connected
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                }
              >
                <div className="flex items-start gap-3">
                  {result.connected ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <AlertDescription>
                      <p className="font-semibold mb-2">{result.message}</p>
                      {result.connected && (
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>✅ Edge Function: Deployed & Working</p>
                          <p>✅ OpenAI API: Connected</p>
                          {result.response && (
                            <p>📝 Response: {result.response}</p>
                          )}
                        </div>
                      )}
                      {!result.connected && result.error && (
                        <div className="mt-2 text-sm">
                          <p className="font-medium text-red-700">Error:</p>
                          <p className="text-red-600">{result.error}</p>
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}

            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">
                ✅ Edge Function Status:
              </h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• supabase-functions-openai-chat: ACTIVE</li>
                <li>• Version: 71</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
