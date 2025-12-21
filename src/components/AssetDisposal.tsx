import { useState, useEffect } from "react";
import { Trash2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

interface FixedAsset {
  id: string;
  asset_name: string;
  account_code: string;
  acquisition_cost: number;
  accumulated_depreciation: number;
  book_value: number;
}

interface DisposalPreview {
  asset_id: string;
  asset_name: string;
  account_code: string;
  book_value: number;
  disposal_amount: number;
  gain_or_loss: number;
  gain_or_loss_type: "gain" | "loss" | "neutral";
}

export default function AssetDisposal() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [disposalDate, setDisposalDate] = useState("");
  const [disposalAmount, setDisposalAmount] = useState("");
  const [preview, setPreview] = useState<DisposalPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoadingAssets(true);
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
      setError(err.message || "Gagal memuat daftar aset");
    } finally {
      setLoadingAssets(false);
    }
  };

  const handlePreviewDisposal = async () => {
    if (!selectedAssetId || !disposalDate || !disposalAmount) {
      setError("Semua field harus diisi");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: previewError } = await supabase.functions.invoke(
        "supabase-functions-asset-disposal-preview",
        {
          body: {
            asset_id: selectedAssetId,
            disposal_date: disposalDate,
            disposal_amount: parseFloat(disposalAmount),
          },
        }
      );

      if (previewError) throw previewError;

      if (data.error) {
        setError(data.error);
        setPreview(null);
      } else {
        setPreview(data.preview);
      }
    } catch (err: any) {
      setError(err.message || "Gagal menghitung preview disposal");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDisposal = async () => {
    if (!preview) {
      setError("Silakan preview disposal terlebih dahulu");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: confirmError } = await supabase.functions.invoke(
        "supabase-functions-asset-disposal-confirm",
        {
          body: {
            asset_id: selectedAssetId,
            disposal_date: disposalDate,
            disposal_amount: parseFloat(disposalAmount),
          },
        }
      );

      if (confirmError) throw confirmError;

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess("Asset berhasil di-dispose");
        setSelectedAssetId("");
        setDisposalDate("");
        setDisposalAmount("");
        setPreview(null);
        await fetchAssets();
      }
    } catch (err: any) {
      setError(err.message || "Gagal melakukan disposal");
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

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-4 rounded-2xl shadow-xl">
            <Trash2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Asset Disposal</h1>
            <p className="text-gray-400 mt-1">Penghapusan Aset Tetap</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-600 text-white border-green-700">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Form Disposal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="asset" className="text-gray-300">
                  Pilih Aset
                </Label>
                <Select
                  value={selectedAssetId}
                  onValueChange={setSelectedAssetId}
                  disabled={loadingAssets}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Pilih aset..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {assets.map((asset) => (
                      <SelectItem
                        key={asset.id}
                        value={asset.id}
                        className="text-white hover:bg-gray-700"
                      >
                        {asset.asset_name} - {asset.account_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAsset && (
                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Acquisition Cost:</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(selectedAsset.acquisition_cost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Accumulated Depreciation:</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(selectedAsset.accumulated_depreciation)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-white/10 pt-2">
                    <span className="text-gray-300 font-medium">Book Value:</span>
                    <span className="text-white font-bold">
                      {formatCurrency(selectedAsset.book_value)}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="disposal_date" className="text-gray-300">
                  Tanggal Disposal
                </Label>
                <Input
                  id="disposal_date"
                  type="date"
                  value={disposalDate}
                  onChange={(e) => setDisposalDate(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disposal_amount" className="text-gray-300">
                  Jumlah Disposal
                </Label>
                <Input
                  id="disposal_amount"
                  type="number"
                  value={disposalAmount}
                  onChange={(e) => setDisposalAmount(e.target.value)}
                  placeholder="0"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <Button
                onClick={handlePreviewDisposal}
                disabled={loading || !selectedAssetId || !disposalDate || !disposalAmount}
                className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Preview Disposal"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {preview ? (
                <div className="space-y-6">
                  <div className="bg-white/5 rounded-lg p-6 space-y-4">
                    <div className="text-center pb-4 border-b border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {preview.asset_name}
                      </h3>
                      <p className="text-gray-400 text-sm">{preview.account_code}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Book Value:</span>
                        <span className="text-white font-semibold">
                          {formatCurrency(preview.book_value)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">Disposal Amount:</span>
                        <span className="text-white font-semibold">
                          {formatCurrency(preview.disposal_amount)}
                        </span>
                      </div>

                      <div className="border-t border-white/10 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">Gain / Loss:</span>
                          <span
                            className={`text-lg font-bold ${
                              preview.gain_or_loss_type === "gain"
                                ? "text-green-400"
                                : preview.gain_or_loss_type === "loss"
                                ? "text-red-400"
                                : "text-gray-400"
                            }`}
                          >
                            {preview.gain_or_loss_type === "gain" && "+"}
                            {formatCurrency(preview.gain_or_loss)}
                          </span>
                        </div>
                        {preview.gain_or_loss_type !== "neutral" && (
                          <p className="text-xs text-gray-400 text-right mt-1">
                            {preview.gain_or_loss_type === "gain"
                              ? "Keuntungan disposal"
                              : "Kerugian disposal"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleConfirmDisposal}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Confirm Disposal"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trash2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
                    Isi form dan klik Preview Disposal untuk melihat perhitungan
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
