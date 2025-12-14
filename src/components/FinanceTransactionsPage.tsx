import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Upload,
  Loader2,
  Save,
  Trash2,
  ScanLine,
  X,
} from "lucide-react";
import { parseOCRText, BreakdownItem, extractReceiptNumber } from "@/utils/FinanceOCRParser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseOCR, type ParsedOCRData, type DocumentType } from "@/utils/ocrParser";

const CATEGORIES = [
  "Travel",
  "Food",
  "Office Supplies",
  "Entertainment",
  "Utilities",
  "Transportation",
  "Medical",
  "Shopping",
  "Miscellaneous",
];

interface FormData {
  employee_name: string;
  merchant: string;
  category: string;
  date_trans: string;
  description: string;
  amount: number;
  ppn: number;
  total: number;
}

export default function FinanceTransactionsPage({
  mode = "create",
}: {
  mode?: "create" | "edit";
}) {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(mode === "edit");

  const [formData, setFormData] = useState<FormData>({
    employee_name: userProfile?.full_name || "",
    merchant: "",
    category: "Miscellaneous",
    date_trans: new Date().toISOString().split("T")[0],
    description: "",
    amount: 0,
    ppn: 0,
    total: 0,
  });

  const [breakdownItems, setBreakdownItems] = useState<BreakdownItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>("INVOICE");
  const [parsedOCRData, setParsedOCRData] = useState<ParsedOCRData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrFilePreview, setOcrFilePreview] = useState<string | null>(null);
  const [ocrId, setOcrId] = useState<string | null>(null);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);

  // Load transaction data when in edit mode
  useEffect(() => {
    if (mode === "edit" && id) {
      loadTransactionData();
    }
  }, [mode, id]);

  const loadTransactionData = async () => {
    try {
      setIsLoading(true);

      // Fetch transaction
      const { data: transaction, error: transError } = await supabase
        .from("finance_transactions")
        .select("*")
        .eq("id", id)
        .single();

      if (transError) throw transError;

      // Fetch breakdown items
      const { data: breakdown, error: breakdownError } = await supabase
        .from("finance_transaction_breakdown")
        .select("*")
        .eq("transaction_id", id);

      if (breakdownError) throw breakdownError;

      // Set form data
      setFormData({
        employee_name: transaction.employee_name,
        merchant: transaction.merchant,
        category: transaction.category,
        date_trans: transaction.date_trans,
        description: transaction.description || "",
        amount: transaction.amount,
        ppn: transaction.ppn,
        total: transaction.total,
      });

      // Set breakdown items
      if (breakdown) {
        setBreakdownItems(
          breakdown.map((item) => ({
            description: item.description || "",
            qty: item.qty,
            price: item.price,
            subtotal: item.subtotal,
          })),
        );
      }

      // Set preview URL if file exists
      if (transaction.file_url) {
        setPreviewUrl(transaction.file_url);
      }

      toast({
        title: "Data loaded",
        description: "Transaction data loaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load transaction data",
        variant: "destructive",
      });
      navigate("/finance/transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-calculate total when amount or ppn changes
      if (name === "amount") {
        const amount = parseFloat(value) || 0;
        updated.ppn = parseFloat((amount * 0.1).toFixed(2));
        updated.total = amount + updated.ppn;
      }

      return updated;
    });
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const processOCR = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select an image first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingOCR(true);
    try {
      // 1. Upload file to Supabase Storage bucket "ocr-receipts"
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("ocr-receipts")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // 2. Generate signed URL (1 hour expiration)
      const { data: urlData, error: urlError } = await supabase.storage
        .from("ocr-receipts")
        .createSignedUrl(fileName, 3600);

      if (urlError) throw urlError;
      const signedUrl = urlData.signedUrl;

      // 3. Call OCR edge function with signed URL
      const { data: raw, error } = await supabase.functions.invoke(
        "supabase-functions-vision-google-ocr",
        {
          body: { signedUrl },
        },
      );

      if (error) throw error;

      // Parse raw JSON from Supabase
      let visionData;
      try {
        visionData = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch (err) {
        throw new Error("Vision API returned invalid JSON.");
      }

      // Extract text from response
      let fullText = "";
      const resp = visionData?.responses?.[0];

      if (resp?.textAnnotations?.length > 0) {
        fullText = resp.textAnnotations[0].description;
      } else if (resp?.fullTextAnnotation?.text) {
        fullText = resp.fullTextAnnotation.text;
      } else {
        fullText = "";
      }

      setExtractedText(fullText);

      // Parse result based on document type
      const parsed = parseOCR(fullText, documentType);
      setParsedOCRData(parsed);

      // 4. Parse OCR text for finance data
      const financeParsed = parseOCRText(fullText);

      // Extract nominal, tanggal, nomor_nota, toko
      const nominal = financeParsed.total || null;
      const tanggal = financeParsed.date || null;
      const nomor_nota = extractReceiptNumber(fullText);
      const toko = financeParsed.merchant || null;

      // 5. Save OCR results to ocr_results table
      try {
        const { data: ocrData, error: ocrError } = await supabase
          .from("ocr_results")
          .insert([
            {
              image_url: signedUrl,
              extracted_text: fullText,
              nominal,
              tanggal,
              nomor_nota,
              toko,
              autofill_status: "completed",
            },
          ])
          .select()
          .single();

        if (ocrError) {
          console.error("Error saving OCR result:", ocrError);
        } else if (ocrData) {
          // Store OCR ID for linking to transaction
          setOcrId(ocrData.id);
        }
      } catch (ocrSaveError) {
        console.error("Unexpected error while saving OCR result:", ocrSaveError);
      }

      // 6. Autofill form fields
      const deskripsi = toko && nomor_nota
        ? `Transaksi dari ${toko} nomor ${nomor_nota}. Ekstrak OCR: ${fullText.substring(0, 200)}...`
        : `Ekstrak OCR: ${fullText.substring(0, 200)}...`;

      setFormData((prev) => ({
        ...prev,
        merchant: toko || prev.merchant,
        category: financeParsed.category || prev.category,
        date_trans: tanggal || prev.date_trans,
        amount: nominal || prev.amount,
        ppn: financeParsed.ppn || prev.ppn,
        total: (nominal || 0) + (financeParsed.ppn || 0),
        description: deskripsi,
      }));

      if (financeParsed.breakdown.length > 0) {
        setBreakdownItems(financeParsed.breakdown);
      }

      toast({
        title: "OCR berhasil diproses",
        description: "Data transaksi telah terisi otomatis. Silakan periksa kembali sebelum menyimpan.",
      });
    } catch (error) {
      console.error("OCR Error:", error);
      toast({
        title: "OCR Error",
        description:
          error instanceof Error ? error.message : "Failed to process OCR",
        variant: "destructive",
      });
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const addBreakdownItem = () => {
    setBreakdownItems((prev) => [
      ...prev,
      { qty: 1, price: 0, subtotal: 0, description: "" },
    ]);
  };

  const updateBreakdownItem = (
    index: number,
    field: keyof BreakdownItem,
    value: string | number,
  ) => {
    setBreakdownItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-calculate subtotal
      if (field === "qty" || field === "price") {
        const qty = field === "qty" ? Number(value) : updated[index].qty;
        const price = field === "price" ? Number(value) : updated[index].price;
        updated[index].subtotal = qty * price;
      }

      return updated;
    });
  };

  const removeBreakdownItem = (index: number) => {
    setBreakdownItems((prev) => prev.filter((_, i) => i !== index));
  };

  // OCR Modal Functions
  const handleOCRFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const f = e.target.files[0];
    setOcrFile(f);
    if (f.type.startsWith("image/")) {
      setOcrFilePreview(URL.createObjectURL(f));
    } else {
      setOcrFilePreview(null);
    }
  };

  const handleScanOCR = async () => {
    if (!ocrFile) {
      toast({
        title: "Error",
        description: "Harap pilih file terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessingOCR(true);

      // 1. Upload file to Supabase Storage
      const fileName = `scan_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("ocr_uploads")
        .upload(fileName, ocrFile, { upsert: true });

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

      // Parse raw JSON
      let visionData;
      try {
        visionData = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch (err) {
        console.error("❌ JSON PARSE FAILED:", err);
        throw new Error("Vision API returned invalid JSON.");
      }

      // Extract text
      let fullText = "";
      if (visionData?.extracted_text) {
        fullText = visionData.extracted_text;
      } else {
        const resp = visionData?.responses?.[0];
        if (resp?.textAnnotations?.length > 0) {
          fullText = resp.textAnnotations[0].description;
        } else if (resp?.fullTextAnnotation?.text) {
          fullText = resp.fullTextAnnotation.text;
        }
      }

      setExtractedText(fullText);

      // Parse with receipt parser
      const parsed = parseOCR(fullText, "RECEIPT");

      // Map to form fields
      setFormData((prev) => ({
        ...prev,
        merchant: parsed.nama || prev.merchant,
        description: fullText.substring(0, 200),
        date_trans: parsed.alamat
          ? new Date().toISOString().split("T")[0]
          : prev.date_trans,
      }));

      // Parse with finance parser for amounts
      const financeParsed = parseOCRText(fullText);
      if (financeParsed.total) {
        setFormData((prev) => ({
          ...prev,
          amount: financeParsed.total || 0,
          ppn: financeParsed.ppn || 0,
          total: (financeParsed.total || 0) + (financeParsed.ppn || 0),
        }));
      }

      if (financeParsed.breakdown.length > 0) {
        setBreakdownItems(financeParsed.breakdown);
      }

      // Set preview URL from signed URL
      setPreviewUrl(signedData.signedUrl);
      setSelectedFile(ocrFile);

      toast({
        title: "OCR Berhasil",
        description: "Data berhasil diekstrak dan form telah diisi otomatis",
      });

      setShowOCRModal(false);
    } catch (err: any) {
      console.error("OCR Error:", err);
      toast({
        title: "OCR Error",
        description: err.message || "Gagal memproses OCR",
        variant: "destructive",
      });
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleSave = async () => {
    if (!formData.merchant || !formData.employee_name) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields (Employee Name, Merchant)",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      let fileUrl = previewUrl; // Keep existing file URL if no new file

      // Upload file if new file selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `transactions/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("finance-documents")
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("finance-documents")
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
      }

      if (mode === "edit" && id) {
        // Update existing transaction
        const { error: updateError } = await supabase
          .from("finance_transactions")
          .update({
            employee_name: formData.employee_name,
            merchant: formData.merchant,
            category: formData.category,
            date_trans: formData.date_trans,
            description: formData.description,
            amount: formData.amount,
            ppn: formData.ppn,
            total: formData.total,
            file_url: fileUrl,
          })
          .eq("id", id);

        if (updateError) throw updateError;

        // Delete existing breakdown items
        const { error: deleteError } = await supabase
          .from("finance_transaction_breakdown")
          .delete()
          .eq("transaction_id", id);

        if (deleteError) throw deleteError;

        // Insert new breakdown items
        if (breakdownItems.length > 0) {
          const breakdownData = breakdownItems.map((item) => ({
            transaction_id: id,
            qty: item.qty,
            price: item.price,
            subtotal: item.subtotal,
            description: item.description || null,
          }));

          const { error: breakdownError } = await supabase
            .from("finance_transaction_breakdown")
            .insert(breakdownData);

          if (breakdownError) throw breakdownError;
        }

        toast({
          title: "Success",
          description: "Transaction updated successfully",
        });
      } else {
        // Insert new transaction
        const { data: transaction, error: transactionError } = await supabase
          .from("finance_transactions")
          .insert({
            employee_name: formData.employee_name,
            merchant: formData.merchant,
            category: formData.category,
            date_trans: formData.date_trans,
            description: formData.description,
            amount: formData.amount,
            ppn: formData.ppn,
            total: formData.total,
            file_url: fileUrl,
            status: "pending",
            created_by: user?.id,
            ocr_id: ocrId, // Link to OCR result
          })
          .select()
          .single();

        if (transactionError) throw transactionError;

        // Insert breakdown items
        if (breakdownItems.length > 0 && transaction) {
          const breakdownData = breakdownItems.map((item) => ({
            transaction_id: transaction.id,
            qty: item.qty,
            price: item.price,
            subtotal: item.subtotal,
            description: item.description || null,
          }));

          const { error: breakdownError } = await supabase
            .from("finance_transaction_breakdown")
            .insert(breakdownData);

          if (breakdownError) throw breakdownError;
        }

        toast({
          title: "Success",
          description: "Transaction saved successfully",
        });
      }

      navigate("/finance/transactions");
    } catch (error) {
      console.error("Save Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save transaction",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/finance/transactions")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {mode === "edit"
                  ? "Edit Finance Transaction"
                  : "New Finance Transaction"}
              </h1>
              <p className="text-gray-500">
                {mode === "edit"
                  ? "Update expense transaction"
                  : "Create a new expense transaction"}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* OCR Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Receipt</CardTitle>
                  <CardDescription>
                    Upload an image to extract data using OCR
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Document Type Selector */}
                  <div className="space-y-2">
                    <Label>Jenis Dokumen</Label>
                    <Select
                      value={documentType}
                      onValueChange={(v) => setDocumentType(v as DocumentType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis dokumen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INVOICE">Invoice</SelectItem>
                        <SelectItem value="NOTA">Nota</SelectItem>
                        <SelectItem value="KWITANSI">Kwitansi</SelectItem>
                        <SelectItem value="CASH_DISBURSEMENT">
                          Cash Disbursement
                        </SelectItem>
                        <SelectItem value="SURAT_JALAN">Surat Jalan</SelectItem>
                        <SelectItem value="KTP">KTP</SelectItem>
                        <SelectItem value="NPWP">NPWP</SelectItem>
                        <SelectItem value="SIM">SIM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {previewUrl ? (
                      <div className="space-y-4">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded-lg"
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Change Image
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-12 w-12 mx-auto text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          Click to upload receipt image
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>

                  <Button
                    onClick={processOCR}
                    disabled={!selectedFile || isProcessingOCR}
                    className="w-full"
                  >
                    {isProcessingOCR ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing OCR...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Process with OCR
                      </>
                    )}
                  </Button>

                  {extractedText && (
                    <div className="space-y-2 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <Label className="text-green-800 font-semibold">✅ Hasil Scan OCR</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExtractedText("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={extractedText}
                        readOnly
                        className="h-48 font-mono text-xs bg-white"
                        placeholder="Extracted text will appear here..."
                      />
                      <p className="text-xs text-green-700">
                        📝 Text berhasil di-extract dan form sudah di-autofill
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Form Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Details</CardTitle>
                  <CardDescription>
                    Fill in the transaction information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee_name">Employee Name *</Label>
                      <Input
                        id="employee_name"
                        name="employee_name"
                        value={formData.employee_name}
                        onChange={handleInputChange}
                        placeholder="Enter employee name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="merchant">Merchant *</Label>
                      <Input
                        id="merchant"
                        name="merchant"
                        value={formData.merchant}
                        onChange={handleInputChange}
                        placeholder="Enter merchant name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={handleCategoryChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_trans">Date</Label>
                      <Input
                        id="date_trans"
                        name="date_trans"
                        type="date"
                        value={formData.date_trans}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handleInputChange}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ppn">PPN (10%)</Label>
                      <Input
                        id="ppn"
                        name="ppn"
                        type="number"
                        value={formData.ppn}
                        readOnly
                        className="bg-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total">Total</Label>
                      <Input
                        id="total"
                        name="total"
                        type="number"
                        value={formData.total}
                        readOnly
                        className="bg-gray-100 font-bold"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Breakdown Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Breakdown Items</CardTitle>
                  <CardDescription>
                    Add individual items from the receipt
                  </CardDescription>
                </div>
                <Button onClick={addBreakdownItem} variant="outline" size="sm">
                  Add Item
                </Button>
              </CardHeader>
              <CardContent>
                {breakdownItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-24">Qty</TableHead>
                        <TableHead className="w-32">Price</TableHead>
                        <TableHead className="w-32">Subtotal</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {breakdownItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={item.description || ""}
                              onChange={(e) =>
                                updateBreakdownItem(
                                  index,
                                  "description",
                                  e.target.value,
                                )
                              }
                              placeholder="Item description"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.qty}
                              onChange={(e) =>
                                updateBreakdownItem(
                                  index,
                                  "qty",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              min={1}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.price}
                              onChange={(e) =>
                                updateBreakdownItem(
                                  index,
                                  "price",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.subtotal}
                              readOnly
                              className="bg-gray-100"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBreakdownItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No breakdown items. Click "Add Item" to add items.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/finance/transactions")}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {mode === "edit" ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === "edit"
                      ? "Update Transaction"
                      : "Save Transaction"}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
