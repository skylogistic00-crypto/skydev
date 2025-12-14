import { useState } from "react";
import { Barcode, Copy, Check, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface BarcodeResultCardProps {
  barcode: string;
  format: string;
  productName?: string;
  sku?: string;
  price?: number;
  stock?: number;
  isNewProduct?: boolean;
  timestamp?: string;
  onClose?: () => void;
  onApply?: (data: any) => void;
}

export default function BarcodeResultCard({
  barcode = "",
  format = "",
  productName,
  sku,
  price,
  stock,
  isNewProduct = false,
  timestamp,
  onClose,
  onApply,
}: BarcodeResultCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Tersalin",
      description: "Barcode berhasil disalin ke clipboard",
    });
  };

  const handleApply = () => {
    if (onApply) {
      onApply({
        barcode,
        sku,
        productName,
        price,
        stock,
      });
      toast({
        title: "Diterapkan",
        description: "Data barcode telah diterapkan ke form",
      });
    }
  };

  return (
    <Card className="bg-white shadow-lg border-2 border-emerald-200">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Barcode className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">Hasil Scan Barcode</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isNewProduct ? (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                Produk Baru
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Ditemukan
              </Badge>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {timestamp && (
          <CardDescription className="text-xs">
            {new Date(timestamp).toLocaleString("id-ID")}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">Barcode:</p>
            <Badge variant="outline">{format}</Badge>
          </div>
          <div className="bg-white rounded p-3 border border-slate-200">
            <code className="text-lg font-mono text-slate-800">{barcode}</code>
          </div>
        </div>

        {(productName || sku) && (
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-800">
                Informasi Produk
              </p>
            </div>
            <div className="space-y-2">
              {sku && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">SKU:</span>
                  <span className="text-sm font-medium text-slate-800">
                    {sku}
                  </span>
                </div>
              )}
              {productName && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Nama:</span>
                  <span className="text-sm font-medium text-slate-800">
                    {productName}
                  </span>
                </div>
              )}
              {price !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Harga:</span>
                  <span className="text-sm font-medium text-emerald-600">
                    Rp {price.toLocaleString("id-ID")}
                  </span>
                </div>
              )}
              {stock !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Stok:</span>
                  <span className="text-sm font-medium text-slate-800">
                    {stock} unit
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Tersalin
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Salin Barcode
              </>
            )}
          </Button>
          {onApply && (
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleApply}
            >
              Terapkan ke Form
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
