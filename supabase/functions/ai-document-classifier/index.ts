import { corsHeaders } from "@shared/cors.ts";

interface DocumentClassificationResult {
  jenis_dokumen: string;
  uncertain: boolean;
  confidence: number;
  extracted_data: Record<string, any>;
  raw_text?: string;
}

const EXTRACTION_SCHEMAS: Record<string, string> = {
  KTP: `{
  "jenis_dokumen": "KTP",
  "nik": "",
  "nama": "",
  "tempat_lahir": "",
  "tanggal_lahir": "",
  "jenis_kelamin": "",
  "golongan_darah": "",
  "alamat": "",
  "rt_rw": "",
  "kelurahan_desa": "",
  "kecamatan": "",
  "agama": "",
  "status_perkawinan": "",
  "pekerjaan": "",
  "kewarganegaraan": "",
  "berlaku_hingga": "",
  "kota_pembuatan": "",
  "tanggal_pembuatan": ""
}`,
  KK: `{
  "jenis_dokumen": "KK",
  "nomor_kk": "",
  "nama_kepala_keluarga": "",
  "alamat": "",
  "rt_rw": "",
  "kelurahan_desa": "",
  "kecamatan": "",
  "kabupaten_kota": "",
  "provinsi": "",
  "kode_pos": "",
  "tanggal_dikeluarkan": "",
  "anggota_keluarga": [
    {
      "nama_lengkap": "",
      "nik": "",
      "jenis_kelamin": "",
      "tempat_lahir": "",
      "tanggal_lahir": "",
      "agama": "",
      "pendidikan": "",
      "jenis_pekerjaan": "",
      "golongan_darah": "",
      "status_perkawinan": "",
      "tanggal_perkawinan": "",
      "status_hubungan": "",
      "kewarganegaraan": "",
      "no_paspor": "",
      "no_kitap": "",
      "nama_ayah": "",
      "nama_ibu": ""
    }
  ]
}`,
  NPWP: `{
  "jenis_dokumen": "NPWP",
  "npwp": "",
  "nama": "",
  "alamat": "",
  "tanggal_daftar": "",
  "kpp": "",
  "status_wp": ""
}`,
  SIM: `{
  "jenis_dokumen": "SIM",
  "nomor_sim": "",
  "nama": "",
  "alamat": "",
  "jenis_kelamin": "",
  "golongan_darah": "",
  "berlaku": "",
  "kategori_sim": "",
  "tempat_pembuatan": "",
  "tanggal_pembuatan": ""
}`,
  STNK: `{
  "jenis_dokumen": "STNK",
  "nomor_polisi": "",
  "nama_pemilik": "",
  "alamat": "",
  "nomor_rangka": "",
  "nomor_mesin": "",
  "merk": "",
  "tipe": "",
  "jenis": "",
  "tahun_pembuatan": "",
  "warna": "",
  "berlaku_pajak": "",
  "berlaku_stnk": ""
}`,
  BPKB: `{
  "jenis_dokumen": "BPKB",
  "nomor_bpkb": "",
  "nomor_polisi": "",
  "nama_pemilik": "",
  "alamat": "",
  "nomor_rangka": "",
  "nomor_mesin": "",
  "merk": "",
  "tipe": "",
  "tahun_pembuatan": "",
  "warna": "",
  "isi_silinder": "",
  "bahan_bakar": ""
}`,
  IJAZAH: `{
  "jenis_dokumen": "IJAZAH",
  "nomor_ijazah": "",
  "nama": "",
  "tempat_tanggal_lahir": "",
  "tahun_lulus": "",
  "nama_sekolah": "",
  "kepala_sekolah": "",
  "jurusan": "",
  "tanggal_terbit": ""
}`,
  TRANSKRIP_NILAI: `{
  "jenis_dokumen": "TRANSKRIP_NILAI",
  "nomor_transkrip": "",
  "nama": "",
  "nim_nrp": "",
  "program_studi": "",
  "fakultas": "",
  "universitas": "",
  "ipk": "",
  "mata_kuliah": []
}`,
  SERTIFIKAT: `{
  "jenis_dokumen": "SERTIFIKAT",
  "nomor_sertifikat": "",
  "nama": "",
  "nama_pelatihan": "",
  "penyelenggara": "",
  "tanggal_mulai": "",
  "tanggal_selesai": "",
  "tanggal_terbit": ""
}`,
  CV: `{
  "jenis_dokumen": "CV",
  "nama": "",
  "email": "",
  "telepon": "",
  "alamat": "",
  "pendidikan": [],
  "pengalaman_kerja": [],
  "keahlian": []
}`,
  PKB: `{
  "jenis_dokumen": "PKB",
  "nomor_polisi": "",
  "nama_pemilik": "",
  "alamat": "",
  "nomor_rangka": "",
  "nomor_mesin": "",
  "merk": "",
  "tipe": "",
  "pokok_pkb": "",
  "swdkllj": "",
  "denda_pkb": "",
  "denda_swdkllj": "",
  "total_bayar": "",
  "tanggal_bayar": ""
}`,
  KIR: `{
  "jenis_dokumen": "KIR",
  "nomor_uji": "",
  "nomor_polisi": "",
  "nama_pemilik": "",
  "jenis_kendaraan": "",
  "merk": "",
  "tipe": "",
  "tahun_pembuatan": "",
  "berlaku_hingga": "",
  "tempat_uji": ""
}`,
  SKCK: `{
  "jenis_dokumen": "SKCK",
  "nomor_skck": "",
  "nama": "",
  "tempat_lahir": "",
  "tanggal_lahir": "",
  "alamat": "",
  "pekerjaan": "",
  "keperluan": "",
  "tanggal_terbit": "",
  "berlaku_hingga": ""
}`,
  AIR_WAYBILL: `{
  "jenis_dokumen": "AIR_WAYBILL",
  "mawb_number": "",
  "hawb_number": "",
  "shipper_name": "",
  "shipper_address": "",
  "consignee_name": "",
  "consignee_address": "",
  "notify_party": "",
  "origin_airport": "",
  "destination_airport": "",
  "flight_number": "",
  "pieces": "",
  "gross_weight": "",
  "chargeable_weight": "",
  "goods_description": "",
  "freight_charges": "",
  "additional_notes": ""
}`,
  BILL_OF_LADING: `{
  "jenis_dokumen": "BILL_OF_LADING",
  "bl_number": "",
  "shipper": "",
  "consignee": "",
  "notify_party": "",
  "vessel": "",
  "voyage": "",
  "port_of_loading": "",
  "port_of_discharge": "",
  "container_numbers": [],
  "goods_description": "",
  "gross_weight": "",
  "measurement": ""
}`,
  PACKING_LIST: `{
  "jenis_dokumen": "PACKING_LIST",
  "packing_list_number": "",
  "invoice_number": "",
  "shipper": "",
  "consignee": "",
  "items": [],
  "total_packages": "",
  "total_weight": "",
  "total_volume": ""
}`,
  Invoice: `{
  "jenis_dokumen": "Invoice",
  "nomor_invoice": "",
  "tanggal_invoice": "",
  "nama_supplier": "",
  "alamat_supplier": "",
  "nama_pembeli": "",
  "alamat_pembeli": "",
  "items": [],
  "subtotal": "",
  "pajak": "",
  "total": "",
  "tanggal_jatuh_tempo": ""
}`,
  NOTA_BELANJA: `{
  "jenis_dokumen": "NOTA_BELANJA",
  "nomor_nota": "",
  "tanggal": "",
  "nama_toko": "",
  "alamat_toko": "",
  "items": [],
  "subtotal": "",
  "diskon": "",
  "pajak": "",
  "total": ""
}`,
  STRUK: `{
  "jenis_dokumen": "STRUK",
  "nomor_transaksi": "",
  "tanggal": "",
  "waktu": "",
  "merchant": "",
  "items": [],
  "total": "",
  "metode_pembayaran": ""
}`,
  RECEIPT: `{
  "jenis_dokumen": "RECEIPT",
  "nomor_receipt": "",
  "tanggal": "",
  "bank": "",
  "jenis_transaksi": "",
  "jumlah": "",
  "saldo": "",
  "keterangan": ""
}`,
  Passport: `{
  "jenis_dokumen": "Passport",
  "nomor_passport": "",
  "nama": "",
  "tempat_lahir": "",
  "tanggal_lahir": "",
  "jenis_kelamin": "",
  "kewarganegaraan": "",
  "tanggal_terbit": "",
  "tanggal_kadaluarsa": "",
  "tempat_terbit": ""
}`,
  Manifest: `{
  "jenis_dokumen": "Manifest",
  "nomor_manifest": "",
  "tanggal": "",
  "origin": "",
  "destination": "",
  "carrier": "",
  "items": [],
  "total_pieces": "",
  "total_weight": ""
}`,
  SIUP: `{
  "jenis_dokumen": "SIUP",
  "nomor_siup": "",
  "nama_perusahaan": "",
  "alamat_perusahaan": "",
  "bidang_usaha": "",
  "tanggal_terbit": "",
  "berlaku_hingga": ""
}`,
  NIB: `{
  "jenis_dokumen": "NIB",
  "nomor_nib": "",
  "nama_perusahaan": "",
  "alamat": "",
  "bidang_usaha": "",
  "tanggal_terbit": ""
}`,
  AKTA: `{
  "jenis_dokumen": "AKTA",
  "nomor_akta": "",
  "jenis_akta": "",
  "nama_notaris": "",
  "tanggal_akta": "",
  "pihak_terkait": []
}`,
  TDP: `{
  "jenis_dokumen": "TDP",
  "nomor_tdp": "",
  "nama_perusahaan": "",
  "alamat": "",
  "bidang_usaha": "",
  "tanggal_terbit": ""
}`,
  Lainnya: `{
  "jenis_dokumen": "Lainnya",
  "tipe_dokumen_terdeteksi": "",
  "data_utama": {},
  "catatan": ""
}`
};

