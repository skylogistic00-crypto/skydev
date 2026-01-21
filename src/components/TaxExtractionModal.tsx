import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileText, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TaxExtractionModalProps {
  bankMutationId: string;
  ocrText: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /**
   * Optional: called with the extracted payload so the parent can update row state immediately
   * without refetching.
   */
  onExtracted?: (data: ExtractedTaxData) => void;
}

interface ExtractedTaxData {
  invoice_id: string;
  dpp_amount: number;
  ppn_amount: number;
  pph_amount: number;
  gross_amount: number;
}

export function TaxExtractionModal({
  bankMutationId,
  ocrText,
  open,
  onOpenChange,
  onSuccess,
  onExtracted,
}: TaxExtractionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedTaxData | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExtract = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data: result, error: invokeError } = await supabase.functions.invoke(
        "supabase-functions-tax-extraction-ai",
        {
          body: {
            bank_mutation_id: bankMutationId,
            ocr_text: ocrText,
          },
        }
      );

      if (invokeError) {
        const anyErr: any = invokeError;
        throw new Error(
          anyErr?.message || anyErr?.details || anyErr?.error || "Failed to invoke edge function"
        );
      }

      if (!result?.success) {
        const errValue: any = result?.error;
        const errText =
          typeof errValue === "string"
            ? errValue
            : (() => {
                try {
                  return JSON.stringify(errValue);
                } catch {
                  return String(errValue);
                }
              })();

        throw new Error(errText || "Extraction failed");
      }

      setExtractedData(result.data);
      setSuccess(true);
      onExtracted?.(result.data);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tax Extraction AI
          </DialogTitle>
          <DialogDescription>
            Extract tax information from OCR document (Invoice/Faktur Pajak)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* OCR Text Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">OCR Text Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-40 overflow-y-auto bg-muted p-3 rounded text-xs font-mono">
                {ocrText.substring(0, 500)}
                {ocrText.length > 500 && "..."}
              </div>
            </CardContent>
          </Card>

          {/* Extract Button */}
          {!success && !extractedData && (
            <Button
              onClick={handleExtract}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting Tax Data...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Extract Tax Information
                </>
              )}
            </Button>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {success && extractedData && (
            <>
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Tax data extracted successfully!
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Extracted Tax Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm text-muted-foreground">Invoice ID:</span>
                    <Badge variant="outline">{extractedData.invoice_id || "-"}</Badge>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm text-muted-foreground">DPP (Dasar Pengenaan Pajak):</span>
                    <span className="font-mono font-semibold">
                      {formatRupiah(extractedData.dpp_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm text-muted-foreground">PPN (Pajak Pertambahan Nilai):</span>
                    <span className="font-mono font-semibold text-blue-600">
                      {formatRupiah(extractedData.ppn_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm text-muted-foreground">PPh (Pajak Penghasilan):</span>
                    <span className="font-mono font-semibold text-orange-600">
                      {formatRupiah(extractedData.pph_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-muted p-2 rounded">
                    <span className="text-sm font-semibold">Gross Amount (Total):</span>
                    <span className="font-mono font-bold text-lg">
                      {formatRupiah(extractedData.gross_amount)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
