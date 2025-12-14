import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";
import Header from "./Header";
import Navigation from "./Navigation";
import {
  Upload,
  FileText,
  Loader2,
  Image,
  List,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  parseOCR,
  type DocumentType,
  type ParsedOCRData,
} from "@/utils/ocrParser";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function GoogleOCRScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [documentType, setDocumentType] = useState<DocumentType>("KTP");
  const [parsedData, setParsedData] = useState<ParsedOCRData | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const f = e.target.files[0];
    setFile(f);

    if (f.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(f));
    } else {
      setFilePreview(null);
    }
  };

  const parseExtractedTextLines = (text: string) =>
    text
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

  const handleProcessOCR = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Harap pilih file terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // 1. Upload file to Supabase Storage
      const fileName = `scan_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("ocr_uploads")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log("File uploaded:", uploadData.path);

      // 2. Create signed URL (valid for 300 seconds)
      const { data: signedData, error: signedError } = await supabase.storage
        .from("ocr_uploads")
        .createSignedUrl(uploadData.path, 300);

      if (signedError) {
        console.error("Signed URL error:", signedError);
        throw new Error(`Failed to create signed URL: ${signedError.message}`);
      }

      console.log("Signed URL created:", signedData.signedUrl);

      // 3. Call Supabase Edge Function with signed URL
      const { data: raw, error: visionError } = await supabase.functions.invoke(
        "supabase-functions-vision-google-ocr",
        {
          body: { signedUrl: signedData.signedUrl },
        },
      );

      if (visionError) throw visionError;

      // ===== FIX — PARSE RAW JSON FROM SUPABASE =====
      let visionData;
      try {
        visionData = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch (err) {
        console.error("❌ JSON PARSE FAILED:", err);
        console.log("RAW:", raw);
        throw new Error("Vision API returned invalid JSON.");
      }

      console.log("=== RAW GOOGLE RESPONSE ===", visionData);

      // ===== EXTRACT FINAL TEXT =====
      let fullText = "";

      // Check if response has extracted_text (from edge function)
      if (visionData?.extracted_text) {
        fullText = visionData.extracted_text;
      } else {
        const resp = visionData?.responses?.[0];

        if (resp?.textAnnotations?.length > 0) {
          fullText = resp.textAnnotations[0].description;
        } else if (resp?.fullTextAnnotation?.text) {
          fullText = resp.fullTextAnnotation.text;
        } else {
          fullText = "(EMPTY RAW TEXT – CHECK PARSER)";
        }
      }

      console.log("=== FINAL OCR TEXT ===", fullText);

      setExtractedText(fullText);

      // Check if KTP data is available from edge function
      if (visionData?.ktp_data && visionData?.document_type === "KTP") {
        setParsedData(visionData.ktp_data);
      } else {
        // Parse result based on document type
        const parsed = parseOCR(fullText, documentType);
        setParsedData(parsed);
      }

      // Set OCR result (edge function already handles database storage)
      setOcrResult({
        extracted_text: fullText,
        file_url: visionData?.file_url || signedData.signedUrl,
      });

      toast({ title: "Success", description: "OCR berhasil diproses!" });
    } catch (e: any) {
      console.error("OCR Error:", e);
      const errorMessage = e.message || "Unknown error occurred";
      const errorDetails = e.details || e.toString();
      toast({
        title: "OCR Error",
        description: `${errorMessage}${errorDetails ? ` - ${errorDetails}` : ""}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Navigation />

      {/* Header Title */}
      <div className="border-b bg-gradient-to-r from-indigo-600 to-blue-600 p-6 shadow-lg">
        <div className="container mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-white"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText /> Google OCR Scanner
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText /> Google OCR Scanner
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Document Type */}
            <div>
              <Label>Jenis Dokumen</Label>
              <Select
                value={documentType}
                onValueChange={(v) => setDocumentType(v as DocumentType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dokumen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KTP">KTP</SelectItem>
                  <SelectItem value="NPWP">NPWP</SelectItem>
                  <SelectItem value="SIM">SIM</SelectItem>
                  <SelectItem value="INVOICE">Invoice</SelectItem>
                  <SelectItem value="NOTA">Nota</SelectItem>
                  <SelectItem value="KWITANSI">Kwitansi</SelectItem>
                  <SelectItem value="SURAT_JALAN">Surat Jalan</SelectItem>
                  <SelectItem value="CASH_DISBURSEMENT">
                    Cash Disbursement
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Upload File */}
            <div>
              <Label>Upload File (JPG, PNG, PDF)</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
              />
              {file && <p className="text-sm mt-1">{file.name}</p>}
            </div>

            {/* OCR Button */}
            <Button
              onClick={handleProcessOCR}
              disabled={loading || !file}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" /> Process with Google Vision
                </>
              )}
            </Button>

            {/* RESULTS */}
            {ocrResult && (
              <div className="space-y-6">
                {/* Parsed JSON */}
                <div className="bg-blue-50 p-4 rounded border">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText /> Data {documentType}
                  </h3>
                  <pre className="bg-white rounded p-3 text-sm max-h-96 overflow-auto">
                    {JSON.stringify(parsedData, null, 2)}
                  </pre>
                </div>

                {/* KTP Input Fields */}
                {documentType === "KTP" && (
                  <div className="bg-white p-6 rounded border">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" /> Form Data KTP
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nik">NIK</Label>
                        <Input
                          id="nik"
                          placeholder="Nomor Induk Kependudukan"
                          defaultValue={parsedData?.nik || ""}
                        />
                      </div>

                      <div>
                        <Label htmlFor="nama">Nama</Label>
                        <Input
                          id="nama"
                          placeholder="Nama Lengkap"
                          defaultValue={parsedData?.nama || ""}
                        />
                      </div>

                      <div>
                        <Label htmlFor="tempat_tanggal_lahir">Tempat/Tanggal Lahir</Label>
                        <Input
                          id="tempat_tanggal_lahir"
                          placeholder="Contoh: Jakarta, 17-08-1990"
                          defaultValue={parsedData?.tempat_tgl_lahir || ""}
                        />
                      </div>

                      <div>
                        <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                        <Select defaultValue={parsedData?.jenis_kelamin || ""}>
                          <SelectTrigger id="jenis_kelamin">
                            <SelectValue placeholder="Pilih jenis kelamin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LAKI-LAKI">Laki-laki</SelectItem>
                            <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="golongan_darah">Golongan Darah</Label>
                        <Select defaultValue={parsedData?.golongan_darah || ""}>
                          <SelectTrigger id="golongan_darah">
                            <SelectValue placeholder="Pilih golongan darah" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="AB">AB</SelectItem>
                            <SelectItem value="O">O</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="alamat">Alamat</Label>
                        <Input
                          id="alamat"
                          placeholder="Alamat Lengkap"
                          defaultValue={parsedData?.alamat || ""}
                        />
                      </div>

                      <div>
                        <Label htmlFor="rt_rw">RT/RW</Label>
                        <Input
                          id="rt_rw"
                          placeholder="000/000"
                          defaultValue={parsedData?.rt_rw || ""}
                        />
                      </div>

                      <div>
                        <Label htmlFor="kelurahan">Kelurahan/Desa</Label>
                        <Input
                          id="kelurahan"
                          placeholder="Kelurahan/Desa"
                          defaultValue={parsedData?.kel_des || ""}
                        />
                      </div>

                      <div>
                        <Label htmlFor="kecamatan">Kecamatan</Label>
                        <Input
                          id="kecamatan"
                          placeholder="Kecamatan"
                          defaultValue={parsedData?.kecamatan || ""}
                        />
                      </div>

                      <div>
                        <Label htmlFor="agama">Agama</Label>
                        <Select defaultValue={parsedData?.agama || ""}>
                          <SelectTrigger id="agama">
                            <SelectValue placeholder="Pilih agama" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ISLAM">Islam</SelectItem>
                            <SelectItem value="KRISTEN">Kristen</SelectItem>
                            <SelectItem value="KATOLIK">Katolik</SelectItem>
                            <SelectItem value="HINDU">Hindu</SelectItem>
                            <SelectItem value="BUDDHA">Buddha</SelectItem>
                            <SelectItem value="KONGHUCU">Konghucu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="status_perkawinan">Status Perkawinan</Label>
                        <Select defaultValue={parsedData?.status_perkawinan || ""}>
                          <SelectTrigger id="status_perkawinan">
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BELUM KAWIN">Belum Kawin</SelectItem>
                            <SelectItem value="KAWIN">Kawin</SelectItem>
                            <SelectItem value="CERAI HIDUP">Cerai Hidup</SelectItem>
                            <SelectItem value="CERAI MATI">Cerai Mati</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="pekerjaan">Pekerjaan</Label>
                        <Input
                          id="pekerjaan"
                          placeholder="Pekerjaan"
                          defaultValue={parsedData?.pekerjaan || ""}
                        />
                      </div>

                      <div>
                        <Label htmlFor="kewarganegaraan">Kewarganegaraan</Label>
                        <Input
                          id="kewarganegaraan"
                          placeholder="WNI/WNA"
                          defaultValue={parsedData?.kewarganegaraan || "WNI"}
                        />
                      </div>

                      <div>
                        <Label htmlFor="berlaku_hingga">Berlaku Hingga</Label>
                        <Input
                          id="berlaku_hingga"
                          placeholder="SEUMUR HIDUP / DD-MM-YYYY"
                          defaultValue={parsedData?.berlaku_hingga || "SEUMUR HIDUP"}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview & Extracted Lines */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image Preview */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <Image /> Gambar Dokumen
                    </Label>
                    <div className="border bg-gray-50 rounded p-2">
                      {filePreview ? (
                        <img
                          src={filePreview}
                          className="w-full max-h-[350px] object-contain"
                        />
                      ) : (
                        <p className="text-gray-400">Tidak ada gambar</p>
                      )}
                    </div>
                  </div>

                  {/* Extracted List */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <List /> Hasil Ekstraksi (
                      {parseExtractedTextLines(ocrResult.extracted_text).length}
                      )
                    </Label>

                    <ul className="border rounded bg-gray-50 max-h-[350px] overflow-auto p-3 space-y-2">
                      {parseExtractedTextLines(ocrResult.extracted_text).map(
                        (line, i) => (
                          <li
                            key={i}
                            className="p-2 bg-white border rounded flex gap-2 text-sm"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {line}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>

                {/* Full Text */}
                <div>
                  <Label>Full Text</Label>
                  <Textarea
                    value={ocrResult.extracted_text}
                    readOnly
                    className="min-h-[150px] font-mono text-sm"
                  />
                </div>

                {/* File URL */}
                {ocrResult.file_url && (
                  <div className="p-3 bg-blue-50 border rounded flex gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <a
                      href={ocrResult.file_url}
                      target="_blank"
                      className="text-blue-600 underline break-all"
                    >
                      {ocrResult.file_url}
                    </a>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
