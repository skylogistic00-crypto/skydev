import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Info } from "lucide-react";

export default function TaxExtractionReferenceCard() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Tax Extraction AI - Quick Reference</h1>
      
      <div className="space-y-4">
        {/* What it Does */}
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              What This AI Does
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">✅</Badge>
              <span>Extract <strong>dpp_amount</strong> (Dasar Pengenaan Pajak)</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">✅</Badge>
              <span>Extract <strong>ppn_amount</strong> (PPN/VAT)</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">✅</Badge>
              <span>Calculate <strong>pph_amount</strong> (Withholding Tax)</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">✅</Badge>
              <span>Extract <strong>gross_amount</strong> (Total)</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">✅</Badge>
              <span>Extract <strong>invoice_id</strong> (Nomor Faktur/Invoice Number)</span>
            </div>
          </CardContent>
        </Card>

        {/* What it Does NOT Do */}
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              What This AI Does NOT Do
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <Badge variant="destructive" className="mt-0.5">❌</Badge>
              <span>Change <strong>category</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="destructive" className="mt-0.5">❌</Badge>
              <span>Change <strong>debit_account_code</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="destructive" className="mt-0.5">❌</Badge>
              <span>Change <strong>credit_account_code</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="destructive" className="mt-0.5">❌</Badge>
              <span>Guess values (uses 0 if field doesn't exist)</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="destructive" className="mt-0.5">❌</Badge>
              <span>Create or modify journal entries</span>
            </div>
          </CardContent>
        </Card>

        {/* Rules */}
        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Extraction Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Coretax Faktur Pajak</h3>
              <div className="bg-muted p-3 rounded text-sm space-y-1">
                <div>• DPP = "Dasar Pengenaan Pajak"</div>
                <div>• PPN = "PPN" value</div>
                <div>• Gross = "Total" or "Jumlah yang harus dibayar"</div>
                <div>• Invoice ID = "Nomor Faktur Pajak"</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Commercial Invoice (No Tax)</h3>
              <div className="bg-muted p-3 rounded text-sm space-y-1">
                <div>• DPP = bank_mutation.amount</div>
                <div>• PPN = 0</div>
                <div>• PPh = 0</div>
                <div>• Gross = bank_mutation.amount</div>
                <div>• Invoice ID = invoice number (if exists)</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Withholding Tax (PPh) Detection</h3>
              <div className="bg-muted p-3 rounded text-sm space-y-1">
                <div>• If <code className="bg-background px-1">bank_mutation.amount &lt; gross_amount</code></div>
                <div>• Then <code className="bg-background px-1">pph_amount = gross_amount - bank_mutation.amount</code></div>
                <div className="mt-2 text-muted-foreground">
                  Example: Invoice Rp 22,200,000, Bank Rp 21,800,000 → PPh = Rp 400,000
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Output Format */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Output Format (JSON)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{`{
  "invoice_id": "010.002-24.12345678",
  "dpp_amount": 10000000,
  "ppn_amount": 1100000,
  "pph_amount": 0,
  "gross_amount": 11100000
}`}
            </pre>
          </CardContent>
        </Card>

        {/* Fields in bank_mutations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Database Fields (bank_mutations)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">invoice_id</Badge>
                <span className="text-muted-foreground">TEXT</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">invoice_number</Badge>
                <span className="text-muted-foreground">TEXT</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">dpp_amount</Badge>
                <span className="text-muted-foreground">DECIMAL(18,2)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">ppn_amount</Badge>
                <span className="text-muted-foreground">DECIMAL(18,2)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">pph_amount</Badge>
                <span className="text-muted-foreground">DECIMAL(18,2)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">gross_amount</Badge>
                <span className="text-muted-foreground">DECIMAL(18,2)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">tax_extraction_status</Badge>
                <span className="text-muted-foreground">TEXT</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">tax_extraction_confidence</Badge>
                <span className="text-muted-foreground">DECIMAL(5,2)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
