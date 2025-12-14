export type DocumentType =
  | "KTP"
  | "KK"
  | "NPWP"
  | "SIM"
  | "INVOICE"
  | "NOTA"
  | "KWITANSI"
  | "SURAT_JALAN"
  | "CASH_DISBURSEMENT";

export interface ParsedOCRData {
  [key: string]: string | number | null;
}

function extractRegex(text: string, regex: RegExp): string {
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function parseKTP(text: string): ParsedOCRData {
  const upper = text.toUpperCase();
  const lines = text.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  console.log("=== PARSE KTP DEBUG ===");
  console.log("Lines:", lines);

  // NIK (16 digits)
  const nikMatch = upper.match(/\b(\d{16})\b/);
  const nik = nikMatch ? nikMatch[1] : "";

  // Nama - lebih fleksibel
  let nama = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineUpper = line.toUpperCase();
    if (lineUpper.includes("NAMA") && !lineUpper.includes("KEWARGANEGARAAN")) {
      const parts = line.split(/NAMA\s*:?\s*/i);
      if (parts.length > 1 && parts[1].trim().length > 2) {
        nama = parts[1].trim();
      } else if (i + 1 < lines.length) {
        nama = lines[i + 1].trim();
      }
      break;
    }
  }

  // Tempat/Tgl Lahir - lebih fleksibel
  let ttl = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineUpper = line.toUpperCase();
    if (lineUpper.includes("TEMPAT") && lineUpper.includes("LAHIR")) {
      const parts = line.split(/TEMPAT.*?LAHIR\s*:?\s*/i);
      if (parts.length > 1) {
        ttl = parts[1].trim();
      } else if (i + 1 < lines.length) {
        ttl = lines[i + 1].trim();
      }
      break;
    }
  }

  // Jenis Kelamin
  let jenisKelamin = "";
  if (upper.includes("LAKI-LAKI") || upper.includes("LAKI LAKI")) jenisKelamin = "LAKI-LAKI";
  else if (upper.includes("PEREMPUAN")) jenisKelamin = "PEREMPUAN";

  // Gol Darah - lebih fleksibel
  let golDarah = "-";
  const golMatch = upper.match(/GOL\.?\s*DARAH\s*:?\s*([A-O]|[-])/);
  if (golMatch) golDarah = golMatch[1].trim() || "-";

  // Alamat - lebih fleksibel
  let alamat = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineUpper = line.toUpperCase();
    if (lineUpper.includes("ALAMAT") && !lineUpper.includes("EMAIL")) {
      const parts = line.split(/ALAMAT\s*:?\s*/i);
      if (parts.length > 1 && parts[1].trim().length > 2) {
        alamat = parts[1].trim();
      } else if (i + 1 < lines.length) {
        alamat = lines[i + 1].trim();
      }
      break;
    }
  }

  // RT/RW - lebih fleksibel
  let rtRw = "";
  const rtMatch = upper.match(/RT\s*\/?\s*RW\s*:?\s*(\d{1,3}\s*\/\s*\d{1,3})/);
  if (rtMatch) {
    rtRw = rtMatch[1].replace(/\s+/g, "");
  } else {
    const rtMatch2 = upper.match(/(\d{1,3})\s*\/\s*(\d{1,3})/);
    if (rtMatch2) rtRw = `${rtMatch2[1]}/${rtMatch2[2]}`;
  }

  // Kel/Desa
  let kelDes = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toUpperCase();
    if (line.includes("KEL") && line.includes("DESA")) {
      const afterKel = line.split(/KEL\.?\/?DESA\s*:?\s*/i)[1];
      if (afterKel) kelDes = afterKel.split(/\s+(?:KECAMATAN|KEC)/)[0].trim();
      else if (i + 1 < lines.length) kelDes = lines[i + 1].trim();
      break;
    }
  }

  // Kecamatan - lebih fleksibel
  let kecamatan = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineUpper = line.toUpperCase();
    if (lineUpper.includes("KECAMATAN") || lineUpper.includes("KEC")) {
      const parts = line.split(/KECAMATAN\s*:?\s*/i);
      if (parts.length > 1 && parts[1].trim().length > 2) {
        kecamatan = parts[1].trim();
      } else if (i + 1 < lines.length) {
        kecamatan = lines[i + 1].trim();
      }
      break;
    }
  }

  // Agama
  let agama = "";
  const agamaMatch = upper.match(/(ISLAM|KRISTEN|KATOLIK|HINDU|BUDHA|KONGHUCU)/);
  if (agamaMatch) agama = agamaMatch[1];

  // Status Perkawinan
  let statusKawin = "";
  if (upper.includes("BELUM KAWIN")) statusKawin = "BELUM KAWIN";
  else if (upper.includes("CERAI HIDUP")) statusKawin = "CERAI HIDUP";
  else if (upper.includes("CERAI MATI")) statusKawin = "CERAI MATI";
  else if (upper.includes("KAWIN")) statusKawin = "KAWIN";

  // Pekerjaan - lebih fleksibel
  let pekerjaan = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineUpper = line.toUpperCase();
    if (lineUpper.includes("PEKERJAAN")) {
      const parts = line.split(/PEKERJAAN\s*:?\s*/i);
      if (parts.length > 1 && parts[1].trim().length > 2) {
        pekerjaan = parts[1].trim();
      } else if (i + 1 < lines.length) {
        pekerjaan = lines[i + 1].trim();
      }
      break;
    }
  }

  // Kewarganegaraan
  let wni = "";
  if (upper.includes("WNI")) wni = "WNI";
  else if (upper.includes("WNA")) wni = "WNA";

  // Berlaku Hingga - lebih fleksibel
  let berlaku = "";
  if (upper.includes("SEUMUR HIDUP")) berlaku = "SEUMUR HIDUP";
  else {
    const berlakuMatch = upper.match(/BERLAKU\s*HINGGA\s*:?\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/);
    if (berlakuMatch) berlaku = berlakuMatch[1];
  }

  return {
    type: "KTP",
    nik,
    nama,
    tempat_tgl_lahir: ttl,
    jenis_kelamin: jenisKelamin,
    golongan_darah: golDarah,
    alamat,
    rt_rw: rtRw,
    kel_des: kelDes,
    kecamatan,
    agama,
    status_perkawinan: statusKawin,
    pekerjaan,
    kewarganegaraan: wni,
    berlaku_hingga: berlaku,
  };
}

