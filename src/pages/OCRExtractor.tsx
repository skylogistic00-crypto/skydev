import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload, FileText, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface ExtractedDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl?: string;
  extractedData: Record<string, any>;
  createdAt: string;
}

export default function OCRExtractor() {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentsByType, setDocumentsByType] = useState<Record<string, ExtractedDocument[]>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOCRResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchOCRResults = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-fetch-ocr-results', {
        body: { userId: user.id },
      });

      if (error) throw error;

      if (data?.results) {
        setDocumentsByType(data.results);
      }
    } catch (error: any) {
      console.error("Error fetching OCR results:", error);
      toast({
        title: "Gagal Memuat Data",
        description: error.message || "Terjadi kesalahan saat memuat hasil OCR",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (documentType: string, file: File) => {
    setScanning(true);
    try {
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!supportedTypes.includes(file.type)) {
        throw new Error(`Tipe file tidak didukung: ${file.type}`);
      }

      const fileName = `${Date.now()}_${file.name}`;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);

      const uploadResponse = await supabase.functions.invoke('supabase-functions-upload-ocr-file', {
        body: formData,
      });

      if (uploadResponse.error) {
        throw new Error(uploadResponse.error.message);
      }

      const { signedUrl } = uploadResponse.data;

      const ocrResponse = await supabase.functions.invoke('supabase-functions-ai-ocr-to-accounting', {
        body: {
          image_url: signedUrl,
          jenis_dokumen: documentType,
          user_id: user?.id,
        },
      });

      if (ocrResponse.error) {
        throw new Error(ocrResponse.error.message);
      }

      toast({
        title: "OCR Berhasil",
        description: `Data ${documentType.toUpperCase()} berhasil diekstrak`,
      });

      fetchOCRResults();
    } catch (error: any) {
      console.error("OCR Error:", error);
      toast({
        title: "OCR Gagal",
        description: error.message || "Terjadi kesalahan saat memproses dokumen",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const removeDocument = async (id: string, docType: string) => {
    try {
      const { error } = await supabase
        .from('ocr_results')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDocumentsByType(prev => ({
        ...prev,
        [docType]: prev[docType].filter(doc => doc.id !== id)
      }));

      toast({
        title: "Berhasil",
        description: "Dokumen berhasil dihapus",
      });
    } catch (error: any) {
      toast({
        title: "Gagal Menghapus",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const clearAll = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('ocr_results')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setDocumentsByType({});
      toast({
        title: "Berhasil",
        description: "Semua dokumen berhasil dihapus",
      });
    } catch (error: any) {
      toast({
        title: "Gagal Menghapus",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalDocuments = Object.values(documentsByType).reduce((sum, docs) => sum + docs.length, 0);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">OCR Document Extractor</h1>
        <p className="text-muted-foreground">
          Scan dan ekstrak data dari berbagai jenis dokumen secara terpisah
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Dokumen</CardTitle>
            <CardDescription>
              Pilih jenis dokumen dan upload file untuk ekstraksi data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* KTP */}
            <div className="space-y-2">
              <Label htmlFor="ktp-upload">KTP (Kartu Tanda Penduduk)</Label>
              <div className="flex gap-2">
                <Input
                  id="ktp-upload"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScan("ktp", file);
                    e.target.value = "";
                  }}
                  disabled={scanning}
                  className="flex-1"
                />
                <Button disabled={scanning} size="icon" variant="outline">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* KK */}
            <div className="space-y-2">
              <Label htmlFor="kk-upload">KK (Kartu Keluarga)</Label>
              <div className="flex gap-2">
                <Input
                  id="kk-upload"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScan("kk", file);
                    e.target.value = "";
                  }}
                  disabled={scanning}
                  className="flex-1"
                />
                <Button disabled={scanning} size="icon" variant="outline">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Ijazah */}
            <div className="space-y-2">
              <Label htmlFor="ijazah-upload">Ijazah</Label>
              <div className="flex gap-2">
                <Input
                  id="ijazah-upload"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScan("ijazah", file);
                    e.target.value = "";
                  }}
                  disabled={scanning}
                  className="flex-1"
                />
                <Button disabled={scanning} size="icon" variant="outline">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* SIM */}
            <div className="space-y-2">
              <Label htmlFor="sim-upload">SIM (Surat Izin Mengemudi)</Label>
              <div className="flex gap-2">
                <Input
                  id="sim-upload"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScan("sim", file);
                    e.target.value = "";
                  }}
                  disabled={scanning}
                  className="flex-1"
                />
                <Button disabled={scanning} size="icon" variant="outline">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* STNK */}
            <div className="space-y-2">
              <Label htmlFor="stnk-upload">STNK</Label>
              <div className="flex gap-2">
                <Input
                  id="stnk-upload"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScan("stnk", file);
                    e.target.value = "";
                  }}
                  disabled={scanning}
                  className="flex-1"
                />
                <Button disabled={scanning} size="icon" variant="outline">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* SKCK */}
            <div className="space-y-2">
              <Label htmlFor="skck-upload">SKCK</Label>
              <div className="flex gap-2">
                <Input
                  id="skck-upload"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScan("skck", file);
                    e.target.value = "";
                  }}
                  disabled={scanning}
                  className="flex-1"
                />
                <Button disabled={scanning} size="icon" variant="outline">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {scanning && (
              <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Memproses dokumen...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hasil Ekstraksi</CardTitle>
                  <CardDescription>
                    {totalDocuments} dokumen telah diekstrak
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchOCRResults} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  {totalDocuments > 0 && (
                    <Button variant="destructive" size="sm" onClick={clearAll}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus Semua
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
                  <p className="text-muted-foreground">Memuat data...</p>
                </div>
              ) : totalDocuments === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada dokumen yang diekstrak</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(documentsByType).map(([docType, documents]) => (
                    <div key={docType} className="space-y-3">
                      <h3 className="text-lg font-semibold uppercase border-b pb-2">
                        {docType} ({documents.length})
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {documents.map((doc) => (
                          <Card key={doc.id} className="border-2">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-base">
                                    {doc.fileName}
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                    {new Date(doc.createdAt).toLocaleString('id-ID')}
                                  </CardDescription>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeDocument(doc.id, docType)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {Object.keys(doc.extractedData).length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">
                                  Tidak ada data yang berhasil diekstrak
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {Object.entries(doc.extractedData).map(([key, value]) => (
                                    <div
                                      key={key}
                                      className="flex justify-between text-sm border-b pb-2 last:border-0"
                                    >
                                      <span className="font-medium text-muted-foreground">
                                        {key}:
                                      </span>
                                      <span className="text-right font-mono max-w-[60%] break-words">
                                        {typeof value === 'object' 
                                          ? JSON.stringify(value) 
                                          : String(value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
