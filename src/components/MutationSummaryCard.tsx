import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface MutationSummary {
  total_in: number;
  total_out: number;
  count_in: number;
  count_out: number;
}

export default function MutationSummaryCard() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<MutationSummary | null>(null);

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
    } catch (error: any) {
      console.error("Error fetching mutation summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value ?? 0);

  if (loading && !summary) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ringkasan Mutasi</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Ringkasan Mutasi</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchSummary}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm">Total Masuk</span>
          <span className="font-semibold text-green-600">
            {formatRupiah(summary?.total_in ?? 0)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm">Total Keluar</span>
          <span className="font-semibold text-red-600">
            {formatRupiah(summary?.total_out ?? 0)}
          </span>
        </div>

        <div className="border-t pt-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>{summary?.count_in ?? 0} masuk</span>
            <span>{summary?.count_out ?? 0} keluar</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
