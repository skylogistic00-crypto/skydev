import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileText, CheckCircle, XCircle, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";

const SAMPLE_CORETAX_FAKTUR = `FAKTUR PAJAK
Nomor: 010.002-24.12345678

PT. CONTOH ABADI
NPWP: 01.234.567.8-901.000

Tanggal: 15 Januari 2024

Dasar Pengenaan Pajak: Rp 10.000.000
PPN 11%: Rp 1.100.000
Total yang harus dibayar: Rp 11.100.000

Kepada:
PT. PEMBELI SEJAHTERA
NPWP: 02.345.678.9-012.000`;

const SAMPLE_COMMERCIAL_INVOICE = `INVOICE
No: INV-2024-001

PT. SUPPLIER MANDIRI
Jl. Sudirman No. 123

Tanggal: 20 Januari 2024

Kepada Yth:
PT. CUSTOMER JAYA

Deskripsi:
- Barang A: Rp 5.000.000
- Barang B: Rp 3.000.000

TOTAL: Rp 8.000.000

Terima kasih atas kepercayaan Anda.`;

const SAMPLE_CORETAX_WITH_WITHHOLDING = `FAKTUR PAJAK
Nomor: 010.003-24.98765432

PT. JASA KONSULTAN
NPWP: 03.456.789.0-123.000

Tanggal: 25 Januari 2024

Dasar Pengenaan Pajak: Rp 20.000.000
PPN 11%: Rp 2.200.000
Total: Rp 22.200.000

PPh Pasal 23 (2%): Rp 400.000
Jumlah yang dibayarkan: Rp 21.800.000`;

export default function TaxExtractionDemo() {
  const [ocrText, setOcrText] = useState("");
  const [bankAmount, setBankAmount] = useState("0");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!ocrText.trim()) {
      setError("Please enter OCR text");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Create a temporary bank mutation for testing
      const { data: mutation, error: createError } = await supabase
        .from("bank_mutations")
        .insert({
          description: "Tax Extraction Test",
          debit: 0,
          credit: parseFloat(bankAmount) || 0,
          ocr_text: ocrText,
          approval_status: null,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Call the tax extraction function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tax-extraction-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            bank_mutation_id: mutation.id,
            ocr_text: ocrText,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to extract tax data");
      }

      const extractionResult = await response.json();
      if (!extractionResult.success) {
        throw new Error(extractionResult.error || "Extraction failed");
      }

      setResult(extractionResult.data);

      // Clean up test data
      await supabase.from("bank_mutations").delete().eq("id", mutation.id);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const loadSample = (sample: string, amount: string) => {
    setOcrText(sample);
    setBankAmount(amount);
    setResult(null);
    setError(null);
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-purple-600" />
            Tax Extraction AI Demo
          </h1>
          <p className="text-muted-foreground mt-2">
            Extract tax information from invoices and Faktur Pajak using AI
          </p>
        </div>

        {/* Sample Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Test Samples</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSample(SAMPLE_CORETAX_FAKTUR, "11100000")}
            >
              Coretax Faktur Pajak
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSample(SAMPLE_COMMERCIAL_INVOICE, "8000000")}
            >
              Commercial Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSample(SAMPLE_CORETAX_WITH_WITHHOLDING, "21800000")}
            >
              Faktur with Withholding Tax
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Input OCR Text</CardTitle>
              <CardDescription>
                Paste the OCR text from invoice or Faktur Pajak
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ocr-text">OCR Text</Label>
                <Textarea
                  id="ocr-text"
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  placeholder="Paste OCR text here..."
                  className="min-h-[300px] font-mono text-xs"
                />
              </div>

              <div>
                <Label htmlFor="bank-amount">Bank Mutation Amount (Rp)</Label>
                <Input
                  id="bank-amount"
                  type="number"
                  value={bankAmount}
                  onChange={(e) => setBankAmount(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The actual amount received/paid in bank account
                </p>
              </div>

              <Button
                onClick={handleExtract}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Extract Tax Information
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Result Section */}
          <Card>
            <CardHeader>
              <CardTitle>Extraction Result</CardTitle>
              <CardDescription>
                AI-extracted tax information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {result && (
                <>
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Tax data extracted successfully!
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-muted-foreground">
                        Invoice ID/Nomor Faktur:
                      </span>
                      <Badge variant="outline">
                        {result.invoice_id || "-"}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-muted-foreground">
                        DPP (Dasar Pengenaan Pajak):
                      </span>
                      <span className="font-mono font-semibold">
                        {formatRupiah(result.dpp_amount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-muted-foreground">
                        PPN (Pajak Pertambahan Nilai):
                      </span>
                      <span className="font-mono font-semibold text-blue-600">
                        {formatRupiah(result.ppn_amount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-muted-foreground">
                        PPh (Pajak Penghasilan):
                      </span>
                      <span className="font-mono font-semibold text-orange-600">
                        {formatRupiah(result.pph_amount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-muted p-3 rounded">
                      <span className="text-sm font-semibold">
                        Gross Amount (Total):
                      </span>
                      <span className="font-mono font-bold text-lg">
                        {formatRupiah(result.gross_amount)}
                      </span>
                    </div>

                    {result.pph_amount > 0 && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Withholding tax (PPh) detected: The difference between
                          gross amount and bank amount is {formatRupiah(result.pph_amount)}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </>
              )}

              {!result && !error && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No extraction result yet</p>
                  <p className="text-xs mt-2">
                    Enter OCR text and click Extract to see results
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4" />
              How it works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <strong>1. Coretax Faktur Pajak:</strong> Extracts DPP, PPN, and invoice number from tax invoices
            </p>
            <p>
              <strong>2. Commercial Invoice:</strong> Treats total as DPP with no tax
            </p>
            <p>
              <strong>3. Withholding Tax:</strong> If bank amount is less than gross amount, the difference is PPh
            </p>
            <p className="text-muted-foreground mt-4">
              This AI does NOT change accounting categories or account codes. It only extracts tax information.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
