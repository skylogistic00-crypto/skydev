import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Filter, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface PengeluaranKas {
  id: string;
  tanggal: string;
  document_number: string;
  payment_type: string;
  service_category?: string;
  service_type?: string;
  account_number: string;
  account_name: string;
  nominal: number;
  keterangan?: string;
  bukti_url?: string;
  created_at: string;
}

export default function PengeluaranKasTable() {
  const [pengeluaran, setPengeluaran] = useState<PengeluaranKas[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchPengeluaran();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("pengeluaran-kas-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kas_transaksi" },
        () => {
          fetchPengeluaran();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPengeluaran = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("kas_transaksi")
        .select("*")
        .eq("payment_type", "Pengeluaran Kas")
        .order("tanggal", { ascending: false });

      if (error) throw error;
      setPengeluaran(data || []);
    } catch (error: any) {
      console.error("Error fetching pengeluaran kas:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengeluaran kas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPengeluaran = pengeluaran.filter((item) => {
    // Date range filter
    if (filterDateFrom || filterDateTo) {
      const itemDate = new Date(item.tanggal);
      if (filterDateFrom) {
        const fromDate = new Date(filterDateFrom);
        if (itemDate < fromDate) return false;
      }
      if (filterDateTo) {
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (itemDate > toDate) return false;
      }
    }

    // Search query filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.document_number?.toLowerCase().includes(query) ||
      item.service_category?.toLowerCase().includes(query) ||
      item.service_type?.toLowerCase().includes(query) ||
      item.account_name?.toLowerCase().includes(query) ||
      item.keterangan?.toLowerCase().includes(query)
    );
  });

  const totalPengeluaran = filteredPengeluaran.reduce(
    (sum, item) => sum + (item.nominal || 0),
    0,
  );

  const exportToCSV = () => {
    const headers = [
      "Tanggal",
      "No. Dokumen",
      "Kategori",
      "Jenis Layanan",
      "Akun",
      "Keterangan",
      "Nominal",
    ];
    const rows = filteredPengeluaran.map((item) => [
      new Date(item.tanggal).toLocaleDateString("id-ID"),
      item.document_number,
      item.service_category || "-",
      item.service_type || "-",
      `${item.account_number} - ${item.account_name}`,
      item.keterangan || "-",
      item.nominal,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pengeluaran-kas-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4 bg-white">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-2xl font-bold text-slate-800">
              💸 Data Pengeluaran Kas
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={filteredPengeluaran.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari dokumen, kategori, akun..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                placeholder="Dari Tanggal"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                placeholder="Sampai Tanggal"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="text-sm text-red-600 font-medium">
                  Total Pengeluaran
                </div>
                <div className="text-2xl font-bold text-red-700 mt-1">
                  Rp {new Intl.NumberFormat("id-ID").format(totalPengeluaran)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-sm text-blue-600 font-medium">
                  Jumlah Transaksi
                </div>
                <div className="text-2xl font-bold text-blue-700 mt-1">
                  {filteredPengeluaran.length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="text-sm text-purple-600 font-medium">
                  Rata-rata per Transaksi
                </div>
                <div className="text-2xl font-bold text-purple-700 mt-1">
                  Rp{" "}
                  {new Intl.NumberFormat("id-ID").format(
                    filteredPengeluaran.length > 0
                      ? totalPengeluaran / filteredPengeluaran.length
                      : 0,
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="font-semibold">Tanggal</TableHead>
                  <TableHead className="font-semibold">No. Dokumen</TableHead>
                  <TableHead className="font-semibold">Kategori</TableHead>
                  <TableHead className="font-semibold">Jenis Layanan</TableHead>
                  <TableHead className="font-semibold">Akun</TableHead>
                  <TableHead className="font-semibold">Keterangan</TableHead>
                  <TableHead className="font-semibold text-right">
                    Nominal
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Bukti
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-gray-500 py-8"
                    >
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredPengeluaran.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-gray-500 py-8"
                    >
                      Tidak ada data pengeluaran kas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPengeluaran.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50">
                      <TableCell>
                        {new Date(item.tanggal).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.document_number}
                      </TableCell>
                      <TableCell>
                        {item.service_category ? (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {item.service_category}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.service_type || (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-mono text-xs text-gray-500">
                            {item.account_number}
                          </div>
                          <div className="font-medium">{item.account_name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {item.keterangan || (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        Rp {new Intl.NumberFormat("id-ID").format(item.nominal)}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.bukti_url ? (
                          <a
                            href={item.bukti_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-sm"
                          >
                            Lihat
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