async function correctOCRText(
  rawText: string,
  openaiKey: string
): Promise<string> {
  const correctionPrompt = `Kamu adalah AI OCR Correction Expert dengan kemampuan REASONING LAYER. Tugasmu adalah memperbaiki teks hasil OCR yang mengandung kesalahan.

===========================
REASONING LAYER (WAJIB)
===========================

AI HARUS:
1. Menganalisa LAYOUT dokumen, bukan sekadar baris teks mentah
2. Menebak maksud kolom walaupun label hilang (gunakan konteks)
3. Menyatukan baris yang patah menjadi 1 informasi yang utuh
4. Memilih nomor dokumen yang paling valid di halaman (regex + konteks)
5. Menggunakan konteks untuk memisahkan:
   - Nama siswa vs nama kepala sekolah
   - Nama pemilik vs nama perusahaan
   - Alamat pengirim vs alamat penerima
   - Data header vs data tabel

===========================
TUGAS UTAMA
===========================

1. Perbaiki kesalahan OCR (karakter salah baca: O→0, l→1, S→5, I→1, B→8, dll)
2. Hilangkan noise, watermark, dot-matrix artifacts, blur text
3. Gabungkan baris yang terpecah (misalnya alamat atau nama yang terpisah)
4. Identifikasi dan pertahankan struktur tabel (jangan gabungkan kolom tabel)
5. Normalisasi format nomor (NIK, NPWP, No. Polisi, dll)
6. Normalisasi format tanggal (DD-MM-YYYY atau YYYY-MM-DD)
7. Perbaiki spasi yang tidak konsisten
8. Hilangkan karakter aneh atau simbol yang bukan bagian dari dokumen

===========================
LAYOUT ANALYSIS RULES
===========================

- Identifikasi HEADER dokumen (biasanya di atas, berisi judul/logo)
- Identifikasi BODY dokumen (data utama, tabel, form fields)
- Identifikasi FOOTER dokumen (tanda tangan, tanggal, cap)
- Untuk TABEL: pertahankan struktur kolom, gunakan | atau tab sebagai pemisah
- Untuk FORM: pertahankan label: value format
- Untuk ALAMAT: gabungkan baris yang terpecah menjadi 1 alamat lengkap

===========================
NOMOR DOKUMEN VALIDATION
===========================

Gunakan regex dan konteks untuk memvalidasi nomor dokumen:
- NIK: 16 digit angka (contoh: 3201234567890001)
- NPWP: XX.XXX.XXX.X-XXX.XXX format
- No. KK: 16 digit angka
- No. Polisi: format plat kendaraan (B 1234 ABC)
- No. Rangka: alfanumerik 17 karakter
- No. Mesin: alfanumerik
- No. AWB: format airline (XXX-XXXXXXXX)
- No. Invoice: alfanumerik dengan prefix

===========================
ATURAN PENTING
===========================

- Jangan mengubah makna atau menambah informasi yang tidak ada
- Pertahankan struktur dokumen asli (header, tabel, footer)
- Untuk tabel, pertahankan pemisahan kolom dengan jelas
- Jika ada label field (seperti "NIK:", "Nama:", "Alamat:"), pertahankan
- Return ONLY teks yang sudah diperbaiki, tanpa penjelasan

TEKS OCR ASLI:
${rawText}

TEKS YANG SUDAH DIPERBAIKI:`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Kamu adalah OCR correction expert. Return ONLY corrected text tanpa penjelasan." },
          { role: "user", content: correctionPrompt },
        ],
        temperature: 0.1,
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      console.error("OCR correction failed, using original text");
      return rawText;
    }

    const data = await response.json();
    const correctedText = data.choices[0]?.message?.content?.trim() || rawText;
    
    console.log("OCR correction completed. Original length:", rawText.length, "Corrected length:", correctedText.length);
    
    return correctedText;
  } catch (error) {
    console.error("OCR correction error:", error);
    return rawText; // Fallback to original text
  }
}

