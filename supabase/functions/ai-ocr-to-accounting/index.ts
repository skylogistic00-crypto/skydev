import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "@shared/supabase-client.ts";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  account_code?: string;
}

interface OCRInvoiceData {
  supplier_name?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  subtotal?: number;
  tax_amount?: number;
  total_amount: number;
  line_items: LineItem[];
  raw_text?: string;
}

interface JournalLine {
  account_code: string;
  account_name?: string;
  debit: number;
  credit: number;
  description: string;
}

interface JournalPayload {
  entry_date: string;
  description: string;
  total_amount: number;
  lines: JournalLine[];
}

async function parseOCRWithAI(
  ocrText: string,
  openaiKey: string
): Promise<OCRInvoiceData> {
  const systemPrompt = `You are an OCR data parser for invoices. Extract structured data from the OCR text.
Return ONLY valid JSON with this structure:
{
  "supplier_name": "string or null",
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "subtotal": number or null,
  "tax_amount": number or null,
  "total_amount": number (required),
  "line_items": [
    {
      "description": "string",
      "quantity": number,
      "unit_price": number,
      "amount": number
    }
  ]
}

Rules:
- Extract all line items with their amounts
- Convert dates to YYYY-MM-DD format
- Convert currency strings to numbers (remove Rp, IDR, commas)
- If total_amount not found, sum line_items amounts
- Return valid JSON only, no explanation`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Parse this OCR text:\n\n${ocrText}` },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";

  // Clean and parse JSON
  const cleanedContent = content
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/gi, "")
    .trim();

  return JSON.parse(cleanedContent);
}

async function mapAccountCodes(
  lineItems: LineItem[],
  supabase: any
): Promise<LineItem[]> {
  // Fetch account mappings
  const { data: mappings } = await supabase
    .from("account_mappings")
    .select("keyword, account_code, account_name")
    .eq("is_active", true);

  if (!mappings || mappings.length === 0) {
    // Default mapping if no mappings found
    return lineItems.map((item) => ({
      ...item,
      account_code: "5100", // Default expense account
    }));
  }

  return lineItems.map((item) => {
    const description = item.description.toLowerCase();

    // Find matching mapping
    const match = mappings.find((m: any) =>
      description.includes(m.keyword.toLowerCase())
    );

    return {
      ...item,
      account_code: match?.account_code || "5100",
    };
  });
}

function generateJournalPayload(
  invoiceData: OCRInvoiceData,
  mappedItems: LineItem[]
): JournalPayload {
  const entryDate =
    invoiceData.invoice_date || new Date().toISOString().split("T")[0];
  const description = `Invoice ${invoiceData.invoice_number || "N/A"} - ${invoiceData.supplier_name || "Unknown Supplier"}`;

  const lines: JournalLine[] = [];

  // Group items by account code
  const groupedByAccount: Record<string, number> = {};
  for (const item of mappedItems) {
    const code = item.account_code || "5100";
    groupedByAccount[code] = (groupedByAccount[code] || 0) + item.amount;
  }

  // Create debit entries for expenses
  for (const [accountCode, amount] of Object.entries(groupedByAccount)) {
    lines.push({
      account_code: accountCode,
      debit: amount,
      credit: 0,
      description: `Expense - ${description}`,
    });
  }

  // Add tax entry if applicable
  if (invoiceData.tax_amount && invoiceData.tax_amount > 0) {
    lines.push({
      account_code: "1170", // PPN Masukan
      debit: invoiceData.tax_amount,
      credit: 0,
      description: `PPN Masukan - ${description}`,
    });
  }

  // Credit entry for Accounts Payable
  lines.push({
    account_code: "2100", // Hutang Usaha
    debit: 0,
    credit: invoiceData.total_amount,
    description: `Payable - ${description}`,
  });

  return {
    entry_date: entryDate,
    description,
    total_amount: invoiceData.total_amount,
    lines,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { ocr_text, action, journal_payload } = await req.json();

    const OPENAI_KEY = Deno.env.get("OPEN_AI_KEY");
    const supabase = createClient();

    // Action: Parse OCR text and generate journal payload
    if (action === "parse" || (!action && ocr_text)) {
      if (!ocr_text) {
        return new Response(
          JSON.stringify({ error: "ocr_text is required" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      if (!OPENAI_KEY) {
        return new Response(
          JSON.stringify({ error: "OPEN_AI_KEY not configured" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }

      // Parse OCR with AI
      const invoiceData = await parseOCRWithAI(ocr_text, OPENAI_KEY);
      invoiceData.raw_text = ocr_text;

      // Map account codes
      const mappedItems = await mapAccountCodes(invoiceData.line_items, supabase);

      // Generate journal payload
      const journalPayload = generateJournalPayload(invoiceData, mappedItems);

      return new Response(
        JSON.stringify({
          invoice_data: invoiceData,
          mapped_items: mappedItems,
          journal_payload: journalPayload,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Action: Insert journal entry
    if (action === "insert_journal") {
      if (!journal_payload) {
        return new Response(
          JSON.stringify({ error: "journal_payload is required" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      const { entry_date, description, total_amount, lines } = journal_payload;

      // Validate payload
      if (!entry_date || !lines || !Array.isArray(lines) || lines.length === 0) {
        return new Response(
          JSON.stringify({ error: "Invalid journal_payload structure" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      // Validate debit = credit
      const totalDebit = lines.reduce((sum: number, l: JournalLine) => sum + (l.debit || 0), 0);
      const totalCredit = lines.reduce((sum: number, l: JournalLine) => sum + (l.credit || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return new Response(
          JSON.stringify({
            error: "Journal not balanced",
            total_debit: totalDebit,
            total_credit: totalCredit,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      // Insert journal entry
      const { data: journal, error: journalError } = await supabase
        .from("journal_entries")
        .insert([
          {
            entry_date,
            description,
            total_amount,
            status: "draft",
            source: "ocr_import",
          },
        ])
        .select()
        .single();

      if (journalError) {
        return new Response(
          JSON.stringify({ error: `Failed to insert journal: ${journalError.message}` }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }

      // Insert journal lines
      const linesToInsert = lines.map((line: JournalLine) => ({
        journal_entry_id: journal.id,
        account_code: line.account_code,
        debit: line.debit || 0,
        credit: line.credit || 0,
        description: line.description,
      }));

      const { error: linesError } = await supabase
        .from("journal_entry_lines")
        .insert(linesToInsert);

      if (linesError) {
        // Rollback journal entry
        await supabase.from("journal_entries").delete().eq("id", journal.id);

        return new Response(
          JSON.stringify({ error: `Failed to insert lines: ${linesError.message}` }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          journal_entry_id: journal.id,
          message: "Journal entry created successfully",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'parse' or 'insert_journal'" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  } catch (error) {
    console.error("AI OCR to Accounting error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
