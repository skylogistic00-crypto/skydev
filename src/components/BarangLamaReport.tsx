import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Search,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import Header from "./Header";
import Navigation from "./Navigation";

interface BarangLama {
  id: string;
  sku: string;
  nama_barang: string;
  tanggal_masuk_lini_1: string;
  tanggal_masuk_lini_2: string;
  tanggal_diambil: string;
  lama_simpan: number;
  hari_di_lini_1: number;
  berat: number;
  volume: number;
  total_biaya_lini_1: number;
  total_biaya_lini_2: number;
  status: string;
  created_at: string;
}

interface PerpindahanLini {
  id: string;
  sku: string;
  nama_barang: string;
  kode_barang: string;
  nomor_dokumen_pabean: string;
  tanggal_masuk_lini_1: string;
  tanggal_pindah_lini_2: string;
  hari_di_lini_1: number;
  berat: number;
  volume: number;
  lokasi: string;
  total_biaya_lini_1: number;
  created_at: string;
}

export default function BarangLamaReport() {
  const { toast } = useToast();
  const [barangLama, setBarangLama] = useState<BarangLama[]>([]);
  const [perpindahanLini, setPerpindahanLini] = useState<PerpindahanLini[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBarangLama();
    fetchPerpindahanLini();

    const channel = supabase
      .channel("report-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "barang_diambil" },
        () => {
          fetchBarangLama();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "perpindahan_lini" },
        () => {
          fetchPerpindahanLini();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBarangLama = async () => {
    try {
      setLoading(true);
      // Fetch data dari barang_diambil yang statusnya "Diambil"
      const { data, error } = await supabase
        .from("barang_diambil")
        .select("*")
        .eq("status", "Diambil")
        .order("tanggal_diambil", { ascending: false });

      if (error) throw error;

      setBarangLama(data || []);
    } catch (error) {
      console.error("Error fetching barang lama:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data barang lama",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPerpindahanLini = async () => {
    try {
      const { data, error } = await supabase
        .from("perpindahan_lini")
        .select("*")
        .order("tanggal_pindah_lini_2", { ascending: false });

      if (error) throw error;

      setPerpindahanLini(data || []);
    } catch (error) {
      console.error("Error fetching perpindahan lini:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data perpindahan lini",
        variant: "destructive",
      });
    }
  };

  const filteredBarangLama = barangLama.filter((item) => {
    const matchSearch =
      item.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const filteredPerpindahan = perpindahanLini.filter((item) => {
    const matchSearch =
      item.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = {
    total: barangLama.length,
    lebih30Hari: barangLama.filter((b) => b.lama_simpan > 30).length,
    lebih60Hari: barangLama.filter((b) => b.lama_simpan > 60).length,
    lebih90Hari: barangLama.filter((b) => b.lama_simpan > 90).length,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Navigation />

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Report Barang Lama & Perpindahan
            </h1>
            <p className="text-slate-600">
              Monitoring lama penyimpanan dan perpindahan barang antar lini
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total Barang di Lini 2
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-600">
                  &gt; 30 Hari
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.lebih30Hari}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-600">
                  &gt; 60 Hari
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.lebih60Hari}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">
                  &gt; 90 Hari
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.lebih90Hari}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="barang-lama" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="barang-lama">Barang Lama</TabsTrigger>
              <TabsTrigger value="perpindahan">Perpindahan Lini</TabsTrigger>
            </TabsList>

            {/* Tab Barang Lama */}
            <TabsContent value="barang-lama" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle>Barang Lama di Lini 2</CardTitle>
                      <CardDescription>
                        Barang yang sudah diambil supplier dari Lini 2
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() =>
                        exportToCSV(
                          filteredBarangLama,
                          "report_barang_lama_lini2",
                        )
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      placeholder="Cari SKU atau nama barang..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Nama Barang</TableHead>
                          <TableHead>Tgl Masuk Lini 1</TableHead>
                          <TableHead>Tgl Masuk Lini 2</TableHead>
                          <TableHead>Hari di Lini 1</TableHead>
                          <TableHead>Hari di Lini 2</TableHead>
                          <TableHead>Total Biaya Lini 1</TableHead>
                          <TableHead>Total Biaya Lini 2</TableHead>
                          <TableHead>Total Biaya</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell
                              colSpan={10}
                              className="text-center py-8"
                            >
                              Loading...
                            </TableCell>
                          </TableRow>
                        ) : filteredBarangLama.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={10}
                              className="text-center py-8 text-slate-500"
                            >
                              Tidak ada barang yang sudah diambil dari Lini 2
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredBarangLama.map((item) => {
                            const totalBiaya =
                              (item.total_biaya_lini_1 || 0) +
                              (item.total_biaya_lini_2 || 0);
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="font-mono text-sm">
                                  {item.sku}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {item.nama_barang}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {item.tanggal_masuk_lini_1
                                      ? new Date(
                                          item.tanggal_masuk_lini_1,
                                        ).toLocaleDateString("id-ID")
                                      : "-"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-400" />
                                    {item.tanggal_masuk_lini_2
                                      ? new Date(
                                          item.tanggal_masuk_lini_2,
                                        ).toLocaleDateString("id-ID")
                                      : "-"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-semibold text-slate-600">
                                    {item.hari_di_lini_1 || "-"} hari
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="font-semibold text-blue-600">
                                    {item.lama_simpan || "-"} hari
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {item.total_biaya_lini_1
                                    ? formatCurrency(item.total_biaya_lini_1)
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {item.total_biaya_lini_2
                                    ? formatCurrency(item.total_biaya_lini_2)
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  <span className="font-bold text-green-600">
                                    {formatCurrency(totalBiaya)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="bg-gray-100 text-gray-800"
                                  >
                                    Diambil
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Perpindahan Lini */}
            <TabsContent value="perpindahan" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle>Perpindahan Barang Lini 1 ke Lini 2</CardTitle>
                      <CardDescription>
                        Riwayat perpindahan barang dari Lini 1 ke Lini 2
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() =>
                        exportToCSV(
                          filteredPerpindahan,
                          "report_perpindahan_lini",
                        )
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      placeholder="Cari SKU atau nama barang..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Nama Barang</TableHead>
                          <TableHead>Tgl Masuk Lini 1</TableHead>
                          <TableHead>Tgl Masuk Lini 2</TableHead>
                          <TableHead>Hari di Lini 1</TableHead>
                          <TableHead>Total Biaya</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              Loading...
                            </TableCell>
                          </TableRow>
                        ) : filteredPerpindahan.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-slate-500"
                            >
                              Tidak ada data perpindahan barang
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredPerpindahan.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-mono text-sm">
                                {item.sku}
                              </TableCell>
                              <TableCell className="font-medium">
                                {item.nama_barang}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-slate-400" />
                                  {item.tanggal_masuk_lini_1
                                    ? new Date(
                                        item.tanggal_masuk_lini_1,
                                      ).toLocaleDateString("id-ID")
                                    : "-"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-blue-400" />
                                  {new Date(
                                    item.tanggal_pindah_lini_2,
                                  ).toLocaleDateString("id-ID")}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-semibold text-blue-600">
                                  {item.hari_di_lini_1 || "-"} hari
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="font-bold text-green-600">
                                  {item.total_biaya_lini_1
                                    ? formatCurrency(item.total_biaya_lini_1)
                                    : "-"}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
