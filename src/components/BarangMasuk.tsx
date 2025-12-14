import { useState } from "react";
import OCRScanButton from "./OCRScanButton";
import BarcodeScanButton from "./BarcodeScanButton";
import { useToast } from "@/components/ui/use-toast";
import { useWarehouseScan, WarehouseAutofillData } from "@/hooks/useWarehouseScan";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { navigateBack } from "@/utils/navigation";

export default function BarangMasuk() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sku: "",
    item_name: "",
    quantity: "",
    batch_number: "",
    expired_date: "",
    location: "",
    supplier: "",
    unit: "pcs",
  });

  // Warehouse scan hook for autofill (Mutation)
  const { processBarcodeScan, processOCRScan, isProcessing } = useWarehouseScan({
    formType: "mutation",
    onAutofill: (data: WarehouseAutofillData) => {
      setFormData((prev) => ({
        ...prev,
        sku: data.sku || prev.sku,
        item_name: data.item_name || prev.item_name,
        quantity: data.quantity?.toString() || prev.quantity,
        batch_number: data.batch_number || prev.batch_number,
        expired_date: data.expired_date || prev.expired_date,
        location: data.location || prev.location,
        supplier: data.supplier || prev.supplier,
        unit: data.unit || prev.unit,
      }));
      if (data.is_new_item) {
        toast({
          title: "Item Baru Dibuat",
          description: `SKU: ${data.sku} telah dibuat otomatis`,
        });
      }
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-6 px-4 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateBack(navigate)}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Package className="h-6 w-6" />
                  Barang Masuk / Mutasi Stok
                </h1>
                <p className="text-blue-100 text-sm">
                  Kelola penerimaan dan mutasi barang gudang
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6 bg-white shadow-lg rounded-xl border border-slate-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Form Barang Masuk</CardTitle>
                <CardDescription>
                  Scan barcode atau OCR untuk mengisi otomatis
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <OCRScanButton
                  onImageUploaded={(url, filePath) => {
                    toast({
                      title: "Gambar berhasil diupload",
                      description: `File: ${filePath}`,
                    });
                  }}
                  onTextExtracted={(text) => {
                    processOCRScan(text);
                  }}
                />
                <BarcodeScanButton
                  onBarcodeScanned={(code, format) => {
                    processBarcodeScan(code, format);
                  }}
                  onAutofill={(data) => {
                    if (data.sku) {
                      setFormData((prev) => ({
                        ...prev,
                        sku: data.sku || prev.sku,
                        item_name: data.product_name || prev.item_name,
                      }));
                    }
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder="SKU akan terisi otomatis dari scan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item_name">Nama Barang</Label>
                <Input
                  id="item_name"
                  value={formData.item_name}
                  onChange={(e) =>
                    setFormData({ ...formData, item_name: e.target.value })
                  }
                  placeholder="Nama barang"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  placeholder="Jumlah"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  placeholder="pcs, box, kg, dll"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch_number">Batch Number</Label>
                <Input
                  id="batch_number"
                  value={formData.batch_number}
                  onChange={(e) =>
                    setFormData({ ...formData, batch_number: e.target.value })
                  }
                  placeholder="Nomor batch"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expired_date">Expired Date</Label>
                <Input
                  id="expired_date"
                  type="date"
                  value={formData.expired_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expired_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Lokasi Rak</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Lokasi penyimpanan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier: e.target.value })
                  }
                  placeholder="Nama supplier"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigateBack(navigate)}>
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Simpan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

