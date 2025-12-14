// Finance OCR Parser - Helper functions for parsing OCR text

export interface BreakdownItem {
  qty: number;
  price: number;
  subtotal: number;
  description?: string;
}

/**
 * Extract receipt/invoice number from OCR text
 * Looks for patterns like: No: 123456, Invoice: ABC123, etc.
 */
export function extractReceiptNumber(text: string): string | null {
  // Pattern for receipt/invoice numbers (6-20 digits or alphanumeric codes)
  const patterns = [
    /(?:NO\.?|NOTA|INVOICE|RECEIPT|STRUK|FAKTUR)[:\s#]*([A-Z0-9\-\/]{6,20})/i,
    /(?:NO\.?\s*TRANSAKSI|TRANSACTION\s*NO)[:\s#]*([A-Z0-9\-\/]{6,20})/i,
    /(?:REF|REFERENCE)[:\s#]*([A-Z0-9\-\/]{6,20})/i,
    /\b([0-9]{6,20})\b/, // Fallback: any 6-20 digit number
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return null;
}

/**
 * Extract merchant name from OCR text
 * Looks for first two consecutive words starting with uppercase letters
 */
export function extractMerchant(text: string): string | null {
  // Look for company names - typically uppercase words
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  
  // Try to find merchant in first few lines (usually at top of receipt)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    // Match two or more consecutive capitalized words
    const match = line.match(/\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)\b/);
    if (match) return match[1];
    
    // Or single uppercase word that looks like a company name
    const singleMatch = line.match(/^([A-Z][A-Z]+(?:\s+[A-Z]+)*)/);
    if (singleMatch && singleMatch[1].length > 3) return singleMatch[1];
  }
  
  // Fallback: look for PT, CV, or common business prefixes
  const businessMatch = text.match(/(?:PT|CV|UD|TB|TOKO)\s+([A-Z][A-Za-z\s]+)/i);
  if (businessMatch) return businessMatch[0];
  
  return null;
}

/**
 * Extract date from OCR text
 * Supports formats: dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy
 */
export function extractDate(text: string): string | null {
  // Try various date formats
  const patterns = [
    /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/, // dd/mm/yyyy or dd-mm-yyyy
    /(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})/, // yyyy/mm/dd
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i, // 1 Jan 2024
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Check if it's yyyy-mm-dd format
      if (match[1].length === 4) {
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      }
      // Check if it's month name format
      if (isNaN(parseInt(match[2]))) {
        const months: Record<string, string> = {
          'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
          'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
          'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        };
        const month = months[match[2].toLowerCase().substring(0, 3)];
        return `${match[3]}-${month}-${match[1].padStart(2, '0')}`;
      }
      // Standard dd/mm/yyyy
      const [, dd, mm, yyyy] = match;
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
  }
  
  return null;
}

/**
 * Extract category based on keywords in text
 */
export function extractCategory(text: string): string {
  const upperText = text.toUpperCase();
  
  const categoryKeywords: Record<string, string[]> = {
    'Travel': ['TIKET', 'TICKET', 'PESAWAT', 'KERETA', 'BUS', 'TAXI', 'GRAB', 'GOJEK', 'HOTEL', 'PENGINAPAN', 'TRAVEL', 'AIRPORT'],
    'Food': ['RESTO', 'RESTAURANT', 'CAFE', 'COFFEE', 'MAKAN', 'FOOD', 'BEVERAGE', 'MINUMAN', 'MAKANAN', 'WARUNG', 'KANTIN'],
    'Office Supplies': ['ATK', 'ALAT TULIS', 'KERTAS', 'PAPER', 'TINTA', 'INK', 'PRINTER', 'STATIONERY', 'OFFICE'],
    'Entertainment': ['BIOSKOP', 'CINEMA', 'MOVIE', 'GAME', 'HIBURAN', 'ENTERTAINMENT', 'KARAOKE'],
    'Utilities': ['LISTRIK', 'PLN', 'AIR', 'PDAM', 'TELEPON', 'INTERNET', 'WIFI', 'GAS', 'UTILITY'],
    'Transportation': ['BENSIN', 'FUEL', 'PERTAMINA', 'SHELL', 'PARKIR', 'PARKING', 'TOL', 'TOLL'],
    'Medical': ['APOTEK', 'PHARMACY', 'OBAT', 'MEDICINE', 'RUMAH SAKIT', 'HOSPITAL', 'KLINIK', 'CLINIC'],
    'Shopping': ['SUPERMARKET', 'MINIMARKET', 'INDOMARET', 'ALFAMART', 'HYPERMART', 'CARREFOUR', 'MALL'],
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (upperText.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'Miscellaneous';
}

/**
 * Extract breakdown items from OCR text
 * Looks for lines with qty, price, subtotal pattern
 */
export function extractBreakdown(text: string): BreakdownItem[] {
  const lines = text.split('\n');
  const items: BreakdownItem[] = [];
  
  // Pattern: qty price subtotal or description qty price
  const patterns = [
    /(\d+)\s*[xX@]?\s*([\d,.]+)\s*=?\s*([\d,.]+)/, // qty x price = subtotal
    /([\d,.]+)\s*[xX]\s*(\d+)\s*=?\s*([\d,.]+)/, // price x qty = subtotal
    /(.+?)\s+(\d+)\s+([\d,.]+)\s+([\d,.]+)/, // description qty price subtotal
  ];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Skip header/footer lines
    if (/total|subtotal|ppn|tax|diskon|discount|tunai|cash|kembalian|change/i.test(trimmedLine)) {
      continue;
    }
    
    for (const pattern of patterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        let qty: number, price: number, subtotal: number, description: string | undefined;
        
        if (match.length === 5) {
          // Pattern with description
          description = match[1].trim();
          qty = parseInt(match[2], 10);
          price = parseFloat(match[3].replace(/[,.]/g, ''));
          subtotal = parseFloat(match[4].replace(/[,.]/g, ''));
        } else {
          qty = parseInt(match[1].replace(/[,.]/g, ''), 10);
          price = parseFloat(match[2].replace(/[,.]/g, ''));
          subtotal = parseFloat(match[3].replace(/[,.]/g, ''));
          
          // Try to extract description from the beginning of line
          const descMatch = trimmedLine.match(/^([A-Za-z][A-Za-z\s]+)/);
          if (descMatch) description = descMatch[1].trim();
        }
        
        if (!isNaN(qty) && !isNaN(price) && !isNaN(subtotal) && qty > 0) {
          items.push({ qty, price, subtotal, description });
          break;
        }
      }
    }
  }
  
  return items;
}

/**
 * Calculate PPN (10% tax) from total amount
 */
export function extractPPN(total: number): number {
  return parseFloat((total * 0.1).toFixed(2));
}

/**
 * Extract total amount from OCR text
 * Strategy: Find the largest reasonable amount, prioritizing amounts near "Total" keyword
 */
export function extractTotal(text: string): number | null {
  const upperText = text.toUpperCase();
  const lines = text.split('\n');
  
  // Strategy 1: Look for explicit total patterns
  const totalPatterns = [
    /GRAND\s*TOTAL\s*:?\s*(?:RP\.?|IDR)?\s*([\d.,]+)/i,
    /TOTAL\s*(?:BAYAR|PEMBAYARAN|BELANJA)?\s*:?\s*(?:RP\.?|IDR)?\s*([\d.,]+)/i,
    /JUMLAH\s*(?:TOTAL)?\s*:?\s*(?:RP\.?|IDR)?\s*([\d.,]+)/i,
    /SUBTOTAL\s*:?\s*(?:RP\.?|IDR)?\s*([\d.,]+)/i,
  ];
  
  for (const pattern of totalPatterns) {
    const match = upperText.match(pattern);
    if (match) {
      const amount = parseAmount(match[1]);
      if (amount && amount > 1000) {
        console.log("📊 OCR Total found via pattern:", amount);
        return amount;
      }
    }
  }
  
  // Strategy 2: Find the line after "Total" keyword
  let foundTotalKeyword = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();
    
    if (line.includes('TOTAL') && !line.includes('SUBTOTAL')) {
      foundTotalKeyword = true;
      
      // Check if total is on the same line
      const sameLineMatch = line.match(/TOTAL\s*:?\s*(?:RP\.?|IDR)?\s*([\d.,]+)/i);
      if (sameLineMatch) {
        const amount = parseAmount(sameLineMatch[1]);
        if (amount && amount > 1000) {
          console.log("📊 OCR Total found on same line:", amount);
          return amount;
        }
      }
      
      // Check next few lines for the amount
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j].trim();
        const amount = parseAmount(nextLine);
        if (amount && amount > 10000) {
          console.log("📊 OCR Total found after Total keyword:", amount, "from line:", nextLine);
          return amount;
        }
      }
    }
  }
  
  // Strategy 3: Find the largest amount in the text (likely the total)
  const allAmounts: number[] = [];
  const amountPattern = /(?:RP\.?|IDR)?\s*([\d]{1,3}(?:[.,][\d]{3})+|[\d]{4,})/gi;
  let match;
  
  while ((match = amountPattern.exec(text)) !== null) {
    const amount = parseAmount(match[1]);
    if (amount && amount > 1000 && amount < 1000000000) {
      allAmounts.push(amount);
    }
  }
  
  if (allAmounts.length > 0) {
    // Get the largest amount (most likely the total)
    const maxAmount = Math.max(...allAmounts);
    console.log("📊 OCR Total found as largest amount:", maxAmount, "from amounts:", allAmounts);
    return maxAmount;
  }
  
  return null;
}

