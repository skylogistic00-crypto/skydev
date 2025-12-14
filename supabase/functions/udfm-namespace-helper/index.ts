import { corsHeaders } from "@shared/cors.ts";

/**
 * UDFM Namespace Helper
 * 
 * This Edge Function demonstrates the namespace storage pattern for structured document data.
 * Each document type's data is stored in signUpData.details[document_type].
 * 
 * Usage:
 * - Call this function after OCR processing to merge new document data
 * - Ensures no data loss when scanning multiple documents
 * - Supports multi-document workflows
 */

interface SignUpData {
  details?: {
    [documentType: string]: Record<string, any>;
  };
  [key: string]: any;
}

interface MergeRequest {
  signUpData: SignUpData;
  document_type: string;
  structured_data: Record<string, any>;
}

/**
 * Safely merge new document data into signUpData.details[document_type]
 * without overwriting data from other document types
 */
function mergeDocumentData(
  signUpData: SignUpData,
  document_type: string,
  structured_data: Record<string, any>
): SignUpData {
  // Initialize details object if not exists
  if (!signUpData.details) {
    signUpData.details = {};
  }

  // Initialize namespace for this document type if not exists
  if (!signUpData.details[document_type]) {
    signUpData.details[document_type] = {};
  }

  // Merge structured_data into the namespace
  // Only add fields that don't already exist or are empty
  Object.entries(structured_data).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      const existingValue = signUpData.details![document_type][key];
      
      if (
        existingValue === undefined ||
        existingValue === null ||
        existingValue === ""
      ) {
        signUpData.details![document_type][key] = value;
        console.log(`✔ NAMESPACE [${document_type}]: ${key} = ${JSON.stringify(value).substring(0, 50)}`);
      } else {
        console.log(`⊗ NAMESPACE [${document_type}]: ${key} already exists, preserving existing value`);
      }
    }
  });

  console.log(`✔ Document data merged into details.${document_type}`);
  
  return signUpData;
}

/**
 * Get all document types that have been scanned
 */
function getScannedDocumentTypes(signUpData: SignUpData): string[] {
  if (!signUpData.details) {
    return [];
  }
  return Object.keys(signUpData.details);
}

/**
 * Get data for a specific document type
 */
function getDocumentData(
  signUpData: SignUpData,
  document_type: string
): Record<string, any> | null {
  if (!signUpData.details || !signUpData.details[document_type]) {
    return null;
  }
  return signUpData.details[document_type];
}

/**
 * Check if a document type has been scanned
 */
function hasDocumentType(
  signUpData: SignUpData,
  document_type: string
): boolean {
  return !!(signUpData.details && signUpData.details[document_type]);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const body = await req.json();
    const { action, signUpData, document_type, structured_data } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: "action is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    let result: any;

    switch (action) {
      case "merge":
        // Merge new document data into signUpData
        if (!signUpData || !document_type || !structured_data) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "signUpData, document_type, and structured_data are required for merge action",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
        result = {
          success: true,
          signUpData: mergeDocumentData(signUpData, document_type, structured_data),
          message: `Document data merged into details.${document_type}`,
        };
        break;

      case "get_scanned_types":
        // Get list of all scanned document types
        if (!signUpData) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "signUpData is required for get_scanned_types action",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
        result = {
          success: true,
          document_types: getScannedDocumentTypes(signUpData),
        };
        break;

      case "get_document_data":
        // Get data for a specific document type
        if (!signUpData || !document_type) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "signUpData and document_type are required for get_document_data action",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
        const documentData = getDocumentData(signUpData, document_type);
        result = {
          success: true,
          document_type,
          data: documentData,
          exists: documentData !== null,
        };
        break;

      case "has_document_type":
        // Check if a document type has been scanned
        if (!signUpData || !document_type) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "signUpData and document_type are required for has_document_type action",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
        result = {
          success: true,
          document_type,
          exists: hasDocumentType(signUpData, document_type),
        };
        break;

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: `Unknown action: ${action}. Valid actions: merge, get_scanned_types, get_document_data, has_document_type`,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("UDFM Namespace Helper error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
