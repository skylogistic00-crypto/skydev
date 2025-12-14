import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Clock,
  CheckCircle,
  Plane,
  DollarSign,
  ArrowLeft,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { canClick } from "@/utils/roleAccess";

interface AirWaybillForm {
  id?: string;
  awb_number: string;
  hawb_number: string;
  import_type: string;
  flight_number: string;
  flight_date: string;
  arrival_airport_code: string;
  origin_airport_code: string;
  shipper_name: string;
  shipper_address: string;
  consignee_name: string;
  consignee_address: string;
  consignee_npwp: string;
  consignee_contact: string;
  notify_party: string;
  number_of_packages: string;
  gross_weight_kg: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
  commodity_description: string;
  hs_code: string;
  value_of_goods: string;
  currency: string;
  incoterm: string;
  import_duty: string;
  ppn_import: string;
  pph_import: string;
  excise_duty: string;
  other_taxes: string;
  customs_declaration_number: string;
  customs_status: string;
  customs_clearance_date: string;
  freight_charge: string;
  handling_fee: string;
  storage_fee: string;
  insurance_fee: string;
  other_charge: string;
  payment_status: string;
  invoice_number: string;
  arrival_date: string;
  unloading_date: string;
  storage_location: string;
  delivery_order_number: string;
  delivery_date: string;
  status: string;
}

