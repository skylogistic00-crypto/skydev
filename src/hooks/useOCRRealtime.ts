import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface OCRResult {
  id: string;
  file_url: string;
  file_path: string;
  extracted_text: string;
  json_data: any;
  ocr_data: any;
  nominal: number | null;
  tanggal: string | null;
  supplier: string | null;
  invoice: string | null;
  nama_karyawan: string | null;
  deskripsi: string | null;
  autofill_status: string;
  created_at: string;
  updated_at: string;
}

export interface AutofillData {
  nominal: number | null;
  tanggal: string | null;
  supplier: string | null;
  invoice: string | null;
  nama_karyawan: string | null;
  deskripsi: string | null;
}

interface UseOCRRealtimeOptions {
  onNewResult?: (result: OCRResult) => void;
  onAutofill?: (data: AutofillData) => void;
}

export function useOCRRealtime(options: UseOCRRealtimeOptions = {}) {
  const [latestResult, setLatestResult] = useState<OCRResult | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const startListening = useCallback(() => {
    if (channel) return;

    const newChannel = supabase
      .channel("ocr_results_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ocr_results",
        },
        (payload) => {
          const newResult = payload.new as OCRResult;
          setLatestResult(newResult);

          // Call onNewResult callback
          if (options.onNewResult) {
            options.onNewResult(newResult);
          }

          // Extract autofill data and call callback
          if (options.onAutofill && newResult.autofill_status === "completed") {
            const autofillData: AutofillData = {
              nominal: newResult.nominal,
              tanggal: newResult.tanggal,
              supplier: newResult.supplier,
              invoice: newResult.invoice,
              nama_karyawan: newResult.nama_karyawan,
              deskripsi: newResult.deskripsi,
            };
            options.onAutofill(autofillData);
          }
        }
      )
      .subscribe((status) => {
        setIsListening(status === "SUBSCRIBED");
      });

    setChannel(newChannel);
  }, [channel, options]);

  const stopListening = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel);
      setChannel(null);
      setIsListening(false);
    }
  }, [channel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [channel]);

  return {
    latestResult,
    isListening,
    startListening,
    stopListening,
  };
}

// Function to ensure financial columns exist
export async function ensureFinancialColumns(): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("ensure_financial_columns");
    if (error) {
      console.error("Error ensuring financial columns:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error calling ensure_financial_columns:", err);
    return false;
  }
}

// Function to upload and process OCR
export async function uploadAndProcessOCR(file: File): Promise<{
  success: boolean;
  data?: OCRResult;
  autofill?: AutofillData;
  error?: string;
}> {
  try {
    // Convert file to base64
    const reader = new FileReader();
    const base64Content = await new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-vision-google-ocr",
      {
        body: {
          file_base64: base64Content,
        },
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    if (!data.success) {
      throw new Error(data.error || "OCR processing failed");
    }

    return {
      success: true,
      data: data.db_record,
      autofill: data.autofill,
    };
  } catch (err: any) {
    console.error("OCR upload error:", err);
    return {
      success: false,
      error: err.message,
    };
  }
}
