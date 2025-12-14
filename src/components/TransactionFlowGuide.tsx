import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, FileText, ArrowRight, Table } from "lucide-react";

interface TableInfo {
  name: string;
  description: string;
  fields: string[];
  color: string;
}

interface ReportInfo {
  name: string;
  description: string;
  path: string;
  icon: string;
}

export default function TransactionFlowGuide() {
  const tables: TableInfo[] = [
    {
      name: "journal_entries",
      description: "Menyimpan semua jurnal transaksi (Debit & Credit)",
      fields: ["journal_ref", "debit_account", "credit_account", "debit", "credit", "description", "tanggal"],
      color: "bg-blue-100 text-blue-800"
    },
    {
      name: "kas_transaksi",
      description: "Menyimpan transaksi kas (Cash Book)",
      fields: ["payment_type", "service_category", "account_number", "nominal", "tanggal", "keterangan"],
      color: "bg-green-100 text-green-800"
    },
    {
      name: "general_ledger",
      description: "Buku besar - agregasi dari journal entries",
      fields: ["account_code", "account_name", "debit", "credit", "balance", "transaction_date"],
      color: "bg-purple-100 text-purple-800"
    }
  ];

  const reports: ReportInfo[] = [
    {
      name: "Cash Book",
      description: "Laporan kas masuk dan keluar",
      path: "/cash-book",
      icon: "💰"
    },
    {
      name: "General Ledger",
      description: "Buku besar per akun COA",
      path: "/general-ledger",
      icon: "📒"
    },
    {
      name: "Trial Balance",
      description: "Neraca saldo (Debit = Credit)",
      path: "/trial-balance",
      icon: "⚖️"
    },
    {
      name: "Profit & Loss",
      description: "Laporan laba rugi",
      path: "/profit-loss",
      icon: "📊"
    },
    {
      name: "Balance Sheet",
      description: "Neraca (Aset, Kewajiban, Ekuitas)",
      path: "/balance-sheet",
      icon: "📈"
    },
    {
      name: "Cash Flow",
      description: "Laporan arus kas",
      path: "/cash-flow",
      icon: "💸"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Database className="h-8 w-8 text-blue-600" />
              Alur Transaksi Keuangan
            </CardTitle>
            <CardDescription className="text-lg">
              Panduan lengkap: Transaksi masuk ke tabel mana dan di mana melihat report-nya
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Flow Diagram */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-blue-600" />
              Alur Data Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 text-center">
                <div className="bg-blue-500 text-white rounded-lg p-4 shadow-md">
                  <p className="font-bold text-lg">1. Input Transaksi</p>
                  <p className="text-sm">TransaksiKeuanganForm</p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-slate-400 rotate-90 md:rotate-0" />
              <div className="flex-1 text-center">
                <div className="bg-green-500 text-white rounded-lg p-4 shadow-md">
                  <p className="font-bold text-lg">2. Financial Engine</p>
                  <p className="text-sm">Mapping COA & Rules</p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-slate-400 rotate-90 md:rotate-0" />
              <div className="flex-1 text-center">
                <div className="bg-purple-500 text-white rounded-lg p-4 shadow-md">
                  <p className="font-bold text-lg">3. Save to Tables</p>
                  <p className="text-sm">Journal + Cash Book</p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-slate-400 rotate-90 md:rotate-0" />
              <div className="flex-1 text-center">
                <div className="bg-orange-500 text-white rounded-lg p-4 shadow-md">
                  <p className="font-bold text-lg">4. View Reports</p>
                  <p className="text-sm">Financial Reports</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tables Section */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Table className="h-5 w-5 text-blue-600" />
              Tabel Database
            </CardTitle>
            <CardDescription>
              Transaksi keuangan disimpan di tabel-tabel berikut:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tables.map((table, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Badge className={`${table.color} font-mono text-sm mb-2`}>
                      {table.name}
                    </Badge>
                    <p className="text-slate-700">{table.description}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded p-3">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Fields:</p>
                  <div className="flex flex-wrap gap-2">
                    {table.fields.map((field, idx) => (
                      <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-slate-200 font-mono">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Reports Section */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Laporan Keuangan
            </CardTitle>
            <CardDescription>
              Anda bisa melihat report di halaman-halaman berikut:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow hover:border-blue-300">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{report.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800">{report.name}</h3>
                      <p className="text-sm text-slate-600">{report.description}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.location.href = report.path}
                  >
                    Lihat Report →
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Types Mapping */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Mapping Jenis Transaksi → Tabel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Badge className="bg-blue-600 text-white">Penjualan Jasa</Badge>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-mono">journal_entries</span>
                <span className="text-slate-400">+</span>
                <span className="text-sm font-mono">kas_transaksi</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Badge className="bg-green-600 text-white">Penjualan Barang</Badge>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-mono">journal_entries (2x)</span>
                <span className="text-slate-400">+</span>
                <span className="text-sm font-mono">kas_transaksi</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Badge className="bg-purple-600 text-white">Penerimaan Kas</Badge>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-mono">journal_entries</span>
                <span className="text-slate-400">+</span>
                <span className="text-sm font-mono">kas_transaksi</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Badge className="bg-orange-600 text-white">Pengeluaran Kas</Badge>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-mono">journal_entries</span>
                <span className="text-slate-400">+</span>
                <span className="text-sm font-mono">kas_transaksi</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <Badge className="bg-red-600 text-white">Pembelian Barang</Badge>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-mono">journal_entries</span>
                <span className="text-slate-400">+</span>
                <span className="text-sm font-mono">kas_transaksi (jika cash)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
