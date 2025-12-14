import { useState } from "react";
import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface OCRScanButtonProps {
  onImageUploaded?: (url: string, filePath: string) => void;
  onTextExtracted?: (text: string) => void;
  bucketName?: string;
  folderPath?: string;
}

export default function OCRScanButton({
  onImageUploaded,
  onTextExtracted,
  bucketName = "documents",
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

      toast({
        title: "Upload berhasil",
        description: "Gambar berhasil diupload",
      });

      // 5. Callback with URL
      if (onImageUploaded) {
        onImageUploaded(publicUrl, data.path);
      }

      // 6. Call Google Vision OCR if onTextExtracted is provided
      if (onTextExtracted) {
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

          if (!ocrError && ocrData?.extracted_text) {
            onTextExtracted(ocrData.extracted_text);
          }
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