/**
 * Parse amount string to number, handling various formats
 */
function parseAmount(str: string): number | null {
  if (!str) return null;
  
  // Remove non-numeric characters except dots and commas
  let cleaned = str.replace(/[^\d.,]/g, '').trim();
  
  if (!cleaned) return null;
  
  // Handle Indonesian format: 953,000 or 953.000 (thousand separator)
  // vs decimal format: 953.50
  
  // If has comma followed by 3 digits, it's thousand separator
  if (/,\d{3}/.test(cleaned)) {
    cleaned = cleaned.replace(/,/g, '');
  }
  // If has dot followed by 3 digits, it's thousand separator
  else if (/\.\d{3}/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '');
  }
  // If has comma followed by 1-2 digits at end, it's decimal
  else if (/,\d{1,2}$/.test(cleaned)) {
    cleaned = cleaned.replace(',', '.');
  }
  
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? null : amount;
}

/**
 * Parse all fields from OCR text
 */
export function parseOCRText(text: string): {
  merchant: string | null;
  date: string | null;
  category: string;
  total: number | null;
  ppn: number;
  breakdown: BreakdownItem[];
} {
  const merchant = extractMerchant(text);
  const date = extractDate(text);
  const category = extractCategory(text);
  const total = extractTotal(text);
  const ppn = total ? extractPPN(total) : 0;
  const breakdown = extractBreakdown(text);
  
  return { merchant, date, category, total, ppn, breakdown };
}
