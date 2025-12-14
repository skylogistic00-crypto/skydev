# Troubleshooting: Data KTP/KK Tidak Masuk ke Tabel Supabase

## Ringkasan Masalah
Setelah user melakukan sign up dan mengekstrak data KTP/KK, data tersebut tidak muncul di tabel `users` Supabase.

## Analisis Sistem

### ✅ Yang Sudah Benar

1. **Edge Function `signup-multi-entity` sudah lengkap**
   - File: `supabase/functions/signup-multi-entity/index.ts`
   - Baris 220-272: Kode untuk menambahkan data OCR ke tabel users
   - Semua field KTP/KK sudah di-map dengan benar

2. **Kolom database sudah ada**
   - Migration: `20240378_add_ocr_fields_to_users.sql`
   - Kolom KTP: `nik`, `nama`, `tempat_lahir`, `tanggal_lahir`, dll
   - Kolom KK: `nomor_kk`, `nama_kepala_keluarga`, `anggota_keluarga`, dll

3. **Data flow sudah benar**
   ```
   Frontend OCR → details object → signup-multi-entity → users table
   ```

## Kemungkinan Penyebab

### 1. RLS (Row Level Security) Policies
**Masalah:** Policy mungkin memblokir insert atau select data.

**Solusi:**
```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Temporarily disable RLS for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Or create permissive policy
CREATE POLICY "Allow service role full access" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### 2. Data Tidak Dikirim dari Frontend
**Masalah:** Object `details` kosong atau tidak berisi data KTP/KK.

**Cara Check:**
- Lihat console log di edge function
- Cari log: `=== RECEIVED DETAILS FROM FRONTEND ===`
- Pastikan `details.nik`, `details.nomor_kk`, dll ada

**Solusi:**
- Pastikan frontend mengirim data dengan benar
- Check komponen OCR scanner apakah menyimpan hasil ke `details` object

### 3. Timing Issue
**Masalah:** Insert terlalu cepat sebelum auth.users commit.

**Solusi:** Sudah ada delay 3 detik di baris 200:
```typescript
await new Promise(resolve => setTimeout(resolve, 3000));
```

### 4. Error Saat Insert Tidak Tertangkap
**Masalah:** Error terjadi tapi tidak di-log dengan jelas.

**Solusi:** Check logs di Supabase Dashboard:
1. Buka Supabase Dashboard
2. Pilih project
3. Klik "Edge Functions" → "check-user-ocr-data"
4. Lihat logs untuk error

## Tool Diagnostik

### Edge Function: `check-user-ocr-data`
Saya sudah membuat edge function untuk debugging:

**Actions tersedia:**
1. `check_all_users_with_ocr` - Lihat semua user dengan data KTP/KK
2. `check_recent_signups` - Lihat 10 signup terakhir
3. `check_user_by_email` - Cari user berdasarkan email
4. `check_user_by_id` - Cari user berdasarkan ID
5. `check_table_columns` - Verifikasi kolom database

**Cara pakai:**
```typescript
const { data, error } = await supabase.functions.invoke(
  "supabase-functions-check-user-ocr-data",
  { 
    body: { 
      action: "check_all_users_with_ocr" 
    } 
  }
);
```

### UI Component: `CheckUserOCRData`
Komponen React untuk testing:
- File: `src/components/CheckUserOCRData.tsx`
- Storyboard: "CheckUserOCRDataStoryboard" di canvas

**Fitur:**
- ✅ Check all users with KTP/KK data
- ✅ Check recent signups
- ✅ Search by email
- ✅ Search by user ID
- ✅ Check table columns

## Langkah Troubleshooting

### Step 1: Verifikasi Kolom Database
```bash
# Buka storyboard "CheckUserOCRDataStoryboard"
# Klik "Check Table Columns"
# Pastikan kolom nik, nomor_kk, anggota_keluarga ada
```

### Step 2: Check Recent Signups
```bash
# Klik "Check Recent Signups (Last 10)"
# Lihat apakah ada data di kolom nik atau nomor_kk
```

### Step 3: Test Signup Baru
```bash
1. Lakukan signup baru dengan upload KTP/KK
2. Tunggu email verifikasi
3. Kembali ke CheckUserOCRData
4. Search by email yang baru didaftarkan
5. Periksa apakah data KTP/KK ada
```

### Step 4: Check Edge Function Logs
```bash
1. Buka Supabase Dashboard
2. Edge Functions → signup-multi-entity
3. Lihat logs untuk:
   - "=== RECEIVED DETAILS FROM FRONTEND ==="
   - "✔ Added OCR field to users"
   - "=== FINAL USERS DATA BEFORE INSERT ==="
4. Jika tidak ada log, berarti frontend tidak mengirim data
```

### Step 5: Check RLS Policies
```sql
-- Run di SQL Editor Supabase
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'users';
```

## Quick Fix

Jika data masih tidak masuk, coba:

### Option 1: Disable RLS Sementara
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Option 2: Tambah Policy Permissive
```sql
CREATE POLICY "Allow authenticated users to insert" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow service role all access" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### Option 3: Manual Insert Test
```sql
-- Test manual insert
INSERT INTO users (
  id, 
  email, 
  full_name, 
  nik, 
  nomor_kk
) VALUES (
  gen_random_uuid(),
  'test@example.com',
  'Test User',
  '1234567890123456',
  '9876543210123456'
);

-- Check if it worked
SELECT * FROM users WHERE email = 'test@example.com';
```

## Monitoring

### Log Points di signup-multi-entity:
1. Line 50-57: Log received details
2. Line 222-265: Log OCR fields addition
3. Line 268-272: Log final users data
4. Line 348: Log success message

### Expected Log Output:
```
=== RECEIVED DETAILS FROM FRONTEND ===
Details has nik: YES
Details has nomor_kk: YES
✔ Added OCR field to users: nik = 1234567890123456
✔ Added OCR field to users: nomor_kk = 9876543210123456
=== FINAL USERS DATA BEFORE INSERT ===
Total fields: 25
User profile created successfully on attempt 1
```

## Kesimpulan

Kode sudah benar dan lengkap. Masalah kemungkinan besar ada di:
1. **RLS Policies** - Blocking insert/select
2. **Frontend tidak mengirim data** - Object details kosong
3. **Timing issue** - Sudah ada delay tapi mungkin perlu lebih lama

Gunakan tool `CheckUserOCRData` untuk verifikasi apakah data benar-benar masuk atau tidak.

## Support

Jika masih ada masalah:
1. Check logs di edge function
2. Gunakan CheckUserOCRData untuk debugging
3. Verifikasi RLS policies
4. Test manual insert ke database
