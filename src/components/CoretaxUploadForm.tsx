import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { navigateBack } from "@/utils/navigation";

export default function CoretaxUploadForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    file_type: "SPT Masa PPN",
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Pilih file terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${formData.file_type}_${formData.period_month}_${formData.period_year}_${Date.now()}.${fileExt}`;
      const filePath = `coretax/${fileName}`;

      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      const { data: publicUrlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      setUploadProgress(80);

      const { error: dbError } = await supabase.from("coretax_uploads").insert({
        file_name: selectedFile.name,
        file_path: publicUrlData.publicUrl,
        file_type: formData.file_type,
        period_month: formData.period_month,
        period_year: formData.period_year,
        status: "Uploaded",
        notes: formData.notes,
        uploaded_by: user?.id,
      });

      if (dbError) throw dbError;

      setUploadProgress(100);

      toast({
        title: "Success",
        description: "File berhasil diupload ke Coretax",
      });

      setSelectedFile(null);
      setFormData({
        file_type: "SPT Masa PPN",
        period_month: new Date().getMonth() + 1,
        period_year: new Date().getFullYear(),
        notes: "",
      });
      
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-6 w-6" />
                  Upload File Coretax
                </CardTitle>
                <CardDescription>
                  Upload dokumen perpajakan ke sistem Coretax
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigateBack(navigate)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={() => navigate("/coretax-report")}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Lihat Report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">
              {/* File Type */}
              <div className="space-y-2">
                <Label htmlFor="file_type">Jenis Dokumen *</Label>
                <Select
                  value={formData.file_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, file_type: value })
                  }
                >
                  <SelectTrigger id="file_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SPT Masa PPN">SPT Masa PPN</SelectItem>
                    <SelectItem value="SPT Tahunan">SPT Tahunan</SelectItem>
                    <SelectItem value="Faktur Pajak">Faktur Pajak</SelectItem>
                    <SelectItem value="Bukti Potong PPh">Bukti Potong PPh</SelectItem>
                    <SelectItem value="Laporan Pajak Masukan">Laporan Pajak Masukan</SelectItem>
                    <SelectItem value="Laporan Pajak Keluaran">Laporan Pajak Keluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Period */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period_month">Bulan Periode *</Label>
                  <Select
                    value={formData.period_month.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, period_month: Number(value) })
                    }
                  >
                    <SelectTrigger id="period_month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthNames.filter((month) => month).map((month, idx) => (
                        <SelectItem key={idx} value={(idx + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period_year">Tahun Periode *</Label>
                  <Input
                    id="period_year"
                    type="number"
                    value={formData.period_year}
                    onChange={(e) =>
                      setFormData({ ...formData, period_year: Number(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload File *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.xlsx,.xls,.csv"
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {selectedFile ? (
                      <>
                        <FileText className="h-12 w-12 text-green-600" />
                        <p className="text-sm font-medium text-gray-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Klik untuk upload atau drag & drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, Excel, atau CSV (Max 10MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Upload Progress */}
              {loading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Uploading...</span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Tambahkan catatan jika diperlukan..."
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button type="submit" disabled={loading || !selectedFile} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Upload ke Coretax
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
