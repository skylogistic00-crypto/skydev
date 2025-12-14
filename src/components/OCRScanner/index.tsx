import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Loader2, Camera } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface OCRResult {
  nominal: number;
  tanggal: string; // YYYY-MM-DD
  deskripsi: string;
  extractedText?: string;
  imageUrl?: string;
  imageFile?: File;
  nomorNota?: string;
  toko?: string;
  ocrId?: string;
  document_type?: string;
  employee_name?: string;
  employee_number?: string;
  suggested_debit_account?: string;
  suggested_credit_account?: string;
  items?: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
}

interface OCRScannerProps {
  onResult: (data: OCRResult) => void;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "secondary";
  showPreview?: boolean;
}

const OCRScanner: React.FC<OCRScannerProps> = ({
  onResult,
  buttonText = "📷 Scan OCR",
  buttonVariant = "outline",
  showPreview = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<OCRResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    if (showPreview) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleProcessOCR = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Upload file to Supabase Storage bucket "ocr-receipts"
      const fileName = `receipt_${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("ocr-receipts")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log("File uploaded to ocr-receipts:", uploadData.path);

      // 2. Generate signed URL (valid for 1 hour = 3600 seconds)
      const { data: signedData, error: signedError } = await supabase.storage
        .from("ocr-receipts")
        .createSignedUrl(uploadData.path, 3600);

      if (signedError) {
        console.error("Signed URL error:", signedError);
        throw new Error(`Failed to create signed URL: ${signedError.message}`);
      }

      console.log("Signed URL created (1 hour expiry):", signedData.signedUrl);

      // 3. Call Edge Function "supabase-functions-vision-google-ocr" with signed URL
      const { data, error: ocrError } = await supabase.functions.invoke(
        "supabase-functions-vision-google-ocr",
        {
          body: {
            image_url: signedData.signedUrl,
          },
        }
      );

      if (ocrError) {
        console.error("OCR Error:", ocrError);
        throw new Error(`OCR gagal: ${ocrError.message || "Silakan upload ulang gambar"}`);
      }

      if (!data || !data.success) {
        throw new Error("OCR gagal memproses gambar. Silakan upload ulang.");
      }

      console.log("OCR Result:", data);

      // 4. Extract parsed data from response
      const ocrText = data.text || "";
      const nominal = data.nominal || 0;
      const tanggal = data.tanggal || new Date().toISOString().split("T")[0];
      const nomorNota = data.nomor_nota || null;
      const toko = data.toko || null;
      const documentType = data.document_type || null;
      const employeeName = data.employee_name || null;
      const employeeNumber = data.employee_number || null;
      const suggestedDebitAccount = data.suggested_debit_account || null;
      const suggestedCreditAccount = data.suggested_credit_account || null;
      const items = data.items || [];

      // 5. Save OCR results to "ocr_results" table
      const { data: ocrData, error: ocrSaveError } = await supabase
        .from("ocr_results")
        .insert([
          {
            image_url: signedData.signedUrl,
            extracted_text: ocrText,
            nominal: nominal || null,
            tanggal: tanggal || null,
            nomor_nota: nomorNota,
            toko: toko,
          },
        ])
        .select()
        .single();

      if (ocrSaveError) {
        console.error("OCR save error:", ocrSaveError);
        throw new Error(`Failed to save OCR results: ${ocrSaveError.message}`);
      }

      console.log("OCR results saved to database:", ocrData);

      // 5. Build deskripsi with OCR summary
      let deskripsi = "";
      if (documentType === "salary_slip") {
        deskripsi = `Slip Gaji ${employeeName || ""} (${employeeNumber || ""}) - ${toko || ""}`;
      } else {
        deskripsi = `Transaksi dari ${toko || "-"}, nota ${nomorNota || "-"}. Ekstrak OCR: ${ocrText.substring(0, 150)}${ocrText.length > 150 ? "..." : ""}`;
      }

      // 6. Prepare result for autofill
      const result: OCRResult = {
        nominal: nominal,
        tanggal: tanggal,
        deskripsi: deskripsi,
        extractedText: ocrText,
        imageUrl: signedData.signedUrl,
        imageFile: file,
        nomorNota: nomorNota || undefined,
        toko: toko || undefined,
        ocrId: ocrData.id,
        document_type: documentType || undefined,
        employee_name: employeeName || undefined,
        employee_number: employeeNumber || undefined,
        suggested_debit_account: suggestedDebitAccount || undefined,
        suggested_credit_account: suggestedCreditAccount || undefined,
        items: items,
      };

      toast({
        title: "✅ OCR berhasil diproses",
        description: "Data transaksi telah terisi otomatis. Silakan periksa kembali sebelum menyimpan.",
      });

      // Store extracted data for display
      setExtractedData(result);

      onResult(result);

      // Reset file state but keep extracted data visible
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("OCR Error:", err);
      toast({
        title: "❌ OCR Gagal",
        description: err.message || "Gagal memproses OCR. Silakan upload ulang gambar.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={buttonVariant}
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          <Camera className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>

        {file && (
          <Button
            type="button"
            onClick={handleProcessOCR}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Process OCR
              </>
            )}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {showPreview && preview && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <Label className="text-sm font-medium mb-2 block">Preview:</Label>
          <img
            src={preview}
            alt="Preview"
            className="max-h-48 mx-auto rounded-lg"
          />
          {file && (
            <p className="text-sm text-gray-600 mt-2 text-center">
              {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>
      )}

      {/* Display Extracted Data */}
      {extractedData && (
        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-semibold text-green-800">
              ✅ Data Hasil Ekstrak OCR:
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setExtractedData(null)}
              className="h-6 px-2 text-xs"
            >
              ✕
            </Button>
          </div>
          
          <div className="space-y-2 text-sm">
            {extractedData.toko && (
              <div className="flex justify-between">
                <span className="text-gray-600">Toko:</span>
                <span className="font-semibold text-green-700">
                  {extractedData.toko}
                </span>
              </div>
            )}
            
            {extractedData.nomorNota && (
              <div className="flex justify-between">
                <span className="text-gray-600">Nomor Nota:</span>
                <span className="font-semibold text-green-700">
                  {extractedData.nomorNota}
                </span>
              </div>
            )}
            
            {extractedData.nominal > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Nominal:</span>
                <span className="font-semibold text-green-700">
                  Rp {extractedData.nominal.toLocaleString("id-ID")}
                </span>
              </div>
            )}
            
            {extractedData.tanggal && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tanggal:</span>
                <span className="font-semibold text-green-700">
                  {extractedData.tanggal}
                </span>
              </div>
            )}
            
            {extractedData.deskripsi && (
              <div className="mt-2">
                <span className="text-gray-600 block mb-1">Deskripsi:</span>
                <p className="text-xs text-gray-700 bg-white p-2 rounded border border-green-200 max-h-20 overflow-y-auto">
                  {extractedData.deskripsi}
                </p>
              </div>
            )}
            
            {extractedData.extractedText && (
              <div className="mt-2">
                <span className="text-gray-600 block mb-1">Teks OCR Lengkap:</span>
                <pre className="text-xs text-gray-700 bg-white p-3 rounded border border-green-200 max-h-40 overflow-auto font-mono whitespace-pre-wrap">
                  {extractedData.extractedText}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRScanner;
