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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Plus, Eye, TrendingUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Employee {
  id: string;
  employee_number: string;
  full_name: string;
  departments?: { department_name: string };
  positions?: { position_name: string };
}

interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  review_period_start: string;
  review_period_end: string;
  review_date: string;
  quality_of_work: number;
  productivity: number;
  communication: number;
  teamwork: number;
  initiative: number;
  leadership: number;
  problem_solving: number;
  attendance_punctuality: number;
  overall_rating: number;
  strengths: string;
  areas_for_improvement: string;
  achievements: string;
  goals: string;
  training_needs: string;
  comments: string;
  status: string;
  employee_comments: string;
  employees?: {
    full_name: string;
    employee_number: string;
    departments?: { department_name: string };
    positions?: { position_name: string };
  };
}

export default function PerformanceReviewSystem() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingReview, setViewingReview] = useState<PerformanceReview | null>(
    null,
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    employee_id: "",
    review_period_start: "",
    review_period_end: "",
    review_date: new Date().toISOString().split("T")[0],
    quality_of_work: "3",
    productivity: "3",
    communication: "3",
    teamwork: "3",
    initiative: "3",
    leadership: "3",
    problem_solving: "3",
    attendance_punctuality: "3",
    strengths: "",
    areas_for_improvement: "",
    achievements: "",
    goals: "",
    training_needs: "",
    comments: "",
  });

  useEffect(() => {
    loadEmployees();
    loadReviews();
  }, []);

  const loadEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select(
        `
        id, 
        employee_number, 
        full_name,
        departments(department_name),
        positions(position_name)
      `,
      )
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
        employees(
          full_name, 
          employee_number,
          departments(department_name),
          positions(position_name)
        )
      `,
      )
      .order("review_date", { ascending: false });
    setReviews(data || []);
  };

  const calculateOverallRating = () => {
    const ratings = [
      parseFloat(formData.quality_of_work),
      parseFloat(formData.productivity),
      parseFloat(formData.communication),
      parseFloat(formData.teamwork),
      parseFloat(formData.initiative),
      parseFloat(formData.leadership),
      parseFloat(formData.problem_solving),
      parseFloat(formData.attendance_punctuality),
    ];
    const sum = ratings.reduce((a, b) => a + b, 0);
    return (sum / ratings.length).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const overallRating = parseFloat(calculateOverallRating());

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("performance_reviews").insert({
        employee_id: formData.employee_id,
        reviewer_id: user?.id,
        review_period_start: formData.review_period_start,
        review_period_end: formData.review_period_end,
        review_date: formData.review_date,
        quality_of_work: parseFloat(formData.quality_of_work),
        productivity: parseFloat(formData.productivity),
        communication: parseFloat(formData.communication),
        teamwork: parseFloat(formData.teamwork),
        initiative: parseFloat(formData.initiative),
        leadership: parseFloat(formData.leadership),
        problem_solving: parseFloat(formData.problem_solving),
        attendance_punctuality: parseFloat(formData.attendance_punctuality),
        overall_rating: overallRating,
        strengths: formData.strengths,
        areas_for_improvement: formData.areas_for_improvement,
        achievements: formData.achievements,
        goals: formData.goals,
        training_needs: formData.training_needs,
        comments: formData.comments,
        status: "submitted",
      });

      if (error) throw error;
      toast({
        title: "Berhasil",
        description: "Penilaian kinerja berhasil dibuat",
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
      quality_of_work: "3",
      productivity: "3",
      communication: "3",
      teamwork: "3",
      initiative: "3",
      leadership: "3",
      problem_solving: "3",
      attendance_punctuality: "3",
      strengths: "",
      areas_for_improvement: "",
      achievements: "",
      goals: "",
      training_needs: "",
      comments: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: "secondary", label: "Draft" },
      submitted: { variant: "default", label: "Submitted" },
      acknowledged: { variant: "outline", label: "Acknowledged" },
      completed: { variant: "default", label: "Completed" },
    };
    const config = variants[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4.5) return <Badge className="bg-green-600">Excellent</Badge>;
    if (rating >= 3.5) return <Badge className="bg-blue-600">Good</Badge>;
    if (rating >= 2.5) return <Badge className="bg-yellow-600">Average</Badge>;
    return <Badge className="bg-red-600">Needs Improvement</Badge>;
  };

  const RatingInput = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 - Poor</SelectItem>
            <SelectItem value="2">2 - Below Average</SelectItem>
            <SelectItem value="3">3 - Average</SelectItem>
            <SelectItem value="4">4 - Good</SelectItem>
            <SelectItem value="5">5 - Excellent</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${parseFloat(value) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Penilaian Kinerja Karyawan</h2>
          <p className="text-gray-600">Kelola performance review karyawan</p>
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Penilaian Kinerja Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Info Dasar</TabsTrigger>
                  <TabsTrigger value="ratings">Penilaian</TabsTrigger>
                  <TabsTrigger value="feedback">Feedback</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
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
                      <Label>Tanggal Review *</Label>
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
                      <Label>Periode Akhir *</Label>
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
                </TabsContent>

                <TabsContent value="ratings" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RatingInput
                      label="Quality of Work"
                      value={formData.quality_of_work}
                      onChange={(value) =>
                        setFormData({ ...formData, quality_of_work: value })
                      }
                    />
                    <RatingInput
                      label="Productivity"
                      value={formData.productivity}
                      onChange={(value) =>
                        setFormData({ ...formData, productivity: value })
                      }
                    />
                    <RatingInput
                      label="Communication"
                      value={formData.communication}
                      onChange={(value) =>
                        setFormData({ ...formData, communication: value })
                      }
                    />
                    <RatingInput
                      label="Teamwork"
                      value={formData.teamwork}
                      onChange={(value) =>
                        setFormData({ ...formData, teamwork: value })
                      }
                    />
                    <RatingInput
                      label="Initiative"
                      value={formData.initiative}
                      onChange={(value) =>
                        setFormData({ ...formData, initiative: value })
                      }
                    />
                    <RatingInput
                      label="Leadership"
                      value={formData.leadership}
                      onChange={(value) =>
                        setFormData({ ...formData, leadership: value })
                      }
                    />
                    <RatingInput
                      label="Problem Solving"
                      value={formData.problem_solving}
                      onChange={(value) =>
                        setFormData({ ...formData, problem_solving: value })
                      }
                    />
                    <RatingInput
                      label="Attendance & Punctuality"
                      value={formData.attendance_punctuality}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          attendance_punctuality: value,
                        })
                      }
                    />
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border-2 border-indigo-200">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">
                        Overall Rating
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-4xl font-bold text-indigo-600">
                          {calculateOverallRating()}
                        </p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-6 w-6 ${parseFloat(calculateOverallRating()) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                      </div>
                      {getRatingBadge(parseFloat(calculateOverallRating()))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="feedback" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Strengths (Kekuatan)</Label>
                    <Textarea
                      value={formData.strengths}
                      onChange={(e) =>
                        setFormData({ ...formData, strengths: e.target.value })
                      }
                      placeholder="Apa kekuatan karyawan ini?"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Areas for Improvement (Area yang Perlu Ditingkatkan)
                    </Label>
                    <Textarea
                      value={formData.areas_for_improvement}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          areas_for_improvement: e.target.value,
                        })
                      }
                      placeholder="Apa yang perlu ditingkatkan?"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Achievements (Pencapaian)</Label>
                    <Textarea
                      value={formData.achievements}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          achievements: e.target.value,
                        })
                      }
                      placeholder="Pencapaian selama periode review..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Goals (Target ke Depan)</Label>
                    <Textarea
                      value={formData.goals}
                      onChange={(e) =>
                        setFormData({ ...formData, goals: e.target.value })
                      }
                      placeholder="Target untuk periode berikutnya..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Training Needs (Kebutuhan Pelatihan)</Label>
                    <Textarea
                      value={formData.training_needs}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          training_needs: e.target.value,
                        })
                      }
                      placeholder="Pelatihan yang dibutuhkan..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Comments (Komentar Tambahan)</Label>
                    <Textarea
                      value={formData.comments}
                      onChange={(e) =>
                        setFormData({ ...formData, comments: e.target.value })
                      }
                      placeholder="Komentar tambahan..."
                      rows={3}
                    />
                  </div>
                </TabsContent>
              </Tabs>

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
            Riwayat Penilaian Kinerja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Periode Review</TableHead>
                  <TableHead>Tanggal Review</TableHead>
                  <TableHead>Overall Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">
                          {review.employees?.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {review.employees?.employee_number}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {review.employees?.departments?.department_name}
                    </TableCell>
                    <TableCell>
                      {review.employees?.positions?.position_name}
                    </TableCell>
                    <TableCell>
                      {format(new Date(review.review_period_start), "dd MMM", {
                        locale: localeId,
                      })}{" "}
                      -{" "}
                      {format(
                        new Date(review.review_period_end),
                        "dd MMM yyyy",
                        { locale: localeId },
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(review.review_date), "dd MMM yyyy", {
                        locale: localeId,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-indigo-600">
                          {Number(review.overall_rating).toFixed(2)}
                        </span>
                        {getRatingBadge(review.overall_rating)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setViewingReview(review);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Lihat Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Review Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Detail Penilaian Kinerja</DialogTitle>
          </DialogHeader>
          {viewingReview && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Karyawan</p>
                  <p className="font-semibold">
                    {viewingReview.employees?.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Periode Review</p>
                  <p className="font-semibold">
                    {format(
                      new Date(viewingReview.review_period_start),
                      "dd MMM",
                      { locale: localeId },
                    )}{" "}
                    -{" "}
                    {format(
                      new Date(viewingReview.review_period_end),
                      "dd MMM yyyy",
                      { locale: localeId },
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-2">Overall Rating</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <p className="text-5xl font-bold text-indigo-600">
                    {Number(viewingReview.overall_rating).toFixed(2)}
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-8 w-8 ${Number(viewingReview.overall_rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
                {getRatingBadge(viewingReview.overall_rating)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: "Quality of Work",
                    value: viewingReview.quality_of_work,
                  },
                  { label: "Productivity", value: viewingReview.productivity },
                  {
                    label: "Communication",
                    value: viewingReview.communication,
                  },
                  { label: "Teamwork", value: viewingReview.teamwork },
                  { label: "Initiative", value: viewingReview.initiative },
                  { label: "Leadership", value: viewingReview.leadership },
                  {
                    label: "Problem Solving",
                    value: viewingReview.problem_solving,
                  },
                  {
                    label: "Attendance",
                    value: viewingReview.attendance_punctuality,
                  },
                ].map((item) => (
                  <div key={item.label} className="p-3 border rounded-lg">
                    <p className="text-sm text-gray-600">{item.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl font-bold text-indigo-600">
                        {Number(item.value).toFixed(1)}
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${Number(item.value) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                {viewingReview.strengths && (
                  <div>
                    <Label className="text-green-700">Strengths</Label>
                    <p className="mt-1 p-3 bg-green-50 rounded-lg">
                      {viewingReview.strengths}
                    </p>
                  </div>
                )}
                {viewingReview.areas_for_improvement && (
                  <div>
                    <Label className="text-orange-700">
                      Areas for Improvement
                    </Label>
                    <p className="mt-1 p-3 bg-orange-50 rounded-lg">
                      {viewingReview.areas_for_improvement}
                    </p>
                  </div>
                )}
                {viewingReview.achievements && (
                  <div>
                    <Label className="text-blue-700">Achievements</Label>
                    <p className="mt-1 p-3 bg-blue-50 rounded-lg">
                      {viewingReview.achievements}
                    </p>
                  </div>
                )}
                {viewingReview.goals && (
                  <div>
                    <Label className="text-purple-700">Goals</Label>
                    <p className="mt-1 p-3 bg-purple-50 rounded-lg">
                      {viewingReview.goals}
                    </p>
                  </div>
                )}
                {viewingReview.training_needs && (
                  <div>
                    <Label className="text-indigo-700">Training Needs</Label>
                    <p className="mt-1 p-3 bg-indigo-50 rounded-lg">
                      {viewingReview.training_needs}
                    </p>
                  </div>
                )}
                {viewingReview.comments && (
                  <div>
                    <Label>Comments</Label>
                    <p className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {viewingReview.comments}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