export default function AirWaybill() {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [formData, setFormData] = useState<AirWaybillForm>({
    awb_number: "",
    hawb_number: "",
    import_type: "DIRECT",
    flight_number: "",
    flight_date: "",
    arrival_airport_code: "",
    origin_airport_code: "",
    shipper_name: "",
    shipper_address: "",
    consignee_name: "",
    consignee_address: "",
    consignee_npwp: "",
    consignee_contact: "",
    notify_party: "",
    number_of_packages: "",
    gross_weight_kg: "",
    length_cm: "",
    width_cm: "",
    height_cm: "",
    commodity_description: "",
    hs_code: "",
    value_of_goods: "",
    currency: "USD",
    incoterm: "CIF",
    import_duty: "0",
    ppn_import: "0",
    pph_import: "0",
    excise_duty: "0",
    other_taxes: "0",
    customs_declaration_number: "",
    customs_status: "PENDING",
    customs_clearance_date: "",
    freight_charge: "0",
    handling_fee: "0",
    storage_fee: "0",
    insurance_fee: "0",
    other_charge: "0",
    payment_status: "UNPAID",
    invoice_number: "",
    arrival_date: "",
    unloading_date: "",
    storage_location: "",
    delivery_order_number: "",
    delivery_date: "",
    status: "ARRIVED",
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("airwaybills")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching airwaybills:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const itemData: any = {
        awb_number: formData.awb_number,
        hawb_number: formData.hawb_number || null,
        import_type: formData.import_type,
        flight_number: formData.flight_number || null,
        flight_date: formData.flight_date || null,
        arrival_airport_code: formData.arrival_airport_code,
        origin_airport_code: formData.origin_airport_code,
        shipper_name: formData.shipper_name || null,
        shipper_address: formData.shipper_address || null,
        consignee_name: formData.consignee_name || null,
        consignee_address: formData.consignee_address || null,
        consignee_npwp: formData.consignee_npwp || null,
        consignee_contact: formData.consignee_contact || null,
        notify_party: formData.notify_party || null,
        number_of_packages: parseInt(formData.number_of_packages),
        gross_weight_kg: parseFloat(formData.gross_weight_kg),
        length_cm: formData.length_cm ? parseFloat(formData.length_cm) : null,
        width_cm: formData.width_cm ? parseFloat(formData.width_cm) : null,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        commodity_description: formData.commodity_description || null,
        hs_code: formData.hs_code || null,
        value_of_goods: formData.value_of_goods
          ? parseFloat(formData.value_of_goods)
          : null,
        currency: formData.currency,
        incoterm: formData.incoterm,
        import_duty: parseFloat(formData.import_duty),
        ppn_import: parseFloat(formData.ppn_import),
        pph_import: parseFloat(formData.pph_import),
        excise_duty: parseFloat(formData.excise_duty),
        other_taxes: parseFloat(formData.other_taxes),
        customs_declaration_number: formData.customs_declaration_number || null,
        customs_status: formData.customs_status,
        customs_clearance_date: formData.customs_clearance_date || null,
        freight_charge: parseFloat(formData.freight_charge),
        handling_fee: parseFloat(formData.handling_fee),
        storage_fee: parseFloat(formData.storage_fee),
        insurance_fee: parseFloat(formData.insurance_fee),
        other_charge: parseFloat(formData.other_charge),
        payment_status: formData.payment_status,
        invoice_number: formData.invoice_number || null,
        arrival_date: formData.arrival_date || null,
        unloading_date: formData.unloading_date || null,
        storage_location: formData.storage_location || null,
        delivery_order_number: formData.delivery_order_number || null,
        delivery_date: formData.delivery_date || null,
        status: formData.status,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("airwaybills")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Air Waybill berhasil diupdate",
        });
      } else {
        const { error } = await supabase.from("airwaybills").insert(itemData);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Air Waybill berhasil ditambahkan",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchItems();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menyimpan data";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      awb_number: item.awb_number,
      hawb_number: item.hawb_number || "",
      import_type: item.import_type,
      flight_number: item.flight_number || "",
      flight_date: item.flight_date || "",
      arrival_airport_code: item.arrival_airport_code,
      origin_airport_code: item.origin_airport_code,
      shipper_name: item.shipper_name || "",
      shipper_address: item.shipper_address || "",
      consignee_name: item.consignee_name || "",
      consignee_address: item.consignee_address || "",
      consignee_npwp: item.consignee_npwp || "",
      consignee_contact: item.consignee_contact || "",
      notify_party: item.notify_party || "",
      number_of_packages: item.number_of_packages?.toString() || "",
      gross_weight_kg: item.gross_weight_kg?.toString() || "",
      length_cm: item.length_cm?.toString() || "",
      width_cm: item.width_cm?.toString() || "",
      height_cm: item.height_cm?.toString() || "",
      commodity_description: item.commodity_description || "",
      hs_code: item.hs_code || "",
      value_of_goods: item.value_of_goods?.toString() || "",
      currency: item.currency,
      incoterm: item.incoterm,
      import_duty: item.import_duty?.toString() || "0",
      ppn_import: item.ppn_import?.toString() || "0",
      pph_import: item.pph_import?.toString() || "0",
      excise_duty: item.excise_duty?.toString() || "0",
      other_taxes: item.other_taxes?.toString() || "0",
      customs_declaration_number: item.customs_declaration_number || "",
      customs_status: item.customs_status,
      customs_clearance_date: item.customs_clearance_date || "",
      freight_charge: item.freight_charge?.toString() || "0",
      handling_fee: item.handling_fee?.toString() || "0",
      storage_fee: item.storage_fee?.toString() || "0",
      insurance_fee: item.insurance_fee?.toString() || "0",
      other_charge: item.other_charge?.toString() || "0",
      payment_status: item.payment_status,
      invoice_number: item.invoice_number || "",
      arrival_date: item.arrival_date || "",
      unloading_date: item.unloading_date || "",
      storage_location: item.storage_location || "",
      delivery_order_number: item.delivery_order_number || "",
      delivery_date: item.delivery_date || "",
      status: item.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      const { error } = await supabase
        .from("airwaybills")
        .delete()
        .eq("id", deleteItem.id);

      if (error) throw error;

      toast({ title: "Success", description: "Air Waybill berhasil dihapus" });
      fetchItems();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menghapus data";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeleteItem(null);
    }
  };

  const resetForm = () => {
    setFormData({
      awb_number: "",
      hawb_number: "",
      import_type: "DIRECT",
      flight_number: "",
      flight_date: "",
      arrival_airport_code: "",
      origin_airport_code: "",
      shipper_name: "",
      shipper_address: "",
      consignee_name: "",
      consignee_address: "",
      consignee_npwp: "",
      consignee_contact: "",
      notify_party: "",
      number_of_packages: "",
      gross_weight_kg: "",
      length_cm: "",
      width_cm: "",
      height_cm: "",
      commodity_description: "",
      hs_code: "",
      value_of_goods: "",
      currency: "USD",
      incoterm: "CIF",
      import_duty: "0",
      ppn_import: "0",
      pph_import: "0",
      excise_duty: "0",
      other_taxes: "0",
      customs_declaration_number: "",
      customs_status: "PENDING",
      customs_clearance_date: "",
      freight_charge: "0",
      handling_fee: "0",
      storage_fee: "0",
      insurance_fee: "0",
      other_charge: "0",
      payment_status: "UNPAID",
      invoice_number: "",
      arrival_date: "",
      unloading_date: "",
      storage_location: "",
      delivery_order_number: "",
      delivery_date: "",
      status: "ARRIVED",
    });
    setEditingItem(null);
  };

  const formatCurrency = (amount: number, curr: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      ARRIVED: { variant: "secondary", icon: Plane },
      IN_CUSTOMS: { variant: "default", icon: Clock },
      CLEARED: { variant: "default", icon: CheckCircle },
      IN_STORAGE: { variant: "secondary", icon: Package },
      READY_FOR_DELIVERY: { variant: "default", icon: Package },
      DELIVERED: { variant: "default", icon: CheckCircle },
      CANCELLED: { variant: "destructive", icon: Clock },
    };

    const config = statusConfig[status] || {
      variant: "secondary",
      icon: Package,
    };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const arrivedCount = items.filter((item) => item.status === "ARRIVED").length;
  const inCustomsCount = items.filter(
    (item) => item.status === "IN_CUSTOMS",
  ).length;
  const clearedCount = items.filter((item) => item.status === "CLEARED").length;
  const deliveredCount = items.filter(
    (item) => item.status === "DELIVERED",
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50">
      {/* Header with gradient */}
      <div className="border-b bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 shadow-lg">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Air Waybill Management
              </h1>
              <p className="text-sky-100">
                Kelola data pengiriman dan customs clearance
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-sky-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Total AWB
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {items.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Plane className="w-4 h-4" />
                Arrived
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {arrivedCount}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                In Customs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {inCustomsCount}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Delivered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">
                {deliveredCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Daftar Air Waybill
              </h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  {canClick(userRole) && (
                    <Button
                      onClick={resetForm}
                      className="bg-sky-600 hover:bg-sky-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Air Waybill
                    </Button>
                  )}
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "Edit Air Waybill" : "Tambah Air Waybill"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="parties">Parties</TabsTrigger>
                        <TabsTrigger value="cargo">Cargo</TabsTrigger>
                        <TabsTrigger value="customs">Customs</TabsTrigger>
                        <TabsTrigger value="charges">Charges</TabsTrigger>
                      </TabsList>

                      {/* Basic Info Tab */}
                      <TabsContent value="basic" className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="awb_number">
                              AWB Number * (Format: 123-12345678 atau
                              12345678901)
                            </Label>
                            <Input
                              id="awb_number"
                              value={formData.awb_number}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  awb_number: e.target.value,
                                })
                              }
                              required
                              placeholder="123-12345678"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="hawb_number">HAWB Number</Label>
                            <Input
                              id="hawb_number"
                              value={formData.hawb_number}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  hawb_number: e.target.value,
                                })
                              }
                              placeholder="HAWB123456"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="import_type">Import Type *</Label>
                            <Select
                              value={formData.import_type}
                              onValueChange={(value) =>
                                setFormData({ ...formData, import_type: value })
                              }
                            >
                              <SelectTrigger id="import_type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DIRECT">Direct</SelectItem>
                                <SelectItem value="TRANSSHIPMENT">
                                  Transshipment
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="flight_number">Flight Number</Label>
                            <Input
                              id="flight_number"
                              value={formData.flight_number}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  flight_number: e.target.value,
                                })
                              }
                              placeholder="GA123"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="flight_date">Flight Date</Label>
                            <Input
                              id="flight_date"
                              type="date"
                              value={formData.flight_date}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  flight_date: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="origin_airport_code">
                              Origin Airport * (3 huruf, contoh: SIN)
                            </Label>
                            <Input
                              id="origin_airport_code"
                              value={formData.origin_airport_code}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  origin_airport_code:
                                    e.target.value.toUpperCase(),
                                })
                              }
                              required
                              maxLength={3}
                              placeholder="SIN"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="arrival_airport_code">
                              Arrival Airport * (3 huruf, contoh: CGK)
                            </Label>
                            <Input
                              id="arrival_airport_code"
                              value={formData.arrival_airport_code}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  arrival_airport_code:
                                    e.target.value.toUpperCase(),
                                })
                              }
                              required
                              maxLength={3}
                              placeholder="CGK"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="arrival_date">Arrival Date</Label>
                            <Input
                              id="arrival_date"
                              type="date"
                              value={formData.arrival_date}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  arrival_date: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="unloading_date">
                              Unloading Date
                            </Label>
                            <Input
                              id="unloading_date"
                              type="date"
                              value={formData.unloading_date}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  unloading_date: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="status">Status *</Label>
                            <Select
                              value={formData.status}
                              onValueChange={(value) =>
                                setFormData({ ...formData, status: value })
                              }
                            >
                              <SelectTrigger id="status">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ARRIVED">Arrived</SelectItem>
                                <SelectItem value="IN_CUSTOMS">
                                  In Customs
                                </SelectItem>
                                <SelectItem value="CLEARED">Cleared</SelectItem>
                                <SelectItem value="IN_STORAGE">
                                  In Storage
                                </SelectItem>
                                <SelectItem value="READY_FOR_DELIVERY">
                                  Ready for Delivery
                                </SelectItem>
                                <SelectItem value="DELIVERED">
                                  Delivered
                                </SelectItem>
                                <SelectItem value="CANCELLED">
                                  Cancelled
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Parties Tab */}
                      <TabsContent value="parties" className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="shipper_name">Shipper Name</Label>
                            <Input
                              id="shipper_name"
                              value={formData.shipper_name}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  shipper_name: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="consignee_name">
                              Consignee Name
                            </Label>
                            <Input
                              id="consignee_name"
                              value={formData.consignee_name}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  consignee_name: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="shipper_address">
                              Shipper Address
                            </Label>
                            <Textarea
                              id="shipper_address"
                              value={formData.shipper_address}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  shipper_address: e.target.value,
                                })
                              }
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="consignee_address">
                              Consignee Address
                            </Label>
                            <Textarea
                              id="consignee_address"
                              value={formData.consignee_address}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  consignee_address: e.target.value,
                                })
                              }
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="consignee_npwp">
                              Consignee NPWP
                            </Label>
                            <Input
                              id="consignee_npwp"
                              value={formData.consignee_npwp}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  consignee_npwp: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="consignee_contact">
                              Consignee Contact
                            </Label>
                            <Input
                              id="consignee_contact"
                              value={formData.consignee_contact}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  consignee_contact: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="notify_party">Notify Party</Label>
                            <Input
                              id="notify_party"
                              value={formData.notify_party}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  notify_party: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </TabsContent>

                      {/* Cargo Tab */}
                      <TabsContent value="cargo" className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="number_of_packages">
                              Number of Packages *
                            </Label>
                            <Input
                              id="number_of_packages"
                              type="number"
                              value={formData.number_of_packages}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  number_of_packages: e.target.value,
                                })
                              }
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="gross_weight_kg">
                              Gross Weight (kg) *
                            </Label>
                            <Input
                              id="gross_weight_kg"
                              type="number"
                              step="0.001"
                              value={formData.gross_weight_kg}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  gross_weight_kg: e.target.value,
                                })
                              }
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="length_cm">Length (cm)</Label>
                            <Input
                              id="length_cm"
                              type="number"
                              step="0.01"
                              value={formData.length_cm}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  length_cm: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="width_cm">Width (cm)</Label>
                            <Input
                              id="width_cm"
                              type="number"
                              step="0.01"
                              value={formData.width_cm}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  width_cm: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="height_cm">Height (cm)</Label>
                            <Input
                              id="height_cm"
                              type="number"
                              step="0.01"
                              value={formData.height_cm}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  height_cm: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="hs_code">HS Code</Label>
                            <Input
                              id="hs_code"
                              value={formData.hs_code}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  hs_code: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="commodity_description">
                              Commodity Description
                            </Label>
                            <Textarea
                              id="commodity_description"
                              value={formData.commodity_description}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  commodity_description: e.target.value,
                                })
                              }
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="value_of_goods">
                              Value of Goods
                            </Label>
                            <Input
                              id="value_of_goods"
                              type="number"
                              step="0.01"
                              value={formData.value_of_goods}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  value_of_goods: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="currency">
                              Currency * (3 huruf, contoh: USD)
                            </Label>
                            <Input
                              id="currency"
                              value={formData.currency}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  currency: e.target.value.toUpperCase(),
                                })
                              }
                              required
                              maxLength={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="incoterm">Incoterm *</Label>
                            <Select
                              value={formData.incoterm}
                              onValueChange={(value) =>
                                setFormData({ ...formData, incoterm: value })
                              }
                            >
                              <SelectTrigger id="incoterm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="EXW">EXW</SelectItem>
                                <SelectItem value="FCA">FCA</SelectItem>
                                <SelectItem value="CPT">CPT</SelectItem>
                                <SelectItem value="CIP">CIP</SelectItem>
                                <SelectItem value="DAP">DAP</SelectItem>
                                <SelectItem value="DPU">DPU</SelectItem>
                                <SelectItem value="DDP">DDP</SelectItem>
                                <SelectItem value="FAS">FAS</SelectItem>
                                <SelectItem value="FOB">FOB</SelectItem>
                                <SelectItem value="CFR">CFR</SelectItem>
                                <SelectItem value="CIF">CIF</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="storage_location">
                              Storage Location
                            </Label>
                            <Input
                              id="storage_location"
                              value={formData.storage_location}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  storage_location: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </TabsContent>

                      {/* Customs Tab */}
                      <TabsContent value="customs" className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="customs_status">
                              Customs Status *
                            </Label>
                            <Select
                              value={formData.customs_status}
                              onValueChange={(value) =>
                                setFormData({
                                  ...formData,
                                  customs_status: value,
                                })
                              }
                            >
                              <SelectTrigger id="customs_status">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="IN_PROCESS">
                                  In Process
                                </SelectItem>
                                <SelectItem value="CLEARED">Cleared</SelectItem>
                                <SelectItem value="HELD">Held</SelectItem>
                                <SelectItem value="REJECTED">
                                  Rejected
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="customs_declaration_number">
                              Customs Declaration Number
                            </Label>
                            <Input
                              id="customs_declaration_number"
                              value={formData.customs_declaration_number}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  customs_declaration_number: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="customs_clearance_date">
                              Customs Clearance Date
                            </Label>
                            <Input
                              id="customs_clearance_date"
                              type="date"
                              value={formData.customs_clearance_date}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  customs_clearance_date: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="import_duty">Import Duty</Label>
                            <Input
                              id="import_duty"
                              type="number"
                              step="0.01"
                              value={formData.import_duty}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  import_duty: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="ppn_import">PPN Import</Label>
                            <Input
                              id="ppn_import"
                              type="number"
                              step="0.01"
                              value={formData.ppn_import}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  ppn_import: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="pph_import">PPh Import</Label>
                            <Input
                              id="pph_import"
                              type="number"
                              step="0.01"
                              value={formData.pph_import}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  pph_import: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="excise_duty">Excise Duty</Label>
                            <Input
                              id="excise_duty"
                              type="number"
                              step="0.01"
                              value={formData.excise_duty}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  excise_duty: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="other_taxes">Other Taxes</Label>
                            <Input
                              id="other_taxes"
                              type="number"
                              step="0.01"
                              value={formData.other_taxes}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  other_taxes: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </TabsContent>

                      {/* Charges Tab */}
                      <TabsContent value="charges" className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="freight_charge">
                              Freight Charge
                            </Label>
                            <Input
                              id="freight_charge"
                              type="number"
                              step="0.01"
                              value={formData.freight_charge}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  freight_charge: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="handling_fee">Handling Fee</Label>
                            <Input
                              id="handling_fee"
                              type="number"
                              step="0.01"
                              value={formData.handling_fee}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  handling_fee: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="storage_fee">Storage Fee</Label>
                            <Input
                              id="storage_fee"
                              type="number"
                              step="0.01"
                              value={formData.storage_fee}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  storage_fee: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="insurance_fee">Insurance Fee</Label>
                            <Input
                              id="insurance_fee"
                              type="number"
                              step="0.01"
                              value={formData.insurance_fee}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  insurance_fee: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="other_charge">Other Charge</Label>
                            <Input
                              id="other_charge"
                              type="number"
                              step="0.01"
                              value={formData.other_charge}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  other_charge: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="payment_status">
                              Payment Status *
                            </Label>
                            <Select
                              value={formData.payment_status}
                              onValueChange={(value) =>
                                setFormData({
                                  ...formData,
                                  payment_status: value,
                                })
                              }
                            >
                              <SelectTrigger id="payment_status">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="UNPAID">Unpaid</SelectItem>
                                <SelectItem value="PARTIAL">Partial</SelectItem>
                                <SelectItem value="PAID">Paid</SelectItem>
                                <SelectItem value="OVERDUE">Overdue</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="invoice_number">
                              Invoice Number
                            </Label>
                            <Input
                              id="invoice_number"
                              value={formData.invoice_number}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  invoice_number: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="delivery_order_number">
                              Delivery Order Number
                            </Label>
                            <Input
                              id="delivery_order_number"
                              value={formData.delivery_order_number}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  delivery_order_number: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="delivery_date">Delivery Date</Label>
                            <Input
                              id="delivery_date"
                              type="date"
                              value={formData.delivery_date}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  delivery_date: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-2 pt-4 border-t">
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
                      <Button
                        type="submit"
                        className="bg-sky-600 hover:bg-sky-700"
                      >
                        {editingItem ? "Update" : "Simpan"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>AWB Number</TableHead>
                    <TableHead>Flight</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Consignee</TableHead>
                    <TableHead>Packages</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                    <TableHead>Customs Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center py-8 text-slate-500"
                      >
                        Belum ada data air waybill
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">
                          {item.awb_number}
                        </TableCell>
                        <TableCell>{item.flight_number || "-"}</TableCell>
                        <TableCell>
                          {item.origin_airport_code} →{" "}
                          {item.arrival_airport_code}
                        </TableCell>
                        <TableCell>{item.consignee_name || "-"}</TableCell>
                        <TableCell>{item.number_of_packages}</TableCell>
                        <TableCell>{item.gross_weight_kg}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {item.customs_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.payment_status === "PAID"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {item.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteItem(item)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus air waybill{" "}
              <span className="font-semibold">{deleteItem?.awb_number}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
