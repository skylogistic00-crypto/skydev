import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Truck, 
  MapPin, 
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  User,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DeliveryType {
  id: string;
  delivery_number: string;
  customer_name: string;
  customer_phone?: string;
  delivery_address: string;
  city?: string;
province

  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  delivery_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Supplier {
  id: string;
  supplier_name: string;
  phone_number?: string;
  address?: string;
  city?: string;

}

export default function DeliveryForm() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [deliveries, setDeliveries] = useState<DeliveryType[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<DeliveryType[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DeliveryType | null>(null);
  
  const [formData, setFormData] = useState<Partial<DeliveryType>>({
    delivery_number: '',
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    city: '',
    status: 'pending',
    delivery_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchDeliveries();
    fetchSuppliers();
    
    const deliveryChannel = supabase
      .channel('deliveries-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, fetchDeliveries)
      .subscribe();

    return () => {
      supabase.removeChannel(deliveryChannel);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, deliveries]);

  const fetchDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, supplier_name, phone_number, address, city')
        .order('supplier_name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const applyFilters = () => {
    let filtered = deliveries;

    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.delivery_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.delivery_address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    setFilteredDeliveries(filtered);
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      delivery_number: '',
      customer_name: '',
      customer_phone: '',
      delivery_address: '',
      city: '',
      postal_code: '',
      status: 'pending',
      delivery_date: '',
      notes: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: DeliveryType) => {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus delivery ini?')) return;

    try {
      const { error } = await supabase.from('deliveries').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Delivery berhasil dihapus' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('deliveries')
          .update(formData as any)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Delivery berhasil diupdate' });
      } else {
        const { error } = await supabase.from('deliveries').insert([formData as any]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Delivery berhasil ditambahkan' });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };


  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-yellow-500' },
      in_transit: { label: 'In Transit', className: 'bg-blue-500' },
      delivered: { label: 'Delivered', className: 'bg-green-500' },
      cancelled: { label: 'Cancelled', className: 'bg-red-500' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const summaryData = {
    total: deliveries.length,
    pending: deliveries.filter((d) => d.status === 'pending').length,
    in_transit: deliveries.filter((d) => d.status === 'in_transit').length,
    delivered: deliveries.filter((d) => d.status === 'delivered').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header with gradient */}
      <div className="border-b bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 shadow-lg">
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
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Delivery Management</h1>
                <p className="text-sm text-blue-100">Kelola pengiriman barang</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-lg bg-purple-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">Total Deliveries</CardDescription>
                <Truck className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">{summaryData.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <Package className="mr-2 h-4 w-4" />
                Total pengiriman
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-emerald-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">Pending</CardDescription>
                <Clock className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">{summaryData.pending}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <Clock className="mr-2 h-4 w-4" />
                Menunggu pengiriman
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-pink-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">In Transit</CardDescription>
                <MapPin className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">{summaryData.in_transit}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <Truck className="mr-2 h-4 w-4" />
                Dalam perjalanan
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-blue-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">Delivered</CardDescription>
                <CheckCircle className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">{summaryData.delivered}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <CheckCircle className="mr-2 h-4 w-4" />
                Terkirim
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-blue-50">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1 flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Cari nomor delivery, customer, atau alamat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Delivery
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>No. Delivery</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Kota</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Kirim</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredDeliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Tidak ada data delivery
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{delivery.delivery_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{delivery.customer_name}</div>
                          {delivery.customer_phone && (
                            <div className="text-sm text-slate-500">{delivery.customer_phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{delivery.delivery_address}</TableCell>
                      <TableCell>{delivery.city || '-'}</TableCell>
                      <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                      <TableCell>
                        {delivery.delivery_date
                          ? new Date(delivery.delivery_date).toLocaleDateString('id-ID')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(delivery)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(delivery.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
          </div>
        </div>
      </div>

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Delivery' : 'Tambah Delivery Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Update informasi delivery'
                : 'Masukkan informasi delivery baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_number">No. Delivery *</Label>
                  <Input
                    id="delivery_number"
                    value={formData.delivery_number}
                    onChange={(e) =>
                      setFormData({ ...formData, delivery_number: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Nama Customer *</Label>
                  <Select
                    value={formData.customer_name}
                    onValueChange={(value) => {
                      const selectedSupplier = suppliers.find(s => s.supplier_name === value);
                      setFormData({ 
                        ...formData, 
                        customer_name: value,
                        customer_phone: selectedSupplier?.phone_number || '',
                        delivery_address: selectedSupplier?.address || '',
                        city: selectedSupplier?.city || '',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.supplier_name}>
                          {supplier.supplier_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_phone">No. Telepon</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_address">Alamat Pengiriman *</Label>
                <Input
                  id="delivery_address"
                  value={formData.delivery_address}
                  onChange={(e) =>
                    setFormData({ ...formData, delivery_address: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_date">Tanggal Pengiriman</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) =>
                    setFormData({ ...formData, delivery_date: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingItem ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
