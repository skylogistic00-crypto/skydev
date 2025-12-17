import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MutationRow {
  tanggal: string;
  keterangan: string;
  debit: number;
  kredit: number;
  saldo: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bankAccountId = formData.get("bank_account_id") as string;
    const bankAccountCode = formData.get("bank_account_code") as string;
    const bankAccountName = formData.get("bank_account_name") as string;
    const userId = formData.get("user_id") as string;

    if (!file || !bankAccountId) {
      return new Response(
        JSON.stringify({ error: "File dan bank account wajib diisi" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileName = file.name;
    const fileType = fileName.split(".").pop()?.toLowerCase() || "";
    const fileSize = file.size;

    let parsedMutations: MutationRow[] = [];

    if (fileType === "csv") {
      const text = await file.text();
      parsedMutations = parseCSV(text);
    } else if (fileType === "xlsx" || fileType === "xls") {
      return new Response(
        JSON.stringify({ error: "Format Excel belum didukung. Gunakan CSV." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (fileType === "pdf") {
      return new Response(
        JSON.stringify({ error: "Format PDF belum didukung. Gunakan CSV." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Format file tidak didukung" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (parsedMutations.length === 0) {
      return new Response(
        JSON.stringify({ error: "Tidak ada data mutasi yang valid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create upload batch
    const { data: uploadBatch, error: uploadErr } = await supabase
      .from("bank_mutation_uploads")
      .insert({
        file_name: fileName,
        file_type: fileType,
        bank_name: bankAccountName,
        bank_account_code: bankAccountCode,
        bank_account_id: bankAccountId,
        bank_account_name: bankAccountName,
        status: "pending",
        total_rows: parsedMutations.length,
        created_by: userId,
        original_filename: fileName, // ✅ WAJIB: original_filename (NOT NULL)
        user_id: userId, // ✅ WAJIB: user_id (NOT NULL)
        file_size: fileSize || 0, // ✅ WAJIB: file_size (NOT NULL)
        mime_type: fileType || "text/csv", // ✅ WAJIB: mime_type (NOT NULL)
      })
      .select()
      .single();

    if (uploadErr) {
      console.error("Upload batch error:", uploadErr);
      return new Response(
        JSON.stringify({ error: "Gagal membuat upload batch" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert mutations
    const mutationsToInsert = parsedMutations.map((row, index) => ({
      upload_id: uploadBatch.id,
      row_number: index + 1,
      mutation_date: row.tanggal,
      description: row.keterangan,
      debit: row.debit,
      credit: row.kredit,
      balance: row.saldo,
      kas_bank: bankAccountCode,
      approval_status: "pending",
      bank_name: bankAccountName, // ✅ WAJIB: bank_name (NOT NULL constraint)
      bank_account_id: bankAccountId,
      bank_account_code: bankAccountCode,
      bank_account_name: bankAccountName,
      transaction_date: row.tanggal, // ✅ WAJIB: transaction_date (NOT NULL constraint)
      transaction_type: row.debit > 0 ? "expense" : "income", // ✅ WAJIB: transaction_type (NOT NULL constraint)
      user_id: userId, // ✅ WAJIB: user_id (NOT NULL constraint)
      created_by: userId,
    }));

    const { data: insertedMutations, error: mutationErr } = await supabase
      .from("bank_mutations")
      .insert(mutationsToInsert)
      .select();

    if (mutationErr) {
      console.error("Mutation insert error:", mutationErr);
      return new Response(
        JSON.stringify({ error: "Gagal menyimpan data mutasi" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        upload_id: uploadBatch.id,
        total_rows: parsedMutations.length,
        mutations: insertedMutations,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseCSV(text: string): MutationRow[] {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const mutations: MutationRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: any = {};

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || "";
    });

    const tanggal = row.tanggal || row.date || row.tgl || "";
    const keterangan = row.keterangan || row.description || row.ket || row.uraian || "";
    const debit = parseNumber(row.debit || row.db || "0");
    const kredit = parseNumber(row.kredit || row.credit || row.cr || row.kr || "0");
    const saldo = parseNumber(row.saldo || row.balance || "0");

    if (tanggal || keterangan || debit > 0 || kredit > 0) {
      mutations.push({
        tanggal: formatDate(tanggal),
        keterangan,
        debit,
        kredit,
        saldo,
      });
    }
  }

  return mutations;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseNumber(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, "");
  return parseFloat(cleaned) || 0;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  
  // Try various date formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        return dateStr;
      } else {
        return `${match[3]}-${match[2]}-${match[1]}`;
      }
    }
  }

  return new Date().toISOString().split("T")[0];
}
