import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useToast } from "./ui/use-toast";
import {
  Search,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Check,
  X,
  CheckCheck,
  ArrowLeft,
  Filter,
  Calendar,
  User,
  Package,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ShoppingCart,
  Pencil,
  Trash2,
} from "lucide-react";
import PurchaseRequestForm from "./PurchaseRequestForm";
import Header from "./Header";
import Navigation from "./Navigation";
import { useNavigate } from "react-router-dom";
import {
  canClick,
  canDelete,
  canEdit,
  canApprovePR,
  canCompletePR,
} from "@/utils/roleAccess";

interface PurchaseRequest {
  request_date: string;
  name: string;
  request_code: string;
  item_name: string;
  total_amount: number;
  status: string;
}

export default function PurchaseRequestList() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PurchaseRequest[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [nameFilter, setNameFilter] = useState("__ALL__");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [nameOptions, setNameOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [showWarehouseDialog, setShowWarehouseDialog] = useState(false);
  const [selectedRequestCode, setSelectedRequestCode] = useState<string | null>(
    null,
  );
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const handleBack = () => {
    if (isDialogOpen) {
      setIsDialogOpen(false);
    }
    navigate("/dashboard");
  };

  useEffect(() => {
    fetchRequests();
    fetchNameOptions();
    fetchWarehouses();

    const channel = supabase
      .channel("purchase-requests-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "purchase_requests" },
        () => {
          fetchRequests();
          fetchNameOptions();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [startDate, endDate]);

  useEffect(() => {
    let filtered = requests;

    if (statusFilter !== "ALL") {
      filtered = filtered.filter(
        (req) => req.status.toUpperCase() === statusFilter,
      );
    }

    if (nameFilter !== "__ALL__") {
      filtered = filtered.filter((req) => req.name === nameFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter((req) => {
        const safeName = (req.name ?? "").toLowerCase();
        const safeItemName = (req.item_name ?? "").toLowerCase();
        const term = searchTerm.toLowerCase();
        return safeName.includes(term) || safeItemName.includes(term);
      });
    }

    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, nameFilter, requests]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("vw_purchase_requests")
        .select(
          "request_date, name, request_code, item_name, total_amount, status",
        );

      if (startDate) {
        query = query.gte("request_date", startDate);
      }

      if (endDate) {
        query = query.lte("request_date", endDate);
      }

      const { data, error } = await query.order("request_date", {
        ascending: false,
      });

      if (error) throw error;
      setRequests(data || []);
      setFilteredRequests(data || []);
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

  const fetchNameOptions = async () => {
    try {
      const { data, error } = await supabase
        .from("vw_purchase_requests")
        .select("name")
        .order("name");

      if (error) throw error;

      const uniqueNames = Array.from(
        new Set(data?.map((item) => item.name) || []),
      );
      setNameOptions(uniqueNames);
    } catch (error: any) {
      console.error("Error fetching name options:", error.message);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from("warehouses")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error: any) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const handleUpdateStatus = async (
    requestCode: string,
    newStatus: "APPROVED" | "REJECTED",
  ) => {
    // Check role permission for approve
    if (!canApprovePR(userRole)) {
      toast({
        title: "Akses Ditolak",
        description:
          "Anda tidak memiliki akses untuk approve/reject purchase request",
        variant: "destructive",
      });
      return;
    }

    setUpdatingCode(requestCode);
    try {
      const { error } = await supabase
        .from("purchase_requests")
        .update({ status: newStatus })
        .eq("request_code", requestCode);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Purchase Request ${newStatus.toLowerCase()}`,
      });

      await fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingCode(null);
    }
  };

  const handleComplete = async (requestCode: string) => {
    // Check role permission for complete
    if (!canCompletePR(userRole)) {
      toast({
        title: "Akses Ditolak",
        description:
          "Anda tidak memiliki akses untuk complete purchase request",
        variant: "destructive",
      });
      return;
    }

    // Show warehouse selection dialog
    setSelectedRequestCode(requestCode);
    setShowWarehouseDialog(true);
  };

  const handleConfirmComplete = async () => {
    if (!user?.id || !selectedRequestCode || !selectedWarehouseId) {
      toast({
        title: "Error",
        description: "Mohon pilih gudang terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setUpdatingCode(selectedRequestCode);
    try {
      const { error } = await supabase
        .from("purchase_requests")
        .update({
          status: "COMPLETED",
          completed_by: user.id,
          completed_at: new Date().toISOString(),
          warehouse_id: selectedWarehouseId,
        })
        .eq("request_code", selectedRequestCode);

      if (error) throw error;

      toast({
        title: "Success",
        description:
          "Request completed dan barang akan masuk ke gudang yang dipilih",
      });

      await fetchRequests();
      setShowWarehouseDialog(false);
      setSelectedRequestCode(null);
      setSelectedWarehouseId("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingCode(null);
    }
  };

  const handleEdit = (request: any) => {
    // Check role permission for edit
    if (!canEdit(userRole)) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki akses untuk edit purchase request",
        variant: "destructive",
      });
      return;
    }

    setEditingItem(request);
    setIsDialogOpen(true);
  };

  const handleDelete = async (requestCode: string) => {
    // Check role permission for delete
    if (!canDelete(userRole)) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki akses untuk delete purchase request",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Apakah Anda yakin ingin menghapus purchase request ini?"))
      return;

    try {
      const { error } = await supabase
        .from("purchase_requests")
        .delete()
        .eq("request_code", requestCode);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Purchase request berhasil dihapus",
      });

      await fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase();

    if (statusUpper === "PENDING") {
      return (
        <Badge className="flex items-center gap-1 w-fit bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-300">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    }
    if (statusUpper === "APPROVED") {
      return (
        <Badge className="flex items-center gap-1 w-fit bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-300">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      );
    }
    if (statusUpper === "REJECTED") {
      return (
        <Badge className="flex items-center gap-1 w-fit bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-300">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    }
    if (statusUpper === "COMPLETED") {
      return (
        <Badge className="flex items-center gap-1 w-fit bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300">
          <CheckCheck className="h-3 w-3" />
          Completed
        </Badge>
      );
    }
    return (
      <Badge className="flex items-center gap-1 w-fit bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300">
        {status}
      </Badge>
    );
  };

  const summaryData = {
    total: requests.length,
    pending: requests.filter((r) => r.status.toUpperCase() === "PENDING")
      .length,
    approved: requests.filter((r) => r.status.toUpperCase() === "APPROVED")
      .length,
    rejected: requests.filter((r) => r.status.toUpperCase() === "REJECTED")
      .length,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Sky Logistics */}
      <Header />

      {/* Navigation Menu */}
      <Navigation />

      {/* Page Title Section */}
      <div className="border-b bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 shadow-lg">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Purchase Requests
                </h1>
                <p className="text-sm text-blue-100">
                  Kelola dan lacak permintaan pembelian
                </p>
              </div>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              {canClick(userRole) && (
                <Button className="bg-white text-indigo-600 hover:bg-blue-50 shadow-md">
                  <Plus className="mr-2 h-4 w-4" />
                  New Purchase Request
                </Button>
              )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Purchase Request</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new purchase request
                </DialogDescription>
              </DialogHeader>
              <PurchaseRequestForm
                onSuccess={() => {
                  setIsDialogOpen(false);
                  fetchRequests();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards with gradient and icons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-lg bg-purple-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Total Requests
                </CardDescription>
                <FileText className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {summaryData.total}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Semua permintaan
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-emerald-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Pending
                </CardDescription>
                <Clock className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {summaryData.pending}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <AlertCircle className="mr-2 h-4 w-4" />
                Menunggu approval
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-pink-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Approved
                </CardDescription>
                <TrendingUp className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {summaryData.approved}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <CheckCircle className="mr-2 h-4 w-4" />
                Siap diproses
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-blue-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Rejected
                </CardDescription>
                <XCircle className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {summaryData.rejected}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <XCircle className="mr-2 h-4 w-4" />
                Tidak disetujui
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Filter className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-lg">Filter & Pencarian</span>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cari berdasarkan nama atau item..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <Select value={nameFilter} onValueChange={setNameFilter}>
                  <SelectTrigger className="w-[200px] border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Semua pemohon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ALL__">Semua pemohon</SelectItem>
                    {nameOptions.filter((name) => name).map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] border-slate-300 focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Status</SelectItem>
                    <SelectItem value="PENDING">⏱ Pending</SelectItem>
                    <SelectItem value="APPROVED">✓ Approved</SelectItem>
                    <SelectItem value="REJECTED">✗ Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-600" />
                  <label className="text-sm font-medium text-slate-700">
                    Start Date:
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-[160px] border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-600" />
                  <label className="text-sm font-medium text-slate-700">
                    End Date:
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-[160px] border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2">Memuat data purchase requests...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-100 to-blue-100 hover:from-slate-100 hover:to-blue-100">
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Request Date
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Name
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Request Code
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Item Name
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Total Amount
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Status
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request, index) => (
                    <TableRow
                      key={index}
                      className={`${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      } hover:bg-indigo-50 transition-colors border-b border-slate-100`}
                    >
                      <TableCell className="text-slate-700">
                        {new Date(request.request_date).toLocaleDateString(
                          "id-ID",
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {request.name}
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-indigo-600">
                        {request.request_code}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {request.item_name}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        {formatCurrency(request.total_amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {request.status.toUpperCase() === "PENDING" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                              onClick={() =>
                                handleUpdateStatus(
                                  request.request_code,
                                  "APPROVED",
                                )
                              }
                              disabled={updatingCode === request.request_code}
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-300"
                              onClick={() =>
                                handleUpdateStatus(
                                  request.request_code,
                                  "REJECTED",
                                )
                              }
                              disabled={updatingCode === request.request_code}
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {request.status.toUpperCase() === "APPROVED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
                            onClick={() => handleComplete(request.request_code)}
                            disabled={updatingCode === request.request_code}
                          >
                            <CheckCheck className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(request)}
                            className="hover:bg-orange-50"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4 text-orange-600" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(request.request_code)}
                            className="hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && filteredRequests.length === 0 && (
            <div className="p-12 text-center">
              <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                <ShoppingCart className="h-12 w-12 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium text-lg">
                Tidak ada purchase request ditemukan
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Coba ubah filter atau buat request baru
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Warehouse Selection Dialog */}
      <Dialog open={showWarehouseDialog} onOpenChange={setShowWarehouseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Gudang Tujuan</DialogTitle>
            <DialogDescription>
              Pilih gudang dimana barang akan disimpan setelah purchase request
              completed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select
              value={selectedWarehouseId}
              onValueChange={setSelectedWarehouseId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih gudang..." />
              </SelectTrigger>
              <SelectContent>
                {warehouses.filter((warehouse) => warehouse.id).map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.code} - {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowWarehouseDialog(false);
                setSelectedRequestCode(null);
                setSelectedWarehouseId("");
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirmComplete}
              disabled={!selectedWarehouseId || updatingCode !== null}
            >
              Confirm Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
