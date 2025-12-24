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
  const navigate = useNavigate();

  useEffect(() => {
    fetchReportData();
    fetchJournalEntries();
    fetchCOAAccounts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reportType, searchQuery, reportData]);

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
      const { data: journalData, error: journalError } = await supabase
        .from("journal_entries")
        .select("*")
        .order("entry_date", { ascending: false });

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
          // Determine jenis_transaksi based on reference_type
          let jenisTransaksi = '-';
          
          if (entry.reference_type === 'cash_disbursement') {
            jenisTransaksi = 'Pengeluaran';
          } else if (entry.reference_type === 'cash_receipts') {
            jenisTransaksi = 'Penerimaan';
          } else if (entry.reference_type === 'purchase_transactions') {
            jenisTransaksi = 'Pembelian';
          } else if (entry.reference_type === 'sales_transactions') {
            jenisTransaksi = 'Penjualan';
          } else if (entry.reference_type === 'internal_usage') {
            jenisTransaksi = 'Pemakaian Internal';
          } else if (entry.reference_type === 'employee_advances') {
            jenisTransaksi = 'Kasbon Karyawan';
          } else if (entry.jenis_transaksi) {
            jenisTransaksi = entry.jenis_transaksi;
          }

          return {
            ...entry,
            debit_account_name: coaMap.get(entry.debit_account) || "-",
            credit_account_name: coaMap.get(entry.credit_account) || "-",
            tanggal: entry.entry_date,
            jenis_transaksi: jenisTransaksi,
          };
        }) || [];

      setJournalEntries(enrichedEntries);
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

  const deleteJournalEntry = async (journalRef: string, referenceType?: string, referenceId?: string) => {
    if (!journalRef || journalRef === 'NO-REF') {
      toast({
        title: "Error",
        description: "Journal reference tidak valid",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus journal entry dengan ref: ${journalRef}?\n\nData sumber transaksi juga akan dihapus.`)) {
      return;
    }

    setDeletingRef(journalRef);
    try {
      // Get the journal entry to find reference info
      const { data: journalData } = await supabase
        .from("journal_entries")
        .select("reference_type, reference_id")
        .eq("journal_ref", journalRef)
        .limit(1)
        .single();

      console.log("Journal Data:", journalData);
      console.log("Params - referenceType:", referenceType, "referenceId:", referenceId);

      const refType = referenceType || journalData?.reference_type;
      const refId = referenceId || journalData?.reference_id;

      console.log("Resolved - refType:", refType, "refId:", refId);

      if (refType && refId) {
        let sourceTable = '';
        
        // Map reference_type to actual table name
        if (refType.includes('cash_disbursement') || refType === 'CASH_DISBURSEMENT') {
          sourceTable = 'cash_disbursement';
        } else if (refType.includes('cash_receipt') || refType === 'CASH_RECEIPTS') {
          sourceTable = 'cash_receipts';
        } else if (refType.includes('purchase') || refType === 'PURCHASE') {
          sourceTable = 'purchase_transactions';
        } else if (refType.includes('sales') || refType === 'SALES') {
          sourceTable = 'sales_transactions';
        } else if (refType.includes('bank_mutation') || refType === 'BANK_MUTATION') {
          sourceTable = 'bank_mutations';
        } else if (refType.includes('employee_advance') || refType === 'EMPLOYEE_ADVANCE') {
          sourceTable = 'employee_advances';
        } else if (refType.includes('internal_usage') || refType === 'INTERNAL_USAGE') {
          sourceTable = 'internal_usage';
        } else if (refType.includes('general_journal') || refType === 'GENERAL_JOURNAL') {
          sourceTable = 'general_journal';
        }

        console.log("Source table:", sourceTable);

        if (sourceTable) {
          console.log("Deleting by ID:", refId);
          
          const { error: sourceError, data: deletedData } = await supabase
            .from(sourceTable)
            .delete()
            .eq('id', refId)
            .select();

          console.log("Delete result:", { deletedData, sourceError });

          if (sourceError) {
            console.warn(`Warning: Could not delete source from ${sourceTable}:`, sourceError.message);
            toast({
              title: "Warning",
              description: `Gagal menghapus data sumber: ${sourceError.message}`,
              variant: "destructive",
            });
          } else {
            console.log(`Successfully deleted source from ${sourceTable}`, deletedData);
          }
        } else {
          console.log("No source table matched for refType:", refType);
        }
      } else {
        console.log("No delete attempt - refType:", refType, "refId:", refId);
      }

      // Then delete the journal entries
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("journal_ref", journalRef);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Journal entry dan data sumber berhasil dihapus",
      });

      // Refresh data
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

    journalEntries.forEach((entry) => {
      if (entry.debit_account === accountCode) {
        transactions.push({
          date: entry.entry_date,
          description: entry.description || entry.entry_number,
          debit: entry.debit,
          credit: 0,
          entry_id: entry.id,
        });
      }
      if (entry.credit_account === accountCode) {
        transactions.push({
          date: entry.entry_date,
          description: entry.description || entry.entry_number,
          debit: 0,
          credit: entry.credit,
          entry_id: entry.id,
        });
      }
    });

    return transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
    
    // Calculate totals for this account (including children for level 1 & 2)
    const { totalDebit, totalCredit } = calculateAccountTotals(account.account_code, level);
    
    // Calculate balance based on account type
    // ASET (1): Debit - Credit (bisa minus jika kredit > debit)
    // KEWAJIBAN (2): Credit - Debit (bisa minus jika debit > kredit)
    // EKUITAS (3): Credit - Debit (bisa minus jika debit > kredit)
    // PENDAPATAN (4): Credit - Debit (bisa minus jika debit > kredit)
    // BEBAN POKOK PENJUALAN (5): Debit - Credit (bisa minus jika kredit > debit)
    // BEBAN OPERASIONAL (6): Debit - Credit (bisa minus jika kredit > debit)
    // PENDAPATAN & BEBAN LAIN-LAIN (7): Credit - Debit (bisa minus jika debit > kredit)
    const accountPrefix = account.account_code.charAt(0);
    let balance = 0;
    
    if (accountPrefix === '1') {
      // ASET: Debit - Credit (minus jika kredit > debit)
      balance = totalDebit - totalCredit;
    } else if (accountPrefix === '5') {
      // BEBAN POKOK PENJUALAN: Debit - Credit (minus jika kredit > debit)
      balance = totalDebit - totalCredit;
    } else if (accountPrefix === '2') {
      // KEWAJIBAN: Credit - Debit (minus jika debit > kredit)
      balance = totalCredit - totalDebit;
    } else if (accountPrefix === '3') {
      // EKUITAS: Credit - Debit (minus jika debit > kredit)
      balance = totalCredit - totalDebit;
    } else if (accountPrefix === '4') {
      // PENDAPATAN: Credit - Debit (minus jika debit > kredit)
      balance = totalCredit - totalDebit;
    } else if (accountPrefix === '6') {
      // BEBAN OPERASIONAL: Debit - Credit (minus jika kredit > debit)
      balance = totalDebit - totalCredit;
    } else if (accountPrefix === '7') {
      // PENDAPATAN & BEBAN LAIN-LAIN: Credit - Debit (minus jika debit > kredit)
      balance = totalCredit - totalDebit;
    } else {
      // Default: Debit - Credit
      balance = totalDebit - totalCredit;
    }

    return (
      <div key={account.id}>
        <div
          className={`flex items-center py-2 px-4 hover:bg-gray-50 cursor-pointer border-b ${
            level === 1 ? "bg-blue-50 font-bold" : level === 2 ? "bg-gray-50 font-semibold" : ""
          }`}
          style={{ paddingLeft: `${level * 20}px` }}
          onClick={() => hasChildren && toggleAccount(account.account_code)}
        >
          {hasChildren && (
            <span className="mr-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          )}
          {!hasChildren && <span className="mr-2 w-4"></span>}
          <span className="font-mono mr-4">{account.account_code}</span>
          <span className="flex-1">{account.account_name}</span>
          {(totalDebit > 0 || totalCredit > 0) && (
            <>
              {level === 1 ? (
                <>
                  <span className="font-mono text-right w-32 mr-4"></span>
                  <span className="font-mono text-right w-32 mr-4"></span>
                  <span className={`font-mono text-right w-32 ${balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {balance < 0 ? '-' : ''}{formatRupiah(Math.abs(balance))}
                  </span>
                </>
              ) : level === 3 ? (
                <>
                  <span className="font-mono text-right w-32 mr-4">
                    {formatRupiah(totalDebit)}
                  </span>
                  <span className="font-mono text-right w-32 mr-4">
                    {formatRupiah(totalCredit)}
                  </span>
                  <span className={`font-mono text-right w-32 ${balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {balance < 0 ? '-' : ''}{formatRupiah(Math.abs(balance))}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-mono text-right w-32 mr-4"></span>
                  <span className="font-mono text-right w-32 mr-4"></span>
                  <span className="font-mono text-right w-32"></span>
                </>
              )}
            </>
          )}
        </div>

        {level === 3 && isExpanded && transactions.length > 0 && (
          <div className="bg-gray-50 border-b">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="w-32">Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right w-32">Debit</TableHead>
                  <TableHead className="text-right w-32">Kredit</TableHead>
                  <TableHead className="text-right w-32">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((trans, idx) => {
                  // Calculate running balance
                  const previousTransactions = transactions.slice(0, idx + 1);
                  const runningDebit = previousTransactions.reduce((sum, t) => sum + t.debit, 0);
                  const runningCredit = previousTransactions.reduce((sum, t) => sum + t.credit, 0);
                  
                  const accountPrefix = account.account_code.charAt(0);
                  let runningBalance = 0;
                  
                  if (accountPrefix === '1') {
                    // ASET: Debit - Credit (minus jika kredit > debit)
                    runningBalance = runningDebit - runningCredit;
                  } else if (accountPrefix === '5') {
                    // BEBAN POKOK PENJUALAN: Debit - Credit (minus jika kredit > debit)
                    runningBalance = runningDebit - runningCredit;
                  } else if (accountPrefix === '2') {
                    // KEWAJIBAN: Credit - Debit (minus jika debit > kredit)
                    runningBalance = runningCredit - runningDebit;
                  } else if (accountPrefix === '3') {
                    // EKUITAS: Credit - Debit (minus jika debit > kredit)
                    runningBalance = runningCredit - runningDebit;
                  } else if (accountPrefix === '4') {
                    // PENDAPATAN: Credit - Debit (minus jika debit > kredit)
                    runningBalance = runningCredit - runningDebit;
                  } else if (accountPrefix === '6') {
                    // BEBAN OPERASIONAL: Debit - Credit (minus jika kredit > debit)
                    runningBalance = runningDebit - runningCredit;
                  } else if (accountPrefix === '7') {
                    // PENDAPATAN & BEBAN LAIN-LAIN: Credit - Debit (minus jika debit > kredit)
                    runningBalance = runningCredit - runningDebit;
                  } else {
                    // Default: Debit - Credit
                    runningBalance = runningDebit - runningCredit;
                  }
                  
                  return (
                    <TableRow key={`${trans.entry_id}-${idx}`}>
                      <TableCell className="font-mono text-sm">
                        {new Date(trans.date).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-sm">{trans.description}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {trans.debit > 0 ? formatRupiah(trans.debit) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {trans.credit > 0 ? formatRupiah(trans.credit) : "-"}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm ${runningBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {runningBalance < 0 ? '-' : ''}{formatRupiah(Math.abs(runningBalance))}
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
      <Card className="max-w-7xl mx-auto rounded-2xl shadow-md">
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
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Data Journal Entries ({journalEntries.length} entries)
                </h3>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jenis Transaksi</TableHead>
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
                          colSpan={9}
                          className="text-center py-8 text-gray-500"
                        >
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    ) : (
                      // Group by journal_ref and display debit first, then credit
                      (() => {
                        const groupedByRef: Record<string, any[]> = {};
                        
                        journalEntries.forEach((entry: any) => {
                          const ref = entry.journal_ref || 'NO-REF';
                          if (!groupedByRef[ref]) {
                            groupedByRef[ref] = [];
                          }
                          groupedByRef[ref].push(entry);
                        });

                        const rows: JSX.Element[] = [];
                        
                        Object.entries(groupedByRef).forEach(([ref, entries]) => {
                          // Find debit and credit entries
                          const debitEntry = entries.find((e: any) => (e.debit || 0) > 0);
                          const creditEntry = entries.find((e: any) => (e.credit || 0) > 0);
                          
                          // Display debit row first
                          if (debitEntry) {
                            rows.push(
                              <TableRow key={`${ref}-debit`}>
                                <TableCell className="text-sm">
                                  {debitEntry.tanggal ? new Date(debitEntry.tanggal).toLocaleDateString('id-ID') : (debitEntry.transaction_date ? new Date(debitEntry.transaction_date).toLocaleDateString('id-ID') : '-')}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {debitEntry.jenis_transaksi || '-'}
                                </TableCell>
                                <TableCell className="font-mono">
                                  {debitEntry.debit_account || '-'}
                                </TableCell>
                                <TableCell>
                                  {debitEntry.debit_account_name || '-'}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {debitEntry.description || '-'}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {debitEntry.bukti_url ? (
                                    <a 
                                      href={debitEntry.bukti_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      Lihat
                                    </a>
                                  ) : '-'}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatRupiah(debitEntry.debit || 0)}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  -
                                </TableCell>
                                <TableCell className="text-center" rowSpan={creditEntry ? 2 : 1}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteJournalEntry(ref, debitEntry.reference_type, debitEntry.reference_id)}
                                    disabled={deletingRef === ref}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    {deletingRef === ref ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          }
                          
                          // Display credit row second
                          if (creditEntry) {
                            rows.push(
                              <TableRow key={`${ref}-credit`}>
                                <TableCell className="text-sm">
                                  {creditEntry.tanggal ? new Date(creditEntry.tanggal).toLocaleDateString('id-ID') : (creditEntry.transaction_date ? new Date(creditEntry.transaction_date).toLocaleDateString('id-ID') : '-')}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {creditEntry.jenis_transaksi || '-'}
                                </TableCell>
                                <TableCell className="font-mono">
                                  {creditEntry.credit_account || '-'}
                                </TableCell>
                                <TableCell>
                                  {creditEntry.credit_account_name || '-'}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {creditEntry.description || '-'}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {creditEntry.bukti_url ? (
                                    <a 
                                      href={creditEntry.bukti_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      Lihat
                                    </a>
                                  ) : '-'}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  -
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatRupiah(creditEntry.credit || 0)}
                                </TableCell>
                              </TableRow>
                            );
                          }
                        });

                        return rows;
                      })()
                    )}
                  </TableBody>
                  <tfoot>
                    <TableRow className="bg-gray-50 font-semibold">
                      <TableCell colSpan={5} className="text-right">Total</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatRupiah(
                          journalEntries.reduce((sum: number, entry: any) => sum + (entry.debit || 0), 0)
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatRupiah(
                          journalEntries.reduce((sum: number, entry: any) => sum + (entry.credit || 0), 0)
                        )}
                      </TableCell>
                    </TableRow>
                  </tfoot>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* General Ledger (Buku Besar) */}
      <Card className="max-w-7xl mx-auto rounded-2xl shadow-md mt-6">
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
              <div className="bg-gray-100 flex items-center py-2 px-4 font-bold border-b">
                <span className="mr-2 w-4"></span>
                <span className="font-mono mr-4 w-32">Kode Akun</span>
                <span className="flex-1">Nama Akun</span>
                <span className="text-right w-32 mr-4">Total Debit</span>
                <span className="text-right w-32 mr-4">Total Kredit</span>
                <span className="text-right w-32">Saldo</span>
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
    </div>
  );
}
