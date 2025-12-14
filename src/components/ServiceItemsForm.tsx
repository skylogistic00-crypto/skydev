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
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  DollarSign,
  Tag,
  RefreshCw,
} from "lucide-react";

interface ServiceItem {
  id: string;
  item_name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  is_active: boolean;
  coa_revenue_code?: string;
  coa_expense_code?: string;
  created_at: string;
}

interface COAAccount {
  account_code: string;
  account_name: string;
}

export default function ServiceItemsForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [coaAccounts, setCoaAccounts] = useState<COAAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);

  const [formData, setFormData] = useState({
    item_name: "",
    description: "",
    price: "",
    unit: "Unit",
    category: "",
    coa_revenue_code: "",
    coa_expense_code: "",
    is_active: true,
  });

  useEffect(() => {
    fetchServiceItems();
    fetchCOAAccounts();
  }, []);

  const fetchServiceItems = async () => {
    try {
      const { data, error } = await supabase
        .from("service_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServiceItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchCOAAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("account_code, account_name, description, account_type")
        .in("account_type", ["Revenue", "Expense"])
        .eq("is_active", true)
        .eq("is_header", false)
        .order("account_code");

      if (error) throw error;
      setCoaAccounts(data || []);
    } catch (error: any) {
      console.error("Error fetching COA:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        item_name: formData.item_name,
        description: formData.description,
        price: parseFloat(formData.price),
        unit: formData.unit,
        category: formData.category,
        coa_revenue_code: formData.coa_revenue_code || null,
        coa_expense_code: formData.coa_expense_code || null,
        is_active: formData.is_active,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("service_items")
          .update(dataToSubmit)
          .eq("id", editingItem.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Service item berhasil diupdate",
        });
      } else {
        const { error } = await supabase
          .from("service_items")
          .insert([dataToSubmit]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Service item berhasil ditambahkan",
        });
      }

      resetForm();
      fetchServiceItems();
      setIsDialogOpen(false);
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

  const handleEdit = (item: ServiceItem) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      description: item.description || "",
      price: item.price.toString(),
      unit: item.unit,
      category: item.category || "",
      coa_revenue_code: item.coa_revenue_code || "",
      coa_expense_code: item.coa_expense_code || "",
      is_active: item.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (item: ServiceItem) => {
    try {
      const { error } = await supabase
        .from("service_items")
        .update({ is_active: !item.is_active })
        .eq("id", item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Service item ${!item.is_active ? "diaktifkan" : "dinonaktifkan"}`,
      });

      fetchServiceItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus service item ini?")) return;

    try {
      const { error } = await supabase
        .from("service_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service item berhasil dihapus",
      });

      fetchServiceItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      item_name: "",
      description: "",
      price: "",
      unit: "Unit",
      category: "",
      coa_revenue_code: "",
      coa_expense_code: "",
      is_active: true,
    });
    setEditingItem(null);
  };

  const filteredItems = serviceItems.filter((item) => {
    const itemName = item.item_name || "";
    const description = item.description || "";

    const matchesSearch =
      itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === "all" || item.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(
    new Set(serviceItems.map((item) => item.category).filter(Boolean)),
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              Service Items
            </h1>
            <p className="text-gray-600 mt-2">
              Kelola daftar layanan/jasa yang ditawarkan
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Service Item" : "Tambah Service Item"}
                </DialogTitle>
                <DialogDescription>
                  Isi form di bawah untuk{" "}
                  {editingItem ? "mengupdate" : "menambahkan"} service item
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="item_name">Nama Layanan *</Label>
                    <Input
                      id="item_name"
                      value={formData.item_name}
                      onChange={(e) =>
                        setFormData({ ...formData, item_name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Harga *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Satuan</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) =>
                        setFormData({ ...formData, unit: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Unit">Unit</SelectItem>
                        <SelectItem value="Jam">Jam</SelectItem>
                        <SelectItem value="Hari">Hari</SelectItem>
                        <SelectItem value="Bulan">Bulan</SelectItem>
                        <SelectItem value="Paket">Paket</SelectItem>
                        <SelectItem value="Sesi">Sesi</SelectItem>
                        <SelectItem value="Project">Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      placeholder="e.g. Konsultasi, Instalasi"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coa_revenue">Akun Pendapatan (COA)</Label>
                    <Select
                      value={formData.coa_revenue_code}
                      onValueChange={(value) =>
                        setFormData({ ...formData, coa_revenue_code: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih akun pendapatan" />
                      </SelectTrigger>
                      <SelectContent>
                        {coaAccounts
                          .filter((acc) => acc.account_code.startsWith("4"))
                          .map((acc) => (
                            <SelectItem
                              key={acc.account_code}
                              value={acc.account_code}
                            >
                              {acc.account_code} - {acc.account_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coa_expense">Akun Beban (COA)</Label>
                    <Select
                      value={formData.coa_expense_code}
                      onValueChange={(value) =>
                        setFormData({ ...formData, coa_expense_code: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih akun beban (opsional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {coaAccounts
                          .filter((acc) => acc.account_code.startsWith("6"))
                          .map((acc) => (
                            <SelectItem
                              key={acc.account_code}
                              value={acc.account_code}
                            >
                              {acc.account_code} - {acc.account_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="is_active">Aktif</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading
                      ? "Menyimpan..."
                      : editingItem
                        ? "Update"
                        : "Simpan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari service item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.filter((cat) => cat).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchServiceItems}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Service Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Service Items</CardTitle>
            <CardDescription>
              Total: {filteredItems.length} service items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Layanan</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>COA Revenue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      Tidak ada service items
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.item_name}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {item.description || "-"}
                      </TableCell>
                      <TableCell>
                        {item.category && (
                          <Badge variant="outline">
                            <Tag className="h-3 w-3 mr-1" />
                            {item.category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.price)}
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {item.coa_revenue_code || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={item.is_active ? "default" : "secondary"}
                          onClick={() => handleToggleStatus(item)}
                          className="h-7 px-3 text-xs"
                        >
                          {item.is_active ? "Aktif" : "Nonaktif"}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
