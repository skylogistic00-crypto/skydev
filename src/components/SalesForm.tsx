import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle2, Loader2, Plus, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Item {
  id: string;
  item_name: string;
  brand?: string;
  quantity: number;
  coa_account_code: string;
  coa_account_name: string;
}

interface ServiceItem {
  id: string;
  item_name: string;
  price: number;
  unit: string;
  coa_revenue_code: string;
}

interface Customer {
  id: string;
  // customer_code: string;
  name: string;
  phone: string;
  address: string;
  email: string;
}

interface COAAccount {
  account_code: string;
  account_name: string;
  account_type: string;
}

interface SalesTransaction {
  id: string;
  transaction_date: string;
  transaction_type: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string;
  customer_name: string;
  notes: string;
  created_at: string;
}

export default function SalesForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coaAccounts, setCOAAccounts] = useState<COAAccount[]>([]);
  const [salesTransactions, setSalesTransactions] = useState<
    SalesTransaction[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    //contact_person: "",
    phone: "",
    email: "",
    // city: "",
    // country: "",
    // is_pkp: "",
    // tax_id: "",
    // bank_name: "",
    // bank_account_holder: "",
    //  payment_terms: "",
    //  category: "",
    // currency: "IDR",
    //  status: "ACTIVE",
    address: "",
  });

  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split("T")[0],
    transaction_type: "Barang",
    item_id: "",
    item_name: "",
    brand: "",
    stock_current: 0,
    quantity: 0,
    stock_after: 0,
    unit_price: 0,
    subtotal: 0,
    tax_percentage: 11,
    tax_amount: 0,
    total_amount: 0,
    payment_method: "Tunai",
    customer_id: "",
    customer_name: "",
    coa_account_code: "",
    coa_account_name: "",
    notes: "",
    cost_per_unit: 0,
  });

  const [stockWarning, setStockWarning] = useState("");

  useEffect(() => {
    fetchItems();
    fetchServiceItems();
    fetchCustomers();
    fetchCOAAccounts();
    fetchSalesTransactions();
  }, []);

  useEffect(() => {
    // Calculate subtotal
    const subtotal = formData.quantity * formData.unit_price;
    // Calculate tax
    const taxAmount = (subtotal * formData.tax_percentage) / 100;
    // Calculate total
    const totalAmount = subtotal + taxAmount;

    setFormData((prev) => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
    }));
  }, [formData.quantity, formData.unit_price, formData.tax_percentage]);

  useEffect(() => {
    // Calculate stock after
    const stockAfter = formData.stock_current - formData.quantity;
    console.log("Stock calculation:", {
      stock_current: formData.stock_current,
      quantity: formData.quantity,
      stock_after: stockAfter,
      transaction_type: formData.transaction_type,
    });

    setFormData((prev) => ({ ...prev, stock_after: stockAfter }));

    if (stockAfter < 0 && formData.transaction_type === "Barang") {
      setStockWarning("⚠️ Stok tidak mencukupi!");
    } else {
      setStockWarning("");
    }
  }, [formData.stock_current, formData.quantity, formData.transaction_type]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("stock")
      .select(
        "id, item_name, brand, item_quantity, coa_account_code, coa_account_name",
      )
      .gt("item_quantity", 0)
      .order("item_name");

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data barang",
        variant: "destructive",
      });
    } else {
      // Map item_quantity to quantity for consistency
      const mappedItems = (data || []).map((item: any) => ({
        id: item.id,
        item_name: item.item_name,
        brand: item.brand,
        quantity: item.item_quantity,
        coa_account_code: item.coa_account_code,
        coa_account_name: item.coa_account_name,
      }));
      setItems(mappedItems);
    }
  };

  const fetchServiceItems = async () => {
    const { data, error } = await supabase
      .from("service_items")
      .select("id, item_name, price, unit, coa_revenue_code")
      .eq("is_active", true)
      .order("item_name");

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data jasa",
        variant: "destructive",
      });
    } else {
      setServiceItems(data || []);
    }
  };

  const fetchSalesTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("sales_transactions")
        .select("*")
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSalesTransactions(data || []);
    } catch (error) {
      console.error("Error fetching sales transactions:", error);
    }
  };

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("id, email, name, phone, address")
      // .eq("status", "ACTIVE")
      .order("name");

    if (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data customer",
        variant: "destructive",
      });
    } else {
      console.log("Customers loaded:", data);
      setCustomers(data || []);
    }
  };

  const fetchCOAAccounts = async () => {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("account_code, account_name, account_type")
      .eq("account_type", "Pendapatan")
      .order("account_code");

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data COA",
        variant: "destructive",
      });
    } else {
      setCOAAccounts(data || []);
    }
  };

  const handleItemChange = async (itemId: string) => {
    const { data, error } = await supabase
      .from("stock")
      .select(
        "id, item_name, brand, item_quantity, coa_account_code, coa_account_name",
      )
      .eq("id", itemId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data barang",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      // Get COA account name if only code is available
      let coaAccountName = data.coa_account_name || "";

      if (data.coa_account_code && !coaAccountName) {
        const { data: coaData } = await supabase
          .from("chart_of_accounts")
          .select("account_name")
          .eq("account_code", data.coa_account_code)
          .single();

        coaAccountName = coaData?.account_name || "";
      }

      setFormData((prev) => ({
        ...prev,
        item_id: itemId,
        item_name: data.item_name,
        brand: data.brand || "",
        stock_current: data.item_quantity,
        // Auto-fill COA from stock
        coa_account_code: data.coa_account_code || "",
        coa_account_name: coaAccountName,
      }));

      // Show notification if COA is auto-filled
      if (data.coa_account_code) {
        toast({
          title: "COA Otomatis Terisi",
          description: `Akun COA: ${data.coa_account_code} - ${coaAccountName}`,
        });
      }
    }
  };

  const handleServiceChange = async (serviceId: string) => {
    // Query with COA revenue code for automatic journal
    const { data, error } = await supabase
      .from("service_items")
      .select("id, item_name, price, unit, coa_revenue_code")
      .eq("id", serviceId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data jasa",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      // Get COA account name
      const { data: coaData } = await supabase
        .from("chart_of_accounts")
        .select("account_name")
        .eq("account_code", data.coa_revenue_code)
        .single();

      setFormData((prev) => ({
        ...prev,
        item_id: serviceId,
        item_name: data.item_name,
        unit_price: data.price,
        stock_current: 0,
        quantity: prev.quantity || 1,
        // Auto-fill COA from service_items
        coa_account_code: data.coa_revenue_code,
        coa_account_name: coaData?.account_name || "",
      }));

      // Show notification if COA is auto-filled
      if (data.coa_revenue_code) {
        toast({
          title: "COA Otomatis Terisi",
          description: `Akun COA: ${data.coa_revenue_code} - ${coaData?.account_name || ""}`,
        });
      }
    }
  };

  const handleCustomerChange = (customerId: string) => {
    if (customerId === "add_new") {
      setIsAddCustomerDialogOpen(true);
      return;
    }

    const selectedCustomer = customers.find((c) => c.id === customerId);
    if (selectedCustomer) {
      setFormData((prev) => ({
        ...prev,
        customer_id: customerId,
        name: selectedCustomer.name,
      }));
    }
  };

  const handleAddNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          customer_name: newCustomerData.customer_name,
          contact_person: newCustomerData.contact_person,
          phone_number: newCustomerData.phone_number,
          email: newCustomerData.email,
          city: newCustomerData.city,
          country: newCustomerData.country,
          is_pkp: newCustomerData.is_pkp,
          tax_id: newCustomerData.tax_id,
          bank_name: newCustomerData.bank_name,
          bank_account_holder: newCustomerData.bank_account_holder,
          payment_terms: newCustomerData.payment_terms,
          category: newCustomerData.category,
          currency: newCustomerData.currency,
          status: newCustomerData.status,
          address: newCustomerData.address,
        })
        .select();

      if (error) throw error;

      const newCustomer = data && data[0];

      toast({
        title: "Success",
        description: `Customer ${newCustomer.customer_name} berhasil ditambahkan`,
      });

      // Refresh customers list
      await fetchCustomers();

      // Set the newly created customer as selected
      if (newCustomer) {
        setFormData((prev) => ({
          ...prev,
          customer_id: newCustomer.id,
          customer_name: newCustomer.customer_name,
        }));
      }

      // Reset form and close dialog
      setNewCustomerData({
        customer_name: "",
        contact_person: "",
        phone_number: "",
        email: "",
        city: "",
        country: "",
        is_pkp: "",
        tax_id: "",
        bank_name: "",
        bank_account_holder: "",
        payment_terms: "",
        category: "",
        currency: "IDR",
        status: "ACTIVE",
        address: "",
      });
      setIsAddCustomerDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCOAChange = (accountCode: string) => {
    const selectedAccount = coaAccounts.find(
      (acc) => acc.account_code === accountCode,
    );
    if (selectedAccount) {
      setFormData((prev) => ({
        ...prev,
        coa_account_code: accountCode,
        coa_account_name: selectedAccount.account_name,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.stock_after < 0 && formData.transaction_type === "Barang") {
      toast({
        title: "Stok tidak mencukupi",
        description: "Stok tidak mencukupi untuk transaksi ini",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Step 1: Validate stock with edge function (only for Barang)
      if (formData.transaction_type === "Barang") {
        const { data: stockCheck, error: stockError } =
          await supabase.functions.invoke(
            "supabase-functions-check-stock-balance",
            {
              body: {
                item_id: formData.item_id,
                qty: formData.quantity,
              },
            },
          );

        if (stockError || !stockCheck?.success) {
          toast({
            title: "Stok tidak mencukupi",
            description: stockCheck?.message || "Stok tidak mencukupi",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Step 2: Insert sales transaction with all COA codes
      const { data: transaction, error: transactionError } = await supabase
        .from("sales_transactions")
        .insert({
          transaction_date: formData.transaction_date,
          transaction_type: formData.transaction_type,
          item_id: formData.item_id,
          item_name: formData.item_name,
          brand: formData.brand,
          stock_before:
            formData.transaction_type === "Barang"
              ? formData.stock_current
              : null,
          quantity: formData.quantity,
          stock_after:
            formData.transaction_type === "Barang"
              ? formData.stock_after
              : null,
          unit_price: formData.unit_price,
          subtotal: formData.subtotal,
          tax_percentage: formData.tax_percentage,
          tax_amount: formData.tax_amount,
          total_amount: formData.total_amount,
          payment_method: formData.payment_method,
          customer_id: formData.customer_id,
          // name: formData.name,
          coa_cash_code:
            formData.payment_method === "Piutang" ? "1-1200" : "1-1100",
          coa_revenue_code: formData.coa_account_code,
          coa_cogs_code:
            formData.transaction_type === "Barang" ? "5-1100" : null,
          coa_inventory_code:
            formData.transaction_type === "Barang"
              ? formData.coa_account_code
              : null,
          coa_tax_code: formData.tax_amount > 0 ? "2-1250" : null,
          account_code: formData.payment_method === "Piutang" ? "1-1200" : "1-1100",
          notes: formData.notes,
          created_by: user?.id || "system",
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Step 3: Create journal entries based on transaction type
      const journalEntries = [];
      const transactionId = `SALE-${transaction.id.substring(0, 8)}`;

      if (formData.transaction_type === "Barang") {
        // Update stock in stock table
        const { error: updateStockError } = await supabase
          .from("stock")
          .update({
            item_quantity: formData.stock_after,
            updated_at: new Date().toISOString(),
          })
          .eq("id", formData.item_id);

        if (updateStockError) {
          console.error("Update stock error:", updateStockError);
        }

        // Calculate COGS (use average cost or set default)
        const cogs = formData.quantity * (formData.cost_per_unit || 0);

        // 1️⃣ Dr Kas/Piutang
        const debitAccountCode =
          formData.payment_method === "Piutang" ? "1-1200" : "1-1100";
        const debitAccountName =
          formData.payment_method === "Piutang" ? "Piutang Usaha" : "Kas";

        journalEntries.push({
          transaction_id: transactionId,
          transaction_date: formData.transaction_date,
          account_code: debitAccountCode,
          account_name: debitAccountName,
          debit: formData.total_amount,
          credit: 0,
          description: `Penjualan Barang - ${formData.item_name} (${formData.payment_method})`,
          created_by: user?.email || "system",
        });

        // 2️⃣ Cr Pendapatan Penjualan Barang
        journalEntries.push({
          transaction_id: transactionId,
          transaction_date: formData.transaction_date,
          account_code: formData.coa_account_code,
          account_name: formData.coa_account_name,
          debit: 0,
          credit: formData.subtotal,
          description: `Pendapatan Penjualan Barang - ${formData.item_name}`,
          created_by: user?.email || "system",
        });

        // 3️⃣ Cr PPN Keluaran (if any)
        if (formData.tax_amount > 0) {
          journalEntries.push({
            transaction_id: transactionId,
            transaction_date: formData.transaction_date,
            account_code: "2-1250",
            account_name: "Hutang PPN",
            debit: 0,
            credit: formData.tax_amount,
            description: `PPN Keluaran ${formData.tax_percentage}%`,
            created_by: user?.email || "system",
          });
        }

        // 4️⃣ Dr Harga Pokok Penjualan
        if (cogs > 0) {
          journalEntries.push({
            transaction_id: transactionId,
            transaction_date: formData.transaction_date,
            account_code: "5-1100",
            account_name: "Harga Pokok Penjualan",
            debit: cogs,
            credit: 0,
            description: `HPP - ${formData.item_name}`,
            created_by: user?.email || "system",
          });

          // 5️⃣ Cr Persediaan Barang
          journalEntries.push({
            transaction_id: transactionId,
            transaction_date: formData.transaction_date,
            account_code: formData.coa_account_code,
            account_name: formData.coa_account_name,
            debit: 0,
            credit: cogs,
            description: `Pengurangan Persediaan - ${formData.item_name}`,
            created_by: user?.email || "system",
          });
        }

        // Refresh stock data from stock table
        const { data: updatedItem } = await supabase
          .from("stock")
          .select("item_quantity")
          .eq("id", formData.item_id)
          .single();

        if (updatedItem) {
          setFormData((prev) => ({
            ...prev,
            stock_current: updatedItem.item_quantity,
          }));
        }
      } else {
        // Journal for Jasa (from service_items.coa_revenue_code)

        // 1️⃣ Dr Kas/Piutang
        const debitAccountCode =
          formData.payment_method === "Piutang" ? "1-1200" : "1-1100";
        const debitAccountName =
          formData.payment_method === "Piutang" ? "Piutang Usaha" : "Kas";

        journalEntries.push({
          transaction_id: transactionId,
          transaction_date: formData.transaction_date,
          account_code: debitAccountCode,
          account_name: debitAccountName,
          debit: formData.total_amount,
          credit: 0,
          description: `Penjualan Jasa - ${formData.item_name} (${formData.payment_method})`,
          created_by: user?.email || "system",
        });

        // 2️⃣ Cr Pendapatan Jasa (from service_items.coa_revenue_code)
        journalEntries.push({
          transaction_id: transactionId,
          transaction_date: formData.transaction_date,
          account_code: formData.coa_account_code,
          account_name: formData.coa_account_name,
          debit: 0,
          credit: formData.subtotal,
          description: `Pendapatan Jasa - ${formData.item_name}`,
          created_by: user?.email || "system",
        });

        // 3️⃣ Cr PPN Keluaran (if any)
        if (formData.tax_amount > 0) {
          journalEntries.push({
            transaction_id: transactionId,
            transaction_date: formData.transaction_date,
            account_code: "2-1250",
            account_name: "Hutang PPN",
            debit: 0,
            credit: formData.tax_amount,
            description: `PPN Keluaran ${formData.tax_percentage}%`,
            created_by: user?.email || "system",
          });
        }
      }

      // Insert journal entries using simple await without onConflict
      const { data: insertedJournals, error: journalError } = await supabase
        .from("journal_entries")
        .insert(journalEntries)
        .select();

      if (journalError) {
        console.error("Journal error:", journalError);
        toast({
          title: "Warning",
          description: "Transaksi tersimpan tapi jurnal gagal dibuat",
          variant: "destructive",
        });
      } else {
        toast({
          title: "📝 Jurnal Otomatis Dibuat",
          description: `${journalEntries.length} entri jurnal berhasil dibuat untuk transaksi ${transactionId}`,
        });

        // Insert journal_entry_lines for each journal entry
        if (insertedJournals && insertedJournals.length > 0) {
          const journalLines = insertedJournals.map((journal: any) => ({
            journal_id: journal.id,
            account_code: journal.account_code,
            account_name: journal.account_name,
            debit: journal.debit,
            credit: journal.credit,
            description: journal.description,
          }));

          const { error: linesError } = await supabase
            .from("journal_entry_lines")
            .insert(journalLines);

          if (linesError) {
            console.error("Journal lines error:", linesError);
          }
        }
      }

      // Step 5: Show success notification
      toast({
        title: "✅ Berhasil!",
        description:
          "Transaksi berhasil disimpan dan jurnal otomatis telah dibuat.",
      });

      // Reset form
      setFormData({
        transaction_date: new Date().toISOString().split("T")[0],
        transaction_type: "Barang",
        item_id: "",
        item_name: "",
        stock_current: 0,
        quantity: 0,
        stock_after: 0,
        unit_price: 0,
        subtotal: 0,
        tax_percentage: 11,
        tax_amount: 0,
        total_amount: 0,
        payment_method: "Tunai",
        customer_id: "",
        customer_name: "",
        coa_account_code: "",
        coa_account_name: "",
        notes: "",
        cost_per_unit: 0,
      });

      // Refresh items to get updated stock
      fetchItems();
      fetchSalesTransactions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan transaksi",
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
    }).format(value);
  };

  const isFormValid =
    formData.item_name &&
    formData.quantity > 0 &&
    formData.unit_price > 0 &&
    formData.customer_id &&
    formData.coa_account_code &&
    (formData.transaction_type === "Jasa" || formData.stock_after >= 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {isFormOpen && (
        <Card className="max-w-5xl mx-auto rounded-2xl shadow-md mb-6">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  Form Penjualan Barang & Jasa
                </CardTitle>
                <CardDescription>
                  Catat transaksi penjualan barang atau jasa dengan otomatis
                  update stok dan jurnal
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="ml-4"
              >
                Tutup
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Grid 2 Columns with gap-3 */}
              <div className="grid md:grid-cols-2 gap-3">
                {/* Tanggal Transaksi */}
                <div className="space-y-2">
                  <Label htmlFor="transaction_date">Tanggal Transaksi *</Label>
                  <Input
                    id="transaction_date"
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transaction_date: e.target.value,
                      })
                    }
                    required
                    className="border"
                  />
                </div>

                {/* Jenis Penjualan */}
                <div className="space-y-2">
                  <Label htmlFor="transaction_type">Jenis Penjualan *</Label>
                  <Select
                    value={formData.transaction_type}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        transaction_type: value,
                        item_id: "",
                        item_name: "",
                        stock_current: 0,
                        quantity: 0,
                        unit_price: 0,
                      })
                    }
                  >
                    <SelectTrigger id="transaction_type" className="border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Barang">Barang</SelectItem>
                      <SelectItem value="Jasa">Jasa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nama Barang/Jasa */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="item_id">
                    Nama{" "}
                    {formData.transaction_type === "Barang" ? "Barang" : "Jasa"}{" "}
                    *
                  </Label>
                  {formData.transaction_type === "Barang" ? (
                    <Select
                      value={formData.item_id}
                      onValueChange={handleItemChange}
                    >
                      <SelectTrigger id="item_id" className="border">
                        <SelectValue placeholder="Pilih barang..." />
                      </SelectTrigger>
                      <SelectContent>
                        {items.filter((item) => item.id).map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.item_name} (Stok: {item.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={formData.item_id}
                      onValueChange={handleServiceChange}
                    >
                      <SelectTrigger id="item_id" className="border">
                        <SelectValue placeholder="Pilih jasa..." />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceItems.filter((service) => service.id).map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.item_name} - {formatRupiah(service.price)}/
                            {service.unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Stok Saat Ini (only for Barang) */}
                {formData.transaction_type === "Barang" && (
                  <div className="space-y-2">
                    <Label htmlFor="stock_current">Stok Saat Ini</Label>
                    <Input
                      id="stock_current"
                      type="number"
                      value={formData.stock_current}
                      readOnly
                      className="bg-gray-100 border"
                    />
                  </div>
                )}

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: Number(e.target.value) || 0,
                      })
                    }
                    required
                    className="border"
                  />
                </div>

                {/* Stok Akhir (only for Barang) */}
                {formData.transaction_type === "Barang" && (
                  <div className="space-y-2">
                    <Label htmlFor="stock_after">Stok Akhir</Label>
                    <div className="relative">
                      <Input
                        id="stock_after"
                        type="number"
                        value={formData.stock_after}
                        readOnly
                        className={`bg-gray-100 border ${
                          formData.stock_after < 0
                            ? "border-red-500 text-red-600"
                            : ""
                        }`}
                      />
                      {formData.stock_after < 0 && (
                        <AlertCircle className="absolute right-3 top-2.5 h-5 w-5 text-red-500" />
                      )}
                    </div>
                    {stockWarning && (
                      <div className="bg-red-100 text-red-600 px-3 py-2 rounded-md text-sm font-medium border border-red-300">
                        {stockWarning}
                      </div>
                    )}
                  </div>
                )}

                {/* Harga per Unit */}
                <div className="space-y-2">
                  <Label htmlFor="unit_price">Harga per Unit *</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unit_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                    className={`border ${formData.transaction_type === "Jasa" ? "bg-gray-100" : ""}`}
                    readOnly={formData.transaction_type === "Jasa"}
                  />
                </div>

                {/* Total Harga */}
                <div className="space-y-2">
                  <Label htmlFor="subtotal">Total Harga</Label>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md shadow-sm">
                    <p className="text-lg font-semibold text-blue-700">
                      {formatRupiah(formData.subtotal)}
                    </p>
                  </div>
                </div>

                {/* Pajak */}
                <div className="space-y-2">
                  <Label htmlFor="tax_percentage">Pajak (%)</Label>
                  <Input
                    id="tax_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.tax_percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tax_percentage: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="border"
                  />
                </div>

                {/* Total Akhir */}
                <div className="space-y-2">
                  <Label htmlFor="total_amount">Total Akhir</Label>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md shadow-sm">
                    <p className="text-lg font-semibold text-green-700">
                      {formatRupiah(formData.total_amount)}
                    </p>
                  </div>
                </div>

                {/* Customer */}
                <div className="space-y-2">
                  <Label htmlFor="customer_id">Customer *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={handleCustomerChange}
                  >
                    <SelectTrigger id="customer_id" className="border">
                      <SelectValue placeholder="Pilih customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.filter((customer) => customer.id).map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="add_new"
                        className="text-blue-600 font-semibold"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Tambah customer baru
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Metode Pembayaran */}
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Metode Pembayaran *</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) =>
                      setFormData({ ...formData, payment_method: value })
                    }
                  >
                    <SelectTrigger id="payment_method" className="border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tunai">Tunai</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                      <SelectItem value="Kartu Kredit">Kartu Kredit</SelectItem>
                      <SelectItem value="Piutang">Piutang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Kode Akun COA */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="coa_account_code">
                    Kode Akun COA (Revenue) *
                  </Label>
                  <Select
                    value={formData.coa_account_code}
                    onValueChange={handleCOAChange}
                  >
                    <SelectTrigger id="coa_account_code" className="border">
                      <SelectValue placeholder="Pilih akun COA...">
                        {formData.coa_account_code && formData.coa_account_name
                          ? `${formData.coa_account_code} - ${formData.coa_account_name}`
                          : "Pilih akun COA..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {coaAccounts.map((account) => (
                        <SelectItem
                          key={account.account_code}
                          value={account.account_code}
                        >
                          {account.account_code} - {account.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Catatan */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Tambahkan catatan transaksi..."
                    rows={3}
                    className="border"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 border"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Simpan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add Customer Dialog */}
      <Dialog
        open={isAddCustomerDialogOpen}
        onOpenChange={setIsAddCustomerDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambahkan Customer Baru</DialogTitle>
            <DialogDescription>Isi detail customer baru</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddNewCustomer} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informasi Dasar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_customer_name">Nama Customer *</Label>
                  <Input
                    id="new_customer_name"
                    value={newCustomerData.customer_name}
                    onChange={(e) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        customer_name: e.target.value,
                      })
                    }
                    placeholder="PT. Customer Indonesia"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold">Informasi Kontak</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_contact_person">Contact Person *</Label>
                  <Input
                    id="new_contact_person"
                    value={newCustomerData.contact_person}
                    onChange={(e) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        contact_person: e.target.value,
                      })
                    }
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_phone_number">Phone *</Label>
                  <Input
                    id="new_phone_number"
                    value={newCustomerData.phone_number}
                    onChange={(e) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        phone_number: e.target.value,
                      })
                    }
                    placeholder="+62 812 3456 7890"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_email">Email *</Label>
                  <Input
                    id="new_email"
                    type="email"
                    value={newCustomerData.email}
                    onChange={(e) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        email: e.target.value,
                      })
                    }
                    placeholder="customer@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_city">City</Label>
                  <Input
                    id="new_city"
                    value={newCustomerData.city}
                    onChange={(e) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        city: e.target.value,
                      })
                    }
                    placeholder="Jakarta"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_country">Country</Label>
                  <Input
                    id="new_country"
                    value={newCustomerData.country}
                    onChange={(e) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        country: e.target.value,
                      })
                    }
                    placeholder="Indonesia"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_address">Address</Label>
                <Textarea
                  id="new_address"
                  value={newCustomerData.address}
                  onChange={(e) =>
                    setNewCustomerData({
                      ...newCustomerData,
                      address: e.target.value,
                    })
                  }
                  placeholder="Jl. Contoh No. 123"
                  rows={3}
                />
              </div>
            </div>

            {/* Tax Information */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold">Informasi Pajak</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_is_pkp">PKP</Label>
                  <Select
                    value={newCustomerData.is_pkp}
                    onValueChange={(value) =>
                      setNewCustomerData({ ...newCustomerData, is_pkp: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status PKP" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YES">Ya</SelectItem>
                      <SelectItem value="NO">Tidak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_tax_id">Tax ID / No. PKP</Label>
                  <Input
                    id="new_tax_id"
                    value={newCustomerData.tax_id}
                    onChange={(e) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        tax_id: e.target.value,
                      })
                    }
                    placeholder="01.234.567.8-901.000"
                  />
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold">Informasi Bank</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_bank_name">Bank Name</Label>
                  <Input
                    id="new_bank_name"
                    value={newCustomerData.bank_name}
                    onChange={(e) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        bank_name: e.target.value,
                      })
                    }
                    placeholder="Bank Mandiri"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_bank_account_holder">
                    Bank Account Holder
                  </Label>
                  <Input
                    id="new_bank_account_holder"
                    value={newCustomerData.bank_account_holder}
                    onChange={(e) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        bank_account_holder: e.target.value,
                      })
                    }
                    placeholder="PT. Customer Indonesia"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold">Informasi Tambahan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_payment_terms">Payment Terms</Label>
                  <Input
                    id="new_payment_terms"
                    value={newCustomerData.payment_terms}
                    onChange={(e) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        payment_terms: e.target.value,
                      })
                    }
                    placeholder="Net 30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_category">Category</Label>
                  <Select
                    value={newCustomerData.category}
                    onValueChange={(value) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        category: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Raw Materials">Bahan Baku</SelectItem>
                      <SelectItem value="Work in Process">
                        Barang Dalam Proses
                      </SelectItem>
                      <SelectItem value="Finished Goods">
                        Barang Jadi
                      </SelectItem>
                      <SelectItem value="Resale/Merchandise">
                        Barang Dagangan
                      </SelectItem>
                      <SelectItem value="Food">Makanan</SelectItem>
                      <SelectItem value="Beverage">Minuman</SelectItem>
                      <SelectItem value="Spare Parts">Suku Cadang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_currency">Currency *</Label>
                  <Select
                    value={newCustomerData.currency}
                    onValueChange={(value) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        currency: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDR">IDR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="SGD">SGD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_status">Status *</Label>
                  <Select
                    value={newCustomerData.status}
                    onValueChange={(value) =>
                      setNewCustomerData({ ...newCustomerData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Menyimpan..." : "Simpan Customer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddCustomerDialogOpen(false)}
                className="flex-1"
              >
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sales Transactions Report */}
      <Card className="max-w-7xl mx-auto mt-6 rounded-2xl shadow-md">
        <CardHeader className="p-4 bg-gradient-to-r from-green-600 to-emerald-600">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-white">
                Laporan Transaksi Penjualan
              </CardTitle>
              <CardDescription className="text-green-50">
                Daftar semua transaksi penjualan
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-white text-green-600 hover:bg-green-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Penjualan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari berdasarkan nama barang/jasa atau customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Tanggal</TableHead>
                  <TableHead className="font-semibold">Tipe</TableHead>
                  <TableHead className="font-semibold">
                    Nama Barang/Jasa
                  </TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold text-right">
                    Qty
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Harga
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Subtotal
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Pajak
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Total
                  </TableHead>
                  <TableHead className="font-semibold">Pembayaran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesTransactions
                  .filter(
                    (transaction) =>
                      transaction.item_name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      transaction.customer_name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()),
                  )
                  .map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(
                          transaction.transaction_date,
                        ).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            transaction.transaction_type === "Barang"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {transaction.transaction_type}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.item_name}
                      </TableCell>
                      <TableCell>{transaction.customer_name}</TableCell>
                      <TableCell className="text-right">
                        {transaction.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatRupiah(transaction.unit_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatRupiah(transaction.subtotal)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatRupiah(transaction.tax_amount)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatRupiah(transaction.total_amount)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            transaction.payment_method === "Tunai"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {transaction.payment_method}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                {salesTransactions.filter(
                  (transaction) =>
                    transaction.item_name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    transaction.customer_name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()),
                ).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-gray-500"
                    >
                      Tidak ada data transaksi penjualan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
