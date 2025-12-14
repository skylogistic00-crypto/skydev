import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  FileText,
  Download,
  Trash2,
  Eye,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { navigateBack } from "@/utils/navigation";

interface CoretaxUpload {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  period_month: number;
  period_year: number;
  status: string;
  notes: string;
  uploaded_at: string;
  uploaded_by: string;
}

export default function CoretaxReportList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploads, setUploads] = useState<CoretaxUpload[]>([]);
  const [loading, setLoading] = useState(true);

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("coretax_uploads")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setUploads(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus file ini?")) return;

    try {
      const { error } = await supabase
        .from("coretax_uploads")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "File berhasil dihapus",
      });

      fetchUploads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      Uploaded: "default",
      Processing: "secondary",
      Failed: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  Daftar Upload Coretax
                </CardTitle>
                <CardDescription>
                  Riwayat dokumen perpajakan yang telah diupload
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
                  onClick={() => navigate("/coretax-upload")}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Upload Baru
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : uploads.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada file yang diupload</p>
                <Button
                  onClick={() => navigate("/coretax-upload")}
                  className="mt-4"
                >
                  Upload File Pertama
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama File</TableHead>
                      <TableHead>Jenis Dokumen</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal Upload</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploads.map((upload) => (
                      <TableRow key={upload.id}>
                        <TableCell className="font-medium">
                          {upload.file_name}
                        </TableCell>
                        <TableCell>{upload.file_type}</TableCell>
                        <TableCell>
                          {monthNames[upload.period_month - 1]}{" "}
                          {upload.period_year}
                        </TableCell>
                        <TableCell>{getStatusBadge(upload.status)}</TableCell>
                        <TableCell>
                          {new Date(upload.uploaded_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {upload.notes || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(upload.file_path, "_blank")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = upload.file_path;
                                link.download = upload.file_name;
                                link.click();
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(upload.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
