import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export interface WarehouseAutofillData {
  sku: string | null;
  item_name: string | null;
  quantity: number | null;
  batch_number: string | null;
  expired_date: string | null;
  location: string | null;
  supplier: string | null;
  unit: string | null;
  is_new_item: boolean;
}

export type FormType = "grn" | "mutation" | "outbound" | "adjustment";

interface UseWarehouseScanOptions {
  formType: FormType;
  onAutofill?: (data: WarehouseAutofillData) => void;
}

export function useWarehouseScan(options: UseWarehouseScanOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<WarehouseAutofillData | null>(null);
  const { toast } = useToast();

  const processBarcodeScan = useCallback(
    async (barcode: string, format: string) => {
      setIsProcessing(true);

      try {
        const { data, error } = await supabase.functions.invoke(
          "supabase-functions-warehouse-scan-process",
          {
            body: {
              barcode,
              scan_type: "barcode",
              form_type: options.formType,
            },
          }
        );

        if (error) {
          throw new Error(error.message);
        }

        if (!data.success) {
          throw new Error(data.error || "Processing failed");
        }

        const autofillData = data.autofill as WarehouseAutofillData;
        setLastResult(autofillData);

        if (options.onAutofill) {
          options.onAutofill(autofillData);
        }

        if (autofillData.is_new_item) {
          toast({
            title: "Item Baru Dibuat",
            description: `SKU: ${autofillData.sku} - ${autofillData.item_name}`,
          });
        } else {
          toast({
            title: "Item Ditemukan",
            description: `SKU: ${autofillData.sku} - ${autofillData.item_name}`,
          });
        }

        return autofillData;
      } catch (err: any) {
        console.error("Barcode processing error:", err);
        toast({
          title: "Error",
          description: err.message || "Gagal memproses barcode",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [options, toast]
  );

  const processOCRScan = useCallback(
    async (extractedText: string) => {
      setIsProcessing(true);

      try {
        const { data, error } = await supabase.functions.invoke(
          "supabase-functions-warehouse-scan-process",
          {
            body: {
              ocr_text: extractedText,
              scan_type: "ocr",
              form_type: options.formType,
            },
          }
        );

        if (error) {
          throw new Error(error.message);
        }

        if (!data.success) {
          throw new Error(data.error || "Processing failed");
        }

        const autofillData = data.autofill as WarehouseAutofillData;
        setLastResult(autofillData);

        if (options.onAutofill) {
          options.onAutofill(autofillData);
        }

        toast({
          title: "OCR Berhasil",
          description: autofillData.item_name
            ? `Item: ${autofillData.item_name}`
            : "Data berhasil diekstrak",
        });

        return autofillData;
      } catch (err: any) {
        console.error("OCR processing error:", err);
        toast({
          title: "Error",
          description: err.message || "Gagal memproses OCR",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [options, toast]
  );

  return {
    isProcessing,
    lastResult,
    processBarcodeScan,
    processOCRScan,
  };
}
