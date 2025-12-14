-- Create tables for storing OCR document results

-- KTP Results
CREATE TABLE IF NOT EXISTS ktp_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  nik text,
  nama text,
  tempat_lahir text,
  tanggal_lahir date,
  jenis_kelamin text,
  alamat text,
  rt_rw text,
  kelurahan_desa text,
  kecamatan text,
  agama text,
  status_perkawinan text,
  pekerjaan text,
  kewarganegaraan text,
  berlaku_hingga text,
  provinsi text,
  kabupaten_kota text,
  golongan_darah text,
  raw_text text,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- KK Results
CREATE TABLE IF NOT EXISTS kk_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  nomor_kk text,
  nama_kepala_keluarga text,
  alamat text,
  rt_rw text,
  kelurahan_desa text,
  kecamatan text,
  kabupaten_kota text,
  provinsi text,
  kode_pos text,
  anggota_keluarga jsonb,
  raw_text text,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- NPWP Results
CREATE TABLE IF NOT EXISTS npwp_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  npwp text,
  nama text,
  nik text,
  alamat text,
  kelurahan_desa text,
  kecamatan text,
  kabupaten_kota text,
  provinsi text,
  kode_pos text,
  raw_text text,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- SIM Results
CREATE TABLE IF NOT EXISTS sim_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  nomor_sim text,
  nama text,
  tempat_lahir text,
  tanggal_lahir date,
  jenis_kelamin text,
  alamat text,
  pekerjaan text,
  golongan_darah text,
  jenis_sim text,
  berlaku_hingga date,
  tanggal_terbit date,
  raw_text text,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- STNK Results
CREATE TABLE IF NOT EXISTS stnk_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  nomor_registrasi text,
  nomor_rangka text,
  nomor_mesin text,
  nomor_polisi text,
  merk text,
  tipe text,
  jenis text,
  model text,
  tahun_pembuatan text,
  warna text,
  bahan_bakar text,
  nama_pemilik text,
  alamat_pemilik text,
  berlaku_hingga date,
  raw_text text,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Ijazah Results
CREATE TABLE IF NOT EXISTS ijazah_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  nomor_ijazah text,
  nama text,
  tempat_lahir text,
  tanggal_lahir date,
  nama_sekolah text,
  jenjang text,
  jurusan text,
  tahun_lulus text,
  tanggal_lulus date,
  nomor_peserta_ujian text,
  raw_text text,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Vehicle Tax Results
CREATE TABLE IF NOT EXISTS vehicle_tax_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  nomor_polisi text,
  nomor_rangka text,
  nomor_mesin text,
  nama_pemilik text,
  alamat text,
  merk text,
  tipe text,
  tahun text,
  warna text,
  pokok_pkb numeric,
  denda_pkb numeric,
  swdkllj numeric,
  total_pajak numeric,
  berlaku_hingga date,
  tanggal_bayar date,
  raw_text text,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ktp_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE kk_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE npwp_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE stnk_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ijazah_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_tax_results ENABLE ROW LEVEL SECURITY;

-- Create policies for all tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN 
    SELECT unnest(ARRAY['ktp_results', 'kk_results', 'npwp_results', 'sim_results', 'stnk_results', 'ijazah_results', 'vehicle_tax_results'])
  LOOP
    EXECUTE format('
      CREATE POLICY "Allow insert for authenticated users" ON %I
      FOR INSERT TO authenticated, anon WITH CHECK (true);
      
      CREATE POLICY "Allow select for authenticated users" ON %I
      FOR SELECT TO authenticated, anon USING (true);
      
      CREATE POLICY "Allow update for authenticated users" ON %I
      FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);
      
      CREATE POLICY "Allow delete for authenticated users" ON %I
      FOR DELETE TO authenticated, anon USING (true);
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;
