import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function CheckUserOCRData() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const { toast } = useToast();

  const checkData = async (action: string) => {
    setLoading(true);
    setResult(null);
    
    try {
      const body: any = { action };
      
      if (action === "check_user_by_email" && email) {
        body.email = email;
      }
      
      if (action === "check_user_by_id" && userId) {
        body.user_id = userId;
      }

      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-check-user-ocr-data",
        { body }
      );

      if (error) throw error;

      setResult(data);
      toast({
        title: "Success",
        description: `Found ${Array.isArray(data.data) ? data.data.length : 1} record(s)`,
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Check User OCR Data</CardTitle>
          <CardDescription>
            Verify if KTP/KK data is being saved to the users table after signup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => checkData("check_all_users_with_ocr")}
              disabled={loading}
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Check All Users with KTP/KK Data
            </Button>

            <Button
              onClick={() => checkData("check_recent_signups")}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Check Recent Signups (Last 10)
            </Button>

            <Button
              onClick={() => checkData("check_table_columns")}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Check Table Columns
            </Button>
          </div>

          {/* Search by Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Search by Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                onClick={() => checkData("check_user_by_email")}
                disabled={loading || !email}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Search
              </Button>
            </div>
          </div>

          {/* Search by User ID */}
          <div className="space-y-2">
            <Label htmlFor="userId">Search by User ID</Label>
            <div className="flex gap-2">
              <Input
                id="userId"
                type="text"
                placeholder="UUID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <Button
                onClick={() => checkData("check_user_by_id")}
                disabled={loading || !userId}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Search
              </Button>
            </div>
          </div>

          {/* Search by Date */}
          <div className="space-y-2">
            <Label htmlFor="dateFilter">Search by Date (ISO format)</Label>
            <div className="flex gap-2">
              <Input
                id="dateFilter"
                type="text"
                placeholder="1008-12-31T16:52:48.000Z"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              <Button
                onClick={() => checkData("check_by_date")}
                disabled={loading || !dateFilter}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Search
              </Button>
            </div>
          </div>

          {/* Results */}
          {result && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Results</CardTitle>
                <CardDescription>Action: {result.action}</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
                
                {Array.isArray(result.data) && result.data.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Summary:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Total records: {result.data.length}</li>
                      <li>
                        Users with NIK: {result.data.filter((u: any) => u.nik).length}
                      </li>
                      <li>
                        Users with Nomor KK: {result.data.filter((u: any) => u.nomor_kk).length}
                      </li>
                      <li>
                        Users with Anggota Keluarga: {result.data.filter((u: any) => u.anggota_keluarga).length}
                      </li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
