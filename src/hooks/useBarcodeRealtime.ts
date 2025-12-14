import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface BarcodeResult {
  id: string;
  code_text: string;
  code_format: string;
  scanned_at: string;
  product_id: string | null;
  sku: string | null;
  product_name: string | null;
  supplier: string | null;
  base_price: number | null;
  rack_location: string | null;
  is_qris: boolean;
  qris_nominal: number | null;
  qris_merchant: string | null;
  qris_invoice_qr: string | null;
  autofill_status: string;
  created_at: string;
  updated_at: string;
}

export interface BarcodeAutofillData {
  sku: string | null;
  product_name: string | null;
  supplier: string | null;
  base_price: number | null;
  rack_location: string | null;
  is_qris: boolean;
  qris_nominal: number | null;
  qris_merchant: string | null;
}

interface UseBarcodeRealtimeOptions {
  onNewResult?: (result: BarcodeResult) => void;
  onAutofill?: (data: BarcodeAutofillData) => void;
}

// Parse QRIS QR code data
function parseQRIS(codeText: string): { isQris: boolean; nominal: number | null; merchant: string | null } {
  // QRIS format typically starts with "00020101" and contains specific tags
  const isQris = codeText.startsWith("00020101") || codeText.includes("ID.CO.QRIS");
  
  if (!isQris) {
    return { isQris: false, nominal: null, merchant: null };
  }

  let nominal: number | null = null;
  let merchant: string | null = null;

  // Extract nominal (tag 54)
  const nominalMatch = codeText.match(/54(\d{2})(\d+)/);
  if (nominalMatch) {
    const length = parseInt(nominalMatch[1]);
    nominal = parseFloat(nominalMatch[2].substring(0, length));
  }

  // Extract merchant name (tag 59)
  const merchantMatch = codeText.match(/59(\d{2})([A-Za-z0-9\s]+)/);
  if (merchantMatch) {
    const length = parseInt(merchantMatch[1]);
    merchant = merchantMatch[2].substring(0, length).trim();
  }

  return { isQris, nominal, merchant };
}

export function useBarcodeRealtime(options: UseBarcodeRealtimeOptions = {}) {
  const [latestResult, setLatestResult] = useState<BarcodeResult | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const startListening = useCallback(() => {
    if (channel) return;

    const newChannel = supabase
      .channel("barcode_results_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "barcode_results",
        },
        (payload) => {
          const newResult = payload.new as BarcodeResult;
          setLatestResult(newResult);

          if (options.onNewResult) {
            options.onNewResult(newResult);
          }

          if (options.onAutofill && newResult.autofill_status === "completed") {
            const autofillData: BarcodeAutofillData = {
              sku: newResult.sku,
              product_name: newResult.product_name,
              supplier: newResult.supplier,
              base_price: newResult.base_price,
              rack_location: newResult.rack_location,
              is_qris: newResult.is_qris,
              qris_nominal: newResult.qris_nominal,
              qris_merchant: newResult.qris_merchant,
            };
            options.onAutofill(autofillData);
          }
        }
      )
      .subscribe((status) => {
        setIsListening(status === "SUBSCRIBED");
      });

    setChannel(newChannel);
  }, [channel, options]);

  const stopListening = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel);
      setChannel(null);
      setIsListening(false);
    }
  }, [channel]);

  useEffect(() => {
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [channel]);

  return {
    latestResult,
    isListening,
    startListening,
    stopListening,
  };
}

// Function to save barcode and process autofill
export async function saveBarcodeAndProcess(
  codeText: string,
  codeFormat: string
): Promise<{
  success: boolean;
  data?: BarcodeResult;
  autofill?: BarcodeAutofillData;
  error?: string;
}> {
  try {
    // Check if QRIS
    const qrisData = parseQRIS(codeText);

    // First, check if barcode matches existing product in stock table
    const { data: existingProduct, error: productError } = await supabase
      .from("stock")
      .select("id, sku, item_name, supplier_id, base_price, rack_location")
      .or(`barcode.eq.${codeText},sku.eq.${codeText}`)
      .maybeSingle();

    let autofillData: BarcodeAutofillData = {
      sku: null,
      product_name: null,
      supplier: null,
      base_price: null,
      rack_location: null,
      is_qris: qrisData.isQris,
      qris_nominal: qrisData.nominal,
      qris_merchant: qrisData.merchant,
    };

    let productId: string | null = null;

    if (existingProduct) {
      // Product found - autofill data
      autofillData.sku = existingProduct.sku;
      autofillData.product_name = existingProduct.item_name;
      autofillData.base_price = existingProduct.base_price;
      autofillData.rack_location = existingProduct.rack_location;
      productId = existingProduct.id;

      // Get supplier name if supplier_id exists
      if (existingProduct.supplier_id) {
        const { data: supplierData } = await supabase
          .from("suppliers")
          .select("supplier_name")
          .eq("id", existingProduct.supplier_id)
          .single();
        
        if (supplierData) {
          autofillData.supplier = supplierData.supplier_name;
        }
      }
    } else if (!qrisData.isQris) {
      // New barcode - create new product item
      const newSku = `SKU-${Date.now()}`;
      const { data: newProduct, error: createError } = await supabase
        .from("stock")
        .insert([
          {
            barcode: codeText,
            sku: newSku,
            item_name: `Produk Baru (${codeText.substring(0, 10)}...)`,
            item_quantity: 0,
            status: "draft",
          },
        ])
        .select()
        .single();

      if (newProduct) {
        autofillData.sku = newProduct.sku;
        autofillData.product_name = newProduct.item_name;
        productId = newProduct.id;
      }
    }

    // Save to barcode_results table
    const { data: barcodeResult, error: saveError } = await supabase
      .from("barcode_results")
      .insert([
        {
          code_text: codeText,
          code_format: codeFormat,
          product_id: productId,
          sku: autofillData.sku,
          product_name: autofillData.product_name,
          supplier: autofillData.supplier,
          base_price: autofillData.base_price,
          rack_location: autofillData.rack_location,
          is_qris: qrisData.isQris,
          qris_nominal: qrisData.nominal,
          qris_merchant: qrisData.merchant,
          autofill_status: "completed",
        },
      ])
      .select()
      .single();

    if (saveError) {
      throw new Error(saveError.message);
    }

    return {
      success: true,
      data: barcodeResult,
      autofill: autofillData,
    };
  } catch (err: any) {
    console.error("Barcode save error:", err);
    return {
      success: false,
      error: err.message,
    };
  }
}

// Generate QRIS invoice QR code
export function generateQRISInvoice(
  nominal: number,
  merchant: string,
  invoiceNumber: string
): string {
  // Simple QRIS-like format for invoice
  const timestamp = Date.now();
  const invoiceData = {
    type: "INVOICE",
    invoice_no: invoiceNumber,
    merchant: merchant,
    amount: nominal,
    timestamp: timestamp,
    currency: "IDR",
  };
  
  return JSON.stringify(invoiceData);
}
