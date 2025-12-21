import { useState, useEffect } from "react";
import { Settings, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface VehicleMetadata {
  brand?: string;
  model?: string;
  plate_number?: string;
}

interface COAAnalysisResult {
  id?: string;
  intent: string;
  intent_code: string;
  financial_category: string;
  selected_account_code: string;
  suggested_account_name: string;
  suggested_account_code?: string;
  parent_account: string;
  action_taken: "reused" | "auto_created" | "needs_review";
  confidence: number;
  reasoning?: string;
  status: "pending" | "approved" | "needs_review";
  asset_category?: string;
  vehicle_metadata?: VehicleMetadata;
}

export default function COAEngine() {
  const { userProfile } = useAuth();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<COAAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState<COAAnalysisResult[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editedAccountCode, setEditedAccountCode] = useState("");
  const [codeValidationError, setCodeValidationError] = useState<string | null>(null);

  const isAdmin = 
    (userProfile as any)?.role_name === "super_admin" || 
    (userProfile as any)?.role_name === "Super Admin" ||
    (userProfile as any)?.role_name === "accounting_manager" ||
    (userProfile as any)?.role_name === "Accounting Manager" ||
    userProfile?.role === "super_admin" || 
    userProfile?.role === "Super Admin" ||
    userProfile?.role === "accounting_manager" ||
    userProfile?.role === "Accounting Manager";

  // Debug log
  console.log("COAEngine - userProfile:", userProfile);
  console.log("COAEngine - role_name:", (userProfile as any)?.role_name);
  console.log("COAEngine - isAdmin:", isAdmin);
  console.log("COAEngine - result:", result);
  console.log("COAEngine - action_taken:", result?.action_taken);
  console.log("COAEngine - status:", result?.status);
  console.log("COAEngine - button condition:", {
    isAdmin,
    action_taken: result?.action_taken,
    status: result?.status,
    shouldShow: isAdmin && result?.action_taken === "auto_created" && result?.status === "pending"
  });

  // Fetch pending suggestions on mount
  useEffect(() => {
    if (isAdmin) {
      fetchPendingSuggestions();
    }
  }, [isAdmin]);

  const fetchPendingSuggestions = async () => {
    setLoadingList(true);
    try {
      const { data, error } = await supabase
        .from('coa_suggestions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingSuggestions(data || []);
    } catch (err: any) {
      console.error("Error fetching pending suggestions:", err);
    } finally {
      setLoadingList(false);
    }
  };

  const validateAccountCode = async (code: string): Promise<boolean> => {
    if (!code || code.trim() === "") {
      setCodeValidationError("Account code tidak boleh kosong");
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('account_code')
        .eq('account_code', code)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCodeValidationError(`Account code ${code} sudah digunakan`);
        return false;
      }

      setCodeValidationError(null);
      return true;
    } catch (err: any) {
      setCodeValidationError("Error validating account code");
      return false;
    }
  };

  const handleAccountCodeChange = async (value: string) => {
    setEditedAccountCode(value);
    if (value) {
      await validateAccountCode(value);
    } else {
      setCodeValidationError(null);
    }
  };

  const handleApproveItem = async (id: string) => {
    setApproving(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "supabase-functions-coa-engine-approve",
        {
          body: { id }
        }
      );

      if (functionError) throw functionError;

      if (data.error) {
        setError(data.error);
      } else if (data.warning) {
        setError(data.warning);
        // Refresh list
        fetchPendingSuggestions();
      } else {
        // Success - refresh list
        fetchPendingSuggestions();
        const message = data.code_incremented 
          ? `Akun berhasil dibuat dengan kode ${data.final_account_code}!`
          : "Akun berhasil dibuat di Chart of Accounts!";
        alert(message);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat approve");
    } finally {
      setApproving(false);
    }
  };

  const handleRejectItem = async (id: string) => {
    setApproving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('coa_suggestions')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (updateError) throw updateError;

      // Refresh list
      fetchPendingSuggestions();
      alert("COA suggestion berhasil di-reject");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat reject");
    } finally {
      setApproving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!description.trim()) {
      setError("Deskripsi transaksi tidak boleh kosong");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "supabase-functions-coa-engine-analyze",
        {
          body: { description: description.trim() }
        }
      );

      if (functionError) throw functionError;

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        setEditedAccountCode(data.suggested_account_code || "");
        setCodeValidationError(null);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menganalisis");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!result?.id) return;

    // Validate edited account code if it has been changed
    if (editedAccountCode !== result.suggested_account_code) {
      const isValid = await validateAccountCode(editedAccountCode);
      if (!isValid) {
        return;
      }

      // Update the suggestion with new account code
      try {
        const { error: updateError } = await supabase
          .from('coa_suggestions')
          .update({ suggested_account_code: editedAccountCode })
          .eq('id', result.id);

        if (updateError) throw updateError;
      } catch (err: any) {
        setError("Error updating account code: " + err.message);
        return;
      }
    }

    setApproving(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "supabase-functions-coa-engine-approve",
        {
          body: { id: result.id }
        }
      );

      if (functionError) throw functionError;

      console.log("Approve response:", data);

      if (data.error) {
        setError(data.error);
      } else if (data.warning) {
        setError(data.warning);
        setResult({ ...result, status: "approved" });
      } else {
        setResult({ ...result, status: "approved" });
        if (data.chart_of_accounts_created) {
          const message = data.code_incremented 
            ? `Akun berhasil dibuat dengan kode ${data.final_account_code} (auto-increment karena ${editedAccountCode} sudah ada)!`
            : "Akun berhasil dibuat di Chart of Accounts!";
          alert(message);
        }
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat approve");
    } finally {
      setApproving(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800";
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="container mx-auto p-3 md:p-6 max-w-7xl">
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3 mb-2">
          <Settings className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">COA Engine</h1>
        </div>
        <p className="text-sm md:text-base text-gray-600">
          Analisis otomatis untuk menyarankan akun Chart of Accounts
        </p>
      </div>

      <div className="grid gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Analisis Transaksi</CardTitle>
            <CardDescription>
              Masukkan deskripsi transaksi untuk mendapatkan saran akun COA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Deskripsi Transaksi
              </label>
              <Textarea
                placeholder="Contoh: Pembayaran gaji karyawan bulan Januari..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={loading || !description.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menganalisis...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Result Section */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                Hasil Analisis
                <Badge 
                  className={
                    result.action_taken === "reused" 
                      ? "bg-green-100 text-green-800" 
                      : result.action_taken === "auto_created"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {result.action_taken === "reused" && "✓ REUSED"}
                  {result.action_taken === "auto_created" && "⊕ AUTO CREATE"}
                  {result.action_taken === "needs_review" && "⚠ NEEDS REVIEW"}
                </Badge>
              </CardTitle>
              <CardDescription>
                {result.action_taken === "reused" 
                  ? "Menggunakan akun COA yang sudah ada" 
                  : result.action_taken === "auto_created"
                  ? "Akan membuat akun COA baru"
                  : "Membutuhkan review manual karena confidence rendah"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Intent & Category */}
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="text-sm text-indigo-600 font-medium mb-1">Intent</div>
                <div className="text-lg text-indigo-900">{result.intent || "-"}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Financial Category
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md text-sm">
                    {result.financial_category || "-"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intent Code
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                    {result.intent_code}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Suggested Account Code
                  </label>
                  <div className="space-y-2">
                    <Input
                      value={editedAccountCode}
                      onChange={(e) => handleAccountCodeChange(e.target.value)}
                      className={`font-mono ${codeValidationError ? 'border-red-500' : ''}`}
                      placeholder="Edit account code..."
                    />
                    {codeValidationError && (
                      <p className="text-xs text-red-600">{codeValidationError}</p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selected Account Code
                  </label>
                  <div className="p-3 bg-green-50 rounded-md font-mono text-sm text-green-800 font-semibold">
                    {result.selected_account_code || result.suggested_account_code || "-"}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Name
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md text-sm">
                    {result.suggested_account_name || "-"}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Account
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                    {result.parent_account || "-"}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confidence
                  </label>
                  <div className="flex items-center gap-2">
                    <Badge className={getConfidenceColor(result.confidence || 0)}>
                      {((result.confidence || 0) * 100).toFixed(1)}%
                    </Badge>
                    {result.confidence < 0.7 && (
                      <span className="text-xs text-yellow-600">
                        (Di bawah threshold 70%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Status */}
              <div className="p-4 border rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action Taken
                    </label>
                    <Badge
                      variant={result.action_taken === "reused" ? "default" : "secondary"}
                    >
                      {result.action_taken === "reused" && "Menggunakan Akun Existing"}
                      {result.action_taken === "auto_created" && "Buat Akun Baru"}
                      {result.action_taken === "needs_review" && "Butuh Review Manual"}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <Badge
                      variant={result.status === "approved" ? "default" : "secondary"}
                    >
                      {result.status === "approved" ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Approved</>
                      ) : result.status === "needs_review" ? (
                        "Needs Review"
                      ) : (
                        "Pending"
                      )}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Approve Button - Only show for auto_created with pending status */}
              {isAdmin && result.status === "pending" && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleApprove}
                    disabled={approving || !!codeValidationError}
                    variant="default"
                    className="w-full"
                  >
                    {approving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Approving & Creating COA...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve & Buat Akun COA Baru
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Reused - No action needed */}
              {result.action_taken === "reused" && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ✓ Akun COA sudah tersedia. Tidak perlu membuat akun baru.
                  </AlertDescription>
                </Alert>
              )}

              {/* Needs Review Warning */}
              {result.action_taken === "needs_review" && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    ⚠ Confidence di bawah 70%. Silakan review dan tentukan akun COA secara manual.
                  </AlertDescription>
                </Alert>
              )}

              {!isAdmin && result.status === "pending" && result.action_taken === "auto_created" && (
                <Alert>
                  <AlertDescription>
                    Menunggu approval dari Admin atau Accounting Manager
                  </AlertDescription>
                </Alert>
              )}

              {result.reasoning && (
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reasoning
                  </label>
                  <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-800">
                    {result.reasoning}
                  </div>
                </div>
              )}

              {/* Vehicle/Asset Metadata Section */}
              {result.asset_category === "Vehicle" && result.vehicle_metadata && (
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📋 Asset Metadata (Kendaraan)
                  </label>
                  <div className="p-4 bg-purple-50 rounded-lg space-y-2">
                    {result.vehicle_metadata.brand && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Brand:</span>
                        <span className="font-medium">{result.vehicle_metadata.brand}</span>
                      </div>
                    )}
                    {result.vehicle_metadata.model && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Model:</span>
                        <span className="font-medium">{result.vehicle_metadata.model}</span>
                      </div>
                    )}
                    {result.vehicle_metadata.plate_number && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Plat Nomor:</span>
                        <span className="font-medium font-mono">{result.vehicle_metadata.plate_number}</span>
                      </div>
                    )}
                    <div className="text-xs text-purple-600 mt-2">
                      ℹ️ Data ini akan disimpan ke tabel assets/vehicles, bukan COA
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pending COA Suggestions List */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>COA Suggestions Pending Approval</CardTitle>
              <CardDescription>
                Daftar pembuatan COA baru yang belum di-approve
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingList ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading...</span>
                </div>
              ) : pendingSuggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada COA suggestion yang pending
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="border rounded-lg p-3 md:p-4 hover:bg-gray-50">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.suggested_account_code || suggestion.selected_account_code}
                            </Badge>
                            <Badge
                              variant={suggestion.action_taken === "reused" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {suggestion.action_taken === "reused" && "Reused"}
                              {suggestion.action_taken === "auto_created" && "New"}
                              {suggestion.action_taken === "needs_review" && "Review"}
                            </Badge>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm md:text-base">
                              {suggestion.suggested_account_name}
                            </div>
                            <div className="text-xs md:text-sm text-gray-600 mt-1">
                              {suggestion.description || suggestion.intent}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                            <div>
                              <span className="text-gray-500">Category:</span>
                              <span className="ml-1 font-medium">{suggestion.financial_category}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Parent:</span>
                              <span className="ml-1 font-mono text-xs break-all">{suggestion.parent_account}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Flow Type:</span>
                              <span className="ml-1 font-medium">{suggestion.flow_type || "-"}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Trans Type:</span>
                              <span className="ml-1 font-medium">{suggestion.trans_type || "-"}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Usage Role:</span>
                              <span className="ml-1 font-medium">{suggestion.usage_role || "-"}</span>
                            </div>
                            <div>
                              <span className={`font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                                {Math.round(suggestion.confidence * 100)}% confidence
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto md:flex-col lg:flex-row">
                          <Button
                            onClick={() => handleRejectItem(suggestion.id!)}
                            disabled={approving}
                            size="sm"
                            variant="outline"
                            className="flex-1 md:flex-initial"
                          >
                            {approving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <X className="w-4 h-4 md:mr-1" />
                                <span className="hidden sm:inline">Reject</span>
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleApproveItem(suggestion.id!)}
                            disabled={approving}
                            size="sm"
                            variant="default"
                            className="flex-1 md:flex-initial"
                          >
                            {approving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 md:mr-1" />
                                <span className="hidden sm:inline">Approve</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