function parseNPWP(text: string): ParsedOCRData {
  const lines = text.replace(/\r/g, "").split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const upper = text.toUpperCase();
  
  console.log("=== PARSE NPWP DEBUG ===");
  console.log("Lines:", lines);

  // Extract NPWP number (format: XX.XXX.XXX.X-XXX.XXX)
  let npwp = "";
  const npwpMatch = upper.match(/(\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3})/);
  if (npwpMatch) npwp = npwpMatch[1];

  // Find nama - look for line after NPWP number that is all caps name
  // Skip "DIREKTORAT JENDERAL PAJAK" and similar headers
  let nama = "";
  const skipWords = ["DIREKTORAT", "JENDERAL", "PAJAK", "NPWP", "NIK", "REPUBLIK", "INDONESIA"];
  
  for (const line of lines) {
    const upperLine = line.toUpperCase();
    // Check if line is a name (all caps, no numbers, not a header)
    if (/^[A-Z][A-Z\s]+$/.test(line) && 
        !skipWords.some(w => upperLine.includes(w)) &&
        line.length > 3 && line.length < 50) {
      nama = line;
      break;
    }
  }

  // Find alamat - look for lines containing street address patterns
  let alamatParts: string[] = [];
  let foundAlamat = false;
  
  for (const line of lines) {
    const upperLine = line.toUpperCase();
    // Start collecting after finding street pattern (JL., JALAN, NO.)
    if (!foundAlamat && (upperLine.includes("JL.") || upperLine.includes("JALAN") || upperLine.includes("NO."))) {
      foundAlamat = true;
    }
    
    if (foundAlamat) {
      // Stop at date or registration info
      if (upperLine.includes("TERDAFTAR") || /\d{2}-\d{2}-\d{4}/.test(line)) break;
      // Skip if it's the nama or NPWP
      if (line === nama || /\d{2}\.\d{3}\.\d{3}/.test(line)) continue;
      // Skip headers
      if (skipWords.some(w => upperLine.includes(w))) continue;
      
      alamatParts.push(line);
      if (alamatParts.length >= 3) break;
    }
  }
  
  const alamat = alamatParts.join(", ");

  return { type: "NPWP", npwp, nama, alamat };
}

