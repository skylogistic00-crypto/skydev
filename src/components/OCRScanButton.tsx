import { useState } from "react";
import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseFallbackMatchFromOCRText } from "@/utils/ocrFallbackParser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";
import { useToast } from "@/components/ui/use-toast";

import type { OCRFallbackMatch } from "@/utils/ocrFallbackParser";

interface OCRScanButtonProps {
  onImageUploaded?: (url: string, filePath: string) => void;
  onTextExtracted?: (text: string) => void;
  /**
   * If set, OCRScanButton will save directly to that bank_mutations row.
   * For Global OCR (fallback mode), DO NOT pass this.
   */
  bankMutationId?: string;
  /**
   * Legacy alias. Prefer bankMutationId.
   */
  rowId?: string;
  /**
   * Global scan fallback matching metadata.
   * IMPORTANT: must come from OCR parsing (not manual user input).
   */
  fallbackMatch?: OCRFallbackMatch;
  /** Optional: extracted fields to be saved into bank_mutations (in addition to bukti_url & ocr_text) */
  extractedFields?: {
    bukti_url?: string | null;
    dpp_amount?: number | null;
    vat_amount?: number | null;
    stamp_amount?: number | null;
    transaction_type?: "SALES" | "EXPENSE" | null;
    revenue_account_code?: string | null;
    expense_account_code?: string | null;
    vat_output_account_code?: string | null;
    vat_input_account_code?: string | null;
  };
  /**
   * Called when global scan returns match candidates.
   */
  onFallbackCandidates?: (payload: {
    candidates: Array<{ row: { id: string; date: string | null; description: string | null; debit: number | null; credit: number | null }; score: number }>;
    fallbackMatch: OCRFallbackMatch;
    ocrText: string;
    filePath: string;
    publicUrl: string;
  }) => void;
  bucketName?: string;
  folderPath?: string;
}

