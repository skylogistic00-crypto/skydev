# Troubleshooting: Bucket Not Found Error

## Error yang Terjadi
```
Bucket not found: finance-documents
```

## Penyebab Umum
1. Bucket belum dibuat di Supabase
2. Nama bucket salah (typo atau case-sensitive)
3. Migration belum dijalankan dengan benar
4. Bucket dihapus secara tidak sengaja

---

## Solusi 1: Verifikasi Bucket di Supabase Dashboard

### Langkah-langkah:
1. **Login ke Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Pilih project Anda

2. **Buka Storage**
   - Sidebar → Storage
   - Lihat daftar buckets

3. **Cek Bucket `finance-documents`**
   - Apakah ada bucket dengan nama `finance-documents`?
   - Pastikan nama persis sama (case-sensitive)

---

## Solusi 2: Buat Bucket Secara Manual

Jika bucket tidak ada, buat secara manual:

### Via Supabase Dashboard:
1. Buka **Storage** di sidebar
2. Klik **New bucket**
3. Isi form:
   - **Name**: `finance-documents`
   - **Public**: ✅ Yes (centang)
4. Klik **Create bucket**

### Via SQL Editor:
1. Buka **SQL Editor** di Supabase Dashboard
2. Copy-paste SQL berikut:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('finance-documents', 'finance-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
DROP POLICY IF EXISTS "Finance documents are publicly accessible" ON storage.objects;
CREATE POLICY "Finance documents are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'finance-documents');

DROP POLICY IF EXISTS "Authenticated users can upload finance documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload finance documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'finance-documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their finance documents" ON storage.objects;
CREATE POLICY "Users can update their finance documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'finance-documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete their finance documents" ON storage.objects;
CREATE POLICY "Users can delete their finance documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'finance-documents' AND auth.role() = 'authenticated');
```

3. Klik **Run**

---

## Solusi 3: Jalankan Migration Lengkap

Jika migration belum dijalankan:

1. **Buka SQL Editor** di Supabase Dashboard
2. **Copy-paste** isi file: `supabase/migrations/20240354_create_finance_transactions_tables.sql`
3. **Klik Run**
4. **Verifikasi**:
   - Buka Storage → Pastikan bucket `finance-documents` ada
   - Buka Tables → Pastikan 3 tables ada

---

## Solusi 4: Verifikasi Nama Bucket di Code

Pastikan nama bucket di code sama persis:

### File yang perlu dicek:
1. **src/components/FinanceTransactionsPage.tsx**
   - Line 336: `.from("finance-documents")`
   - Line 343: `.from("finance-documents")`
   - Line 388: `.from("finance-documents")`
   - Line 394: `.from("finance-documents")`

### Pastikan:
- ✅ Nama persis: `finance-documents` (dengan dash)
- ✅ Huruf kecil semua
- ✅ Tidak ada spasi
- ✅ Tidak ada typo

---

## Solusi 5: Cek Environment Variables

Pastikan Supabase credentials benar:

```bash
# Cek di .env atau environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Verifikasi:
1. URL benar dan project aktif
2. Anon key valid
3. Tidak ada typo

---

## Solusi 6: Test Bucket Access

Buat file test untuk verifikasi bucket:

### File: `test-bucket.ts`
```typescript
import { supabase } from "@/lib/supabase";

async function testBucket() {
  try {
    // List all buckets
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();
    
    console.log("All buckets:", buckets);
    
    if (listError) {
      console.error("Error listing buckets:", listError);
      return;
    }
    
    // Check if finance-documents exists
    const financeDocsBucket = buckets?.find(b => b.id === 'finance-documents');
    
    if (financeDocsBucket) {
      console.log("✅ Bucket 'finance-documents' found!");
      console.log("Bucket details:", financeDocsBucket);
    } else {
      console.error("❌ Bucket 'finance-documents' NOT found!");
      console.log("Available buckets:", buckets?.map(b => b.id));
    }
    
    // Try to list files in bucket
    const { data: files, error: filesError } = await supabase
      .storage
      .from('finance-documents')
      .list();
    
    if (filesError) {
      console.error("Error accessing bucket:", filesError);
    } else {
      console.log("Files in bucket:", files);
    }
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run test
testBucket();
```

---

## Checklist Troubleshooting

- [ ] Bucket `finance-documents` ada di Supabase Dashboard → Storage
- [ ] Nama bucket persis sama: `finance-documents`
- [ ] Bucket bersifat public (public checkbox dicentang)
- [ ] Storage policies sudah dibuat
- [ ] Migration sudah dijalankan
- [ ] Environment variables benar
- [ ] Supabase client terhubung
- [ ] User sudah login (untuk authenticated policies)

---

## Jika Masih Error

### Cek Browser Console:
1. Buka Developer Tools (F12)
2. Tab Console
3. Lihat error message lengkap
4. Screenshot dan share error

### Cek Network Tab:
1. Buka Developer Tools (F12)
2. Tab Network
3. Filter: XHR/Fetch
4. Cari request ke Supabase storage
5. Lihat response error

### Cek Supabase Logs:
1. Buka Supabase Dashboard
2. Sidebar → Logs
3. Filter: Storage
4. Lihat error logs

---

## Quick Fix Command

Jika ingin cepat, jalankan SQL ini di Supabase SQL Editor:

```sql
-- Quick fix: Create bucket and policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('finance-documents', 'finance-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Recreate all policies
DROP POLICY IF EXISTS "Finance documents are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload finance documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their finance documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their finance documents" ON storage.objects;

CREATE POLICY "Finance documents are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'finance-documents');

CREATE POLICY "Authenticated users can upload finance documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'finance-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their finance documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'finance-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their finance documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'finance-documents' AND auth.role() = 'authenticated');
```

---

## Setelah Fix

1. **Refresh browser**
2. **Clear cache** (Ctrl+Shift+R)
3. **Test upload** di `/finance/transactions/new`
4. **Verifikasi** file muncul di Supabase Storage

---

**Jika masih ada masalah, share screenshot error dan saya akan bantu lebih lanjut!**
