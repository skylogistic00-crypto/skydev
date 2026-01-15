export type OCRFallbackMatch = {
  date?: string | null;
  amount?: number | null;
  description?: string | null;
};

function parseIndoDateToISO(raw: string): string | null {
  const s = raw.trim();

  // dd/mm/yyyy or dd-mm-yyyy
  const m1 = s.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
  if (m1) {
    const dd = Number(m1[1]);
    const mm = Number(m1[2]);
    const yy = Number(m1[3].length === 2 ? `20${m1[3]}` : m1[3]);
    if (!Number.isNaN(dd) && !Number.isNaN(mm) && !Number.isNaN(yy)) {
      const d = new Date(Date.UTC(yy, mm - 1, dd));
      return d.toISOString().slice(0, 10);
    }
  }

  // yyyy-mm-dd
  const m2 = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m2) {
    const yy = Number(m2[1]);
    const mm = Number(m2[2]);
    const dd = Number(m2[3]);
    const d = new Date(Date.UTC(yy, mm - 1, dd));
    return d.toISOString().slice(0, 10);
  }

  const months: Record<string, number> = {
    januari: 1,
    februari: 2,
    maret: 3,
    april: 4,
    mei: 5,
    juni: 6,
    juli: 7,
    agustus: 8,
    september: 9,
    oktober: 10,
    november: 11,
    desember: 12,
  };

  // 15 Januari 2024
  const m3 = s.toLowerCase().match(/(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(\d{4})/);
  if (m3) {
    const dd = Number(m3[1]);
    const mm = months[m3[2]];
    const yy = Number(m3[3]);
    const d = new Date(Date.UTC(yy, mm - 1, dd));
    return d.toISOString().slice(0, 10);
  }

  return null;
}

function parseIdrAmount(raw: string): number | null {
  const cleaned = raw
    .replace(/rp\.?/gi, "")
    .replace(/[^0-9,\.]/g, "")
    .trim();

  if (!cleaned) return null;

  // Common cases:
  // 1) 1.234.567 (ID) -> 1234567
  // 2) 1,234,567 -> 1234567
  // 3) 1234567
  // 4) 1.234.567,89 -> 1234567.89

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let normalized = cleaned;

  if (hasComma && hasDot) {
    // assume dot thousands, comma decimal
    normalized = cleaned.replace(/\./g, "").replace(/,/g, ".");
  } else if (hasComma && !hasDot) {
    // could be thousands OR decimal; for IDR assume thousands separator
    normalized = cleaned.replace(/,/g, "");
  } else if (!hasComma && hasDot) {
    // dot likely thousands separator in IDR
    normalized = cleaned.replace(/\./g, "");
  }

  const n = Number(normalized);
  if (Number.isFinite(n)) return n;
  return null;
}

export function parseFallbackMatchFromOCRText(ocrText: string): OCRFallbackMatch {
  const text = (ocrText || "").replace(/\r/g, "");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Date: try labeled lines first
  const dateLine = lines.find((l) => /(tanggal|date)\b/i.test(l));
  const date = dateLine ? parseIndoDateToISO(dateLine) : null;

  // Amount: find best candidate from labeled total lines
  const totalLine =
    lines.find((l) => /(jumlah\s+yang\s+harus\s+dibayar|grand\s*total|total)\b/i.test(l)) ||
    null;
  const amountFromTotalLine = totalLine ? parseIdrAmount(totalLine) : null;

  // If no labeled total, pick the largest number found (best-effort)
  let amount = amountFromTotalLine;
  if (amount === null) {
    const candidates: number[] = [];
    for (const l of lines) {
      const maybe = parseIdrAmount(l);
      if (typeof maybe === "number") candidates.push(maybe);
    }
    if (candidates.length) amount = Math.max(...candidates);
  }

  // Description: prefer counterparty labels, else first non-generic line
  const counterpartyLine =
    lines.find((l) => /(kepada|kepada\s+yth|to|bill\s*to|dari|from|nama\s+penerima|penerima)\b/i.test(l)) ||
    null;

  const generic = /^(faktur\s+pajak|invoice|kwitansi|receipt|npwp|tanggal|date|nomor|no\.|no:|total|jumlah|ppn|dpp|pph)\b/i;
  const firstMeaningful = lines.find((l) => !generic.test(l)) || null;

  const description = (counterpartyLine || firstMeaningful || "").slice(0, 200) || null;

  return { date, amount, description };
}
