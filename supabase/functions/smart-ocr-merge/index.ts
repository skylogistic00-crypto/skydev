import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type OCRData = Record<string, any>;
type SignUpData = Record<string, any>;

interface DocumentNamespaces {
  ktp: string;
  kk: string;
  ijazah: string;
  skck: string;
  cv: string;
}

const namespaces: DocumentNamespaces = {
  ktp: "details.ktp",
  kk: "details.kk",
  ijazah: "details.ijazah",
  skck: "details.skck",
  cv: "details.cv"
};

/**
 * Helper to get or create nested object by path (dot notation)
 */
function getNestedObject(obj: any, path: string, createIfMissing = false): any {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (!(key in current)) {
      if (createIfMissing) {
        current[key] = {};
      } else {
        return undefined;
      }
    }
    current = current[key];
  }
  return current;
}

/**
 * Deep merge OCR data into signUpData with SMART rules:
 * - Do not overwrite existing non-empty fields
 * - Do not insert empty/null/undefined values
 * - Add new fields if they don't exist
 * - Apply optional namespace for document types inside details
 */
function smartMerge(
  signUpData: SignUpData,
  ocrData: OCRData,
  docType: keyof DocumentNamespaces | null = null
): SignUpData {
  const result = { ...signUpData };
  
  // If docType is specified, merge into namespace
  if (docType) {
    const target = getNestedObject(result, namespaces[docType], true);
    
    for (const [key, value] of Object.entries(ocrData)) {
      if (value === null || value === undefined || value === "") {
        // Skip empty values
        continue;
      }
      if (!(key in target) || target[key] === null || target[key] === undefined || target[key] === "") {
        // Add new field or fill empty field
        target[key] = value;
        console.log(`✔ SMART MERGE [${docType}]: ${key} = ${value}`);
      } else {
        console.log(`⊗ SMART MERGE [${docType}]: ${key} already exists, skipping`);
      }
    }
  }
  
  // Also merge into root level (for backward compatibility)
  for (const [key, value] of Object.entries(ocrData)) {
    if (value === null || value === undefined || value === "") {
      // Skip empty values
      continue;
    }
    if (!(key in result) || result[key] === null || result[key] === undefined || result[key] === "") {
      // Add new field or fill empty field
      result[key] = value;
      console.log(`✔ SMART MERGE [root]: ${key} = ${value}`);
    } else {
      console.log(`⊗ SMART MERGE [root]: ${key} already exists, skipping`);
    }
  }

  return result;
}

/**
 * Create Supabase client with service role
 */
function getSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { 
      userId, 
      existingSignUpData, 
      newOcrData, 
      docType 
    } = await req.json();

    console.log("=== SMART OCR MERGE ENGINE ===");
    console.log("User ID:", userId);
    console.log("Document Type:", docType);
    console.log("Existing SignUpData keys:", Object.keys(existingSignUpData || {}));
    console.log("New OCR Data keys:", Object.keys(newOcrData || {}));

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!newOcrData || typeof newOcrData !== "object") {
      return new Response(
        JSON.stringify({ error: "newOcrData must be a valid object" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate docType if provided
    const validDocTypes: (keyof DocumentNamespaces)[] = ["ktp", "kk", "ijazah", "skck", "cv"];
    if (docType && !validDocTypes.includes(docType)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid docType. Must be one of: ${validDocTypes.join(", ")}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Merge OCR data smartly
    const mergedData = smartMerge(
      existingSignUpData || {}, 
      newOcrData, 
      docType as keyof DocumentNamespaces | null
    );

    console.log("=== MERGED DATA ===");
    console.log("Total fields:", Object.keys(mergedData).length);
    console.log("Merged data:", JSON.stringify(mergedData, null, 2));

    // Update users table using Supabase client
    const supabaseClient = getSupabaseClient();
    
    console.log("Executing Supabase update...");

    const { data: updateResult, error: updateError } = await supabaseClient
      .from("users")
      .update({ sign_up_data: mergedData })
      .eq("id", userId);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log("✔ Database update successful");

    return new Response(
      JSON.stringify({
        success: true,
        message: "OCR data merged successfully",
        mergedData,
        docType,
        fieldsAdded: Object.keys(mergedData).length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("SMART OCR MERGE ERROR:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
