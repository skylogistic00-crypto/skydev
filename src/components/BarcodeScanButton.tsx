import { useState } from "react";
import { Barcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import BarcodeScannerModal from "./BarcodeScannerModal";
import { saveBarcodeAndProcess, BarcodeAutofillData } from "@/hooks/useBarcodeRealtime";

interface BarcodeScanButtonProps {
  onBarcodeScanned?: (codeText: string, format: string) => void;
  onAutofill?: (data: BarcodeAutofillData) => void;
}

export default function BarcodeScanButton({
  onBarcodeScanned,
  onAutofill,
}: BarcodeScanButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleScanSuccess = async (codeText: string, format: string) => {
    setIsProcessing(true);

    try {
      // Save barcode and process autofill
      const result = await saveBarcodeAndProcess(codeText, format);

      if (result.success) {
        // Call callback with barcode data
        if (onBarcodeScanned) {
          onBarcodeScanned(codeText, format);
        }

        // Call autofill callback if data available
        if (onAutofill && result.autofill) {
          onAutofill(result.autofill);
        }

        // Show appropriate toast based on result
        if (result.autofill?.is_qris) {
          toast({
            title: "QRIS Terdeteksi",
            description: `Merchant: ${result.autofill.qris_merchant || "Unknown"}, Nominal: Rp ${result.autofill.qris_nominal?.toLocaleString("id-ID") || 0}`,
          });
        } else if (result.autofill?.sku) {
          toast({
            title: "Produk Ditemukan",
            description: `SKU: ${result.autofill.sku} - ${result.autofill.product_name || ""}`,
          });
        } else {
          toast({
            title: "Barcode Tersimpan",
            description: `Kode: ${codeText.substring(0, 20)}...`,
          });
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal menyimpan barcode",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Barcode processing error:", err);
      toast({
        title: "Error",
        description: "Gagal memproses barcode",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        disabled={isProcessing}
        className="gap-2"
      >
        <Barcode className="h-4 w-4" />
        {isProcessing ? "Processing..." : "Scan Barcode"}
      </Button>

      <BarcodeScannerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
}