async function classifyAndExtract(
  cleanText: string,
  openaiKey: string
): Promise<DocumentClassificationResult> {
  const classificationPrompt = `Kamu adalah AI classifier dokumen Indonesia dengan kemampuan deteksi universal. Analisis teks OCR berikut dan tentukan jenis dokumennya.

JENIS DOKUMEN YANG TERSEDIA (UNIVERSAL DOCUMENT INTELLIGENCE):

IDENTITAS & KEPENDUDUKAN:
1. KTP - Kartu Tanda Penduduk (ada NIK 16 digit, nama, alamat, RT/RW)
2. KK - Kartu Keluarga (ada Nomor KK, kepala keluarga, anggota keluarga dalam tabel)
3. NPWP - Nomor Pokok Wajib Pajak (ada nomor NPWP format XX.XXX.XXX.X-XXX.XXX)
4. Passport - Paspor (ada nomor passport, nationality, date of issue/expiry)
5. SKCK - Surat Keterangan Catatan Kepolisian

KENDARAAN & TRANSPORTASI:
6. SIM - Surat Izin Mengemudi (ada nomor SIM, golongan A/B/C)
7. STNK - Surat Tanda Nomor Kendaraan (ada nomor polisi, nomor rangka, nomor mesin)
8. PKB - Pajak Kendaraan Bermotor (ada PKB pokok, SWDKLLJ, total bayar)
9. BPKB - Buku Pemilik Kendaraan Bermotor
10. KIR - Kendaraan Inspeksi Roda

PENDIDIKAN & SERTIFIKASI:
11. IJAZAH - Ijazah/Diploma (ada nomor ijazah, nama sekolah, tahun lulus)
12. TRANSKRIP_NILAI - Transkrip Nilai Akademik
13. SERTIFIKAT - Sertifikat Pelatihan/Keahlian
14. CV - Curriculum Vitae / Daftar Riwayat Hidup

KEUANGAN & TRANSAKSI:
15. Invoice - Nota/Bon/Faktur (ada nomor invoice, items, total, tanggal)
16. NOTA_BELANJA - Nota/Struk Belanja
17. STRUK - Struk Pembayaran
18. RECEIPT - Receipt Bank/ATM

LOGISTIK & PENGIRIMAN:
19. AIR_WAYBILL - MAWB/HAWB (ada AWB number, shipper, consignee, origin, destination)
20. BILL_OF_LADING - Bill of Lading (B/L)
21. PACKING_LIST - Packing List
22. Manifest - Dokumen Logistik (ada daftar barang, carrier, origin/destination)

PERUSAHAAN & LEGAL:
23. SIUP - Surat Izin Usaha Perdagangan
24. NIB - Nomor Induk Berusaha
25. AKTA - Akta Perusahaan/Notaris
26. TDP - Tanda Daftar Perusahaan

LAINNYA:
27. Lainnya - Jika tidak cocok dengan kategori di atas (gunakan "unknown" sebagai fallback)

INSTRUKSI:
1. Baca teks OCR dengan teliti dan identifikasi kata kunci spesifik
2. Perhatikan format nomor, struktur dokumen, dan header/footer
3. Untuk dokumen KK, perhatikan adanya tabel dengan banyak kolom (nama, NIK, jenis kelamin, dll)
4. Jika tidak yakin (confidence < 70%), set uncertain = true
5. Return JSON dengan format:
{
  "jenis_dokumen": "NAMA_DOKUMEN",
  "uncertain": false,
  "confidence": 95,
  "reasoning": "Alasan singkat mengapa memilih jenis dokumen ini"
}

TEKS OCR:
${cleanText}`;

  const classifyResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Kamu adalah AI classifier dokumen Indonesia yang akurat. Return ONLY valid JSON." },
        { role: "user", content: classificationPrompt },
      ],
      temperature: 0.1,
      max_completion_tokens: 500,
    }),
  });

  if (!classifyResponse.ok) {
    throw new Error(`OpenAI classification failed: ${classifyResponse.statusText}`);
  }

  const classifyData = await classifyResponse.json();
  const classifyContent = classifyData.choices?.[0]?.message?.content || "{}";
  
  let classification;
  try {
    const jsonMatch = classifyContent.match(/\{[\s\S]*\}/);
    classification = jsonMatch ? JSON.parse(jsonMatch[0]) : { jenis_dokumen: "Lainnya", uncertain: true, confidence: 0 };
  } catch {
    classification = { jenis_dokumen: "Lainnya", uncertain: true, confidence: 0 };
  }

  const docType = classification.jenis_dokumen || "Lainnya";
  const schema = EXTRACTION_SCHEMAS[docType] || EXTRACTION_SCHEMAS["Lainnya"];

  const extractionPrompt = `Kamu adalah AI ekstraksi data dokumen Indonesia. Ekstrak data dari teks OCR berikut sesuai dengan format JSON yang diberikan.

JENIS DOKUMEN: ${docType}

FORMAT OUTPUT (isi semua field yang bisa ditemukan, kosongkan jika tidak ada):
${schema}

${docType === "KK" ? `
===========================
INSTRUKSI SUPER EKSTRAKSI KK
===========================