export default function OCRScanButton({
  onImageUploaded,
  onTextExtracted,
  bankMutationId,
  rowId,
  fallbackMatch,
  extractedFields,
  onFallbackCandidates,
  // Default ke bucket yang memang dipakai untuk OCR receipts di project ini
  // Default ke bucket yang memang dipakai untuk OCR receipts di project ini.
  // NOTE: untuk Bank Mutation, komponen pemanggil sudah override ke bucketName="mutation-evidence".
  bucketName = "ocr-receipts",
  folderPath = "ocr-scans",
}: OCRScanButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processImage(file);
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);

    try {
      // 1. Compress image
      const compressedFile = await imageCompression(file, {
        maxWidthOrHeight: 1600,
        initialQuality: 0.6,
        useWebWorker: true,
      });

      // 2. Generate unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${compressedFile.name}`;
      const filePath = `${folderPath}/${fileName}`;

      // 3. Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, compressedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // 4. Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      // Upload success is not the same as OCR/DB success.
      // Avoid showing a generic success toast here to prevent misleading UX.

      // 5. Callback with URL
      // IMPORTANT: UI should not treat upload as "OCR success".
      // Use this callback only to propagate URL/path; do not show "success" toast here.
      if (onImageUploaded) {
        onImageUploaded(publicUrl, data.path);
      }

      // 6. Call Google Vision OCR
      // IMPORTANT: Previously this only ran when onTextExtracted was provided.
      // That can lead to "upload success but no OCR/DB update and no logs".
      // We always run the OCR pipeline; onTextExtracted is optional.
      if (true) {
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
            reader.readAsDataURL(compressedFile);
          });

          const { data: ocrData, error: ocrError } = await supabase.functions.invoke(
            "supabase-functions-vision-google-ocr",
            {
              body: {
                file_base64: base64Content,
              },
            }
          );

          if (ocrError) {
            console.error("Vision OCR invoke error:", ocrError);
            toast({
              title: "OCR gagal",
              description: ocrError.message,
              variant: "destructive",
            });
            return;
          }

          const extractedText =
            ocrData?.extracted_text || ocrData?.text || ocrData?.fullText || null;

          if (!extractedText) {
            console.warn("[OCR][VISION] response has no text", { ocrData, bucket: bucketName, filePath });
            toast({
              title: "OCR gagal",
              description: "OCR tidak mengembalikan teks",
              variant: "destructive",
            });
            return;
          }

          // Always log end-to-end OCR context so we can debug cases where file uploaded but DB not updated
          const derivedFallback = parseFallbackMatchFromOCRText(extractedText);
          const effectiveBankMutationId = bankMutationId ?? rowId;
          console.log("[OCR][FLOW]", {
            mode: effectiveBankMutationId ? "SAVE" : "FALLBACK",
            bankMutationId: effectiveBankMutationId ?? null,
            bucket: bucketName,
            filePath,
            publicUrl,
            derivedFallback,
          });

          if (onTextExtracted) onTextExtracted(extractedText);

          // Mode 1: Global OCR (fallback) -> do NOT save yet, ask user to choose target row
          if (!effectiveBankMutationId) {
            if (!onFallbackCandidates) {
              toast({
                title: "OCR selesai",
                description: "Pilih baris mutasi dulu untuk menyimpan hasil OCR",
                variant: "destructive",
              });
              return;
            }

            const { data: persistData, error: persistError } = await supabase.functions.invoke(
              "supabase-functions-ai-ocr-bank-mutation",
              {
                body: {
                  fallback: {
                    date: derivedFallback?.date ?? null,
                    amount: derivedFallback?.amount ?? null,
                    description: derivedFallback?.description ?? null,
                  },
                  image_url: publicUrl,
                  bucket: bucketName,
                  filePath,
                  ocrText: extractedText,
                  extracted: {
                    bukti_url: publicUrl,
                    ...(extractedFields || {}),
                  },
                },
              }
            );

            if (persistError) {
              console.error("[OCR][FALLBACK] gagal ambil kandidat bank_mutations", {
                error: persistError,
                filePath,
                bucket: bucketName,
                publicUrl,
                fallback: fallbackMatch || derivedFallback,
              });
              toast({
                title: "OCR gagal",
                description: persistError.message,
                variant: "destructive",
              });
              return;
            }

            if (!persistData?.candidates) {
              console.error("[OCR][FALLBACK] edge function tidak mengembalikan candidates", {
                persistData,
                filePath,
                bucket: bucketName,
                publicUrl,
              });
              toast({
                title: "OCR gagal",
                description: "Edge function tidak mengembalikan kandidat matching",
                variant: "destructive",
              });
              return;
            }

            onFallbackCandidates({
              candidates: persistData.candidates,
              fallbackMatch: fallbackMatch || derivedFallback,
              ocrText: extractedText,
              filePath,
              publicUrl,
            });
            return;
          }

          // Mode 2: Direct save to specific bank_mutations row
          const { data: persistData, error: persistError } = await supabase.functions.invoke(
            "supabase-functions-ai-ocr-bank-mutation",
            {
              body: {
                bank_mutation_id: effectiveBankMutationId,
                image_url: publicUrl,
                bucket: bucketName,
                filePath,
                ocrText: extractedText,
                extracted: {
                  bukti_url: publicUrl,
                  ...(extractedFields || {}),
                },
              },
            }
          );

          if (persistError) {
            console.error("[OCR][SAVE] gagal simpan OCR ke bank_mutations", {
              bankMutationId: effectiveBankMutationId,
              error: persistError,
              filePath,
              bucket: bucketName,
              publicUrl,
            });
            toast({
              title: "Simpan OCR gagal",
              description: persistError.message,
              variant: "destructive",
            });
            return;
          }

          const matchedId = (persistData as any)?.matched?.id;
          if (!matchedId) {
            console.warn("[OCR][SAVE] edge function success tapi matched.id kosong (indikasi tidak update DB)", {
              persistData,
              bankMutationId: effectiveBankMutationId,
              filePath,
              bucket: bucketName,
              publicUrl,
            });
          }
          toast({
            title: "OCR berhasil",
            description: matchedId ? `OCR tersimpan ke mutasi: ${matchedId}` : "OCR tersimpan",
          });
        } catch (ocrErr) {
          console.error("OCR processing error:", ocrErr);
        }
      }

      setIsOpen(false);
    } catch (error: any) {
      console.error("Error processing image:", error);
      toast({
        title: "Upload gagal",
        description: error.message || "Gagal mengupload gambar",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Camera className="h-4 w-4" />
        Scan OCR
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Dokumen</DialogTitle>
            <DialogDescription>
              Pilih cara untuk mengupload dokumen yang akan di-scan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              {/* Camera capture button */}
              <label
                htmlFor="camera-input"
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
              >
                <Camera className="h-5 w-5" />
                <span>Ambil Foto dengan Kamera</span>
                <input
                  id="camera-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isProcessing}
                />
              </label>

              {/* File upload button */}
              <label
                htmlFor="file-input"
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
              >
                <Upload className="h-5 w-5" />
                <span>Pilih File dari Galeri</span>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isProcessing}
                />
              </label>
            </div>

            {isProcessing && (
              <div className="text-center text-sm text-muted-foreground">
                Memproses gambar...
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <p>• Gambar akan dikompres otomatis (max 1600x1600px)</p>
              <p>• Format: JPG, PNG, WEBP</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
