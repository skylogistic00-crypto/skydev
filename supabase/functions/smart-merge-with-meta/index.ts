import { corsHeaders } from "@shared/cors.ts";

type SourceType = "user" | "ocr";
type DocumentType = string;

interface FieldMeta {
  source: SourceType;
  document_type: DocumentType;
  confidence: number;
  last_updated_at: string;
}

interface MetaMap {
  [fieldName: string]: FieldMeta;
}

interface DataMap {
  [fieldName: string]: any;
}

/**
 * Smart merge function for user data and metadata with OCR data and metadata.
 * 
 * RULES:
 * 1. If source = "user" → NEVER overwrite
 * 2. If new value is empty/null/"" → ignore
 * 3. If no old value → use new value
 * 4. If old value from OCR → only overwrite if new confidence > old confidence
 */
function smartMergeWithMeta(
  oldData: DataMap,
  oldMeta: MetaMap,
  newData: DataMap,
  newMeta: MetaMap,
  documentType: DocumentType
): { mergedData: DataMap; mergedMeta: MetaMap } {
  const mergedData: DataMap = { ...oldData };
  const mergedMeta: MetaMap = { ...oldMeta };

  console.log(`Smart Merge: Processing ${Object.keys(newData).length} fields for ${documentType}`);

  for (const field in newData) {
    const newValue = newData[field];
    const newFieldMeta = newMeta[field];

    // Rule 2: Ignore new values that are empty, null, or empty string
    if (newValue === null || newValue === "" || newValue === undefined) {
      console.log(`⊗ SKIP [${field}]: Empty/null value`);
      continue;
    }

    const oldValue = oldData[field];
    const oldFieldMeta = oldMeta[field];

    // Rule 1: If old source is "user", never overwrite
    if (oldFieldMeta?.source === "user") {
      console.log(`⊗ PROTECTED [${field}]: User-edited field, preserving value`);
      continue;
    }

    // Rule 3: If no old value, accept new value
    if (oldValue === undefined || oldValue === null || oldValue === "") {
      mergedData[field] = newValue;
      mergedMeta[field] = {
        source: newFieldMeta?.source || "ocr",
        document_type: documentType,
        confidence: newFieldMeta?.confidence ?? 1,
        last_updated_at: new Date().toISOString(),
      };
      console.log(`✔ NEW [${field}]: Added with confidence ${newFieldMeta?.confidence ?? 1}`);
      continue;
    }

    // Rule 4: If old source is OCR, overwrite only if new confidence > old confidence
    if (oldFieldMeta?.source === "ocr") {
      const oldConfidence = oldFieldMeta.confidence ?? 0;
      const newConfidence = newFieldMeta?.confidence ?? 0;

      if (newConfidence > oldConfidence) {
        mergedData[field] = newValue;
        mergedMeta[field] = {
          source: newFieldMeta?.source || "ocr",
          document_type: documentType,
          confidence: newConfidence,
          last_updated_at: new Date().toISOString(),
        };
        console.log(`✔ UPGRADE [${field}]: Confidence ${oldConfidence} → ${newConfidence}`);
      } else {
        console.log(`⊗ KEEP [${field}]: Old confidence ${oldConfidence} >= new ${newConfidence}`);
      }
    }
  }

  console.log(`Smart Merge Complete: ${Object.keys(mergedData).length} total fields`);

  return { mergedData, mergedMeta };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { oldData, oldMeta, newData, newMeta, documentType } = await req.json();

    if (!newData || !documentType) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "newData and documentType are required" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("Smart Merge With Meta: Starting merge process");
    console.log(`Document Type: ${documentType}`);
    console.log(`Old Data Fields: ${Object.keys(oldData || {}).length}`);
    console.log(`New Data Fields: ${Object.keys(newData).length}`);

    const { mergedData, mergedMeta } = smartMergeWithMeta(
      oldData || {},
      oldMeta || {},
      newData,
      newMeta || {},
      documentType
    );

    const stats = {
      totalFields: Object.keys(mergedData).length,
      newFields: Object.keys(mergedData).filter(k => !(k in (oldData || {}))).length,
      updatedFields: Object.keys(mergedData).filter(k => 
        k in (oldData || {}) && mergedData[k] !== oldData[k]
      ).length,
      protectedFields: Object.keys(oldMeta || {}).filter(k => 
        oldMeta[k]?.source === "user"
      ).length,
    };

    console.log("Smart Merge Stats:", stats);

    return new Response(
      JSON.stringify({
        success: true,
        mergedData,
        mergedMeta,
        stats,
        documentType,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Smart Merge With Meta error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