Saat jenis_dokumen = "KK", AI WAJIB melakukan ekstraksi full-structured dari dokumen Kartu Keluarga Indonesia.

===========================
ATURAN EKSTRAKSI HEADER KK
===========================

AI HARUS mengekstrak:

- Nomor KK → cari label "No." atau "Nomor KK".
- Nama Kepala Keluarga → label "Nama Kepala Keluarga".
- Alamat lengkap → gabungkan baris alamat + RT/RW.
- RT/RW → baca persis seperti di KK (contoh: "002/005").
- Kelurahan/Desa → label "Desa/Kelurahan".
- Kecamatan → label "Kecamatan".
- Kabupaten/Kota → label "Kabupaten/Kota".
- Provinsi → label "Provinsi".
- Kode Pos → jika tersedia.
- Tanggal Dikeluarkan → label "Dikeluarkan Tanggal".

===========================
ATURAN EKSTRAKSI TABEL KK
===========================

Dokumen KK berisi tabel dengan banyak kolom. AI HARUS membaca setiap baris dan memetakannya ke array \`anggota_keluarga[]\`.

Gunakan kolom seperti ini (berdasarkan urutan KK nasional):

1. No (abaikan)
2. Nama Lengkap
3. NIK
4. Jenis Kelamin
5. Tempat Lahir
6. Tanggal Lahir
7. Agama
8. Pendidikan
9. Jenis Pekerjaan
10. Golongan Darah
11. Status Perkawinan
12. Tanggal Pernikahan
13. Status Hubungan Dalam Keluarga
14. Kewarganegaraan
15. No. Paspor
16. No. KITAP
17. Nama Ayah
18. Nama Ibu

Jika ada baris kosong → jangan dimasukkan.

===========================
ATURAN PERBAIKAN DATA
===========================

- Normalisasi tanggal menjadi yyyy-MM-dd.
- Normalisasi nama menjadi Title Case kecuali diminta lain.
- Jika AI tidak yakin, tetap simpan nilainya atau null dan beri catatan dalam "debug_notes".

===========================
PENTING
===========================

AI TIDAK BOLEH hanya mengembalikan 3 field seperti sebelumnya.
AI WAJIB mengekstrak sebanyak mungkin kolom dari tabel KK walaupun bentuknya grid.
` : ""}

