# OCR Scan Button - Panduan Penggunaan

## Fitur
- ✅ Tombol kecil "Scan OCR" dengan ikon kamera
- ✅ Modal untuk memilih: Ambil foto dengan kamera atau pilih dari galeri
- ✅ Kompresi otomatis gambar (max 1600x1600px, quality 0.6)
- ✅ Upload otomatis ke Supabase Storage bucket "documents"
- ✅ Callback dengan URL gambar yang sudah diupload

## Cara Menggunakan

### 1. Import Component

```tsx
import OCRScanButton from "./OCRScanButton";
import { useToast } from "@/components/ui/use-toast";
```

### 2. Tambahkan di Form Header

```tsx
export default function YourForm() {
  const { toast } = useToast();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1>Form Title</h1>
        <OCRScanButton
          onImageUploaded={(url, filePath) => {
            // Handle uploaded image
            toast({
              title: "Gambar berhasil diupload",
              description: `File: ${filePath}`,
            });
            
            // Optional: Save URL to state or form
            // setImageUrl(url);
          }}
          bucketName="documents" // Optional, default: "documents"
          folderPath="ocr-scans" // Optional, default: "ocr-scans"
        />
      </div>
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onImageUploaded` | `(url: string, filePath: string) => void` | - | Callback setelah gambar berhasil diupload |
| `bucketName` | `string` | `"documents"` | Nama bucket Supabase Storage |
| `folderPath` | `string` | `"ocr-scans"` | Folder path di dalam bucket |

## Contoh Implementasi

### Form Keuangan (TransaksiKeuanganForm)
```tsx
<div className="flex gap-2">
  {showForm && (
    <>
      <OCRScanButton
        onImageUploaded={(url, filePath) => {
          toast({
            title: "Gambar berhasil diupload",
            description: `File: ${filePath}`,
          });
        }}
      />
      {/* Other buttons */}
    </>
  )}
</div>
```

### Form dengan Card Header (CashDisbursementForm)
```tsx
<CardHeader className="bg-gradient-to-r from-red-500 to-red-600">
  <div className="flex items-center justify-between">
    <CardTitle className="text-white text-2xl">
      Form Pengeluaran Kas
    </CardTitle>
    <OCRScanButton
      onImageUploaded={(url, filePath) => {
        toast({
          title: "Gambar berhasil diupload",
          description: `File: ${filePath}`,
        });
      }}
    />
  </div>
</CardHeader>
```

### Form Gudang (BarangMasuk)
```tsx
<div className="flex items-center justify-between mb-4">
  <h1 className="text-2xl font-bold">Barang Masuk</h1>
  <OCRScanButton
    onImageUploaded={(url, filePath) => {
      toast({
        title: "Gambar berhasil diupload",
        description: `File: ${filePath}`,
      });
    }}
  />
</div>
```

## Advanced: Menyimpan URL ke State

```tsx
const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

<OCRScanButton
  onImageUploaded={(url, filePath) => {
    setUploadedImageUrl(url);
    toast({
      title: "Gambar berhasil diupload",
      description: "Gambar siap diproses",
    });
  }}
/>

{/* Display uploaded image */}
{uploadedImageUrl && (
  <img src={uploadedImageUrl} alt="Uploaded" className="max-w-md" />
)}
```

## Spesifikasi Teknis

- **Kompresi**: Menggunakan `browser-image-compression`
- **Max Dimensi**: 1600x1600 pixels
- **Quality**: 0.6 (60%)
- **Format Support**: JPG, PNG, WEBP
- **Storage**: Supabase Storage bucket "documents"
- **Mobile Camera**: Menggunakan `capture="environment"` untuk kamera belakang

## Troubleshooting

### Error: "Failed to upload"
- Pastikan bucket "documents" sudah dibuat di Supabase Storage
- Cek RLS policies untuk bucket tersebut
- Pastikan user sudah login

### Gambar tidak muncul
- Cek apakah bucket bersifat public atau private
- Jika private, gunakan signed URL

### Kamera tidak terbuka di mobile
- Pastikan browser memiliki permission untuk mengakses kamera
- Gunakan HTTPS (required untuk camera access)
