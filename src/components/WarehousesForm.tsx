import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useToast } from "./ui/use-toast";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Warehouse,
  MapPin,
  Grid3x3,
  Package2,
  Building2,
  Layers,
  Box,
  Calendar,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WarehouseType {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  phone?: string;
  manager_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ZoneType {
  id: string;
  warehouse_id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RackType {
  id: string;
  zone_id: string;
  name: string;
  code: string;
  level?: number;
  capacity?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LotType {
  id: string;
  rack_id: string;
  lot_number: string;
  item_name?: string;
  quantity: number;
  manufacturing_date?: string;
  expiry_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function WarehousesForm() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [zones, setZones] = useState<ZoneType[]>([]);
  const [racks, setRacks] = useState<RackType[]>([]);
  const [lots, setLots] = useState<LotType[]>([]);

  const [filteredWarehouses, setFilteredWarehouses] = useState<WarehouseType[]>(
    [],
  );
  const [filteredZones, setFilteredZones] = useState<ZoneType[]>([]);
  const [filteredRacks, setFilteredRacks] = useState<RackType[]>([]);
  const [filteredLots, setFilteredLots] = useState<LotType[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("warehouses");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchAllData();

    const warehouseChannel = supabase
      .channel("warehouses-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "warehouses" },
        fetchAllData,
      )
      .subscribe();

    const zoneChannel = supabase
      .channel("zones-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "zones" },
        fetchAllData,
      )
      .subscribe();

    const rackChannel = supabase
      .channel("racks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "racks" },
        fetchAllData,
      )
      .subscribe();

    const lotChannel = supabase
      .channel("lots-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lots" },
        fetchAllData,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(warehouseChannel);
      supabase.removeChannel(zoneChannel);
      supabase.removeChannel(rackChannel);
      supabase.removeChannel(lotChannel);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, warehouses, zones, racks, lots, activeTab]);

  const fetchAllData = async () => {
    try {
      const [warehousesRes, zonesRes, racksRes, lotsRes] = await Promise.all([
        supabase
          .from("warehouses")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("zones")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("racks")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("lots")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (warehousesRes.error) throw warehousesRes.error;
      if (zonesRes.error) throw zonesRes.error;
      if (racksRes.error) throw racksRes.error;
      if (lotsRes.error) throw lotsRes.error;

      setWarehouses(warehousesRes.data || []);
      setZones(zonesRes.data || []);
      setRacks(racksRes.data || []);
      setLots(lotsRes.data || []);
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

  const applyFilters = () => {
    let filtered: any[] = [];

    switch (activeTab) {
      case "warehouses":
        filtered = warehouses;
        break;
      case "zones":
        filtered = zones;
        break;
      case "racks":
        filtered = racks;
        break;
      case "lots":
        filtered = lots;
        break;
    }

    if (statusFilter !== "ALL") {
      const isActive = statusFilter === "ACTIVE";
      filtered = filtered.filter((item) => item.is_active === isActive);
    }

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    }

    switch (activeTab) {
      case "warehouses":
        setFilteredWarehouses(filtered);
        break;
      case "zones":
        setFilteredZones(filtered);
        break;
      case "racks":
        setFilteredRacks(filtered);
        break;
      case "lots":
        setFilteredLots(filtered);
        break;
    }
  };

  const handleOpenDialog = (item?: any) => {
    setEditingItem(item || null);

    if (item) {
      setFormData(item);
    } else {
      setFormData({});
    }

    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let table = "";
      switch (activeTab) {
        case "warehouses":
          table = "warehouses";
          break;
        case "zones":
          table = "zones";
          break;
        case "racks":
          table = "racks";
          break;
        case "lots":
          table = "lots";
          break;
      }

      if (editingItem) {
        const { error } = await supabase
          .from(table)
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: `${activeTab} updated successfully`,
        });
      } else {
        const { error } = await supabase.from(table).insert([formData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: `${activeTab} created successfully`,
        });
      }

      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      let table = "";
      switch (activeTab) {
        case "warehouses":
          table = "warehouses";
          break;
        case "zones":
          table = "zones";
          break;
        case "racks":
          table = "racks";
          break;
        case "lots":
          table = "lots";
          break;
      }

      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      toast({
        title: "Success",
        description: `${activeTab} deleted successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  const isEditor =
    userProfile?.role_name === "admin" ||
    userProfile?.role_name === "editor" ||
    userProfile?.role_name === "super_admin";

  console.log("User Profile:", userProfile);
  console.log("User Role:", userProfile?.role_name);
  console.log("Is Editor:", isEditor);

  const summaryData = {
    warehouses: warehouses.length,
    zones: zones.length,
    racks: racks.length,
    lots: lots.length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
                <Warehouse className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Warehouses Management
                </h1>
                <p className="text-sm text-blue-100">
                  Kelola gudang, zona, rak, dan lot
                </p>
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
                <CardDescription className="text-white/90">
                  Warehouses
                </CardDescription>
                <Building2 className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {summaryData.warehouses}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <Warehouse className="mr-2 h-4 w-4" />
                Total gudang
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-emerald-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Zones
                </CardDescription>
                <MapPin className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {summaryData.zones}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <Layers className="mr-2 h-4 w-4" />
                Total zona
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-pink-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Racks
                </CardDescription>
                <Grid3x3 className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {summaryData.racks}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <Box className="mr-2 h-4 w-4" />
                Total rak
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-blue-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Lots
                </CardDescription>
                <Package2 className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {summaryData.lots}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <Package2 className="mr-2 h-4 w-4" />
                Total lot
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Content */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="warehouses"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-6 py-4"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Warehouses
                </TabsTrigger>
                <TabsTrigger
                  value="zones"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-6 py-4"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Zones
                </TabsTrigger>
                <TabsTrigger
                  value="racks"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-6 py-4"
                >
                  <Grid3x3 className="mr-2 h-4 w-4" />
                  Racks
                </TabsTrigger>
                <TabsTrigger
                  value="lots"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-6 py-4"
                >
                  <Package2 className="mr-2 h-4 w-4" />
                  Lots
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Filters */}
            <div className="p-6 border-b bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Filter className="h-5 w-5 text-indigo-600" />
                    </div>
                    <span className="text-lg">Filter & Pencarian</span>
                  </div>
                  {isEditor && (
                    <Button
                      onClick={() => handleOpenDialog()}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {activeTab === "warehouses" && "+ Tambahkan Gudang"}
                      {activeTab === "zones" && "+ Tambahkan Zona"}
                      {activeTab === "racks" && "+ Tambahkan Rack"}
                      {activeTab === "lots" && "+ Tambahkan Lot"}
                    </Button>
                  )}
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Cari..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px] border-slate-300 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Warehouses Tab */}
            <TabsContent value="warehouses" className="m-0">
              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="mt-2">Memuat data...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-100 to-blue-100 hover:from-slate-100 hover:to-blue-100">
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-indigo-600" />
                            Name
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Grid3x3 className="h-4 w-4 text-blue-600" />
                            Code
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-purple-600" />
                            Address
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-emerald-600" />
                            City
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Badge className="h-4 w-4 text-pink-600" />
                            Status
                          </div>
                        </TableHead>
                        {isEditor && (
                          <TableHead className="font-semibold text-slate-700 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <Edit className="h-4 w-4 text-slate-600" />
                              Actions
                            </div>
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWarehouses.map((warehouse) => (
                        <TableRow
                          key={warehouse.id}
                          className="hover:bg-indigo-50 transition-colors border-b border-slate-100"
                        >
                          <TableCell className="font-medium text-slate-900">
                            {warehouse.name}
                          </TableCell>
                          <TableCell className="text-slate-700">
                            {warehouse.code}
                          </TableCell>
                          <TableCell className="text-slate-700">
                            {warehouse.address || "-"}
                          </TableCell>
                          <TableCell className="text-slate-700">
                            {warehouse.city || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                warehouse.is_active ? "default" : "secondary"
                              }
                            >
                              {warehouse.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          {isEditor && (
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDialog(warehouse)}
                                  className="hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(warehouse.id)}
                                  className="hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Zones Tab */}
            <TabsContent value="zones" className="m-0">
              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="mt-2">Memuat data...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-100 to-blue-100 hover:from-slate-100 hover:to-blue-100">
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-indigo-600" />
                            Name
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Grid3x3 className="h-4 w-4 text-blue-600" />
                            Code
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-purple-600" />
                            Warehouse
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Package2 className="h-4 w-4 text-emerald-600" />
                            Description
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Badge className="h-4 w-4 text-pink-600" />
                            Status
                          </div>
                        </TableHead>
                        {isEditor && (
                          <TableHead className="font-semibold text-slate-700 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <Edit className="h-4 w-4 text-slate-600" />
                              Actions
                            </div>
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredZones.map((zone) => {
                        const warehouse = warehouses.find(
                          (w) => w.id === zone.warehouse_id,
                        );
                        return (
                          <TableRow
                            key={zone.id}
                            className="hover:bg-indigo-50 transition-colors border-b border-slate-100"
                          >
                            <TableCell className="font-medium text-slate-900">
                              {zone.name}
                            </TableCell>
                            <TableCell className="text-slate-700">
                              {zone.code}
                            </TableCell>
                            <TableCell className="text-slate-700">
                              {warehouse?.name || "-"}
                            </TableCell>
                            <TableCell className="text-slate-700">
                              {zone.description || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  zone.is_active ? "default" : "secondary"
                                }
                              >
                                {zone.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            {isEditor && (
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenDialog(zone)}
                                    className="hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4 text-blue-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(zone.id)}
                                    className="hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Racks Tab */}
            <TabsContent value="racks" className="m-0">
              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="mt-2">Memuat data...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-100 to-blue-100 hover:from-slate-100 hover:to-blue-100">
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Grid3x3 className="h-4 w-4 text-indigo-600" />
                            Name
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Grid3x3 className="h-4 w-4 text-blue-600" />
                            Code
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-purple-600" />
                            Zone
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-emerald-600" />
                            Level
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Box className="h-4 w-4 text-orange-600" />
                            Capacity
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Badge className="h-4 w-4 text-pink-600" />
                            Status
                          </div>
                        </TableHead>
                        {isEditor && (
                          <TableHead className="font-semibold text-slate-700 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <Edit className="h-4 w-4 text-slate-600" />
                              Actions
                            </div>
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRacks.map((rack) => {
                        const zone = zones.find((z) => z.id === rack.zone_id);
                        return (
                          <TableRow
                            key={rack.id}
                            className="hover:bg-indigo-50 transition-colors border-b border-slate-100"
                          >
                            <TableCell className="font-medium text-slate-900">
                              {rack.name}
                            </TableCell>
                            <TableCell className="text-slate-700">
                              {rack.code}
                            </TableCell>
                            <TableCell className="text-slate-700">
                              {zone?.name || "-"}
                            </TableCell>
                            <TableCell className="text-slate-700">
                              {rack.level || "-"}
                            </TableCell>
                            <TableCell className="text-slate-700">
                              {rack.capacity || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  rack.is_active ? "default" : "secondary"
                                }
                              >
                                {rack.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            {isEditor && (
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenDialog(rack)}
                                    className="hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4 text-blue-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(rack.id)}
                                    className="hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Lots Tab */}
            <TabsContent value="lots" className="m-0">
              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="mt-2">Memuat data...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-100 to-blue-100 hover:from-slate-100 hover:to-blue-100">
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Package2 className="h-4 w-4 text-indigo-600" />
                            Lot Number
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Box className="h-4 w-4 text-blue-600" />
                            Item Name
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Grid3x3 className="h-4 w-4 text-purple-600" />
                            Rack
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Package2 className="h-4 w-4 text-emerald-600" />
                            Quantity
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-orange-600" />
                            Mfg Date
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-red-600" />
                            Exp Date
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <Badge className="h-4 w-4 text-pink-600" />
                            Status
                          </div>
                        </TableHead>
                        {isEditor && (
                          <TableHead className="font-semibold text-slate-700 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <Edit className="h-4 w-4 text-slate-600" />
                              Actions
                            </div>
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLots.map((lot) => {
                        const rack = racks.find((r) => r.id === lot.rack_id);
                        return (
                          <TableRow
                            key={lot.id}
                            className="hover:bg-indigo-50 transition-colors border-b border-slate-100"
                          >
                            <TableCell className="font-medium text-slate-900">
                              {lot.lot_number}
                            </TableCell>
                            <TableCell className="text-slate-700">
                              {lot.item_name || "-"}
                            </TableCell>
                            <TableCell className="text-slate-700">
                              {rack?.name || "-"}
                            </TableCell>
                            <TableCell className="text-slate-700">
                              {lot.quantity}
                            </TableCell>
                            <TableCell className="text-slate-700">
                              {lot.manufacturing_date
                                ? new Date(
                                    lot.manufacturing_date,
                                  ).toLocaleDateString("id-ID")
                                : "-"}
                            </TableCell>
                            <TableCell className="text-slate-700">
                              {lot.expiry_date
                                ? new Date(lot.expiry_date).toLocaleDateString(
                                    "id-ID",
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  lot.is_active ? "default" : "secondary"
                                }
                              >
                                {lot.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            {isEditor && (
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenDialog(lot)}
                                    className="hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4 text-blue-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(lot.id)}
                                    className="hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {!loading && (
            <>
              {activeTab === "warehouses" &&
                filteredWarehouses.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                      <Building2 className="h-12 w-12 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium text-lg">
                      Tidak ada warehouses ditemukan
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Coba ubah filter atau pencarian
                    </p>
                  </div>
                )}
              {activeTab === "zones" && filteredZones.length === 0 && (
                <div className="p-12 text-center">
                  <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                    <MapPin className="h-12 w-12 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium text-lg">
                    Tidak ada zones ditemukan
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Coba ubah filter atau pencarian
                  </p>
                </div>
              )}
              {activeTab === "racks" && filteredRacks.length === 0 && (
                <div className="p-12 text-center">
                  <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                    <Grid3x3 className="h-12 w-12 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium text-lg">
                    Tidak ada racks ditemukan
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Coba ubah filter atau pencarian
                  </p>
                </div>
              )}
              {activeTab === "lots" && filteredLots.length === 0 && (
                <div className="p-12 text-center">
                  <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                    <Package2 className="h-12 w-12 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium text-lg">
                    Tidak ada lots ditemukan
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Coba ubah filter atau pencarian
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dialog for Add/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `Edit ${activeTab}` : `Add New ${activeTab}`}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? `Update the ${activeTab} information`
                : `Create a new ${activeTab}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {activeTab === "warehouses" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      value={formData.code || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="province">Province</Label>
                      <Input
                        id="province"
                        value={formData.province || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, province: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={formData.postal_code || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            postal_code: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="manager_name">Manager Name</Label>
                    <Input
                      id="manager_name"
                      value={formData.manager_name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          manager_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active ?? true}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </>
              )}

              {activeTab === "zones" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="warehouse_id">Warehouse *</Label>
                    <Select
                      value={formData.warehouse_id || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, warehouse_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.filter((w) => w.id).map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      value={formData.code || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active ?? true}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </>
              )}

              {activeTab === "racks" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="zone_id">Zone *</Label>
                    <Select
                      value={formData.zone_id || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, zone_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.filter((z) => z.id).map((z) => (
                          <SelectItem key={z.id} value={z.id}>
                            {z.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      value={formData.code || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="level">Level</Label>
                      <Input
                        id="level"
                        type="number"
                        value={formData.level || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            level: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="capacity">Capacity</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            capacity: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active ?? true}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </>
              )}

              {activeTab === "lots" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="rack_id">Rack *</Label>
                    <Select
                      value={formData.rack_id || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, rack_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rack" />
                      </SelectTrigger>
                      <SelectContent>
                        {racks.filter((r) => r.id).map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lot_number">Lot Number *</Label>
                    <Input
                      id="lot_number"
                      value={formData.lot_number || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, lot_number: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="item_name">Item Name</Label>
                    <Input
                      id="item_name"
                      value={formData.item_name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, item_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="manufacturing_date">
                        Manufacturing Date
                      </Label>
                      <Input
                        id="manufacturing_date"
                        type="date"
                        value={formData.manufacturing_date || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            manufacturing_date: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="expiry_date">Expiry Date</Label>
                      <Input
                        id="expiry_date"
                        type="date"
                        value={formData.expiry_date || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expiry_date: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active ?? true}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {editingItem ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