ATURAN UMUM:
1. Ekstrak semua data yang tersedia dari teks OCR
2. Format tanggal: DD-MM-YYYY atau YYYY-MM-DD (normalisasi otomatis)
3. Untuk NIK/nomor, pertahankan format asli dan normalisasi (hapus spasi/tanda baca yang tidak perlu)
4. Jika ada data yang tidak jelas, beri tanda [?] di akhir
5. Untuk array (seperti anggota_keluarga atau items), ekstrak semua yang ditemukan
6. Return ONLY valid JSON, tanpa penjelasan

INSTRUKSI TAMBAHAN - AUTOMATIC FIELD DETECTION:
7. Jika menemukan field tambahan yang TIDAK ada di schema tapi relevan dengan dokumen, TAMBAHKAN ke JSON output
8. Contoh: jika menemukan "Nomor Telepon", "Email", "Kode QR", dll yang tidak ada di schema, tetap ekstrak
9. Gunakan nama field yang deskriptif dan konsisten (lowercase dengan underscore)
10. Field tambahan ini akan otomatis dibuat di database

===========================
UNIVERSAL DOCUMENT MAPPING RULES
===========================

AI WAJIB mencoba membaca pola data berikut, WALAUPUN DOKUMEN APAPUN:

IDENTITAS:
- nama, nik, tempat_lahir, tanggal_lahir, alamat, jenis_kelamin, agama, status_perkawinan

