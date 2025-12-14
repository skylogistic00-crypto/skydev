import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface WarehouseScanData {
  barcode?: string;
  ocr_text?: string;
  scan_type: "barcode" | "ocr";
  form_type: "grn" | "mutation" | "outbound" | "adjustment";
}

interface WarehouseAutofillData {
  sku: string | null;
  item_name: string | null;
  quantity: number | null;
  batch_number: string | null;
  expired_date: string | null;
  location: string | null;
  supplier: string | null;
  unit: string | null;
  is_new_item: boolean;
}

async function runSQLQuery(query: string): Promise<any> {
  const { data, error } = await supabase.rpc('execute_sql', { query_text: query });
  
  if (error) {
    throw new Error(`SQL query failed: ${error.message}`);
  }

  return data;
}

function generateSKU(prefix: string = "WH"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function extractDataFromOCR(text: string): Partial<WarehouseAutofillData> {
  const result: Partial<WarehouseAutofillData> = {};

  // Extract SKU patterns
  const skuPatterns = [
    /(?:SKU|Kode|Code)[:\s]*([A-Za-z0-9\-]+)/gi,
    /(?:Item No|Part No)[:\s]*([A-Za-z0-9\-]+)/gi,
  ];
  for (const pattern of skuPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.sku = match[0].replace(/(?:SKU|Kode|Code|Item No|Part No)[:\s]*/gi, "").trim();
      break;
    }
  }

  // Extract item name
  const namePatterns = [
    /(?:Nama Barang|Item Name|Product|Barang)[:\s]*([^\n]+)/gi,
    /(?:Description|Deskripsi)[:\s]*([^\n]+)/gi,
  ];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.item_name = match[0].replace(/(?:Nama Barang|Item Name|Product|Barang|Description|Deskripsi)[:\s]*/gi, "").trim().substring(0, 100);
      break;
    }
  }

  // Extract quantity
  const qtyPatterns = [
    /(?:Qty|Quantity|Jumlah|Kuantitas)[:\s]*(\d+)/gi,
    /(\d+)\s*(?:pcs|unit|buah|box|karton)/gi,
  ];
  for (const pattern of qtyPatterns) {
    const match = text.match(pattern);
    if (match) {
      const numStr = match[0].replace(/[^\d]/g, "");
      const num = parseInt(numStr);
      if (!isNaN(num) && num > 0) {
        result.quantity = num;
        break;
      }
    }
  }

  // Extract batch number
  const batchPatterns = [
    /(?:Batch|Lot|No Batch)[:\s#]*([A-Za-z0-9\-\/]+)/gi,
  ];
  for (const pattern of batchPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.batch_number = match[0].replace(/(?:Batch|Lot|No Batch)[:\s#]*/gi, "").trim();
      break;
    }
  }

  // Extract expired date
  const expPatterns = [
    /(?:Exp|Expired|Kadaluarsa|Best Before|BB)[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/gi,
    /(?:Exp|Expired|Kadaluarsa)[:\s]*(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/gi,
  ];
  for (const pattern of expPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.expired_date = match[0].replace(/(?:Exp|Expired|Kadaluarsa|Best Before|BB)[:\s]*/gi, "").trim();
      break;
    }
  }

  // Extract location
  const locPatterns = [
    /(?:Lokasi|Location|Rak|Rack|Zone|Area)[:\s]*([A-Za-z0-9\-\/]+)/gi,
  ];
  for (const pattern of locPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.location = match[0].replace(/(?:Lokasi|Location|Rak|Rack|Zone|Area)[:\s]*/gi, "").trim();
      break;
    }
  }

  // Extract supplier
  const supplierPatterns = [
    /(?:Supplier|Vendor|From|Dari|PT\.|CV\.)[:\s]*([A-Za-z\s\.]+)/gi,
  ];
  for (const pattern of supplierPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.supplier = match[0].replace(/(?:Supplier|Vendor|From|Dari)[:\s]*/gi, "").trim().substring(0, 100);
      break;
    }
  }

  // Extract unit
  const unitPatterns = [
    /(?:Unit|Satuan)[:\s]*([A-Za-z]+)/gi,
    /\d+\s*(pcs|unit|buah|box|karton|kg|gram|liter|ml)/gi,
  ];
  for (const pattern of unitPatterns) {
    const match = text.match(pattern);
    if (match) {
      const unitMatch = match[0].match(/(pcs|unit|buah|box|karton|kg|gram|liter|ml)/i);
      if (unitMatch) {
        result.unit = unitMatch[1].toLowerCase();
        break;
      }
    }
  }

  return result;
}

