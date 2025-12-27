// ==============================
// TRANSACTION CATEGORY DEFINITIONS
// ==============================
export const TRANSACTION_CATEGORIES = {
  Penjualan: {
    kategori: ["Produk", "Barang Dagang", "Jasa"],
    jenis: ["Eceran", "Grosir"],
    source: "sales_transactions",
    sourceLabelKey: "item_name",
    sourceValueKey: "id",
  },
  Pembelian: {
    kategori: ["Bahan Baku", "Barang Dagang", "Perlengkapan"],
    jenis: ["Supplier Utama", "Supplier Cadangan"],
    source: "purchase_transactions",
    sourceLabelKey: "item_name",
    sourceValueKey: "id",
  },
  Pendapatan: {
    kategori: ["Pendapatan Usaha", "Pendapatan Lain"],
    jenis: ["Tunai", "Transfer"],
    source: "chart_of_accounts",
    sourceLabelKey: "account_name",
    sourceValueKey: "account_code",
  },
  Pengeluaran: {
    kategori: ["Biaya Operasional", "Biaya Lainnya"],
    jenis: ["Tunai", "Transfer"],
    source: "chart_of_accounts",
    sourceLabelKey: "account_name",
    sourceValueKey: "account_code",
  },
  "Transfer Bank": {
    kategori: ["Kas ke Bank", "Bank ke Kas"],
    jenis: ["Internal Transfer"],
    source: "chart_of_accounts",
    sourceLabelKey: "account_name",
    sourceValueKey: "account_code",
  },
  "Setoran Modal": {
    kategori: ["Modal Disetor"],
    jenis: ["Pemilik", "Investor"],
    source: "chart_of_accounts",
    sourceLabelKey: "account_name",
    sourceValueKey: "account_code",
  },
  Prive: {
    kategori: ["Prive Pemilik"],
    jenis: ["Tunai", "Barang"],
    source: "chart_of_accounts",
    sourceLabelKey: "account_name",
    sourceValueKey: "account_code",
  },
  "Pelunasan Piutang": {
    kategori: ["Piutang Usaha", "Piutang Lainnya"],
    jenis: ["Tunai", "Transfer"],
    source: "customers",
    sourceLabelKey: "customer_name",
    sourceValueKey: "id",
  },
  "Pelunasan Hutang": {
    kategori: ["Hutang Usaha", "Hutang Lainnya"],
    jenis: ["Tunai", "Transfer"],
    source: "suppliers",
    sourceLabelKey: "supplier_name",
    sourceValueKey: "id",
  },
  "Pinjaman Masuk": {
    kategori: ["Bank", "Individu", "Perusahaan"],
    jenis: ["Lump Sum", "Cicilan"],
    source: "borrowers",
    sourceLabelKey: "borrower_name",
    sourceValueKey: "id",
  },
  "Pembayaran Pinjaman": {
    kategori: ["Pelunasan Pokok", "Pembayaran Bunga"],
    jenis: ["Cicilan", "Lunas"],
    source: "borrowers",
    sourceLabelKey: "borrower_name",
    sourceValueKey: "id",
  },
  "Jurnal Umum": {
    kategori: [
      { label: "Penyesuaian", value: "penyesuaian" },
      { label: "Koreksi", value: "koreksi" },
      { label: "Akrual", value: "akrual" },
      { label: "Eliminasi", value: "eliminasi" },
      { label: "Reklasifikasi", value: "reklasifikasi" },
    ],
    jenis: [{ label: "Debit / Kredit Manual", value: "manual_entry" }],
    source: "chart_of_accounts",
    sourceLabelKey: "account_name",
    sourceValueKey: "account_code",
  },
};

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AddItemModal from "./AddItemModal";
import AddBrandModal from "./AddBrandModal";
import AddStockItemModal from "./AddStockItemModal";
import BorrowerForm from "./BorrowerForm";
import JournalPreviewModal from "./JournalPreviewModal";
import ApprovalTransaksi from "./ApprovalTransaksi";
import OCRScanner from "./OCRScanner";
import JurnalUmum from "./JurnalUmum";
import { generateJournal } from "./journalRules";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  CalendarIcon,
  ArrowLeft,
  Clock,
  Check,
  ChevronsUpDown,
  Trash2,
  Info,
  FileText,
  ScanLine,
  Upload,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Receipt,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Transaction Report Component
function TransactionReport() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from("journal_entries")
        .select("*")
        .order("tanggal", { ascending: false })
        .limit(50);

      if (supabaseError) throw supabaseError;
      setTransactions(data || []);
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Riwayat Transaksi</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-slate-300">
          <thead className="bg-slate-100">
            <tr>
              <th className="border border-slate-300 px-4 py-2 text-left">
                Tanggal
              </th>
              <th className="border border-slate-300 px-4 py-2 text-left">
                Journal Ref
              </th>
              <th className="border border-slate-300 px-4 py-2 text-left">
                Jenis Transaksi
              </th>
              <th className="border border-slate-300 px-4 py-2 text-left">
                Debit Account
              </th>
              <th className="border border-slate-300 px-4 py-2 text-left">
                Credit Account
              </th>
              <th className="border border-slate-300 px-4 py-2 text-right">
                Debit
              </th>
              <th className="border border-slate-300 px-4 py-2 text-right">
                Credit
              </th>
              <th className="border border-slate-300 px-4 py-2 text-left">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id} className="hover:bg-slate-50">
                <td className="border border-slate-300 px-4 py-2">
                  {txn.tanggal}
                </td>
                <td className="border border-slate-300 px-4 py-2 font-mono text-sm">
                  {txn.journal_ref}
                </td>
                <td className="border border-slate-300 px-4 py-2">
                  {txn.jenis_transaksi}
                </td>
                <td className="border border-slate-300 px-4 py-2 font-mono text-sm">
                  {txn.debit_account}
                </td>
                <td className="border border-slate-300 px-4 py-2 font-mono text-sm">
                  {txn.credit_account}
                </td>
                <td className="border border-slate-300 px-4 py-2 text-right">
                  {txn.debit
                    ? new Intl.NumberFormat("id-ID").format(txn.debit)
                    : "-"}
                </td>
                <td className="border border-slate-300 px-4 py-2 text-right">
                  {txn.credit
                    ? new Intl.NumberFormat("id-ID").format(txn.credit)
                    : "-"}
                </td>
                <td className="border border-slate-300 px-4 py-2">
                  {txn.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * ========================================================================
 * TRANSAKSI KEUANGAN FORM - COMPLETE FINANCIAL TRANSACTION SYSTEM
 * ========================================================================
 *
 * FEATURES IMPLEMENTED:
 *
 * A. JENIS TRANSAKSI (Transaction Types):
 *    - Penjualan (Sales), Pembelian (Purchase), Pendapatan (Income), Pengeluaran (Expense)
 *    - Transfer Bank, Setoran Modal, Prive, Pelunasan Hutang/Piutang
 *
 * B. KATEGORI LAYANAN (Service Categories):
 *    - Freight Forwarding, Customs Clearance, Warehousing, Trucking, Consulting
 *
 * C. ITEM TRANSAKSI (Transaction Items):
 *    - Barang (Goods) - linked to stock table
 *    - Jasa (Services) - linked to service_items table
 *
 * D. SUPPLIER/CUSTOMER MANAGEMENT:
 *    - Hybrid dropdown (searchable + creatable)
 *    - Auto-save new entries to database
 *
 * E. METODE PEMBAYARAN (Payment Methods):
 *    - Cash → Shows Kas account dropdown
 *    - Transfer Bank → Shows Bank account dropdown
 *    - Kredit → Auto-selects Piutang/Hutang accounts
 *
 * F. AKUN OTOMATIS BERDASARKAN COA (Automatic COA Account Selection):
 *    - Penjualan Tunai: Debit Kas/Bank → Kredit Pendapatan
 *    - Penjualan Kredit: Debit Piutang → Kredit Pendapatan
 *    - Pembelian Tunai: Debit Persediaan/Beban → Kredit Kas/Bank
 *    - Pembelian Kredit: Debit Persediaan/Beban → Kredit Hutang
 *    - Transfer Bank: Debit Bank Tujuan → Kredit Bank Asal
 *    - Setoran Modal: Debit Kas/Bank → Kredit Modal
 *    - Prive: Debit Prive → Kredit Kas/Bank
 *    - Pelunasan Hutang: Debit Hutang → Kredit Kas/Bank
 *    - Pelunasan Piutang: Debit Kas/Bank → Kredit Piutang
 *    - HPP (for Penjualan): Debit HPP → Kredit Persediaan
 *
 * G. JURNAL OTOMATIS (Automatic Journal Entries):
 *    - Every transaction generates 2 journal entry lines:
 *      Line 1: Debit entry (debit amount, credit = 0)
 *      Line 2: Credit entry (debit = 0, credit amount)
 *    - Saved to journal_entries table
 *    - general_ledger auto-populated via SQL trigger
 *
 * H. FIELD WAJIB (Required Fields):
 *    1. payee_name - Recipient name (hybrid dropdown)
 *    2. payer_name - Payer name (hybrid dropdown)
 *    3. handled_by_user_id - Current logged-in user (auto)
 *    4. sumber_penerimaan/sumber_pengeluaran - Auto from COA
 *    5. deskripsi - Transaction description
 *    6. tanggal - Transaction date
 *    7. total - Transaction amount
 *    8. attachment_url - OCR receipt file URL
 *
 * I. VALIDASI (Validation):
 *    - Nominal > 0
 *    - Cash payment → Kas account required
 *    - Transfer Bank → Bank account required
 *    - Kredit → Auto-selects Hutang/Piutang
 *    - OCR failure → Manual input still allowed
 *
 * J. OUTPUT SISTEM (System Output):
 *    1. Complete financial transaction form
 *    2. Auto-fill data from OCR
 *    3. Hybrid dropdowns (searchable + creatable)
 *    4. Automatic journal entries (no manual debit/credit)
 *    5. Auto-populated general ledger
 *    6. Auto-linked stock and services
 *    7. Receipt files stored in Supabase Storage
 *    8. Internal user audit trail
 *
 * TECHNICAL STACK:
 *    - React + TypeScript
 *    - Supabase (Database + Storage + Edge Functions)
 *    - ShadCN UI Components
 *    - OCR Processing (Google Vision API)
 *    - Automatic COA Mapping Engine
 *
 * ========================================================================
 */

export default function TransaksiKeuanganForm() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showReport, setShowReport] = useState(true);

  const [jenisTransaksi, setJenisTransaksi] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [kategori, setKategori] = useState("");
  const [jenisLayanan, setJenisLayanan] = useState("");

  // Kategori Akuntansi Transaksi - untuk menentukan logika jurnal
  const [kategoriAkuntansi, setKategoriAkuntansi] = useState<string>("");
  
  // Metode Pencatatan: Cash vs Akrual
  const [metodePencatatan, setMetodePencatatan] = useState<"cash" | "akrual">("cash");
  
  // Status untuk transaksi non-beban (uang muka, prepaid)
  const [statusTransaksi, setStatusTransaksi] = useState<"open" | "settled">("open");
  const [saldoSisa, setSaldoSisa] = useState<number>(0);
  
  // Pihak terkait (relasi kondisional)
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false);
  
  // Live Journal Preview
  const [liveJournalPreview, setLiveJournalPreview] = useState<{
    debit: { account_code: string; account_name: string; amount: number }[];
    credit: { account_code: string; account_name: string; amount: number }[];
  }>({ debit: [], credit: [] });
  
  // Kategori Akuntansi Options berdasarkan jenis transaksi
  const kategoriAkuntansiOptions: Record<string, { value: string; label: string; coaPrefix: string; description: string; relatedParty?: string }[]> = {
    "Pengeluaran": [
      { value: "beban_operasional", label: "Beban Operasional", coaPrefix: "6-", description: "Biaya operasional harian (listrik, internet, dll)", relatedParty: "vendor" },
      { value: "uang_muka_karyawan", label: "Uang Muka Karyawan", coaPrefix: "1-", description: "Kasbon/pinjaman karyawan", relatedParty: "employee" },
      { value: "biaya_dibayar_dimuka", label: "Biaya Dibayar Dimuka", coaPrefix: "1-", description: "Sewa, asuransi dibayar dimuka", relatedParty: "vendor" },
      { value: "pembelian_aset", label: "Pembelian Aset Tetap", coaPrefix: "1-", description: "Pembelian peralatan, kendaraan, dll", relatedParty: "vendor" },
      { value: "transfer_internal", label: "Transfer Internal", coaPrefix: "1-", description: "Transfer antar kas/bank" },
      { value: "pembayaran_gaji", label: "Pembayaran Gaji", coaPrefix: "6-", description: "Gaji dan tunjangan karyawan", relatedParty: "employee" },
    ],
    "Pengeluaran Kas": [
      { value: "beban_operasional", label: "Beban Operasional", coaPrefix: "6-", description: "Biaya operasional harian (listrik, internet, dll)", relatedParty: "vendor" },
      { value: "uang_muka_karyawan", label: "Uang Muka Karyawan", coaPrefix: "1-", description: "Kasbon/pinjaman karyawan", relatedParty: "employee" },
      { value: "biaya_dibayar_dimuka", label: "Biaya Dibayar Dimuka", coaPrefix: "1-", description: "Sewa, asuransi dibayar dimuka", relatedParty: "vendor" },
      { value: "pembelian_aset", label: "Pembelian Aset Tetap", coaPrefix: "1-", description: "Pembelian peralatan, kendaraan, dll", relatedParty: "vendor" },
      { value: "pembayaran_gaji", label: "Pembayaran Gaji", coaPrefix: "6-", description: "Gaji dan tunjangan karyawan", relatedParty: "employee" },
    ],
    "Pendapatan": [
      { value: "pendapatan_usaha", label: "Pendapatan Usaha", coaPrefix: "4-", description: "Pendapatan dari kegiatan utama", relatedParty: "customer" },
      { value: "pendapatan_lain", label: "Pendapatan Lain-lain", coaPrefix: "4-", description: "Bunga bank, denda, dll" },
      { value: "penerimaan_piutang", label: "Penerimaan Piutang", coaPrefix: "1-", description: "Pelunasan piutang dari pelanggan", relatedParty: "customer" },
    ],
  };

  // Get COA prefix based on kategori akuntansi
  const getCoaPrefixByKategori = (): string => {
    if (!kategoriAkuntansi || !jenisTransaksi) return "";
    const options = kategoriAkuntansiOptions[jenisTransaksi];
    if (!options) return "";
    const selected = options.find(opt => opt.value === kategoriAkuntansi);
    return selected?.coaPrefix || "";
  };

  // Get related party type based on kategori akuntansi
  const getRelatedPartyType = (): string | undefined => {
    if (!kategoriAkuntansi || !jenisTransaksi) return undefined;
    const options = kategoriAkuntansiOptions[jenisTransaksi];
    if (!options) return undefined;
    const selected = options.find(opt => opt.value === kategoriAkuntansi);
    return selected?.relatedParty;
  };

  // Check if transaction is non-beban (requires status tracking)
  const isNonBebanTransaction = (): boolean => {
    return ["uang_muka_karyawan", "biaya_dibayar_dimuka", "penerimaan_piutang"].includes(kategoriAkuntansi);
  };

  // Generate live journal preview
  const generateLiveJournalPreview = () => {
    if (!kategoriAkuntansi || !nominal) {
      setLiveJournalPreview({ debit: [], credit: [] });
      return;
    }

    const amount = parseFloat(nominal.replace(/[^0-9.-]+/g, "")) || 0;
    if (amount <= 0) {
      setLiveJournalPreview({ debit: [], credit: [] });
      return;
    }

    const debitEntries: { account_code: string; account_name: string; amount: number }[] = [];
    const creditEntries: { account_code: string; account_name: string; amount: number }[] = [];

    // Determine debit account based on kategori akuntansi
    if (jenisTransaksi === "Pengeluaran" || jenisTransaksi === "Pengeluaran Kas") {
      // Debit: Expense/Asset account
      if (selectedExpenseAccount) {
        debitEntries.push({
          account_code: selectedExpenseAccount.account_code,
          account_name: selectedExpenseAccount.account_name,
          amount,
        });
      } else {
        const prefix = getCoaPrefixByKategori();
        debitEntries.push({
          account_code: prefix ? `${prefix}xxxx` : "?",
          account_name: kategoriAkuntansi === "beban_operasional" ? "Beban Operasional" : 
                       kategoriAkuntansi === "uang_muka_karyawan" ? "Uang Muka Karyawan" :
                       kategoriAkuntansi === "biaya_dibayar_dimuka" ? "Biaya Dibayar Dimuka" :
                       kategoriAkuntansi === "pembelian_aset" ? "Aset Tetap" : "Akun Debit",
          amount,
        });
      }

      // Credit: Cash/Bank or Hutang (based on metode pencatatan)
      if (metodePencatatan === "cash") {
        if (selectedBank) {
          const bankAcc = banks.find(b => b.account_name === selectedBank);
          creditEntries.push({
            account_code: bankAcc?.account_code || "1-1xxx",
            account_name: selectedBank || "Bank",
            amount,
          });
        } else if (selectedKas) {
          const kasAcc = kasAccounts.find(k => k.account_name === selectedKas);
          creditEntries.push({
            account_code: kasAcc?.account_code || "1-1xxx",
            account_name: selectedKas || "Kas",
            amount,
          });
        } else {
          creditEntries.push({
            account_code: "1-1xxx",
            account_name: "Kas/Bank",
            amount,
          });
        }
      } else {
        // Akrual: Credit Hutang
        creditEntries.push({
          account_code: "2-1xxx",
          account_name: "Hutang Usaha",
          amount,
        });
      }
    } else if (jenisTransaksi === "Pendapatan") {
      // Debit: Cash/Bank or Piutang
      if (metodePencatatan === "cash") {
        if (selectedBank) {
          const bankAcc = banks.find(b => b.account_name === selectedBank);
          debitEntries.push({
            account_code: bankAcc?.account_code || "1-1xxx",
            account_name: selectedBank || "Bank",
            amount,
          });
        } else if (selectedKas) {
          const kasAcc = kasAccounts.find(k => k.account_name === selectedKas);
          debitEntries.push({
            account_code: kasAcc?.account_code || "1-1xxx",
            account_name: selectedKas || "Kas",
            amount,
          });
        } else {
          debitEntries.push({
            account_code: "1-1xxx",
            account_name: "Kas/Bank",
            amount,
          });
        }
      } else {
        // Akrual: Debit Piutang
        debitEntries.push({
          account_code: "1-2xxx",
          account_name: "Piutang Usaha",
          amount,
        });
      }

      // Credit: Revenue account
      if (selectedRevenueAccount) {
        creditEntries.push({
          account_code: selectedRevenueAccount.account_code,
          account_name: selectedRevenueAccount.account_name,
          amount,
        });
      } else {
        creditEntries.push({
          account_code: "4-xxxx",
          account_name: "Pendapatan",
          amount,
        });
      }
    }

    setLiveJournalPreview({ debit: debitEntries, credit: creditEntries });
  };

  // Load employees for related party selection
  const loadEmployeesForRelatedParty = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, entity")
      .order("full_name", { ascending: true });
    
    if (!error && data) {
      setEmployees(data);
    }
  };

  // New fields for item selection
  const [transactionItemType, setTransactionItemType] = useState(""); // "Barang" or "Jasa"
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [serviceItems, setServiceItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedItemDetail, setSelectedItemDetail] = useState("");
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [itemTotal, setItemTotal] = useState<number>(0);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Jurnal Umum AI Suggestions (disabled for manual Jurnal Umum)
  const [jurnalUmumSuggestions, setJurnalUmumSuggestions] =
    useState<string>("");
  const [isLoadingJurnalSuggestions, setIsLoadingJurnalSuggestions] =
    useState(false);
  const [journalRows, setJournalRows] = useState([
    { account_code: "", debit: 0, credit: 0, keterangan_baris: "" },
  ]);

  const updateRow = (
    index: number,
    field: "account_code" | "debit" | "credit" | "keterangan_baris",
    value: string | number,
  ) => {
    setJournalRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const addRow = () => {
    setJournalRows((prev) => [
      ...prev,
      { account_code: "", debit: 0, credit: 0, keterangan_baris: "" },
    ]);
  };

  const removeRow = (index: number) => {
    setJournalRows((prev) => prev.filter((_, i) => i !== index));
  };

  // OCR Upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // const [items, setItems] = useState<any[]>([]);
  //const [brands, setBrands] = useState<any[]>([]);
  //const [filteredBrands, setFilteredBrands] = useState<any[]>([]);

  // Popover states for searchable selects
  const [openItemPopover, setOpenItemPopover] = useState(false);
  const [openDescriptionPopover, setOpenDescriptionPopover] = useState(false);
  // SEARCH STATES
  const [itemSearchKeyword, setItemSearchKeyword] = useState("");
  const [descriptionSearchKeyword, setDescriptionSearchKeyword] = useState("");

  // RAW DATA
  const [items, setItems] = useState<any[]>([]);
  const [descriptions, setDescriptions] = useState<any[]>([]);

  // FILTERED ITEMS
  const filteredItemsComputed = Array.isArray(items)
    ? items.filter((i) => {
        const nameValue =
          i && typeof i.item_name === "string" ? i.item_name : "";
        const keywordValue =
          typeof itemSearchKeyword === "string" ? itemSearchKeyword : "";
        return nameValue.toLowerCase().includes(keywordValue.toLowerCase());
      })
    : [];

  // FILTERED DESCRIPTIONS
  const filteredDescriptionsComputed = Array.isArray(descriptions)
    ? descriptions.filter((d) => {
        const descValue =
          d && typeof d.description === "string" ? d.description : "";
        const keywordValue =
          typeof descriptionSearchKeyword === "string"
            ? descriptionSearchKeyword
            : "";
        return descValue.toLowerCase().includes(keywordValue.toLowerCase());
      })
    : [];

  // Safe arrays for rendering
  const safeFilteredItems = Array.isArray(filteredItemsComputed)
    ? filteredItemsComputed
    : [];

  const safeFilteredDescriptions = Array.isArray(filteredDescriptionsComputed)
    ? filteredDescriptionsComputed
    : [];

  const [coa, setCoa] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [consignees, setConsignees] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [kasAccounts, setKasAccounts] = useState<any[]>([]);

  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [customer, setCustomer] = useState("");
  const [consignee, setConsignee] = useState("");
  const [supplier, setSupplier] = useState("");

  // Multiple items for Penjualan
  const [salesItems, setSalesItems] = useState<Array<{
    id: string;
    itemName: string;
    jenisBarang: string;
    quantity: string;
    nominal?: string;
    stockId?: string;
    sellingPrice?: number;
    tipeItem?: string;
    purchasePrice?: number;
  }>>([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedKas, setSelectedKas] = useState("");

  // Searchable dropdown states
  const [customerSearch, setCustomerSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const [kasSearch, setKasSearch] = useState("");
  const [namaPenerimaSearch, setNamaPenerimaSearch] = useState("");
  const [namaPengeluaranSearch, setNamaPengeluaranSearch] = useState("");
  const [stockItemSearch, setStockItemSearch] = useState("");

  // Additional fields for dynamic form
  const [bankAsal, setBankAsal] = useState("");
  const [bankTujuan, setBankTujuan] = useState("");
  const [akunPendapatan, setAkunPendapatan] = useState("");
  const [selectedRevenueAccount, setSelectedRevenueAccount] = useState<{
    id: string;
    account_code: string;
    account_name: string;
    description?: string;
  } | null>(null);
  const [akunBeban, setAkunBeban] = useState("");
  const [selectedExpenseAccount, setSelectedExpenseAccount] = useState<{
    id: string;
    account_code: string;
    account_name: string;
    account_type?: string;
    description?: string;
  } | null>(null);
  const [akunModal, setAkunModal] = useState("");
  const [selectedModalAccount, setSelectedModalAccount] = useState<{
    id: string;
    account_code: string;
    account_name: string;
    description?: string;
  } | null>(null);
  const [namaPemilik, setNamaPemilik] = useState("");
  const [namaPenyumbang, setNamaPenyumbang] = useState("");
  const [sumberPenerimaan, setSumberPenerimaan] = useState("");
  const [sumberPengeluaran, setSumberPengeluaran] = useState("");

  // Popover open states
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false);
  const [bankPopoverOpen, setBankPopoverOpen] = useState(false);
  const [kasPopoverOpen, setKasPopoverOpen] = useState(false);
  const [bankAsalPopoverOpen, setBankAsalPopoverOpen] = useState(false);
  const [bankTujuanPopoverOpen, setBankTujuanPopoverOpen] = useState(false);
  const [akunPendapatanPopoverOpen, setAkunPendapatanPopoverOpen] =
    useState(false);
  const [akunBebanPopoverOpen, setAkunBebanPopoverOpen] = useState(false);
  const [akunModalPopoverOpen, setAkunModalPopoverOpen] = useState(false);
  const [namaPenerimaPopoverOpen, setNamaPenerimaPopoverOpen] = useState(false);
  const [namaPengeluaranPopoverOpen, setNamaPengeluaranPopoverOpen] =
    useState(false);

  // Add COA Modal state
  const [showAddCOAModal, setShowAddCOAModal] = useState(false);
  const [newCOA, setNewCOA] = useState({
    account_code: "",
    account_name: "",
    account_type: "expense",
    normal_balance: "DEBIT",
    description: "",
  });
  const [savingCOA, setSavingCOA] = useState(false);
  const [coaContextType, setCoaContextType] = useState<"expense" | "revenue">("expense");

  // Stock information state
  const [stockInfo, setStockInfo] = useState<any>(null);
  const [loadingStock, setLoadingStock] = useState(false);

  // Loan-related state
  const [borrowers, setBorrowers] = useState<any[]>([]);
  const [selectedBorrower, setSelectedBorrower] = useState("");
  const [selectedBorrowerData, setSelectedBorrowerData] = useState<any>(null);
  const [loanType, setLoanType] = useState("");
  const [interestRate, setInterestRate] = useState("0");
  const [loanTermMonths, setLoanTermMonths] = useState("");
  const [maturityDate, setMaturityDate] = useState("");
  const [paymentSchedule, setPaymentSchedule] = useState("Bulanan");
  const [principalAmount, setPrincipalAmount] = useState("0");
  const [interestAmount, setInterestAmount] = useState("0");
  const [lateFee, setLateFee] = useState("0");
  const [lateFeePercentage, setLateFeePercentage] = useState("0.1"); // Default 0.1% per day
  const [daysLate, setDaysLate] = useState("0");
  const [actualPaymentDate, setActualPaymentDate] = useState("");
  const [installmentSchedule, setInstallmentSchedule] = useState<any[]>([]);
  const [taxAmount, setTaxAmount] = useState("0");
  const [taxPercentage, setTaxPercentage] = useState("0");
  const [taxType, setTaxType] = useState(""); // PPh21, PPh23, PPN, etc.
  const [loanCalculationMethod, setLoanCalculationMethod] = useState("Anuitas");

  // Transactions list state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [userMappings, setUserMappings] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [nominal, setNominal] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [hargaJual, setHargaJual] = useState("");
  const [hargaBeli, setHargaBeli] = useState("");
  const [ppnPercentage, setPpnPercentage] = useState("11");
  const [ppnAmount, setPpnAmount] = useState("0");
  const [tanggal, setTanggal] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [buktiUrl, setBuktiUrl] = useState("");

  const [coaSelected, setCoaSelected] = useState("");

  const [openItemModal, setOpenItemModal] = useState(false);
  const [openBrandModal, setOpenBrandModal] = useState(false);
  const [openStockItemModal, setOpenStockItemModal] = useState(false);
  const [openBorrowerModal, setOpenBorrowerModal] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [previewLines, setPreviewLines] = useState<any[]>([]);
  const [previewMemo, setPreviewMemo] = useState("");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const safeBanks = Array.isArray(banks) ? banks : [];
  const safeKasAccounts = Array.isArray(kasAccounts) ? kasAccounts : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const safeConsignees = Array.isArray(consignees) ? consignees : [];
  const safeServiceTypes = Array.isArray(serviceTypes) ? serviceTypes : [];
  const [previewTanggal, setPreviewTanggal] = useState("");
  const [previewIsCashRelated, setPreviewIsCashRelated] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Account Name Combobox state
  const [openAccountNameCombobox, setOpenAccountNameCombobox] = useState(false);
  const [searchAccountName, setSearchAccountName] = useState("");

  // Employee state for Beban Gaji (reusing employees state from above)
  const [openEmployeeCombobox, setOpenEmployeeCombobox] = useState(false);
  const [searchEmployee, setSearchEmployee] = useState("");

  // Employee state for Pengeluaran Kas
  const [openEmployeePengeluaranCombobox, setOpenEmployeePengeluaranCombobox] =
    useState(false);
  const [searchEmployeePengeluaran, setSearchEmployeePengeluaran] =
    useState("");

  // Cart state - load from localStorage on mount
  const [cart, setCart] = useState<any[]>(() => {
    const savedCart = localStorage.getItem("transaksi_keuangan_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [showCart, setShowCart] = useState(false);

  // Toggle checkbox for cart item
  const toggleCartItemSelection = (itemId: string) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) =>
        item.id === itemId ? { ...item, selected: !item.selected } : item,
      );
      localStorage.setItem(
        "transaksi_keuangan_cart",
        JSON.stringify(updatedCart),
      );
      return updatedCart;
    });
  };

  // Select/Deselect all items
  const toggleSelectAll = () => {
    const allSelected = cart.every((item) => item.selected);
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) => ({
        ...item,
        selected: !allSelected,
      }));
      localStorage.setItem(
        "transaksi_keuangan_cart",
        JSON.stringify(updatedCart),
      );
      return updatedCart;
    });
  };

  // Conditional fields state
  const [kasSumber, setKasSumber] = useState("");
  const [kasTujuan, setKasTujuan] = useState("");
  const [kategoriPengeluaran, setKategoriPengeluaran] = useState("");
  const [selectedAccountType, setSelectedAccountType] = useState("");
  const [selectedAccountName, setSelectedAccountName] = useState("");

  // Penerimaan Kas dropdown states
  const [
    openAccountTypePenerimaanCombobox,
    setOpenAccountTypePenerimaanCombobox,
  ] = useState(false);
  const [searchAccountTypePenerimaan, setSearchAccountTypePenerimaan] =
    useState("");
  const [
    openAccountNamePenerimaanCombobox,
    setOpenAccountNamePenerimaanCombobox,
  ] = useState(false);
  const [searchAccountNamePenerimaan, setSearchAccountNamePenerimaan] =
    useState("");

  // Kredit Section states for Penerimaan Kas
  const [selectedCreditAccountType, setSelectedCreditAccountType] =
    useState("");
  const [selectedCreditAccountName, setSelectedCreditAccountName] =
    useState("");
  const [openCreditAccountTypeCombobox, setOpenCreditAccountTypeCombobox] =
    useState(false);
  const [searchCreditAccountType, setSearchCreditAccountType] = useState("");
  const [openCreditAccountNameCombobox, setOpenCreditAccountNameCombobox] =
    useState(false);
  const [searchCreditAccountName, setSearchCreditAccountName] = useState("");

  // Pengeluaran Kas specific fields
  const [jenisPembayaranPengeluaran, setJenisPembayaranPengeluaran] =
    useState("Cash");
  const [namaPengeluaran, setNamaPengeluaran] = useState("");
  // const [namaKaryawanPengeluaran, setNamaKaryawanPengeluaran] = useState("");

  // COA accounts for kategori pengeluaran
  const [coaAccounts, setCoaAccounts] = useState<any[]>([]);
  const [filteredAccountNames, setFilteredAccountNames] = useState<string[]>(
    [],
  );

  // OCR-related state
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrFilePreview, setOcrFilePreview] = useState<string | null>(null);
  const [ocrExtractedText, setOcrExtractedText] = useState("");
  const [ocrParsedData, setOcrParsedData] = useState<any>(null);
  const [ocrAppliedData, setOcrAppliedData] = useState<any>(null);

  const { toast } = useToast();

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("transaksi_keuangan_cart", JSON.stringify(cart));
  }, [cart]);

  // Load transactions on component mount
  useEffect(() => {
    loadTransactions();
    loadCOAAccounts();
    loadEmployees();
    loadEmployeesForRelatedParty();

    // Subscribe to realtime changes - DISABLED FOR PERFORMANCE
    // const subscription = supabase
    //   .channel("transactions-changes")
    //   .on(
    //     "postgres_changes",
    //     { event: "*", schema: "public", table: "approval_transaksi" },
    //     () => loadTransactions(),
    //   )
    //   .on(
    //     "postgres_changes",
    //     { event: "*", schema: "public", table: "kas_transaksi" },
    //     () => loadTransactions(),
    //   )
    //   .on(
    //     "postgres_changes",
    //     { event: "*", schema: "public", table: "sales_transactions" },
    //     () => loadTransactions(),
    //   )
    //   .on(
    //     "postgres_changes",
    //     { event: "*", schema: "public", table: "cash_disbursement" },
    //     () => loadTransactions(),
    //   )
    //   .on(
    //     "postgres_changes",
    //     { event: "*", schema: "public", table: "purchase_transactions" },
    //     () => loadTransactions(),
    //   )
    //   .on(
    //     "postgres_changes",
    //     { event: "*", schema: "public", table: "cash_and_bank_receipts" },
    //     () => loadTransactions(),
    //   )
    //   .subscribe();

    // return () => {
    //   subscription.unsubscribe();
    // };
  }, []);

  // Load employees from users table
  const loadEmployees = async () => {
    const { data, error: supabaseError } = await supabase
      .from("users")
      .select("id, full_name, email, entity")
      .order("full_name", { ascending: true });

    if (supabaseError) {
      console.error("Error loading employees:", supabaseError);
    } else {
      setEmployees(data || []);
      setUsers(data || []); // Also populate users state
    }
  };


  // Load service items from service_items table
  const loadServiceItems = async (): Promise<void> => {
    try {
      const { data, error: supabaseError } = await supabase
        .from("service_items")
        .select("id, service_name, service_type, price")
        .order("service_name");
      if (supabaseError) throw supabaseError;
      console.log("Service items loaded:", data);
      console.log("Service items count:", data?.length);
      setServiceItems(data || []);
    } catch (err) {
      console.error("Error loading service items:", err);
      setServiceItems([]);
    }
  };

  // Fetch items dynamically based on transaction type
  const fetchTransactionItems = async (tipeItemTransaksi: string) => {
    if (!tipeItemTransaksi || !["Barang", "Jasa"].includes(tipeItemTransaksi)) {
      return;
    }

    setIsLoadingItems(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-fetch-transaction-items",
        {
          body: { tipeItemTransaksi },
        },
      );

      if (error) throw error;

      if (tipeItemTransaksi === "Barang") {
        const mappedItems = (data.items || []).map((item: any) => ({
          id: item.id,
          item_name: item.item_name,
          jenis_barang: item.jenis_barang,
          selling_price: item.selling_price,
          quantity: item.quantity
        }));
        setStockItems(mappedItems);
        setServiceItems([]);
        console.log("Stock items mapped:", mappedItems);
      } else {
        const mappedItems = (data.items || []).map((item: any) => ({
          id: item.id,
          service_name: item.service_name,
          service_type: item.service_type,
          price: item.price
        }));
        setServiceItems(mappedItems);
        setStockItems([]);
        console.log("Service items mapped:", mappedItems);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data item",
        variant: "destructive",
      });
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Effect to fetch items when transaction type changes
  useEffect(() => {
    if (transactionItemType) {
      fetchTransactionItems(transactionItemType);
      // Reset selections when type changes
      setSelectedItemId("");
      setSelectedItemDetail("");
      setItemPrice(0);
      setItemQty(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionItemType]);

  // Effect to update item details when item is selected
  useEffect(() => {
    if (selectedItemId) {
      const allItems =
        transactionItemType === "Barang" ? stockItems : serviceItems;
      const selectedItem = allItems.find((item) => item.id === selectedItemId);

      if (selectedItem) {
        setSelectedItemDetail(selectedItem.detail || "");
        setItemPrice(selectedItem.price || 0);
      }
    }
  }, [selectedItemId, transactionItemType, stockItems, serviceItems]);

  // Effect to calculate total
  useEffect(() => {
    setItemTotal(itemPrice * itemQty);
  }, [itemPrice, itemQty]);

  // Effect to generate live journal preview
  useEffect(() => {
    generateLiveJournalPreview();
  }, [kategoriAkuntansi, nominal, selectedExpenseAccount, selectedRevenueAccount, selectedBank, selectedKas, metodePencatatan, jenisTransaksi]);

  const fetchJurnalUmumSuggestions = async () => {
    if (!previewMemo) return;

    setIsLoadingJurnalSuggestions(true);
    setJurnalUmumSuggestions("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-jurnal-umum-ai-saran-akun",
        {
          body: {
            userInput:
              previewMemo ||
              memo ||
              "Suggest journal entries for this transaksi keuangan.",
          },
        },
      );

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      if (data?.suggestions) {
        setJurnalUmumSuggestions(String(data.suggestions));
      }
    } catch (err) {
      console.error("Error fetching jurnal umum suggestions:", err);
      toast({
        title: "Error",
        description: "Gagal mengambil saran jurnal umum",
        variant: "destructive",
      });
    } finally {
      setIsLoadingJurnalSuggestions(false);
    }
  };

  // Handle OCR file upload and processing
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      toast({
        title: "Error",
        description: "Hanya file JPG/PNG yang diperbolehkan",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setIsProcessingOCR(true);

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("ocr-receipts")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("ocr-receipts").getPublicUrl(fileName);

      setUploadedFileUrl(publicUrl);

      // 2. Convert file to base64
      const base64File = await fileToBase64(file);

      // 3. Call OCR Edge Function
      const projectRef =
        import.meta.env.VITE_SUPABASE_URL?.split("//")[1]?.split(".")[0] || "";

      const response = await fetch(
        `https://gfmokpjnnnbnjlqxhoux.supabase.co/functions/v1/supabase-functions-ocr-transaction-processor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ""}`,
          },
          body: JSON.stringify({
            file: [base64File],
            metadata: {
              entrypoint_path: "index.ts",
              import_map_path: "deno.json",
              static_patterns: [],
              verify_jwt: true,
              name: "ocr-transaction-processor",
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OCR processing failed: ${response.statusText}`);
      }

      const ocrData = await response.json();

      // 4. Prefill form with OCR data
      if (ocrData.vendor_name) {
        setNamaPenerimaSearch(ocrData.vendor_name);
        setNamaPengeluaranSearch(ocrData.vendor_name);
      }
      if (ocrData.transaction_date) {
        setTanggalTransaksi(ocrData.transaction_date);
      }
      if (ocrData.total_amount) {
        setNominal(ocrData.total_amount.toString());
      }
      if (ocrData.payment_method) {
        const methodMap: Record<string, string> = {
          cash: "Cash",
          bank: "Transfer Bank",
          transfer: "Transfer Bank",
        };
        const paymentMethodRaw = ocrData.payment_method;
        const paymentMethod =
          typeof paymentMethodRaw === "string"
            ? paymentMethodRaw.toLowerCase()
            : "";
        setPaymentType(methodMap[paymentMethod] || "Cash");
      }
      if (ocrData.invoice_number) {
        setDescription(ocrData.invoice_number);
      }

      // Match items with stock/service_items
      if (
        ocrData.items &&
        Array.isArray(ocrData.items) &&
        ocrData.items.length > 0
      ) {
        const firstItem = ocrData.items[0];

        const firstNameRaw =
          firstItem && typeof firstItem.name === "string" ? firstItem.name : "";
        const firstName = firstNameRaw ? firstNameRaw.toLowerCase() : "";

        // Try to match with stock items
        const matchedStock = Array.isArray(stockItems)
          ? stockItems.find((s) => {
              const productName =
                s && typeof s.product_name === "string" ? s.product_name : "";
              return productName.toLowerCase().includes(firstName);
            })
          : undefined;

        if (matchedStock) {
          setTransactionItemType("Barang");
          setSelectedItemId(matchedStock.id);
          setItemQty(
            firstItem && typeof firstItem.qty === "number" ? firstItem.qty : 1,
          );
        } else {
          // Try to match with service items
          const matchedService = Array.isArray(serviceItems)
            ? serviceItems.find((s) => {
                const serviceName =
                  s && typeof s.service_name === "string" ? s.service_name : "";
                return serviceName.toLowerCase().includes(firstName);
              })
            : undefined;

          if (matchedService) {
            setTransactionItemType("Jasa");
            setSelectedItemId(matchedService.id);
            setItemQty(
              firstItem && typeof firstItem.qty === "number"
                ? firstItem.qty
                : 1,
            );
          }
        }
      }

      toast({
        title: "Sukses",
        description:
          "OCR berhasil! Form telah diisi otomatis. Silakan periksa dan edit jika perlu.",
      });
    } catch (error) {
      console.error("OCR processing error:", error);
      toast({
        title: "Error",
        description: "Gagal memproses OCR. Silakan isi form secara manual.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingOCR(false);
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Load COA accounts for kategori pengeluaran
  const loadCOAAccounts = async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from("chart_of_accounts")
        .select("account_type, account_name, level")
        .eq("is_active", true)
        .eq("is_header", false)
        .order("account_name", { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }

      setCoaAccounts(data || []);
    } catch (error) {
      console.error("Error loading COA accounts:", error);
      setCoaAccounts([]);
    }
  };

  // Handler when account_type is selected
  const handleAccountTypeChange = (accountType: string) => {
    setSelectedAccountType(accountType);

    // Ensure coaAccounts is always an array
    const safeCoaAccounts = Array.isArray(coaAccounts) ? coaAccounts : [];

    // Get all unique account_names for accounts with the same account_type and level 2 or 3
    const accountNames = safeCoaAccounts
      .filter(
        (acc) =>
          acc &&
          acc.account_type === accountType &&
          (acc.level === 2 || acc.level === 3),
      )
      .map((acc) => acc.account_name)
      .filter((value, index, self) => value && self.indexOf(value) === index);

    setFilteredAccountNames(accountNames);

    // If only one account_name, auto-select it
    if (accountNames.length === 1) {
      setSelectedAccountName(accountNames[0]);
      setKategoriPengeluaran(accountNames[0]);
    } else {
      setSelectedAccountName("");
      setKategoriPengeluaran("");
    }
  };

  // Handler when account_name is selected (after account_type)
  const handleAccountNameChangeAfterType = (accountName: string) => {
    setSelectedAccountName(accountName);
    setKategoriPengeluaran(accountName);
  };

  /** Dynamic Field Visibility Logic */
  const getVisibleFields = () => {
    switch (jenisTransaksi) {
      case "Transfer Bank":
        return {
          showBankAsal: true,
          showBankTujuan: true,
          showNominal: true,
          showTanggal: true,
          showDeskripsi: true,
          showUploadBukti: true,
          showItemFields: false,
          showPaymentMethod: false,
          showKasBank: false,
          showCustomer: false,
          showSupplier: false,
          showAkunPendapatan: false,
          showAkunBeban: false,
          showAkunModal: false,
          showSumberPenerimaan: false,
          showSumberPengeluaran: false,
          showNamaPenerima: false,
          showNamaPengeluaran: false,
          showNamaPemilik: false,
          showNamaPenyumbang: false,
        };

      case "Pendapatan":
        return {
          showPaymentMethod: true,
          showKasBank: true,
          showAkunPendapatan: true,
          showSumberPenerimaan: true,
          showNamaPenerima: true,
          showNominal: true,
          showTanggal: true,
          showDeskripsi: true,
          showUploadBukti: true,
          showItemFields: false,
          showBankAsal: false,
          showBankTujuan: false,
          showCustomer: false,
          showSupplier: false,
          showAkunBeban: false,
          showAkunModal: false,
          showSumberPengeluaran: false,
          showNamaPengeluaran: false,
          showNamaPemilik: false,
          showNamaPenyumbang: false,
        };

      case "Pengeluaran":
        return {
          showPaymentMethod: true,
          showKasBank: true,
          showAkunBeban: true,
          showSumberPengeluaran: true,
          showNamaPengeluaran: true,
          showNominal: true,
          showTanggal: true,
          showDeskripsi: true,
          showUploadBukti: true,
          showItemFields: false,
          showBankAsal: false,
          showBankTujuan: false,
          showCustomer: false,
          showSupplier: false,
          showAkunPendapatan: false,
          showAkunModal: false,
          showSumberPenerimaan: false,
          showNamaPenerima: false,
          showNamaPemilik: false,
          showNamaPenyumbang: false,
        };

      // 🔒 PENGELUARAN KAS - HANYA KAS, TIDAK ADA BANK
      case "Pengeluaran Kas":
        return {
          showPaymentMethod: false, // 🔒 TIDAK TAMPILKAN - hanya KAS
          showKasBank: false, // 🔒 TIDAK TAMPILKAN pilihan bank
          showAkunBeban: true,
          showSumberPengeluaran: true,
          showNamaPengeluaran: true,
          showNominal: true,
          showTanggal: true,
          showDeskripsi: true,
          showUploadBukti: true,
          showItemFields: false,
          showBankAsal: false,
          showBankTujuan: false,
          showCustomer: false,
          showSupplier: false,
          showAkunPendapatan: false,
          showAkunModal: false,
          showSumberPenerimaan: false,
          showNamaPenerima: false,
          showNamaPemilik: false,
          showNamaPenyumbang: false,
        };

      case "Penjualan":
        return {
          showItemFields: true,
          showCustomer: true,
          showPaymentMethod: true,
          showKasBank: true,
          showNominal: true,
          showTanggal: true,
          showDeskripsi: true,
          showUploadBukti: true,
          showBankAsal: false,
          showBankTujuan: false,
          showSupplier: false,
          showAkunPendapatan: false,
          showAkunBeban: false,
          showAkunModal: false,
          showSumberPenerimaan: false,
          showSumberPengeluaran: false,
          showNamaPenerima: false,
          showNamaPengeluaran: false,
          showNamaPemilik: false,
          showNamaPenyumbang: false,
        };

      case "Pembelian":
        return {
          showItemFields: true,
          showSupplier: true,
          showPaymentMethod: true,
          showKasBank: true,
          showAkunBeban: true,
          showNominal: true,
          showTanggal: true,
          showDeskripsi: true,
          showUploadBukti: true,
          showBankAsal: false,
          showBankTujuan: false,
          showCustomer: false,
          showAkunPendapatan: false,
          showAkunModal: false,
          showSumberPenerimaan: false,
          showSumberPengeluaran: false,
          showNamaPenerima: false,
          showNamaPengeluaran: false,
          showNamaPemilik: false,
          showNamaPenyumbang: false,
        };

      case "Setoran Modal":
        return {
          showPaymentMethod: true,
          showKasBank: true,
          showAkunModal: true,
          showNamaPenyumbang: true,
          showNominal: true,
          showTanggal: true,
          showDeskripsi: true,
          showUploadBukti: true,
          showItemFields: false,
          showBankAsal: false,
          showBankTujuan: false,
          showCustomer: false,
          showSupplier: false,
          showAkunPendapatan: false,
          showAkunBeban: false,
          showSumberPenerimaan: false,
          showSumberPengeluaran: false,
          showNamaPenerima: false,
          showNamaPengeluaran: false,
          showNamaPemilik: false,
        };

      case "Prive":
        return {
          showKasBank: true,
          showNamaPemilik: true,
          showNominal: true,
          showTanggal: true,
          showDeskripsi: true,
          showUploadBukti: true,
          showItemFields: false,
          showPaymentMethod: false,
          showBankAsal: false,
          showBankTujuan: false,
          showCustomer: false,
          showSupplier: false,
          showAkunPendapatan: false,
          showAkunBeban: false,
          showAkunModal: false,
          showSumberPenerimaan: false,
          showSumberPengeluaran: false,
          showNamaPenerima: false,
          showNamaPengeluaran: false,
          showNamaPenyumbang: false,
        };

      case "Pelunasan Piutang":
        return {
          showCustomer: true,
          showPaymentMethod: true,
          showKasBank: true,
          showNominal: true,
          showTanggal: true,
          showDeskripsi: true,
          showUploadBukti: true,
          showItemFields: false,
          showBankAsal: false,
          showBankTujuan: false,
          showSupplier: false,
          showAkunPendapatan: false,
          showAkunBeban: false,
          showAkunModal: false,
          showSumberPenerimaan: false,
          showSumberPengeluaran: false,
          showNamaPenerima: false,
          showNamaPengeluaran: false,
          showNamaPemilik: false,
          showNamaPenyumbang: false,
        };

      case "Pelunasan Hutang":
        return {
          showSupplier: true,
          showPaymentMethod: true,
          showKasBank: true,
          showNominal: true,
          showTanggal: true,
          showDeskripsi: true,
          showUploadBukti: true,
          showItemFields: false,
          showBankAsal: false,
          showBankTujuan: false,
          showCustomer: false,
          showAkunPendapatan: false,
          showAkunBeban: false,
          showAkunModal: false,
          showSumberPenerimaan: false,
          showSumberPengeluaran: false,
          showNamaPenerima: false,
          showNamaPengeluaran: false,
          showNamaPemilik: false,
          showNamaPenyumbang: false,
        };

      case "Jurnal Umum":
        return {
          showJurnalUmum: true,
          showItemFields: false,
          showPaymentMethod: false,
          showKasBank: false,
          showBankAsal: false,
          showBankTujuan: false,
          showCustomer: false,
          showSupplier: false,
          showAkunPendapatan: false,
          showAkunBeban: false,
          showAkunModal: false,
          showSumberPenerimaan: false,
          showSumberPengeluaran: false,
          showNamaPenerima: false,
          showNamaPengeluaran: false,
          showNamaPemilik: false,
          showNamaPenyumbang: false,
          showNominal: false,
          showTanggal: false,
          showDeskripsi: false,
          showUploadBukti: false,
        };

      default:
        return {
          showItemFields: false,
          showPaymentMethod: false,
          showKasBank: false,
          showBankAsal: false,
          showBankTujuan: false,
          showCustomer: false,
          showSupplier: false,
          showAkunPendapatan: false,
          showAkunBeban: false,
          showAkunModal: false,
          showSumberPenerimaan: false,
          showSumberPengeluaran: false,
          showNamaPenerima: false,
          showNamaPengeluaran: false,
          showNamaPemilik: false,
          showNamaPenyumbang: false,
          showNominal: true,
          showTanggal: true,
          showDeskripsi: true,
          showUploadBukti: true,
        };
    }
  };

  const visibleFields = getVisibleFields();

  /** Conditional Logic - Determine field visibility and state */
  const shouldShowField = (fieldName: string): boolean => {
    switch (fieldName) {
      case "kategoriLayanan":
      case "jenisLayanan":
        return jenisTransaksi === "Penjualan";

      case "itemBarang":
      case "description":
        return ["Penjualan", "Pembelian"].includes(jenisTransaksi);

      case "akunCoa":
        return ![
          "Pendapatan",
          "Pengeluaran",
          "Mutasi Kas",
          "Pelunasan Piutang",
          "Pembayaran Hutang",
          "Pinjaman Masuk",
          "Pelunasan Pinjaman",
        ].includes(jenisTransaksi);

      case "sumberPenerimaan":
        return jenisTransaksi === "Pendapatan";

      case "kategoriPenerimaan":
        return false; // Hidden for Pendapatan

      case "kasSumber":
      case "kasTujuan":
        return jenisTransaksi === "Mutasi Kas";

      case "kategoriPengeluaran":
        return false; // Hidden

      default:
        return true;
    }
  };

  const shouldDisableField = (fieldName: string): boolean => {
    if (fieldName === "paymentType") {
      return ["Pendapatan", "Pelunasan Piutang", "Pembayaran Hutang"].includes(
        jenisTransaksi,
      );
    }
    return false;
  };

  /** Auto-set Payment Type based on Jenis Transaksi */
  useEffect(() => {
    if (jenisTransaksi) {
      const penerimaanTypes = [
        "Penjualan",
        "Penjualan",
        "Pendapatan",
        "Pinjaman Masuk",
        "Pendapatan",
        "Penjualan",
        "Pelunasan Piutang",
        "Setoran Modal",
      ];

      const pengeluaranTypes = [
        "Pembelian",
        "Pengeluaran",
        "Pembayaran Pinjaman",
        "Pengeluaran",
        "Pelunasan Hutang",
        "Prive",
      ];

      // Don't auto-set paymentType for Pengeluaran - let user choose Bank/Kas
      if (penerimaanTypes.includes(jenisTransaksi)) {
        setPaymentType("Penerimaan");
      } else if (jenisTransaksi === "Transfer Bank") {
        setPaymentType("Transfer");
      }
      // Removed auto-setting paymentType for Pengeluaran types
    }
  }, [jenisTransaksi]);

  // Handle item selection and calculate total
  useEffect(() => {
    if (transactionItemType === "Barang" && selectedItemId) {
      const item = stockItems.find((s) => s.id === selectedItemId);
      if (item) {
        setItemPrice(item.unit_price || 0);
      }
    } else if (transactionItemType === "Jasa" && selectedItemId) {
      const item = serviceItems.find((s) => s.id === selectedItemId);
      if (item) {
        setItemPrice(item.service_price || 0);
      }
    }
  }, [transactionItemType, selectedItemId, stockItems, serviceItems]);

  useEffect(() => {
    setItemTotal(itemQty * itemPrice);
  }, [itemQty, itemPrice]);

  /** Load available categories based on Jenis Transaksi */
  const loadCategoriesForTransaction = async (transactionType: string) => {
    try {
      // Define category mapping based on transaction type
      let allowedCategories: string[] = [];

      if (transactionType === "Penjualan") {
        // Service and goods categories
        allowedCategories = [
          "Jasa Cargo",
          "Jasa Gudang",
          "Jasa Kepabeanan",
          "Jasa Trucking",
          "Jasa Lainnya",
          "Unit Disewakan",
          "Persediaan",
          "Barang",
        ];
      } else if (
        transactionType === "Pembelian Barang" ||
        transactionType === "Pembelian Jasa"
      ) {
        // Pembelian barang/persediaan
        allowedCategories = ["Persediaan", "Barang"];
      } else if (transactionType === "Pendapatan") {
        // All income categories
        allowedCategories = [
          "Jasa Cargo",
          "Jasa Gudang",
          "Jasa Kepabeanan",
          "Jasa Trucking",
          "Jasa Lainnya",
          "Unit Disewakan",
          "Persediaan",
          "Barang",
        ];
      } else if (transactionType === "Pengeluaran") {
        // Expense categories
        allowedCategories = ["Beban"];
      } else if (
        transactionType === "Pinjaman Masuk" ||
        transactionType === "Pembayaran Pinjaman"
      ) {
        // Only Pinjaman
        allowedCategories = ["Pinjaman"];
      }

      // Fetch categories from database that match allowed list
      const { data, error: supabaseError } = await supabase
        .from("coa_category_mapping")
        .select("service_category")
        .in("service_category", allowedCategories)
        .eq("is_active", true);

      if (supabaseError) throw supabaseError;

      const uniqueCategories = Array.from(
        new Set(data?.map((item) => item.service_category).filter(Boolean)),
      ) as string[];

      setAvailableCategories(uniqueCategories);
    } catch (err) {
      console.error("Error loading categories:", err);
      setAvailableCategories([]);
    }
  };

  /** Load Items & Brands */
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadItems(),
        loadSuppliers(),
        loadCustomers(),
        loadConsignees(),
        loadBanks(),
        loadKasAccounts(),
        loadBorrowers(),
        loadTransactions(),
        loadStockItems(),
        loadServiceItems(),
        loadCOA(),
      ]);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load transactions when showReport is true
  useEffect(() => {
    if (showReport) {
      loadTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showReport]);

  // Debug state changes
  useEffect(() => {
    console.log("🔍 State Debug:", {
      customers: customers.length,
      banks: banks.length,
      suppliers: suppliers.length,
    });
  }, [customers, banks, suppliers]);

  // Refresh loan data when borrower changes or form opens
  useEffect(() => {
    const refreshLoanData = async () => {
      if (selectedBorrower && jenisTransaksi === "Pembayaran Pinjaman") {
        try {
          // Load loan details
          const { data: loans } = await supabase
            .from("loans")
            .select("*")
            .eq("lender_name", selectedBorrower)
            .eq("status", "Aktif")
            .order("loan_date", { ascending: false })
            .limit(1);

          if (loans && loans.length > 0) {
            const loan = loans[0];

            // Reload installment schedule
            const { data: installments } = await supabase
              .from("loan_installments")
              .select("*")
              .eq("loan_id", loan.id)
              .order("installment_number", { ascending: true });

            if (installments && installments.length > 0) {
              const schedule = installments.map((inst) => ({
                installment: inst.installment_number,
                dueDate: inst.due_date,
                principalAmount: inst.principal_amount,
                interestAmount: inst.interest_amount,
                totalPayment: inst.total_amount,
                remainingBalance: inst.remaining_balance,
                status: inst.status,
                paidAmount: inst.paid_amount || 0,
              }));
              setInstallmentSchedule(schedule);

              // Find next unpaid installment
              const nextUnpaid = installments.find(
                (inst) => inst.status === "Belum Bayar",
              );
              if (nextUnpaid) {
                setPrincipalAmount(
                  nextUnpaid.principal_amount?.toString() || "0",
                );
                setInterestAmount(
                  nextUnpaid.interest_amount?.toString() || "0",
                );
                setTanggal(nextUnpaid.due_date || "");
              }
            }
          }
        } catch (error) {
          // Error refreshing loan data
        }
      }
    };

    refreshLoanData();
  }, [selectedBorrower, jenisTransaksi, showForm]);

  // Load descriptions when item changes
  useEffect(() => {
    if (itemName) {
      loadDescriptions(itemName);
    } else {
      setDescriptions([]);
      setDescription("");
    }
  }, [itemName]);

  // No longer filtering brands by item - show all brands
  // This allows newly added brands to appear immediately
  /*useEffect(() => {
    setFilteredBrands(brands);
  }, [brands]);
  */

  const loadItems = async () => {
    const { data } = await supabase
      .from("stock")
      .select("item_name, description, quantity, selling_price")
      .not("item_name", "is", null);

    const uniqueItems = Array.from(
      new Set(data?.map((item) => item.item_name) || []),
    ).map((item_name) => {
      const match = data.find((d) => d.item_name === item_name);
      return {
        item_name,
        description: match?.description || "",
        quantity: match?.quantity || 0,
        selling_price: match?.selling_price || 0,
      };
    });

    setItems(uniqueItems);
  };

  const loadDescriptions = async (selectedItemName: string) => {
    if (!selectedItemName) {
      setDescriptions([]);
      return;
    }

    const { data } = await supabase
      .from("stock")
      .select("description")
      .eq("item_name", selectedItemName)
      .not("description", "is", null);

    const uniqueDescriptions = Array.from(
      new Set(data?.map((item) => item.description) || []),
    ).map((description) => ({ description }));

    setDescriptions(uniqueDescriptions);
  };

  // Fetch stock information when item and description are selected
  const fetchStockInfo = async (itemName: string, description: string) => {
    if (!itemName || !description) {
      setStockInfo(null);
      return;
    }

    setLoadingStock(true);
    try {
      const { data, error: supabaseError } = await supabase
        .from("stock")
        .select(
          `
          *,
          warehouses!warehouse_id(name, code, address)
        `,
        )
        .eq("item_name", itemName)
        .eq("description", description)
        .maybeSingle();

      if (supabaseError) throw supabaseError;

      setStockInfo(data);

      // Auto-fill harga jual if available
      if (data?.harga_jual) {
        setHargaJual(data.harga_jual.toString());
      }
    } catch (err) {
      console.error("Error fetching stock info:", err);
      setStockInfo(null);
    } finally {
      setLoadingStock(false);
    }
  };

  // Update stock info when item or description changes
  useEffect(() => {
    fetchStockInfo(itemName, description);
  }, [itemName, description]);

  const loadSuppliers = async (): Promise<void> => {
    try {
      const { data, error: supabaseError } = await supabase
        .from("suppliers")
        .select("*");
      if (supabaseError) throw supabaseError;
      console.log("Suppliers loaded:", data);
      setSuppliers(data || []);
    } catch (err) {
      console.error("Error loading suppliers:", err);
      setSuppliers([]);
    }
  };

  const loadCustomers = async (): Promise<void> => {
    try {
      const { data, error: supabaseError } = await supabase
        .from("customers")
        .select("*");
      if (supabaseError) throw supabaseError;
      console.log("Customers loaded:", data);
      console.log("Total customers:", data?.length || 0);
      if (data && data.length > 0) {
        console.log("Sample customer:", data[0]);
      }
      setCustomers(data || []);
    } catch (err) {
      console.error("Error loading customers:", err);
      setCustomers([]);
    }
  };

  const loadConsignees = async (): Promise<void> => {
    try {
      const { data, error: supabaseError } = await supabase
        .from("consignees")
        .select("*");
      if (supabaseError) throw supabaseError;
      console.log("Consignees loaded:", data);
      setConsignees(data || []);
    } catch (err) {
      console.error("Error loading consignees:", err);
      setConsignees([]);
    }
  };

  const loadBanks = async (): Promise<void> => {
    try {
      // 🔒 CRITICAL: HANYA AKUN BANK leaf (is_postable=true) dengan kode 1-12xx
      // Ini memastikan hanya akun seperti "Bank BCA", "Bank Mandiri" yang muncul
      // BUKAN parent account "Bank" (1-1200)
      const { data, error: supabaseError } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("is_active", true)
        .eq("is_postable", true) // 🔒 CRITICAL: Hanya leaf accounts yang bisa di-posting
        .eq("is_header", false)
        .or("account_code.like.1-12%,account_code.like.1-15%") // 🔒 Akun bank (1-12xx) dan Uang Muka (1-15xx)
        .not("account_code", "in", "(1-1200,1-1500)") // 🔒 EXCLUDE parent accounts
        .order("account_code");
      if (supabaseError) throw supabaseError;
      console.log("Banks loaded (leaf only, is_postable=true):", data);
      setBanks(data || []);
    } catch (err) {
      console.error("Error loading banks:", err);
      setBanks([]);
    }
  };

  const loadKasAccounts = async (): Promise<void> => {
    try {
      // 🔒 CRITICAL: HANYA AKUN KAS leaf (is_postable=true) dengan kode 1-11xx
      // Ini memastikan hanya akun seperti "Kas Besar", "Kas Kecil" yang muncul
      // BUKAN parent account "Kas" (1-1100)
      const { data, error: supabaseError } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("is_active", true)
        .eq("is_postable", true) // 🔒 CRITICAL: Hanya leaf accounts yang bisa di-posting
        .eq("is_header", false)
        .like("account_code", "1-11%") // 🔒 Hanya akun kas (1-11xx)
        .neq("account_code", "1-1100") // 🔒 EXCLUDE parent "Kas" account
        .order("account_code");
      if (supabaseError) throw supabaseError;
      console.log("Kas accounts loaded (leaf only, is_postable=true):", data);
      setKasAccounts(data || []);
    } catch (err) {
      console.error("Error loading kas accounts:", err);
      setKasAccounts([]);
    }
  };

  const loadBorrowers = async (): Promise<void> => {
    try {
      const { data, error: supabaseError } = await supabase
        .from("borrowers")
        .select("*");
      if (supabaseError) throw supabaseError;
      setBorrowers(data || []);
    } catch (err) {
      setBorrowers([]);
    }
  };

  const loadCOA = async (): Promise<void> => {
    try {
      const { data, error: supabaseError } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("is_active", true)
        .order("account_code");
      if (supabaseError) throw supabaseError;
      console.log("COA loaded:", data);
      setCoa(data || []);
    } catch (err) {
      console.error("Error loading COA:", err);
      setCoa([]);
    }
  };

  // Save new COA account
  const handleSaveCOA = async () => {
    // Validasi otomatis (WAJIB)
    if (!newCOA.account_code || !newCOA.account_name || !newCOA.account_type || !newCOA.normal_balance) {
      toast({
        title: "Error",
        description: "Semua field wajib harus diisi",
        variant: "destructive",
      });
      return;
    }

    // Validasi format account_code
    if (!/^\d+-\d+$/.test(newCOA.account_code)) {
      toast({
        title: "Error",
        description: "Format kode akun harus seperti: 6-1001, 4-1001, dll",
        variant: "destructive",
      });
      return;
    }

    setSavingCOA(true);
    try {
      // Check if account_code already exists
      const { data: existing } = await supabase
        .from("chart_of_accounts")
        .select("account_code")
        .eq("account_code", newCOA.account_code)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Error",
          description: `Kode akun ${newCOA.account_code} sudah ada`,
          variant: "destructive",
        });
        setSavingCOA(false);
        return;
      }

      // Pastikan normal_balance format: 'Debit' atau 'Kredit' (capital first letter only)
      const normalBalanceFormatted = newCOA.normal_balance === 'DEBIT' ? 'Debit' : 'Kredit';

      // Insert new COA
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .insert({
          account_code: newCOA.account_code,
          account_name: newCOA.account_name,
          account_type: newCOA.account_type,
          normal_balance: normalBalanceFormatted,
          description: newCOA.description || null,
          allow_manual_posting: true,
          is_active: true,
          is_header: false,
          level: 3,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Akun ${newCOA.account_name} berhasil ditambahkan`,
      });

      // Reload COA list - COA baru langsung muncul di dropdown
      await loadCOA();

      // Auto-select the new account based on context type
      if (data) {
        if (coaContextType === "expense") {
          setAkunBeban(data.account_name);
          setSelectedExpenseAccount({
            id: data.id,
            account_code: data.account_code,
            account_name: data.account_name,
            account_type: data.account_type,
            description: data.description,
          });
        } else if (coaContextType === "revenue") {
          setAkunPendapatan(data.account_name);
          setSelectedRevenueAccount({
            id: data.id,
            account_code: data.account_code,
            account_name: data.account_name,
            description: data.description,
          });
        }
      }

      // Reset form and close modal
      setNewCOA({
        account_code: "",
        account_name: "",
        account_type: "expense",
        normal_balance: "DEBIT",
        description: "",
      });
      setShowAddCOAModal(false);
    } catch (err: any) {
      console.error("Error saving COA:", err);
      toast({
        title: "Error",
        description: err.message || "Gagal menyimpan akun baru",
        variant: "destructive",
      });
    } finally {
      setSavingCOA(false);
    }
  };

  const loadStockItems = async (): Promise<void> => {
    try {
      const { data, error: supabaseError } = await supabase
        .from("stock")
        .select("id, item_name, jenis_barang, selling_price, purchase_price, cost_per_unit, quantity")
        .gt("quantity", 0)
        .order("item_name");
      if (supabaseError) throw supabaseError;
      console.log("📦 Stock items loaded with purchase_price:", data?.map(item => ({
        item_name: item.item_name,
        purchase_price: item.purchase_price,
        cost_per_unit: item.cost_per_unit
      })));
      setStockItems(data || []);
    } catch (err) {
      console.error("Error loading stock items:", err);
      setStockItems([]);
    }
  };



  // Load transactions from database - combining all transaction tables
  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true);

      // Load from kas_transaksi (approved, waiting approval, and rejected)
      const { data: kasData, error: kasError } = await supabase
        .from("kas_transaksi")
        .select("*")
        .or(
          "approval_status.eq.approved,approval_status.eq.waiting_approval,approval_status.eq.rejected,approval_status.is.null",
        )
        .order("tanggal", { ascending: false });

      if (kasError) {
        console.error("Error loading kas_transaksi:", kasError);
      }

      // Load from cash_disbursement (approved, waiting approval, and rejected)
      const { data: cashDisbursementData, error: cashDisbursementError } =
        await supabase
          .from("cash_disbursement")
          .select("*")
          .or(
            "approval_status.eq.approved,approval_status.eq.waiting_approval,approval_status.eq.rejected",
          )
          .order("transaction_date", { ascending: false });

      if (cashDisbursementError) {
        console.error(
          "❌ Error loading cash_disbursement:",
          cashDisbursementError,
        );
      }

      // Load from purchase_transactions (approved, waiting approval, and rejected)
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchase_transactions")
        .select("*")
        .or(
          "approval_status.eq.approved,approval_status.eq.waiting_approval,approval_status.eq.rejected,approval_status.is.null",
        )
        .order("transaction_date", { ascending: false });

      if (purchaseError) {
        console.error("Error loading purchase_transactions:", purchaseError);
      }

      // Load from sales_transactions
      const { data: salesData, error: salesError } = await supabase
        .from("sales_transactions")
        .select("*")
        .order("transaction_date", { ascending: false });

      if (salesError) {
        console.error("Error loading sales_transactions:", salesError);
      }

      // Load from internal_usage
      const { data: internalData, error: internalError } = await supabase
        .from("internal_usage")
        .select("*")
        .order("usage_date", { ascending: false });

      if (internalError) {
        console.error("Error loading internal_usage:", internalError);
      }

      // Load from cash_and_bank_receipts (Penerimaan Kas & Bank)
      const { data: cashReceiptsData, error: cashReceiptsError } =
        await supabase
          .from("cash_and_bank_receipts")
          .select("*")
          .order("transaction_date", { ascending: false });

      if (cashReceiptsError) {
        console.error(
          "Error loading cash_and_bank_receipts:",
          cashReceiptsError,
        );
      } else {
        console.log("Cash receipts data loaded:", cashReceiptsData);
        console.log("First cash receipt bukti:", cashReceiptsData?.[0]?.bukti);
      }

      // Load from approval_transaksi (Penjualan Jasa, etc - approved, waiting approval, and rejected)
      const { data: approvalData, error: approvalError } = await supabase
        .from("approval_transaksi")
        .select("*")
        .or(
          "approval_status.eq.approved,approval_status.eq.waiting_approval,approval_status.eq.rejected",
        )
        .order("transaction_date", { ascending: false });

      if (approvalError) {
        console.error("Error loading approval_transaksi:", approvalError);
      }

      // Note: expenses and loans tables are not used in this view

      console.log("📊 Query results:", {
        kas: kasData?.length || 0,
        cashDisbursement: cashDisbursementData?.length || 0,
        purchase: purchaseData?.length || 0,
        sales: salesData?.length || 0,
        internal: internalData?.length || 0,
        cashReceipts: cashReceiptsData?.length || 0,
        approval: approvalData?.length || 0,
      });

      // Combine all transactions with source identifier
      const allTransactions = [
        ...(kasData || []).map((t) => ({
          ...t,
          source: "kas_transaksi",
          tanggal: t.tanggal,
        })),
        ...(cashDisbursementData || []).map((t) => ({
          ...t,
          source: "cash_disbursement",
          tanggal: t.transaction_date,
          nominal: t.amount,
          keterangan: t.description,
          payment_type: "Pengeluaran Kas",
          document_number: t.document_number,
        })),
        ...(cashReceiptsData || []).map((t) => {
          const mapped = {
            ...t,
            source: "cash_receipts",
            tanggal: t.transaction_date,
            nominal: t.amount,
            keterangan: t.description,
            payment_type: "Penerimaan Kas",
            document_number: t.reference_number,
            approval_status: "approved", // Penerimaan Kas langsung Approved tanpa perlu approval
            bukti: t.bukti, // Explicitly include bukti field
          };
          console.log("🔍 Mapped cash receipt:", {
            id: t.id,
            bukti: t.bukti,
            mapped_bukti: mapped.bukti,
          });
          return mapped;
        }),
        ...(purchaseData || []).map((t) => ({
          ...t,
          source: "purchase_transactions",
          tanggal: t.transaction_date,
          jenis: "Pembelian",
          nominal: t.total_amount,
          created_by: t.created_by,
          approved_by: t.approved_by,
        })),
        ...(salesData || []).map((t) => ({
          ...t,
          source: "sales_transactions",
          tanggal: t.transaction_date,
          jenis: "Penjualan",
          nominal: t.total_amount,
        })),
        ...(internalData || []).map((t) => ({
          ...t,
          source: "internal_usage",
          tanggal: t.usage_date,
          jenis: "Pemakaian Internal",
          nominal: t.total_value,
        })),
        ...(approvalData || [])
          .filter((t) => t.type !== "Penjualan" && t.type !== "Penjualan") // Exclude sales transactions (already in sales_transactions table)
          .map((t) => ({
            ...t,
            source:
              t.type === "Pembelian"
                ? "PURCHASE TRANSACTIONS"
                : "approval_transaksi",
            tanggal: t.transaction_date,
            jenis: t.type === "Pembelian" ? "Pembelian" : t.type,
            nominal: t.total_amount,
            keterangan: t.description || t.notes,
            payment_type: t.type,
            document_number: t.document_number,
            created_by: t.created_by,
            approved_by: t.approved_by,
          })),
      ];

      // Sort by date descending
      allTransactions.sort(
        (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
      );

      setTransactions(allTransactions);
      console.log("Total transactions loaded:", allTransactions.length);

      // Load user mappings for created_by and approved_by
      const userIds = new Set<string>();
      allTransactions.forEach((t) => {
        if (t.created_by) userIds.add(t.created_by);
        if (t.approved_by) userIds.add(t.approved_by);
      });

      if (userIds.size > 0) {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, full_name, email")
          .in("id", Array.from(userIds));

        if (usersData) {
          const mappings: Record<string, string> = {};
          usersData.forEach((user) => {
            mappings[user.id] = user.full_name || user.email || user.id;
          });
          setUserMappings(mappings);
        }
      }

      if (allTransactions.length === 0) {
        toast({
          title: "ℹ️ Tidak Ada Data",
          description: "Belum ada transaksi. Silakan tambah transaksi baru.",
        });
      } else {
        toast({
          title: "✅ Data Loaded",
          description: `${allTransactions.length} transaksi berhasil dimuat dari semua tabel`,
        });
      }
    } catch (err: any) {
      console.error("Exception:", err);
      setTransactions([]);
      toast({
        title: "❌ Error",
        description: err.message || "Gagal memuat transaksi",
        variant: "destructive",
      });
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Handle delete transaction
  const handleDeleteTransaction = async (transaction: any) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      return;
    }

    try {
      const sourceTable =
        transaction.source === "cash_receipts" ||
        transaction.source === "cash_and_bank_receipts"
          ? "cash_and_bank_receipts"
          : transaction.source;

      const { error: deleteError } = await supabase
        .from(sourceTable)
        .delete()
        .eq("id", transaction.id);

      if (deleteError) throw deleteError;

      toast({
        title: "✅ Berhasil",
        description: "Transaksi berhasil dihapus",
      });

      // Reload transactions
      await loadTransactions();
    } catch (err: any) {
      toast({
        title: "❌ Error",
        description: err.message || "Gagal menghapus transaksi",
        variant: "destructive",
      });
    }
  };

  // Calculate installment schedule
  const calculateInstallmentSchedule = () => {
    if (!nominal || !loanTermMonths || !interestRate || !tanggal) {
      setInstallmentSchedule([]);
      return;
    }

    const principal = Number(nominal);
    const months = Number(loanTermMonths);
    const annualRate = Number(interestRate) / 100;
    const monthlyRate = annualRate / 12;

    const schedule: any[] = [];
    let remainingPrincipal = principal;

    // Calculate based on payment schedule type
    if (paymentSchedule === "Bulanan") {
      // Monthly installment with reducing balance
      const monthlyPayment =
        monthlyRate === 0
          ? principal / months
          : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1);

      for (let i = 1; i <= months; i++) {
        const interestPayment = remainingPrincipal * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        remainingPrincipal -= principalPayment;

        const dueDate = new Date(tanggal);
        dueDate.setMonth(dueDate.getMonth() + i);

        schedule.push({
          installment: i,
          dueDate: dueDate.toISOString().split("T")[0],
          principalAmount: principalPayment,
          interestAmount: interestPayment,
          totalPayment: monthlyPayment,
          remainingBalance: Math.max(0, remainingPrincipal),
        });
      }
    } else if (paymentSchedule === "Jatuh Tempo") {
      // Lump sum at maturity
      const totalInterest = principal * annualRate * (months / 12);
      const dueDate = maturityDate || new Date(tanggal);

      schedule.push({
        installment: 1,
        dueDate:
          typeof dueDate === "string"
            ? dueDate
            : dueDate.toISOString().split("T")[0],
        principalAmount: principal,
        interestAmount: totalInterest,
        totalPayment: principal + totalInterest,
        remainingBalance: 0,
      });
    }

    setInstallmentSchedule(schedule);
  };

  // Calculate late fee
  const calculateLateFee = (
    dueDate: string,
    paymentDate: string,
    amount: number,
  ) => {
    const due = new Date(dueDate);
    const payment = new Date(paymentDate);
    const daysLate = Math.floor(
      (payment.getTime() - due.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysLate <= 0) return 0;

    // 0.1% per day late (configurable)
    const dailyPenaltyRate = 0.001;
    return amount * dailyPenaltyRate * daysLate;
  };

  // Recalculate schedule when loan parameters change
  useEffect(() => {
    if (
      jenisTransaksi === "Pinjaman Masuk" ||
      jenisTransaksi === "Pembayaran Pinjaman"
    ) {
      calculateInstallmentSchedule();
    }
  }, [
    nominal,
    loanTermMonths,
    interestRate,
    paymentSchedule,
    tanggal,
    maturityDate,
  ]);

  /** Load Service Types when Kategori changes */
  useEffect(() => {
    if (kategori) {
      loadServiceTypes(kategori);
      setJenisLayanan(""); // Reset jenis layanan
      setCoaSelected(""); // Reset COA
    } else {
      setServiceTypes([]);
    }
  }, [kategori]);

  const loadServiceTypes = async (category: string) => {
    try {
      // Special handling for "Kas & Bank" category
      if (category === "Kas & Bank") {
        const { data, error: supabaseError } = await supabase
          .from("chart_of_accounts")
          .select("*")
          .ilike("account_name", "%kas - %")
          .order("account_code");

        if (supabaseError) throw supabaseError;

        // Use account names as service types for Kas & Bank
        const kasAccounts = data?.map((acc) => acc.account_name) || [];
        setServiceTypes(kasAccounts);
        console.log("Kas accounts loaded:", kasAccounts);
      } else {
        // Normal flow for other categories
        const { data, error: supabaseError } = await supabase
          .from("coa_category_mapping")
          .select("service_type")
          .eq("service_category", category)
          .eq("is_active", true);

        if (supabaseError) throw supabaseError;

        const uniqueTypes = Array.from(
          new Set(data?.map((item) => item.service_type).filter(Boolean)),
        ) as string[];

        setServiceTypes(uniqueTypes);
      }
    } catch (err) {
      console.error("Error loading service types:", err);
    }
  };

  /** Auto-fill COA when Kategori and Jenis Layanan are selected */
  useEffect(() => {
    if (kategori && jenisLayanan) {
      autoFillCOA();
    }
  }, [kategori, jenisLayanan, paymentType]);

  const autoFillCOA = async () => {
    try {
      // Financial Engine Logic
      let accountCode = "";

      // Cash Engine - Direct cash transactions
      if (
        paymentType === "Penerimaan Kas" ||
        paymentType === "Pengeluaran Kas"
      ) {
        // Get mapping for the selected service
        const { data: mapping } = await supabase
          .from("coa_category_mapping")
          .select("*")
          .eq("service_category", kategori)
          .eq("service_type", jenisLayanan)
          .eq("is_active", true)
          .single();

        if (mapping) {
          if (paymentType === "Penerimaan Kas") {
            // For income: use revenue account
            accountCode = mapping.revenue_account_code;
          } else if (paymentType === "Pengeluaran Kas") {
            // For expense: use COGS/expense account
            accountCode = mapping.cogs_account_code;
          }
        }
      }

      // Revenue Engine - Sales transactions
      else if (
        jenisTransaksi === "Penjualan Jasa" ||
        jenisTransaksi === "Penjualan"
      ) {
        const { data: mapping } = await supabase
          .from("coa_category_mapping")
          .select("*")
          .eq("service_category", kategori)
          .eq("service_type", jenisLayanan)
          .eq("is_active", true)
          .single();

        if (mapping) {
          // Use revenue account for sales
          accountCode = mapping.revenue_account_code;
        }
      }

      // Expense Engine - Purchase and expense transactions
      else if (
        jenisTransaksi === "Pembelian" ||
        jenisTransaksi === "Beban Operasional"
      ) {
        const { data: mapping } = await supabase
          .from("coa_category_mapping")
          .select("*")
          .eq("service_category", kategori)
          .eq("service_type", jenisLayanan)
          .eq("is_active", true)
          .single();

        if (mapping) {
          if (jenisTransaksi === "Pembelian") {
            // For purchases: use asset account (inventory)
            accountCode =
              mapping.asset_account_code || mapping.cogs_account_code;
          } else {
            // For expenses: use COGS/expense account
            accountCode = mapping.cogs_account_code;
          }
        }
      }

      // Loan Engine - Loan transactions
      else if (
        jenisTransaksi === "Pinjaman Masuk" ||
        jenisTransaksi === "Pembayaran Pinjaman"
      ) {
        // For loans, use specific loan accounts
        if (jenisTransaksi === "Pinjaman Masuk") {
          accountCode = "2-2000"; // Hutang Bank
        } else {
          accountCode = "2-2000"; // Hutang Bank (debit side)
        }
      }

      // Set the selected COA
      if (accountCode) {
        setCoaSelected(accountCode);

        // Load the full COA details for display
        const { data: coaData, error: coaError } = await supabase
          .from("chart_of_accounts")
          .select("*")
          .eq("account_code", accountCode)
          .maybeSingle();

        if (coaError) {
          console.error("Error loading COA details:", coaError);
        } else if (coaData) {
          setCoa([coaData]);
        }
      }
    } catch (err) {
      console.error("Error auto-filling COA:", err);
      // If no mapping found, load all COA
      loadCOA();
    }
  };

  /** Load COA with dynamic filter */
  useEffect(() => {
    loadCOAFiltered();
  }, [kategori, jenisLayanan, paymentType]);

  const loadCOAFiltered = async () => {
    const { data } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .eq("is_active", true)
      .eq("is_header", false)
      .order("account_code");

    let filtered = data || [];

    if (paymentType === "Penerimaan Kas") {
      filtered = filtered.filter((c) =>
        ["Pendapatan", "Aset", "Ekuitas", "Revenue"].includes(c.account_type),
      );
    }

    if (paymentType === "Pengeluaran Kas") {
      filtered = filtered.filter((c) =>
        ["Beban", "HPP", "Kewajiban"].includes(c.account_type),
      );
    }

    if (kategori) {
      filtered = filtered.filter((c) => c.kategori_layanan === kategori);
    }

    setCoa(filtered);
  };

  /** Handle Preview Jurnal */
  const handlePreview = async () => {
    try {
      // Validate Input
      validateInput({
        jenisTransaksi,
        nominal,
        tanggal,
      });

      // Normalize Input
      console.log("🔍 Preview - selectedBank:", selectedBank);
      console.log("🔍 Preview - selectedKas:", selectedKas);
      console.log(
        "🔍 Preview - selectedExpenseAccount:",
        selectedExpenseAccount,
      );
      console.log("🔍 Preview - akunBeban:", akunBeban);
      console.log("🔍 Preview - jenisTransaksi:", jenisTransaksi);
      console.log("🔍 Preview - paymentType:", paymentType);

      const normalizedInput = normalizeInput({
        jenisTransaksi,
        paymentType,
        nominal,
        tanggal,
        deskripsi: description,
        sumberPenerimaan: "",
        kategoriPengeluaran: kategori,
        kasTujuan: bankTujuan,
        kasSumber: bankAsal,
        selectedAccountName: selectedAccountName,
        selectedCreditAccountType: selectedCreditAccountType,
        selectedCreditAccountName: selectedCreditAccountName,
        selectedKas: selectedKas,
        selectedBank: selectedBank,
        selectedExpenseAccount: selectedExpenseAccount,
        selectedRevenueAccount: selectedRevenueAccount,
        selectedModalAccount: selectedModalAccount,
      });

      console.log("🔍 Normalized Input:", normalizedInput);
      console.log(
        "🔍 Normalized selectedExpenseAccount:",
        normalizedInput.selectedExpenseAccount,
      );

      // Run Financial Engine
      const result = await runFinancialEngine(normalizedInput);

      // Build Journal Lines
      const journalData = buildJournalLines(
        {
          account_code: result.debit,
          account_name: result.debitName,
          account_type: result.debitType,
        },
        {
          account_code: result.credit,
          account_name: result.creditName,
          account_type: result.creditType,
        },
        normalizedInput.nominal,
        normalizedInput.deskripsi,
        normalizedInput.tanggal,
        result.hpp_entry,
        normalizedInput.nominal * 0.7,
        jenisTransaksi === "Penjualan" ? salesItems : [],
      );

      // Show Preview
      setPreviewLines(journalData.lines);
      setPreviewMemo(journalData.memo);
      setPreviewTanggal(journalData.tanggal);
      setPreviewIsCashRelated(result.is_cash_related);
      setPreviewOpen(true);
    } catch (err: any) {
      toast({
        title: "❌ Error",
        description: err.details ? err.details.join(", ") : err.message,
        variant: "destructive",
      });
    }
  };

  /** Choose Mapping Rule - Generate filter strings for COA queries */
  const chooseMappingRule = (normalizedInput: any) => {
    const jenis = normalizedInput.jenisTransaksi;
    const sumber = normalizedInput.sumberPenerimaan;
    const kategori = normalizedInput.kategoriPengeluaran;
    const accountName = normalizedInput.selectedAccountName;

    const rawPayment = (normalizedInput.paymentType || "").toLowerCase();
    const payment = rawPayment === "bank" ? "transfer bank" : rawPayment;

    let debitFilter: any = null;
    let creditFilter: any = null;
    let extras = {
      needs_hpp: false,
      hppFilter: null as any,
      is_cash_related: false,
    };

    switch (jenis) {
      case "Penjualan":
        // Debit Kas / Bank / Piutang
        if (payment === "cash") {
          debitFilter = {
            account_code: normalizedInput.selectedKas?.split(" — ")[0],
          };
        } else if (payment === "transfer bank") {
          debitFilter = {
            account_code: normalizedInput.selectedBank?.split(" — ")[0],
          };
        } else {
          debitFilter = { usage_role: "piutang" };
        }

        // Kredit Pendapatan
        creditFilter = { usage_role: "pendapatan_jasa" };

        // HPP hanya jika jual stok
        extras.needs_hpp = normalizedInput.hasStockItem === true;
        extras.hppFilter = { usage_role: "hpp" };

        // Transaksi penjualan tetap dianggap cash-related jika pakai kas/bank
        extras.is_cash_related =
          payment === "cash" || payment === "transfer bank";
        break;

      // Pastikan semua transaksi lain override needs_hpp ke false
      // (blok lama di bawah ini dihapus karena menyebabkan syntax error)

      case "Pembelian":
      case "Pembelian Barang":
        // Pembelian Tunai: Debit Persediaan, Kredit Kas/Bank
        // Pembelian Kredit: Debit Persediaan, Kredit Hutang
        debitFilter = { usage_role: "inventory" };
        if (payment === "cash") {
          const kasCode =
            normalizedInput.selectedKas?.split(" — ")[0];
          if (!kasCode) {
            throw new Error("Silakan pilih akun Kas yang spesifik (Kas Besar/Kas Kecil). Tidak boleh menggunakan akun default.");
          }
          creditFilter = { account_code: kasCode };
        } else if (payment === "transfer bank") {
          const bankCode =
            normalizedInput.selectedBank?.split(" — ")[0];
          if (!bankCode) {
            throw new Error("Silakan pilih akun Bank yang spesifik (Bank BCA/Bank Mandiri/dll). Tidak boleh menggunakan akun default.");
          }
          creditFilter = { account_code: bankCode };
        } else if (payment === "Kredit") {
          creditFilter = { usage_role: "hutang" };
        }
        extras.is_cash_related =
          payment === "cash" || payment === "transfer bank";
        break;

      case "Pembelian Jasa":
        // Pembelian Tunai: Debit Beban, Kredit Kas/Bank
        // Pembelian Kredit: Debit Beban, Kredit Hutang
        debitFilter = { usage_role: "beban_operasional" };
        if (payment === "cash") {
          const kasCode =
            normalizedInput.selectedKas?.split(" — ")[0];
          if (!kasCode) {
            throw new Error("Silakan pilih akun Kas yang spesifik (Kas Besar/Kas Kecil). Tidak boleh menggunakan akun default.");
          }
          creditFilter = { account_code: kasCode };
        } else if (payment === "transfer bank") {
          const bankCode =
            normalizedInput.selectedBank?.split(" — ")[0];
          if (!bankCode) {
            throw new Error("Silakan pilih akun Bank yang spesifik (Bank BCA/Bank Mandiri/dll). Tidak boleh menggunakan akun default.");
          }
          creditFilter = { account_code: bankCode };
        } else if (payment === "Kredit") {
          creditFilter = { usage_role: "hutang" };
        }
        extras.is_cash_related =
          payment === "cash" || payment === "transfer bank";
        break;

      case "Pendapatan":
        // Pendapatan: Debit Kas/Bank, Kredit Pendapatan
        if (payment === "cash") {
          const kasCode =
            normalizedInput.selectedKas?.split(" — ")[0];
          if (!kasCode) {
            throw new Error("Silakan pilih akun Kas yang spesifik (Kas Besar/Kas Kecil). Tidak boleh menggunakan akun default.");
          }
          debitFilter = { account_code: kasCode };
        } else if (payment === "transfer bank") {
          const bankCode =
            normalizedInput.selectedBank?.split(" — ")[0];
          if (!bankCode) {
            throw new Error("Silakan pilih akun Bank yang spesifik (Bank BCA/Bank Mandiri/dll). Tidak boleh menggunakan akun default.");
          }
          debitFilter = { account_code: bankCode };
        } else if (payment === "Kredit") {
          debitFilter = { usage_role: "piutang" };
        }
        creditFilter = { usage_role: "pendapatan_jasa" };
        extras.is_cash_related =
          payment === "cash" || payment === "transfer bank";
        break;

      case "Pengeluaran":
        // Pengeluaran: Debit Beban, Kredit Kas/Bank
        // SKIP debitFilter if manual account is selected (will be handled in runFinancialEngine)
        if (!normalizedInput.selectedExpenseAccount) {
          if (accountName) {
            debitFilter = { account_name: accountName };
          } else if (kategori === "Beban Kendaraan") {
            debitFilter = { usage_role: "beban_kendaraan" };
          } else {
            debitFilter = { account_type: "Beban" };
          }
        }
        if (payment === "cash") {
          const kasCode =
            normalizedInput.selectedKas?.split(" — ")[0];
          if (!kasCode) {
            throw new Error("Silakan pilih akun Kas yang spesifik (Kas Besar/Kas Kecil). Tidak boleh menggunakan akun default.");
          }
          creditFilter = { account_code: kasCode };
        } else if (payment === "transfer bank") {
          const bankCode =
            normalizedInput.selectedBank?.split(" — ")[0];
          if (!bankCode) {
            throw new Error("Silakan pilih akun Bank yang spesifik (Bank BCA/Bank Mandiri/dll). Tidak boleh menggunakan akun default.");
          }
          console.log(
            "🔍 PENGELUARAN - normalizedInput.selectedBank:",
            normalizedInput.selectedBank,
          );
          console.log("🔍 PENGELUARAN - bankCode extracted:", bankCode);
          creditFilter = { account_code: bankCode };
        }
        extras.is_cash_related =
          payment === "cash" || payment === "transfer bank";
        break;

      case "Transfer Bank":
        // Transfer Bank: Debit Bank Tujuan, Kredit Bank Asal
        // Extract account codes from the format "CODE — NAME"
        const bankTujuanCode = normalizedInput.kasTujuan?.includes(" — ")
          ? normalizedInput.kasTujuan.split(" — ")[0].trim()
          : normalizedInput.kasTujuan?.trim();
        const bankAsalCode = normalizedInput.kasSumber?.includes(" — ")
          ? normalizedInput.kasSumber.split(" — ")[0].trim()
          : normalizedInput.kasSumber?.trim();
        
        console.log("🔍 Transfer Bank - bankTujuan:", normalizedInput.kasTujuan, "→", bankTujuanCode);
        console.log("🔍 Transfer Bank - bankAsal:", normalizedInput.kasSumber, "→", bankAsalCode);
        
        return {
          special: "mutasi",
          debit_account_code: bankTujuanCode,
          credit_account_code: bankAsalCode,
          is_cash_related: true,
        };

      case "Setoran Modal":
        // Setoran Modal: Debit Kas/Bank, Kredit Modal
        if (payment === "cash") {
          const kasCode =
            normalizedInput.selectedKas?.split(" — ")[0];
          if (!kasCode) {
            throw new Error("Silakan pilih akun Kas yang spesifik (Kas Besar/Kas Kecil). Tidak boleh menggunakan akun default.");
          }
          debitFilter = { account_code: kasCode };
        } else if (payment === "transfer bank") {
          const bankCode =
            normalizedInput.selectedBank?.split(" — ")[0];
          if (!bankCode) {
            throw new Error("Silakan pilih akun Bank yang spesifik (Bank BCA/Bank Mandiri/dll). Tidak boleh menggunakan akun default.");
          }
          debitFilter = { account_code: bankCode };
        }
        creditFilter = { trans_type: "equity" };
        extras.is_cash_related = true;
        break;

      case "Prive":
        // Prive: Debit Prive, Kredit Kas/Bank
        debitFilter = { usage_role: "prive" };
        if (payment === "cash") {
          const kasCode =
            normalizedInput.selectedKas?.split(" — ")[0];
          if (!kasCode) {
            throw new Error("Silakan pilih akun Kas yang spesifik (Kas Besar/Kas Kecil). Tidak boleh menggunakan akun default.");
          }
          creditFilter = { account_code: kasCode };
        } else if (payment === "transfer bank") {
          const bankCode =
            normalizedInput.selectedBank?.split(" — ")[0];
          if (!bankCode) {
            throw new Error("Silakan pilih akun Bank yang spesifik (Bank BCA/Bank Mandiri/dll). Tidak boleh menggunakan akun default.");
          }
          creditFilter = { account_code: bankCode };
        }
        extras.is_cash_related = true;
        break;

      case "Pelunasan Hutang":
      case "Pembayaran Hutang":
        // Pelunasan Hutang: Debit Hutang, Kredit Kas/Bank
        debitFilter = { usage_role: "hutang" };
        if (payment === "cash") {
          const kasCode =
            normalizedInput.selectedKas?.split(" — ")[0];
          if (!kasCode) {
            throw new Error("Silakan pilih akun Kas yang spesifik (Kas Besar/Kas Kecil). Tidak boleh menggunakan akun default.");
          }
          creditFilter = { account_code: kasCode };
        } else if (payment === "transfer bank") {
          const bankCode =
            normalizedInput.selectedBank?.split(" — ")[0];
          if (!bankCode) {
            throw new Error("Silakan pilih akun Bank yang spesifik (Bank BCA/Bank Mandiri/dll). Tidak boleh menggunakan akun default.");
          }
          creditFilter = { account_code: bankCode };
        }
        extras.is_cash_related = true;
        break;

      case "Pelunasan Piutang":
      case "Pelanggan Bayar Piutang":
        // Pelunasan Piutang: Debit Kas/Bank, Kredit Piutang
        if (payment === "cash") {
          const kasCode =
            normalizedInput.selectedKas?.split(" — ")[0];
          if (!kasCode) {
            throw new Error("Silakan pilih akun Kas yang spesifik (Kas Besar/Kas Kecil). Tidak boleh menggunakan akun default.");
          }
          debitFilter = { account_code: kasCode };
        } else if (payment === "transfer bank") {
          const bankCode =
            normalizedInput.selectedBank?.split(" — ")[0];
          if (!bankCode) {
            throw new Error("Silakan pilih akun Bank yang spesifik (Bank BCA/Bank Mandiri/dll). Tidak boleh menggunakan akun default.");
          }
          debitFilter = { account_code: bankCode };
        }
        creditFilter = { usage_role: "piutang" };
        extras.is_cash_related = true;
        break;

      default:
        throw { message: "jenisTransaksi tidak dikenali" };
    }

    return { debitFilter, creditFilter, extras, input: normalizedInput };
  };

  /** Fallback and Upsert COA - Create placeholder accounts if missing */
  const fallbackAndUpsertCOA = async (
    debitAccount: any,
    creditAccount: any,
    mappingRule: any,
  ) => {
    const toUpsert: any[] = [];
    let resultDebit = debitAccount;
    let resultCredit = creditAccount;

    if (!debitAccount) {
      // Try to find a matching COA based on debitFilter
      let code = "1-1199"; // Default placeholder
      let accountName = "AUTO-PLACEHOLDER-DEBIT";
      let accountType = "Aset";
      let transType = "asset";
      let flowType = "cash";
      let usageRole = "kas";

      // Check if debitFilter has account_name (from selectedAccountName)
      if (mappingRule.debitFilter?.account_name) {
        // Try to find the exact COA by account_name
        const { data: matchedCoa } = await supabase
          .from("chart_of_accounts")
          .select("account_code, account_name, account_type")
          .ilike("account_name", `%${mappingRule.debitFilter.account_name}%`)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (matchedCoa) {
          resultDebit = matchedCoa;
          return {
            upserted: false,
            debitAccount: resultDebit,
            creditAccount: resultCredit,
          };
        }
      }

      // Check if debitFilter has account_code (for cash receipts)
      if (mappingRule.debitFilter?.account_code) {
        code = mappingRule.debitFilter.account_code;
        
        // Get account name from COA using the account_code
        const coaAccount = await supabase
          .from("chart_of_accounts")
          .select("account_name, account_type")
          .eq("account_code", code)
          .single();
        
        if (coaAccount.data) {
          accountName = coaAccount.data.account_name;
          accountType = coaAccount.data.account_type;
        } else {
          // Fallback to kasAccounts lookup
          const kasAcc = kasAccounts.find(k => k.account_code === code);
          accountName = kasAcc?.account_name || "Kas";
          accountType = "Aset";
        }
        
        transType = "asset";
        flowType = "cash";
        usageRole = "kas";
      } else if (mappingRule.debitFilter?.account_type === "Beban") {
        code = "6-1100";
        accountName = "Beban Operasional";
        accountType = "Beban";
        transType = "expense";
        flowType = "non_cash";
        usageRole = "beban_operasional";
      } else if (mappingRule.special === "mutasi") {
        code = mappingRule.debit_account_code;
      }

      const placeholder = {
        account_code: code,
        account_name: accountName,
        account_type: accountType,
        trans_type: transType,
        flow_type: flowType,
        usage_role: usageRole,
        is_active: true,
      };

      toUpsert.push(placeholder);
      resultDebit = placeholder;
    }

    if (!creditAccount) {
      // Determine placeholder credit account based on filter
      let code = "4-9999"; // Default: other revenue
      let accountName = "AUTO-PLACEHOLDER-CREDIT";
      let accountType = "Pendapatan";
      let transType = "revenue";
      let usageRole = "other";
      let flowType = "non_cash";

      if (mappingRule.creditFilter?.usage_role === "hutang") {
        code = "2-2999";
        accountName = "Hutang Usaha";
        accountType = "Kewajiban";
        transType = "liability";
        usageRole = "hutang";
      } else if (mappingRule.creditFilter?.flow_type === "cash") {
        // For cash outflow (Pengeluaran Kas), credit is cash account
        
        if (mappingRule.creditFilter?.account_code) {
          code = mappingRule.creditFilter.account_code;
          
          // Get account name from COA using the account_code
          const coaAccount = await supabase
            .from("chart_of_accounts")
            .select("account_name, account_type")
            .eq("account_code", code)
            .single();
          
          if (coaAccount.data) {
            accountName = coaAccount.data.account_name;
            accountType = coaAccount.data.account_type;
          } else {
            // Fallback to kasAccounts lookup
            const kasAcc = kasAccounts.find(k => k.account_code === code);
            accountName = kasAcc?.account_name || "Kas";
            accountType = "Aset";
          }
        } else {
          // CRITICAL: Do not use default - require specific COA leaf account
          throw new Error("Silakan pilih akun Kas/Bank yang spesifik (Kas Besar/Kas Kecil). Tidak boleh menggunakan akun default.");
        }
        
        transType = "asset";
        flowType = "cash";
        usageRole = "kas";
      }

      const placeholder = {
        account_code: code,
        account_name: accountName,
        account_type: accountType,
        trans_type: transType,
        flow_type: flowType,
        usage_role: usageRole,
        is_active: true,
      };

      toUpsert.push(placeholder);
      resultCredit = placeholder;
    }

    // Upsert if needed
    if (toUpsert.length > 0) {
      try {
        const { error: supabaseError } = await supabase
          .from("chart_of_accounts")
          .upsert(toUpsert);

        if (supabaseError) {
          console.error("Error upserting placeholder COA:", supabaseError);
        }

        return {
          upserted: true,
          debitAccount: resultDebit,
          creditAccount: resultCredit,
        };
      } catch (err) {
        console.error("Error in fallbackAndUpsertCOA:", err);
      }
    }

    return {
      upserted: false,
      debitAccount: resultDebit,
      creditAccount: resultCredit,
    };
  };

  /** Build Journal Lines */
  const buildJournalLines = (
    debitAccount: any,
    creditAccount: any,
    nominal: number,
    memo: string,
    tanggal: string,
    hppEntry: any,
    hppAmount: number = 0,
    salesItemsData: any[] = [],
  ) => {
    const lines: any[] = [];

    // For Penjualan with multiple items
    if (jenisTransaksi === "Penjualan" && salesItemsData.length > 0) {
      // 1 Debit Line - Kas/Bank based on Metode Pembayaran
      lines.push({
        account_code: debitAccount.account_code,
        account_name: debitAccount.account_name,
        account_type: debitAccount.account_type || "",
        dc: "D",
        amount: nominal,
      });

      // N Credit Lines - One for each item
      for (const item of salesItemsData) {
        const itemAmount = Number(item.nominal || 0) * Number(item.quantity || 1);
        const isBarang = item.tipeItem === "Barang";
        
        lines.push({
          account_code: isBarang ? "4-1100" : "4-2100",
          account_name: isBarang ? "Penjualan Barang Perusahaan" : "Penjualan Jasa Perusahaan",
          account_type: "Pendapatan",
          dc: "C",
          amount: itemAmount,
        });
      }

      // Add HPP lines for Barang items only
      for (const item of salesItemsData) {
        console.log("🔍 Item Check:", {
          itemName: item.itemName,
          tipeItem: item.tipeItem,
          purchasePrice: item.purchasePrice,
          quantity: item.quantity,
          stockId: item.stockId
        });
        
        if (item.tipeItem === "Barang") {
          const itemQty = Number(item.quantity || 1);
          const itemHppAmount = (Number(item.purchasePrice || 0)) * itemQty;
          
          console.log("🔍 HPP Calculation:", {
            itemName: item.itemName,
            purchasePrice: item.purchasePrice,
            quantity: itemQty,
            hppAmount: itemHppAmount
          });
          
          // HPP Debit
          lines.push({
            account_code: "5-1100",
            account_name: "HPP Barang Dagangan",
            account_type: "Beban",
            dc: "D",
            amount: itemHppAmount,
          });
          
          // Persediaan Credit
          lines.push({
            account_code: "1-1400",
            account_name: "Persediaan Barang",
            account_type: "Aset",
            dc: "C",
            amount: itemHppAmount,
          });
        }
      }
    } else {
      // Default behavior for non-Penjualan or single item
      lines.push(
        {
          account_code: debitAccount.account_code,
          account_name: debitAccount.account_name,
          account_type: debitAccount.account_type || "",
          dc: "D",
          amount: nominal,
        },
        {
          account_code: creditAccount.account_code,
          account_name: creditAccount.account_name,
          account_type: creditAccount.account_type || "",
          dc: "C",
          amount: nominal,
        },
      );

      // Add HPP lines if needed (for Penjualan)
      if (hppEntry) {
        lines.push({
          account_code: hppEntry.debit,
          account_name: hppEntry.debitName || "HPP",
          account_type: hppEntry.debitType || "Beban",
          dc: "D",
          amount: hppAmount,
        });
        lines.push({
          account_code: hppEntry.credit,
          account_name: hppEntry.creditName || "Persediaan",
          account_type: hppEntry.creditType || "Aset",
          dc: "C",
          amount: hppAmount,
        });
      }
    }

    return { lines, memo, tanggal };
  };

  /** Load COA by filter */
  const loadCOAByFilter = async (filter: any) => {
    if (!filter) return null;

    console.log("🔍 loadCOAByFilter called with filter:", filter);

    let query = supabase
      .from("chart_of_accounts")
      .select(
        "account_code, account_name, account_type, trans_type, flow_type, usage_role, is_postable",
      )
      .eq("is_active", true)
      .eq("is_postable", true); // CRITICAL: Only return leaf accounts that can be posted to

    // Apply filters - handle special cases
    Object.keys(filter).forEach((key) => {
      if (key === "account_name") {
        // Use ilike for partial match on account_name
        query = query.ilike(key, `%${filter[key]}%`);
      } else if (key === "account_type") {
        // Use ilike for account_type to handle case variations
        query = query.ilike(key, `%${filter[key]}%`);
      } else if (key === "account_code") {
        // Use exact match for account_code
        console.log("🔍 Searching account_code with exact match:", filter[key]);
        query = query.eq(key, filter[key]);
      } else {
        query = query.eq(key, filter[key]);
      }
    });

    // Apply limit and order only for non-exact-match queries
    if (!filter.account_code) {
      query = query.limit(1).order("account_code", { ascending: true });
    }

    const { data, error: supabaseError } = await query.maybeSingle();

    if (supabaseError) {
      console.error("Error loading COA:", supabaseError);
      return null;
    }

    console.log("📊 loadCOAByFilter result:", data);

    return data;
  };

  /** Financial Engine - Determine Debit/Credit Accounts using filter-based mapping */
  const runFinancialEngine = async (normalizedInput: any) => {
    try {
      // PRIORITY 1: Check if user manually selected expense account
      const normalizedPayment = (
        normalizedInput.paymentType || ""
      ).toLowerCase();

      // Normalize "bank" → "transfer bank"
      const isTransferBank =
        normalizedPayment === "bank" || normalizedPayment === "transfer bank";

      const hasBank =
        (normalizedInput.selectedBank &&
          typeof normalizedInput.selectedBank === "string" &&
          normalizedInput.selectedBank.trim() !== "") ||
        normalizedInput.bank_account ||
        normalizedInput.bank_account_id ||
        normalizedInput.coa_cash_id;

      // Check all variations of "Pengeluaran"
      const jenisLower = (normalizedInput.jenisTransaksi || "").toLowerCase();
      const isPengeluaranType =
        normalizedInput.jenisTransaksi === "Pengeluaran" ||
        normalizedInput.jenisTransaksi === "Pengeluaran Kas" ||
        jenisLower.includes("pengeluaran") ||
        jenisLower.includes("expense") ||
        jenisLower.includes("beban");

      console.log("🔍 Bank Validation Check:", {
        jenisTransaksi: normalizedInput.jenisTransaksi,
        isPengeluaranType,
        isTransferBank,
        hasBank,
        selectedBank: normalizedInput.selectedBank,
        selectedBankType: typeof normalizedInput.selectedBank,
        selectedBankLength: normalizedInput.selectedBank?.length,
        bank_account: normalizedInput.bank_account,
        bank_account_id: normalizedInput.bank_account_id,
        coa_cash_id: normalizedInput.coa_cash_id,
      });

      if (isPengeluaranType && isTransferBank && !hasBank) {
        console.error(
          "❌ VALIDATION FAILED: Bank account required but not found",
        );
        throw {
          message:
            "Metode pembayaran Bank dipilih, namun akun bank belum dipilih. Silakan pilih akun bank terlebih dahulu.",
        };
      }

      if (normalizedInput.selectedExpenseAccount) {
        console.log(
          "✅ Manual expense account detected - bypassing AI/OCR mapping:",
          normalizedInput.selectedExpenseAccount,
        );

        // Use the manually selected debit account directly
        const debitCode = normalizedInput.selectedExpenseAccount.account_code;
        const debitName = normalizedInput.selectedExpenseAccount.account_name;
        const debitType = normalizedInput.selectedExpenseAccount.account_type;

        console.log("📊 Using manual debit account:", {
          debitCode,
          debitName,
          debitType,
        });
        
        console.log("🔍 DEBUG Credit Account Selection:", {
          isTransferBank,
          normalizedPayment,
          selectedBank: normalizedInput.selectedBank,
          selectedKas: normalizedInput.selectedKas,
          paymentType: normalizedInput.paymentType,
        });

        // Use selectedKas or selectedBank directly for credit account
        // PRIORITY: Check paymentType first to determine which account to use
        let creditAccount = null;
        
        console.log("🔍 CREDIT ACCOUNT SELECTION - Starting:", {
          isTransferBank,
          normalizedPayment,
          selectedBank: normalizedInput.selectedBank,
          selectedKas: normalizedInput.selectedKas,
        });
        
        console.log("🔍 CONDITION CHECK:", {
          "isTransferBank": isTransferBank,
          "normalizedInput.selectedBank": normalizedInput.selectedBank,
          "condition result": isTransferBank && normalizedInput.selectedBank,
        });
        
        // If paymentType is "Bank", use selectedBank (ignore selectedKas)
        if (isTransferBank && normalizedInput.selectedBank) {
          const parts = normalizedInput.selectedBank.split(" — ");
          const bankCode = parts[0]?.trim() || "";
          let bankName = parts[1]?.trim() || "";

          // If name is empty, fetch from database
          if (!bankName && bankCode) {
            const coaData = await loadCOAByFilter({ account_code: bankCode });
            bankName = coaData?.account_name || bankCode;
          }

          creditAccount = {
            account_code: bankCode,
            account_name: bankName,
            account_type: "Aset",
          };
          console.log("✅ Using selectedBank directly (paymentType=Bank):", {
            raw: normalizedInput.selectedBank,
            parts,
            creditAccount,
          });
        } 
        // If paymentType is "Kas", use selectedKas (ignore selectedBank)
        else if (normalizedPayment === "kas" && normalizedInput.selectedKas) {
          const parts = normalizedInput.selectedKas.split(" — ");
          const kasCode = parts[0]?.trim() || "";
          let kasName = parts[1]?.trim() || "";

          // If name is empty, fetch from database
          if (!kasName && kasCode) {
            const coaData = await loadCOAByFilter({ account_code: kasCode });
            kasName = coaData?.account_name || kasCode;
          }

          creditAccount = {
            account_code: kasCode,
            account_name: kasName,
            account_type: "Aset",
          };
          console.log("✅ Using selectedKas directly (paymentType=Kas):", creditAccount);
        } 
        // Fallback: check selectedKas first, then selectedBank
        else if (normalizedInput.selectedKas) {
          const parts = normalizedInput.selectedKas.split(" — ");
          const kasCode = parts[0]?.trim() || "";
          let kasName = parts[1]?.trim() || "";

          if (!kasName && kasCode) {
            const coaData = await loadCOAByFilter({ account_code: kasCode });
            kasName = coaData?.account_name || kasCode;
          }

          creditAccount = {
            account_code: kasCode,
            account_name: kasName,
            account_type: "Aset",
          };
          console.log("✅ Using selectedKas directly (fallback):", creditAccount);
        } else if (normalizedInput.selectedBank) {
          const parts = normalizedInput.selectedBank.split(" — ");
          const bankCode = parts[0]?.trim() || "";
          let bankName = parts[1]?.trim() || "";

          if (!bankName && bankCode) {
            const coaData = await loadCOAByFilter({ account_code: bankCode });
            bankName = coaData?.account_name || bankCode;
          }

          creditAccount = {
            account_code: bankCode,
            account_name: bankName,
            account_type: "Aset",
          };
          console.log("✅ Using selectedBank directly (fallback):", {
            raw: normalizedInput.selectedBank,
            parts,
            creditAccount,
          });
        } else {
          // Fallback: gunakan akun kas/bank default dari database
          console.warn("⚠️ No Bank/Kas account selected, using default from DB...");
          console.log("Debug info:", {
            isTransferBank,
            normalizedPayment,
            selectedBank: normalizedInput.selectedBank,
            selectedKas: normalizedInput.selectedKas,
            paymentType: normalizedInput.paymentType,
          });
          
          // CRITICAL: DO NOT use default fallback - require user to select specific COA leaf account
          // This ensures proper separation of Kas Besar vs Kas Kecil
          console.error("❌ CRITICAL: No Kas/Bank account selected. User MUST select a specific COA leaf account.");
          throw new Error("Silakan pilih akun Kas/Bank yang spesifik (contoh: Kas Besar, Kas Kecil, Bank BCA). Tidak boleh menggunakan akun default.");
          
          // Jika masih tidak ada, gunakan mapping rule
          if (!creditAccount) {
            const mappingRule = chooseMappingRule(normalizedInput);
            creditAccount = await loadCOAByFilter(mappingRule.creditFilter);
            console.log("📊 Credit Account found from DB (fallback):", creditAccount);
          }
        }

        return {
          debit: debitCode,
          credit: creditAccount?.account_code || "",
          debitName: debitName,
          creditName: creditAccount?.account_name || "",
          debitType: debitType,
          creditType: creditAccount?.account_type || "",
          is_cash_related: true,
          hpp_entry: null,
        };
      }

      // PRIORITY 2: Check if user manually selected revenue account
      if (normalizedInput.selectedRevenueAccount) {
        console.log(
          "✅ Manual revenue account detected - bypassing AI/OCR mapping:",
          normalizedInput.selectedRevenueAccount,
        );

        // Use the manually selected credit account (revenue) directly
        const creditCode = normalizedInput.selectedRevenueAccount.account_code;
        const creditName = normalizedInput.selectedRevenueAccount.account_name;
        const creditType = normalizedInput.selectedRevenueAccount.account_type;

        console.log("📊 Using manual credit account:", {
          creditCode,
          creditName,
          creditType,
        });

        // Use selectedKas or selectedBank directly for debit account
        let debitAccount = null;
        if (normalizedInput.selectedKas) {
          const parts = normalizedInput.selectedKas.split(" — ");
          const kasCode = parts[0]?.trim() || "";
          let kasName = parts[1]?.trim() || "";

          // If name is empty, fetch from database
          if (!kasName && kasCode) {
            const coaData = await loadCOAByFilter({ account_code: kasCode });
            kasName = coaData?.account_name || kasCode;
          }

          debitAccount = {
            account_code: kasCode,
            account_name: kasName,
            account_type: "Aset",
          };
          console.log("✅ Using selectedKas directly:", debitAccount);
        } else if (normalizedInput.selectedBank) {
          const parts = normalizedInput.selectedBank.split(" — ");
          const bankCode = parts[0]?.trim() || "";
          let bankName = parts[1]?.trim() || "";

          // If name is empty, fetch from database
          if (!bankName && bankCode) {
            const coaData = await loadCOAByFilter({ account_code: bankCode });
            bankName = coaData?.account_name || bankCode;
          }

          debitAccount = {
            account_code: bankCode,
            account_name: bankName,
            account_type: "Aset",
          };
          console.log("✅ Using selectedBank directly:", debitAccount);
        } else {
          // Fallback to loadCOAByFilter
          const mappingRule = chooseMappingRule(normalizedInput);
          debitAccount = await loadCOAByFilter(mappingRule.debitFilter);
          console.log("📊 Debit Account found from DB:", debitAccount);
        }

        return {
          debit: debitAccount?.account_code || "",
          credit: creditCode,
          debitName: debitAccount?.account_name || "",
          creditName: creditName,
          debitType: debitAccount?.account_type || "",
          creditType: creditType,
          is_cash_related: true,
          hpp_entry: null,
        };
      }

      // PRIORITY 3: Check if user manually selected modal account
      if (normalizedInput.selectedModalAccount) {
        console.log(
          "✅ Manual modal account detected - bypassing AI/OCR mapping:",
          normalizedInput.selectedModalAccount,
        );

        // Load the manually selected credit account (modal/equity)
        const manualCreditAccount = await supabase
          .from("chart_of_accounts")
          .select("*")
          .eq("id", normalizedInput.selectedModalAccount.id)
          .maybeSingle();

        if (manualCreditAccount.data) {
          console.log(
            "📊 Using manual credit account:",
            manualCreditAccount.data,
          );

          // Still need to determine debit account (cash/bank)
          const mappingRule = chooseMappingRule(normalizedInput);
          console.log(
            "🔍 Loading Debit COA with filter:",
            mappingRule.debitFilter,
          );
          let debitAccount = await loadCOAByFilter(mappingRule.debitFilter);
          console.log("📊 Debit Account found:", debitAccount);

          return {
            debit: debitAccount?.account_code || "",
            credit: manualCreditAccount.data.account_code,
            debitName: debitAccount?.account_name || "",
            creditName: manualCreditAccount.data.account_name,
            debitType: debitAccount?.account_type || "",
            creditType: manualCreditAccount.data.account_type,
            is_cash_related: mappingRule.extras.is_cash_related,
            hpp_entry: null,
          };
        }
      }

      // PRIORITY 4: Use AI/OCR mapping if no manual selection
      console.log("🤖 No manual account selection - using AI/OCR mapping");

      // Step 1: Choose mapping rule
      const mappingRule = chooseMappingRule(normalizedInput);

      // Handle special case: Mutasi Kas
      if (mappingRule.special === "mutasi") {
        // For Transfer Bank, fetch account names from database
        let debitAccountData = null;
        let creditAccountData = null;

        console.log("🔍 Mutasi - debit_account_code:", mappingRule.debit_account_code);
        console.log("🔍 Mutasi - credit_account_code:", mappingRule.credit_account_code);

        if (mappingRule.debit_account_code) {
          const { data, error } = await supabase
            .from("chart_of_accounts")
            .select("account_code, account_name, account_type")
            .eq("account_code", mappingRule.debit_account_code)
            .eq("is_active", true)
            .maybeSingle();
          
          console.log("🔍 Debit account query result:", data, error);
          
          if (!data) {
            throw new Error(
              `Account code ${mappingRule.debit_account_code} (Bank Tujuan) tidak ditemukan atau tidak aktif di Chart of Accounts. Silakan pilih akun bank yang valid.`
            );
          }
          
          debitAccountData = data;
        }

        if (mappingRule.credit_account_code) {
          const { data, error } = await supabase
            .from("chart_of_accounts")
            .select("account_code, account_name, account_type")
            .eq("account_code", mappingRule.credit_account_code)
            .eq("is_active", true)
            .maybeSingle();
          
          console.log("🔍 Credit account query result:", data, error);
          
          if (!data) {
            throw new Error(
              `Account code ${mappingRule.credit_account_code} (Bank Asal) tidak ditemukan atau tidak aktif di Chart of Accounts. Silakan pilih akun bank yang valid.`
            );
          }
          
          creditAccountData = data;
        }

        console.log("📊 Final debitAccountData:", debitAccountData);
        console.log("📊 Final creditAccountData:", creditAccountData);

        return {
          debit: mappingRule.debit_account_code,
          credit: mappingRule.credit_account_code,
          debitName: debitAccountData?.account_name || mappingRule.debit_account_name || "",
          creditName: creditAccountData?.account_name || mappingRule.credit_account_name || "",
          debitType: debitAccountData?.account_type || "Aset",
          creditType: creditAccountData?.account_type || "Aset",
          is_cash_related: mappingRule.is_cash_related,
          hpp_entry: null,
        };
      }

      // Step 2: Load Debit COA
      console.log("🔍 Loading Debit COA with filter:", mappingRule.debitFilter);
      let debitAccount = await loadCOAByFilter(mappingRule.debitFilter);
      console.log("📊 Debit Account found:", debitAccount);

      // Step 3: Load Credit COA
      console.log(
        "🔍 Loading Credit COA with filter:",
        mappingRule.creditFilter,
      );
      let creditAccount = await loadCOAByFilter(mappingRule.creditFilter);
      console.log("📊 Credit Account found:", creditAccount);

      // Step 4: Fallback and Upsert COA if missing
      const fallbackResult = await fallbackAndUpsertCOA(
        debitAccount,
        creditAccount,
        mappingRule,
      );

      // Always use fallback result if accounts are missing
      if (!debitAccount && fallbackResult.debitAccount) {
        debitAccount = fallbackResult.debitAccount;
      }
      if (!creditAccount && fallbackResult.creditAccount) {
        creditAccount = fallbackResult.creditAccount;
      }

      console.log("📊 Final Debit Account:", debitAccount);
      console.log("📊 Final Credit Account:", creditAccount);

      // Step 5: Load HPP COA if needed (hanya untuk Penjualan stok)
      let hppEntry = null;
      if (
        normalizedInput.jenisTransaksi === "Penjualan" &&
        mappingRule.extras.needs_hpp
      ) {
        const hppDebitAccount = await loadCOAByFilter(
          mappingRule.exras.hppFilter,
        );
        const hppCreditAccount = await loadCOAByFilter({
          usage_role: "inventory",
        });

        if (hppDebitAccount && hppCreditAccount) {
          hppEntry = {
            debit: hppDebitAccount.account_code,
            credit: hppCreditAccount.account_code,
            debitName: hppDebitAccount.account_name,
            creditName: hppCreditAccount.account_name,
            debitType: hppDebitAccount.account_type || "Beban",
            creditType: hppCreditAccount.account_type || "Aset",
          };
        }
      }

      return {
        debit: debitAccount?.account_code || "",
        credit: creditAccount?.account_code || "",
        debitName: debitAccount?.account_name || "",
        creditName: creditAccount?.account_name || "",
        debitType: debitAccount?.account_type || "",
        creditType: creditAccount?.account_type || "",
        is_cash_related: mappingRule.extras.is_cash_related,
        hpp_entry: hppEntry,
      };
    } catch (err) {
      // console.error("Error in runFinancialEngine:", err);
      throw err;
    }
  };

  /** Validate Input */
  const validateInput = (form: any) => {
    const errors: string[] = [];
    if (!form.jenisTransaksi) errors.push("jenisTransaksi wajib diisi");
    if (!form.nominal || Number(form.nominal) <= 0)
      errors.push("nominal harus > 0");
    if (!form.tanggal) errors.push("tanggal wajib diisi");

    // Validate payment method requirements
    if (paymentType === "Kas" && !selectedKas) {
      errors.push("Akun Kas wajib dipilih untuk metode pembayaran Kas");
    }
    if (paymentType === "Bank" && !selectedBank) {
      errors.push("Pilih akun bank terlebih dahulu");
    }
    // For Kredit, accounts are auto-selected, no validation needed

    if (errors.length) {
      throw { message: "Validation failed", details: errors };
    }
    return { ok: true };
  };

  /** Normalize Input */
  const normalizeInput = (form: any) => {
    const jenis = (form.jenisTransaksi || "").trim();
    let paymentType = form.paymentType || "";
    if (paymentType?.toLowerCase() === "bank") {
      paymentType = "transfer bank";
    } else if (paymentType?.toLowerCase() === "kas") {
      paymentType = "cash"; // Normalize "Kas" to "cash" for internal logic
    }
    let payment = paymentType.toLowerCase();
    const nominalValue = Number(form.nominal || 0);
    const sumber = (form.sumberPenerimaan || "").trim(); // e.g. 'Pinjaman Bank'
    const kategoriPengeluaranValue = (form.kategoriPengeluaran || "").trim();

    // Normalize date format to YYYY-MM-DD
    let normalizedDate = form.tanggal;
    if (normalizedDate && typeof normalizedDate === "string") {
      // Check if date is in DD/MM/YYYY or DD-MM-YYYY format
      const ddmmyyyyMatch = normalizedDate.match(
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
      );
      if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        normalizedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      // Check if date is in invalid format like "1/9-10"
      else if (
        normalizedDate.includes("/") ||
        normalizedDate.match(/^\d{1,2}[-\/]\d{1,2}$/)
      ) {
        // Invalid date format - use today's date as fallback
        normalizedDate = new Date().toISOString().split("T")[0];
      }
    }

    return {
      jenisTransaksi: jenis,
      paymentType: payment,
      nominal: nominalValue,
      tanggal: normalizedDate,
      deskripsi: form.deskripsi || "",
      sumberPenerimaan: sumber,
      kategoriPengeluaran: kategoriPengeluaranValue,
      kasTujuan: form.kasTujuan || "",
      kasSumber: form.kasSumber || "",
      selectedAccountName: form.selectedAccountName || "",
      selectedCreditAccountType: form.selectedCreditAccountType || "",
      selectedCreditAccountName: form.selectedCreditAccountName || "",
      selectedKas: form.selectedKas || null,
      selectedBank: form.selectedBank || null,
      selectedExpenseAccount: form.selectedExpenseAccount || null,
      selectedRevenueAccount: form.selectedRevenueAccount || null,
      selectedModalAccount: form.selectedModalAccount || null,
    };
  };

  /** Save Transaction (Jurnal + Cash Book) */
  const handleSave = async () => {
    try {
      if (jenisTransaksi === "Jurnal Umum") {
        const payload = {
          jenis_transaksi: "Jurnal Umum",
          tanggal,
          deskripsi: description,
          ditangani_oleh: user?.id,
          entries: journalRows,
        };

        const { data, error } = await supabase.functions.invoke(
          "supabase-functions-save-journal-manual",
          {
            body: payload,
          },
        );

        if (error) {
          console.error("Error saving manual journal:", error);
        } else {
          console.log("Manual journal saved:", data);
        }

        return;
      }

      // Step 1: Validate Input
      validateInput({
        jenisTransaksi,
        nominal,
        tanggal,
      });

      // Step 2: Normalize Input
      const normalizedInput = normalizeInput({
        jenisTransaksi,
        paymentType,
        nominal,
        tanggal,
        deskripsi: description,
        sumberPenerimaan: sumberPenerimaan,
        kategoriPengeluaran: kategoriPengeluaran,
        kasTujuan: jenisTransaksi === "Transfer Bank" ? bankTujuan : kasTujuan,
        kasSumber: jenisTransaksi === "Transfer Bank" ? bankAsal : kasSumber,
        selectedAccountName: selectedAccountName,
        selectedCreditAccountType: selectedCreditAccountType,
        selectedCreditAccountName: selectedCreditAccountName,
        selectedKas: selectedKas,
        selectedBank: selectedBank,
        selectedExpenseAccount: selectedExpenseAccount,
        selectedRevenueAccount: selectedRevenueAccount,
        selectedModalAccount: selectedModalAccount,
      });

      // Step 3: Run Financial Engine
      const result = await runFinancialEngine(normalizedInput);

      console.log("🎯 runFinancialEngine result:", result);
      console.log("🎯 Debit Account:", {
        code: result.debit,
        name: result.debitName,
        type: result.debitType,
      });
      console.log("🎯 Credit Account:", {
        code: result.credit,
        name: result.creditName,
        type: result.creditType,
      });

      // Step 4: Build Journal Lines
      const journalData = buildJournalLines(
        {
          account_code: result.debit,
          account_name: result.debitName,
          account_type: result.debitType,
        },
        {
          account_code: result.credit,
          account_name: result.creditName,
          account_type: result.creditType,
        },
        normalizedInput.nominal,
        normalizedInput.deskripsi,
        normalizedInput.tanggal,
        result.hpp_entry,
        normalizedInput.nominal * 0.7, // HPP amount (70% of sales as example)
        jenisTransaksi === "Penjualan" ? salesItems : [],
      );

      console.log("📋 Journal Data Lines:", journalData.lines);

      // Step 5: Show Preview Modal
      setPreviewLines(journalData.lines);
      setPreviewMemo(journalData.memo);
      setPreviewTanggal(journalData.tanggal);
      setPreviewIsCashRelated(result.is_cash_related);
      setPreviewOpen(true);

      // Step 6: Trigger payment-processor for cash-related transactions
      if (jenisTransaksi === "Penerimaan" || jenisTransaksi === "Pengeluaran") {
        const paymentPayload = {
          invoice_id: null,
          booking_id: null,
          amount: Number(nominal),
          payment_method_id: paymentType?.id || null,
          debit_account_id: selectedExpenseAccount?.id || null,
          debit_account_code: selectedExpenseAccount?.account_code || null,
          debit_account_name: selectedExpenseAccount?.account_name || null,
          notes: description || null,
        };

        console.log("Payment processor payload:", paymentPayload);

        try {
          const res = await fetch("/functions/v1/payment-processor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(paymentPayload),
          });

          if (!res.ok) {
            // console.error("payment-processor error:", await res.text());
          } else {
            const data = await res.json();
            // console.log("payment-processor success:", data);
          }
        } catch (paymentError) {
          console.error("payment-processor fetch failed:", paymentError);
        }
      }
    } catch (err: any) {
      toast({
        title: "❌ Error",
        description: err.details ? err.details.join(", ") : err.message,
        variant: "destructive",
      });
    }
  };

  /** ROUTER UTAMA - Route Transaction Based on Type */
  const routeTransaction = async (
    journalRef: string,
    uploadedBuktiUrl: string,
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Prepare OCR data
    const ocrDataPayload = ocrAppliedData
      ? {
          extractedText: ocrAppliedData.extractedText,
          items: ocrAppliedData.items,
          appliedFields: ocrAppliedData.appliedFields,
        }
      : null;

    console.log("🔀 ROUTER: Routing transaction type:", jenisTransaksi);
    console.log("💾 ROUTER: OCR Applied Data State:", ocrAppliedData);
    console.log("📤 ROUTER: OCR Data Payload to DB:", ocrDataPayload);
    console.log("🔍 ROUTER: Has OCR Data?", ocrDataPayload !== null);

    const mainDebitLine = previewLines.find((l) => l.dc === "D");
    const mainCreditLine = previewLines.find((l) => l.dc === "C");

    // 🔒 REMOVED: Penerimaan/Pengeluaran no longer goes to finance_transactions
    // They will be handled in the switch statement below (Pengeluaran case)

    switch (jenisTransaksi) {
      case "Penjualan": {
        // Insert to sales_transactions
        const unitPrice = Number(nominal) || 0;
        const quantity = 1;
        const subtotal = unitPrice * quantity;
        const taxPercentage = 11;
        const taxAmount = subtotal * (taxPercentage / 100);
        const totalAmount = subtotal + taxAmount;

        const { data: stockData } = await supabase
          .from("stock")
          .select("quantity, cost_per_unit")
          .eq("item_name", itemName)
          .eq("description", description)
          .maybeSingle();

        const { error } = await supabase.from("sales_transactions").insert({
          transaction_date: previewTanggal,
          transaction_type: "Barang",
          item_name: itemName,
          description: description,
          stock_before: stockData?.quantity || 0,
          quantity: quantity,
          stock_after: (stockData?.quantity || 0) - quantity,
          unit_price: unitPrice,
          subtotal: subtotal,
          tax_percentage: taxPercentage,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          payment_method: paymentType === "cash" ? "Tunai" : "Piutang",
          customer_name: customer || "",
          coa_cash_id: mainDebitLine?.account_code || "",
          coa_revenue_code: mainCreditLine?.account_code || "",
          coa_cogs_code: "5-1100",
          coa_inventory_code: coaSelected || "",
          coa_tax_code: taxAmount > 0 ? "2-1250" : null,
          account_code: mainDebitLine?.account_code || "",
          account_name: mainDebitLine?.account_name || "",
          notes: description,
          journal_ref: journalRef,
          approval_status: "approved",
          bukti: uploadedBuktiUrl || null,
          ocr_data: ocrDataPayload,
          ocr_id: ocrAppliedData?.ocrId || null,
        });

        if (error) throw new Error(`Sales Transaction: ${error.message}`);
        console.log("ROUTER: Sales transaction (Barang) saved");
        break;
      }

      case "Penjualan Jasa": {
        // Insert to sales_transactions
        const unitPrice = Number(nominal) || 0;
        const quantity = 1;
        const subtotal = unitPrice * quantity;
        const taxPercentage = 11;
        const taxAmount = subtotal * (taxPercentage / 100);
        const totalAmount = subtotal + taxAmount;

        const { error } = await supabase.from("sales_transactions").insert({
          transaction_date: previewTanggal,
          transaction_type: "Jasa",
          item_name: `${kategori} - ${jenisLayanan}`,
          description: null,
          stock_before: null,
          quantity: quantity,
          stock_after: null,
          unit_price: unitPrice,
          subtotal: subtotal,
          tax_percentage: taxPercentage,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          payment_method: paymentType === "cash" ? "Tunai" : "Piutang",
          customer_name: customer || "",
          coa_cash_id: mainDebitLine?.account_code || "",
          coa_revenue_code: mainCreditLine?.account_code || "",
          coa_cogs_code: null,
          coa_inventory_code: null,
          coa_tax_code: taxAmount > 0 ? "2-1250" : null,
          account_code: mainDebitLine?.account_code || "",
          account_name: mainDebitLine?.account_name || "",
          notes: description,
          journal_ref: journalRef,
          approval_status: "approved",
          bukti: uploadedBuktiUrl || null,
          ocr_data: ocrDataPayload,
          ocr_id: ocrAppliedData?.ocrId || null,
        });

        if (error) throw new Error(`Sales Transaction: ${error.message}`);
        console.log("ROUTER: Sales transaction (Jasa) saved");
        break;
      }

      case "Pembelian Barang": {
        // Insert to purchase_transactions
        const { error } = await supabase.from("purchase_transactions").insert({
          transaction_date: previewTanggal,
          supplier_name: supplier || "",
          item_name: itemName,
          description: description,
          quantity: 1,
          unit_price: nominal,
          total_amount: nominal,
          payment_method: paymentType === "cash" ? "Tunai" : "Hutang",
          coa_inventory_code: mainDebitLine?.account_code || "",
          coa_cash_id: mainCreditLine?.account_code || "",
          account_code: mainDebitLine?.account_code || "",
          account_name: mainDebitLine?.account_name || "",
          notes: description,
          journal_ref: journalRef,
          bukti: uploadedBuktiUrl || null,
          ocr_data: ocrDataPayload,
          ocr_id: ocrAppliedData?.ocrId || null,
        });

        if (error) throw new Error(`Purchase Transaction: ${error.message}`);
        console.log("ROUTER: Purchase transaction (Barang) saved");
        break;
      }

      case "Pembelian Jasa": {
        // Insert to purchase_transactions with transaction_type = "Jasa"
        // created_by will be auto-filled by database trigger
        const { error } = await supabase.from("purchase_transactions").insert({
          transaction_date: previewTanggal,
          supplier_name: supplier || "",
          item_name: itemName || "Jasa",
          description: description,
          quantity: 1,
          unit_price: nominal,
          total_amount: nominal,
          payment_method: paymentType === "cash" ? "Tunai" : "Hutang",
          coa_inventory_code: mainDebitLine?.account_code || "",
          coa_cash_id: mainCreditLine?.account_code || "",
          account_code: mainDebitLine?.account_code || "",
          account_name: mainDebitLine?.account_name || "",
          notes: description,
          journal_ref: journalRef,
          bukti: uploadedBuktiUrl || null,
          ocr_data: ocrDataPayload,
          ocr_id: ocrAppliedData?.ocrId || null,
          transaction_type: "Jasa",
        });

        if (error)
          throw new Error(`Purchase Transaction (Jasa): ${error.message}`);
        console.log("ROUTER: Purchase transaction (Jasa) saved");
        break;
      }

      case "Pendapatan":
      case "Penerimaan Kas & Bank":
      case "Penerimaan Kas":
      case "Pinjaman Masuk": {
        // Insert to cash_and_bank_receipts
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const isBankPayment = (paymentType || "").toLowerCase() !== "cash";

        const { error } = await supabase.from("cash_and_bank_receipts").insert({
          transaction_date: previewTanggal,
          transaction_type: "Penerimaan",
          source_destination:
            sumberPenerimaan || customer || supplier || "Penerimaan Kas",
          amount: nominal,
          payment_method: paymentType === "cash" ? "Tunai" : "Bank",

          // IMPORTANT: for Metode Pembayaran = Bank, backend expects bank_account
          bank_account: isBankPayment ? (mainDebitLine?.account_code || null) : null,

          coa_cash_id: mainDebitLine?.account_code || "",
          coa_contra_code: mainCreditLine?.account_code || "4-1100",
          debit_account_code: mainDebitLine?.account_code || "",
          debit_account_name: mainDebitLine?.account_name || "",
          credit_account_code: mainCreditLine?.account_code || "",
          credit_account_name: mainCreditLine?.account_name || "",
          account_code: mainDebitLine?.account_code || "",
          account_name: mainDebitLine?.account_name || "",
          account_type_credit: selectedCreditAccountType || "",
          account_name_credit: selectedCreditAccountName || "",
          description: previewMemo,
          reference_number: `PKM-${Date.now()}`,
          journal_ref: journalRef,
          approval_status: "approved",
          bukti: uploadedBuktiUrl || null,
          ocr_data: ocrDataPayload,
          ocr_id: ocrAppliedData?.ocrId || null,
          created_by: user?.id || null,
        });

        if (error) throw new Error(`Cash Receipt: ${error.message}`);
        console.log("ROUTER: Cash receipt saved");
        break;
      }

      case "Pengeluaran":
      case "Pengeluaran Kas":
      case "Pengeluaran_Kas":
      case "Pengeluaran-Kas":
      case "PengeluaranKas":
      case "Cash Out":
      case "CashOut":
      case "Cash_Out":
      case "Cash-Out":
      case "Pembayaran Pinjaman":
      case "Pembayaran_Pinjaman":
      case "Pembayaran-Pinjaman":
      case "Kas Keluar":
      case "Cash Keluar":
      case "Keluar":
      case "Expense":
      case "Beban": {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const expenseLine = previewLines.find((l) => l.dc === "D");
        const cashLine = previewLines.find((l) => l.dc === "C");

        // 🔒 CRITICAL: NORMALISASI paymentType
        const normalizedPayment = paymentType?.toLowerCase() || jenisPembayaranPengeluaran?.toLowerCase() || "";
        const isBankPayment = normalizedPayment === "bank" || normalizedPayment === "transfer" || normalizedPayment === "transfer bank" || normalizedPayment.includes("bank");
        
        console.log("🔍 PENGELUARAN DEBUG (SIMPAN LANGSUNG):", {
          paymentType,
          jenisPembayaranPengeluaran,
          normalizedPayment,
          isBankPayment,
          willUseCashDisbursement: true, // Both Kas and Bank go to cash_disbursement
        });

        // ========== RESOLVE COA IDs ==========
        // Resolve Bank/Kas COA ID
        let coaCashId: string | null = null;
        let coaCashAccountCode: string | null = null;
        let coaCashAccountName: string | null = null;
        let coaCashAccountType: string | null = null;

        const cashAccountCode = cashLine?.account_code;
        if (cashAccountCode) {
          const { data: coaCash, error: errCash } = await supabase
            .from("chart_of_accounts")
            .select("id, account_code, account_name, account_type")
            .eq("account_code", cashAccountCode)
            .single();
          if (errCash || !coaCash) {
            console.error(
              "❌ COA Bank/Kas tidak ditemukan untuk:",
              cashAccountCode,
            );
            throw new Error(
              `COA Bank/Kas tidak ditemukan untuk account_code: ${cashAccountCode}`,
            );
          }
          coaCashId = coaCash.id;
          coaCashAccountCode = coaCash.account_code;
          coaCashAccountName = coaCash.account_name;
          coaCashAccountType = coaCash.account_type;
          console.log("✅ Resolved COA Cash/Bank:", coaCash);
        }

        // Resolve Expense COA ID
        let coaExpenseId: string | null = null;
        let coaExpenseAccountCode: string | null = null;
        let coaExpenseAccountName: string | null = null;
        let coaExpenseAccountType: string | null = null;

        // Prioritize selectedExpenseAccount over expenseLine
        const expenseAccountCode = selectedExpenseAccount?.account_code || expenseLine?.account_code;
        if (expenseAccountCode) {
          const { data: coaExpense, error: errExp } = await supabase
            .from("chart_of_accounts")
            .select("id, account_code, account_name, account_type")
            .eq("account_code", expenseAccountCode)
            .single();
          if (errExp || !coaExpense) {
            console.error(
              "❌ COA Beban tidak ditemukan untuk:",
              expenseAccountCode,
            );
            throw new Error(
              `COA Beban tidak ditemukan untuk account_code: ${expenseAccountCode}`,
            );
          }
          coaExpenseId = coaExpense.id;
          coaExpenseAccountCode = coaExpense.account_code;
          coaExpenseAccountName = coaExpense.account_name;
          coaExpenseAccountType = coaExpense.account_type;
          console.log("✅ Resolved COA Expense:", coaExpense);
        }
        // ========== END RESOLVE COA IDs ==========

        // 🔒 BOTH KAS & BANK PENGELUARAN → cash_disbursement
        console.log("💰 ROUTER: Inserting to cash_disbursement...");
        console.log("👤 User ID:", user?.id);
        console.log("📅 Transaction Date:", previewTanggal);
        console.log("💵 Amount:", nominal);
        console.log("🧾 Expense Line:", expenseLine);
        console.log("💰 Cash Line:", cashLine);

        const { data, error } = await supabase
          .from("cash_disbursement")
          .insert({
            transaction_date: previewTanggal,
            payee_name:
              namaPengeluaran ||
              namaKaryawanPengeluaran ||
              supplier ||
              customer ||
              null,
            description: previewMemo,
            category: kategori,
            amount: nominal,
            // 🔒 Payment method based on type
            payment_method: isBankPayment ? "Transfer Bank" : "Tunai",

            // COA Mapping - NOW WITH RESOLVED UUIDs
            coa_cash_id: coaCashId,
            coa_expense_id: coaExpenseId,
            cash_account_id: coaCashId, // 🔒 sama dengan coa_cash_id
            bank_account_id: isBankPayment ? coaCashId : null, // 🔒 only for bank payments

            // Legacy fields (only valid schema fields, truncated to avoid DB length issues)
            account_code:
              (coaExpenseAccountCode || expenseLine?.account_code || null)
                ?.toString()
                .slice(0, 20) || null,
            account_name:
              (coaExpenseAccountName || expenseLine?.account_name || null)
                ?.toString()
                .slice(0, 20) || null,

            // Journal trigger fields - CRITICAL for journal entry creation
            debit_account_code: coaExpenseAccountCode || expenseLine?.account_code || null,
            debit_account_name: coaExpenseAccountName || expenseLine?.account_name || null,
            credit_account_code: coaCashAccountCode || cashLine?.account_code || null,
            credit_account_name: coaCashAccountName || cashLine?.account_name || null,
            bank_account: isBankPayment ? (coaCashAccountCode || cashLine?.account_code || null) : null,
            transaction_type: "Pengeluaran",

            // REQUIRED FIXES
            exchange_rate: 1, // wajib > 0
            approval_status: "approved",

            // User metadata
            created_by: user?.id,

            // Additional fields
            document_number: null, // Will be updated after insert
            notes: description,
            bukti: uploadedBuktiUrl || null,
            ocr_data: ocrDataPayload,
            ocr_id: ocrAppliedData?.ocrId || null,
          })
          .select();

        if (error) {
          console.error("❌ Cash Disbursement Insert Error:", error);
          throw new Error(`Cash Disbursement: ${error.message}`);
        }

        // Update document_number with ID after insert
        if (data?.[0]?.id) {
          const docNumber = data[0].id.substring(0, 8);
          await supabase
            .from("cash_disbursement")
            .update({ document_number: docNumber })
            .eq("id", data[0].id);
        }

        console.log("✅ ROUTER: Cash disbursement saved successfully:", data);
        break;
      }

      case "Transfer Bank":
      case "Transfer_Bank":
      case "Transfer-Bank":
      case "TransferBank": {
        // Transfer Bank: Use default journal_entries insert (sync_journal_to_gl trigger)
        console.log("✅ ROUTER: Transfer Bank - using default journal_entries insert");
        break;
      }

      case "Setoran Modal": {
        // Setoran Modal: Use default journal_entries insert (sync_journal_to_gl trigger)
        console.log("✅ ROUTER: Setoran Modal - using default journal_entries insert");
        break;
      }

      default:
        console.warn("⚠️ ROUTER: Unknown transaction type:", jenisTransaksi);
    }
  };

  /** Helper function to derive account_type from account_code prefix */
  const deriveAccountType = (
    accountCode: string,
    existingType?: string,
  ): string => {
    if (existingType && existingType.trim() !== "") return existingType;
    if (!accountCode) return "";
    const prefix = accountCode.charAt(0);
    switch (prefix) {
      case "1":
        return "Aset";
      case "2":
        return "Kewajiban";
      case "3":
        return "Ekuitas";
      case "4":
        return "Pendapatan";
      case "5":
        return "HPP";
      case "6":
        return "Beban";
      case "7":
        return "Pendapatan Lain";
      case "8":
        return "Beban Lain";
      default:
        return "";
    }
  };

  /** Confirm and Save Journal Entries */
  const handleConfirmSave = async () => {
    try {
      setIsConfirming(true);

      // Debug: Log file states at the start
      console.log("🚀 handleConfirmSave started");
      console.log("📁 buktiFile at start:", buktiFile);
      console.log("📁 ocrFile at start:", ocrFile);
      console.log("📁 ocrAppliedData at start:", ocrAppliedData);

      // Generate journal reference
      const journalRef = `JRN-${Date.now()}`;

      // Step 1: Upload bukti file FIRST (before any database operations)
      let uploadedBuktiUrl = "";
      console.log("🔍 DEBUG - buktiFile state:", buktiFile);
      console.log("🔍 DEBUG - ocrFile state:", ocrFile);
      console.log("🔍 DEBUG - ocrAppliedData state:", ocrAppliedData);
      console.log("🔍 DEBUG - uploadedFileUrl from OCR:", uploadedFileUrl);

      // Priority: uploadedFileUrl from OCR > buktiFile > ocrFile
      if (uploadedFileUrl) {
        uploadedBuktiUrl = uploadedFileUrl;
        console.log("✅ Using OCR uploaded file URL:", uploadedBuktiUrl);
      } else {
        // Use ocrFile as fallback if buktiFile is not set
        const fileToUpload = buktiFile || ocrFile;
        console.log("📁 DEBUG - fileToUpload:", fileToUpload);

        if (fileToUpload && fileToUpload.name) {
          console.log("🔍 DEBUG - Starting file upload...", {
            name: fileToUpload.name,
            size: fileToUpload.size,
          });

          const fileExt = fileToUpload.name.split(".").pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `bukti-transaksi/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(filePath, fileToUpload);

          if (uploadError) {
            console.error("File Upload Error:", uploadError);
            throw new Error(`File Upload: ${uploadError.message}`);
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("documents")
            .getPublicUrl(filePath);

          uploadedBuktiUrl = urlData.publicUrl;
          console.log("File uploaded successfully:", uploadedBuktiUrl);
        } else {
          console.log("⚠️ No buktiFile or ocrFile found - skipping upload");
        }
      }

      // Step 2: Create Journal Entries
      const mainDebitLine = previewLines.find((l) => l.dc === "D");
      const mainCreditLine = previewLines.find((l) => l.dc === "C");

      if (mainDebitLine && mainCreditLine) {
        const debitAccountType = deriveAccountType(
          mainDebitLine.account_code,
          mainDebitLine.account_type,
        );
        const creditAccountType = deriveAccountType(
          mainCreditLine.account_code,
          mainCreditLine.account_type,
        );

        console.log("📝 Journal Entry Data:", {
          account_code: mainDebitLine.account_code,
          account_name: mainDebitLine.account_name,
          account_type: debitAccountType,
          debit: mainDebitLine.amount,
          credit: mainCreditLine.amount,
        });

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // NOTE: Do not insert into journal_entries from client.
        // Journal posting must be handled by backend (trigger/RPC/edge function) to avoid duplicates.
        console.warn(
          "⚠️ Skipping client-side journal_entries insert. Configure backend posting for journal_ref:",
          journalRef,
        );

        console.log("Journal Entries saved (2 lines)");
      }

      // Step 3: Save HPP entry if exists (for Penjualan)
      if (previewLines.length > 2) {
        const hppDebitLine = previewLines[2]; // HPP debit
        const hppCreditLine = previewLines[3]; // Inventory credit

        const hppDebitAccountType = deriveAccountType(
          hppDebitLine.account_code,
          hppDebitLine.account_type,
        );
        const hppCreditAccountType = deriveAccountType(
          hppCreditLine.account_code,
          hppCreditLine.account_type,
        );

        const {
          data: { user },
        } = await supabase.auth.getUser();

        // NOTE: Do not insert HPP into journal_entries from client.
        // Posting must be handled by backend (trigger/RPC/edge function) to avoid duplicates.
        console.warn(
          "⚠️ Skipping client-side HPP journal posting for journal_ref:",
          journalRef,
        );
      }

      // Step 4: Create Cash Book if needed (Penerimaan/Pengeluaran Kas)
      if (
        jenisTransaksi === "Penerimaan Kas" ||
        jenisTransaksi === "Pengeluaran Kas"
      ) {
        const cashLine = previewLines.find(
          (l) => l.account_code.startsWith("1-11"), // Cash/Bank accounts
        );

        if (cashLine) {
          // Generate document number
          const docNumber = `${jenisTransaksi === "Penerimaan Kas" ? "PKM" : "PKK"}-${Date.now()}`;

          const { error: supabaseError } = await supabase
            .from("kas_transaksi")
            .insert({
              tanggal: previewTanggal,
              document_number: docNumber,
              payment_type: jenisTransaksi, // "Penerimaan Kas" or "Pengeluaran Kas"
              account_number: cashLine.account_code,
              account_name: cashLine.account_name,
              account_code: cashLine.account_code,
              nominal: parseFloat(String(cashLine.amount)),
              keterangan: previewMemo,
              description: previewMemo,
              notes: previewMemo,
              bukti: uploadedBuktiUrl || null,
              ocr_data: ocrAppliedData
                ? {
                    extractedText: ocrAppliedData.extractedText,
                    items: ocrAppliedData.items,
                    appliedFields: ocrAppliedData.appliedFields,
                  }
                : null,
            } as any);

          if (supabaseError) {
            // console.error("Cash Book Error:", supabaseError);
            throw new Error(`Cash Book: ${supabaseError.message}`);
          }
          console.log("Cash Book saved successfully");
        }
      }

      // Step 5: ROUTER - Route transaction to appropriate table
      await routeTransaction(journalRef, uploadedBuktiUrl);

      toast({
        title: "✅ Berhasil",
        description: `Transaksi berhasil disimpan. Ref: ${journalRef}`,
      });

      // Reset form and close modal
      resetForm();
      setPreviewOpen(false);

      // Always refresh transactions list to show new data
      await loadTransactions();
    } catch (err: any) {
      // console.error("❌ handleConfirmSave error:", err);
      toast({
        title: "❌ Error",
        description: err.message || "Gagal menyimpan transaksi",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const resetForm = () => {
    setJenisTransaksi("");
    setPaymentType("");
    setKategori("");
    setJenisLayanan("");
    setItemName("");
    setDescription("");
    setCustomer("");
    setSupplier("");
    setNominal("");
    setQuantity("1");
    setHargaJual("");
    setHargaBeli("");
    setPpnPercentage("11");
    setPpnAmount("0");
    setTanggal(new Date().toISOString().split("T")[0]);
    setCoaSelected("");
    setSumberPenerimaan("");
    setKasSumber("");
    setKasTujuan("");
    setKategoriPengeluaran("");
    setConsignee("");
    setSelectedBank("");
    setSelectedKas("");
    setStockInfo(null);
    setJenisPembayaranPengeluaran("Cash");
    setNamaPengeluaran("");
    setSearchEmployeePengeluaran("");
    setOpenEmployeePengeluaranCombobox(false);
    setSelectedAccountType("");
    setSelectedAccountName("");
    setSearchAccountTypePenerimaan("");
    setSearchAccountNamePenerimaan("");
    setOpenAccountTypePenerimaanCombobox(false);
    setOpenAccountNamePenerimaanCombobox(false);
    setSelectedCreditAccountType("");
    setSelectedCreditAccountName("");
    setSearchCreditAccountType("");
    setSearchCreditAccountName("");
    setOpenCreditAccountTypeCombobox(false);
    setOpenCreditAccountNameCombobox(false);
    setBuktiFile(null);
    setBuktiUrl("");
    setOcrAppliedData(null);
    setOcrFile(null);
    setOcrFilePreview(null);
    setOcrExtractedText("");
    setOcrParsedData(null);
  };

  // Add to cart function
  const handleAddToCart = () => {
    // Validate required fields
    if (!jenisTransaksi) {
      toast({
        title: "⚠️ Peringatan",
        description: "Pilih jenis transaksi terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (!nominal || Number(nominal) <= 0) {
      toast({
        title: "⚠️ Peringatan",
        description: "Masukkan nominal yang valid",
        variant: "destructive",
      });
      return;
    }

    // Validate employee selection for Beban Gaji
    if (selectedAccountName === "Beban Gaji & Karyawan" && !selectedEmployee) {
      toast({
        title: "⚠️ Peringatan",
        description: "Pilih nama karyawan terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    // Validate Pengeluaran Kas fields
    if (jenisTransaksi === "Pengeluaran Kas") {
      if (!jenisPembayaranPengeluaran) {
        toast({
          title: "⚠️ Peringatan",
          description: "Pilih jenis pembayaran terlebih dahulu",
          variant: "destructive",
        });
        return;
      }
      if (!namaPengeluaran.trim()) {
        toast({
          title: "⚠️ Peringatan",
          description: "Masukkan nama karyawan terlebih dahulu",
          variant: "destructive",
        });
        return;
      }
    }

    // 🔒 VALIDASI AKUN KAS/BANK UNTUK PENGELUARAN
    const isPengeluaranType = jenisTransaksi === "Pengeluaran" || jenisTransaksi === "Pengeluaran Kas";
    if (isPengeluaranType) {
      // Wajib pilih metode pembayaran
      if (!paymentType) {
        toast({
          title: "⚠️ Peringatan",
          description: "Pilih metode pembayaran (Kas/Bank) terlebih dahulu",
          variant: "destructive",
        });
        return;
      }
      // Jika metode pembayaran adalah Kas, wajib pilih akun kas
      if ((paymentType === "Kas" || paymentType === "kas" || paymentType === "cash") && !selectedKas) {
        toast({
          title: "⚠️ Peringatan",
          description: "Pilih akun Kas terlebih dahulu",
          variant: "destructive",
        });
        return;
      }
      // Jika metode pembayaran adalah Bank, wajib pilih akun bank
      if ((paymentType === "Bank" || paymentType === "bank") && !selectedBank) {
        toast({
          title: "⚠️ Peringatan",
          description: "Pilih akun Bank terlebih dahulu",
          variant: "destructive",
        });
        return;
      }
    }

    // Get employee name if selected
    const employeeName = selectedEmployee
      ? employees.find((emp) => emp.id === selectedEmployee)?.full_name
      : "";

    // 🔒 CRITICAL FIX: SIMPAN paymentType ASLI DARI UI (JANGAN HARDCODE)
    const normalizedPaymentType = 
      paymentType?.toLowerCase() === "bank" || 
      jenisPembayaranPengeluaran?.toLowerCase() === "bank" 
        ? "bank" 
        : "kas";
    
    const finalSelectedBank = normalizedPaymentType === "bank" ? selectedBank : null;
    const finalSelectedKas = normalizedPaymentType === "kas" ? selectedKas : null;
    
    // Create cart item
    const cartItem = {
      id: Date.now().toString(),
      jenisTransaksi,
      paymentType: normalizedPaymentType, // 🔒 WAJIB: "bank" atau "kas" sesuai pilihan user
      kategori,
      jenisLayanan,
      itemName,
      description,
      customer,
      supplier,
      consignee,
      nominal,
      quantity,
      hargaJual,
      hargaBeli,
      ppnPercentage,
      ppnAmount,
      tanggal,
      description,
      coaSelected,
      sumberPenerimaan,
      kasSumber,
      kasTujuan,
      kategoriPengeluaran,
      selectedBank: finalSelectedBank, // 🔒 NULL jika KAS, WAJIB jika BANK
      selectedKas: finalSelectedKas, // 🔒 NULL jika BANK, WAJIB jika KAS
      stockInfo,
      selectedAccountType,
      selectedAccountName,
      selectedCreditAccountType,
      selectedCreditAccountName,
      employeeId: selectedEmployee,
      employeeName,
      // Pengeluaran Kas fields
      jenisPembayaranPengeluaran,
      namaPengeluaran,
      // Loan fields
      borrowerName: selectedBorrower,
      loanType,
      interestRate,
      loanTermMonths,
      maturityDate,
      paymentSchedule,
      principalAmount,
      interestAmount,
      lateFee,
      lateFeePercentage,
      daysLate,
      actualPaymentDate,
      installmentSchedule,
      taxAmount,
      taxPercentage,
      taxType,
      // Bukti file
      buktiFile: buktiFile, // Store the file object in cart
      // Manual account selections
      selectedExpenseAccount: selectedExpenseAccount,
      selectedRevenueAccount: selectedRevenueAccount,
      selectedModalAccount: selectedModalAccount,
      // Checkbox selection
      selected: true,
    };

    setCart([...cart, cartItem]);

    toast({
      title: "✅ Berhasil",
      description: "Transaksi ditambahkan ke keranjang",
    });

    // Reset form but keep date
    const currentDate = tanggal;
    resetForm();
    setTanggal(currentDate);
  };

  // Remove from cart
  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
    toast({
      title: "✅ Berhasil",
      description: "Transaksi dihapus dari keranjang",
    });
  };

  // ========== HELPER FUNCTIONS FOR CASH vs BANK SEPARATION ==========
  // CRITICAL: Mandatory separation between Cash and Bank payment methods
  // - Cash payments → cash_disbursement table
  // ========== END HELPER FUNCTIONS ==========

  // Checkout all items in cart
  //console.log("🔥🔥 CHECKOUT EXECUTED AT:", new Date().toISOString());
  const handleCheckoutCart = async () => {
    const selectedItems = cart.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      toast({
        title: "⚠️ Peringatan",
        description: "Pilih minimal satu transaksi untuk di-checkout",
        variant: "destructive",
      });
      return;
    }

    setIsConfirming(true);
    console.log(
      `🚀 Starting batch checkout for ${selectedItems.length} items...`,
    );
    const startTime = Date.now();

    try {
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        const itemStartTime = Date.now();
        
        // 🔒 VERIFIKASI LOG - WAJIB DICEK
        console.log("🔒 VERIFIKASI PAYMENT METHOD:", {
          paymentMethod: item.paymentType || item.jenisPembayaranPengeluaran,
          selectedBankAccountCode: item.selectedBank || item.bank_account || null,
          jenisPembayaranPengeluaran: item.jenisPembayaranPengeluaran,
          paymentType: item.paymentType,
          selectedBank: item.selectedBank,
        });
        
        console.log(`\n📦 Processing item ${i + 1}/${selectedItems.length}:`, {
          jenisTransaksi: item.jenisTransaksi,
          nominal: item.nominal,
          description: item.description,
        });

        // Upload bukti file if exists (for all transaction types)
        let uploadedBuktiUrl = "";
        console.log("🔍 DEBUG Checkout - item.buktiFile:", item.buktiFile);

        if (item.buktiFile && item.buktiFile.name) {
          console.log("🔍 DEBUG Checkout - Starting file upload...", {
            name: item.buktiFile.name,
            size: item.buktiFile.size,
          });

          const fileExt = item.buktiFile.name.split(".").pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `bukti-transaksi/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(filePath, item.buktiFile);

          if (uploadError) {
            console.error("Upload error:", uploadError);
          } else {
            const { data: urlData } = supabase.storage
              .from("documents")
              .getPublicUrl(filePath);
            uploadedBuktiUrl = urlData.publicUrl;
            console.log("Bukti file uploaded:", uploadedBuktiUrl);
          }
        } else {
          console.log("⚠️ No buktiFile found in cart item - skipping upload");
        }

        // Check if this transaction needs approval
        // 🔒 BANK TRANSACTIONS (Pendapatan Bank & Pengeluaran Bank) WAJIB APPROVAL
        const normalizedPaymentForApproval = (item.paymentType || "").toLowerCase();
        const isBankTransaction = normalizedPaymentForApproval === "bank";
        const isPendapatanOrPengeluaran = 
          item.jenisTransaksi === "Pendapatan" ||
          item.jenisTransaksi === "Penerimaan Kas" ||
          item.jenisTransaksi === "Pengeluaran" ||
          item.jenisTransaksi === "Pengeluaran Kas" ||
          item.jenisTransaksi?.toLowerCase().includes("pendapatan") ||
          item.jenisTransaksi?.toLowerCase().includes("pengeluaran");
        
        const needsApproval =
          item.jenisTransaksi === "Pembelian Barang" ||
          item.jenisTransaksi === "Pembelian Jasa" ||
          item.jenisTransaksi === "Pengeluaran Kas" ||
          item.jenisTransaksi === "Pengeluaran" ||
          (isBankTransaction && isPendapatanOrPengeluaran); // 🔒 Bank Pendapatan & Pengeluaran wajib approval
        
        console.log("🔍 APPROVAL CHECK:", {
          jenisTransaksi: item.jenisTransaksi,
          needsApproval: needsApproval,
          willCreateJournalEntries: !needsApproval
        });

        // Step 1: Normalize Input
        console.log("🔍 BATCH CHECKOUT - Cart Item:", {
          jenisTransaksi: item.jenisTransaksi,
          paymentType: item.paymentType,
          selectedBank: item.selectedBank,
          selectedKas: item.selectedKas,
          selectedExpenseAccount: item.selectedExpenseAccount,
        });
        
        console.log("🔍 BEFORE normalizeInput - paymentType:", item.paymentType);
        
        const normalizedInput = normalizeInput({
          jenisTransaksi: item.jenisTransaksi,
          paymentType: item.paymentType,
          nominal: item.nominal,
          tanggal: item.tanggal,
          deskripsi: item.description,
          sumberPenerimaan: item.sumberPenerimaan,
          kategoriPengeluaran: item.kategoriPengeluaran,
          kasTujuan: item.kasTujuan,
          kasSumber: item.kasSumber,
          selectedAccountName: item.selectedAccountName || "",
          selectedCreditAccountType: item.selectedCreditAccountType || "",
          selectedCreditAccountName: item.selectedCreditAccountName || "",
          selectedExpenseAccount: item.selectedExpenseAccount || null,
          selectedRevenueAccount: item.selectedRevenueAccount || null,
          selectedModalAccount: item.selectedModalAccount || null,
          // Bank/Kas account fields for validation
          selectedBank: item.selectedBank || null,
          selectedKas: item.selectedKas || null,
          bank_account: item.bank_account || null,
          bank_account_id: item.bank_account_id || null,
          coa_cash_id: item.coa_cash_id || null,
        });

        // Step 2: Run Financial Engine
        const result = await runFinancialEngine(normalizedInput);

        // Step 3: Build Journal Lines
        const journalData = buildJournalLines(
          {
            account_code: result.debit,
            account_name: result.debitName,
            account_type: result.debitType,
          },
          {
            account_code: result.credit,
            account_name: result.creditName,
            account_type: result.creditType,
          },
          normalizedInput.nominal,
          normalizedInput.deskripsi,
          normalizedInput.tanggal,
          result.hpp_entry,
          normalizedInput.nominal * 0.7, // HPP amount (70% of sales as example)
        );

        const journalRef = `JRN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Step 4: Create Journal Entries (skip if needs approval)
        const mainDebitLine = journalData.lines.find((l) => l.dc === "D");
        const mainCreditLine = journalData.lines.find((l) => l.dc === "C");

        // CRITICAL: Skip ALL Pengeluaran (Kas & Bank) - they go through cash_disbursement table
        const isPengeluaranKasOrBank = 
          item.jenisTransaksi === "Pengeluaran Kas" ||
          item.jenisTransaksi === "Pengeluaran" ||
          item.jenisTransaksi?.toLowerCase().includes("pengeluaran") ||
          item.jenisTransaksi?.toLowerCase().includes("expense");

        if (!needsApproval && !isPengeluaranKasOrBank && mainDebitLine && mainCreditLine) {
          // Validate that account_code exists in chart_of_accounts with proper filters
          const { data: debitAccountExists } = await supabase
            .from("chart_of_accounts")
            .select("account_code, normal_balance, account_type, allow_manual_posting, is_contra")
            .eq("account_code", mainDebitLine.account_code)
            .eq("is_active", true)
            .eq("allow_manual_posting", true)
            .eq("is_contra", false)
            .maybeSingle();

          const { data: creditAccountExists } = await supabase
            .from("chart_of_accounts")
            .select("account_code, normal_balance, account_type, allow_manual_posting, is_contra")
            .eq("account_code", mainCreditLine.account_code)
            .eq("is_active", true)
            .eq("allow_manual_posting", true)
            .eq("is_contra", false)
            .maybeSingle();

          if (!debitAccountExists) {
            throw new Error(
              `Account code ${mainDebitLine.account_code} (${mainDebitLine.account_name}) tidak ditemukan, tidak aktif, tidak mengizinkan posting manual, atau merupakan akun kontra. Silakan pilih akun yang valid.`
            );
          }

          if (!creditAccountExists) {
            throw new Error(
              `Account code ${mainCreditLine.account_code} (${mainCreditLine.account_name}) tidak ditemukan, tidak aktif, tidak mengizinkan posting manual, atau merupakan akun kontra. Silakan pilih akun yang valid.`
            );
          }

          // Validate normal_balance based on transaction type
          if (jenisTransaksi === 'Pendapatan' && creditAccountExists.normal_balance !== 'Kredit') {
            throw new Error(
              `Akun ${mainCreditLine.account_name} harus memiliki normal_balance = 'Kredit' untuk transaksi Pendapatan.`
            );
          }

          if (jenisTransaksi === 'Pengeluaran' && debitAccountExists.normal_balance !== 'Debit') {
            throw new Error(
              `Akun ${mainDebitLine.account_name} harus memiliki normal_balance = 'Debit' untuk transaksi Pengeluaran.`
            );
          }

          // Validate account_type based on transaction type
          if (jenisTransaksi === 'Pendapatan' && creditAccountExists.account_type !== 'Pendapatan') {
            throw new Error(
              `Akun ${mainCreditLine.account_name} harus memiliki account_type = 'Pendapatan' untuk transaksi Pendapatan.`
            );
          }

          if (jenisTransaksi === 'Pengeluaran' && debitAccountExists.account_type !== 'Beban Operasional') {
            throw new Error(
              `Akun ${mainDebitLine.account_name} harus memiliki account_type = 'Beban Operasional' untuk transaksi Pengeluaran.`
            );
          }

          const batchDebitAccountType = deriveAccountType(
            mainDebitLine.account_code,
            mainDebitLine.account_type,
          );

          // NOTE: Do not insert into journal_entries from client.
          // Journal posting must be handled by backend (trigger/RPC/edge function) to avoid duplicates.
          // const { error } = await supabase.from("journal_entries").insert({ ... });
          // if (error) throw new Error(`Journal Entry: ${error.message}`);
        }

        // Step 5: Save HPP entry if exists (for Penjualan) - skip if needs approval
        if (!needsApproval && journalData.lines.length > 2) {
          const hppDebitLine = journalData.lines[2];
          const hppCreditLine = journalData.lines[3];

          const batchHppAccountType = deriveAccountType(
            hppDebitLine.account_code,
            hppDebitLine.account_type,
          );

          // NOTE: Do not insert into journal_entries from client.
          // HPP posting must be handled by backend (trigger/RPC/edge function) to avoid duplicates.
          // const { error } = await supabase.from("journal_entries").insert({ ... });
          // if (error) throw new Error(`HPP Entry: ${error.message}`);
        }

        // Step 6: Create Cash Book if needed - skip if needs approval
        if (!needsApproval && result.is_cash_related) {
          // Find the correct cash/bank line based on payment type
          const cashLine = journalData.lines.find((l) => {
            const isKasOrBank = l.account_code.startsWith("1-11");
            // For Bank payment, prioritize Bank accounts (1-12xx)
            if (item.paymentType === "Bank") {
              return l.account_code.startsWith("1-12");
            }
            // For Kas payment, prioritize Kas accounts (1-11xx but not 1-12xx)
            if (item.paymentType === "Kas") {
              return l.account_code.startsWith("1-11") && !l.account_code.startsWith("1-12");
            }
            // Default: any Kas/Bank account
            return isKasOrBank;
          });

          if (cashLine) {
            // 🔒 VALIDASI SEBELUM INSERT
            const selectedKasAccountId = cashLine.account_code;
            const transactionAmount = parseFloat(String(cashLine.amount));

            if (!selectedKasAccountId) {
              throw new Error("Akun Kas wajib dipilih sebelum menyimpan transaksi kas");
            }

            if (!transactionAmount || transactionAmount <= 0) {
              throw new Error("Jumlah kas tidak valid");
            }

            // Get current user
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (!user?.id) {
              throw new Error("User tidak teridentifikasi");
            }

            // 🔒 INSERT KAS_TRANSAKSI DENGAN PAYLOAD LENGKAP
            await supabase.from("kas_transaksi").insert({
              transaction_date: journalData.tanggal,      // Date | yyyy-mm-dd
              amount: transactionAmount,                   // NUMBER, bukan string
              jenis: "pengeluaran",                        // WAJIB
              coa_kas_id: selectedKasAccountId,            // UUID akun kas (1-11xx)
              description: journalData.memo || null,
              created_by: user.id,                         // auth.user.id
              source: "transaksi_keuangan",
              approval_status: "approved",
              // Optional fields
              payment_type: item.paymentType,
              service_category: item.kategori,
              service_type: item.jenisLayanan,
              account_name: cashLine.account_name,
              keterangan: journalData.memo,
              notes: journalData.memo,
              bukti: uploadedBuktiUrl || null,
              ocr_data: ocrAppliedData
                ? {
                    extractedText: ocrAppliedData.extractedText,
                    items: ocrAppliedData.items,
                    appliedFields: ocrAppliedData.appliedFields,
                  }
                : null,
            } as any);
          }
        }

        // Step 6b: Handle Pengeluaran - KAS → cash_disbursement, BANK → journal_entries
        const isPengeluaran =
          item.jenisTransaksi === "Pengeluaran Kas" ||
          item.jenisTransaksi === "Pengeluaran" ||
          item.jenisTransaksi?.toLowerCase().includes("pengeluaran") ||
          item.jenisTransaksi?.toLowerCase().includes("expense") ||
          item.jenisTransaksi?.toLowerCase().includes("beban");

        if (isPengeluaran) {
          // === ROUTING FINAL PENGELUARAN (SIMPLIFIED) ===
          const normalizedPayment = item.paymentType?.toLowerCase();
          const txDate = new Date(item.tanggal || new Date());
          
          const selectedExpenseAccount = mainDebitLine?.account_code || item.selectedExpenseAccount || "6-1100";
          
          console.log("🔍 PENGELUARAN DEBUG (CART):", {
            paymentType: item.paymentType,
            normalizedPayment,
            willUseCashDisbursement: normalizedPayment === "kas",
            willUseJournalEntries: normalizedPayment === "bank",
          });
          
          const {
            data: { user },
          } = await supabase.auth.getUser();

          // Resolve COA IDs for cash disbursement
          const selectedKasCode = mainCreditLine?.account_code;
          
          // Get expense account COA first
          const { data: coaExpense } = await supabase
            .from("chart_of_accounts")
            .select("id, account_code, account_name, account_type")
            .eq("account_code", selectedExpenseAccount)
            .single();
          
          // Get cash account COA only if Kas payment method
          let coaCash = null;
          if (normalizedPayment === "kas") {
            if (!selectedKasCode) {
              throw new Error("Silakan pilih akun Kas yang spesifik (Kas Besar/Kas Kecil). Tidak boleh menggunakan akun default.");
            }
            
            const { data: cashData } = await supabase
              .from("chart_of_accounts")
              .select("id, account_code, account_name, account_type")
              .eq("account_code", selectedKasCode)
              .single();
            
            coaCash = cashData;
          }
          
          // =======================
          // PENGELUARAN KAS
          // =======================
          if (normalizedPayment === "kas") {
            // 🔒 VALIDASI SEBELUM INSERT (WAJIB)
            const selectedKasAccountId = coaCash?.id;
            const kasAmount = Number(item.nominal);

            if (!selectedKasAccountId) {
              throw new Error("Akun Kas wajib dipilih sebelum menyimpan transaksi kas");
            }

            if (!kasAmount || kasAmount <= 0) {
              throw new Error("Jumlah kas tidak valid");
            }

            // 🧪 DEBUG WAJIB
            console.log("KAS PAYLOAD", {
              transaction_date: txDate,
              amount: kasAmount,
              selectedKasAccountId,
              userId: user?.id,
            });

            // CASH PENGELUARAN → cash_disbursement
            console.log("💰 CASH PENGELUARAN: Inserting to cash_disbursement...");
            console.log("📋 PAYLOAD cash_disbursement:", {
              transaction_date: txDate,
              payee_name: item.namaPengeluaran || item.namaKaryawanPengeluaran || item.supplier || item.customer || "Pengeluaran Kas",
              payment_method: "Tunai",
              amount: kasAmount,
              category: item.kategori,
            });
            
            const { data: insertedData, error: cashDisbursementError } = await supabase
              .from("cash_disbursement")
              .insert({
                transaction_date: txDate,
                payee_name: item.namaPengeluaran || item.namaKaryawanPengeluaran || item.supplier || item.customer || "Pengeluaran Kas",
                description: item.description || journalData.memo,
                category: item.kategori,
                amount: kasAmount,
                // 🔒 KAS ONLY - TIDAK ADA BANK
                payment_method: "Tunai",
                coa_cash_id: coaCash?.id || null,
                coa_expense_id: coaExpense?.id || null,
                cash_account_id: coaCash?.id || null,
                account_code: coaExpense?.account_code?.toString().slice(0, 20) || selectedExpenseAccount,
                account_name: coaExpense?.account_name?.toString().slice(0, 50) || mainDebitLine?.account_name || "Beban",
                // Mapping for journal entries trigger
                debit_account_code: coaExpense?.account_code?.toString() || selectedExpenseAccount,
                debit_account_name: coaExpense?.account_name?.toString() || mainDebitLine?.account_name || "Beban",
                credit_account_code: coaCash?.account_code?.toString() || selectedKasAccount,
                credit_account_name: coaCash?.account_name?.toString() || "Kas",
                transaction_type: "Pengeluaran",
                document_number: null,
                notes: item.description,
                created_by: user?.id,
                approval_status: "waiting_approval",
                bukti: uploadedBuktiUrl || null,
                ocr_data: ocrAppliedData
                  ? {
                      extractedText: ocrAppliedData.extractedText,
                      items: ocrAppliedData.items,
                      appliedFields: ocrAppliedData.appliedFields,
                    }
                  : null,
              })
              .select();

            if (cashDisbursementError) {
              throw new Error(`Cash Disbursement: ${cashDisbursementError.message}`);
            }

            // Update document_number with ID after insert
            if (insertedData?.[0]?.id) {
              const docNumber = insertedData[0].id.substring(0, 8);
              await supabase
                .from("cash_disbursement")
                .update({ document_number: docNumber })
                .eq("id", insertedData[0].id);
            }

            console.log("✅ Cash disbursement saved successfully:", insertedData);
            
          // =======================
          // PENGELUARAN BANK → cash_disbursement (with approval) → trigger ke journal_entries
          // =======================
          } else if (normalizedPayment === "bank") {
            const selectedBankCode = item.selectedBank?.split(" — ")[0] || null;
            if (!selectedBankCode) {
              throw new Error("Rekening bank wajib dipilih untuk pembayaran Bank");
            }
            
            // Get bank account COA
            const { data: coaBank } = await supabase
              .from("chart_of_accounts")
              .select("id, account_code, account_name, account_type")
              .eq("account_code", selectedBankCode)
              .single();
            
            if (!coaBank) {
              throw new Error(`Bank account tidak ditemukan untuk kode: ${selectedBankCode}`);
            }
            
            if (!coaExpense) {
              throw new Error(`Expense account tidak ditemukan untuk kode: ${selectedExpenseAccount}`);
            }
            
            console.log("🏦 BANK PENGELUARAN: Inserting to cash_disbursement...");
            console.log("📋 COA Expense:", coaExpense);
            console.log("📋 COA Bank:", coaBank);
            console.log("📋 selectedBankCode:", selectedBankCode);
            console.log("📋 coaBank.account_code:", coaBank.account_code);
            console.log("📋 coaBank.account_code.toString():", coaBank.account_code.toString());
            console.log("📋 FULL PAYLOAD:", {
              transaction_date: txDate,
              debit_account_code: coaExpense.account_code.toString(),
              debit_account_name: coaExpense.account_name.toString(),
              credit_account_code: coaBank.account_code.toString(),
              credit_account_name: coaBank.account_name.toString(),
              bank_account: coaBank.account_code.toString(),
              amount: item.nominal,
            });
            
            // BANK PENGELUARAN → cash_disbursement dengan status waiting_approval
            const { data: insertedData, error: bankDisbursementError } = await supabase
              .from("cash_disbursement")
              .insert({
                transaction_date: txDate,
                payee_name: item.namaPengeluaran || item.namaKaryawanPengeluaran || item.supplier || item.customer || "Pengeluaran Bank",
                description: item.description || journalData.memo,
                category: item.kategori,
                amount: Number(item.nominal),
                payment_method: "Transfer Bank",
                coa_cash_id: coaBank.id,
                coa_expense_id: coaExpense.id,
                bank_account_id: coaBank.id,
                bank_account: coaBank.account_code.toString(),
                account_code: coaExpense.account_code.toString().slice(0, 20),
                account_name: coaExpense.account_name.toString().slice(0, 50),
                // Mapping for journal entries trigger
                debit_account_code: coaExpense.account_code.toString(),
                debit_account_name: coaExpense.account_name.toString(),
                credit_account_code: coaBank.account_code.toString(),
                credit_account_name: coaBank.account_name.toString(),
                transaction_type: "Pengeluaran",
                document_number: null,
                notes: item.description,
                created_by: user?.id,
                approval_status: "waiting_approval",
                bukti: uploadedBuktiUrl || null,
                ocr_data: ocrAppliedData
                  ? {
                      extractedText: ocrAppliedData.extractedText,
                      items: ocrAppliedData.items,
                      appliedFields: ocrAppliedData.appliedFields,
                    }
                  : null,
              })
              .select();
            
            if (bankDisbursementError) {
              throw new Error(`Bank Cash Disbursement: ${bankDisbursementError.message}`);
            }

            // Update document_number with ID after insert
            if (insertedData?.[0]?.id) {
              const docNumber = insertedData[0].id.substring(0, 8);
              await supabase
                .from("cash_disbursement")
                .update({ document_number: docNumber })
                .eq("id", insertedData[0].id);
            }
            
            console.log("✅ Bank cash disbursement saved successfully (will trigger to journal_entries):", insertedData);
          }
        }

        // Step 6c: Handle Pendapatan - KAS → cash_and_bank_receipts, BANK → journal_entries
        const isPendapatan =
          item.jenisTransaksi === "Penerimaan Kas" ||
          item.jenisTransaksi === "Pendapatan" ||
          item.jenisTransaksi?.toLowerCase().includes("pendapatan") ||
          item.jenisTransaksi?.toLowerCase().includes("penerimaan") ||
          item.jenisTransaksi?.toLowerCase().includes("revenue");

        if (isPendapatan) {
          // 🔒 HANYA BERDASARKAN paymentType - TIDAK dari selectedBank
          const rawPaymentType = item.paymentType || "";
          const normalizedPaymentType = rawPaymentType.toLowerCase();
          const txDate = new Date(item.tanggal || new Date());
          
          const selectedRevenueAccount = mainCreditLine?.account_code || item.selectedRevenueAccount || "4-1100";
          // selectedBankAccountCode HANYA digunakan jika paymentType === "bank"
          const selectedBankAccountCode = (normalizedPaymentType === "bank" || normalizedPaymentType === "transfer") 
            ? (item.selectedBank || item.bank_account || null) 
            : null;
          
          console.log("🔍 PENDAPATAN DEBUG:", {
            rawPaymentType,
            normalizedPaymentType,
            selectedBankAccountCode,
            willUseCashReceipt: normalizedPaymentType === "kas" || normalizedPaymentType === "cash",
          });
          
          const {
            data: { user },
          } = await supabase.auth.getUser();

          const debitLine = journalData.lines.find((l) => l.dc === "D");
          const creditLine = journalData.lines.find((l) => l.dc === "C");
          
          if (normalizedPaymentType === "kas" || normalizedPaymentType === "cash") {
            // CASH PENDAPATAN → cash_and_bank_receipts (kas masuk)
            console.log("💰 CASH PENDAPATAN: Inserting to cash_and_bank_receipts...");
            
            const { error: cashReceiptError } = await supabase
              .from("cash_and_bank_receipts")
              .insert({
                transaction_date: journalData.tanggal,
                transaction_type: "Penerimaan",
                source_destination: item.sumberPenerimaan || item.customer || item.supplier || "Penerimaan Kas",
                amount: normalizedInput.nominal,
                payment_method: "Tunai",
                coa_cash_id: debitLine?.account_code || "",
                coa_contra_code: creditLine?.account_code || "4-1100",
                debit_account_code: debitLine?.account_code || "",
                debit_account_name: debitLine?.account_name || "",
                credit_account_code: creditLine?.account_code || "",
                credit_account_name: creditLine?.account_name || "",
                account_code: debitLine?.account_code || "",
                account_name: debitLine?.account_name || "",
                account_type_credit: item.selectedCreditAccountType || "",
                account_name_credit: item.selectedCreditAccountName || "",
                description: journalData.memo,
                reference_number: `PKM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                journal_ref: journalRef,
                approval_status: "approved",
                bukti: uploadedBuktiUrl || null,
                ocr_data: ocrAppliedData
                  ? {
                      extractedText: ocrAppliedData.extractedText,
                      items: ocrAppliedData.items,
                      appliedFields: ocrAppliedData.appliedFields,
                    }
                  : null,
                created_by: user?.id || null,
              });

            if (cashReceiptError) {
              console.error("Error saving to cash_and_bank_receipts:", cashReceiptError);
              throw new Error(`Cash Receipt: ${cashReceiptError.message}`);
            }
            console.log("✅ Cash receipt saved successfully");
            
          } else if (normalizedPaymentType === "bank") {
            // 🔒 BANK PENDAPATAN → WAJIB APPROVAL (masuk ke transaction_cart dulu)
            if (!selectedBankAccountCode) {
              throw new Error("Rekening bank wajib dipilih untuk pembayaran Bank");
            }
            console.log("🏦 BANK PENDAPATAN: Inserting to transaction_cart (waiting_approval)...");
            
            // 🔒 BANK PENDAPATAN → transaction_cart dengan status waiting_approval
            const { error: cartError } = await supabase.from("transaction_cart").insert({
              user_id: user?.id,
              jenis_transaksi: item.jenisTransaksi,
              payment_type: "bank",
              kategori: item.kategori || item.sumberPenerimaan || null,
              sumber_penerimaan: item.sumberPenerimaan || null,
              nominal: item.nominal,
              tanggal: txDate,
              description: item.description || journalData.memo || null,
              selected_bank: selectedBankAccountCode,
              account_code: mainDebitLine?.account_code || selectedBankAccountCode,
              account_name: mainDebitLine?.account_name || "Bank",
              account_type: mainDebitLine?.account_type || "Asset",
              credit_account_code: selectedRevenueAccount || null,
              credit_account_name: mainCreditLine?.account_name || "Pendapatan",
              credit_account_type: mainCreditLine?.account_type || "Revenue",
              revenue_account: selectedRevenueAccount || null,
              bukti: uploadedBuktiUrl || null,
              status: "pending",
              approval_status: "waiting_approval", // 🔒 WAJIB APPROVAL
              customer: item.customer || null,
              supplier: item.supplier || null,
            });
            
            if (cartError) {
              throw new Error(`Bank Pendapatan Cart: ${cartError.message}`);
            }
            
            console.log("✅ Bank pendapatan saved to transaction_cart (waiting_approval)");
          }
        }

        // Legacy tracking for cash_and_bank_receipts (only if not already handled above)
        if (!isPendapatan && item.jenisTransaksi === "Penerimaan Kas") {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          const debitLine = journalData.lines.find((l) => l.dc === "D");
          const creditLine = journalData.lines.find((l) => l.dc === "C");
          // 🔒 HANYA BERDASARKAN paymentType
          const rawPaymentType = item.paymentType || "";
          const normalizedPaymentType = rawPaymentType.toLowerCase();
          const selectedBankAccountCode = (normalizedPaymentType === "bank" || normalizedPaymentType === "transfer") 
            ? (item.selectedBank || item.bank_account || null) 
            : null;

          const { error: cashReceiptError } = await supabase
            .from("cash_and_bank_receipts")
            .insert({
              transaction_date: journalData.tanggal,
              transaction_type: "Penerimaan",
              source_destination:
                item.sumberPenerimaan ||
                item.customer ||
                item.supplier ||
                "Penerimaan",
              amount: normalizedInput.nominal,
              payment_method: (normalizedPaymentType === "bank" || normalizedPaymentType === "transfer") ? "Bank" : "Tunai",
              coa_cash_id: (normalizedPaymentType === "bank" || normalizedPaymentType === "transfer") ? selectedBankAccountCode : (debitLine?.account_code || ""),
              coa_contra_code: creditLine?.account_code || "4-1100",
              account_code: debitLine?.account_code || "",
              account_name: debitLine?.account_name || "",
              account_type_credit: item.selectedCreditAccountType || "",
              account_name_credit: item.selectedCreditAccountName || "",
              description: journalData.memo,
              reference_number: `PKM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              journal_ref: journalRef,
              approval_status: "approved",
              bukti: uploadedBuktiUrl || null,
              ocr_data: ocrAppliedData
                ? {
                    extractedText: ocrAppliedData.extractedText,
                    items: ocrAppliedData.items,
                    appliedFields: ocrAppliedData.appliedFields,
                  }
                : null,
              created_by: user?.id || null,
            });

          if (cashReceiptError) {
            console.error(
              "Error saving to cash_and_bank_receipts:",
              cashReceiptError,
            );
          } else {
            console.log("Cash and bank receipt saved successfully");
          }
        }

        // Step 7: Create Sales Transaction if applicable
        if (
          item.jenisTransaksi === "Penjualan" ||
          item.jenisTransaksi === "Penjualan Jasa"
        ) {
          const unitPrice = Number(item.hargaJual || item.nominal) || 0;
          const quantity = Number(item.quantity) || 1;
          const subtotal = unitPrice * quantity;
          const taxPercentage = 11;
          const taxAmount = subtotal * (taxPercentage / 100);
          const totalAmount = subtotal + taxAmount;

          if (item.jenisTransaksi === "Penjualan") {
            const { data: stockData } = await supabase
              .from("stock")
              .select("quantity, cost_per_unit")
              .eq("item_name", item.itemName)
              .eq("description", item.description)
              .maybeSingle();

            await supabase.from("sales_transactions").insert({
              transaction_date: item.tanggal,
              transaction_type: "Barang",
              item_name: item.itemName,
              description: item.description,
              stock_before: stockData?.quantity || 0,
              quantity: quantity,
              stock_after: (stockData?.quantity || 0) - quantity,
              unit_price: unitPrice,
              subtotal: subtotal,
              tax_percentage: taxPercentage,
              tax_amount: taxAmount,
              total_amount: totalAmount,
              payment_method: item.paymentType === "cash" ? "Tunai" : "Piutang",
              customer_name: item.customer || "",
              coa_cash_id: mainDebitLine?.account_code || "",
              coa_revenue_code: mainCreditLine?.account_code || "",
              coa_cogs_code: "5-1100",
              coa_inventory_code: item.coaSelected || "",
              coa_tax_code: taxAmount > 0 ? "2-1250" : null,
              notes: item.description,
              journal_ref: journalRef,
              approval_status: "approved", // Set approval status to approved
              bukti: uploadedBuktiUrl || null, // Add bukti URL
              ocr_data: ocrAppliedData
                ? {
                    extractedText: ocrAppliedData.extractedText,
                    items: ocrAppliedData.items,
                    appliedFields: ocrAppliedData.appliedFields,
                  }
                : null,
            });

            // Stock quantity is automatically updated by database trigger
          } else if (item.jenisTransaksi === "Penjualan Jasa") {
            await supabase.from("sales_transactions").insert({
              transaction_date: item.tanggal,
              transaction_type: "Jasa",
              item_name: `${item.kategori} - ${item.jenisLayanan}`,
              description: item.description,
              stock_before: null,
              quantity: quantity,
              stock_after: null,
              unit_price: unitPrice,
              subtotal: subtotal,
              tax_percentage: taxPercentage,
              tax_amount: taxAmount,
              total_amount: totalAmount,
              payment_method: item.paymentType === "cash" ? "Tunai" : "Piutang",
              customer_name: item.customer || "",
              coa_cash_id: mainDebitLine?.account_code || "",
              coa_revenue_code: mainCreditLine?.account_code || "",
              coa_cogs_code: null,
              coa_inventory_code: null,
              coa_tax_code: taxAmount > 0 ? "2-1250" : null,
              notes: item.description,
              journal_ref: journalRef,
              approval_status: "approved", // Set approval status to approved
              bukti: uploadedBuktiUrl || null, // Add bukti URL
              ocr_data: ocrAppliedData
                ? {
                    extractedText: ocrAppliedData.extractedText,
                    items: ocrAppliedData.items,
                    appliedFields: ocrAppliedData.appliedFields,
                  }
                : null,
            });
          }
        }

        // Step 8: Create Loan if applicable
        if (item.jenisTransaksi === "Pinjaman Masuk") {
          console.log("💰 Creating loan entry...");

          // Get borrower_id from borrower name
          let borrowerId = null;
          if (item.borrowerName) {
            const { data: borrowerData, error: borrowerError } = await supabase
              .from("borrowers")
              .select("id")
              .eq("borrower_name", item.borrowerName)
              .single();

            if (borrowerError) {
              console.error("Error fetching borrower:", borrowerError);
            } else {
              borrowerId = borrowerData?.id;
              console.log("Borrower ID found:", borrowerId);
            }
          }

          const loanData = {
            loan_date: item.tanggal,
            borrower_id: borrowerId,
            lender_name:
              item.borrowerName || item.supplier || item.customer || "Unknown",
            lender_type: item.loanType || "Lainnya",
            principal_amount: Number(item.nominal),
            interest_rate: Number(item.interestRate) || 0,
            loan_term_months: Number(item.loanTermMonths) || 12,
            maturity_date: item.maturityDate || null,
            payment_schedule: item.paymentSchedule || "Jatuh Tempo",
            late_fee_percentage: Number(item.lateFeePercentage) || 0.1,
            tax_type: item.taxType || null,
            tax_percentage: Number(item.taxPercentage) || 0,
            tax_amount: Number(item.taxAmount) || 0,
            status: "Aktif",
            coa_cash_id: mainDebitLine?.account_code || "",
            coa_loan_code: mainCreditLine?.account_code || "2-2000",
            coa_interest_code: "6-1200",
            purpose: item.description || "Pinjaman",
            notes: item.description,
            journal_ref: journalRef,
          };

          console.log("📝 Loan data to insert:", loanData);

          const { data: loanResult, error: loanError } = await supabase
            .from("loans")
            .insert(loanData)
            .select();

          if (loanError) {
            console.error("Error creating loan:", loanError);
            throw new Error(`Failed to create loan: ${loanError.message}`);
          } else {
            console.log("Loan created successfully:", loanResult);

            // Create installment schedule if available
            if (
              item.installmentSchedule &&
              item.installmentSchedule.length > 0 &&
              loanResult[0]
            ) {
              const installments = item.installmentSchedule.map(
                (inst: any) => ({
                  loan_id: loanResult[0].id,
                  installment_number: inst.installment,
                  due_date: inst.dueDate,
                  principal_amount: inst.principalAmount,
                  interest_amount: inst.interestAmount,
                  total_amount: inst.totalPayment,
                  remaining_balance: inst.remainingBalance,
                  late_fee_percentage: Number(item.lateFeePercentage) || 0.1,
                  tax_type: item.taxType || null,
                  tax_percentage: Number(item.taxPercentage) || 0,
                  tax_amount: Number(item.taxAmount) || 0,
                  status: "Belum Bayar",
                }),
              );

              const { error: installmentError } = await supabase
                .from("loan_installments")
                .insert(installments);

              if (installmentError) {
                console.error(
                  "❌ Error creating installments:",
                  installmentError,
                );
              } else {
                console.log("Installments created successfully");
              }
            }
          }
        }

        // Step 8b: Process Loan Payment if applicable
        if (item.jenisTransaksi === "Pembayaran Pinjaman") {
          // Get active loans to find the loan being paid
          const { data: activeLoans } = await supabase
            .from("loans")
            .select("*")
            .eq("status", "Aktif")
            .order("loan_date", { ascending: true });

          if (activeLoans && activeLoans.length > 0) {
            // Use the first active loan or match by borrower name if available
            let targetLoan = activeLoans[0];
            if (item.borrowerName) {
              const matchedLoan = activeLoans.find(
                (l) => l.lender_name === item.borrowerName,
              );
              if (matchedLoan) targetLoan = matchedLoan;
            }

            // Call the add_loan_payment function
            const principalPmt = Number(item.principalAmount) || 0;
            const interestPmt = Number(item.interestAmount) || 0;
            const lateFeePmt = Number(item.lateFee) || 0;
            const daysLateNum = Number(item.daysLate) || 0;
            const lateFeePerc = Number(item.lateFeePercentage) || 0.1;

            const { error: paymentError } = await supabase.rpc(
              "add_loan_payment",
              {
                p_loan_id: targetLoan.id,
                p_payment_date: item.actualPaymentDate || item.tanggal,
                p_principal_amount: principalPmt,
                p_interest_amount: interestPmt + lateFeePmt, // Include late fee in interest
                p_payment_method:
                  item.paymentType === "cash" ? "Tunai" : "Bank",
                p_bank_name: item.selectedBank || null,
                p_reference_number: journalRef,
                p_notes: item.description || null,
              },
            );

            if (paymentError) {
              console.error("Error adding loan payment:", paymentError);
            } else {
              // Update loan installment status - handle overpayment
              const { data: unpaidInstallments } = await supabase
                .from("loan_installments")
                .select("*")
                .eq("loan_id", targetLoan.id)
                .eq("status", "Belum Bayar")
                .order("installment_number", { ascending: true });

              if (unpaidInstallments && unpaidInstallments.length > 0) {
                // Use the nominal amount entered by user (not just principal + interest)
                let totalPaymentAmount =
                  Number(item.nominal) ||
                  principalPmt +
                    interestPmt +
                    lateFeePmt +
                    Number(item.taxAmount);
                let remainingPayment = totalPaymentAmount;

                console.log("💰 Processing payment:", {
                  totalPaymentAmount,
                  unpaidInstallmentsCount: unpaidInstallments.length,
                  firstInstallment: unpaidInstallments[0],
                });

                // Process each unpaid installment
                for (const installment of unpaidInstallments) {
                  if (remainingPayment <= 0) break;

                  const installmentTotal = installment.total_amount;
                  const currentPaidAmount = installment.paid_amount || 0;
                  const remainingInstallmentAmount =
                    installmentTotal - currentPaidAmount;

                  console.log(`📋 Cicilan ${installment.installment_number}:`, {
                    total: installmentTotal,
                    alreadyPaid: currentPaidAmount,
                    remaining: remainingInstallmentAmount,
                    paymentAvailable: remainingPayment,
                  });

                  if (remainingPayment >= remainingInstallmentAmount) {
                    // Full payment for this installment
                    const newPaidAmount =
                      currentPaidAmount + remainingInstallmentAmount;

                    await supabase
                      .from("loan_installments")
                      .update({
                        actual_payment_date:
                          item.actualPaymentDate || item.tanggal,
                        days_late: daysLateNum,
                        late_fee:
                          installment.installment_number ===
                          unpaidInstallments[0].installment_number
                            ? lateFeePmt
                            : 0,
                        late_fee_percentage: lateFeePerc,
                        tax_type: item.taxType || null,
                        tax_percentage: Number(item.taxPercentage) || 0,
                        tax_amount:
                          installment.installment_number ===
                          unpaidInstallments[0].installment_number
                            ? Number(item.taxAmount)
                            : 0,
                        paid_amount: newPaidAmount,
                        payment_date: item.actualPaymentDate || item.tanggal,
                        status: "Lunas",
                      })
                      .eq("id", installment.id);

                    console.log(
                      `✅ Cicilan ${installment.installment_number} LUNAS - Terbayar: ${newPaidAmount}`,
                    );
                    remainingPayment -= remainingInstallmentAmount;
                  } else {
                    // Partial payment for this installment
                    const newPaidAmount = currentPaidAmount + remainingPayment;

                    await supabase
                      .from("loan_installments")
                      .update({
                        actual_payment_date:
                          item.actualPaymentDate || item.tanggal,
                        days_late: daysLateNum,
                        late_fee:
                          installment.installment_number ===
                          unpaidInstallments[0].installment_number
                            ? lateFeePmt
                            : 0,
                        late_fee_percentage: lateFeePerc,
                        tax_type: item.taxType || null,
                        tax_percentage: Number(item.taxPercentage) || 0,
                        tax_amount:
                          installment.installment_number ===
                          unpaidInstallments[0].installment_number
                            ? Number(item.taxAmount)
                            : 0,
                        paid_amount: newPaidAmount,
                        payment_date: item.actualPaymentDate || item.tanggal,
                        status: "Sebagian",
                      })
                      .eq("id", installment.id);

                    console.log(
                      `🔵 Cicilan ${installment.installment_number} SEBAGIAN - Terbayar: ${newPaidAmount}`,
                    );
                    remainingPayment = 0;
                  }
                }

                console.log(
                  "✅ Payment processing complete. Remaining:",
                  remainingPayment,
                );
              }

              // Check if all installments are paid, then update loan status
              const { data: allInstallments } = await supabase
                .from("loan_installments")
                .select("*")
                .eq("loan_id", targetLoan.id);

              if (allInstallments) {
                const allPaid = allInstallments.every(
                  (inst) => inst.status === "Lunas",
                );
                if (allPaid) {
                  await supabase
                    .from("loans")
                    .update({ status: "Lunas" })
                    .eq("id", targetLoan.id);
                }
              }
            }
          }
        }

        // Step 9: Create Purchase Transaction if applicable
        if (item.jenisTransaksi === "Pembelian Barang") {
          const unitPrice = Number(item.hargaBeli || item.nominal) || 0;
          const quantity = Number(item.quantity) || 1;
          const subtotal = unitPrice * quantity;
          const ppnPercentage = Number(item.ppnPercentage) || 0;
          const ppnAmount = Number(item.ppnAmount) || 0;
          const totalAmount = subtotal + ppnAmount;

          const purchaseData: any = {
            transaction_date: item.tanggal,
            transaction_type: "Barang",
            item_name:
              item.itemName || `${item.kategori} - ${item.jenisLayanan}`,
            brand: item.description || null,
            supplier_name: item.supplier || "",
            quantity: quantity,
            unit_price: unitPrice,
            subtotal: subtotal,
            ppn_percentage: ppnPercentage,
            ppn_amount: ppnAmount,
            total_amount: totalAmount,
            payment_method: item.paymentType === "cash" ? "Tunai" : "Hutang",
            coa_cash_id:
              item.paymentType === "cash" && mainCreditLine?.account_code
                ? mainCreditLine.account_code
                : null,
            coa_expense_id: mainDebitLine?.account_code || null,
            coa_inventory_code: item.coaSelected || null,
            coa_payable_code:
              item.paymentType !== "cash" ? mainCreditLine?.account_code : null,
            description: item.description || null,
            notes: item.description || null,
            journal_ref: journalRef,
            approval_status: needsApproval ? "waiting_approval" : "approved",
            bukti: uploadedBuktiUrl || null,
            ocr_data: ocrAppliedData
              ? {
                  extractedText: ocrAppliedData.extractedText,
                  items: ocrAppliedData.items,
                  appliedFields: ocrAppliedData.appliedFields,
                }
              : null,
            created_by: user?.id,
            approved_by: null,
          };

          console.log("📦 Purchase Transaction Data:", purchaseData);

          const { data: purchaseData_result, error: purchaseError } =
            await supabase.from("purchase_transactions").insert(purchaseData);

          if (purchaseError) {
            console.error("Purchase Transaction Error:", purchaseError);
            throw new Error(`Purchase Transaction: ${purchaseError.message}`);
          }
          console.log("Purchase Transaction saved:", purchaseData_result);
        }

        // Send Pembelian Jasa to purchase_transactions table
        if (item.jenisTransaksi === "Pembelian Jasa") {
          const unitPrice = Number(item.hargaBeli || item.nominal) || 0;
          const quantity = Number(item.quantity) || 1;
          const subtotal = unitPrice * quantity;
          const ppnPercentage = Number(item.ppnPercentage) || 0;
          const ppnAmount = Number(item.ppnAmount) || 0;
          const totalAmount = subtotal + ppnAmount;

          const purchaseData: any = {
            transaction_date: item.tanggal,
            transaction_type: "Jasa",
            item_name:
              item.itemName || `${item.kategori} - ${item.jenisLayanan}`,
            brand: item.description || null,
            supplier_name: item.supplier || "",
            quantity: quantity,
            unit_price: unitPrice,
            subtotal: subtotal,
            ppn_percentage: ppnPercentage,
            ppn_amount: ppnAmount,
            total_amount: totalAmount,
            payment_method: item.paymentType === "cash" ? "Tunai" : "Hutang",
            coa_cash_id:
              item.paymentType === "cash" && mainCreditLine?.account_code
                ? mainCreditLine.account_code
                : null,
            coa_expense_id: mainDebitLine?.account_code || null,
            coa_inventory_code: item.coaSelected || null,
            coa_payable_code:
              item.paymentType !== "cash" ? mainCreditLine?.account_code : null,
            description: item.description || null,
            notes: item.description || null,
            journal_ref: journalRef,
            approval_status: needsApproval ? "waiting_approval" : "approved",
            bukti: uploadedBuktiUrl || null,
            ocr_data: ocrAppliedData
              ? {
                  extractedText: ocrAppliedData.extractedText,
                  items: ocrAppliedData.items,
                  appliedFields: ocrAppliedData.appliedFields,
                }
              : null,
            created_by: user?.id,
            approved_by: null,
          };

          console.log("📦 Purchase Transaction Data (Jasa):", purchaseData);

          const { data: purchaseData_result, error: purchaseError } =
            await supabase.from("purchase_transactions").insert(purchaseData);

          if (purchaseError) {
            console.error("Purchase Transaction Error:", purchaseError);
            throw new Error(`Purchase Transaction: ${purchaseError.message}`);
          }
          console.log(
            "✅ Purchase Transaction saved (Jasa):",
            purchaseData_result,
          );
        }

        const itemEndTime = Date.now();
        const itemDuration = ((itemEndTime - itemStartTime) / 1000).toFixed(2);
        console.log(
          `✅ Item ${i + 1}/${selectedItems.length} completed in ${itemDuration}s\n`,
        );
      }

      const totalEndTime = Date.now();
      const totalDuration = ((totalEndTime - startTime) / 1000).toFixed(2);
      console.log(
        `\n🎉 Batch checkout completed! Total time: ${totalDuration}s for ${selectedItems.length} items`,
      );
      console.log(
        `⏱️ Average time per item: ${(parseFloat(totalDuration) / selectedItems.length).toFixed(2)}s`,
      );

      // Refresh loan data if payment was made
      const hasLoanPayment = cart.some(
        (item) => item.jenisTransaksi === "Pembayaran Pinjaman",
      );
      if (hasLoanPayment && selectedBorrower) {
        // Reload loan details
        const { data: loans } = await supabase
          .from("loans")
          .select("*")
          .eq("lender_name", selectedBorrower)
          .eq("status", "Aktif")
          .order("loan_date", { ascending: false })
          .limit(1);

        if (loans && loans.length > 0) {
          const loan = loans[0];

          // Reload installment schedule
          const { data: installments } = await supabase
            .from("loan_installments")
            .select("*")
            .eq("loan_id", loan.id)
            .order("installment_number", { ascending: true });

          if (installments && installments.length > 0) {
            const schedule = installments.map((inst) => ({
              installment: inst.installment_number,
              dueDate: inst.due_date,
              principalAmount: inst.principal_amount,
              interestAmount: inst.interest_amount,
              totalPayment: inst.total_amount,
              remainingBalance: inst.remaining_balance,
              status: inst.status,
              paidAmount: inst.paid_amount || 0,
            }));
            setInstallmentSchedule(schedule);
          }
        }
      }

      // Remove only checked items from cart
      const remainingItems = cart.filter((item) => !item.selected);
      setCart(remainingItems);
      localStorage.setItem(
        "transaksi_keuangan_cart",
        JSON.stringify(remainingItems),
      );

      if (remainingItems.length === 0) {
        setShowCart(false);
      }

      // Show success message
      toast({
        title: "✅ Berhasil",
        description: "Transaksi berhasil disimpan",
      });

      // Reload transactions to show new data
      console.log("🔄 Reloading transactions...");
      const reloadStartTime = Date.now();
      await loadTransactions();
      const reloadEndTime = Date.now();
      const reloadDuration = ((reloadEndTime - reloadStartTime) / 1000).toFixed(
        2,
      );
      console.log(`✅ Transactions reloaded in ${reloadDuration}s`);
    } catch (err: any) {
      console.error("Checkout Error:", err);
      toast({
        title: "❌ Error",
        description: err.message || "Gagal menyimpan transaksi",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // Calculate summary data from approved transactions only
  const summaryData = {
    totalTransactions: transactions.length,
    totalPenerimaanKas: transactions
      .filter((t) => {
        // Only count approved transactions from cash_receipts
        if (t.approval_status !== "approved") return false;
        if (t.source === "cash_receipts") return true;
        return false;
      })
      .reduce((sum, t) => sum + parseFloat(t.nominal || 0), 0),
    totalPengeluaranKas: transactions
      .filter((t) => {
        // Only count approved transactions from cash_disbursement
        if (t.approval_status !== "approved") return false;
        if (t.source === "cash_disbursement") return true;
        return false;
      })
      .reduce((sum, t) => sum + parseFloat(t.nominal || 0), 0),
    totalPembelianBarang: transactions
      .filter((t) => {
        // Only count approved transactions from purchase_transactions with transaction_type = Barang
        if (t.approval_status !== "approved") return false;
        if (
          t.source === "purchase_transactions" &&
          t.transaction_type === "Barang"
        )
          return true;
        return false;
      })
      .reduce(
        (sum, t) => sum + parseFloat(t.total_amount || t.nominal || 0),
        0,
      ),
    totalPenjualanBarang: transactions
      .filter((t) => {
        // Only count approved transactions from sales_transactions with transaction_type = Barang
        if (t.approval_status !== "approved") return false;
        if (
          t.source === "sales_transactions" &&
          t.transaction_type === "Barang"
        )
          return true;
        return false;
      })
      .reduce(
        (sum, t) => sum + parseFloat(t.total_amount || t.nominal || 0),
        0,
      ),
    totalPembelianJasa: transactions
      .filter((t) => {
        // Only count approved transactions from purchase_transactions with transaction_type = Jasa
        if (t.approval_status !== "approved") return false;
        if (
          t.source === "purchase_transactions" &&
          t.transaction_type === "Jasa"
        )
          return true;
        return false;
      })
      .reduce(
        (sum, t) => sum + parseFloat(t.total_amount || t.nominal || 0),
        0,
      ),
    totalPenjualanJasa: transactions
      .filter((t) => {
        // Only count approved transactions from sales_transactions with transaction_type = Jasa
        if (t.approval_status !== "approved") return false;
        if (t.source === "sales_transactions" && t.transaction_type === "Jasa")
          return true;
        return false;
      })
      .reduce(
        (sum, t) => sum + parseFloat(t.total_amount || t.nominal || 0),
        0,
      ),
    waitingApproval: transactions.filter(
      (t) => t.approval_status === "waiting_approval",
    ).length,
  };

  const netAmount =
    summaryData.totalPenerimaanKas +
    summaryData.totalPenjualanBarang +
    summaryData.totalPenjualanJasa -
    (summaryData.totalPengeluaranKas +
      summaryData.totalPembelianBarang +
      summaryData.totalPembelianJasa);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const fetchCategoryItems = async (transactionType: string) => {
    const config =
      TRANSACTION_CATEGORIES[
        transactionType as keyof typeof TRANSACTION_CATEGORIES
      ];

    if (!config || !config.source) {
      console.warn(
        "No category config/source found for transaction type:",
        transactionType,
        config,
      );
      return [];
    }

    const { data, error } = await supabase
      .from(config.source)
      .select(`id, ${config.sourceLabelKey}, ${config.sourceValueKey}`);

    if (error) {
      console.error("Failed to load category items", error);
      return [];
    }

    return data || [];
  };

  useEffect(() => {
    if (jenisTransaksi) {
      fetchCategoryItems(jenisTransaksi).then(setCategoryOptions);
    } else {
      setCategoryOptions([]);
      setSelectedCategory("");
    }
  }, [jenisTransaksi]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 shadow-lg">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              className="bg-white/20 text-white hover:bg-white/30 border-white/30"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-2 bg-white/20 rounded-lg">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Transaksi Keuangan
              </h1>
              <p className="text-sm text-blue-100">
                Pencatatan Penerimaan dan Pengeluaran Kas
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {showForm && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowCart(!showCart)}
                  className="relative bg-white/20 text-white hover:bg-white/30 border-white/30"
                >
                  🛒 Keranjang
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setShowReport(true);
                    resetForm();
                  }}
                  className="bg-white/20 text-white hover:bg-white/30 border-white/30"
                >
                  ← Kembali ke Laporan
                </Button>
              </>
            )}
            {showReport && !showForm && (
              <Button
                onClick={() => {
                  setShowForm(true);
                  setShowReport(false);
                }}
                className="bg-white text-indigo-600 hover:bg-blue-50 shadow-md"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Transaksi
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* REPORT VIEW */}
        {showReport && !showForm && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="space-y-3">
              {/* Row 1: Total Transaksi, Net, Waiting Approval */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card
                  className="border-none shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg transition-all cursor-pointer hover:scale-[1.01]"
                  onClick={() => {
                    setFilterJenis("");
                    setFilterStatus("");
                    setFilterSource("");
                    setSearchQuery("");
                    setFilterDateFrom("");
                    setFilterDateTo("");
                  }}
                >
                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-white/90 text-xs font-medium">
                        Total Transaksi
                      </CardDescription>
                      <Receipt className="h-5 w-5 text-white/80" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                      {summaryData.totalTransactions}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center text-xs text-white/90">
                      <DollarSign className="mr-1 h-3 w-3" />
                      Total transaksi kas
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`border-none shadow-md text-white hover:shadow-lg transition-all cursor-pointer hover:scale-[1.01] ${
                    netAmount >= 0
                      ? "bg-gradient-to-br from-purple-500 to-purple-600"
                      : "bg-gradient-to-br from-red-500 to-red-600"
                  }`}
                  onClick={() => {
                    setFilterJenis("");
                    setFilterStatus("");
                    setFilterSource("");
                    setSearchQuery("");
                    setFilterDateFrom("");
                    setFilterDateTo("");
                  }}
                >
                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-white/90 text-xs font-medium">
                        Net / Saldo Bersih
                      </CardDescription>
                      <DollarSign className="h-5 w-5 text-white/80" />
                    </div>
                    <CardTitle className="text-xl font-bold">
                      {
                        formatCurrency(netAmount)
                          .replace("Rp", "")
                          .trim()
                          .split(",")[0]
                      }
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center text-xs text-white/90">
                      <DollarSign className="mr-1 h-3 w-3" />
                      {netAmount >= 0 ? "Surplus" : "Defisit"}
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border-none shadow-md bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:shadow-lg transition-all cursor-pointer hover:scale-[1.01]"
                  onClick={() => {
                    setFilterStatus("waiting_approval");
                    setFilterJenis("");
                  }}
                >
                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-white/90 text-xs font-medium">
                        Waiting Approval
                      </CardDescription>
                      <Clock className="h-5 w-5 text-white/80" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                      {summaryData.waitingApproval}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center text-xs text-white/90">
                      <Clock className="mr-1 h-3 w-3" />
                      Menunggu persetujuan
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Income Cards (Penerimaan) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card
                  className="border-none shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:shadow-lg transition-all cursor-pointer hover:scale-[1.01]"
                  onClick={() => {
                    setFilterJenis("Penerimaan Kas");
                    setFilterStatus("");
                  }}
                >
                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-white/90 text-xs font-medium">
                        Penerimaan Kas
                      </CardDescription>
                      <TrendingUp className="h-5 w-5 text-white/80" />
                    </div>
                    <CardTitle className="text-xl font-bold">
                      {
                        formatCurrency(summaryData.totalPenerimaanKas)
                          .replace("Rp", "")
                          .trim()
                          .split(",")[0]
                      }
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center text-xs text-white/90">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Kas masuk
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border-none shadow-md bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-lg transition-all cursor-pointer hover:scale-[1.01]"
                  onClick={() => {
                    setFilterJenis("Penjualan");
                    setFilterStatus("");
                  }}
                >
                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-white/90 text-xs font-medium">
                        Penjualan
                      </CardDescription>
                      <TrendingUp className="h-5 w-5 text-white/80" />
                    </div>
                    <CardTitle className="text-xl font-bold">
                      {
                        formatCurrency(summaryData.totalPenjualanBarang)
                          .replace("Rp", "")
                          .trim()
                          .split(",")[0]
                      }
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center text-xs text-white/90">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Total nominal
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border-none shadow-md bg-gradient-to-br from-teal-500 to-teal-600 text-white hover:shadow-lg transition-all cursor-pointer hover:scale-[1.01]"
                  onClick={() => {
                    setFilterJenis("Penjualan Jasa");
                    setFilterStatus("");
                  }}
                >
                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-white/90 text-xs font-medium">
                        Penjualan Jasa
                      </CardDescription>
                      <TrendingUp className="h-5 w-5 text-white/80" />
                    </div>
                    <CardTitle className="text-xl font-bold">
                      {
                        formatCurrency(summaryData.totalPenjualanJasa)
                          .replace("Rp", "")
                          .trim()
                          .split(",")[0]
                      }
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center text-xs text-white/90">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Total nominal
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 3: Expense Cards (Pengeluaran) - Grouped Together */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card
                  className="border-none shadow-md bg-gradient-to-br from-pink-500 to-pink-600 text-white hover:shadow-lg transition-all cursor-pointer hover:scale-[1.01]"
                  onClick={() => {
                    setFilterJenis("Pengeluaran Kas");
                    setFilterStatus("");
                  }}
                >
                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-white/90 text-xs font-medium">
                        Pengeluaran Kas
                      </CardDescription>
                      <TrendingDown className="h-5 w-5 text-white/80" />
                    </div>
                    <CardTitle className="text-xl font-bold">
                      {
                        formatCurrency(summaryData.totalPengeluaranKas)
                          .replace("Rp", "")
                          .trim()
                          .split(",")[0]
                      }
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center text-xs text-white/90">
                      <TrendingDown className="mr-1 h-3 w-3" />
                      Kas keluar
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border-none shadow-md bg-gradient-to-br from-rose-500 to-rose-600 text-white hover:shadow-lg transition-all cursor-pointer hover:scale-[1.01]"
                  onClick={() => {
                    setFilterJenis("Pembelian Barang");
                    setFilterStatus("");
                  }}
                >
                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-white/90 text-xs font-medium">
                        Pembelian Barang
                      </CardDescription>
                      <TrendingDown className="h-5 w-5 text-white/80" />
                    </div>
                    <CardTitle className="text-xl font-bold">
                      {
                        formatCurrency(summaryData.totalPembelianBarang)
                          .replace("Rp", "")
                          .trim()
                          .split(",")[0]
                      }
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center text-xs text-white/90">
                      <TrendingDown className="mr-1 h-3 w-3" />
                      Total nominal
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border-none shadow-md bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-lg transition-all cursor-pointer hover:scale-[1.01]"
                  onClick={() => {
                    setFilterJenis("Pembelian Jasa");
                    setFilterStatus("");
                  }}
                >
                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-white/90 text-xs font-medium">
                        Pembelian Jasa
                      </CardDescription>
                      <TrendingDown className="h-5 w-5 text-white/80" />
                    </div>
                    <CardTitle className="text-xl font-bold">
                      {
                        formatCurrency(summaryData.totalPembelianJasa)
                          .replace("Rp", "")
                          .trim()
                          .split(",")[0]
                      }
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center text-xs text-white/90">
                      <TrendingDown className="mr-1 h-3 w-3" />
                      Total nominal
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Filters and Table */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="p-6 border-b bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Filter className="h-5 w-5 text-indigo-600" />
                    </div>
                    <span>Filter & Pencarian</span>
                  </div>

                  {/* Date Range Filter */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="filterDateFrom"
                        className="text-sm font-medium text-slate-700"
                      >
                        Dari Tanggal
                      </Label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="filterDateFrom"
                          type="date"
                          className="pl-10"
                          value={filterDateFrom}
                          onChange={(e) => setFilterDateFrom(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="filterDateTo"
                        className="text-sm font-medium text-slate-700"
                      >
                        Sampai Tanggal
                      </Label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="filterDateTo"
                          type="date"
                          className="pl-10"
                          value={filterDateTo}
                          onChange={(e) => setFilterDateTo(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Cari berdasarkan no. dokumen, jenis, akun, atau keterangan..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Additional Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="filterJenis"
                        className="text-sm font-medium text-slate-700"
                      >
                        Jenis Transaksi
                      </Label>
                      <select
                        id="filterJenis"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={filterJenis}
                        onChange={(e) => setFilterJenis(e.target.value)}
                      >
                        <option value="">Semua Jenis Transaksi</option>
                        <option value="cash_and_bank_receipts">
                          Penerimaan Kas & Bank
                        </option>
                        <option value="cash_disbursement">
                          Pengeluaran Kas
                        </option>
                        <option value="sales_barang">Penjualan</option>
                        <option value="sales_jasa">Penjualan Jasa</option>
                        <option value="purchase_barang">
                          Pembelian Barang
                        </option>
                        <option value="purchase_jasa">Pembelian Jasa</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="filterSource"
                        className="text-sm font-medium text-slate-700"
                      >
                        Source
                      </Label>
                      <select
                        id="filterSource"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value)}
                      >
                        <option value="">Semua Source</option>
                        <option value="kas_transaksi">KAS_TRANSAKSI</option>
                        <option value="cash_disbursement">
                          CASH_DISBURSEMENT
                        </option>
                        <option value="cash_and_bank_receipts">
                          CASH_AND_BANK_RECEIPTS
                        </option>
                        <option value="purchase_transactions">
                          PURCHASE_TRANSACTIONS
                        </option>
                        <option value="sales_transactions">
                          SALES_TRANSACTIONS
                        </option>
                        <option value="internal_usage">INTERNAL_USAGE</option>
                        <option value="approval_transaksi">
                          APPROVAL_TRANSAKSI
                        </option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="filterStatus"
                        className="text-sm font-medium text-slate-700"
                      >
                        Status
                      </Label>
                      <select
                        id="filterStatus"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="">Semua Status</option>
                        <option value="approved">Approved</option>
                        <option value="waiting_approval">
                          Waiting Approval
                        </option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {(filterDateFrom ||
                    filterDateTo ||
                    searchQuery ||
                    filterJenis ||
                    filterSource ||
                    filterStatus) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterDateFrom("");
                        setFilterDateTo("");
                        setSearchQuery("");
                        setFilterJenis("");
                        setFilterSource("");
                        setFilterStatus("");
                      }}
                      className="w-full md:w-auto"
                    >
                      Reset Filter
                    </Button>
                  )}
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="font-semibold w-16">No</TableHead>
                      <TableHead className="font-semibold">Input By</TableHead>
                      <TableHead className="font-semibold">Tanggal</TableHead>
                      <TableHead className="font-semibold">
                        No. Dokumen
                      </TableHead>
                      <TableHead className="font-semibold">Jenis</TableHead>
                      <TableHead className="font-semibold">Source</TableHead>
                      <TableHead className="font-semibold">
                        Keterangan
                      </TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-center">
                        Informasi
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        OCR Data
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        Bukti
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Nominal
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTransactions ? (
                      <TableRow>
                        <TableCell
                          colSpan={14}
                          className="text-center text-gray-500 py-8"
                        >
                          Memuat data...
                        </TableCell>
                      </TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={14}
                          className="text-center text-gray-500 py-8"
                        >
                          Belum ada transaksi. Klik "Tambah Transaksi" untuk
                          memulai.
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions
                        .filter((t) => {
                          // Date range filter
                          if (filterDateFrom || filterDateTo) {
                            const transactionDate = new Date(t.tanggal);
                            if (filterDateFrom) {
                              const fromDate = new Date(filterDateFrom);
                              if (transactionDate < fromDate) return false;
                            }
                            if (filterDateTo) {
                              const toDate = new Date(filterDateTo);
                              toDate.setHours(23, 59, 59, 999); // Include the entire end date
                              if (transactionDate > toDate) return false;
                            }
                          }

                          // Jenis filter
                          if (filterJenis) {
                            // Handle specific filter values
                            if (filterJenis === "cash_and_bank_receipts") {
                              if (t.source !== "cash_and_bank_receipts") return false;
                            } else if (filterJenis === "cash_disbursement") {
                              if (t.source !== "cash_disbursement")
                                return false;
                            } else if (filterJenis === "sales_barang") {
                              if (
                                t.source !== "sales_transactions" ||
                                t.transaction_type !== "Barang"
                              )
                                return false;
                            } else if (filterJenis === "sales_jasa") {
                              if (
                                t.source !== "sales_transactions" ||
                                t.transaction_type !== "Jasa"
                              )
                                return false;
                            } else if (filterJenis === "purchase_barang") {
                              if (
                                t.source !== "PURCHASE TRANSACTIONS" ||
                                t.transaction_type !== "Barang"
                              )
                                return false;
                            } else if (filterJenis === "purchase_jasa") {
                              if (
                                t.source !== "PURCHASE TRANSACTIONS" ||
                                t.transaction_type !== "Jasa"
                              )
                                return false;
                            }
                          }

                          // Source filter
                          if (filterSource) {
                            if (t.source !== filterSource) return false;
                          }

                          // Status filter
                          if (filterStatus) {
                            if (t.approval_status !== filterStatus)
                              return false;
                          }

                          // Search query filter
                          if (!searchQuery) return true;
                          const query = (searchQuery ?? "").toLowerCase();
                          return (
                            (t.no_dokumen ?? "")
                              .toLowerCase()
                              .includes(query) ||
                            (t.document_number ?? "")
                              .toLowerCase()
                              .includes(query) ||
                            (t.payment_type ?? "")
                              .toLowerCase()
                              .includes(query) ||
                            (t.jenis ?? "").toLowerCase().includes(query) ||
                            (t.account_name ?? "")
                              .toLowerCase()
                              .includes(query) ||
                            (t.keterangan ?? "")
                              .toLowerCase()
                              .includes(query) ||
                            (t.description ?? "")
                              .toLowerCase()
                              .includes(query) ||
                            (t.notes ?? "").toLowerCase().includes(query) ||
                            (t.item_name ?? "").toLowerCase().includes(query) ||
                            (t.supplier_name ?? "")
                              .toLowerCase()
                              .includes(query) ||
                            (t.customer_name ?? "")
                              .toLowerCase()
                              .includes(query) ||
                            (t.lender_name ?? "")
                              .toLowerCase()
                              .includes(query) ||
                            (t.loan_number ?? "")
                              .toLowerCase()
                              .includes(query) ||
                            (t.source ?? "").toLowerCase().includes(query)
                          );
                        })
                        .slice(
                          (currentPage - 1) * itemsPerPage,
                          currentPage * itemsPerPage,
                        )
                        .map((transaction, index) => {
                          // Determine display values based on source
                          let displayJenis =
                            transaction.jenis ||
                            transaction.payment_type ||
                            transaction.transaction_type ||
                            transaction.expense_type ||
                            "-";

                          // Handle Pembelian/Penjualan with transaction_type
                          if (
                            transaction.jenis === "Pembelian" &&
                            transaction.transaction_type
                          ) {
                            displayJenis = `Pembelian ${transaction.transaction_type}`;
                          } else if (
                            transaction.jenis === "Penjualan" &&
                            transaction.transaction_type
                          ) {
                            displayJenis = `Penjualan ${transaction.transaction_type}`;
                          }

                          // Add service category/type for Pengeluaran Kas if available
                          if (
                            transaction.payment_type === "Pengeluaran Kas" &&
                            transaction.service_category
                          ) {
                            displayJenis = `${transaction.payment_type} - ${transaction.service_category}`;
                            if (transaction.service_type) {
                              displayJenis += ` (${transaction.service_type})`;
                            }
                          }

                          const displayKeterangan =
                            transaction.keterangan ||
                            transaction.description ||
                            transaction.notes ||
                            transaction.item_name ||
                            "-";
                          const displayNominal =
                            transaction.nominal ||
                            transaction.total_amount ||
                            transaction.amount ||
                            transaction.total_value ||
                            0;
                          const displayDocNumber =
                            transaction.document_number ||
                            transaction.loan_number ||
                            transaction.journal_ref ||
                            transaction.id?.substring(0, 8) ||
                            "-";

                          // Determine if it's income or expense
                          const isIncome =
                            transaction.payment_type === "Penerimaan Kas" ||
                            transaction.source === "sales_transactions" ||
                            transaction.source === "cash_and_bank_receipts" ||
                            transaction.source === "loans" ||
                            displayJenis === "Penjualan";

                          return (
                            <TableRow
                              key={transaction.id}
                              className="hover:bg-slate-50"
                            >
                              <TableCell className="text-center font-medium text-gray-600">
                                {(currentPage - 1) * itemsPerPage + index + 1}
                              </TableCell>
                              <TableCell className="text-sm">
                                {userMappings[transaction.created_by] ||
                                  transaction.created_by ||
                                  "-"}
                              </TableCell>
                              <TableCell>
                                {new Date(
                                  transaction.tanggal,
                                ).toLocaleDateString("id-ID")}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {displayDocNumber}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    isIncome
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {displayJenis}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {transaction.source ===
                                  "cash_and_bank_receipts"
                                    ? "CASH AND BANK RECEIPTS"
                                    : transaction.source
                                        ?.replace(/_/g, " ")
                                        .toUpperCase() || "KAS"}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {displayKeterangan}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    transaction.approval_status === "approved"
                                      ? "bg-green-100 text-green-800"
                                      : transaction.approval_status ===
                                          "rejected"
                                        ? "bg-red-100 text-red-800"
                                        : transaction.approval_status ===
                                            "waiting_approval"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {transaction.approval_status === "approved"
                                    ? "✓ Approved"
                                    : transaction.approval_status === "rejected"
                                      ? "✗ Rejected"
                                      : transaction.approval_status ===
                                          "waiting_approval"
                                        ? "⏳ Waiting"
                                        : "-"}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      <Info className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>
                                        Detail Informasi Transaksi
                                      </DialogTitle>
                                      <DialogDescription>
                                        Informasi lengkap untuk transaksi{" "}
                                        {displayDocNumber}
                                      </DialogDescription>
                                    </DialogHeader>
                                    {console.log(
                                      "🔍 Transaction OCR Data:",
                                      transaction.ocr_data,
                                    )}
                                    <div className="space-y-4 mt-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-sm font-semibold text-gray-600">
                                            Tanggal
                                          </p>
                                          <p className="text-sm">
                                            {new Date(
                                              transaction.tanggal,
                                            ).toLocaleDateString("id-ID")}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-gray-600">
                                            No. Dokumen
                                          </p>
                                          <p className="text-sm font-mono">
                                            {displayDocNumber}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-gray-600">
                                            Jenis Transaksi
                                          </p>
                                          <p className="text-sm">
                                            {displayJenis}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-gray-600">
                                            Source
                                          </p>
                                          <p className="text-sm">
                                            {transaction.source
                                              ?.replace(/_/g, " ")
                                              .toUpperCase() || "KAS"}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-gray-600">
                                            Status
                                          </p>
                                          <p className="text-sm">
                                            {transaction.approval_status ===
                                            "approved"
                                              ? "✓ Approved"
                                              : transaction.approval_status ===
                                                  "rejected"
                                                ? "✗ Rejected"
                                                : transaction.approval_status ===
                                                    "waiting_approval"
                                                  ? "⏳ Waiting Approval"
                                                  : "-"}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-gray-600">
                                            Nominal
                                          </p>
                                          <p
                                            className={`text-sm font-medium ${isIncome ? "text-green-600" : "text-red-600"}`}
                                          >
                                            {isIncome ? "+" : "-"}Rp{" "}
                                            {new Intl.NumberFormat(
                                              "id-ID",
                                            ).format(displayNominal)}
                                          </p>
                                        </div>
                                      </div>

                                      <div>
                                        <p className="text-sm font-semibold text-gray-600">
                                          Keterangan
                                        </p>
                                        <p className="text-sm">
                                          {displayKeterangan}
                                        </p>
                                      </div>

                                      {/* Additional details based on transaction type */}
                                      {transaction.supplier_name && (
                                        <div>
                                          <p className="text-sm font-semibold text-gray-600">
                                            Supplier
                                          </p>
                                          <p className="text-sm">
                                            {transaction.supplier_name}
                                          </p>
                                        </div>
                                      )}

                                      {transaction.customer_name && (
                                        <div>
                                          <p className="text-sm font-semibold text-gray-600">
                                            Customer
                                          </p>
                                          <p className="text-sm">
                                            {transaction.customer_name}
                                          </p>
                                        </div>
                                      )}

                                      {transaction.item_name && (
                                        <div>
                                          <p className="text-sm font-semibold text-gray-600">
                                            Item
                                          </p>
                                          <p className="text-sm">
                                            {transaction.item_name}
                                          </p>
                                        </div>
                                      )}

                                      {transaction.quantity && (
                                        <div>
                                          <p className="text-sm font-semibold text-gray-600">
                                            Quantity
                                          </p>
                                          <p className="text-sm">
                                            {transaction.quantity}{" "}
                                            {transaction.unit || ""}
                                          </p>
                                        </div>
                                      )}

                                      {transaction.service_category && (
                                        <div>
                                          <p className="text-sm font-semibold text-gray-600">
                                            Service Category
                                          </p>
                                          <p className="text-sm">
                                            {transaction.service_category}
                                          </p>
                                        </div>
                                      )}

                                      {transaction.service_type && (
                                        <div>
                                          <p className="text-sm font-semibold text-gray-600">
                                            Service Type
                                          </p>
                                          <p className="text-sm">
                                            {transaction.service_type}
                                          </p>
                                        </div>
                                      )}

                                      {transaction.account_name && (
                                        <div>
                                          <p className="text-sm font-semibold text-gray-600">
                                            Account
                                          </p>
                                          <p className="text-sm">
                                            {transaction.account_name}
                                          </p>
                                        </div>
                                      )}

                                      {/* Employee Information Section */}
                                      <div className="border-t pt-4">
                                        <p className="text-sm font-semibold text-gray-700 mb-3">
                                          Informasi Karyawan
                                        </p>
                                        <div className="grid grid-cols-1 gap-3">
                                          {transaction.created_by && (
                                            <div className="flex items-start gap-2">
                                              <span className="text-sm text-gray-600 min-w-[180px]">
                                                Karyawan yang Menginput:
                                              </span>
                                              <span className="text-sm font-medium">
                                                {userMappings[
                                                  transaction.created_by
                                                ] || transaction.created_by}
                                              </span>
                                            </div>
                                          )}
                                          {transaction.approved_by && (
                                            <div className="flex items-start gap-2">
                                              <span className="text-sm text-gray-600 min-w-[180px]">
                                                Karyawan yang Meng-approve:
                                              </span>
                                              <span className="text-sm font-medium">
                                                {userMappings[
                                                  transaction.approved_by
                                                ] || transaction.approved_by}
                                              </span>
                                            </div>
                                          )}
                                          {transaction.payee_name && (
                                            <div className="flex items-start gap-2">
                                              <span className="text-sm text-gray-600 min-w-[180px]">
                                                Karyawan yang Menerima (Payee):
                                              </span>
                                              <span className="text-sm font-medium">
                                                {transaction.payee_name}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Upload Bukti */}
                                      {transaction.bukti && (
                                        <div className="border-t pt-4">
                                          <p className="text-sm font-semibold text-gray-600 mb-2">
                                            Upload Bukti
                                          </p>
                                          <a
                                            href={transaction.bukti}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                          >
                                            <Receipt className="h-4 w-4" />
                                            Lihat Bukti Transaksi
                                          </a>
                                        </div>
                                      )}

                                      {/* Tax information if available */}
                                      {(transaction.ppn_amount ||
                                        transaction.pph_amount) && (
                                        <div className="border-t pt-4">
                                          <p className="text-sm font-semibold text-gray-600 mb-2">
                                            Informasi Pajak
                                          </p>
                                          {transaction.ppn_amount && (
                                            <div className="flex justify-between text-sm">
                                              <span>
                                                PPN (
                                                {transaction.ppn_rate || 11}%)
                                              </span>
                                              <span>
                                                Rp{" "}
                                                {new Intl.NumberFormat(
                                                  "id-ID",
                                                ).format(
                                                  transaction.ppn_amount,
                                                )}
                                              </span>
                                            </div>
                                          )}
                                          {transaction.pph_amount && (
                                            <div className="flex justify-between text-sm">
                                              <span>
                                                PPh ({transaction.pph_rate || 2}
                                                %)
                                              </span>
                                              <span>
                                                Rp{" "}
                                                {new Intl.NumberFormat(
                                                  "id-ID",
                                                ).format(
                                                  transaction.pph_amount,
                                                )}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Loan information if available */}
                                      {transaction.loan_number && (
                                        <div className="border-t pt-4">
                                          <p className="text-sm font-semibold text-gray-600 mb-2">
                                            Informasi Pinjaman
                                          </p>
                                          {transaction.lender_name && (
                                            <div className="flex justify-between text-sm mb-1">
                                              <span>Pemberi Pinjaman</span>
                                              <span>
                                                {transaction.lender_name}
                                              </span>
                                            </div>
                                          )}
                                          {transaction.interest_rate && (
                                            <div className="flex justify-between text-sm mb-1">
                                              <span>Bunga</span>
                                              <span>
                                                {transaction.interest_rate}%
                                              </span>
                                            </div>
                                          )}
                                          {transaction.installment_count && (
                                            <div className="flex justify-between text-sm">
                                              <span>Jumlah Cicilan</span>
                                              <span>
                                                {transaction.installment_count}x
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Rejection Reason if status is rejected */}
                                      {transaction.approval_status ===
                                        "rejected" &&
                                        transaction.rejection_reason && (
                                          <div className="border-t pt-4">
                                            <p className="text-sm font-semibold text-red-600 mb-2">
                                              Alasan Di Reject:
                                            </p>
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                              <p className="text-sm text-red-800">
                                                {transaction.rejection_reason}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                              <TableCell className="text-center">
                                {transaction.ocr_data ? (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                      >
                                        <ScanLine className="h-4 w-4 mr-1" />
                                        OCR
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle>📄 Data OCR</DialogTitle>
                                        <DialogDescription>
                                          Data OCR untuk transaksi{" "}
                                          {displayDocNumber}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="mt-4 space-y-4">
                                        {/* Extracted Text */}
                                        {transaction.ocr_data.extractedText && (
                                          <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-2">
                                              Teks yang Diekstrak:
                                            </p>
                                            <div className="p-4 bg-slate-50 rounded-lg border text-xs font-mono whitespace-pre-wrap max-h-96 overflow-y-auto text-slate-700">
                                              {
                                                transaction.ocr_data
                                                  .extractedText
                                              }
                                            </div>
                                          </div>
                                        )}

                                        {/* Raw OCR Data */}
                                        {!transaction.ocr_data
                                          .extractedText && (
                                          <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-2">
                                              Data OCR Mentah:
                                            </p>
                                            <div className="p-4 bg-slate-50 rounded-lg border text-xs font-mono whitespace-pre-wrap max-h-96 overflow-y-auto text-slate-700">
                                              {JSON.stringify(
                                                transaction.ocr_data,
                                                null,
                                                2,
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {/* Applied Fields */}
                                        {transaction.ocr_data.appliedFields &&
                                          transaction.ocr_data.appliedFields
                                            .length > 0 && (
                                            <div>
                                              <p className="text-sm font-semibold text-gray-700 mb-2">
                                                Field yang Diterapkan:
                                              </p>
                                              <div className="space-y-2">
                                                {transaction.ocr_data.appliedFields.map(
                                                  (field: any, idx: number) => (
                                                    <div
                                                      key={idx}
                                                      className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-200"
                                                    >
                                                      <span className="text-sm font-medium text-blue-900">
                                                        {field.field}
                                                      </span>
                                                      <span className="text-sm text-blue-700">
                                                        {field.value}
                                                      </span>
                                                    </div>
                                                  ),
                                                )}
                                              </div>
                                            </div>
                                          )}

                                        {/* Items */}
                                        {transaction.ocr_data.items &&
                                          transaction.ocr_data.items.length >
                                            0 && (
                                            <div>
                                              <p className="text-sm font-semibold text-gray-700 mb-2">
                                                Item yang Diekstrak:
                                              </p>
                                              <table className="w-full text-sm border">
                                                <thead className="bg-slate-100">
                                                  <tr>
                                                    <th className="p-2 text-left border">
                                                      Item
                                                    </th>
                                                    <th className="p-2 text-center border">
                                                      Qty
                                                    </th>
                                                    <th className="p-2 text-right border">
                                                      Harga
                                                    </th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {transaction.ocr_data.items.map(
                                                    (
                                                      item: any,
                                                      idx: number,
                                                    ) => (
                                                      <tr
                                                        key={idx}
                                                        className="border-t"
                                                      >
                                                        <td className="p-2 text-slate-800">
                                                          {item.name}
                                                        </td>
                                                        <td className="p-2 text-center text-slate-600">
                                                          {item.qty}
                                                        </td>
                                                        <td className="p-2 text-right text-slate-800">
                                                          Rp{" "}
                                                          {item.price?.toLocaleString(
                                                            "id-ID",
                                                          )}
                                                        </td>
                                                      </tr>
                                                    ),
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {transaction.bukti ? (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      >
                                        <FileText className="h-4 w-4 mr-1" />
                                        Lihat
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle>
                                          Bukti Transaksi
                                        </DialogTitle>
                                        <DialogDescription>
                                          Bukti untuk transaksi{" "}
                                          {displayDocNumber}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="mt-4">
                                        {transaction.bukti.match(
                                          /\.(jpg|jpeg|png|gif|webp)$/i,
                                        ) ? (
                                          <img
                                            src={transaction.bukti}
                                            alt="Bukti Transaksi"
                                            className="w-full h-auto max-h-[60vh] object-contain rounded-lg border"
                                          />
                                        ) : transaction.bukti.match(
                                            /\.pdf$/i,
                                          ) ? (
                                          <iframe
                                            src={transaction.bukti}
                                            className="w-full h-[60vh] rounded-lg border"
                                            title="Bukti PDF"
                                          />
                                        ) : (
                                          <a
                                            href={transaction.bukti}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                                          >
                                            <FileText className="h-5 w-5" />
                                            Buka Bukti di Tab Baru
                                          </a>
                                        )}
                                      </div>
                                      <div className="mt-4 flex justify-end">
                                        <a
                                          href={transaction.bukti}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                          <FileText className="h-4 w-4" />
                                          Buka di Tab Baru
                                        </a>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                <span
                                  className={
                                    isIncome ? "text-green-600" : "text-red-600"
                                  }
                                >
                                  {isIncome ? "+" : "-"}
                                  Rp{" "}
                                  {new Intl.NumberFormat("id-ID").format(
                                    displayNominal,
                                  )}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTransaction(transaction)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                  <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                    {/* Total Penerimaan Kas */}
                    <TableRow>
                      <TableCell
                        colSpan={12}
                        className="text-right font-bold text-lg"
                      >
                        Total Penerimaan Kas:
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        <span className="text-green-600">
                          Rp{" "}
                          {new Intl.NumberFormat("id-ID").format(
                            transactions
                              .filter((t) => {
                                // Apply same filters as table
                                if (filterDateFrom || filterDateTo) {
                                  const transactionDate = new Date(t.tanggal);
                                  if (filterDateFrom) {
                                    const fromDate = new Date(filterDateFrom);
                                    if (transactionDate < fromDate)
                                      return false;
                                  }
                                  if (filterDateTo) {
                                    const toDate = new Date(filterDateTo);
                                    toDate.setHours(23, 59, 59, 999);
                                    if (transactionDate > toDate) return false;
                                  }
                                }
                                if (filterJenis) {
                                  const jenis =
                                    t.payment_type ||
                                    t.jenis ||
                                    t.transaction_type ||
                                    t.expense_type ||
                                    "";
                                  if (
                                    !jenis
                                      .toLowerCase()
                                      .includes(filterJenis.toLowerCase())
                                  )
                                    return false;
                                }
                                if (filterSource) {
                                  if (t.source !== filterSource) return false;
                                }
                                if (filterStatus) {
                                  if (t.approval_status !== filterStatus)
                                    return false;
                                }
                                if (searchQuery) {
                                  const query = (
                                    searchQuery ?? ""
                                  ).toLowerCase();
                                  const matchesSearch =
                                    (t.no_dokumen ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.document_number ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.payment_type ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.jenis ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.account_name ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.keterangan ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.description ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.notes ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.item_name ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.supplier_name ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.customer_name ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.lender_name ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.loan_number ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.source ?? "")
                                      .toLowerCase()
                                      .includes(query);
                                  if (!matchesSearch) return false;
                                }

                                // Only count Penerimaan (approved)
                                if (t.approval_status !== "approved")
                                  return false;

                                // Income from Penjualan Jasa
                                if (
                                  t.source === "sales_transactions" &&
                                  t.transaction_type === "Jasa"
                                )
                                  return true;
                                // Income from Penjualan
                                if (
                                  t.source === "sales_transactions" &&
                                  t.transaction_type === "Barang"
                                )
                                  return true;
                                // Income from Penerimaan Cash & Bank
                                if (t.source === "cash_receipts") return true;

                                return false;
                              })
                              .reduce((sum, t) => {
                                const nominal = parseFloat(
                                  t.nominal ||
                                    t.amount ||
                                    t.total_amount ||
                                    t.total_value ||
                                    0,
                                );
                                return sum + nominal;
                              }, 0),
                          )}
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Total Pengeluaran Kas */}
                    <TableRow>
                      <TableCell
                        colSpan={12}
                        className="text-right font-bold text-lg"
                      >
                        Total Pengeluaran Kas:
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        <span className="text-red-600">
                          Rp{" "}
                          {new Intl.NumberFormat("id-ID").format(
                            transactions
                              .filter((t) => {
                                // Apply same filters as table
                                if (filterDateFrom || filterDateTo) {
                                  const transactionDate = new Date(t.tanggal);
                                  if (filterDateFrom) {
                                    const fromDate = new Date(filterDateFrom);
                                    if (transactionDate < fromDate)
                                      return false;
                                  }
                                  if (filterDateTo) {
                                    const toDate = new Date(filterDateTo);
                                    toDate.setHours(23, 59, 59, 999);
                                    if (transactionDate > toDate) return false;
                                  }
                                }
                                if (filterJenis) {
                                  const jenis =
                                    t.payment_type ||
                                    t.jenis ||
                                    t.transaction_type ||
                                    t.expense_type ||
                                    "";
                                  if (
                                    !jenis
                                      .toLowerCase()
                                      .includes(filterJenis.toLowerCase())
                                  )
                                    return false;
                                }
                                if (filterSource) {
                                  if (t.source !== filterSource) return false;
                                }
                                if (filterStatus) {
                                  if (t.approval_status !== filterStatus)
                                    return false;
                                }
                                if (searchQuery) {
                                  const query = (
                                    searchQuery ?? ""
                                  ).toLowerCase();
                                  const matchesSearch =
                                    (t.no_dokumen ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.document_number ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.payment_type ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.jenis ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.account_name ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.keterangan ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.description ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.notes ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.item_name ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.supplier_name ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.customer_name ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.lender_name ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.loan_number ?? "")
                                      .toLowerCase()
                                      .includes(query) ||
                                    (t.source ?? "")
                                      .toLowerCase()
                                      .includes(query);
                                  if (!matchesSearch) return false;
                                }

                                // Only count Pengeluaran (approved)
                                if (t.approval_status !== "approved")
                                  return false;

                                // Expenses from kas_transaksi
                                if (
                                  t.source === "kas_transaksi" &&
                                  t.payment_type === "Pengeluaran Kas"
                                )
                                  return true;
                                // Expenses from purchase_transactions
                                if (t.source === "purchase_transactions")
                                  return true;
                                // Expenses from internal_usage
                                if (t.source === "internal_usage") return true;
                                // Expenses from expenses table
                                if (t.source === "expenses") return true;
                                // Expenses from cash_disbursement
                                if (t.source === "cash_disbursement")
                                  return true;

                                return false;
                              })
                              .reduce((sum, t) => {
                                const nominal = parseFloat(
                                  t.nominal ||
                                    t.amount ||
                                    t.total_amount ||
                                    t.total_value ||
                                    0,
                                );
                                return sum + nominal;
                              }, 0),
                          )}
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Total Net */}
                    <TableRow className="bg-slate-200">
                      <TableCell
                        colSpan={12}
                        className="text-right font-bold text-xl"
                      >
                        Total Net:
                      </TableCell>
                      <TableCell className="text-right font-bold text-xl">
                        <span className="text-indigo-700">
                          Rp{" "}
                          {new Intl.NumberFormat("id-ID").format(
                            (() => {
                              const filteredTransactions = transactions.filter(
                                (t) => {
                                  // Apply same filters as table
                                  if (filterDateFrom || filterDateTo) {
                                    const transactionDate = new Date(t.tanggal);
                                    if (filterDateFrom) {
                                      const fromDate = new Date(filterDateFrom);
                                      if (transactionDate < fromDate)
                                        return false;
                                    }
                                    if (filterDateTo) {
                                      const toDate = new Date(filterDateTo);
                                      toDate.setHours(23, 59, 59, 999);
                                      if (transactionDate > toDate)
                                        return false;
                                    }
                                  }
                                  if (filterJenis) {
                                    // Handle specific filter values
                                    if (
                                      filterJenis === "cash_and_bank_receipts"
                                    ) {
                                      if (t.source !== "cash_and_bank_receipts")
                                        return false;
                                    } else if (
                                      filterJenis === "cash_disbursement"
                                    ) {
                                      if (t.source !== "cash_disbursement")
                                        return false;
                                    } else if (filterJenis === "sales_barang") {
                                      if (
                                        t.source !== "sales_transactions" ||
                                        t.transaction_type !== "Barang"
                                      )
                                        return false;
                                    } else if (filterJenis === "sales_jasa") {
                                      if (
                                        t.source !== "sales_transactions" ||
                                        t.transaction_type !== "Jasa"
                                      )
                                        return false;
                                    } else if (
                                      filterJenis === "purchase_barang"
                                    ) {
                                      if (
                                        t.source !== "PURCHASE TRANSACTIONS" ||
                                        t.transaction_type !== "Barang"
                                      )
                                        return false;
                                    } else if (
                                      filterJenis === "purchase_jasa"
                                    ) {
                                      if (
                                        t.source !== "PURCHASE TRANSACTIONS" ||
                                        t.transaction_type !== "Jasa"
                                      )
                                        return false;
                                    }
                                  }
                                  if (filterSource) {
                                    if (t.source !== filterSource) return false;
                                  }
                                  if (filterStatus) {
                                    if (t.approval_status !== filterStatus)
                                      return false;
                                  }
                                  if (searchQuery) {
                                    const query = (
                                      searchQuery ?? ""
                                    ).toLowerCase();
                                    return (
                                      (t.payment_type ?? "")
                                        .toLowerCase()
                                        .includes(query) ||
                                      (t.jenis ?? "")
                                        .toLowerCase()
                                        .includes(query) ||
                                      (t.account_name ?? "")
                                        .toLowerCase()
                                        .includes(query) ||
                                      (t.keterangan ?? "")
                                        .toLowerCase()
                                        .includes(query) ||
                                      (t.description ?? "")
                                        .toLowerCase()
                                        .includes(query) ||
                                      (t.notes ?? "")
                                        .toLowerCase()
                                        .includes(query) ||
                                      (t.item_name ?? "")
                                        .toLowerCase()
                                        .includes(query) ||
                                      (t.supplier_name ?? "")
                                        .toLowerCase()
                                        .includes(query) ||
                                      (t.customer_name ?? "")
                                        .toLowerCase()
                                        .includes(query) ||
                                      (t.lender_name ?? "")
                                        .toLowerCase()
                                        .includes(query) ||
                                      (t.document_number ?? "")
                                        .toLowerCase()
                                        .includes(query) ||
                                      (t.loan_number ?? "")
                                        .toLowerCase()
                                        .includes(query) ||
                                      (t.source ?? "")
                                        .toLowerCase()
                                        .includes(query)
                                    );
                                  }
                                  return true;
                                },
                              );

                              const totalPenerimaan = filteredTransactions
                                .filter((t) => {
                                  if (t.approval_status !== "approved")
                                    return false;
                                  if (
                                    t.source === "sales_transactions" &&
                                    t.transaction_type === "Jasa"
                                  )
                                    return true;
                                  if (
                                    t.source === "sales_transactions" &&
                                    t.transaction_type === "Barang"
                                  )
                                    return true;
                                  if (t.source === "cash_receipts") return true;
                                  return false;
                                })
                                .reduce((sum, t) => {
                                  const nominal = parseFloat(
                                    t.nominal ||
                                      t.amount ||
                                      t.total_amount ||
                                      t.total_value ||
                                      0,
                                  );
                                  return sum + nominal;
                                }, 0);

                              const totalPengeluaran = filteredTransactions
                                .filter((t) => {
                                  if (t.approval_status !== "approved")
                                    return false;
                                  if (
                                    t.source === "kas_transaksi" &&
                                    t.payment_type === "Pengeluaran Kas"
                                  )
                                    return true;
                                  if (t.source === "purchase_transactions")
                                    return true;
                                  if (t.source === "internal_usage")
                                    return true;
                                  if (t.source === "expenses") return true;
                                  if (t.source === "cash_disbursement")
                                    return true;
                                  return false;
                                })
                                .reduce((sum, t) => {
                                  const nominal = parseFloat(
                                    t.nominal ||
                                      t.amount ||
                                      t.total_amount ||
                                      t.total_value ||
                                      0,
                                  );
                                  return sum + nominal;
                                }, 0);

                              return totalPenerimaan - totalPengeluaran;
                            })(),
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  </tfoot>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-gray-700">
                  Menampilkan{" "}
                  <span className="font-medium">
                    {Math.min(
                      (currentPage - 1) * itemsPerPage + 1,
                      transactions.filter((t) => {
                        if (filterDateFrom || filterDateTo) {
                          const transactionDate = new Date(t.tanggal);
                          if (filterDateFrom) {
                            const fromDate = new Date(filterDateFrom);
                            if (transactionDate < fromDate) return false;
                          }
                          if (filterDateTo) {
                            const toDate = new Date(filterDateTo);
                            toDate.setHours(23, 59, 59, 999);
                            if (transactionDate > toDate) return false;
                          }
                        }
                        if (filterJenis) {
                          const jenis =
                            t.payment_type ||
                            t.jenis ||
                            t.transaction_type ||
                            t.expense_type ||
                            "";
                          if (
                            !jenis
                              .toLowerCase()
                              .includes(filterJenis.toLowerCase())
                          )
                            return false;
                        }
                        if (filterSource && t.source !== filterSource)
                          return false;
                        if (filterStatus && t.approval_status !== filterStatus)
                          return false;
                        if (!searchQuery) return true;
                        const query = (searchQuery ?? "").toLowerCase();
                        return (
                          (t.payment_type ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.jenis ?? "").toLowerCase().includes(query) ||
                          (t.account_name ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.keterangan ?? "").toLowerCase().includes(query) ||
                          (t.description ?? "").toLowerCase().includes(query) ||
                          (t.notes ?? "").toLowerCase().includes(query) ||
                          (t.item_name ?? "").toLowerCase().includes(query) ||
                          (t.supplier_name ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.customer_name ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.lender_name ?? "").toLowerCase().includes(query) ||
                          (t.document_number ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.loan_number ?? "").toLowerCase().includes(query) ||
                          (t.source ?? "").toLowerCase().includes(query)
                        );
                      }).length,
                    )}
                  </span>{" "}
                  sampai{" "}
                  <span className="font-medium">
                    {Math.min(
                      currentPage * itemsPerPage,
                      transactions.filter((t) => {
                        if (filterDateFrom || filterDateTo) {
                          const transactionDate = new Date(t.tanggal);
                          if (filterDateFrom) {
                            const fromDate = new Date(filterDateFrom);
                            if (transactionDate < fromDate) return false;
                          }
                          if (filterDateTo) {
                            const toDate = new Date(filterDateTo);
                            toDate.setHours(23, 59, 59, 999);
                            if (transactionDate > toDate) return false;
                          }
                        }
                        if (filterJenis) {
                          const jenis =
                            t.payment_type ||
                            t.jenis ||
                            t.transaction_type ||
                            t.expense_type ||
                            "";
                          if (
                            !jenis
                              .toLowerCase()
                              .includes(filterJenis.toLowerCase())
                          )
                            return false;
                        }
                        if (filterSource && t.source !== filterSource)
                          return false;
                        if (filterStatus && t.approval_status !== filterStatus)
                          return false;
                        if (!searchQuery) return true;
                        const query = (searchQuery ?? "").toLowerCase();
                        return (
                          (t.payment_type ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.jenis ?? "").toLowerCase().includes(query) ||
                          (t.account_name ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.keterangan ?? "").toLowerCase().includes(query) ||
                          (t.description ?? "").toLowerCase().includes(query) ||
                          (t.notes ?? "").toLowerCase().includes(query) ||
                          (t.item_name ?? "").toLowerCase().includes(query) ||
                          (t.supplier_name ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.customer_name ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.lender_name ?? "").toLowerCase().includes(query) ||
                          (t.document_number ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.loan_number ?? "").toLowerCase().includes(query) ||
                          (t.source ?? "").toLowerCase().includes(query)
                        );
                      }).length,
                    )}
                  </span>{" "}
                  dari{" "}
                  <span className="font-medium">
                    {
                      transactions.filter((t) => {
                        if (filterDateFrom || filterDateTo) {
                          const transactionDate = new Date(t.tanggal);
                          if (filterDateFrom) {
                            const fromDate = new Date(filterDateFrom);
                            if (transactionDate < fromDate) return false;
                          }
                          if (filterDateTo) {
                            const toDate = new Date(filterDateTo);
                            toDate.setHours(23, 59, 59, 999);
                            if (transactionDate > toDate) return false;
                          }
                        }
                        if (filterJenis) {
                          const jenis =
                            t.payment_type ||
                            t.jenis ||
                            t.transaction_type ||
                            t.expense_type ||
                            "";
                          if (
                            !jenis
                              .toLowerCase()
                              .includes(filterJenis.toLowerCase())
                          )
                            return false;
                        }
                        if (filterSource && t.source !== filterSource)
                          return false;
                        if (filterStatus && t.approval_status !== filterStatus)
                          return false;
                        if (!searchQuery) return true;
                        const query = (searchQuery ?? "").toLowerCase();
                        return (
                          (t.payment_type ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.jenis ?? "").toLowerCase().includes(query) ||
                          (t.account_name ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.keterangan ?? "").toLowerCase().includes(query) ||
                          (t.description ?? "").toLowerCase().includes(query) ||
                          (t.notes ?? "").toLowerCase().includes(query) ||
                          (t.item_name ?? "").toLowerCase().includes(query) ||
                          (t.supplier_name ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.customer_name ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.lender_name ?? "").toLowerCase().includes(query) ||
                          (t.document_number ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.loan_number ?? "").toLowerCase().includes(query) ||
                          (t.source ?? "").toLowerCase().includes(query)
                        );
                      }).length
                    }
                  </span>{" "}
                  transaksi
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={
                      currentPage * itemsPerPage >=
                      transactions.filter((t) => {
                        if (filterDateFrom || filterDateTo) {
                          const transactionDate = new Date(t.tanggal);
                          if (filterDateFrom) {
                            const fromDate = new Date(filterDateFrom);
                            if (transactionDate < fromDate) return false;
                          }
                          if (filterDateTo) {
                            const toDate = new Date(filterDateTo);
                            toDate.setHours(23, 59, 59, 999);
                            if (transactionDate > toDate) return false;
                          }
                        }
                        if (filterJenis) {
                          const jenis =
                            t.payment_type ||
                            t.jenis ||
                            t.transaction_type ||
                            t.expense_type ||
                            "";
                          if (
                            !jenis
                              .toLowerCase()
                              .includes(filterJenis.toLowerCase())
                          )
                            return false;
                        }
                        if (filterSource && t.source !== filterSource)
                          return false;
                        if (filterStatus && t.approval_status !== filterStatus)
                          return false;
                        if (!searchQuery) return true;
                        const query = (searchQuery ?? "").toLowerCase();
                        return (
                          (t.payment_type ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.jenis ?? "").toLowerCase().includes(query) ||
                          (t.account_name ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.keterangan ?? "").toLowerCase().includes(query) ||
                          (t.description ?? "").toLowerCase().includes(query) ||
                          (t.notes ?? "").toLowerCase().includes(query) ||
                          (t.item_name ?? "").toLowerCase().includes(query) ||
                          (t.supplier_name ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.customer_name ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.lender_name ?? "").toLowerCase().includes(query) ||
                          (t.document_number ?? "")
                            .toLowerCase()
                            .includes(query) ||
                          (t.loan_number ?? "").toLowerCase().includes(query) ||
                          (t.source ?? "").toLowerCase().includes(query)
                        );
                      }).length
                    }
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FORM VIEW */}
        {showForm && !showCart && (
          <Card className="bg-white rounded-xl shadow-lg border border-slate-200">
            <CardContent className="p-6 space-y-6">
              {/* OCR UPLOAD SECTION */}
              {/*       <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">
                      Upload Bukti Transaksi (OCR)
                    </h3>
                    <p className="text-sm text-blue-700">
                      Upload foto struk/invoice untuk auto-fill form (JPG/PNG)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingOCR}
                      className="bg-white"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isProcessingOCR ? "Memproses..." : "Upload Bukti"}
                    </Button>
                  </div>
                </div>
                {uploadedFile && (
                  <div className="mt-2 text-sm text-green-700">
                    ✓ File uploaded: {uploadedFile.name}
                  </div>
                )}
              </div>
              */}

              {/* ROW 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jenis_transaksi">Jenis Transaksi *</Label>
                  <Select
                    value={jenisTransaksi}
                    onValueChange={(value) => {
                      setJenisTransaksi(value);
                      // Reset all form fields
                      setNominal("");
                      setTanggal(new Date().toISOString().split("T")[0]);
                      setBankAsal("");
                      setBankTujuan("");
                      setDescription("");
                      
                      // 🔒 AUTO SET PAYMENT TYPE UNTUK PENGELUARAN KAS
                      if (value === "Pengeluaran Kas") {
                        setPaymentType("Kas"); // 🔒 HANYA KAS - gunakan "Kas" agar dropdown muncul
                        setSelectedBank(""); // 🔒 RESET BANK
                        setSelectedKas(""); // 🔒 RESET KAS - user harus pilih ulang
                        setJenisPembayaranPengeluaran("Cash"); // 🔒 HANYA CASH
                      } else {
                        setPaymentType("");
                      }
                      
                      setKasSumber("");
                      setKasTujuan("");
                      setKategoriPengeluaran("");
                      setSelectedAccountType("");
                      setSelectedAccountName("");
                      setNamaPenerimaSearch("");
                      setNamaPengeluaranSearch("");
                      setSelectedEmployee("");
                      setTransactionItemType("");
                      setSelectedItemId("");
                      setItemQty(1);
                      setItemPrice(0);
                      setItemTotal(0);
                      setTaxPercentage(0);
                      setTaxAmount(0);
                      setCoaSelected("");
                      setBuktiFile(null);
                      setBuktiUrl("");
                      setAkunPendapatan("");
                      setSelectedRevenueAccount(null);
                      setAkunBeban("");
                      setSelectedExpenseAccount(null);
                      setAkunModal("");
                      setSelectedModalAccount(null);
                      setSelectedCreditAccountType("");
                      setSelectedCreditAccountName("");
                      setSumberPenerimaan("");
                      setSumberPengeluaran("");
                      setNamaPemilik("");
                      setNamaPenyumbang("");
                      setCustomer("");
                      setSupplier("");
                      setConsignee("");
                      setSelectedBank("");
                      setSelectedKas("");
                      setQuantity("1");
                      setHargaJual("");
                      setHargaBeli("");
                      setPpnPercentage("11");
                      setPpnAmount("0");
                      setSelectedBorrower("");
                      setSelectedBorrowerData(null);
                      setLoanType("");
                      setInterestRate("0");
                      setLoanTermMonths("");
                      setMaturityDate("");
                      setPaymentSchedule("Bulanan");
                      setPrincipalAmount("0");
                      setInterestAmount("0");
                      setLateFee("0");
                      setLateFeePercentage("0.1");
                      setDaysLate("0");
                      setActualPaymentDate("");
                      setTaxType("");
                      setLoanCalculationMethod("Anuitas");
                      // Reset sales items array
                      setSalesItems([{
                        id: crypto.randomUUID(),
                        itemName: "",
                        jenisBarang: "",
                        quantity: 1,
                        sellingPrice: 0,
                        nominal: "0"
                      }]);
                      // Reset search states
                      setStockItemSearch("");
                      setSearchAccountName("");
                      setSearchEmployee("");
                      setSearchEmployeePengeluaran("");
                      setSearchAccountTypePenerimaan("");
                      setSearchAccountNamePenerimaan("");
                      setSearchCreditAccountType("");
                      setSearchCreditAccountName("");
                      setCustomerSearch("");
                      setSupplierSearch("");
                      setBankSearch("");
                      setKasSearch("");
                      // Reset popover states
                      setKasPopoverOpen(false);
                      setBankAsalPopoverOpen(false);
                      setBankTujuanPopoverOpen(false);
                      setAkunPendapatanPopoverOpen(false);
                      setAkunBebanPopoverOpen(false);
                      setAkunModalPopoverOpen(false);
                      setNamaPenerimaPopoverOpen(false);
                      setNamaPengeluaranPopoverOpen(false);
                      setCustomerPopoverOpen(false);
                      setSupplierPopoverOpen(false);
                      setBankPopoverOpen(false);
                      setOpenAccountNameCombobox(false);
                      setOpenEmployeeCombobox(false);
                      setOpenEmployeePengeluaranCombobox(false);
                      setOpenAccountTypePenerimaanCombobox(false);
                      setOpenAccountNamePenerimaanCombobox(false);
                      setOpenCreditAccountTypeCombobox(false);
                      setOpenCreditAccountNameCombobox(false);
                      // Reset OCR states
                      setOcrFile(null);
                      setOcrFilePreview(null);
                      setOcrExtractedText("");
                      setOcrParsedData(null);
                      setOcrAppliedData(null);
                    }}
                  >
                    <SelectTrigger id="jenis_transaksi">
                      <SelectValue placeholder="-- pilih --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendapatan">Pendapatan</SelectItem>
                      <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                      <SelectItem value="Penjualan">Penjualan</SelectItem>
                      <SelectItem value="Pembelian">Pembelian</SelectItem>
                      <SelectItem value="Transfer Bank">
                        Transfer Bank
                      </SelectItem>
                      <SelectItem value="Setoran Modal">
                        Setoran Modal
                      </SelectItem>
                      <SelectItem value="Prive">Prive</SelectItem>
                      <SelectItem value="Pelunasan Piutang">
                        Pelunasan Piutang
                      </SelectItem>
                      <SelectItem value="Pelunasan Hutang">
                        Pelunasan Hutang
                      </SelectItem>
                      <SelectItem value="Jurnal Umum">Jurnal Umum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Method - Conditional */}
                {visibleFields.showPaymentMethod &&
                  !visibleFields.showJurnalUmum && (
                    <div className="space-y-2">
                      <Label htmlFor="payment_method">
                        Metode Pembayaran *
                      </Label>
                      <Select
                        value={paymentType}
                        onValueChange={(value) => {
                          setPaymentType(value);
                          // Reset opposite account selection
                          if (value === "Bank") {
                            setSelectedKas("");
                          } else if (value === "Kas") {
                            setSelectedBank("");
                          }
                        }}
                      >
                        <SelectTrigger id="payment_method">
                          <SelectValue placeholder="-- pilih metode --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kas">Kas</SelectItem>
                          <SelectItem value="Bank">Bank</SelectItem>
                          <SelectItem value="Kredit">
                            Kredit (Hutang/Piutang)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
              </div>

              {/* KATEGORI AKUNTANSI TRANSAKSI - Penentu Logika Jurnal */}
              {(jenisTransaksi === "Pengeluaran" || jenisTransaksi === "Pengeluaran Kas" || jenisTransaksi === "Pendapatan") && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="kategori_akuntansi" className="flex items-center gap-2">
                    <span>Kategori Akuntansi *</span>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Penentu Logika Jurnal</span>
                  </Label>
                  <Select
                    value={kategoriAkuntansi}
                    onValueChange={(value) => {
                      setKategoriAkuntansi(value);
                      // Reset akun beban/pendapatan when kategori changes
                      setAkunBeban("");
                      setAkunPendapatan("");
                      setSelectedExpenseAccount(null);
                      setSelectedRevenueAccount(null);
                    }}
                  >
                    <SelectTrigger id="kategori_akuntansi">
                      <SelectValue placeholder="-- pilih kategori akuntansi --" />
                    </SelectTrigger>
                    <SelectContent>
                      {kategoriAkuntansiOptions[jenisTransaksi]?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-gray-500">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {kategoriAkuntansi && (
                    <p className="text-xs text-gray-500 mt-1">
                      Filter akun: Kode dimulai dengan <span className="font-mono font-bold text-blue-600">{getCoaPrefixByKategori()}</span>
                    </p>
                  )}
                </div>
              )}

              {/* JURNAL UMUM COMPONENT */}
              {jenisTransaksi === "Jurnal Umum" && (
                <div className="mt-4">
                  <JurnalUmum />
                </div>
              )}

              {/* TRANSFER BANK FIELDS */}
              {visibleFields.showBankAsal && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_asal">Bank Asal *</Label>
                    <Popover
                      open={bankAsalPopoverOpen}
                      onOpenChange={setBankAsalPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {bankAsal || "-- pilih atau ketik bank asal --"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-2">
                        <Input
                          placeholder="Cari atau ketik bank baru..."
                          value={bankSearch}
                          onChange={(e) => setBankSearch(e.target.value)}
                          className="mb-2"
                        />
                        <div className="max-h-64 overflow-auto">
                          {banks
                            .filter((bank) =>
                              `${bank.account_code} ${bank.account_name}`
                                .toLowerCase()
                                .includes(bankSearch.toLowerCase()),
                            )
                            .map((bank) => (
                              <div
                                key={`bank-asal-${bank.id || bank.account_code}`}
                                className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer rounded"
                                onClick={() => {
                                  setBankAsal(
                                    `${bank.account_code} — ${bank.account_name}`,
                                  );
                                  setBankAsalPopoverOpen(false);
                                  setBankSearch("");
                                }}
                              >
                                <span className="text-sm">
                                  {bank.account_code} — {bank.account_name}
                                </span>
                                {bankAsal ===
                                  `${bank.account_code} — ${bank.account_name}` && (
                                  <Check className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                            ))}
                          {bankSearch &&
                            !banks.some((bank) =>
                              `${bank.account_code} ${bank.account_name}`
                                .toLowerCase()
                                .includes(bankSearch.toLowerCase()),
                            ) && (
                              <div
                                className="p-2 hover:bg-gray-100 cursor-pointer rounded border-t"
                                onClick={() => {
                                  setBankAsal(bankSearch);
                                  setBankAsalPopoverOpen(false);
                                  setBankSearch("");
                                }}
                              >
                                <span className="text-sm text-blue-600">
                                  + Tambah manual: "{bankSearch}"
                                </span>
                              </div>
                            )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank_tujuan">Bank Tujuan *</Label>
                    <Popover
                      open={bankTujuanPopoverOpen}
                      onOpenChange={setBankTujuanPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {bankTujuan || "-- pilih atau ketik bank tujuan --"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-2">
                        <Input
                          placeholder="Cari atau ketik bank baru..."
                          value={bankSearch}
                          onChange={(e) => setBankSearch(e.target.value)}
                          className="mb-2"
                        />
                        <div className="max-h-64 overflow-auto">
                          {banks
                            .filter((bank) =>
                              `${bank.account_code} ${bank.account_name}`
                                .toLowerCase()
                                .includes(bankSearch.toLowerCase()),
                            )
                            .map((bank) => (
                              <div
                                key={`bank-tujuan-${bank.id || bank.account_code}`}
                                className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer rounded"
                                onClick={() => {
                                  setBankTujuan(
                                    `${bank.account_code} — ${bank.account_name}`,
                                  );
                                  setBankTujuanPopoverOpen(false);
                                  setBankSearch("");
                                }}
                              >
                                <span className="text-sm">
                                  {bank.account_code} — {bank.account_name}
                                </span>
                                {bankTujuan ===
                                  `${bank.account_code} — ${bank.account_name}` && (
                                  <Check className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                            ))}
                          {bankSearch &&
                            !banks.some((bank) =>
                              `${bank.account_code} ${bank.account_name}`
                                .toLowerCase()
                                .includes(bankSearch.toLowerCase()),
                            ) && (
                              <div
                                className="p-2 hover:bg-gray-100 cursor-pointer rounded border-t"
                                onClick={() => {
                                  setBankTujuan(bankSearch);
                                  setBankTujuanPopoverOpen(false);
                                  setBankSearch("");
                                }}
                              >
                                <span className="text-sm text-blue-600">
                                  + Tambah manual: "{bankSearch}"
                                </span>
                              </div>
                            )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* ITEM FIELDS - For Pembelian and Penjualan */}
              {visibleFields.showItemFields && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="transaction_item_type">
                        Tipe Item Transaksi *
                      </Label>
                      <Select
                        value={transactionItemType}
                        onValueChange={(value) => {
                          setTransactionItemType(value);
                          setSelectedItemId("");
                          setItemPrice(0);
                          setItemQty(1);
                          // Reset Item Penjualan fields
                          setSalesItems([{
                            id: crypto.randomUUID(),
                            itemName: "",
                            jenisBarang: "",
                            quantity: "1",
                            nominal: "0",
                            stockId: "",
                            sellingPrice: 0,
                            tipeItem: value
                          }]);
                        }}
                      >
                        <SelectTrigger id="transaction_item_type">
                          <SelectValue placeholder="-- pilih tipe item --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Barang">Barang</SelectItem>
                          <SelectItem value="Jasa">Jasa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>



                  {transactionItemType && selectedItemId && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div></div>
                      <div></div>
                      <div className="space-y-2">
                        <Label htmlFor="item_total">Total</Label>
                        <Input
                          id="item_total"
                          type="text"
                          value={`Rp ${itemTotal.toLocaleString("id-ID")}`}
                          disabled
                          className="bg-gray-100"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* CUSTOMER FIELD */}
              {visibleFields.showCustomer && (
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Popover
                    open={customerPopoverOpen}
                    onOpenChange={setCustomerPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {customer || "-- pilih atau ketik customer --"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2">
                      <Input
                        placeholder="Cari atau ketik customer baru..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="mb-2"
                      />
                      <div className="max-h-64 overflow-auto">
                        {customers
                          .filter((cust) =>
                            (cust.customer_name ?? "")
                              .toLowerCase()
                              .includes((customerSearch ?? "").toLowerCase()),
                          )
                          .map((cust) => (
                            <div
                              key={cust.id}
                              className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer rounded"
                              onClick={() => {
                                setCustomer(cust.customer_name);
                                setCustomerPopoverOpen(false);
                                setCustomerSearch("");
                              }}
                            >
                              <span className="text-sm">
                                {cust.customer_name}
                              </span>
                              {customer === cust.customer_name && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          ))}
                        {customerSearch &&
                          !customers.some((cust) =>
                            cust.customer_name
                              .toLowerCase()
                              .includes(customerSearch.toLowerCase()),
                          ) && (
                            <div
                              className="p-2 hover:bg-gray-100 cursor-pointer rounded border-t"
                              onClick={() => {
                                setCustomer(customerSearch);
                                setCustomerPopoverOpen(false);
                                setCustomerSearch("");
                              }}
                            >
                              <span className="text-sm text-blue-600">
                                + Tambah manual: "{customerSearch}"
                              </span>
                            </div>
                          )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* SUPPLIER FIELD */}
              {visibleFields.showSupplier && (
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Popover
                    open={supplierPopoverOpen}
                    onOpenChange={setSupplierPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {supplier || "-- pilih atau ketik supplier --"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2">
                      <Input
                        placeholder="Cari atau ketik supplier baru..."
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                        className="mb-2"
                      />
                      <div className="max-h-64 overflow-auto">
                        {suppliers
                          .filter((supp) =>
                            supp.supplier_name
                              .toLowerCase()
                              .includes(supplierSearch.toLowerCase()),
                          )
                          .map((supp) => (
                            <div
                              key={supp.id}
                              className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer rounded"
                              onClick={() => {
                                setSupplier(supp.supplier_name);
                                setSupplierPopoverOpen(false);
                                setSupplierSearch("");
                              }}
                            >
                              <span className="text-sm">
                                {supp.supplier_name}
                              </span>
                              {supplier === supp.supplier_name && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          ))}
                        {supplierSearch &&
                          !suppliers.some((supp) =>
                            supp.supplier_name
                              .toLowerCase()
                              .includes(supplierSearch.toLowerCase()),
                          ) && (
                            <div
                              className="p-2 hover:bg-gray-100 cursor-pointer rounded border-t"
                              onClick={() => {
                                setSupplier(supplierSearch);
                                setSupplierPopoverOpen(false);
                                setSupplierSearch("");
                              }}
                            >
                              <span className="text-sm text-blue-600">
                                + Tambah manual: "{supplierSearch}"
                              </span>
                            </div>
                          )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* AKUN MODAL */}
              {visibleFields.showAkunModal && (
                <div className="space-y-2">
                  <Label htmlFor="akun_modal">Akun Modal *</Label>
                  <Popover
                    open={akunModalPopoverOpen}
                    onOpenChange={setAkunModalPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {akunModal || "-- pilih akun modal --"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2">
                      <Input
                        placeholder="Cari akun modal..."
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        className="mb-2"
                      />
                      <div className="max-h-64 overflow-auto">
                        {coa
                          .filter((acc) => {
                            // Level 3 accounts with parent_code = "3-1000"
                            const isLevel3 = acc.level === 3;
                            const isParent3_1000 = acc.parent_code === "3-1000";
                            const searchMatch = `${acc.account_code} ${acc.account_name}`
                              .toLowerCase()
                              .includes(bankSearch.toLowerCase());
                            return isLevel3 && isParent3_1000 && searchMatch;
                          })
                          .map((acc) => (
                            <div
                              key={acc.account_code}
                              className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer rounded"
                              onClick={() => {
                                setAkunModal(acc.account_name);
                                setSelectedModalAccount({
                                  id: acc.id,
                                  account_code: acc.account_code,
                                  account_name: acc.account_name,
                                  description: acc.description,
                                });
                                setAkunModalPopoverOpen(false);
                                setBankSearch("");
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {acc.account_name}
                                </span>
                                {acc.description && (
                                  <span className="text-xs text-gray-500">
                                    {acc.description}
                                  </span>
                                )}
                              </div>
                              {akunModal === acc.account_name && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* KAS/BANK ACCOUNT SELECTION */}
              {visibleFields.showKasBank && (
                <>
                  {/* Bank Selection - Show only if Bank */}
                  {paymentType === "Bank" && (
                    <div className="space-y-2">
                      <Label htmlFor="bank">Bank *</Label>
                      <Select
                        value={selectedBank}
                        onValueChange={(value) => setSelectedBank(value)}
                      >
                        <SelectTrigger id="bank">
                          <SelectValue placeholder="-- pilih atau ketik bank --" />
                        </SelectTrigger>
                        <SelectContent>
                          {banks.map((item) => (
                            <SelectItem
                              key={item.account_code}
                              value={`${item.account_code} — ${item.account_name}`}
                            >
                              {item.account_code} — {item.account_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Kas Selection - Show only if Kas or cash */}
                  {(paymentType === "Kas" || paymentType === "cash") && (
                    <div className="space-y-2">
                      <Label htmlFor="kas">Kas *</Label>
                      <Popover
                        open={kasPopoverOpen}
                        onOpenChange={setKasPopoverOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {selectedKas || "-- pilih atau ketik kas --"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-2">
                          <Input
                            placeholder="Cari atau ketik kas baru..."
                            value={kasSearch}
                            onChange={(e) => setKasSearch(e.target.value)}
                            className="mb-2"
                          />
                          <div className="max-h-64 overflow-auto">
                            {kasAccounts
                              .filter((kas) =>
                                `${kas.account_code} ${kas.account_name}`
                                  .toLowerCase()
                                  .includes(kasSearch.toLowerCase()),
                              )
                              .map((kas) => (
                                <div
                                  key={kas.account_code}
                                  className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer rounded"
                                  onClick={() => {
                                    setSelectedKas(
                                      `${kas.account_code} — ${kas.account_name}`,
                                    );
                                    setKasPopoverOpen(false);
                                    setKasSearch("");
                                  }}
                                >
                                  <span className="text-sm">
                                    {kas.account_code} — {kas.account_name}
                                  </span>
                                  {selectedKas ===
                                    `${kas.account_code} — ${kas.account_name}` && (
                                    <Check className="h-4 w-4 text-blue-600" />
                                  )}
                                </div>
                              ))}
                            {kasSearch &&
                              !kasAccounts.some((kas) =>
                                `${kas.account_code} ${kas.account_name}`
                                  .toLowerCase()
                                  .includes(kasSearch.toLowerCase()),
                              ) && (
                                <div
                                  className="p-2 hover:bg-gray-100 cursor-pointer rounded border-t"
                                  onClick={() => {
                                    setSelectedKas(kasSearch);
                                    setKasPopoverOpen(false);
                                    setKasSearch("");
                                  }}
                                >
                                  <span className="text-sm text-blue-600">
                                    + Tambah manual: "{kasSearch}"
                                  </span>
                                </div>
                              )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {/* Kredit Account Info - Show only if Kredit */}
                  {paymentType === "Kredit" && (
                    <div className="space-y-2">
                      <Label>Akun Kredit</Label>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-900">
                          {jenisTransaksi === "Penjualan" ||
                          jenisTransaksi === "Pendapatan"
                            ? "✓ Akun Piutang Usaha akan digunakan secara otomatis"
                            : jenisTransaksi === "Pembelian" ||
                                jenisTransaksi === "Pengeluaran"
                              ? "✓ Akun Hutang Usaha akan digunakan secara otomatis"
                              : "✓ Akun Kredit akan dipilih otomatis berdasarkan jenis transaksi"}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* AKUN PENDAPATAN */}
              {visibleFields.showAkunPendapatan && (
                <div className="space-y-2">
                  <Label htmlFor="akun_pendapatan">Akun Pendapatan *</Label>
                  <Popover
                    open={akunPendapatanPopoverOpen}
                    onOpenChange={setAkunPendapatanPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {akunPendapatan || "-- pilih akun pendapatan --"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2">
                      <Input
                        placeholder="Cari akun pendapatan..."
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        className="mb-2"
                      />
                      {/* Tombol Tambah Akun Baru */}
                      <div
                        className="flex items-center gap-2 p-2 mb-2 bg-green-50 hover:bg-green-100 cursor-pointer rounded border border-green-200 text-green-700"
                        onClick={() => {
                          setAkunPendapatanPopoverOpen(false);
                          setCoaContextType("revenue");
                          setNewCOA({
                            account_code: "",
                            account_name: "",
                            account_type: "revenue",
                            normal_balance: "CREDIT",
                            description: "",
                          });
                          setShowAddCOAModal(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="text-sm font-medium">+ Tambah Akun Baru</span>
                      </div>
                      <div className="max-h-64 overflow-auto">
                        {coa
                          .filter((acc) => {
                            // Filter: Kredit normal_balance untuk revenue
                            const isCreditBalance = acc.normal_balance?.toUpperCase() === 'CREDIT' || acc.normal_balance === 'Kredit';
                            // Check for revenue account types (lowercase or capitalized)
                            const accountTypeLower = acc.account_type?.toLowerCase() || '';
                            const isRevenueAccount = 
                              accountTypeLower === 'revenue' ||
                              accountTypeLower === 'pendapatan' ||
                              accountTypeLower.includes('pendapatan') ||
                              accountTypeLower.includes('revenue');
                            const matchesSearch = `${acc.account_code} ${acc.description || acc.account_name}`
                              .toLowerCase()
                              .includes(bankSearch.toLowerCase());
                            
                            return isCreditBalance && isRevenueAccount && matchesSearch;
                          })
                          .map((acc) => (
                            <div
                              key={acc.account_code}
                              className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer rounded"
                              onClick={() => {
                                setAkunPendapatan(acc.account_name);
                                setSelectedRevenueAccount({
                                  id: acc.id,
                                  account_code: acc.account_code,
                                  account_name: acc.account_name,
                                  description: acc.description,
                                });
                                setAkunPendapatanPopoverOpen(false);
                                setBankSearch("");
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {acc.account_code} — {acc.account_name}
                                </span>
                                {acc.description && (
                                  <span className="text-xs text-gray-500">
                                    {acc.description}
                                  </span>
                                )}
                              </div>
                              {akunPendapatan === acc.account_name && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          ))}
                        {coa.filter((acc) => {
                          const isCreditBalance = acc.normal_balance?.toUpperCase() === 'CREDIT' || acc.normal_balance === 'Kredit';
                          const accountTypeLower = acc.account_type?.toLowerCase() || '';
                          const isRevenueAccount = 
                            accountTypeLower === 'revenue' ||
                            accountTypeLower === 'pendapatan' ||
                            accountTypeLower.includes('pendapatan') ||
                            accountTypeLower.includes('revenue');
                          const matchesSearch = `${acc.account_code} ${acc.description || acc.account_name}`
                            .toLowerCase()
                            .includes(bankSearch.toLowerCase());
                          return isCreditBalance && isRevenueAccount && matchesSearch;
                        }).length === 0 && (
                          <div className="p-3 text-center text-gray-500 text-sm">
                            Tidak ada akun ditemukan. Klik "+ Tambah Akun Baru" untuk membuat akun baru.
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* AKUN BEBAN */}
              {visibleFields.showAkunBeban && (
                <div className="space-y-2">
                  <Label htmlFor="akun_beban">Akun Beban *</Label>
                  <Popover
                    open={akunBebanPopoverOpen}
                    onOpenChange={setAkunBebanPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {akunBeban || "-- pilih akun beban --"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2">
                      <Input
                        placeholder="Cari akun beban..."
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        className="mb-2"
                      />
                      {/* Tombol Tambah Akun Baru */}
                      <div
                        className="flex items-center gap-2 p-2 mb-2 bg-blue-50 hover:bg-blue-100 cursor-pointer rounded border border-blue-200 text-blue-700"
                        onClick={() => {
                          setAkunBebanPopoverOpen(false);
                          setCoaContextType("expense");
                          setNewCOA({
                            account_code: "",
                            account_name: "",
                            account_type: "expense",
                            normal_balance: "DEBIT",
                            description: "",
                          });
                          setShowAddCOAModal(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="text-sm font-medium">+ Tambah Akun Baru</span>
                      </div>
                      <div className="max-h-64 overflow-auto">
                        {coa
                          .filter((acc) => {
                            // Get COA prefix based on kategori akuntansi
                            const coaPrefix = getCoaPrefixByKategori();
                            
                            // Filter by COA prefix if kategori akuntansi is selected
                            const matchesPrefix = coaPrefix 
                              ? acc.account_code?.startsWith(coaPrefix)
                              : true;
                            
                            // For beban_operasional, filter expense accounts (6-xxxx)
                            // For uang_muka_karyawan, biaya_dibayar_dimuka, pembelian_aset, filter asset accounts (1-xxxx)
                            // For transfer_internal, filter kas/bank accounts (1-xxxx)
                            
                            const isDebitBalance = acc.normal_balance?.toUpperCase() === 'DEBIT' || acc.normal_balance === 'Debit';
                            const accountTypeLower = acc.account_type?.toLowerCase() || '';
                            
                            // Dynamic filter based on kategori akuntansi
                            let isValidAccountType = false;
                            if (kategoriAkuntansi === 'beban_operasional') {
                              isValidAccountType = 
                                accountTypeLower === 'expense' ||
                                accountTypeLower === 'beban operasional' || 
                                accountTypeLower === 'beban pokok penjualan' ||
                                accountTypeLower.includes('beban') ||
                                accountTypeLower.includes('expense');
                            } else if (kategoriAkuntansi === 'uang_muka_karyawan') {
                              isValidAccountType = 
                                accountTypeLower === 'asset' ||
                                accountTypeLower === 'aset' ||
                                accountTypeLower === 'aset lancar' ||
                                accountTypeLower.includes('piutang') ||
                                accountTypeLower.includes('uang muka');
                            } else if (kategoriAkuntansi === 'biaya_dibayar_dimuka') {
                              isValidAccountType = 
                                accountTypeLower === 'asset' ||
                                accountTypeLower === 'aset' ||
                                accountTypeLower === 'aset lancar' ||
                                accountTypeLower.includes('dibayar dimuka');
                            } else if (kategoriAkuntansi === 'pembelian_aset') {
                              isValidAccountType = 
                                accountTypeLower === 'asset' ||
                                accountTypeLower === 'aset' ||
                                accountTypeLower === 'aset tetap' ||
                                accountTypeLower.includes('peralatan') ||
                                accountTypeLower.includes('kendaraan');
                            } else if (kategoriAkuntansi === 'transfer_internal') {
                              isValidAccountType = 
                                accountTypeLower === 'asset' ||
                                accountTypeLower === 'aset' ||
                                accountTypeLower.includes('kas') ||
                                accountTypeLower.includes('bank');
                            } else {
                              // Default: show expense accounts
                              isValidAccountType = 
                                accountTypeLower === 'expense' ||
                                accountTypeLower === 'beban operasional' || 
                                accountTypeLower.includes('beban') ||
                                accountTypeLower.includes('expense');
                            }
                            
                            const matchesSearch = `${acc.account_code} ${acc.description || acc.account_name}`
                              .toLowerCase()
                              .includes(bankSearch.toLowerCase());
                            
                            return matchesPrefix && isDebitBalance && isValidAccountType && matchesSearch;
                          })
                          .map((acc) => (
                            <div
                              key={acc.account_code}
                              className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer rounded"
                              onClick={() => {
                                setAkunBeban(acc.description || acc.account_name);
                                setSelectedExpenseAccount({
                                  id: acc.id,
                                  account_code: acc.account_code,
                                  account_name: acc.account_name,
                                  account_type: acc.account_type || "Beban",
                                  description: acc.description,
                                });
                                setAkunBebanPopoverOpen(false);
                                setBankSearch("");
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {acc.account_code} — {acc.description || acc.account_name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {acc.account_name}
                                </span>
                              </div>
                              {akunBeban === (acc.description || acc.account_name) && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          ))}
                        {coa.filter((acc) => {
                          const coaPrefix = getCoaPrefixByKategori();
                          const matchesPrefix = coaPrefix ? acc.account_code?.startsWith(coaPrefix) : true;
                          const isDebitBalance = acc.normal_balance?.toUpperCase() === 'DEBIT' || acc.normal_balance === 'Debit';
                          const accountTypeLower = acc.account_type?.toLowerCase() || '';
                          let isValidAccountType = false;
                          if (kategoriAkuntansi === 'beban_operasional') {
                            isValidAccountType = accountTypeLower === 'expense' || accountTypeLower.includes('beban');
                          } else if (['uang_muka_karyawan', 'biaya_dibayar_dimuka', 'pembelian_aset', 'transfer_internal'].includes(kategoriAkuntansi)) {
                            isValidAccountType = accountTypeLower === 'asset' || accountTypeLower === 'aset' || accountTypeLower.includes('aset');
                          } else {
                            isValidAccountType = accountTypeLower === 'expense' || accountTypeLower.includes('beban');
                          }
                          const matchesSearch = `${acc.account_code} ${acc.description || acc.account_name}`
                            .toLowerCase()
                            .includes(bankSearch.toLowerCase());
                          return matchesPrefix && isDebitBalance && isValidAccountType && matchesSearch;
                        }).length === 0 && (
                          <div className="p-3 text-center text-gray-500 text-sm">
                            {!kategoriAkuntansi ? (
                              <span className="text-amber-600">Pilih Kategori Akuntansi terlebih dahulu untuk melihat akun yang sesuai.</span>
                            ) : (
                              <span>Tidak ada akun ditemukan. Klik "+ Tambah Akun Baru" untuk membuat akun baru.</span>
                            )}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* SUMBER PENERIMAAN */}
              {visibleFields.showSumberPenerimaan && (
                <div className="space-y-2">
                  <Label htmlFor="sumber_penerimaan">Sumber Penerimaan *</Label>
                  <Input
                    id="sumber_penerimaan"
                    type="text"
                    value={sumberPenerimaan}
                    onChange={(e) => setSumberPenerimaan(e.target.value)}
                    placeholder="Contoh: Penjualan Produk, Jasa Konsultasi, dll"
                  />
                </div>
              )}

              {/* SUMBER PENGELUARAN */}
              {visibleFields.showSumberPengeluaran && (
                <div className="space-y-2">
                  <Label htmlFor="sumber_pengeluaran">
                    Sumber Pengeluaran *
                  </Label>
                  <Input
                    id="sumber_pengeluaran"
                    type="text"
                    value={sumberPengeluaran}
                    onChange={(e) => setSumberPengeluaran(e.target.value)}
                    placeholder="Contoh: Pembelian Bahan, Biaya Operasional, dll"
                  />
                </div>
              )}

              {/* NAMA PENERIMA */}
              {visibleFields.showNamaPenerima && (
                <div className="space-y-2">
                  <Label htmlFor="nama_penerima">Nama Penerima *</Label>
                  <Popover
                    open={namaPenerimaPopoverOpen}
                    onOpenChange={setNamaPenerimaPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {namaPenerimaSearch || "-- pilih nama penerima --"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2">
                      <Input
                        placeholder="Cari nama penerima..."
                        value={namaPenerimaSearch}
                        onChange={(e) => setNamaPenerimaSearch(e.target.value)}
                        className="mb-2"
                      />
                      <div className="max-h-64 overflow-auto">
                        {users
                          .filter((u) => u.full_name)
                          .filter((u) =>
                            u.full_name
                              .toLowerCase()
                              .includes(namaPenerimaSearch.toLowerCase()),
                          )
                          .map((u) => (
                            <div
                              key={u.id}
                              className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer rounded"
                              onClick={() => {
                                setNamaPenerimaSearch(u.full_name);
                                setNamaPenerimaPopoverOpen(false);
                              }}
                            >
                              <span className="text-sm">{u.full_name}</span>
                              {namaPenerimaSearch === u.full_name && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* NAMA PENGELUARAN */}
              {visibleFields.showNamaPengeluaran && (
                <div className="space-y-2">
                  <Label htmlFor="nama_pengeluaran">Nama Pengeluaran *</Label>
                  <Popover
                    open={namaPengeluaranPopoverOpen}
                    onOpenChange={setNamaPengeluaranPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {namaPengeluaranSearch ||
                          "-- pilih nama pengeluaran --"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2">
                      <Input
                        placeholder="Cari nama pengeluaran..."
                        value={namaPengeluaranSearch}
                        onChange={(e) => {
                          setNamaPengeluaranSearch(e.target.value);
                          setNamaPengeluaran(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setNamaPengeluaranPopoverOpen(false);
                          }
                        }}
                        className="mb-2"
                      />
                      <div className="max-h-64 overflow-auto">
                        {users
                          .filter((u) => u.full_name)
                          .filter((u) =>
                            u.full_name
                              .toLowerCase()
                              .includes(namaPengeluaranSearch.toLowerCase()),
                          )
                          .map((u) => (
                            <div
                              key={u.id}
                              className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer rounded"
                              onClick={() => {
                                setNamaPengeluaranSearch(u.full_name);
                                setNamaPengeluaran(u.full_name);
                                setNamaPengeluaranPopoverOpen(false);
                              }}
                            >
                              <span className="text-sm">{u.full_name}</span>
                              {namaPengeluaranSearch === u.full_name && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          ))}
                        {namaPengeluaranSearch &&
                          !users.some(
                            (u) =>
                              u.full_name?.toLowerCase() ===
                              namaPengeluaranSearch.toLowerCase(),
                          ) && (
                            <div className="p-2 text-sm text-gray-500 italic">
                              Tekan Enter untuk menggunakan "
                              {namaPengeluaranSearch}" sebagai input manual
                            </div>
                          )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* NAMA PEMILIK */}
              {visibleFields.showNamaPemilik && (
                <div className="space-y-2">
                  <Label htmlFor="nama_pemilik">Nama Pemilik *</Label>
                  <Input
                    id="nama_pemilik"
                    type="text"
                    value={namaPemilik}
                    onChange={(e) => setNamaPemilik(e.target.value)}
                    placeholder="Nama pemilik yang mengambil prive"
                  />
                </div>
              )}

              {/* NAMA PENYUMBANG */}
              {visibleFields.showNamaPenyumbang && (
                <div className="space-y-2">
                  <Label htmlFor="nama_penyumbang">Nama Penyumbang *</Label>
                  <Input
                    id="nama_penyumbang"
                    type="text"
                    value={namaPenyumbang}
                    onChange={(e) => setNamaPenyumbang(e.target.value)}
                    placeholder="Nama penyumbang modal"
                  />
                </div>
              )}

              {/* ROW 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shouldShowField("kategoriLayanan") && jenisTransaksi !== "Penjualan" && (
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select
                      onValueChange={setSelectedCategory}
                      value={selectedCategory}
                      disabled={!jenisTransaksi}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((item) => {
                          const config =
                            TRANSACTION_CATEGORIES[
                              jenisTransaksi as keyof typeof TRANSACTION_CATEGORIES
                            ];
                          if (!config) return null;
                          return (
                            <SelectItem
                              key={item.id}
                              value={item[config.sourceValueKey]}
                            >
                              {item[config.sourceLabelKey]}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {jenisTransaksi && availableCategories.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {availableCategories.length} kategori tersedia
                      </p>
                    )}
                  </div>
                )}

                {shouldShowField("jenisLayanan") && jenisTransaksi !== "Penjualan" && (
                  <div className="space-y-2">
                    <Label htmlFor="jenis_layanan">Jenis Layanan</Label>
                    <Select
                      value={jenisLayanan}
                      onValueChange={setJenisLayanan}
                      disabled={!kategori || serviceTypes.length === 0}
                    >
                      <SelectTrigger id="jenis_layanan">
                        <SelectValue
                          placeholder={
                            kategori
                              ? "-- pilih --"
                              : "Pilih kategori terlebih dahulu"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes
                          .filter((type) => type)
                          .map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {kategori && serviceTypes.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {serviceTypes.length} jenis layanan tersedia
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ITEM & DESCRIPTION */}
              {shouldShowField("itemBarang") && jenisTransaksi !== "Penjualan" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="item_barang">Item Barang</Label>
                    <div className="flex gap-2">
                      <Popover
                        open={openItemPopover}
                        onOpenChange={setOpenItemPopover}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="flex-1 justify-between"
                          >
                            {itemName || "-- pilih item --"}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-[400px] p-2">
                          <Input
                            placeholder="Ketik untuk mencari item..."
                            value={itemSearchKeyword}
                            onChange={(e) =>
                              setItemSearchKeyword(e.target.value)
                            }
                            className="mb-2"
                          />

                          <div className="max-h-[300px] overflow-auto">
                            {safeFilteredItems
                              .filter((i) =>
                                (i.item_name || "")
                                  .toLowerCase()
                                  .includes(itemSearchKeyword.toLowerCase()),
                              )
                              .map((i, index) => (
                                <div
                                  key={index}
                                  className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
                                  onClick={() => {
                                    setItemName(i.item_name);
                                    setDescription("");
                                    setOpenItemPopover(false);
                                    setItemSearchKeyword("");
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      itemName === i.item_name
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                  {i.item_name}
                                </div>
                              ))}

                            {safeFilteredItems.filter((i) =>
                              (i.item_name || "")
                                .toLowerCase()
                                .includes(itemSearchKeyword.toLowerCase()),
                            ).length === 0 && (
                              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                Tidak ada item ditemukan.
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Button
                        type="button"
                        size="icon"
                        onClick={() => setOpenStockItemModal(true)}
                        title="Tambah Item & Stock Sekaligus"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {shouldShowField("description") && (
                    <div className="space-y-2">
                      <Label htmlFor="description">Deskripsi</Label>
                      <div className="flex gap-2">
                        <Popover
                          open={openDescriptionPopover}
                          onOpenChange={setOpenDescriptionPopover}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="flex-1 justify-between"
                              disabled={!itemName}
                            >
                              {description ||
                                (itemName
                                  ? "-- pilih deskripsi --"
                                  : "Pilih item terlebih dahulu")}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="w-[400px] p-2">
                            <Input
                              placeholder="Ketik untuk mencari deskripsi..."
                              value={descriptionSearchKeyword}
                              onChange={(e) =>
                                setDescriptionSearchKeyword(e.target.value)
                              }
                              className="mb-2"
                            />

                            <div className="max-h-[300px] overflow-auto">
                              {safeFilteredDescriptions
                                .filter((d) =>
                                  (d.description || "")
                                    .toLowerCase()
                                    .includes(
                                      descriptionSearchKeyword.toLowerCase(),
                                    ),
                                )
                                .map((d, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
                                    onClick={() => {
                                      setDescription(d.description);
                                      setOpenDescriptionPopover(false);
                                      setDescriptionSearchKeyword("");
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        description === d.description
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }`}
                                    />
                                    {d.description}
                                  </div>
                                ))}

                              {safeFilteredDescriptions.filter((d) =>
                                (d.description || "")
                                  .toLowerCase()
                                  .includes(
                                    descriptionSearchKeyword.toLowerCase(),
                                  ),
                              ).length === 0 && (
                                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                  Tidak ada deskripsi ditemukan.
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STOCK INFORMATION */}
              {shouldShowField("itemBarang") && itemName && description && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    📦 Informasi Stock
                  </h4>
                  {loadingStock ? (
                    <p className="text-sm text-gray-600">
                      Memuat data stock...
                    </p>
                  ) : stockInfo ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Sisa Stock:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {stockInfo.quantity || 0} {stockInfo.unit || "pcs"}
                        </span>
                      </div>
                      {stockInfo.warehouses && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Gudang:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {stockInfo.warehouses.name} (
                            {stockInfo.warehouses.code})
                          </span>
                        </div>
                      )}
                      {stockInfo.location && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Lokasi:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {stockInfo.location}
                          </span>
                        </div>
                      )}
                      {stockInfo.harga_jual && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Harga Jual (Gudang):
                          </span>
                          <span className="ml-2 text-gray-900">
                            Rp{" "}
                            {new Intl.NumberFormat("id-ID").format(
                              stockInfo.harga_jual,
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600">
                      ⚠️ Stock tidak ditemukan untuk item dan deskripsi ini
                    </p>
                  )}
                </div>
              )}

              {/* QUANTITY & HARGA JUAL - Only for Penjualan */}
              {jenisTransaksi === "Penjualan" && (
                <div className="space-y-4">
                  {/* Multiple Items Section */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Item Penjualan</Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setSalesItems([
                            ...salesItems,
                            {
                              id: Date.now().toString(),
                              itemName: "",
                              jenisBarang: "",
                              quantity: "1",
                              nominal: "0",
                              stockId: "",
                              sellingPrice: 0,
                              tipeItem: transactionItemType,
                            },
                          ]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Item
                      </Button>
                    </div>

                    {salesItems.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Klik "Tambah Item" untuk menambahkan item penjualan
                      </p>
                    )}

                    {salesItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 border rounded-md bg-gray-50"
                      >
                        <div className="space-y-2">
                          <Label>Item Name *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                              >
                                {item.itemName || "-- pilih atau ketik item --"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-2">
                              <Input
                                placeholder="Cari atau ketik item..."
                                value={stockItemSearch}
                                onChange={(e) => setStockItemSearch(e.target.value)}
                                className="mb-2"
                              />
                              <div className="max-h-64 overflow-auto">
                                {(transactionItemType === "Barang" ? stockItems : serviceItems)
                                  .filter((itemData) => {
                                    const searchName = transactionItemType === "Barang" 
                                      ? (itemData.item_name ?? "")
                                      : (itemData.service_name ?? "");
                                    return searchName
                                      .toLowerCase()
                                      .includes((stockItemSearch ?? "").toLowerCase());
                                  })
                                  .map((itemData) => (
                                    <div
                                      key={itemData.id}
                                      className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer rounded"
                                      onClick={() => {
                                        console.log("Raw itemData:", itemData);
                                        console.log("transactionItemType:", transactionItemType);
                                        
                                        console.log("🔍 Raw itemData from DB:", itemData);
                                        console.log("🔍 purchase_price value:", itemData.purchase_price);
                                        console.log("🔍 cost_per_unit value:", itemData.cost_per_unit);
                                        
                                        const updated = [...salesItems];
                                        updated[index].stockId = itemData.id;
                                        updated[index].tipeItem = transactionItemType;
                                        
                                        if (transactionItemType === "Barang") {
                                          updated[index].itemName = itemData.item_name || "";
                                          updated[index].jenisBarang = itemData.jenis_barang || "";
                                          updated[index].sellingPrice = itemData.selling_price || 0;
                                          // Use cost_per_unit if purchase_price is not available
                                          const purchasePrice = itemData.purchase_price || itemData.cost_per_unit || 0;
                                          updated[index].purchasePrice = purchasePrice;
                                          console.log("🔍 Final purchasePrice set to:", purchasePrice);
                                        } else {
                                          // Jasa
                                          updated[index].itemName = itemData.service_name || "";
                                          updated[index].jenisBarang = itemData.service_type || "";
                                          updated[index].sellingPrice = itemData.price || 0;
                                          updated[index].purchasePrice = 0;
                                        }
                                        
                                        const qty = parseInt(updated[index].quantity) || 1;
                                        updated[index].nominal = ((updated[index].sellingPrice || 0) * qty).toString();
                                        
                                        console.log("✅ Selected item final state:", {
                                          type: transactionItemType,
                                          itemName: updated[index].itemName,
                                          jenisBarang: updated[index].jenisBarang,
                                          price: updated[index].sellingPrice,
                                          purchasePrice: updated[index].purchasePrice,
                                          quantity: qty,
                                          nominal: updated[index].nominal
                                        });
                                        
                                        setSalesItems(updated);
                                        setStockItemSearch("");
                                      }}
                                    >
                                      <span className="text-sm">
                                        {transactionItemType === "Barang" ? itemData.item_name : itemData.service_name}
                                      </span>
                                      {item.stockId === itemData.id && (
                                        <Check className="h-4 w-4 text-blue-600" />
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>Jenis *</Label>
                          <Input
                            value={item.jenisBarang || ""}
                            disabled
                            placeholder="Auto-filled"
                            className="bg-gray-100"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...salesItems];
                              updated[index].quantity = e.target.value;
                              // Recalculate nominal
                              const qty = parseInt(e.target.value) || 1;
                              const price = updated[index].sellingPrice || 0;
                              updated[index].nominal = (price * qty).toString();
                              setSalesItems(updated);
                            }}
                            placeholder="1"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Harga Beli</Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.purchasePrice || 0}
                            disabled
                            placeholder="Auto-filled"
                            className="bg-gray-100"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Nominal *</Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.nominal || ""}
                            disabled
                            placeholder="Auto-calculated"
                            className="bg-gray-100"
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              setSalesItems(
                                salesItems.filter((_, i) => i !== index)
                              );
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QUANTITY, HARGA BELI & PPN - Only for Pembelian Barang */}
              {jenisTransaksi === "Pembelian Barang" &&
                itemName &&
                description && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity_beli">Quantity *</Label>
                        <Input
                          id="quantity_beli"
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => {
                            setQuantity(e.target.value);
                            // Auto-calculate nominal with PPN
                            if (hargaBeli) {
                              const subtotal =
                                Number(e.target.value) * Number(hargaBeli);
                              const ppn =
                                subtotal * (Number(ppnPercentage) / 100);
                              setPpnAmount(ppn.toString());
                              setNominal((subtotal + ppn).toString());
                            }
                          }}
                          placeholder="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="harga_beli">
                          Harga Beli per Unit *
                        </Label>
                        <Input
                          id="harga_beli"
                          type="number"
                          value={hargaBeli}
                          onChange={(e) => {
                            setHargaBeli(e.target.value);
                            // Auto-calculate nominal with PPN
                            if (quantity) {
                              const subtotal =
                                Number(quantity) * Number(e.target.value);
                              const ppn =
                                subtotal * (Number(ppnPercentage) / 100);
                              setPpnAmount(ppn.toString());
                              setNominal((subtotal + ppn).toString());
                            }
                          }}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ppn_percentage">PPN (%) *</Label>
                        <Input
                          id="ppn_percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={ppnPercentage}
                          onChange={(e) => {
                            setPpnPercentage(e.target.value);
                            // Recalculate PPN and total
                            if (quantity && hargaBeli) {
                              const subtotal =
                                Number(quantity) * Number(hargaBeli);
                              const ppn =
                                subtotal * (Number(e.target.value) / 100);
                              setPpnAmount(ppn.toString());
                              setNominal((subtotal + ppn).toString());
                            }
                          }}
                          placeholder="11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ppn_amount">Jumlah PPN</Label>
                        <Input
                          id="ppn_amount"
                          type="number"
                          value={ppnAmount}
                          readOnly
                          className="bg-gray-100"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">
                            Subtotal:
                          </span>
                          <span className="ml-2 text-gray-900">
                            Rp{" "}
                            {new Intl.NumberFormat("id-ID").format(
                              Number(quantity || 0) * Number(hargaBeli || 0),
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            PPN ({ppnPercentage}%):
                          </span>
                          <span className="ml-2 text-gray-900">
                            Rp{" "}
                            {new Intl.NumberFormat("id-ID").format(
                              Number(ppnAmount || 0),
                            )}
                          </span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-blue-300">
                          <span className="font-bold text-gray-900 text-lg">
                            Total:
                          </span>
                          <span className="ml-2 text-blue-700 font-bold text-lg">
                            Rp{" "}
                            {new Intl.NumberFormat("id-ID").format(
                              Number(quantity || 0) * Number(hargaBeli || 0) +
                                Number(ppnAmount || 0),
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* CONSIGNEE ONLY - Customer removed */}
              {/* Removed for Penjualan */}

              {(jenisTransaksi === "Pembelian Barang" ||
                jenisTransaksi === "Pembelian Jasa") && (
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Popover
                    open={supplierPopoverOpen}
                    onOpenChange={setSupplierPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {supplier || "-- pilih atau ketik supplier --"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2">
                      <Input
                        placeholder="Cari atau ketik supplier baru..."
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                        className="mb-2"
                      />
                      <div className="max-h-64 overflow-auto">
                        {suppliers
                          .filter((s) => s.supplier_name)
                          .filter((s) =>
                            s.supplier_name
                              .toLowerCase()
                              .includes(supplierSearch.toLowerCase()),
                          )
                          .map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer rounded"
                              onClick={() => {
                                setSupplier(s.supplier_name);
                                setSupplierPopoverOpen(false);
                                setSupplierSearch("");
                              }}
                            >
                              <span className="text-sm">{s.supplier_name}</span>
                              {supplier === s.supplier_name && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          ))}
                        {supplierSearch &&
                          !suppliers.some((s) =>
                            (s.supplier_name ?? "")
                              .toLowerCase()
                              .includes((supplierSearch ?? "").toLowerCase()),
                          ) && (
                            <div
                              className="p-2 hover:bg-gray-100 cursor-pointer rounded border-t"
                              onClick={() => {
                                setSupplier(supplierSearch);
                                setSupplierPopoverOpen(false);
                                setSupplierSearch("");
                              }}
                            >
                              <span className="text-sm text-blue-600">
                                + Tambah manual: "{supplierSearch}"
                              </span>
                            </div>
                          )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* LOAN FIELDS - Show for Pinjaman Masuk */}
              {jenisTransaksi === "Pinjaman Masuk" && (
                <div className="space-y-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                    💰 Informasi Pinjaman
                  </h4>

                  {/* Borrower Name */}
                  <div className="space-y-2">
                    <Label htmlFor="borrower">Nama Peminjam *</Label>
                    <div className="flex gap-2">
                      <Select
                        value={selectedBorrower}
                        onValueChange={setSelectedBorrower}
                      >
                        <SelectTrigger id="borrower" className="flex-1">
                          <SelectValue placeholder="-- pilih peminjam --" />
                        </SelectTrigger>
                        <SelectContent>
                          {borrowers.length === 0 ? (
                            <SelectItem value="no-data" disabled>
                              Tidak ada data peminjam
                            </SelectItem>
                          ) : (
                            borrowers
                              .filter((b) => b.borrower_name)
                              .map((b) => (
                                <SelectItem key={b.id} value={b.borrower_name}>
                                  {b.borrower_name} ({b.borrower_code})
                                </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="icon"
                        onClick={() => setOpenBorrowerModal(true)}
                        title="Tambah Peminjam Baru"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Loan Type */}
                  <div className="space-y-2">
                    <Label htmlFor="loan_type">Tipe Pinjaman</Label>
                    <Select value={loanType} onValueChange={setLoanType}>
                      <SelectTrigger id="loan_type">
                        <SelectValue placeholder="-- pilih tipe --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bank">Bank</SelectItem>
                        <SelectItem value="Individu">Individu</SelectItem>
                        <SelectItem value="Perusahaan">Perusahaan</SelectItem>
                        <SelectItem value="Lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Interest Rate */}
                    <div className="space-y-2">
                      <Label htmlFor="interest_rate">Bunga (%) *</Label>
                      <Input
                        id="interest_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    {/* Loan Term */}
                    <div className="space-y-2">
                      <Label htmlFor="loan_term">Lama Pinjaman (Bulan) *</Label>
                      <Input
                        id="loan_term"
                        type="number"
                        min="1"
                        value={loanTermMonths}
                        onChange={(e) => {
                          setLoanTermMonths(e.target.value);
                          // Auto-calculate maturity date
                          if (tanggal && e.target.value) {
                            const date = new Date(tanggal);
                            date.setMonth(
                              date.getMonth() + parseInt(e.target.value),
                            );
                            setMaturityDate(date.toISOString().split("T")[0]);
                          }
                        }}
                        placeholder="12"
                      />
                    </div>
                  </div>

                  {/* Payment Schedule */}
                  <div className="space-y-2">
                    <Label htmlFor="payment_schedule">
                      Jadwal Pembayaran *
                    </Label>
                    <Select
                      value={paymentSchedule}
                      onValueChange={setPaymentSchedule}
                    >
                      <SelectTrigger id="payment_schedule">
                        <SelectValue placeholder="-- pilih --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bulanan">
                          Bulanan (Cicilan)
                        </SelectItem>
                        <SelectItem value="Jatuh Tempo">
                          Jatuh Tempo (Lump Sum)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Maturity Date */}
                  <div className="space-y-2">
                    <Label htmlFor="maturity_date">
                      Jatuh Tempo / Maturity Date
                    </Label>
                    <Input
                      id="maturity_date"
                      type="date"
                      value={maturityDate}
                      onChange={(e) => setMaturityDate(e.target.value)}
                      className="bg-gray-100"
                    />
                    {maturityDate && (
                      <p className="text-xs text-purple-600">
                        📅 Jatuh tempo:{" "}
                        {new Date(maturityDate).toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>

                  {/* Installment Schedule Display */}
                  {installmentSchedule.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h4 className="font-semibold text-sm text-purple-900">
                        📊 Jadwal Cicilan
                      </h4>
                      <div className="max-h-64 overflow-y-auto border border-purple-200 rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-purple-100 sticky top-0">
                            <tr>
                              <th className="px-2 py-1 text-left">Cicilan</th>
                              <th className="px-2 py-1 text-left">
                                Jatuh Tempo
                              </th>
                              <th className="px-2 py-1 text-right">Pokok</th>
                              <th className="px-2 py-1 text-right">Bunga</th>
                              <th className="px-2 py-1 text-right">Total</th>
                              <th className="px-2 py-1 text-right">Sisa</th>
                            </tr>
                          </thead>
                          <tbody>
                            {installmentSchedule.map((inst, idx) => (
                              <tr
                                key={idx}
                                className="border-t border-purple-100"
                              >
                                <td className="px-2 py-1">
                                  {inst.installment}
                                </td>
                                <td className="px-2 py-1">
                                  {new Date(inst.dueDate).toLocaleDateString(
                                    "id-ID",
                                  )}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {new Intl.NumberFormat("id-ID").format(
                                    inst.principalAmount,
                                  )}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {new Intl.NumberFormat("id-ID").format(
                                    inst.interestAmount,
                                  )}
                                </td>
                                <td className="px-2 py-1 text-right font-semibold">
                                  {new Intl.NumberFormat("id-ID").format(
                                    inst.totalPayment,
                                  )}
                                </td>
                                <td className="px-2 py-1 text-right text-gray-600">
                                  {new Intl.NumberFormat("id-ID").format(
                                    inst.remainingBalance,
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-purple-50 font-semibold">
                            <tr>
                              <td colSpan={2} className="px-2 py-1">
                                Total
                              </td>
                              <td className="px-2 py-1 text-right">
                                {new Intl.NumberFormat("id-ID").format(
                                  installmentSchedule.reduce(
                                    (sum, inst) => sum + inst.principalAmount,
                                    0,
                                  ),
                                )}
                              </td>
                              <td className="px-2 py-1 text-right">
                                {new Intl.NumberFormat("id-ID").format(
                                  installmentSchedule.reduce(
                                    (sum, inst) => sum + inst.interestAmount,
                                    0,
                                  ),
                                )}
                              </td>
                              <td className="px-2 py-1 text-right">
                                {new Intl.NumberFormat("id-ID").format(
                                  installmentSchedule.reduce(
                                    (sum, inst) => sum + inst.totalPayment,
                                    0,
                                  ),
                                )}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Payment Details for Pembayaran Pinjaman */}
                  {jenisTransaksi === "Pembayaran Pinjaman" && (
                    <div className="space-y-4 mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-sm text-yellow-900">
                        💳 Detail Pembayaran
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="principal_payment">
                            Pembayaran Pokok (Rp)
                          </Label>
                          <Input
                            id="principal_payment"
                            type="number"
                            value={principalAmount}
                            onChange={(e) => setPrincipalAmount(e.target.value)}
                            placeholder="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="interest_payment">
                            Pembayaran Bunga (Rp)
                          </Label>
                          <Input
                            id="interest_payment"
                            type="number"
                            value={interestAmount}
                            onChange={(e) => setInterestAmount(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Late Fee Calculation Section */}
                      <div className="space-y-4 bg-red-50 border border-red-200 rounded-lg p-4">
                        <h5 className="font-semibold text-sm text-red-900">
                          ⏰ Perhitungan Denda Keterlambatan
                        </h5>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="actual_payment_date">
                              Tanggal Pembayaran Aktual
                            </Label>
                            <Input
                              id="actual_payment_date"
                              type="date"
                              value={actualPaymentDate}
                              onChange={(e) => {
                                setActualPaymentDate(e.target.value);
                                // Auto-calculate days late and late fee
                                if (e.target.value && tanggal) {
                                  const due = new Date(tanggal);
                                  const payment = new Date(e.target.value);
                                  const days = Math.floor(
                                    (payment.getTime() - due.getTime()) /
                                      (1000 * 60 * 60 * 24),
                                  );
                                  const daysLateCalc = Math.max(0, days);
                                  setDaysLate(daysLateCalc.toString());

                                  // Calculate late fee
                                  if (daysLateCalc > 0 && principalAmount) {
                                    const installmentAmount =
                                      Number(principalAmount) +
                                      Number(interestAmount);
                                    const fee =
                                      installmentAmount *
                                      (Number(lateFeePercentage) / 100) *
                                      daysLateCalc;
                                    setLateFee(fee.toFixed(2));
                                  } else {
                                    setLateFee("0");
                                  }
                                }
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="late_fee_percentage">
                              Persentase Denda per Hari (%)
                            </Label>
                            <Input
                              id="late_fee_percentage"
                              type="number"
                              step="0.01"
                              value={lateFeePercentage}
                              onChange={(e) => {
                                setLateFeePercentage(e.target.value);
                                // Recalculate late fee
                                if (Number(daysLate) > 0 && principalAmount) {
                                  const installmentAmount =
                                    Number(principalAmount) +
                                    Number(interestAmount);
                                  const fee =
                                    installmentAmount *
                                    (Number(e.target.value) / 100) *
                                    Number(daysLate);
                                  setLateFee(fee.toFixed(2));
                                }
                              }}
                              placeholder="0.1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="days_late">
                              Hari Keterlambatan
                            </Label>
                            <Input
                              id="days_late"
                              type="number"
                              value={daysLate}
                              readOnly
                              className="bg-gray-100"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="late_fee">
                              Denda Keterlambatan (Rp)
                            </Label>
                            <Input
                              id="late_fee"
                              type="number"
                              value={lateFee}
                              onChange={(e) => setLateFee(e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {Number(daysLate) > 0 && (
                          <div className="bg-red-100 p-3 rounded">
                            <p className="text-xs text-red-800">
                              📊 Perhitungan: (Pokok + Bunga) ×{" "}
                              {lateFeePercentage}% × {daysLate} hari = Rp{" "}
                              {new Intl.NumberFormat("id-ID").format(
                                Number(lateFee),
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Tax Section */}
                      <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="font-semibold text-sm text-blue-900">
                          🧾 Pajak
                        </h5>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="tax_type">Jenis Pajak</Label>
                            <Select value={taxType} onValueChange={setTaxType}>
                              <SelectTrigger id="tax_type">
                                <SelectValue placeholder="-- pilih --" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PPh21">
                                  PPh 21 (Gaji)
                                </SelectItem>
                                <SelectItem value="PPh23">
                                  PPh 23 (Jasa)
                                </SelectItem>
                                <SelectItem value="PPh4(2)">
                                  PPh 4(2) (Final)
                                </SelectItem>
                                <SelectItem value="PPN">PPN</SelectItem>
                                <SelectItem value="PPnBM">PPnBM</SelectItem>
                                <SelectItem value="Lainnya">Lainnya</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="tax_percentage">
                              Persentase Pajak (%)
                            </Label>
                            <Input
                              id="tax_percentage"
                              type="number"
                              step="0.01"
                              value={taxPercentage}
                              onChange={(e) => {
                                setTaxPercentage(e.target.value);
                                // Auto-calculate tax amount
                                const baseAmount =
                                  Number(principalAmount) +
                                  Number(interestAmount);
                                const tax =
                                  baseAmount * (Number(e.target.value) / 100);
                                setTaxAmount(tax.toFixed(2));
                              }}
                              placeholder="0"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="tax_amount">
                              Jumlah Pajak (Rp)
                            </Label>
                            <Input
                              id="tax_amount"
                              type="number"
                              value={taxAmount}
                              onChange={(e) => setTaxAmount(e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {Number(taxAmount) > 0 && (
                          <div className="bg-blue-100 p-3 rounded">
                            <p className="text-xs text-blue-800">
                              📊 Perhitungan: (Pokok + Bunga) × {taxPercentage}%
                              = Rp{" "}
                              {new Intl.NumberFormat("id-ID").format(
                                Number(taxAmount),
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="bg-yellow-100 p-3 rounded">
                        <p className="text-sm font-semibold text-yellow-900">
                          Total Pembayaran: Rp{" "}
                          {new Intl.NumberFormat("id-ID").format(
                            Number(principalAmount) +
                              Number(interestAmount) +
                              Number(lateFee) +
                              Number(taxAmount),
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LOAN PAYMENT FIELDS - Show for Pembayaran Pinjaman */}
              {jenisTransaksi === "Pembayaran Pinjaman" && (
                <div className="space-y-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 flex items-center gap-2">
                    💳 Pembayaran Pinjaman
                  </h4>

                  {/* Select Active Loan */}
                  <div className="space-y-2">
                    <Label htmlFor="select_loan">Pilih Pinjaman *</Label>
                    <Select
                      value={selectedBorrower}
                      onValueChange={async (value) => {
                        setSelectedBorrower(value);

                        // Load loan details from selected borrower
                        const { data: loans } = await supabase
                          .from("loans")
                          .select("*")
                          .eq("lender_name", value)
                          .eq("status", "Aktif")
                          .order("loan_date", { ascending: false })
                          .limit(1);

                        if (loans && loans.length > 0) {
                          const loan = loans[0];

                          // Auto-fill loan details
                          setLoanType(loan.lender_type || "");
                          setInterestRate(
                            loan.interest_rate?.toString() || "0",
                          );
                          setLoanTermMonths(
                            loan.loan_term_months?.toString() || "12",
                          );
                          setMaturityDate(loan.maturity_date || "");
                          setPaymentSchedule(
                            loan.payment_schedule || "Bulanan",
                          );
                          setLateFeePercentage(
                            loan.late_fee_percentage?.toString() || "0.1",
                          );
                          setTaxType(loan.tax_type || "");
                          setTaxPercentage(
                            loan.tax_percentage?.toString() || "0",
                          );

                          // Set nominal to principal amount to trigger schedule calculation
                          setNominal(loan.principal_amount?.toString() || "0");

                          // Load installment schedule from database
                          const { data: installments } = await supabase
                            .from("loan_installments")
                            .select("*")
                            .eq("loan_id", loan.id)
                            .order("installment_number", { ascending: true });

                          if (installments && installments.length > 0) {
                            // Map installments to schedule format
                            const schedule = installments.map((inst) => ({
                              installment: inst.installment_number,
                              dueDate: inst.due_date,
                              principalAmount: inst.principal_amount,
                              interestAmount: inst.interest_amount,
                              totalPayment: inst.total_amount,
                              remainingBalance: inst.remaining_balance,
                              status: inst.status,
                              paidAmount: inst.paid_amount || 0,
                            }));
                            setInstallmentSchedule(schedule);

                            // Find next unpaid installment and auto-fill payment amounts
                            const nextUnpaid = installments.find(
                              (inst) => inst.status === "Belum Bayar",
                            );
                            if (nextUnpaid) {
                              setPrincipalAmount(
                                nextUnpaid.principal_amount?.toString() || "0",
                              );
                              setInterestAmount(
                                nextUnpaid.interest_amount?.toString() || "0",
                              );
                              setTanggal(nextUnpaid.due_date || "");
                            }
                          }

                          // Load borrower default settings
                          const { data: borrower } = await supabase
                            .from("borrowers")
                            .select("*")
                            .eq("borrower_name", value)
                            .single();

                          if (borrower) {
                            if (!loan.late_fee_percentage) {
                              setLateFeePercentage(
                                borrower.default_late_fee_percentage?.toString() ||
                                  "0.1",
                              );
                            }
                            if (!loan.tax_type) {
                              setTaxType(borrower.default_tax_type || "");
                              setTaxPercentage(
                                borrower.default_tax_percentage?.toString() ||
                                  "0",
                              );
                            }
                          }
                        }
                      }}
                    >
                      <SelectTrigger id="select_loan">
                        <SelectValue placeholder="-- pilih pinjaman --" />
                      </SelectTrigger>
                      <SelectContent>
                        {borrowers.length === 0 ? (
                          <SelectItem value="no-data" disabled>
                            Tidak ada pinjaman aktif
                          </SelectItem>
                        ) : (
                          borrowers
                            .filter((b) => b.borrower_name)
                            .map((b) => (
                              <SelectItem key={b.id} value={b.borrower_name}>
                                {b.borrower_name} ({b.borrower_code})
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-600">
                      💡 Data pinjaman akan otomatis terisi dari pinjaman masuk
                    </p>
                  </div>

                  {/* Display Loan Info (Read-only) */}
                  {selectedBorrower && (
                    <div className="space-y-3 bg-white p-3 rounded border border-green-300">
                      <h5 className="font-semibold text-sm text-green-900">
                        📋 Detail Pinjaman
                      </h5>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Tipe:</span>
                          <span className="ml-2 font-medium">
                            {loanType || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Bunga:</span>
                          <span className="ml-2 font-medium">
                            {interestRate}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Tenor:</span>
                          <span className="ml-2 font-medium">
                            {loanTermMonths} bulan
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Jadwal:</span>
                          <span className="ml-2 font-medium">
                            {paymentSchedule}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Denda/hari:</span>
                          <span className="ml-2 font-medium">
                            {lateFeePercentage}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Pajak:</span>
                          <span className="ml-2 font-medium">
                            {taxType || "-"} ({taxPercentage}%)
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Nilai Pinjaman:</span>
                          <span className="ml-2 font-medium">
                            Rp{" "}
                            {new Intl.NumberFormat("id-ID").format(
                              Number(nominal),
                            )}
                          </span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-green-200">
                          <span className="text-gray-600">Sisa Pinjaman:</span>
                          <span className="ml-2 font-bold text-green-700">
                            Rp{" "}
                            {new Intl.NumberFormat("id-ID").format(
                              installmentSchedule
                                .filter(
                                  (inst: any) =>
                                    inst.status === "Belum Bayar" ||
                                    inst.status === "Sebagian",
                                )
                                .reduce((sum: number, inst: any) => {
                                  // For partial payment, calculate remaining amount
                                  if (inst.status === "Sebagian") {
                                    return (
                                      sum +
                                      (inst.totalPayment -
                                        (inst.paidAmount || 0))
                                    );
                                  }
                                  return sum + inst.totalPayment;
                                }, 0),
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Display Installment Schedule */}
                  {selectedBorrower && installmentSchedule.length > 0 && (
                    <div className="space-y-3 bg-white p-3 rounded border border-green-300">
                      <div className="flex justify-between items-center">
                        <h5 className="font-semibold text-sm text-green-900">
                          📅 Jadwal Cicilan
                        </h5>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              // Refresh loan data
                              const { data: loans } = await supabase
                                .from("loans")
                                .select("*")
                                .eq("lender_name", selectedBorrower)
                                .eq("status", "Aktif")
                                .order("loan_date", { ascending: false })
                                .limit(1);

                              if (loans && loans.length > 0) {
                                const loan = loans[0];

                                // Reload installment schedule
                                const { data: installments } = await supabase
                                  .from("loan_installments")
                                  .select("*")
                                  .eq("loan_id", loan.id)
                                  .order("installment_number", {
                                    ascending: true,
                                  });

                                if (installments && installments.length > 0) {
                                  const schedule = installments.map((inst) => ({
                                    installment: inst.installment_number,
                                    dueDate: inst.due_date,
                                    principalAmount: inst.principal_amount,
                                    interestAmount: inst.interest_amount,
                                    totalPayment: inst.total_amount,
                                    remainingBalance: inst.remaining_balance,
                                    status: inst.status,
                                    paidAmount: inst.paid_amount || 0,
                                  }));
                                  setInstallmentSchedule(schedule);

                                  toast({
                                    title: "✅ Data Diperbarui",
                                    description:
                                      "Jadwal cicilan berhasil di-refresh",
                                  });
                                }
                              }
                            }}
                          >
                            🔄 Refresh
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              if (
                                !confirm(
                                  "⚠️ Reset semua data pembayaran cicilan? Data yang sudah dibayar akan dikembalikan ke status 'Belum Bayar'.",
                                )
                              ) {
                                return;
                              }

                              // Get current loan
                              const { data: loans } = await supabase
                                .from("loans")
                                .select("*")
                                .eq("lender_name", selectedBorrower)
                                .eq("status", "Aktif")
                                .order("loan_date", { ascending: false })
                                .limit(1);

                              if (loans && loans.length > 0) {
                                const loan = loans[0];

                                // Reset all installments to unpaid
                                await supabase
                                  .from("loan_installments")
                                  .update({
                                    paid_amount: 0,
                                    status: "Belum Bayar",
                                    actual_payment_date: null,
                                    payment_date: null,
                                    days_late: 0,
                                    late_fee: 0,
                                    tax_amount: 0,
                                  })
                                  .eq("loan_id", loan.id);

                                // Reload installment schedule
                                const { data: installments } = await supabase
                                  .from("loan_installments")
                                  .select("*")
                                  .eq("loan_id", loan.id)
                                  .order("installment_number", {
                                    ascending: true,
                                  });

                                if (installments && installments.length > 0) {
                                  const schedule = installments.map((inst) => ({
                                    installment: inst.installment_number,
                                    dueDate: inst.due_date,
                                    principalAmount: inst.principal_amount,
                                    interestAmount: inst.interest_amount,
                                    totalPayment: inst.total_amount,
                                    remainingBalance: inst.remaining_balance,
                                    status: inst.status,
                                    paidAmount: inst.paid_amount || 0,
                                  }));
                                  setInstallmentSchedule(schedule);

                                  toast({
                                    title: "✅ Data Direset",
                                    description:
                                      "Semua cicilan dikembalikan ke status 'Belum Bayar'",
                                  });
                                }
                              }
                            }}
                          >
                            🔄 Reset Data
                          </Button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-green-100">
                            <tr>
                              <th className="p-2 text-left">Cicilan</th>
                              <th className="p-2 text-left">Jatuh Tempo</th>
                              <th className="p-2 text-right">Pokok</th>
                              <th className="p-2 text-right">Bunga</th>
                              <th className="p-2 text-right">Total</th>
                              <th className="p-2 text-right">Terbayar</th>
                              <th className="p-2 text-right">Sisa</th>
                              <th className="p-2 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {installmentSchedule.map(
                              (inst: any, idx: number) => (
                                <tr
                                  key={idx}
                                  className={
                                    inst.status === "Lunas"
                                      ? "bg-green-50"
                                      : inst.status === "Sebagian"
                                        ? "bg-blue-50"
                                        : inst.status === "Belum Bayar"
                                          ? "bg-yellow-50"
                                          : "bg-gray-50"
                                  }
                                >
                                  <td className="p-2">{inst.installment}</td>
                                  <td className="p-2">{inst.dueDate}</td>
                                  <td className="p-2 text-right">
                                    {new Intl.NumberFormat("id-ID").format(
                                      inst.principalAmount,
                                    )}
                                  </td>
                                  <td className="p-2 text-right">
                                    {new Intl.NumberFormat("id-ID").format(
                                      inst.interestAmount,
                                    )}
                                  </td>
                                  <td className="p-2 text-right font-medium">
                                    {new Intl.NumberFormat("id-ID").format(
                                      inst.totalPayment,
                                    )}
                                  </td>
                                  <td className="p-2 text-right text-blue-700 font-medium">
                                    {new Intl.NumberFormat("id-ID").format(
                                      inst.paidAmount || 0,
                                    )}
                                  </td>
                                  <td className="p-2 text-right text-red-700 font-medium">
                                    {new Intl.NumberFormat("id-ID").format(
                                      inst.totalPayment -
                                        (inst.paidAmount || 0),
                                    )}
                                  </td>
                                  <td className="p-2 text-center">
                                    <span
                                      className={`px-2 py-1 rounded text-xs ${
                                        inst.status === "Lunas"
                                          ? "bg-green-200 text-green-800"
                                          : inst.status === "Sebagian"
                                            ? "bg-blue-200 text-blue-800"
                                            : inst.status === "Terlambat"
                                              ? "bg-red-200 text-red-800"
                                              : "bg-yellow-200 text-yellow-800"
                                      }`}
                                    >
                                      {inst.status}
                                    </span>
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>

                      <p className="text-xs text-gray-600 mt-2">
                        💡 Cicilan dengan status "Belum Bayar" akan otomatis
                        terisi di form pembayaran
                      </p>
                    </div>
                  )}

                  {/* Payment Details */}
                  {selectedBorrower && (
                    <div className="space-y-4">
                      <h5 className="font-semibold text-sm text-green-900">
                        💰 Detail Pembayaran
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="principal_amount">Pokok (Rp)</Label>
                          <Input
                            id="principal_amount"
                            type="number"
                            value={principalAmount}
                            onChange={(e) => setPrincipalAmount(e.target.value)}
                            placeholder="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="interest_amount">Bunga (Rp)</Label>
                          <Input
                            id="interest_amount"
                            type="number"
                            value={interestAmount}
                            onChange={(e) => setInterestAmount(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Late Fee Calculation Section */}
                      <div className="space-y-4 bg-red-50 border border-red-200 rounded-lg p-4">
                        <h5 className="font-semibold text-sm text-red-900">
                          ⏰ Perhitungan Denda Keterlambatan
                        </h5>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="actual_payment_date">
                              Tanggal Pembayaran Aktual
                            </Label>
                            <Input
                              id="actual_payment_date"
                              type="date"
                              value={actualPaymentDate}
                              onChange={(e) => {
                                setActualPaymentDate(e.target.value);
                                // Auto-calculate days late and late fee
                                if (e.target.value && tanggal) {
                                  const due = new Date(tanggal);
                                  const payment = new Date(e.target.value);
                                  const days = Math.floor(
                                    (payment.getTime() - due.getTime()) /
                                      (1000 * 60 * 60 * 24),
                                  );
                                  const daysLateCalc = Math.max(0, days);
                                  setDaysLate(daysLateCalc.toString());

                                  // Calculate late fee
                                  if (daysLateCalc > 0 && principalAmount) {
                                    const installmentAmount =
                                      Number(principalAmount) +
                                      Number(interestAmount);
                                    const fee =
                                      installmentAmount *
                                      (Number(lateFeePercentage) / 100) *
                                      daysLateCalc;
                                    setLateFee(fee.toFixed(2));
                                  } else {
                                    setLateFee("0");
                                  }
                                }
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="late_fee_percentage_display">
                              Persentase Denda per Hari (%)
                            </Label>
                            <Input
                              id="late_fee_percentage_display"
                              type="number"
                              step="0.01"
                              value={lateFeePercentage}
                              readOnly
                              className="bg-gray-100"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="days_late">
                              Hari Keterlambatan
                            </Label>
                            <Input
                              id="days_late"
                              type="number"
                              value={daysLate}
                              readOnly
                              className="bg-gray-100"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="late_fee">
                              Denda Keterlambatan (Rp)
                            </Label>
                            <Input
                              id="late_fee"
                              type="number"
                              value={lateFee}
                              onChange={(e) => setLateFee(e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {Number(daysLate) > 0 && (
                          <div className="bg-red-100 p-3 rounded">
                            <p className="text-xs text-red-800">
                              📊 Perhitungan: (Pokok + Bunga) ×{" "}
                              {lateFeePercentage}% × {daysLate} hari = Rp{" "}
                              {new Intl.NumberFormat("id-ID").format(
                                Number(lateFee),
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Tax Section */}
                      <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="font-semibold text-sm text-blue-900">
                          🧾 Pajak
                        </h5>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="tax_type_display">
                              Jenis Pajak
                            </Label>
                            <Input
                              id="tax_type_display"
                              type="text"
                              value={taxType}
                              readOnly
                              className="bg-gray-100"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="tax_percentage_display">
                              Persentase Pajak (%)
                            </Label>
                            <Input
                              id="tax_percentage_display"
                              type="number"
                              step="0.01"
                              value={taxPercentage}
                              readOnly
                              className="bg-gray-100"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="tax_amount">
                              Jumlah Pajak (Rp)
                            </Label>
                            <Input
                              id="tax_amount"
                              type="number"
                              value={taxAmount}
                              onChange={(e) => setTaxAmount(e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {Number(taxAmount) > 0 && (
                          <div className="bg-blue-100 p-3 rounded">
                            <p className="text-xs text-blue-800">
                              📊 Perhitungan: (Pokok + Bunga) × {taxPercentage}%
                              = Rp{" "}
                              {new Intl.NumberFormat("id-ID").format(
                                Number(taxAmount),
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="bg-yellow-100 p-3 rounded">
                        <p className="text-sm font-semibold text-yellow-900">
                          Total Pembayaran: Rp{" "}
                          {new Intl.NumberFormat("id-ID").format(
                            Number(principalAmount) +
                              Number(interestAmount) +
                              Number(lateFee) +
                              Number(taxAmount),
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* COA field removed - automatically filled based on category & service type */}

              {/* Kategori Penerimaan - Simplified (Debit/Kredit otomatis) */}
              {shouldShowField("kategoriPenerimaan") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kategori_penerimaan">
                      Kategori Penerimaan (Account Type) *
                    </Label>
                    <Popover
                      open={openAccountTypePenerimaanCombobox}
                      onOpenChange={setOpenAccountTypePenerimaanCombobox}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openAccountTypePenerimaanCombobox}
                          className="w-full justify-between"
                        >
                          {selectedAccountType || "-- pilih account type --"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-full p-2">
                        <Input
                          placeholder="Cari account type..."
                          value={searchAccountTypePenerimaan}
                          onChange={(e) =>
                            setSearchAccountTypePenerimaan(e.target.value)
                          }
                          className="mb-2"
                        />
                        <div className="max-h-64 overflow-auto">
                          {Array.isArray(coaAccounts) &&
                            coaAccounts
                              .filter(
                                (acc, index, self) =>
                                  acc &&
                                  typeof acc.account_type === "string" &&
                                  acc.account_type
                                    .toLowerCase()
                                    .includes(
                                      (
                                        searchAccountTypePenerimaan || ""
                                      ).toLowerCase(),
                                    ) &&
                                  self.findIndex(
                                    (a) => a.account_type === acc.account_type,
                                  ) === index,
                              )
                              .map((acc) => (
                                <div
                                  key={acc.account_type}
                                  className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer rounded"
                                  onClick={() => {
                                    handleAccountTypeChange(acc.account_type);
                                    setOpenAccountTypePenerimaanCombobox(false);
                                    setSearchAccountTypePenerimaan("");
                                  }}
                                >
                                  <span className="text-sm">
                                    {acc.account_type}
                                  </span>
                                  {selectedAccountType === acc.account_type && (
                                    <Check className="h-4 w-4 text-blue-600" />
                                  )}
                                </div>
                              ))}
                          {Array.isArray(coaAccounts) &&
                            coaAccounts.filter(
                              (acc, index, self) =>
                                acc &&
                                typeof acc.account_type === "string" &&
                                acc.account_type
                                  .toLowerCase()
                                  .includes(
                                    (
                                      searchAccountTypePenerimaan || ""
                                    ).toLowerCase(),
                                  ) &&
                                self.findIndex(
                                  (a) => a.account_type === acc.account_type,
                                ) === index,
                            ).length === 0 && (
                              <div className="p-2 text-sm text-gray-500 text-center">
                                Tidak ada account type ditemukan
                              </div>
                            )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_name_penerimaan">
                      Account Name *
                    </Label>
                    <Popover
                      open={openAccountNamePenerimaanCombobox}
                      onOpenChange={setOpenAccountNamePenerimaanCombobox}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openAccountNamePenerimaanCombobox}
                          className="w-full justify-between"
                          disabled={!selectedAccountType}
                        >
                          {selectedAccountName || "-- pilih account name --"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-full p-2">
                        <Input
                          placeholder="Cari account name..."
                          value={searchAccountNamePenerimaan}
                          onChange={(e) =>
                            setSearchAccountNamePenerimaan(e.target.value)
                          }
                          className="mb-2"
                        />
                        <div className="max-h-64 overflow-auto">
                          {filteredAccountNames
                            .filter((name) =>
                              name
                                .toLowerCase()
                                .includes(
                                  searchAccountNamePenerimaan.toLowerCase(),
                                ),
                            )
                            .map((name) => (
                              <div
                                key={name}
                                className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer rounded"
                                onClick={() => {
                                  handleAccountNameChangeAfterType(name);
                                  setOpenAccountNamePenerimaanCombobox(false);
                                  setSearchAccountNamePenerimaan("");
                                }}
                              >
                                <span className="text-sm">{name}</span>
                                {selectedAccountName === name && (
                                  <Check className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                            ))}
                          {filteredAccountNames.filter((name) =>
                            name
                              .toLowerCase()
                              .includes(
                                searchAccountNamePenerimaan.toLowerCase(),
                              ),
                          ).length === 0 && (
                            <div className="p-2 text-sm text-gray-500 text-center">
                              Tidak ada account name ditemukan
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Kategori Pengeluaran */}
              {shouldShowField("kategoriPengeluaran") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kategori_pengeluaran">
                      Kategori Pengeluaran (Account Type) *
                    </Label>
                    <Select
                      value={selectedAccountType}
                      onValueChange={handleAccountTypeChange}
                    >
                      <SelectTrigger id="kategori_pengeluaran">
                        <SelectValue placeholder="-- pilih account type --" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(coaAccounts) &&
                          coaAccounts
                            .filter(
                              (acc, index, self) =>
                                acc &&
                                acc.account_type &&
                                self.findIndex(
                                  (a) =>
                                    a && a.account_type === acc.account_type,
                                ) === index,
                            )
                            .map((account) => (
                              <SelectItem
                                key={account.id}
                                value={account.account_type}
                              >
                                {account.account_type}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedAccountType &&
                  Array.isArray(filteredAccountNames) &&
                  filteredAccountNames.length > 1 ? (
                    <div className="space-y-2">
                      <Label htmlFor="account_name">Account Name *</Label>

                      <Popover
                        open={openAccountNameCombobox}
                        onOpenChange={setOpenAccountNameCombobox}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openAccountNameCombobox}
                            className="w-full justify-between"
                          >
                            {selectedAccountName || "-- pilih account name --"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-full p-2">
                          <Input
                            placeholder="Cari account name..."
                            value={searchAccountName}
                            onChange={(e) =>
                              setSearchAccountName(e.target.value)
                            }
                            className="mb-2"
                          />
                          <div className="max-h-64 overflow-auto">
                            {Array.isArray(filteredAccountNames) &&
                              filteredAccountNames
                                .filter(
                                  (name) =>
                                    name &&
                                    name
                                      .toLowerCase()
                                      .includes(
                                        searchAccountName.toLowerCase(),
                                      ),
                                )
                                .map((name) => (
                                  <div
                                    key={name}
                                    className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
                                    onClick={() => {
                                      handleAccountNameChangeAfterType(name);
                                      setOpenAccountNameCombobox(false);
                                      setSearchAccountName("");
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        selectedAccountName === name
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }`}
                                    />
                                    {name}
                                  </div>
                                ))}
                            {Array.isArray(filteredAccountNames) &&
                              filteredAccountNames.filter(
                                (name) =>
                                  name &&
                                  name
                                    .toLowerCase()
                                    .includes(searchAccountName.toLowerCase()),
                              ).length === 0 && (
                                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                  Tidak ada account name ditemukan.
                                </div>
                              )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : null}

                  {/* Employee Selection - Show when Beban Gaji & Karyawan is selected */}
                  {selectedAccountName === "Beban Gaji & Karyawan" && (
                    <div className="space-y-2">
                      <Label htmlFor="employee_name">Nama Karyawan *</Label>

                      <Popover
                        open={openEmployeeCombobox}
                        onOpenChange={setOpenEmployeeCombobox}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openEmployeeCombobox}
                            className="w-full justify-between"
                          >
                            {selectedEmployee
                              ? employees.find(
                                  (emp) => emp.id === selectedEmployee,
                                )?.full_name
                              : "-- pilih karyawan --"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-full p-2">
                          <Input
                            placeholder="Cari nama karyawan..."
                            value={searchEmployee}
                            onChange={(e) => setSearchEmployee(e.target.value)}
                            className="mb-2"
                          />
                          <div className="max-h-64 overflow-auto">
                            {employees
                              .filter((emp) =>
                                emp.full_name
                                  .toLowerCase()
                                  .includes(searchEmployee.toLowerCase()),
                              )
                              .map((emp) => (
                                <div
                                  key={emp.id}
                                  className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
                                  onClick={() => {
                                    setSelectedEmployee(emp.id);
                                    setOpenEmployeeCombobox(false);
                                    setSearchEmployee("");
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      selectedEmployee === emp.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                  <div>
                                    <div className="font-medium">
                                      {emp.full_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {emp.email}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            {employees.filter((emp) =>
                              emp.full_name
                                .toLowerCase()
                                .includes(searchEmployee.toLowerCase()),
                            ).length === 0 && (
                              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                Tidak ada karyawan ditemukan.
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              )}

              {/* Pengeluaran Kas Additional Fields */}
              {jenisTransaksi === "Pengeluaran Kas" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jenis_pembayaran_pengeluaran">
                      Jenis Pembayaran *
                    </Label>
                    <Select
                      value={jenisPembayaranPengeluaran}
                      onValueChange={(value) => {
                        setJenisPembayaranPengeluaran(value);
                        // 🔒 RESET STATE BANK JIKA PILIH KAS/CASH
                        if (value === "Cash" || value === "Kas") {
                          setSelectedBank("");
                        }
                      }}
                    >
                      <SelectTrigger id="jenis_pembayaran_pengeluaran">
                        <SelectValue placeholder="-- pilih --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash (Kas)</SelectItem>
                        {/* 🔒 TRANSFER/BANK DILARANG DI PENGELUARAN KAS - Gunakan menu Bank Mutation */}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nama_karyawan_pengeluaran">
                      Nama Karyawan *
                    </Label>
                    <Popover
                      open={openEmployeePengeluaranCombobox}
                      onOpenChange={setOpenEmployeePengeluaranCombobox}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openEmployeePengeluaranCombobox}
                          className="w-full justify-between"
                        >
                          {namaPengeluaran || "-- pilih karyawan --"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-full p-2">
                        <Input
                          placeholder="Cari nama karyawan..."
                          value={searchEmployeePengeluaran}
                          onChange={(e) =>
                            setSearchEmployeePengeluaran(e.target.value)
                          }
                          className="mb-2"
                        />
                        <div className="max-h-64 overflow-auto">
                          {employees
                            .filter((emp) =>
                              emp.full_name
                                .toLowerCase()
                                .includes(
                                  searchEmployeePengeluaran.toLowerCase(),
                                ),
                            )
                            .map((emp) => (
                              <div
                                key={emp.id}
                                className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer rounded"
                                onClick={() => {
                                  setNamaPengeluaran(emp.full_name);
                                  setOpenEmployeePengeluaranCombobox(false);
                                  setSearchEmployeePengeluaran("");
                                }}
                              >
                                <span className="text-sm">{emp.full_name}</span>
                                {namaPengeluaran === emp.full_name && (
                                  <Check className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                            ))}
                          {employees.filter((emp) =>
                            emp.full_name
                              .toLowerCase()
                              .includes(
                                searchEmployeePengeluaran.toLowerCase(),
                              ),
                          ).length === 0 && (
                            <div className="p-2 text-sm text-gray-500 text-center">
                              Tidak ada karyawan ditemukan
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Mutasi Kas Fields */}
              {shouldShowField("kasSumber") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kas_sumber">Kas Sumber *</Label>
                    <Select value={kasSumber} onValueChange={setKasSumber}>
                      <SelectTrigger id="kas_sumber">
                        <SelectValue placeholder="-- pilih --" />
                      </SelectTrigger>
                      <SelectContent>
                        {coa
                          .filter((c) => c.account_code.startsWith("1-11"))
                          .map((c) => (
                            <SelectItem
                              key={c.account_code}
                              value={c.account_code}
                            >
                              {c.account_code} — {c.account_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {shouldShowField("kasTujuan") && (
                    <div className="space-y-2">
                      <Label htmlFor="kas_tujuan">Kas Tujuan *</Label>
                      <Select value={kasTujuan} onValueChange={setKasTujuan}>
                        <SelectTrigger id="kas_tujuan">
                          <SelectValue placeholder="-- pilih --" />
                        </SelectTrigger>
                        <SelectContent>
                          {coa
                            .filter((c) => c.account_code.startsWith("1-11"))
                            .map((c) => (
                              <SelectItem
                                key={c.account_code}
                                value={c.account_code}
                              >
                                {c.account_code} — {c.account_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* OCR SCANNER SECTION */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  📷 Scan Receipt dengan OCR
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload gambar receipt untuk mengisi data transaksi secara
                  otomatis
                </p>
                <OCRScanner
                  onResult={async (data) => {
                    console.log("🔍 OCR Result received:", data);
                    console.log("🔍 document_type:", data.document_type);
                    console.log(
                      "🔍 suggested_debit_account:",
                      data.suggested_debit_account,
                    );
                    console.log(
                      "🔍 suggested_credit_account:",
                      data.suggested_credit_account,
                    );

                    if (data.nominal) {
                      setNominal(data.nominal.toString());
                    }
                    if (data.tanggal) {
                      setTanggal(data.tanggal);
                    }
                    if (data.deskripsi) {
                      setDescription(data.deskripsi);
                    }

                    // Auto-fill upload bukti with image file
                    if (data.imageFile) {
                      setBuktiFile(data.imageFile);
                      // Create preview URL for the image
                      const previewUrl = URL.createObjectURL(data.imageFile);
                      setBuktiUrl(previewUrl);
                    }

                    // SALARY SLIP AUTO-MAPPING
                    // Check both document_type and description for salary slip detection
                    const isSalarySlip =
                      data.document_type === "salary_slip" ||
                      (data.deskripsi &&
                        /slip\s+gaji|gaji\s+karyawan|payroll/i.test(
                          data.deskripsi,
                        ));

                    if (isSalarySlip) {
                      console.log("🎯 Salary slip detected!");
                      console.log(
                        "🎯 Suggested debit account:",
                        data.suggested_debit_account,
                      );
                      console.log(
                        "🎯 Suggested credit account:",
                        data.suggested_credit_account,
                      );

                      // Auto-select Beban Gaji & Karyawan (6-1000)
                      const debitAccountCode =
                        data.suggested_debit_account || "6-1000";
                      const { data: account, error } = await supabase
                        .from("chart_of_accounts")
                        .select("*")
                        .eq("account_code", debitAccountCode)
                        .maybeSingle();

                      console.log("🔍 Query result for debit account:", {
                        account,
                        error,
                      });

                      if (account) {
                        const expenseAccountData = {
                          id: account.id,
                          account_code: account.account_code,
                          account_name: account.account_name,
                          account_type: account.account_type || "Beban",
                          description: account.description,
                        };

                        setSelectedExpenseAccount(expenseAccountData);
                        setAkunBeban(
                          `${account.account_code} — ${account.account_name}`,
                        );

                        console.log(
                          "✅ Auto-selected expense account:",
                          account.account_name,
                        );
                        console.log(
                          "✅ selectedExpenseAccount set to:",
                          expenseAccountData,
                        );
                      } else {
                        console.error(
                          "❌ Failed to find expense account:",
                          debitAccountCode,
                        );
                      }

                      // Auto-select Bank account if suggested
                      if (data.suggested_credit_account) {
                        const { data: account, error } = await supabase
                          .from("chart_of_accounts")
                          .select("*")
                          .eq("account_code", data.suggested_credit_account)
                          .maybeSingle();

                        console.log("🔍 Query result for credit account:", {
                          account,
                          error,
                        });

                        if (account) {
                          setSelectedBank(
                            `${account.account_code} — ${account.account_name}`,
                          );
                          console.log(
                            "✅ Auto-selected bank account:",
                            account.account_name,
                          );
                        } else {
                          console.error(
                            "❌ Failed to find bank account:",
                            data.suggested_credit_account,
                          );
                        }
                      }

                      // Set payment method to Transfer Bank for salary
                      setPaymentType("Transfer Bank");

                      toast({
                        title: "💰 Slip Gaji Terdeteksi!",
                        description: `Akun Beban Gaji & Bank telah dipilih otomatis. Silakan periksa kembali.`,
                      });
                    }

                    // Store OCR data for database (including ocr_id)
                    setOcrAppliedData({
                      extractedText: data.extractedText || "",
                      items: data.items || [],
                      appliedFields: {
                        nominal: data.nominal,
                        tanggal: data.tanggal,
                        deskripsi: data.deskripsi,
                      },
                      ocrId: data.ocrId, // Store OCR result ID for linking
                      nomorNota: data.nomorNota,
                      toko: data.toko,
                      document_type: data.document_type,
                      employee_name: data.employee_name,
                      employee_number: data.employee_number,
                    });

                    // Show success toast for non-salary slip documents
                    const isSalarySlipCheck =
                      data.document_type === "salary_slip" ||
                      (data.deskripsi &&
                        /slip\s+gaji|gaji\s+karyawan|payroll/i.test(
                          data.deskripsi,
                        ));

                    if (!isSalarySlipCheck) {
                      toast({
                        title: "✅ OCR berhasil diproses",
                        description: `Data transaksi telah terisi otomatis. Silakan periksa kembali sebelum menyimpan.`,
                      });
                    }
                  }}
                  buttonText="📷 Upload & Scan Receipt"
                  buttonVariant="default"
                  showPreview={true}
                />
              </div>

              {/* NOMINAL + DATE */}
              {jenisTransaksi !== "Jurnal Umum" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nominal">
                      Nominal *
                      {jenisTransaksi === "Penjualan" &&
                        itemName &&
                        description && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (Otomatis dari Quantity × Harga Jual)
                          </span>
                        )}
                      {jenisTransaksi === "Pembelian Barang" &&
                        itemName &&
                        description && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (Otomatis dari (Quantity × Harga Beli) + PPN)
                          </span>
                        )}
                    </Label>
                    <Input
                      id="nominal"
                      type="number"
                      value={nominal}
                      onChange={(e) => setNominal(e.target.value)}
                      placeholder="0"
                      readOnly={
                        (jenisTransaksi === "Penjualan" &&
                          itemName &&
                          description) ||
                        (jenisTransaksi === "Pembelian Barang" &&
                          itemName &&
                          description)
                      }
                      className={
                        (jenisTransaksi === "Penjualan" &&
                          itemName &&
                          description) ||
                        (jenisTransaksi === "Pembelian Barang" &&
                          itemName &&
                          description)
                          ? "bg-gray-100"
                          : ""
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tanggal">Tanggal *</Label>
                    <Input
                      id="tanggal"
                      type="date"
                      value={tanggal}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Validate date format before setting
                        if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                          setTanggal(value);
                        } else if (!value) {
                          setTanggal("");
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* DESC */}
              {jenisTransaksi !== "Jurnal Umum" && (
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Masukkan deskripsi transaksi"
                    rows={3}
                  />
                </div>
              )}

              {/* HANDLED BY USER */}
              {jenisTransaksi !== "Jurnal Umum" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="handled_by">Ditangani Oleh</Label>
                    <p className="text-sm text-gray-600">
                      User yang login saat ini akan tercatat sebagai
                      penanggungjawab transaksi ini.
                    </p>
                  </div>
                </div>
              )}

              {/* UPLOAD BUKTI FOTO */}
              {jenisTransaksi !== "Jurnal Umum" && (
                  <div className="space-y-2 mt-6">
                    <Label
                      htmlFor="bukti-foto"
                      className="text-base font-semibold"
                    >
                      Bukti Foto Transaksi
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="bukti-foto"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !file.name) return;

                          setBuktiFile(file);

                          // Upload to Supabase Storage
                          try {
                            const fileExt = file.name.split(".").pop();
                            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                            const filePath = `transaksi-bukti/${fileName}`;

                            const { error: uploadError } =
                              await supabase.storage
                                .from("documents")
                                .upload(filePath, file);

                            if (uploadError) throw uploadError;

                            const {
                              data: { publicUrl },
                            } = supabase.storage
                              .from("documents")
                              .getPublicUrl(filePath);

                            setBuktiUrl(publicUrl);

                            toast({
                              title: "✅ Bukti berhasil diupload",
                              description:
                                "File bukti transaksi telah tersimpan",
                            });
                          } catch (err: any) {
                            console.error("Upload error:", error);
                            toast({
                              title: "❌ Upload gagal",
                              description: error.message,
                              variant: "destructive",
                            });
                          }
                        }}
                        className="flex-1"
                      />
                      {buktiFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBuktiFile(null);
                            setBuktiUrl("");
                            // Reset file input
                            const fileInput = document.getElementById(
                              "bukti-foto",
                            ) as HTMLInputElement;
                            if (fileInput) fileInput.value = "";
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Preview Bukti */}
                    {buktiUrl && buktiFile && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {buktiFile.type.startsWith("image/") ? (
                              <img
                                src={buktiUrl}
                                alt="Bukti Transaksi"
                                className="w-24 h-24 object-cover rounded border"
                              />
                            ) : (
                              <div className="w-24 h-24 bg-gray-200 rounded border flex items-center justify-center">
                                <FileText className="h-8 w-8 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-800">
                              ✅ Bukti berhasil diupload
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              {buktiFile.name}
                            </p>
                            <a
                              href={buktiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                            >
                              Lihat file →
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-slate-500">
                      Upload foto bukti transaksi (struk, invoice, kwitansi,
                      dll). Format: JPG, PNG, atau PDF
                    </p>
                  </div>
                )}

              {/* BUTTONS */}
              {jenisTransaksi !== "Jurnal Umum" && (
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreview}
                    className="flex-1"
                  >
                    Preview Jurnal
                  </Button>

                  <Button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    🛒 Tambah ke Keranjang
                  </Button>

                  <Button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Simpan Transaksi
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* CART VIEW */}
      {showCart && (
        <Card className="container mx-auto px-4 bg-white rounded-xl shadow-lg border border-slate-200 mt-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              🛒 Keranjang Transaksi ({cart.length} item)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Keranjang kosong</p>
                <p className="text-sm mt-2">
                  Tambahkan transaksi dari form di atas
                </p>
              </div>
            ) : (
              <>
                {/* Select All Checkbox */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                  <Checkbox
                    id="select-all"
                    checked={cart.every((item) => item.selected)}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Pilih Semua ({cart.filter((item) => item.selected).length}{" "}
                    dipilih)
                  </label>
                </div>

                <div className="space-y-4 mb-6">
                  {cart.map((item, index) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3 flex-1">
                          {/* Checkbox */}
                          <div className="pt-1">
                            <Checkbox
                              id={`item-${item.id}`}
                              checked={item.selected || false}
                              onCheckedChange={() =>
                                toggleCartItemSelection(item.id)
                              }
                            />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-lg">
                                #{index + 1}
                              </span>
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                {item.jenisTransaksi}
                              </span>
                              {item.paymentType && (
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                                  {item.paymentType === "cash"
                                    ? "Tunai"
                                    : "Kredit"}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                              {item.itemName && (
                                <div>
                                  <span className="font-medium text-gray-600">
                                    Item:
                                  </span>
                                  <span className="ml-2">{item.itemName}</span>
                                </div>
                              )}
                              {item.description && (
                                <div>
                                  <span className="font-medium text-gray-600">
                                    Deskripsi:
                                  </span>
                                  <span className="ml-2">
                                    {item.description}
                                  </span>
                                </div>
                              )}
                              {item.kategori && (
                                <div>
                                  <span className="font-medium text-gray-600">
                                    Kategori:
                                  </span>
                                  <span className="ml-2">{item.kategori}</span>
                                </div>
                              )}
                              {item.jenisLayanan && (
                                <div>
                                  <span className="font-medium text-gray-600">
                                    Layanan:
                                  </span>
                                  <span className="ml-2">
                                    {item.jenisLayanan}
                                  </span>
                                </div>
                              )}
                              {item.customer && (
                                <div>
                                  <span className="font-medium text-gray-600">
                                    Customer:
                                  </span>
                                  <span className="ml-2">{item.customer}</span>
                                </div>
                              )}
                              {item.supplier && (
                                <div>
                                  <span className="font-medium text-gray-600">
                                    Supplier:
                                  </span>
                                  <span className="ml-2">{item.supplier}</span>
                                </div>
                              )}
                              {item.quantity && item.quantity !== "1" && (
                                <div>
                                  <span className="font-medium text-gray-600">
                                    Qty:
                                  </span>
                                  <span className="ml-2">{item.quantity}</span>
                                </div>
                              )}
                              {item.hargaJual && (
                                <div>
                                  <span className="font-medium text-gray-600">
                                    Harga Jual/Unit:
                                  </span>
                                  <span className="ml-2">
                                    Rp{" "}
                                    {new Intl.NumberFormat("id-ID").format(
                                      Number(item.hargaJual),
                                    )}
                                  </span>
                                </div>
                              )}
                              {item.hargaBeli && (
                                <div>
                                  <span className="font-medium text-gray-600">
                                    Harga Beli/Unit:
                                  </span>
                                  <span className="ml-2">
                                    Rp{" "}
                                    {new Intl.NumberFormat("id-ID").format(
                                      Number(item.hargaBeli),
                                    )}
                                  </span>
                                </div>
                              )}
                              {item.ppnAmount && Number(item.ppnAmount) > 0 && (
                                <div>
                                  <span className="font-medium text-gray-600">
                                    PPN ({item.ppnPercentage}%):
                                  </span>
                                  <span className="ml-2">
                                    Rp{" "}
                                    {new Intl.NumberFormat("id-ID").format(
                                      Number(item.ppnAmount),
                                    )}
                                  </span>
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-gray-600">
                                  Tanggal:
                                </span>
                                <span className="ml-2">{item.tanggal}</span>
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-lg text-gray-900">
                                  Total: Rp{" "}
                                  {new Intl.NumberFormat("id-ID").format(
                                    Number(item.nominal),
                                  )}
                                </span>
                              </div>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-2">
                                  <span className="font-medium">
                                    Keterangan:
                                  </span>{" "}
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="ml-4"
                        >
                          🗑️ Hapus
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        Total Transaksi: {cart.length} item (
                        {cart.filter((item) => item.selected).length} dipilih)
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        Total Nominal: Rp{" "}
                        {new Intl.NumberFormat("id-ID").format(
                          cart
                            .filter((item) => item.selected)
                            .reduce(
                              (sum, item) => sum + Number(item.nominal),
                              0,
                            ),
                        )}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowCart(false)}
                      >
                        ← Kembali ke Form
                      </Button>
                      <Button
                        onClick={handleCheckoutCart}
                        disabled={
                          isConfirming ||
                          cart.filter((item) => item.selected).length === 0
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isConfirming
                          ? "Memproses..."
                          : `✅ Checkout Semua (${cart.filter((item) => item.selected).length})`}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODALS */}
      <AddItemModal
        open={openItemModal}
        onClose={() => setOpenItemModal(false)}
        onAdded={loadItems}
      />

      <AddBrandModal
        open={openBrandModal}
        onClose={() => setOpenBrandModal(false)}
        onAdded={() => {}}
      />

      <AddStockItemModal
        open={openStockItemModal}
        onClose={() => setOpenStockItemModal(false)}
        onAdded={() => {
          loadItems();
          fetchStockInfo(itemName, description);
        }}
      />

      <BorrowerForm
        open={openBorrowerModal}
        onClose={() => setOpenBorrowerModal(false)}
        onAdded={loadBorrowers}
      />

      <JournalPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        lines={previewLines}
        memo={previewMemo}
        onConfirm={handleConfirmSave}
        isLoading={isConfirming}
      />

      {/* Add COA Modal */}
      <Dialog open={showAddCOAModal} onOpenChange={setShowAddCOAModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Tambah Akun COA Baru
            </DialogTitle>
            <DialogDescription>
              {coaContextType === "expense" 
                ? "Tambahkan akun beban baru untuk transaksi pengeluaran"
                : "Tambahkan akun pendapatan baru untuk transaksi penerimaan"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Account Code */}
            <div className="space-y-2">
              <Label htmlFor="new_account_code">Kode Akun *</Label>
              <Input
                id="new_account_code"
                placeholder={coaContextType === "expense" ? "Contoh: 6-1001" : "Contoh: 4-1001"}
                value={newCOA.account_code}
                onChange={(e) => setNewCOA({ ...newCOA, account_code: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Format: X-XXXX (contoh: 6-1001 untuk beban, 4-1001 untuk pendapatan)
              </p>
            </div>

            {/* Account Name */}
            <div className="space-y-2">
              <Label htmlFor="new_account_name">Nama Akun *</Label>
              <Input
                id="new_account_name"
                placeholder="Contoh: Beban Listrik, Pendapatan Jasa, dll"
                value={newCOA.account_name}
                onChange={(e) => setNewCOA({ ...newCOA, account_name: e.target.value })}
              />
            </div>

            {/* Account Type */}
            <div className="space-y-2">
              <Label htmlFor="new_account_type">Tipe Akun *</Label>
              <Select
                value={newCOA.account_type}
                onValueChange={(value) => {
                  setNewCOA({ 
                    ...newCOA, 
                    account_type: value,
                    normal_balance: value === "Aset" || value === "Beban Pokok Penjualan" || value === "Beban Operasional" ? "DEBIT" : "CREDIT"
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe akun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aset">Aset</SelectItem>
                  <SelectItem value="Kewajiban">Kewajiban</SelectItem>
                  <SelectItem value="Ekuitas">Ekuitas</SelectItem>
                  <SelectItem value="Pendapatan">Pendapatan</SelectItem>
                  <SelectItem value="Beban Pokok Penjualan">Beban Pokok Penjualan</SelectItem>
                  <SelectItem value="Beban Operasional">Beban Operasional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Normal Balance */}
            <div className="space-y-2">
              <Label htmlFor="new_normal_balance">Saldo Normal *</Label>
              <Select
                value={newCOA.normal_balance}
                onValueChange={(value) => setNewCOA({ ...newCOA, normal_balance: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih saldo normal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBIT">DEBIT</SelectItem>
                  <SelectItem value="CREDIT">CREDIT</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Expense & Asset = DEBIT | Revenue, Liability & Equity = CREDIT
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="new_description">Deskripsi (Opsional)</Label>
              <Textarea
                id="new_description"
                placeholder="Deskripsi singkat tentang akun ini..."
                value={newCOA.description}
                onChange={(e) => setNewCOA({ ...newCOA, description: e.target.value })}
                rows={2}
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Info:</strong> Akun baru akan otomatis diset dengan:
              </p>
              <ul className="text-xs text-blue-600 mt-1 list-disc list-inside">
                <li>allow_manual_posting = true</li>
                <li>is_active = true</li>
                <li>level = 3 (detail account)</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddCOAModal(false)}
              disabled={savingCOA}
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveCOA}
              disabled={savingCOA || !newCOA.account_code || !newCOA.account_name}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {savingCOA ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Akun"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Transaksi Section */}

      <div className="mt-8">
        <ApprovalTransaksi onApprovalComplete={loadTransactions} />
      </div>
    </div>
  );
}