NOMOR DOKUMEN:
- nomor_kk, nomor_ktp, nomor_stnk, nomor_npwp, nomor_ijazah, nomor_awb, nomor_invoice
- nomor_polisi, nomor_mesin, nomor_rangka, nomor_sim, nomor_bpkb, nomor_passport

DATA PERUSAHAAN:
- nama_perusahaan, nib, npwp_perusahaan, alamat_perusahaan, bidang_usaha

DATA PENDIDIKAN:
- sekolah, nama_sekolah, universitas, jurusan, program_studi, tahun_lulus, nilai, ipk

DATA PENERBANGAN/EKSPEDISI:
- shipper, consignee, origin, destination, weight, awb_number, mawb_number, hawb_number
- flight_number, pieces, gross_weight, chargeable_weight

DATA KEUANGAN:
- nominal, pajak, total, ppn, subtotal, diskon, tanggal_transaksi, tanggal_invoice
- metode_pembayaran, bank, jumlah, saldo

DATA KENDARAAN:
- merk, model, tipe, tahun, tahun_pembuatan, warna, nomor_rangka, nomor_mesin
- jenis_kendaraan, isi_silinder, bahan_bakar

DATA KELUARGA (KK):
- kepala_keluarga, nama_kepala_keluarga, anggota_keluarga[]
- hubungan, status_hubungan, pendidikan, pekerjaan, jenis_pekerjaan

DATA ALAMAT:
- alamat, rt_rw, kelurahan, kelurahan_desa, kecamatan, kabupaten_kota, provinsi, kode_pos

DATA KONTAK:
- telepon, nomor_telepon, email, fax, website

ATURAN PENTING:
- Jika AI menemukan pola yang cocok dengan kategori di atas, AI WAJIB mengisinya
- Ekstrak SEMUA field yang ditemukan, bahkan jika tidak ada di schema dokumen
- Normalisasi nama field ke snake_case
- Jika field sudah ada di schema, gunakan nama yang sama
- Jika field baru, buat nama yang konsisten dengan pola di atas

===========================
REASONING LAYER (WAJIB)
===========================

AI HARUS melakukan reasoning sebelum ekstraksi:

1. LAYOUT ANALYSIS:
   - Identifikasi struktur dokumen (header, body, footer, tabel)
   - Tentukan posisi relatif setiap informasi
   - Bedakan antara label dan value