function parseSIM(text: string): ParsedOCRData {
  const upper = text.toUpperCase();
  return {
    type: "SIM",
    no_sim: extractRegex(upper, /(?:NO\.?\s*SIM|SIM\s*NO\.?)\s*:?\s*(\d+)/i) || (upper.match(/\b(\d{12,14})\b/)?.[1] || ""),
    nama: extractRegex(upper, /NAMA\s*:?\s*([A-Z\s]+?)(?=\s+(?:TEMPAT|ALAMAT|GOL))/i),
    alamat: extractRegex(upper, /ALAMAT\s*:?\s*([A-Z0-9\s.,\/-]+?)(?=\s+(?:GOL|BERLAKU))/i),
    golongan: extractRegex(upper, /GOL(?:ONGAN)?\s*:?\s*([A-Z0-9]+)/i),
    berlaku: extractRegex(upper, /BERLAKU\s*(?:HINGGA)?\s*:?\s*(\d{2}[-/]\d{2}[-/]\d{4})/i),
  };
}

function parseInvoice(text: string): ParsedOCRData {
  return {
    type: "INVOICE",
    invoice_no: extractRegex(text, /(invoice|no\.|no:)\s*([A-Z0-9-]+)/i),
    tanggal: extractRegex(text, /(tanggal|date)[:\s]*([0-9/.-]+)/i),
    amount: extractRegex(text, /(total|amount|grand total)[:\s]*([0-9,.]+)/i),
  };
}

function parseNota(text: string): ParsedOCRData {
  return {
    type: "NOTA",
    total: extractRegex(text, /(total|jumlah)[:\s]*([0-9,.]+)/i),
    item: extractRegex(text, /(barang|produk|item)[:\s]*([A-Z0-9 ,.-]+)/i),
  };
}

function parseKwitansi(text: string): ParsedOCRData {
  return {
    type: "KWITANSI",
    kepada: extractRegex(text, /(telah diterima dari|received from)[:\s]*([A-Z ]+)/i),
    jumlah: extractRegex(text, /(jumlah uang|amount)[:\s]*([0-9,.]+)/i),
  };
}

function parseSuratJalan(text: string): ParsedOCRData {
  return {
    type: "SURAT_JALAN",
    nomor: extractRegex(text, /(surat jalan|no[:\s]*sj)[:\s]*([A-Z0-9-]+)/i),
    tanggal: extractRegex(text, /(tanggal|date)[:\s]*([0-9/.-]+)/i),
    penerima: extractRegex(text, /(kepada|penerima)[:\s]*([A-Z ]+)/i),
  };
}

function parseCashDisbursement(text: string): ParsedOCRData {
  return {
    type: "CASH_DISBURSEMENT",
    no_voucher: extractRegex(text, /(voucher|no)[:\s]*([A-Z0-9-]+)/i),
    amount: extractRegex(text, /(amount|jumlah)[:\s]*([0-9,.]+)/i),
  };
}

