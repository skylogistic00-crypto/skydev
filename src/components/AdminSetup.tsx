import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useToast } from "./ui/use-toast";

export default function AdminSetup() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const createTestUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-create-test-users",
      );

      if (error) throw error;

      setResults(data.results);
      toast({
        title: "Success",
        description: "Test users created successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>Create test user accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={createTestUsers} disabled={loading}>
            {loading ? "Creating Users..." : "Create Test Users"}
          </Button>

          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Results:</h3>
              {results.map((result, i) => (
                <div
                  key={i}
                  className={`p-2 rounded ${result.status === "success" ? "bg-green-50" : "bg-red-50"}`}
                >
                  <div className="font-medium">{result.email}</div>
                  <div className="text-sm text-slate-600">
                    {result.status === "success"
                      ? `✅ ${result.role}`
                      : `❌ ${result.message}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
