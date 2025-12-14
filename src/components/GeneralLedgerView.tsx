import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface GeneralLedgerEntry {
  transaction_date: string;
  description: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function GeneralLedgerView() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<GeneralLedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    fetchAccounts();
    fetchEntries();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [selectedAccount, startDate, endDate]);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("account_code, account_name")
      .order("account_code");

    if (!error && data) {
      setAccounts(data);
    }
  };

  const fetchEntries = async () => {
    setLoading(true);

    let query = supabase
      .from("view_general_ledger")
      .select("*")
      .order("date", { ascending: true });

    if (selectedAccount !== "all") {
      query = query.eq("account_code", selectedAccount);
    }

    if (startDate) {
      query = query.gte("date", startDate);
    }

    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data, error } = await query;


    if (error) {
      toast({
        title: "Error",
        description: `Gagal memuat data general ledger: ${error.message}`,
        variant: "destructive",
      });
    } else {
      // Calculate running balance
      let balance = 0;
      const entriesWithBalance = (data || []).map((entry: any) => {
        balance += (entry.debit || 0) - (entry.credit || 0);
        return {
          transaction_date: entry.date,
          description: entry.description,
          account_code: entry.account_code,
          account_name: entry.account_name || "",
          account_type: entry.account_type || "",
          debit: entry.debit || 0,
          credit: entry.credit || 0,
          balance,
        };
      });
      setEntries(entriesWithBalance);
    }

    setLoading(false);
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const exportToCSV = () => {
    const headers = ["Tanggal", "Deskripsi", "Kode Akun", "Nama Akun", "Debit", "Kredit", "Saldo"];
    const rows = entries.map(e => [
      e.transaction_date,
      e.description,
      e.account_code,
      e.account_name,
      e.debit,
      e.credit,
      e.balance,
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `general-ledger-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Akun
          </label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedAccount === "all"
                  ? "Semua Akun"
                  : accounts.find((acc) => acc.account_code === selectedAccount)
                  ? `${accounts.find((acc) => acc.account_code === selectedAccount)?.account_code} - ${accounts.find((acc) => acc.account_code === selectedAccount)?.account_name}`
                  : "Pilih Akun"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <div className="p-2">
                <Input
                  placeholder="Ketik kode atau nama akun..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="mb-2"
                />
                <div className="max-h-[300px] overflow-auto">
                  <div
                    className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
                    onClick={() => {
                      setSelectedAccount("all");
                      setSearchValue("");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedAccount === "all" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    Semua Akun
                  </div>
                  {Array.isArray(accounts) &&
                    accounts
                      .filter((acc) => 
                        acc && 
                        acc.account_code && 
                        (searchValue === "" || 
                         acc.account_code.toLowerCase().includes(searchValue.toLowerCase()) ||
                         (acc.account_name && (acc.account_name ?? "").toLowerCase().includes(searchValue.toLowerCase())))
                      )
                      .map((acc) => (
                        <div
                          key={acc.account_code}
                          className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
                          onClick={() => {
                            setSelectedAccount(acc.account_code);
                            setSearchValue("");
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedAccount === acc.account_code
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-mono text-sm">{acc.account_code}</span>
                            <span className="text-xs text-slate-600">{acc.account_name}</span>
                          </div>
                        </div>
                      ))}
                  {Array.isArray(accounts) &&
                    accounts.filter((acc) => 
                      acc && 
                      acc.account_code && 
                      (searchValue === "" || 
                       acc.account_code.toLowerCase().includes(searchValue.toLowerCase()) ||
                       (acc.account_name && (acc.account_name ?? "").toLowerCase().includes(searchValue.toLowerCase())))
                    ).length === 0 && (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        Akun tidak ditemukan.
                      </div>
                    )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Dari Tanggal
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Sampai Tanggal
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <Button onClick={exportToCSV} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Kode Akun</TableHead>
                <TableHead>Nama Akun</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Kredit</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{new Date(entry.transaction_date).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="font-mono">{entry.account_code}</TableCell>
                    <TableCell>{entry.account_name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.debit > 0 ? formatRupiah(entry.debit) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.credit > 0 ? formatRupiah(entry.credit) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatRupiah(entry.balance)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary */}
      {entries.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-slate-600">Total Debit</div>
            <div className="text-lg font-bold text-slate-800">
              {formatRupiah(entries.reduce((sum, e) => sum + e.debit, 0))}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600">Total Kredit</div>
            <div className="text-lg font-bold text-slate-800">
              {formatRupiah(entries.reduce((sum, e) => sum + e.credit, 0))}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600">Saldo Akhir</div>
            <div className="text-lg font-bold text-slate-800">
              {formatRupiah(entries[entries.length - 1]?.balance || 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}