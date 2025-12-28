import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MutationSummary {
  total_in: number;
  total_out: number;
  count_in: number;
  count_out: number;
}

export default function MutationSummaryDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<MutationSummary | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vw_mutation_summary_global")
        .select("*")
        .single();

      if (error) {
        console.error("Failed fetch summary", error);
        throw error;
      }

      setSummary(data);
      setLastUpdated(new Date());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memuat ringkasan mutasi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  const handleBack = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with gradient */}
      <div className="border-b bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 shadow-lg">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Ringkasan Mutasi Global
              </h1>
              <p className="text-white/80 text-sm">
                Data transaksi yang sudah di-posting
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSummary}
              disabled={loading}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Last updated info */}
        {lastUpdated && (
          <p className="text-sm text-gray-500 mb-4">
            Terakhir diperbarui: {lastUpdated.toLocaleString("id-ID")}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <span className="ml-2 text-gray-600">Memuat data...</span>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Keuangan</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Total Masuk</span>
                <span className="font-semibold text-green-600">
                  {formatRupiah(summary?.total_in ?? 0)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Total Keluar</span>
                <span className="font-semibold text-red-600">
                  {formatRupiah(summary?.total_out ?? 0)}
                </span>
              </div>

              <div className="pt-2 text-sm text-muted-foreground">
                {summary?.count_in ?? 0} transaksi masuk ·{" "}
                {summary?.count_out ?? 0} transaksi keluar
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