2. CONTEXT UNDERSTANDING:
   - Gunakan konteks untuk memisahkan entitas yang mirip:
     * Nama siswa vs nama kepala sekolah
     * Nama pemilik vs nama perusahaan
     * Alamat pengirim vs alamat penerima
     * Tanggal lahir vs tanggal terbit dokumen

3. COLUMN INFERENCE:
   - Jika label kolom hilang, tebak berdasarkan:
     * Posisi relatif terhadap kolom lain
     * Format data (angka, tanggal, nama)
     * Pola yang umum di dokumen sejenis

4. LINE MERGING:
   - Gabungkan baris yang terpecah menjadi 1 informasi
   - Contoh: alamat yang terpecah 2-3 baris → gabung jadi 1

5. NUMBER VALIDATION:
   - Pilih nomor dokumen yang paling valid menggunakan regex + konteks
   - NIK: 16 digit, NPWP: XX.XXX.XXX.X-XXX.XXX, dll

6. UNCERTAINTY HANDLING:
   - Jika AI ragu, tetap kembalikan fieldnya dengan nilai null
   - Tulis penjelasan di field "debug_notes"

===========================
OUTPUT FORMAT (WAJIB KONSISTEN)
===========================

Return JSON dengan struktur:
{
  "jenis_dokumen": "<detected type>",
  ... semua field yang diekstrak ...,
  "debug_notes": "<catatan jika ada ketidakpastian>"
}

PRIORITAS UTAMA:
AI harus membantu user menghasilkan data terstruktur PALING LENGKAP,
bukan hanya sekadar menyalin hasil OCR.

TEKS OCR (SUDAH DIPERBAIKI):
${cleanText}`;

  const extractResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Kamu adalah AI ekstraksi data dokumen. Return ONLY valid JSON sesuai schema yang diberikan." },
        { role: "user", content: extractionPrompt },
      ],
      temperature: 0.1,
      max_completion_tokens: 4000,
    }),
  });

  if (!extractResponse.ok) {
    throw new Error(`OpenAI extraction failed: ${extractResponse.statusText}`);
  }

  const extractData = await extractResponse.json();
  const extractContent = extractData.choices?.[0]?.message?.content || "{}";
  
  let extractedData;
  try {
    const jsonMatch = extractContent.match(/\{[\s\S]*\}/);
    extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : { jenis_dokumen: docType };
  } catch {
    extractedData = { jenis_dokumen: docType, error: "Failed to parse extraction" };
  }

  return {
    jenis_dokumen: docType,
    uncertain: classification.uncertain || classification.confidence < 70,
    confidence: classification.confidence || 0,
    extracted_data: extractedData,
    raw_text: cleanText,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { clean_text, raw_text } = await req.json();
    
    const textToProcess = clean_text || raw_text;
    
    if (!textToProcess) {
      return new Response(
        JSON.stringify({ error: "clean_text or raw_text is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const openaiKey = Deno.env.get("OPEN_AI_KEY") || Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Processing document classification...");
    console.log("Text length:", textToProcess.length);

    // Step 1: OCR Correction with NLP
    console.log("Step 1: Applying OCR correction...");
    const correctedText = await correctOCRText(textToProcess, openaiKey);

    // Step 2: Classification and Extraction
    console.log("Step 2: Classifying and extracting data...");
    const result = await classifyAndExtract(correctedText, openaiKey);

    console.log("Classification result:", result.jenis_dokumen, "Confidence:", result.confidence);

    // Build standardized output format
    const outputResponse = {
      success: true,
      document_type: result.jenis_dokumen,
      structured_data: result.extracted_data || {},
      raw_text: textToProcess,
      clean_text: correctedText,
      confidence: result.confidence,
      fields_detected: Object.keys(result.extracted_data || {}).filter(k => 
        result.extracted_data[k] !== null && 
        result.extracted_data[k] !== "" && 
        result.extracted_data[k] !== undefined
      ),
      uncertain: result.uncertain,
      // Add debug_notes if AI was uncertain about any fields
      ...(result.uncertain && { 
        debug_notes: `AI confidence: ${result.confidence}. Some fields may need manual verification.` 
      })
    };

    return new Response(
      JSON.stringify(outputResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Document classification error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
