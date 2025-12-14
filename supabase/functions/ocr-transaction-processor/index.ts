import { corsHeaders } from "@shared/cors.ts";

interface OCRRequest {
  file: string[];
  metadata?: {
    entrypoint_path?: string;
    import_map_path?: string;
    static_patterns?: string[];
    verify_jwt?: boolean;
    name?: string;
  };
}

interface OCRResponse {
  vendor_name: string;
  transaction_date: string;
  total_amount: number;
  items: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
  payment_method: string;
  invoice_number: string;
  document_type?: string;
  employee_name?: string;
  employee_number?: string;
  suggested_debit_account?: string;
  suggested_credit_account?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    });
  }

  try {
    const body: OCRRequest = await req.json();
    
    if (!body.file || body.file.length === 0) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const base64Image = body.file[0];
    
    // Call OpenAI Vision API for OCR
    const openaiApiKey = Deno.env.get('OPEN_AI_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this receipt/invoice/salary slip image and extract the following information in JSON format:
{
  "document_type": "invoice|receipt|salary_slip|other",
  "vendor_name": "name of the vendor/merchant (or company name for salary slip)",
  "employee_name": "employee name (only for salary slip)",
  "employee_number": "employee number/ID (only for salary slip)",
  "transaction_date": "date in YYYY-MM-DD format",
  "total_amount": numeric value of total amount (Gaji Bersih/Take Home Pay for salary slip),
  "items": [
    {
      "name": "item name or salary component",
      "qty": numeric quantity,
      "price": numeric price per unit
    }
  ],
  "payment_method": "cash, bank, or transfer (extract bank name if mentioned: Mandiri, BCA, BNI, etc)",
  "invoice_number": "invoice or reference number if available",
  "suggested_debit_account": "6-1000 for salary slip, empty for others",
  "suggested_credit_account": "1-1038 if Bank Mandiri mentioned, empty for others"
}

CRITICAL RULES FOR SALARY SLIP DETECTION:
1. If document contains "SLIP GAJI", "GAJI KARYAWAN", "PAYROLL", "SALARY SLIP", or salary-related terms:
   - Set document_type to "salary_slip"
   - Set suggested_debit_account to "6-1000" (Beban Gaji & Karyawan)
   - Extract employee_name and employee_number
   - If bank name is "Mandiri", set suggested_credit_account to "1-1038"
   - If bank name is "BCA", set suggested_credit_account to "1-1200"
   - Use "Gaji Bersih" or "Take Home Pay" as total_amount
   
2. For regular invoices/receipts:
   - Set document_type to "invoice" or "receipt"
   - Leave suggested accounts empty

Extract all visible information. If any field is not found, use empty string or 0 for numbers. Return ONLY valid JSON, no additional text.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const extractedText = openaiData.choices[0]?.message?.content || '{}';
    
    // Parse the JSON response
    let ocrResult: OCRResponse;
    try {
      // Remove markdown code blocks if present
      const cleanedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      ocrResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', extractedText);
      // Return default structure if parsing fails
      ocrResult = {
        vendor_name: '',
        transaction_date: new Date().toISOString().split('T')[0],
        total_amount: 0,
        items: [],
        payment_method: 'cash',
        invoice_number: '',
        document_type: 'other',
        employee_name: '',
        employee_number: '',
        suggested_debit_account: '',
        suggested_credit_account: ''
      };
    }

    return new Response(
      JSON.stringify(ocrResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('OCR processing error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process OCR',
        vendor_name: '',
        transaction_date: new Date().toISOString().split('T')[0],
        total_amount: 0,
        items: [],
        payment_method: 'cash',
        invoice_number: '',
        document_type: 'other',
        employee_name: '',
        employee_number: '',
        suggested_debit_account: '',
        suggested_credit_account: ''
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
