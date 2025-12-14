import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { navigateBack } from "@/utils/navigation";

interface CashFlowDetailData {
  id: string;
  entry_date: string;
  description: string;
  jenis_transaksi: string;
  cash_in: number;
  cash_out: number;
  cash_movement: number;
}

interface CashFlowSummary {
  total_cash_in: number;
  total_cash_out: number;
  net_cash_flow: number;
}

export default function CashFlowReport() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cashFlowData, setCashFlowData] = useState<CashFlowDetailData[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary>({
    total_cash_in: 0,
    total_cash_out: 0,
    net_cash_flow: 0,
  });

  // Date filter state
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(
    firstDayOfMonth.toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  useEffect(() => {
    fetchCashFlowData();
  }, []);

  const fetchCashFlowData = async () => {
    setLoading(true);

    try {
      // Fetch from vw_cash_flow_report view with date filter
      const { data, error } = await supabase
        .from("vw_cash_flow_report")
        .select(
          "entry_date, description, jenis_transaksi, cash_in, cash_out, cash_movement",
        )
        .gte("entry_date", startDate)
        .lte("entry_date", endDate)
        .order("entry_date", { ascending: true });

      if (error) throw error;

      // Map data with generated id for table key
      const mappedData: CashFlowDetailData[] = (data || []).map(
        (item, index) => ({
          id: `cf-${index}`,
          entry_date: item.entry_date,
          description: item.description || "-",
          jenis_transaksi: item.jenis_transaksi,
          cash_in: Number(item.cash_in) || 0,
          cash_out: Number(item.cash_out) || 0,
          cash_movement: Number(item.cash_movement) || 0,
        }),
      );

      setCashFlowData(mappedData);

      // Calculate summary
      const totalCashIn = mappedData.reduce(
        (sum, item) => sum + item.cash_in,
        0,
      );
      const totalCashOut = mappedData.reduce(
        (sum, item) => sum + item.cash_out,
        0,
      );
      setSummary({
        total_cash_in: totalCashIn,
        total_cash_out: totalCashOut,
        net_cash_flow: totalCashIn - totalCashOut,
      });

      toast({
        title: "✅ Data berhasil dimuat",
        description: `Laporan arus kas ${startDate} - ${endDate}`,
      });
    } catch (error: any) {
      console.error("❌ Error fetching cash flow:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memuat data arus kas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Card className="max-w-7xl mx-auto bg-white shadow-md rounded-2xl border">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">💰 Laporan Arus Kas</CardTitle>
              <CardDescription>
                Laporan detail arus kas masuk dan keluar per transaksi
              </CardDescription>
            </div>
            <Button
              onClick={() => navigateBack(navigate)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Date Range Filter */}
          <div className="flex flex-wrap items-end gap-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-44 border rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <Calendar className="h-4 w-4" /> End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-44 border rounded-lg"
              />
            </div>
            <Button
              onClick={fetchCashFlowData}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">
                  📊 Ringkasan Periode {formatDate(startDate)} -{" "}
                  {formatDate(endDate)}
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="bg-green-50 border-2 border-green-300 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        💰 Total Cash In
                      </CardTitle>
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-700">
                        {formatRupiah(summary.total_cash_in)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Total penerimaan kas
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-50 border-2 border-red-300 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        💸 Total Cash Out
                      </CardTitle>
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-700">
                        {formatRupiah(summary.total_cash_out)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Total pengeluaran kas
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className={`border-2 shadow-md ${
                      summary.net_cash_flow >= 0
                        ? "bg-blue-50 border-blue-300"
                        : "bg-orange-50 border-orange-300"
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        📈 Net Cash Flow
                      </CardTitle>
                      <DollarSign
                        className={`h-5 w-5 ${
                          summary.net_cash_flow >= 0
                            ? "text-blue-600"
                            : "text-orange-600"
                        }`}
                      />
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`text-2xl font-bold ${
                          summary.net_cash_flow >= 0
                            ? "text-blue-700"
                            : "text-orange-700"
                        }`}
                      >
                        {formatRupiah(summary.net_cash_flow)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {summary.net_cash_flow >= 0 ? "Surplus" : "Defisit"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Transaction Table */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">
                  📋 Detail Transaksi ({cashFlowData.length} transaksi)
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="font-semibold">
                          Entry Date
                        </TableHead>
                        <TableHead className="font-semibold">
                          Description
                        </TableHead>
                        <TableHead className="font-semibold">
                          Jenis Transaksi
                        </TableHead>
                        <TableHead className="font-semibold text-right">
                          Cash In
                        </TableHead>
                        <TableHead className="font-semibold text-right">
                          Cash Out
                        </TableHead>
                        <TableHead className="font-semibold text-right">
                          Cash Movement
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cashFlowData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-gray-500"
                          >
                            Tidak ada data untuk periode yang dipilih
                          </TableCell>
                        </TableRow>
                      ) : (
                        cashFlowData.map((item) => (
                          <TableRow key={item.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                              {formatDate(item.entry_date)}
                            </TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.cash_in > 0
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {item.jenis_transaksi}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                              {item.cash_in > 0
                                ? formatRupiah(item.cash_in)
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right text-red-600 font-medium">
                              {item.cash_out > 0
                                ? formatRupiah(item.cash_out)
                                : "-"}
                            </TableCell>
                            <TableCell
                              className={`text-right font-medium ${
                                item.cash_movement >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatRupiah(item.cash_movement)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
