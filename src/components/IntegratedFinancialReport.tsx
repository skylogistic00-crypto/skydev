import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Download,
  Filter,
  Search,
  ArrowLeft,
  FileText,
  ChevronDown,
  ChevronRight,
  Trash2,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FinancialReportData {
  report_type: string;
  section: string;
  account_header: string;
  account_code: string;
  account_name: string;
  debit_total: number;
  credit_total: number;
  amount: number;
}

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  debit_account: string;
  credit_account: string;
  debit: number;
  credit: number;
  created_at: string;
  journal_ref?: string;
  debit_account_name?: string;
  credit_account_name?: string;
}

interface COAAccount {
  id: string;
  account_code: string;
  account_name: string;
  level: number;
  parent_code: string | null;
  account_type: string;
}

interface GLTransaction {
  date: string;
  description: string;
  debit: number;
  credit: number;
  entry_id: string;
  created_at?: string;
  journal_ref?: string;
  akun_lawan?: string;
}

export default function IntegratedFinancialReport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<FinancialReportData[]>([]);
  const [filteredData, setFilteredData] = useState<FinancialReportData[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loadingJournal, setLoadingJournal] = useState(false);
  const [deletingRef, setDeletingRef] = useState<string | null>(null);
  const [coaAccounts, setCOAAccounts] = useState<COAAccount[]>([]);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [loadingGL, setLoadingGL] = useState(false);

  const [reportType, setReportType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [journalStartDate, setJournalStartDate] = useState<string>("");
  const [journalEndDate, setJournalEndDate] = useState<string>("");
  const [journalDescriptionQuery, setJournalDescriptionQuery] = useState<string>("");
  const [journalJenisTransaksi, setJournalJenisTransaksi] = useState<string>("ALL");
  const navigate = useNavigate();

  useEffect(() => {
    fetchReportData();
    fetchJournalEntries();
    fetchCOAAccounts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reportType, searchQuery, reportData]);

  useEffect(() => {
    fetchJournalEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalStartDate, journalEndDate, journalJenisTransaksi]);

  const fetchReportData = async () => {
    setLoading(true);

    try {
      // First, fetch all chart_of_accounts to build parent hierarchy
      const { data: coaData, error: coaError } = await supabase
        .from("chart_of_accounts")
        .select("account_code, account_name, level, parent_id");

      if (coaError) {
        toast({
          title: "Error",
          description: `Gagal memuat COA: ${coaError.message}`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Build a map for quick lookup
      const coaMap = new Map(
        coaData?.map((coa) => [coa.account_code, coa]) || [],
      );

      // Fetch from general_ledger without relying on Supabase relationship
      const { data, error } = await supabase
        .from("general_ledger")
        .select("*")
        .order("account_code", { ascending: true });

      if (error) {
        toast({
          title: "Error",
          description: `Gagal memuat data laporan keuangan: ${error.message}`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log("📊 Data from general_ledger:", data);

      // Aggregate data by account_code
      const aggregated = aggregateGeneralLedgerData(data || [], coaMap);
      setReportData(aggregated);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setLoading(false);
    }
  };

  const aggregateGeneralLedgerData = (
    glData: any[],
    coaMap: Map<string, any>,
  ): FinancialReportData[] => {
    const grouped = new Map<string, FinancialReportData>();

    // Helper function to find parent account with level 1 or 2
    const findAccountHeader = (accountCode: string): string => {
      let currentCode = accountCode;
      let iterations = 0;
      const maxIterations = 10; // Prevent infinite loops

      while (currentCode && iterations < maxIterations) {
        const account = coaMap.get(currentCode);
        if (!account) break;

        // If level is 1 or 2, return this account name
        if (account.level === 1 || account.level === 2) {
          return account.account_name;
        }

        // Move to parent
        if (account.parent_id) {
          currentCode = account.parent_id;
        } else {
          break;
        }
        iterations++;
      }

      // Fallback to account type if no parent found
      const account = coaMap.get(accountCode);
      return account?.account_name || "Unknown";
    };

    glData.forEach((entry) => {
      const accountCode = entry.account_code;
      const accountInfo = entry.chart_of_accounts;
      const accountName = accountInfo?.account_name || "Unknown Account";
      const accountType = accountInfo?.account_type || "Other";

      // Find the account header from level 1 or 2 parent
      const accountHeader = findAccountHeader(accountCode);

      // Determine report type and section based on account type
      let reportTypeValue = "Other";
      let section = "Other";

      if (accountType === "Aset") {
        reportTypeValue = "Balance Sheet";
        section = "Assets";
      } else if (accountType === "Kewajiban") {
        reportTypeValue = "Balance Sheet";
        section = "Liabilities";
      } else if (accountType === "Ekuitas") {
        reportTypeValue = "Balance Sheet";
        section = "Equity";
      } else if (accountType === "Pendapatan") {
        reportTypeValue = "Profit & Loss";
        section = "Revenue";
      } else if (accountType === "Beban Pokok Penjualan") {
        reportTypeValue = "Profit & Loss";
        section = "Cost of Goods Sold";
      } else if (accountType === "Beban Operasional") {
        reportTypeValue = "Profit & Loss";
        section = "Operating Expenses";
      } else if (accountType === "Pendapatan & Beban Lain-lain") {
        reportTypeValue = "Profit & Loss";
        section = "Other Income/Expenses";
      }

      const key = accountCode;

      if (!grouped.has(key)) {
        grouped.set(key, {
          report_type: reportTypeValue,
          section: section,
          account_header: accountHeader,
          account_code: accountCode,
          account_name: accountName,
          debit_total: 0,
          credit_total: 0,
          amount: 0,
        });
      }

      const item = grouped.get(key)!;
      item.debit_total += parseFloat(entry.debit || 0);
      item.credit_total += parseFloat(entry.credit || 0);
      item.amount = item.debit_total - item.credit_total;
    });

    return Array.from(grouped.values());
  };

  const applyFilters = () => {
    let filtered = [...reportData];

    // Filter by report type
    if (reportType !== "ALL") {
      filtered = filtered.filter((item) => item.report_type === reportType);
    }

    // Filter by account name
    if (searchQuery.trim()) {
      filtered = filtered.filter((item) =>
        item.account_name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredData(filtered);
  };

  const fetchJournalEntries = async () => {
    setLoadingJournal(true);
    try {
      let query = supabase
        .from("journal_entries_remaining_balance")
        .select(
          "*, transaction_date, journal_ref, source_id, account_code, account_name, description, debit, credit, debit_account_code, debit_account_name, credit_account_code, credit_account_name, remaining_balance",
        )
        // Show newest first in Journal Entries table.
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });

      if (journalStartDate) {
        query = query.gte("transaction_date", journalStartDate);
      }
      if (journalEndDate) {
        query = query.lte("transaction_date", journalEndDate);
      }

      const { data: journalData, error: journalError } = await query;

      if (journalError) {
        toast({
          title: "Error",
          description: `Gagal memuat journal entries: ${journalError.message}`,
          variant: "destructive",
        });
        return;
      }

      const { data: coaData, error: coaError } = await supabase
        .from("chart_of_accounts")
        .select("account_code, account_name");

      if (coaError) {
        console.error("Error fetching COA:", coaError);
      }

      // Create a map for quick lookup
      const coaMap = new Map(
        coaData?.map((coa) => [coa.account_code, coa.account_name]) || [],
      );

      // Enrich journal entries with account names and jenis_transaksi
      const enrichedEntries =
        journalData?.map((entry) => {
          // Determine jenis_transaksi (do not depend on reference_type)
          const jenisTransaksi =
            entry.transaction_type || entry.jenis_transaksi || entry.reference_type || "-";

          return {
            ...entry,
            // Ensure UI uses `description` consistently
            description:
              (entry as any).description ??
              (entry as any).deskripsi ??
              (entry as any).memo ??
              (entry as any).keterangan ??
              "",
            debit_account_name:
              entry.debit_account_name ||
              coaMap.get(entry.debit_account_code || entry.debit_account) ||
              "-",
            credit_account_name:
              entry.credit_account_name ||
              coaMap.get(entry.credit_account_code || entry.credit_account) ||
              "-",
            jenis_transaksi: jenisTransaksi,
          };
        }) || [];

      const filteredByJenis =
        journalJenisTransaksi === "ALL"
          ? enrichedEntries
          : enrichedEntries.filter(
              (e: any) =>
                (e.transaction_type || e.jenis_transaksi || "-") ===
                journalJenisTransaksi,
            );

      setJournalEntries(filteredByJenis);
    } catch (err) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memuat journal entries",
        variant: "destructive",
      });
    } finally {
      setLoadingJournal(false);
    }
  };

  const deleteJournalEntry = async (journalRef?: string | null, referenceType?: string, referenceId?: string) => {
    const ref = (journalRef || "").trim();

    if (!ref) {
      toast({
        title: "Error",
        description: "Journal reference kosong. Tidak bisa menghapus karena journal_ref tidak tersedia.",
        variant: "destructive",
      });
      return;
    }

    const entriesToDelete = journalEntries.filter((e: any) => (e.journal_ref || "").trim() === ref);

    const refTypeFromRows = Array.from(
      new Set(entriesToDelete.map((e: any) => e.reference_type).filter(Boolean)),
    ) as string[];

    const refIdFromRows = Array.from(
      new Set(entriesToDelete.map((e: any) => e.reference_id).filter(Boolean)),
    ) as string[];

    const sourceIdFromRows = Array.from(
      new Set(entriesToDelete.map((e: any) => e.source_id).filter(Boolean)),
    ) as string[];

    const sourceIds = sourceIdFromRows.length > 0 ? sourceIdFromRows : refIdFromRows;

    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus semua journal_entries dengan journal_ref: ${ref}?\n\n` +
          `Akan menghapus ${entriesToDelete.length} baris journal entries.\n` +
          `Juga akan mencoba menghapus data sumber jika source_id / reference_id tersedia.`,
      )
    ) {
      return;
    }

    setDeletingRef(ref);
    try {
      const resolvedRefType = referenceType || refTypeFromRows[0];

      if (resolvedRefType && sourceIds.length > 0) {
        let sourceTable = "";

        const refTypeLower = String(resolvedRefType).toLowerCase();

        if (refTypeLower.includes("cash_disbursement") || resolvedRefType === "CASH_DISBURSEMENT") {
          sourceTable = "cash_disbursement";
        } else if (refTypeLower.includes("cash_receipt") || resolvedRefType === "CASH_RECEIPTS") {
          sourceTable = "cash_receipts";
        } else if (refTypeLower.includes("purchase") || resolvedRefType === "PURCHASE") {
          sourceTable = "purchase_transactions";
        } else if (refTypeLower.includes("sales") || resolvedRefType === "SALES") {
          sourceTable = "sales_transactions";
        } else if (refTypeLower.includes("bank_mutation") || resolvedRefType === "BANK_MUTATION") {
          sourceTable = "bank_mutations";
        } else if (refTypeLower.includes("employee_advance") || resolvedRefType === "EMPLOYEE_ADVANCE") {
          sourceTable = "employee_advances";
        } else if (refTypeLower.includes("internal_usage") || resolvedRefType === "INTERNAL_USAGE") {
          sourceTable = "internal_usage";
        } else if (refTypeLower.includes("general_journal") || resolvedRefType === "GENERAL_JOURNAL") {
          sourceTable = "general_journal";
        }

        if (sourceTable) {
          const { error: sourceError } = await supabase
            .from(sourceTable)
            .delete()
            .in("id", sourceIds);

          if (sourceError) {
            toast({
              title: "Warning",
              description: `Gagal menghapus data sumber: ${sourceError.message}`,
              variant: "destructive",
            });
          }
        }
      }

      const { error } = await supabase.from("journal_entries").delete().eq("journal_ref", ref);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Journal entries (group journal_ref) dan data sumber berhasil dihapus",
      });

      await fetchJournalEntries();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menghapus journal entry: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setDeletingRef(null);
    }
  };

  const fetchCOAAccounts = async () => {
    setLoadingGL(true);
    try {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name, level, parent_code, account_type")
        .order("account_code", { ascending: true });

      if (error) {
        toast({
          title: "Error",
          description: `Gagal memuat COA: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("COA Accounts loaded:", data);
      console.log("Level 1 accounts:", data?.filter(acc => acc.level === 1));
      setCOAAccounts(data || []);
    } catch (err) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memuat COA",
        variant: "destructive",
      });
    } finally {
      setLoadingGL(false);
    }
  };

  const toggleAccount = (accountCode: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountCode)) {
      newExpanded.delete(accountCode);
    } else {
      newExpanded.add(accountCode);
    }
    setExpandedAccounts(newExpanded);
  };

  const getChildAccounts = (parentCode: string | null, level: number) => {
    console.log(`Looking for children of ${parentCode} at level ${level}`);
    const children = coaAccounts.filter(
      (acc) => {
        const matches = acc.parent_code === parentCode && acc.level === level;
        if (matches) {
          console.log(`Found child: ${acc.account_code} - ${acc.account_name}`);
        }
        return matches;
      }
    );
    console.log(`Total children found: ${children.length}`);
    return children;
  };

  const getTransactionsForAccount = (accountCode: string): GLTransaction[] => {
    const transactions: GLTransaction[] = [];

    journalEntries.forEach((entry: any) => {
      const code =
        (entry.account_code ||
          entry.debit_account_code ||
          entry.credit_account_code ||
          entry.accountCode ||
          "") as string;
      if (!code) return;

      if (code !== accountCode) return;

      const debitVal = Number(entry.debit || 0);
      const creditVal = Number(entry.credit || 0);

      const akunLawan = debitVal > 0
        ? (entry.credit_account_name || entry.credit_account_code || entry.credit_account || "-")
        : (entry.debit_account_name || entry.debit_account_code || entry.debit_account || "-");

      transactions.push({
        date: entry.transaction_date || entry.tanggal || entry.entry_date,
        created_at: entry.created_at,
        journal_ref: entry.journal_ref,
        akun_lawan: akunLawan,
        description: entry.description || entry.entry_number || entry.journal_ref,
        debit: debitVal,
        credit: creditVal,
        entry_id: entry.id,
      });
    });

    return transactions.sort((a: any, b: any) => {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();
      if (aDate !== bDate) return aDate - bDate;

      const aRef = String(a.journal_ref || "");
      const bRef = String(b.journal_ref || "");
      const refCmp = aRef.localeCompare(bRef);
      if (refCmp !== 0) return refCmp;

      const aCreated = new Date(a.created_at || 0).getTime();
      const bCreated = new Date(b.created_at || 0).getTime();
      if (aCreated !== bCreated) return aCreated - bCreated;

      // Final deterministic tiebreaker
      return String(a.entry_id || "").localeCompare(String(b.entry_id || ""));
    });
  };

  // Helper function to calculate total debit/credit for an account and all its children
  const calculateAccountTotals = (accountCode: string, level: number): { totalDebit: number; totalCredit: number } => {
    if (level === 3) {
      // Level 3: get direct transactions
      const transactions = getTransactionsForAccount(accountCode);
      return {
        totalDebit: transactions.reduce((sum, t) => sum + t.debit, 0),
        totalCredit: transactions.reduce((sum, t) => sum + t.credit, 0)
      };
    } else {
      // Level 1 or 2: sum up all child accounts
      const children = getChildAccounts(accountCode, level + 1);
      let totalDebit = 0;
      let totalCredit = 0;
      
      children.forEach(child => {
        const childTotals = calculateAccountTotals(child.account_code, level + 1);
        totalDebit += childTotals.totalDebit;
        totalCredit += childTotals.totalCredit;
      });
      
      return { totalDebit, totalCredit };
    }
  };

  const renderGLAccount = (account: COAAccount, level: number) => {
    const childAccounts = getChildAccounts(account.account_code, level + 1);
    const hasChildren = childAccounts.length > 0;
    const isExpanded = expandedAccounts.has(account.account_code);
    const transactions = level === 3 ? getTransactionsForAccount(account.account_code) : [];
    const shouldShowTransactions = level === 3 && isExpanded;
    
    // Calculate totals for this account (including children for level 1 & 2)
    const { totalDebit, totalCredit } = calculateAccountTotals(account.account_code, level);
    
    // Balance: match Journal Entries concept (Saldo = Debit - Kredit)
    const balance = totalDebit - totalCredit;

    return (
      <div key={account.id}>
        <div
          className={`grid grid-cols-[40px_140px_1fr_160px_160px_160px]
          items-center py-2 px-4 hover:bg-gray-50 cursor-pointer border-b 
          ${level === 1 ? "bg-blue-50 font-bold" : level === 2 ? "bg-gray-50 font-semibold" : ""
          }`}
          style={{ paddingLeft: `${level * 20}px` }}
          onClick={() => toggleAccount(account.account_code)}
        >
          {/* expand icon */}
          <div className="flex justify-center">
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              ))}
            </div>

          {/* kode akun */}
          <div className="font-mono whitespace-nowrap">
           {account.account_code}
          </div>

          {/* nama akun */}
          <div className="truncate">
            {account.account_name}
          </div>

          {/* total debit */}
          <div className="text-right font-mono tabular-nums whitespace-nowrap">
            {totalDebit !== 0 ? formatRupiah(totalDebit) : "-"}
          </div>

          {/* total kredit */}
          <div className="text-right font-mono tabular-nums whitespace-nowrap">
            {totalCredit !== 0 ? formatRupiah(totalCredit) : "-"}
          </div>

          {/* saldo */}
          <div className="text-right font-mono tabular-nums whitespace-nowrap">
            {formatRupiah(Math.abs(balance))}
          </div>
        </div>

        {shouldShowTransactions && transactions.length > 0 && (
          <div className="bg-gray-50 border-b">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="w-32">Tanggal</TableHead>
                  <TableHead className="w-40">Ref</TableHead>
                  <TableHead>Akun Lawan / Deskripsi</TableHead>
                  <TableHead className="text-right w-32">Debit</TableHead>
                  <TableHead className="text-right w-32">Kredit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((trans, idx) => {
                  // Calculate running balance
                  const previousTransactions = transactions.slice(0, idx + 1);
                  const runningDebit = previousTransactions.reduce((sum, t) => sum + t.debit, 0);
                  const runningCredit = previousTransactions.reduce((sum, t) => sum + t.credit, 0);
                  
                  const runningBalance = runningDebit - runningCredit;
                  
                  return (
                    <TableRow key={`${trans.entry_id}-${idx}`}>
                      <TableCell className="font-mono text-sm">
                        {new Date(trans.date).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {trans.journal_ref || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium">
                          {trans.akun_lawan || "-"}
                        </div>

                          {trans.description && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {trans.description}
                        </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {trans.debit > 0 ? formatRupiah(trans.debit) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {trans.credit > 0 ? formatRupiah(trans.credit) : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {isExpanded && hasChildren && (
          <div>
            {childAccounts.map((child) =>
              renderGLAccount(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalDebit = () =>
    filteredData.reduce((sum, item) => sum + (item.debit_total || 0), 0);

  const getTotalCredit = () =>
    filteredData.reduce((sum, item) => sum + (item.credit_total || 0), 0);

  const getTotalAmount = () =>
    filteredData.reduce((sum, item) => sum + (item.amount || 0), 0);

  const exportToCSV = () => {
    const csv = [
      [
        "Report Type",
        "Section",
        "Account Header",
        "Account Code",
        "Account Name",
        "Debit Total",
        "Credit Total",
        "Amount",
      ],
      ...filteredData.map((item) => [
        item.report_type,
        item.section,
        item.account_header,
        item.account_code,
        item.account_name,
        item.debit_total,
        item.credit_total,
        item.amount,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan_keuangan_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toast({
      title: "✅ Berhasil",
      description: "Laporan berhasil diexport ke CSV",
    });
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-0 space-y-4">
      {/* Header with gradient */}
      <div className="border-b bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 shadow-lg">
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
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Laporan Keuangan
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* General Ledger (Buku Besar) */}
      <Card className="max-w-7xl mx-auto rounded-2xl shadow-md">
        <CardHeader className="p-4">
          <CardTitle className="text-2xl">General Ledger (Buku Besar)</CardTitle>
          <CardDescription>
            Struktur Akun Berdasarkan COA dengan Transaksi per Akun
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {loadingGL ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 grid grid-cols-[40px_140px_1fr_160px_160px_160px]
                items-center py-2 px-4 font-bold border-b"
              > 
                <span></span>
                <span className="font-mono">Kode Akun</span>
                <span>Nama Akun</span>
                <span className="text-right">Total Debit</span>
                <span className="text-right">Total Kredit</span>
                <span className="text-right">Saldo</span>
              </div>
              {coaAccounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada data COA
                </div>
              ) : (
                <div>
                  {coaAccounts.filter(acc => acc.level === 1).map((account) =>
                    renderGLAccount(account, 1)
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Journal Entries Table */}
      <Card className="max-w-7xl mx-auto rounded-2xl shadow-md mt-6">
        <CardHeader className="p-4">
          <CardTitle className="text-2xl">Journal Entries</CardTitle>
          <CardDescription>Data Journal Entries</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {loadingJournal ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <h3 className="text-lg font-semibold">
                  Data Journal Entries ({journalEntries.length} entries)
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div className="space-y-1">
                    <Label htmlFor="journalStartDate">Dari Tanggal</Label>
                    <Input
                      id="journalStartDate"
                      type="date"
                      value={journalStartDate}
                      onChange={(e) => setJournalStartDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="journalEndDate">Sampai Tanggal</Label>
                    <Input
                      id="journalEndDate"
                      type="date"
                      value={journalEndDate}
                      onChange={(e) => setJournalEndDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="journalDescriptionQuery">Deskripsi</Label>
                    <Input
                      id="journalDescriptionQuery"
                      type="text"
                      value={journalDescriptionQuery}
                      onChange={(e) => setJournalDescriptionQuery(e.target.value)}
                      placeholder="Cari deskripsi..."
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="journalJenisTransaksi">Jenis Transaksi</Label>
                    <Select
                      value={journalJenisTransaksi}
                      onValueChange={(v) => setJournalJenisTransaksi(v)}
                    >
                      <SelectTrigger id="journalJenisTransaksi" className="h-9">
                        <SelectValue placeholder="Semua" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Semua</SelectItem>
                        <SelectItem value="Penerimaan">Penerimaan</SelectItem>
                        <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                        <SelectItem value="Pembelian">Pembelian</SelectItem>
                        <SelectItem value="Penjualan">Penjualan</SelectItem>
                        <SelectItem value="Pemakaian Internal">Pemakaian Internal</SelectItem>
                        <SelectItem value="Kasbon Karyawan">Kasbon Karyawan</SelectItem>
                        <SelectItem value="Uang Muka">Uang Muka</SelectItem>
                        <SelectItem value="Top Up Uang Muka">Top Up Uang Muka</SelectItem>
                        <SelectItem value="Penyelesaian Uang Muka">Penyelesaian Uang Muka</SelectItem>
                        <SelectItem value="Setoran Modal">Setoran Modal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead className="w-16">Nomor</TableHead>
                      <TableHead className="w-32">Tanggal</TableHead>
                      <TableHead className="w-28">Jenis Transaksi</TableHead>
                      <TableHead>Kode Akun</TableHead>
                      <TableHead>Nama Akun</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Bukti</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Kredit</TableHead>
    
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {journalEntries.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="text-center py-8 text-gray-500"
                        >
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    ) : (
                      // Group by journal_ref so entries appear as pairs/sets
                      Object.entries(
                        journalEntries
                          .filter((entry: any) => {
                            const q = journalDescriptionQuery.trim().toLowerCase();
                            if (!q) return true;
                            return (entry.description || "").toLowerCase().includes(q);
                          })
                          .reduce((acc: Record<string, any[]>, entry: any) => {
                            const key = (entry.journal_ref || entry.id || "").toString();
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(entry);
                            return acc;
                          }, {}),
                      ).flatMap(([ref, entries], groupIndex) =>
                        [...entries]
                          // Keep deterministic order inside one journal_ref:
                          // 1) debit row first
                          // 2) then credit row
                          // 3) then by created_at/id to avoid random flip
                          .sort((a: any, b: any) => {
                            const aDebit = Number(a.debit || 0) > 0;
                            const bDebit = Number(b.debit || 0) > 0;
                            if (aDebit !== bDebit) return aDebit ? -1 : 1;

                            const aCredit = Number(a.credit || 0) > 0;
                            const bCredit = Number(b.credit || 0) > 0;
                            if (aCredit !== bCredit) return aCredit ? 1 : -1;

                            const aCreated = new Date((a as any).created_at || 0).getTime();
                            const bCreated = new Date((b as any).created_at || 0).getTime();
                            if (aCreated !== bCreated) return aCreated - bCreated;

                            return String(a.id || "").localeCompare(String(b.id || ""));
                          })
                          .map((entry: any, idx: number) => {
                            const dateVal = entry.transaction_date || entry.tanggal || entry.entry_date;
                            const isDebit = (entry.debit || 0) > 0;
                            const isCredit = (entry.credit || 0) > 0;

                            const isGroupFirstRow = idx === 0;
                            const groupRowSpan = entries.length;

                            return (
                              <TableRow
                                key={`${ref}-${entry.id}`}
                                className={
                                  (groupIndex % 2 === 0 ? "bg-blue-50/50 " : "bg-white ") +
                                  (idx === 0 ? "border-t-2 border-gray-200" : "")
                                }
                              >
                              {isGroupFirstRow && (
                                <TableCell className="text-sm text-center" rowSpan={groupRowSpan}>
                                  {groupIndex + 1}
                                </TableCell>
                              )}
                              {isGroupFirstRow && (
                                <TableCell className="text-sm" rowSpan={groupRowSpan}>
                                  {dateVal ? new Date(dateVal).toLocaleDateString("id-ID") : "-"}
                                </TableCell>
                              )}
                              {isGroupFirstRow && (
                                <TableCell className="text-sm" rowSpan={groupRowSpan}>
                                  {entry.transaction_type || entry.jenis_transaksi || "-"}
                                </TableCell>
                              )}
                              <TableCell className="font-mono">
                                {entry.account_code || entry.debit_account_code || entry.credit_account_code || "-"}
                              </TableCell>
                              <TableCell>
                                {entry.account_name || entry.debit_account_name || entry.credit_account_name || "-"}
                              </TableCell>
                              <TableCell className="text-sm">
                                <div
                                  className="max-w-[420px] line-clamp-2 break-words whitespace-pre-line"
                                  title={entry.description || ""}
                                >
                                  {entry.description || "-"}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {entry.bukti || entry.bukti_url ? (
                                  <a
                                    href={(entry.bukti_url || entry.bukti) as string}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    aria-label="Lihat bukti"
                                    title="Lihat bukti"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {isDebit ? formatRupiah(entry.debit || 0) : "-"}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {isCredit ? formatRupiah(entry.credit || 0) : "-"}
                              </TableCell>

                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteJournalEntry(entry.journal_ref, entry.reference_type, entry.reference_id)}
                                  disabled={!entry.journal_ref || deletingRef === entry.journal_ref}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  {deletingRef === (entry.journal_ref || "NO-REF") ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )
                    )}
                  </TableBody>
                  <tfoot>
                    <TableRow className="bg-gray-50 font-semibold">
                      <TableCell colSpan={7} className="text-right">
                        Total
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatRupiah(
                          journalEntries.reduce(
                            (sum: number, entry: any) => sum + Number(entry.debit || 0),
                            0,
                          )
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatRupiah(
                          journalEntries.reduce(
                            (sum: number, entry: any) => sum + Number(entry.credit || 0),
                            0,
                          )
                        )}
                      </TableCell>
                      <TableCell className="text-center" />
                    </TableRow>
                  </tfoot>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Laporan Keuangan Table */}
      <Card className="max-w-7xl mx-auto rounded-2xl shadow-md mt-6">
        <CardHeader className="p-4">
          <CardTitle className="text-2xl">Laporan Keuangan</CardTitle>
          <CardDescription>Data Laporan Keuangan</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {/* Filter Section */}
          <div className="grid md:grid-cols-4 gap-3 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type1</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="reportType">
                  <SelectValue placeholder="Pilih Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua</SelectItem>
                  <SelectItem value="LABA_RUGI">Laba Rugi</SelectItem>
                  <SelectItem value="NERACA">Neraca</SelectItem>
                  <SelectItem value="ARUS_KAS">Arus Kas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Cari Nama Akun</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Cari nama akun..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchReportData}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Filter className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
            <div className="flex items-end">
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="p-4">
                <CardTitle className="text-sm text-green-700">
                  Total Debit
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold text-green-800">
                  {formatRupiah(getTotalDebit())}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardHeader className="p-4">
                <CardTitle className="text-sm text-red-700">
                  Total Credit
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold text-red-800">
                  {formatRupiah(getTotalCredit())}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="p-4">
                <CardTitle className="text-sm text-blue-700">
                  Total Amount
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold text-blue-800">
                  {formatRupiah(getTotalAmount())}
                </p>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Data Laporan ({filteredData.length} baris)
                </h3>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead>Report Type</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Account Header</TableHead>
                      <TableHead>Account Code</TableHead>
                      <TableHead>Account Name1</TableHead>
                      <TableHead className="text-right">Debit Total</TableHead>
                      <TableHead className="text-right">Credit Total</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-gray-500"
                        >
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                              {item.report_type}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.section}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.account_header}
                          </TableCell>
                          <TableCell className="font-mono">
                            {item.account_code}
                          </TableCell>
                          <TableCell>{item.account_name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatRupiah(item.debit_total || 0)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatRupiah(item.credit_total || 0)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {formatRupiah(item.amount || 0)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
