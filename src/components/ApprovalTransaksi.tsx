import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, XCircle, Clock, ArrowLeft, Info } from "lucide-react";
import { canClick, canDelete, canView, canEdit } from "@/utils/roleAccess";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface PendingTransaction {
  id: string;
  type: "purchase" | "expense" | "income" | "cash_disbursement" | "bank_pendapatan" | "bank_pengeluaran";
  transaction_date?: string;
  tanggal?: string;
  item_name?: string;
  supplier_name?: string;
  payee_name?: string;
  payment_type?: string;
  service_category?: string;
  service_type?: string;
  category?: string;
  kategori?: string;
  description?: string;
  keterangan?: string;
  total_amount?: number;
  amount?: number;
  nominal?: number;
  payment_method?: string;
  transaction_type?: string;
  jenis_transaksi?: string;
  journal_ref?: string;
  coa_cash_code?: string;
  coa_expense_code?: string;
  coa_inventory_code?: string;
  coa_payable_code?: string;
  coa_contra_code?: string;
  account_number?: string;
  account_code?: string;
  account_name?: string;
  account_type?: string;
  credit_account_code?: string;
  credit_account_name?: string;
  selected_bank?: string;
  sumber_penerimaan?: string;
  sumber_pengeluaran?: string;
  expense_account?: string;
  customer?: string;
  supplier?: string;
  notes?: string;
  bukti?: string;
  rejection_reason?: string;
  cash_account_id?: string;
  coa_cash_id?: string;
}

interface ApprovalTransaksiProps {
  onApprovalComplete?: () => void;
}

