import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface Item {
  id: string;
  item_name: string;
  cost_per_unit: number;
  unit?: string;
  brand?: string;
  model?: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface COAAccount {
  account_code: string;
  account_name: string;
  description?: string;
  account_type?: string;
}

export default function InternalUsageForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [coaAccounts, setCOAAccounts] = useState<COAAccount[]>([]);
  
  const [formData, setFormData] = useState({
    usage_date: new Date().toISOString().split("T")[0],
    item_id: "",
    item_name: "",
    stock_current: 0,
    quantity: 0,
    stock_after: 0,
    unit_cost: 0,
    total_cost: 0,
    department_id: "",
    department_name: "",
    usage_location: "",
    coa_account_code: "",
    coa_account_name: "",
    purpose: "",
    verified_by: "",
    verified_by_name: "",
    notes: "",
  });

  const [stockWarning, setStockWarning] = useState("");

  useEffect(() => {
    fetchItems();
    fetchDepartments();
    fetchUsers();
    fetchCOAAccounts();
  }, []);

  useEffect(() => {
    // Calculate total cost
    const totalCost = formData.quantity * formData.unit_cost;
    setFormData(prev => ({ ...prev, total_cost: totalCost }));
  }, [formData.quantity, formData.unit_cost]);

  useEffect(() => {
    // Calculate stock after
    const stockAfter = formData.stock_current - formData.quantity;
    setFormData(prev => ({ ...prev, stock_after: stockAfter }));
    
    if (stockAfter < 0) {
      setStockWarning("⚠️ Stok tidak mencukupi!");
    } else {
      setStockWarning("");
    }
  }, [formData.stock_current, formData.quantity]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("stock")
      .select("id, item_name, cost_per_unit, unit, brand, model, qty_available")
      .order("item_name");
    
    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data barang",
        variant: "destructive",
      });
    } else {
      setItems(data || []);
    }
  };

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from("departments")
      .select("id, name, code")
      .eq("is_active", true)
      .order("name");
    
    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data departemen",
        variant: "destructive",
      });
    } else {
      setDepartments(data || []);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name")
      .order("email");
    
    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data user",
        variant: "destructive",
      });
    } else {
      setUsers(data || []);
    }
  };

  const fetchCOAAccounts = async () => {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("account_code, account_name, description, account_type")
      .eq("account_type", "Expense")
      .eq("is_active", true)
      .eq("is_header", false)
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
    const selectedItem = items.find(item => item.id === itemId);
    if (selectedItem) {
      setFormData(prev => ({
        ...prev,
        item_id: itemId,
        item_name: selectedItem.item_name,
        stock_current: 0,
        unit_cost: selectedItem.cost_per_unit || 0,
      }));
    }
  };

  const handleDepartmentChange = (departmentId: string) => {
    const selectedDept = departments.find(d => d.id === departmentId);
    if (selectedDept) {
      setFormData(prev => ({
        ...prev,
        department_id: departmentId,
        department_name: selectedDept.name,
        usage_location: selectedDept.name,
      }));
    }
  };

  const handleUserChange = (userId: string) => {
    const selectedUser = users.find(u => u.id === userId);
    if (selectedUser) {
      setFormData(prev => ({
        ...prev,
        verified_by: userId,
        verified_by_name: selectedUser.full_name || selectedUser.email,
      }));
    }
  };

  const handleCOAChange = (accountCode: string) => {
    const selectedAccount = coaAccounts.find(acc => acc.account_code === accountCode);
    if (selectedAccount) {
      setFormData(prev => ({
        ...prev,
        coa_account_code: accountCode,
        coa_account_name: selectedAccount.account_name,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.stock_after < 0) {
      toast({
        title: "Error",
        description: "Stok tidak mencukupi untuk pemakaian ini",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Step 1: Validate stock with edge function
      const { data: stockCheck, error: stockError } = await supabase.functions.invoke(
        "supabase-functions-check-stock-balance",
        {
          body: {
            item_id: formData.item_id,
            qty: formData.quantity,
          },
        }
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

      // Step 2: Insert internal usage transaction
      const { data: transaction, error: transactionError } = await supabase
        .from("internal_usage")
        .insert({
          usage_date: formData.usage_date,
          item_id: formData.item_id,
          item_name: formData.item_name,
          stock_before: formData.stock_current,
          quantity: formData.quantity,
          stock_after: formData.stock_after,
          unit_cost: formData.unit_cost,
          total_cost: formData.total_cost,
          department_id: formData.department_id,
          department_name: formData.department_name,
          usage_location: formData.usage_location,
          coa_account_code: formData.coa_account_code,
          coa_account_name: formData.coa_account_name,
          purpose: formData.purpose,
          verified_by: formData.verified_by,
          verified_by_name: formData.verified_by_name,
          notes: formData.notes,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Step 3: Update stock and create journal entries with type = "USAGE"
      const { error: updateError } = await supabase.functions.invoke(
        "supabase-functions-update-stock-after-transaction",
        {
          body: {
            transaction_id: transaction.id,
            item_id: formData.item_id,
            quantity: formData.quantity,
            type: "USAGE",
            transaction_date: formData.usage_date,
            total_amount: formData.total_cost,
            payment_method: "Internal",
            coa_account_code: formData.coa_account_code,
            coa_account_name: formData.coa_account_name,
          },
        }
      );

      if (updateError) {
        console.error("Update stock error:", updateError);
      }

      // Step 4: Show success notification
      toast({
        title: "✅ Berhasil!",
        description: "Transaksi berhasil disimpan dan stok telah diperbarui.",
      });

      // Reset form
      setFormData({
        usage_date: new Date().toISOString().split("T")[0],
        item_id: "",
        item_name: "",
        stock_current: 0,
        quantity: 0,
        stock_after: 0,
        unit_cost: 0,
        total_cost: 0,
        department_id: "",
        department_name: "",
        usage_location: "",
        coa_account_code: "",
        coa_account_name: "",
        purpose: "",
        verified_by: "",
        verified_by_name: "",
        notes: "",
      });

      // Refresh items to get updated stock
      fetchItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan pemakaian barang",
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
    formData.department_id &&
    formData.coa_account_code &&
    formData.purpose &&
    formData.verified_by &&
    formData.stock_after >= 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Card className="max-w-5xl mx-auto border shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Form Pemakaian Barang Habis Pakai</CardTitle>
          <CardDescription>
            Catat penggunaan barang internal dengan otomatis update stok dan jurnal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid 2 Columns */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Tanggal Pemakaian */}
              <div className="space-y-2">
                <Label htmlFor="usage_date">Tanggal Pemakaian *</Label>
                <Input
                  id="usage_date"
                  type="date"
                  value={formData.usage_date}
                  onChange={(e) =>
                    setFormData({ ...formData, usage_date: e.target.value })
                  }
                  required
                  className="border"
                />
              </div>

              {/* Nama Barang */}
              <div className="space-y-2">
                <Label htmlFor="item_id">Nama Barang *</Label>
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
                        {item.item_name} (Stok: {item.qty_available})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stok Saat Ini */}
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

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                  }
                  required
                  className="border"
                />
              </div>

              {/* Stok Akhir */}
              <div className="space-y-2">
                <Label htmlFor="stock_after">Stok Akhir</Label>
                <div className="relative">
                  <Input
                    id="stock_after"
                    type="number"
                    value={formData.stock_after}
                    readOnly
                    className={`bg-gray-100 border ${
                      formData.stock_after < 0 ? "border-red-500 text-red-600" : ""
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

              {/* Unit Cost */}
              <div className="space-y-2">
                <Label htmlFor="unit_cost">Unit Cost</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  step="0.01"
                  value={formData.unit_cost}
                  readOnly
                  className="bg-gray-100 border"
                />
              </div>

              {/* Total Biaya */}
              <div className="space-y-2">
                <Label htmlFor="total_cost">Total Biaya</Label>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md shadow-sm">
                  <p className="text-lg font-semibold text-blue-700">
                    {formatRupiah(formData.total_cost)}
                  </p>
                </div>
              </div>

              {/* Lokasi Penggunaan (Department) */}
              <div className="space-y-2">
                <Label htmlFor="department_id">Lokasi Penggunaan *</Label>
                <Select
                  value={formData.department_id}
                  onValueChange={handleDepartmentChange}
                >
                  <SelectTrigger id="department_id" className="border">
                    <SelectValue placeholder="Pilih departemen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.filter((dept) => dept.id).map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Kode Akun COA */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="coa_account_code">Kode Akun COA (Biaya) *</Label>
                <Select
                  value={formData.coa_account_code}
                  onValueChange={handleCOAChange}
                >
                  <SelectTrigger id="coa_account_code" className="border">
                    <SelectValue placeholder="Pilih akun COA..." />
                  </SelectTrigger>
                  <SelectContent>
                    {coaAccounts.filter((account) => account.account_code).map((account) => (
                      <SelectItem key={account.account_code} value={account.account_code}>
                        {account.account_code} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Keperluan */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="purpose">Keperluan *</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                  placeholder="Jelaskan keperluan penggunaan barang..."
                  rows={3}
                  required
                  className="border"
                />
              </div>

              {/* Diperiksa Oleh */}
              <div className="space-y-2">
                <Label htmlFor="verified_by">Diperiksa Oleh *</Label>
                <Select
                  value={formData.verified_by}
                  onValueChange={handleUserChange}
                >
                  <SelectTrigger id="verified_by" className="border">
                    <SelectValue placeholder="Pilih user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter((user) => user.id).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Catatan */}
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Catatan tambahan..."
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
    </div>
  );
}