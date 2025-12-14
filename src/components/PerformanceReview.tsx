import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Plus, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Employee {
  id: string;
  employee_number: string;
  full_name: string;
}

interface PerformanceReview {
  id: string;
  employee_id: string;
  review_period_start: string;
  review_period_end: string;
  review_date: string;
  overall_rating: number;
  strengths: string;
  areas_for_improvement: string;
  status: string;
  employees?: { full_name: string; employee_number: string };
}

export default function PerformanceReview() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    employee_id: "",
    review_period_start: "",
    review_period_end: "",
    review_date: new Date().toISOString().split("T")[0],
    overall_rating: "3",
    quality_of_work: "3",
    productivity: "3",
    communication: "3",
    teamwork: "3",
    initiative: "3",
    strengths: "",
    areas_for_improvement: "",
    goals: "",
    comments: "",
  });

  useEffect(() => {
    loadEmployees();
    loadReviews();
  }, []);

  const loadEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, employee_number, full_name")
      .eq("status", "active")
      .order("full_name");
    setEmployees(data || []);
  };

  const loadReviews = async () => {
    const { data } = await supabase
      .from("performance_reviews")
      .select(
        `
        *,
        employees(full_name, employee_number)
      `,
      )
      .order("review_date", { ascending: false });
    setReviews(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const criteria = {
        quality_of_work: parseFloat(formData.quality_of_work),
        productivity: parseFloat(formData.productivity),
        communication: parseFloat(formData.communication),
        teamwork: parseFloat(formData.teamwork),
        initiative: parseFloat(formData.initiative),
      };

      const { error } = await supabase.from("performance_reviews").insert({
        employee_id: formData.employee_id,
        review_period_start: formData.review_period_start,
        review_period_end: formData.review_period_end,
        review_date: formData.review_date,
        overall_rating: parseFloat(formData.overall_rating),
        criteria: criteria,
        strengths: formData.strengths,
        areas_for_improvement: formData.areas_for_improvement,
        goals: formData.goals,
        comments: formData.comments,
        status: "submitted",
      });

      if (error) throw error;
      toast({
        title: "Berhasil",
        description: "Penilaian kinerja berhasil disimpan",
      });
      loadReviews();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      review_period_start: "",
      review_period_end: "",
      review_date: new Date().toISOString().split("T")[0],
      overall_rating: "3",
      quality_of_work: "3",
      productivity: "3",
      communication: "3",
      teamwork: "3",
      initiative: "3",
      strengths: "",
      areas_for_improvement: "",
      goals: "",
      comments: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: "secondary", label: "Draft" },
      submitted: { variant: "default", label: "Submitted" },
      acknowledged: { variant: "outline", label: "Acknowledged" },
    };
    const config = variants[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-blue-600";
    if (rating >= 2.5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Penilaian Kinerja</h2>
          <p className="text-gray-600">Kelola penilaian kinerja karyawan</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Buat Penilaian
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Penilaian Kinerja</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Informasi Dasar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Karyawan *</Label>
                    <Select
                      required
                      value={formData.employee_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, employee_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih karyawan" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.employee_number} - {emp.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tanggal Penilaian *</Label>
                    <Input
                      type="date"
                      required
                      value={formData.review_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          review_date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Periode Mulai *</Label>
                    <Input
                      type="date"
                      required
                      value={formData.review_period_start}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          review_period_start: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Periode Selesai *</Label>
                    <Input
                      type="date"
                      required
                      value={formData.review_period_end}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          review_period_end: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Rating Criteria */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Kriteria Penilaian (1-5)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kualitas Kerja</Label>
                    <Select
                      value={formData.quality_of_work}
                      onValueChange={(value) =>
                        setFormData({ ...formData, quality_of_work: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((val) => (
                          <SelectItem key={val} value={val.toString()}>
                            {val} -{" "}
                            {val === 5
                              ? "Excellent"
                              : val === 4
                                ? "Good"
                                : val === 3
                                  ? "Average"
                                  : val === 2
                                    ? "Below Average"
                                    : "Poor"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Produktivitas</Label>
                    <Select
                      value={formData.productivity}
                      onValueChange={(value) =>
                        setFormData({ ...formData, productivity: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((val) => (
                          <SelectItem key={val} value={val.toString()}>
                            {val} -{" "}
                            {val === 5
                              ? "Excellent"
                              : val === 4
                                ? "Good"
                                : val === 3
                                  ? "Average"
                                  : val === 2
                                    ? "Below Average"
                                    : "Poor"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Komunikasi</Label>
                    <Select
                      value={formData.communication}
                      onValueChange={(value) =>
                        setFormData({ ...formData, communication: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((val) => (
                          <SelectItem key={val} value={val.toString()}>
                            {val} -{" "}
                            {val === 5
                              ? "Excellent"
                              : val === 4
                                ? "Good"
                                : val === 3
                                  ? "Average"
                                  : val === 2
                                    ? "Below Average"
                                    : "Poor"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Kerja Tim</Label>
                    <Select
                      value={formData.teamwork}
                      onValueChange={(value) =>
                        setFormData({ ...formData, teamwork: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((val) => (
                          <SelectItem key={val} value={val.toString()}>
                            {val} -{" "}
                            {val === 5
                              ? "Excellent"
                              : val === 4
                                ? "Good"
                                : val === 3
                                  ? "Average"
                                  : val === 2
                                    ? "Below Average"
                                    : "Poor"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Inisiatif</Label>
                    <Select
                      value={formData.initiative}
                      onValueChange={(value) =>
                        setFormData({ ...formData, initiative: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((val) => (
                          <SelectItem key={val} value={val.toString()}>
                            {val} -{" "}
                            {val === 5
                              ? "Excellent"
                              : val === 4
                                ? "Good"
                                : val === 3
                                  ? "Average"
                                  : val === 2
                                    ? "Below Average"
                                    : "Poor"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Rating Keseluruhan *</Label>
                    <Select
                      value={formData.overall_rating}
                      onValueChange={(value) =>
                        setFormData({ ...formData, overall_rating: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((val) => (
                          <SelectItem key={val} value={val.toString()}>
                            {val} -{" "}
                            {val === 5
                              ? "Excellent"
                              : val === 4
                                ? "Good"
                                : val === 3
                                  ? "Average"
                                  : val === 2
                                    ? "Below Average"
                                    : "Poor"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Feedback</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Kekuatan</Label>
                    <Textarea
                      value={formData.strengths}
                      onChange={(e) =>
                        setFormData({ ...formData, strengths: e.target.value })
                      }
                      placeholder="Jelaskan kekuatan karyawan..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Area yang Perlu Ditingkatkan</Label>
                    <Textarea
                      value={formData.areas_for_improvement}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          areas_for_improvement: e.target.value,
                        })
                      }
                      placeholder="Jelaskan area yang perlu ditingkatkan..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Target/Goals</Label>
                    <Textarea
                      value={formData.goals}
                      onChange={(e) =>
                        setFormData({ ...formData, goals: e.target.value })
                      }
                      placeholder="Tetapkan target untuk periode berikutnya..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Komentar Tambahan</Label>
                    <Textarea
                      value={formData.comments}
                      onChange={(e) =>
                        setFormData({ ...formData, comments: e.target.value })
                      }
                      placeholder="Komentar tambahan..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Simpan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Daftar Penilaian Kinerja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Karyawan</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Tanggal Review</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {review.employees?.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {review.employees?.employee_number}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(review.review_period_start).toLocaleDateString(
                      "id-ID",
                    )}{" "}
                    -{" "}
                    {new Date(review.review_period_end).toLocaleDateString(
                      "id-ID",
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(review.review_date).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Star
                        className={`h-4 w-4 ${getRatingColor(review.overall_rating)}`}
                        fill="currentColor"
                      />
                      <span
                        className={`font-bold ${getRatingColor(review.overall_rating)}`}
                      >
                        {review.overall_rating.toFixed(1)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(review.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