function parseKK(text: string): ParsedOCRData {
  const upper = text.toUpperCase();
  const lines = text.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  console.log("=== PARSE KK DEBUG ===");
  console.log("Lines:", lines);

  // Nomor KK (16 digits)
  const kkMatch = upper.match(/\b(\d{16})\b/);
  const nomor_kk = kkMatch ? kkMatch[1] : "";

  // Nama Kepala Keluarga
  let namaKepalaKeluarga = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineUpper = line.toUpperCase();
    if (lineUpper.includes("KEPALA") && lineUpper.includes("KELUARGA")) {
      if (i + 1 < lines.length) {
        namaKepalaKeluarga = lines[i + 1].trim();
      }
      break;
    }
  }

  // Alamat
  let alamat = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineUpper = line.toUpperCase();
    if (lineUpper.includes("ALAMAT") && !lineUpper.includes("EMAIL")) {
      const parts = line.split(/ALAMAT\s*:?\s*/i);
      if (parts.length > 1 && parts[1].trim().length > 2) {
        alamat = parts[1].trim();
      } else if (i + 1 < lines.length) {
        alamat = lines[i + 1].trim();
      }
      break;
    }
  }

  // RT/RW
  let rtRw = "";
  const rtMatch = upper.match(/RT\s*\/?\s*RW\s*:?\s*(\d{1,3}\s*\/\s*\d{1,3})/);
  if (rtMatch) {
    rtRw = rtMatch[1].replace(/\s+/g, "");
  } else {
    const rtMatch2 = upper.match(/(\d{1,3})\s*\/\s*(\d{1,3})/);
    if (rtMatch2) rtRw = `${rtMatch2[1]}/${rtMatch2[2]}`;
  }

  // Kelurahan/Desa
  let kelurahanDesa = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineUpper = line.toUpperCase();
    if (lineUpper.includes("KELURAHAN") || lineUpper.includes("DESA")) {
      const parts = line.split(/(?:KELURAHAN|DESA)\s*:?\s*/i);
      if (parts.length > 1 && parts[1].trim().length > 2) {
        kelurahanDesa = parts[1].trim();
      } else if (i + 1 < lines.length) {
        kelurahanDesa = lines[i + 1].trim();
      }
      break;
    }
  }

  // Kecamatan
  let kecamatan = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineUpper = line.toUpperCase();
    if (lineUpper.includes("KECAMATAN")) {
      const parts = line.split(/KECAMATAN\s*:?\s*/i);
      if (parts.length > 1 && parts[1].trim().length > 2) {
        kecamatan = parts[1].trim();
      } else if (i + 1 < lines.length) {
        kecamatan = lines[i + 1].trim();
      }
      break;
    }
  }

  // Kabupaten/Kota
  let kabupatenKota = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineUpper = line.toUpperCase();
    if (lineUpper.includes("KABUPATEN") || lineUpper.includes("KOTA")) {
      const parts = line.split(/(?:KABUPATEN|KOTA)\s*:?\s*/i);
      if (parts.length > 1 && parts[1].trim().length > 2) {
        kabupatenKota = parts[1].trim();
      } else if (i + 1 < lines.length) {
        kabupatenKota = lines[i + 1].trim();
      }
      break;
    }
  }

  // Provinsi
  let provinsi = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineUpper = line.toUpperCase();
    if (lineUpper.includes("PROVINSI")) {
      const parts = line.split(/PROVINSI\s*:?\s*/i);
      if (parts.length > 1 && parts[1].trim().length > 2) {
        provinsi = parts[1].trim();
      } else if (i + 1 < lines.length) {
        provinsi = lines[i + 1].trim();
      }
      break;
    }
  }

  // Kode Pos
  let kodePos = "";
  const kodePosMatch = upper.match(/KODE\s*POS\s*:?\s*(\d{5})/);
  if (kodePosMatch) kodePos = kodePosMatch[1];

  console.log("Parsed KK Data:", {
    nomor_kk,
    namaKepalaKeluarga,
    alamat,
    rtRw,
    kelurahanDesa,
    kecamatan,
    kabupatenKota,
    provinsi,
    kodePos
  });

  return {
    type: "KK",
    nomor_kk,
    nama_kepala_keluarga: namaKepalaKeluarga,
    alamat,
    rt_rw: rtRw,
    kelurahan_desa: kelurahanDesa,
    kecamatan,
    kabupaten_kota: kabupatenKota,
    provinsi,
    kode_pos: kodePos,
  };
}

export function parseOCR(text: string, type: DocumentType): ParsedOCRData {
  switch (type) {
    case "KTP": return parseKTP(text);
    case "KK": return parseKK(text);
    case "NPWP": return parseNPWP(text);
    case "SIM": return parseSIM(text);
    case "INVOICE": return parseInvoice(text);
    case "NOTA": return parseNota(text);
    case "KWITANSI": return parseKwitansi(text);
    case "SURAT_JALAN": return parseSuratJalan(text);
    case "CASH_DISBURSEMENT": return parseCashDisbursement(text);
    default: return { error: "Unknown document type" };
  }
}