async function processBarcodeScan(barcode: string): Promise<WarehouseAutofillData> {
  // Check if barcode exists in stock table
  const checkQuery = `SELECT id, sku, item_name, item_quantity, unit, batch_number, expired_date, rack_location, supplier_id FROM stock WHERE barcode = '${barcode.replace(/'/g, "''")}' OR sku = '${barcode.replace(/'/g, "''")}' LIMIT 1;`;
  
  let existingItem = null;
  try {
    const result = await runSQLQuery(checkQuery);
    if (result && Array.isArray(result) && result.length > 0) {
      existingItem = result[0];
    }
  } catch (err) {
    console.error("Error checking existing item:", err);
  }

  if (existingItem) {
    // Get supplier name if exists
    let supplierName = null;
    if (existingItem.supplier_id) {
      try {
        const supplierQuery = `SELECT supplier_name FROM suppliers WHERE id = '${existingItem.supplier_id}' LIMIT 1;`;
        const supplierResult = await runSQLQuery(supplierQuery);
        if (supplierResult && Array.isArray(supplierResult) && supplierResult.length > 0) {
          supplierName = supplierResult[0].supplier_name;
        }
      } catch (err) {
        console.error("Error fetching supplier:", err);
      }
    }

    return {
      sku: existingItem.sku,
      item_name: existingItem.item_name,
      quantity: existingItem.item_quantity || 1,
      batch_number: existingItem.batch_number,
      expired_date: existingItem.expired_date,
      location: existingItem.rack_location,
      supplier: supplierName,
      unit: existingItem.unit,
      is_new_item: false,
    };
  }

  // Item not found - create new item
  const newSKU = generateSKU("WH");
  const newItemName = `Produk Baru (${barcode.substring(0, 15)})`;

  try {
    const insertQuery = `INSERT INTO stock (sku, barcode, item_name, item_quantity, status) VALUES ('${newSKU}', '${barcode.replace(/'/g, "''")}', '${newItemName}', 0, 'draft') RETURNING id, sku, item_name;`;
    await runSQLQuery(insertQuery);
  } catch (err) {
    console.error("Error creating new item:", err);
  }

  return {
    sku: newSKU,
    item_name: newItemName,
    quantity: 1,
    batch_number: null,
    expired_date: null,
    location: null,
    supplier: null,
    unit: "pcs",
    is_new_item: true,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!PICA_SECRET_KEY || !PICA_SUPABASE_CONNECTION_KEY || !SUPABASE_PROJECT_REF) {
      throw new Error("Missing required environment variables");
    }

    const body: WarehouseScanData = await req.json();
    const { barcode, ocr_text, scan_type, form_type } = body;

    let autofillData: WarehouseAutofillData;

    if (scan_type === "barcode" && barcode) {
      autofillData = await processBarcodeScan(barcode);

      // Save to barcode_results
      try {
        const saveQuery = `INSERT INTO barcode_results (code_text, code_format, sku, product_name, autofill_status) VALUES ('${barcode.replace(/'/g, "''")}', 'WAREHOUSE_SCAN', '${autofillData.sku || ""}', '${(autofillData.item_name || "").replace(/'/g, "''")}', 'completed');`;
        await runSQLQuery(saveQuery);
      } catch (err) {
        console.error("Error saving barcode result:", err);
      }
    } else if (scan_type === "ocr" && ocr_text) {
      const extractedData = extractDataFromOCR(ocr_text);
      
      // If SKU found in OCR, try to find existing item
      if (extractedData.sku) {
        const checkQuery = `SELECT id, sku, item_name, item_quantity, unit, batch_number, expired_date, rack_location FROM stock WHERE sku = '${extractedData.sku.replace(/'/g, "''")}' LIMIT 1;`;
        try {
          const result = await runSQLQuery(checkQuery);
          if (result && Array.isArray(result) && result.length > 0) {
            const existingItem = result[0];
            autofillData = {
              sku: existingItem.sku || extractedData.sku,
              item_name: existingItem.item_name || extractedData.item_name || null,
              quantity: extractedData.quantity || existingItem.item_quantity || 1,
              batch_number: extractedData.batch_number || existingItem.batch_number || null,
              expired_date: extractedData.expired_date || existingItem.expired_date || null,
              location: extractedData.location || existingItem.rack_location || null,
              supplier: extractedData.supplier || null,
              unit: extractedData.unit || existingItem.unit || "pcs",
              is_new_item: false,
            };
          } else {
            autofillData = {
              sku: extractedData.sku || null,
              item_name: extractedData.item_name || null,
              quantity: extractedData.quantity || 1,
              batch_number: extractedData.batch_number || null,
              expired_date: extractedData.expired_date || null,
              location: extractedData.location || null,
              supplier: extractedData.supplier || null,
              unit: extractedData.unit || "pcs",
              is_new_item: true,
            };
          }
        } catch (err) {
          autofillData = {
            sku: extractedData.sku || null,
            item_name: extractedData.item_name || null,
            quantity: extractedData.quantity || 1,
            batch_number: extractedData.batch_number || null,
            expired_date: extractedData.expired_date || null,
            location: extractedData.location || null,
            supplier: extractedData.supplier || null,
            unit: extractedData.unit || "pcs",
            is_new_item: true,
          };
        }
      } else {
        autofillData = {
          sku: null,
          item_name: extractedData.item_name || null,
          quantity: extractedData.quantity || 1,
          batch_number: extractedData.batch_number || null,
          expired_date: extractedData.expired_date || null,
          location: extractedData.location || null,
          supplier: extractedData.supplier || null,
          unit: extractedData.unit || "pcs",
          is_new_item: true,
        };
      }

      // Save to ocr_results
      try {
        const saveQuery = `INSERT INTO ocr_results (extracted_text, autofill_status) VALUES ('${ocr_text.replace(/'/g, "''").substring(0, 5000)}', 'completed');`;
        await runSQLQuery(saveQuery);
      } catch (err) {
        console.error("Error saving OCR result:", err);
      }
    } else {
      throw new Error("Invalid scan data");
    }

    return new Response(
      JSON.stringify({
        success: true,
        form_type,
        scan_type,
        autofill: autofillData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Warehouse scan error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