export default function ApprovalTransaksi({
  onApprovalComplete,
}: ApprovalTransaksiProps = {}) {
  const [pendingTransactions, setPendingTransactions] = useState<
    PendingTransaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<PendingTransaction | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  useEffect(() => {
    fetchPendingTransactions();

    // Realtime subscription disabled for performance
    // const subscription = supabase
    //   .channel("approval-changes")
    //   .on(
    //     "postgres_changes",
    //     { event: "*", schema: "public", table: "purchase_transactions" },
    //     () => fetchPendingTransactions(),
    //   )
    //   .on(
    //     "postgres_changes",
    //     { event: "*", schema: "public", table: "kas_transaksi" },
    //     () => fetchPendingTransactions(),
    //   )
    //   .on(
    //     "postgres_changes",
    //     { event: "*", schema: "public", table: "approval_transaksi" },
    //     () => fetchPendingTransactions(),
    //   )
    //   .subscribe();

    // return () => {
    //   subscription.unsubscribe();
    // };
  }, []);

  const fetchPendingTransactions = async () => {
    try {
      setLoading(true);

      // Fetch pending purchase transactions
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchase_transactions")
        .select("*")
        .eq("approval_status", "waiting_approval")
        .order("transaction_date", { ascending: false });

      if (purchaseError) throw purchaseError;

      // Fetch pending expense transactions from kas_transaksi
      const { data: expenseData, error: expenseError } = await supabase
        .from("kas_transaksi")
        .select("*")
        .eq("approval_status", "waiting_approval")
        .eq("payment_type", "Pengeluaran Kas")
        .order("tanggal", { ascending: false });

      if (expenseError) throw expenseError;

      // Note: cash_and_bank_receipts (Penerimaan Kas) tidak perlu approval, langsung approved

      // Fetch pending cash disbursement transactions
      const { data: cashDisbursementData, error: cashDisbursementError } =
        await supabase
          .from("cash_disbursement")
          .select("*")
          .eq("approval_status", "waiting_approval")
          .order("transaction_date", { ascending: false });

      if (cashDisbursementError) throw cashDisbursementError;

      // Fetch pending transactions from approval_transaksi table
      const { data: approvalData, error: approvalError } = await supabase
        .from("approval_transaksi")
        .select("*")
        .eq("approval_status", "waiting_approval")
        .order("transaction_date", { ascending: false });

      if (approvalError) throw approvalError;

      // 🔒 Fetch pending BANK transactions from transaction_cart (Pendapatan Bank & Pengeluaran Bank)
      const { data: bankCartData, error: bankCartError } = await supabase
        .from("transaction_cart")
        .select("*")
        .eq("approval_status", "waiting_approval")
        .eq("payment_type", "bank")
        .order("tanggal", { ascending: false });

      if (bankCartError) throw bankCartError;

      // Combine and format transactions
      const combined: PendingTransaction[] = [
        ...(purchaseData || []).map((t) => ({
          ...t,
          type: "purchase" as const,
        })),
        ...(expenseData || []).map((t) => ({ ...t, type: "expense" as const })),
        // Note: incomeData (Penerimaan Kas) tidak perlu approval, langsung approved
        ...(cashDisbursementData || []).map((t) => ({
          ...t,
          type: "cash_disbursement" as const,
        })),
        ...(approvalData || []).map((t) => ({
          ...t,
          type: t.type || ("approval" as const),
        })),
        // 🔒 Bank transactions from transaction_cart
        ...(bankCartData || []).map((t) => ({
          ...t,
          type: (t.jenis_transaksi?.toLowerCase().includes("pendapatan") || 
                 t.jenis_transaksi?.toLowerCase().includes("penerimaan"))
            ? "bank_pendapatan" as const
            : "bank_pengeluaran" as const,
        })),
      ];

      setPendingTransactions(combined);
    } catch (error: any) {
      console.error("Error fetching pending transactions:", error);
      toast({
        title: "❌ Error",
        description: error.message || "Gagal memuat transaksi pending",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transaction: PendingTransaction) => {
    setProcessingId(transaction.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      if (transaction.type === "purchase") {
        // Approve purchase transaction
        await approvePurchaseTransaction(transaction, user.id);
      } else if (transaction.type === "cash_disbursement") {
        // Approve cash disbursement transaction
        await approveCashDisbursementTransaction(transaction, user.id);
      } else if (transaction.type === "income") {
        // Approve income transaction
        await approveIncomeTransaction(transaction, user.id);
      } else if (transaction.type === "bank_pendapatan") {
        // 🔒 Approve Bank Pendapatan from transaction_cart
        await approveBankPendapatanTransaction(transaction, user.id);
      } else if (transaction.type === "bank_pengeluaran") {
        // 🔒 Approve Bank Pengeluaran from transaction_cart
        await approveBankPengeluaranTransaction(transaction, user.id);
      } else if (
        transaction.type === "Penjualan Barang" ||
        transaction.type === "Penjualan Jasa" ||
        transaction.type === "Pembelian Jasa"
      ) {
        // Approve transaction from approval_transaksi table
        await approveApprovalTransaction(transaction, user.id);
      } else {
        // Approve expense transaction
        await approveExpenseTransaction(transaction, user.id);
      }

      toast({
        title: "✅ Berhasil",
        description: "Transaksi berhasil disetujui",
      });

      fetchPendingTransactions();

      // Call callback to reload parent transactions
      if (onApprovalComplete) {
        onApprovalComplete();
      }
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Gagal menyetujui transaksi",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const approvePurchaseTransaction = async (
    transaction: PendingTransaction,
    userId: string,
  ) => {
    // Create journal entries
    const journalRef =
      transaction.journal_ref ||
      `JRN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Debit: Expense/Inventory account
    // Credit: Cash/Payable account
    const debitAccount =
      transaction.coa_expense_code || transaction.coa_inventory_code;
    const creditAccount =
      transaction.payment_method === "Tunai"
        ? transaction.coa_cash_code
        : transaction.coa_payable_code;

    if (debitAccount && creditAccount) {
      const { error: journalError } = await supabase
        .from("journal_entries")
        .insert({
          journal_ref: journalRef,
          debit_account: debitAccount,
          credit_account: creditAccount,
          debit: transaction.total_amount,
          credit: transaction.total_amount,
          description: `${transaction.transaction_type === "Barang" ? "Pembelian Barang" : "Pembelian Jasa"} - ${transaction.item_name}`,
          tanggal: transaction.transaction_date,
          kategori: transaction.transaction_type,
          jenis_transaksi:
            transaction.transaction_type === "Barang"
              ? "Pembelian Barang"
              : "Pembelian Jasa",
          approval_status: "approved",
          entity_id: transaction.entity_id,
          created_by: transaction.created_by,
        });

      if (journalError) throw journalError;
    }

    // Update purchase transaction status
    const { error: updateError } = await supabase
      .from("purchase_transactions")
      .update({
        approval_status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    if (updateError) throw updateError;
  };

  const approveExpenseTransaction = async (
    transaction: PendingTransaction,
    userId: string,
  ) => {
    // Create journal entries for expense (2 baris: Debit dan Credit)
    const journalRef = `JRN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Akun Beban (Debit) dan Akun Kas (Credit)
    const expenseAccountCode = transaction.coa_expense_code || transaction.account_code || "6-1100";
    const expenseAccountName = transaction.account_name || "Beban";
    
    // CRITICAL: Use cash_account_id first, then coa_cash_code - NO DEFAULT FALLBACK
    let cashAccountCode = transaction.coa_cash_code || transaction.account_number;
    let cashAccountName = transaction.credit_account_name;
    
    // If cash_account_id exists, fetch the actual account from chart_of_accounts
    if (transaction.cash_account_id) {
      const { data: cashAccount } = await supabase
        .from("chart_of_accounts")
        .select("account_code, account_name")
        .eq("id", transaction.cash_account_id)
        .single();
      if (cashAccount) {
        cashAccountCode = cashAccount.account_code;
        cashAccountName = cashAccount.account_name;
      }
    }
    
    // REJECT if no specific cash account is selected
    if (!cashAccountCode) {
      throw new Error("Akun Kas tidak ditemukan. Transaksi harus memiliki akun Kas yang spesifik (Kas Besar/Kas Kecil).");
    }
    if (!cashAccountName) {
      cashAccountName = "Kas";
    }
    const sumberPengeluaran = transaction.kategori || transaction.service_category || transaction.category || "";

    // Baris 1: DEBIT - Akun Beban
    const { error: debitError } = await supabase
      .from("journal_entries")
      .insert({
        journal_ref: journalRef,
        account_code: expenseAccountCode,
        account_name: expenseAccountName,
        account_type: "Expense",
        debit: transaction.nominal,
        credit: 0,
        debit_account: expenseAccountCode,
        credit_account: cashAccountCode,
        description: transaction.keterangan || "Pengeluaran Kas",
        tanggal: transaction.tanggal,
        kategori: transaction.kategori || transaction.service_category,
        sumber_pengeluaran: sumberPengeluaran,
        jenis_transaksi: "Pengeluaran Kas",
        approval_status: "approved",
        bukti_url: transaction.bukti || null,
      });

    if (debitError) throw debitError;

    // Baris 2: CREDIT - Akun Kas
    const { error: creditError } = await supabase
      .from("journal_entries")
      .insert({
        journal_ref: journalRef,
        account_code: cashAccountCode,
        account_name: cashAccountName,
        account_type: "Asset",
        debit: 0,
        credit: transaction.nominal,
        debit_account: expenseAccountCode,
        credit_account: cashAccountCode,
        description: transaction.keterangan || "Pengeluaran Kas",
        tanggal: transaction.tanggal,
        kategori: transaction.kategori || transaction.service_category,
        sumber_pengeluaran: sumberPengeluaran,
        jenis_transaksi: "Pengeluaran Kas",
        approval_status: "approved",
        bukti_url: transaction.bukti || null,
      });

    if (creditError) throw creditError;

    // Update kas_transaksi status
    const { error: updateError } = await supabase
      .from("kas_transaksi")
      .update({
        approval_status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    if (updateError) throw updateError;
  };

  const approveIncomeTransaction = async (
    transaction: PendingTransaction,
    userId: string,
  ) => {
    // Create journal entry for income
    const journalRef = `JRN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // CRITICAL: Get cash account from cash_account_id first, then coa_cash_code - NO DEFAULT FALLBACK
    let cashAccountCode = transaction.coa_cash_code;
    
    // If cash_account_id exists, fetch the actual account from chart_of_accounts
    if (transaction.cash_account_id) {
      const { data: cashAccount } = await supabase
        .from("chart_of_accounts")
        .select("account_code, account_name")
        .eq("id", transaction.cash_account_id)
        .single();
      if (cashAccount) {
        cashAccountCode = cashAccount.account_code;
      }
    }
    
    // REJECT if no specific cash account is selected
    if (!cashAccountCode) {
      throw new Error("Akun Kas tidak ditemukan. Transaksi harus memiliki akun Kas yang spesifik (Kas Besar/Kas Kecil). Tidak boleh menggunakan akun default 1-1100.");
    }

    // For income: Debit cash account, Credit revenue account
    const { error: journalError } = await supabase
      .from("journal_entries")
      .insert({
        journal_ref: journalRef,
        debit_account: cashAccountCode,
        credit_account: transaction.coa_contra_code || "4-1000",
        debit: transaction.amount,
        credit: transaction.amount,
        description: transaction.description || "Penerimaan Kas",
        tanggal: transaction.transaction_date,
        kategori: transaction.category,
        jenis_transaksi: "Penerimaan Kas",
        reference_type: "cash_receipts",
        reference_id: transaction.id,
        approval_status: "approved",
      });

    if (journalError) throw journalError;

    // Update cash_and_bank_receipts status
    const { error: updateError } = await supabase
      .from("cash_and_bank_receipts")
      .update({
        approval_status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    if (updateError) throw updateError;
  };

  const approveCashDisbursementTransaction = async (
    transaction: PendingTransaction,
    userId: string,
  ) => {
    // Create journal entries for cash disbursement (2 baris: Debit dan Credit)
    const journalRef =
      transaction.journal_ref ||
      `JRN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Akun Beban (Debit) dan Akun Kas (Credit)
    const expenseAccountCode = transaction.coa_expense_code || transaction.account_code || "6-1100";
    const expenseAccountName = transaction.account_name || "Beban";
    
    // CRITICAL: Use cash_account_id first, then coa_cash_code - NO DEFAULT FALLBACK
    let cashAccountCode = transaction.coa_cash_code;
    let cashAccountName = transaction.credit_account_name;
    
    // If cash_account_id exists, fetch the actual account from chart_of_accounts
    if (transaction.cash_account_id) {
      const { data: cashAccount } = await supabase
        .from("chart_of_accounts")
        .select("account_code, account_name")
        .eq("id", transaction.cash_account_id)
        .single();
      if (cashAccount) {
        cashAccountCode = cashAccount.account_code;
        cashAccountName = cashAccount.account_name;
      }
    }
    
    // REJECT if no specific cash account is selected
    if (!cashAccountCode) {
      throw new Error("Akun Kas tidak ditemukan. Transaksi harus memiliki akun Kas yang spesifik (Kas Besar/Kas Kecil).");
    }
    if (!cashAccountName) {
      cashAccountName = "Kas";
    }
    const sumberPengeluaran = transaction.kategori || transaction.category || "";

    // Baris 1: DEBIT - Akun Beban
    const { error: debitError } = await supabase
      .from("journal_entries")
      .insert({
        journal_ref: journalRef,
        transaction_date: transaction.transaction_date,
        account_code: expenseAccountCode,
        account_name: expenseAccountName,
        account_type: "Expense",
        debit: transaction.amount,
        credit: 0,
        debit_account: expenseAccountCode,
        credit_account: cashAccountCode,
        description: transaction.description || "Pengeluaran Kas",
        source_type: "cash_disbursement",
        reference_type: "cash_disbursement",
        reference_id: transaction.id,
        kategori: transaction.category,
        sumber_pengeluaran: sumberPengeluaran,
        jenis_transaksi: "Pengeluaran Kas",
        bukti_url: transaction.bukti || null,
        approval_status: "approved",
      });

    if (debitError) throw debitError;

    // Baris 2: CREDIT - Akun Kas
    const { error: creditError } = await supabase
      .from("journal_entries")
      .insert({
        journal_ref: journalRef,
        transaction_date: transaction.transaction_date,
        account_code: cashAccountCode,
        account_name: cashAccountName,
        account_type: "Asset",
        debit: 0,
        credit: transaction.amount,
        debit_account: expenseAccountCode,
        credit_account: cashAccountCode,
        description: transaction.description || "Pengeluaran Kas",
        source_type: "cash_disbursement",
        reference_type: "cash_disbursement",
        reference_id: transaction.id,
        kategori: transaction.category,
        sumber_pengeluaran: sumberPengeluaran,
        jenis_transaksi: "Pengeluaran Kas",
        bukti_url: transaction.bukti || null,
        approval_status: "approved",
      });

    if (creditError) throw creditError;

    // Update cash_disbursement status
    const { error: updateError } = await supabase
      .from("cash_disbursement")
      .update({
        approval_status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
        journal_ref: journalRef,
      })
      .eq("id", transaction.id);

    if (updateError) throw updateError;
  };

  const approveApprovalTransaction = async (
    transaction: PendingTransaction,
    userId: string,
  ) => {
    // Simply update the approval status in approval_transaksi table
    // The journal entries were already created when the transaction was submitted
    const { error: updateError } = await supabase
      .from("approval_transaksi")
      .update({
        approval_status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    if (updateError) throw updateError;
  };

  // 🔒 Approve Bank Pendapatan from transaction_cart
  const approveBankPendapatanTransaction = async (
    transaction: PendingTransaction,
    userId: string,
  ) => {
    const journalRef = `JRN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Bank Pendapatan: Debit Bank, Credit Revenue
    const bankAccountCode = transaction.selected_bank || transaction.account_code || "1-1200";
    const bankAccountName = transaction.account_name || "Bank";
    const revenueAccountCode = transaction.credit_account_code || "4-1100";
    const revenueAccountName = transaction.credit_account_name || "Pendapatan";
    const sumberPenerimaan = transaction.kategori || transaction.sumber_penerimaan || "";
    
    // Baris 1: DEBIT - Akun Bank
    const { error: debitError } = await supabase
      .from("journal_entries")
      .insert({
        journal_ref: journalRef,
        transaction_date: transaction.tanggal,
        account_code: bankAccountCode,
        account_name: bankAccountName,
        account_type: "Asset",
        debit: transaction.nominal,
        credit: 0,
        description: transaction.description || "Pendapatan Bank",
        source_type: "transaksi_keuangan",
        debit_account: bankAccountCode,
        credit_account: revenueAccountCode,
        jenis_transaksi: transaction.jenis_transaksi || "Pendapatan",
        kategori: transaction.kategori || transaction.sumber_penerimaan,
        sumber_penerimaan: sumberPenerimaan,
        bukti_url: transaction.bukti || null,
        approval_status: "approved",
      });

    if (debitError) throw debitError;

    // Baris 2: CREDIT - Akun Pendapatan
    const { error: creditError } = await supabase
      .from("journal_entries")
      .insert({
        journal_ref: journalRef,
        transaction_date: transaction.tanggal,
        account_code: revenueAccountCode,
        account_name: revenueAccountName,
        account_type: transaction.credit_account_type || "Revenue",
        debit: 0,
        credit: transaction.nominal,
        description: transaction.description || "Pendapatan Bank",
        source_type: "transaksi_keuangan",
        debit_account: bankAccountCode,
        credit_account: revenueAccountCode,
        jenis_transaksi: transaction.jenis_transaksi || "Pendapatan",
        kategori: transaction.kategori || transaction.sumber_penerimaan,
        sumber_penerimaan: sumberPenerimaan,
        bukti_url: transaction.bukti || null,
        approval_status: "approved",
      });

    if (creditError) throw creditError;

    // Update transaction_cart status
    const { error: updateError } = await supabase
      .from("transaction_cart")
      .update({
        approval_status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
        status: "checked_out",
      })
      .eq("id", transaction.id);

    if (updateError) throw updateError;
  };

  // 🔒 Approve Bank Pengeluaran from transaction_cart
  const approveBankPengeluaranTransaction = async (
    transaction: PendingTransaction,
    userId: string,
  ) => {
    const journalRef = `JRN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Bank Pengeluaran: Debit Expense, Credit Bank
    const expenseAccountCode = transaction.account_code || transaction.expense_account || "6-1100";
    const expenseAccountName = transaction.account_name || "Beban";
    const bankAccountCode = transaction.selected_bank || "1-1200";
    const bankAccountName = transaction.credit_account_name || "Bank";
    const sumberPengeluaran = transaction.kategori || "";
    
    // Baris 1: DEBIT - Akun Beban
    const { error: debitError } = await supabase
      .from("journal_entries")
      .insert({
        journal_ref: journalRef,
        transaction_date: transaction.tanggal,
        account_code: expenseAccountCode,
        account_name: expenseAccountName,
        account_type: transaction.account_type || "Expense",
        debit: transaction.nominal,
        credit: 0,
        description: transaction.description || "Pengeluaran Bank",
        source_type: "transaksi_keuangan",
        debit_account: expenseAccountCode,
        credit_account: bankAccountCode,
        jenis_transaksi: transaction.jenis_transaksi || "Pengeluaran",
        kategori: transaction.kategori,
        sumber_pengeluaran: sumberPengeluaran,
        bukti_url: transaction.bukti || null,
        approval_status: "approved",
      });

    if (debitError) throw debitError;

    // Baris 2: CREDIT - Akun Bank
    const { error: creditError } = await supabase
      .from("journal_entries")
      .insert({
        journal_ref: journalRef,
        transaction_date: transaction.tanggal,
        account_code: bankAccountCode,
        account_name: bankAccountName,
        account_type: "Asset",
        debit: 0,
        credit: transaction.nominal,
        description: transaction.description || "Pengeluaran Bank",
        source_type: "transaksi_keuangan",
        debit_account: expenseAccountCode,
        credit_account: bankAccountCode,
        jenis_transaksi: transaction.jenis_transaksi || "Pengeluaran",
        kategori: transaction.kategori,
        sumber_pengeluaran: sumberPengeluaran,
        bukti_url: transaction.bukti || null,
        approval_status: "approved",
      });

    if (creditError) throw creditError;

    // Update transaction_cart status
    const { error: updateError } = await supabase
      .from("transaction_cart")
      .update({
        approval_status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
        status: "checked_out",
      })
      .eq("id", transaction.id);

    if (updateError) throw updateError;
  };

  const handleReject = (transaction: PendingTransaction) => {
    setSelectedTransaction(transaction);
    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    if (!selectedTransaction) return;

    setProcessingId(selectedTransaction.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const table =
        selectedTransaction.type === "purchase"
          ? "purchase_transactions"
          : selectedTransaction.type === "cash_disbursement"
            ? "cash_disbursement"
            : selectedTransaction.type === "bank_pendapatan" ||
                selectedTransaction.type === "bank_pengeluaran"
              ? "transaction_cart"
              : selectedTransaction.type === "Penjualan Barang" ||
                  selectedTransaction.type === "Penjualan Jasa" ||
                  selectedTransaction.type === "Pembelian Jasa"
                ? "approval_transaksi"
                : "kas_transaksi";

      const { error } = await supabase
        .from(table)
        .update({
          approval_status: "rejected",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", selectedTransaction.id);

      if (error) throw error;

      toast({
        title: "✅ Berhasil",
        description: "Transaksi berhasil ditolak",
      });

      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedTransaction(null);
      fetchPendingTransactions();

      // Call callback to reload parent transactions
      if (onApprovalComplete) {
        onApprovalComplete();
      }
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Gagal menolak transaksi",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/*   <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
        */}
        {canEdit(userRole) && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Clock className="h-6 w-6" />
                Approval Transaksi
              </CardTitle>
              <p className="text-blue-100 text-sm">
                Kelola persetujuan untuk Pembelian Barang, Pengeluaran Kas, Cash
                Disbursement, Penjualan Jasa, dan Pembelian Jasa
              </p>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-slate-600">Memuat transaksi...</p>
                </div>
              ) : pendingTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-700">
                    Tidak ada transaksi pending
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Semua transaksi sudah disetujui atau ditolak
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>No. Dokumen</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Akun</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead className="text-right">Nominal</TableHead>
                        <TableHead className="text-center">Bukti</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Detail</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingTransactions.map((transaction, index) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatDate(
                              transaction.transaction_date ||
                                transaction.tanggal ||
                                "",
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {transaction.document_number || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                transaction.type === "purchase"
                                  ? "default"
                                  : transaction.type === "bank_pendapatan"
                                    ? "outline"
                                    : transaction.type === "bank_pengeluaran"
                                      ? "destructive"
                                      : "secondary"
                              }
                            >
                              {transaction.type === "purchase"
                                ? "Pembelian"
                                : transaction.type === "cash_disbursement"
                                  ? "Pengeluaran Kas"
                                  : transaction.type === "bank_pendapatan"
                                    ? "🏦 Pendapatan Bank"
                                    : transaction.type === "bank_pengeluaran"
                                      ? "🏦 Pengeluaran Bank"
                                      : transaction.type === "Penjualan Barang"
                                        ? "Penjualan Barang"
                                        : transaction.type === "Penjualan Jasa"
                                          ? "Penjualan Jasa"
                                          : transaction.type === "Pembelian Jasa"
                                            ? "Pembelian Jasa"
                                            : "Pengeluaran"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.type === "purchase"
                                ? "PURCHASE_TRANSACTIONS"
                                : transaction.type === "cash_disbursement"
                                  ? "CASH_DISBURSEMENT"
                                  : transaction.type === "income"
                                    ? "CASH_AND_BANK_RECEIPTS"
                                    : transaction.type === "bank_pendapatan" ||
                                        transaction.type === "bank_pengeluaran"
                                      ? "TRANSACTION_CART"
                                      : transaction.type === "Penjualan Barang" ||
                                          transaction.type === "Penjualan Jasa" ||
                                          transaction.type === "Pembelian Jasa"
                                        ? "APPROVAL_TRANSAKSI"
                                        : "KAS_TRANSAKSI"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {transaction.type === "bank_pendapatan" ||
                            transaction.type === "bank_pengeluaran"
                              ? transaction.account_code ||
                                transaction.selected_bank ||
                                "-"
                              : transaction.coa_cash_code ||
                                transaction.coa_expense_code ||
                                transaction.account_number ||
                                transaction.account_name ||
                                "-"}
                          </TableCell>
                          <TableCell>
                            {transaction.type === "purchase"
                              ? transaction.item_name
                              : transaction.type === "cash_disbursement"
                                ? transaction.description
                                : transaction.type === "bank_pendapatan" ||
                                    transaction.type === "bank_pengeluaran"
                                  ? transaction.description ||
                                    transaction.kategori ||
                                    transaction.jenis_transaksi
                                  : transaction.type === "Penjualan Barang" ||
                                      transaction.type === "Penjualan Jasa" ||
                                      transaction.type === "Pembelian Jasa"
                                    ? transaction.item_name ||
                                      transaction.description
                                    : transaction.keterangan}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(
                              transaction.total_amount ||
                                transaction.amount ||
                                transaction.nominal ||
                                0,
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {transaction.bukti ? (
                              <a
                                href={transaction.bukti}
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
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className="bg-yellow-100 text-yellow-800"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setShowDetailDialog(true);
                              }}
                            >
                              <Info className="h-4 w-4 text-blue-600" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(transaction)}
                                disabled={processingId === transaction.id}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(transaction)}
                                disabled={processingId === transaction.id}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
            <DialogDescription>
              Informasi lengkap transaksi berdasarkan jenis transaksi
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Jenis Transaksi
                  </p>
                  <p className="text-base font-semibold">
                    {selectedTransaction.type === "purchase"
                      ? "Pembelian"
                      : selectedTransaction.type === "cash_disbursement"
                        ? "Pengeluaran Kas"
                        : selectedTransaction.type === "income"
                          ? "Penerimaan Kas"
                          : selectedTransaction.type === "bank_pendapatan"
                            ? "🏦 Pendapatan Bank"
                            : selectedTransaction.type === "bank_pengeluaran"
                              ? "🏦 Pengeluaran Bank"
                              : selectedTransaction.type === "Penjualan Barang"
                                ? "Penjualan Barang"
                                : selectedTransaction.type === "Penjualan Jasa"
                                  ? "Penjualan Jasa"
                                  : selectedTransaction.type === "Pembelian Jasa"
                                    ? "Pembelian Jasa"
                                    : "Pengeluaran"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Tanggal</p>
                  <p className="text-base">
                    {formatDate(
                      selectedTransaction.transaction_date ||
                        selectedTransaction.tanggal ||
                        "",
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    No. Dokumen
                  </p>
                  <p className="text-base font-mono">
                    {selectedTransaction.document_number || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Source</p>
                  <p className="text-base">
                    {selectedTransaction.type === "purchase"
                      ? "PURCHASE_TRANSACTIONS"
                      : selectedTransaction.type === "cash_disbursement"
                        ? "CASH_DISBURSEMENT"
                        : selectedTransaction.type === "bank_pendapatan" ||
                            selectedTransaction.type === "bank_pengeluaran"
                          ? "TRANSACTION_CART"
                          : "CASH_AND_BANK_RECEIPTS"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Informasi Detail</h4>
                <div className="space-y-3">
                  {selectedTransaction.item_name && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Nama Item
                      </p>
                      <p className="text-base">
                        {selectedTransaction.item_name}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.supplier_name && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Supplier
                      </p>
                      <p className="text-base">
                        {selectedTransaction.supplier_name}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.payee_name && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Penerima
                      </p>
                      <p className="text-base">
                        {selectedTransaction.payee_name}
                      </p>
                    </div>
                  )}
                  {(selectedTransaction.category || selectedTransaction.kategori) && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Kategori
                      </p>
                      <p className="text-base">
                        {selectedTransaction.category || selectedTransaction.kategori}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.selected_bank && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Rekening Bank
                      </p>
                      <p className="text-base font-mono">
                        {selectedTransaction.selected_bank}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.account_code && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Kode Akun
                      </p>
                      <p className="text-base font-mono">
                        {selectedTransaction.account_code} - {selectedTransaction.account_name}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.credit_account_code && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Akun Kredit
                      </p>
                      <p className="text-base font-mono">
                        {selectedTransaction.credit_account_code} - {selectedTransaction.credit_account_name}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.sumber_penerimaan && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Sumber Penerimaan
                      </p>
                      <p className="text-base">
                        {selectedTransaction.sumber_penerimaan}
                      </p>
                    </div>
                  )}
                  {(selectedTransaction.customer || selectedTransaction.supplier) && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {selectedTransaction.customer ? "Customer" : "Supplier"}
                      </p>
                      <p className="text-base">
                        {selectedTransaction.customer || selectedTransaction.supplier}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.service_category && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Kategori Layanan
                      </p>
                      <p className="text-base">
                        {selectedTransaction.service_category}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.service_type && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Jenis Layanan
                      </p>
                      <p className="text-base">
                        {selectedTransaction.service_type}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.payment_method && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Metode Pembayaran
                      </p>
                      <p className="text-base">
                        {selectedTransaction.payment_method}
                      </p>
                    </div>
                  )}

                  {selectedTransaction.payment_type && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Tipe Pembayaran
                      </p>
                      <p className="text-base">
                        {selectedTransaction.payment_type}
                      </p>
                    </div>
                  )}

                  {(selectedTransaction.description ||
                    selectedTransaction.keterangan) && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Deskripsi
                      </p>
                      <p className="text-base">
                        {selectedTransaction.description ||
                          selectedTransaction.keterangan}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.notes && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Catatan
                      </p>
                      <p className="text-base">{selectedTransaction.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Informasi Akuntansi</h4>
                <div className="space-y-3">
                  {selectedTransaction.coa_cash_code && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        COA Cash Code
                      </p>
                      <p className="text-base font-mono">
                        {selectedTransaction.coa_cash_code}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.coa_expense_code && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        COA Expense Code
                      </p>
                      <p className="text-base font-mono">
                        {selectedTransaction.coa_expense_code}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.coa_inventory_code && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        COA Inventory Code
                      </p>
                      <p className="text-base font-mono">
                        {selectedTransaction.coa_inventory_code}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.coa_payable_code && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        COA Payable Code
                      </p>
                      <p className="text-base font-mono">
                        {selectedTransaction.coa_payable_code}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.account_number && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Nomor Akun
                      </p>
                      <p className="text-base font-mono">
                        {selectedTransaction.account_number}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Total Nominal
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(
                        selectedTransaction.total_amount ||
                          selectedTransaction.amount ||
                          selectedTransaction.nominal ||
                          0,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailDialog(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Transaksi</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan transaksi ini
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Masukkan alasan penolakan..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectionReason.trim()}
            >
              Tolak Transaksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
