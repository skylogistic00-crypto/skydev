# Dynamic Fields System - Complete Implementation

## Overview
The Dynamic Fields System automatically processes extracted document data and creates database columns on-the-fly. This eliminates the need for manual schema management and allows the system to adapt to any document type.

---

## Key Features

### 1. **Automatic Field Detection**
- Converts all non-file fields from extracted data into key-value pairs
- Normalizes field names to `snake_case` format
- Detects field types automatically (string, number, date, boolean)

### 2. **Smart Type Detection**
The system automatically detects field types based on value patterns:
- **Date**: Recognizes formats like `yyyy-MM-dd`, `dd-MM-yyyy`, ISO 8601
- **Number**: Detects numeric strings and actual numbers
- **Boolean**: Identifies true/false values
- **Text**: Default fallback for all other values

### 3. **Auto-Column Creation**
- Checks if column exists in Supabase table
- Creates new columns automatically using SQL `ALTER TABLE`
- Maps detected types to appropriate SQL types:
  - `text` → `TEXT`
  - `number` → `NUMERIC`
  - `date` → `DATE`
  - `boolean` → `BOOLEAN`

### 4. **Smart Filtering**
The system automatically skips:
- Technical fields (`id`, `created_at`, `updated_at`, `user_id`, `entity_id`)
- Large arrays (> 10 items, e.g., `anggota_keluarga`)
- Complex nested objects
- Arrays with complex objects

---

## Implementation Details

### Edge Function: `auto-create-user-fields`

**Endpoint**: `supabase-functions-auto-create-user-fields`

**Request Format**:
```json
{
  "structured_data": {
    "nomor_kk": "1234567890123456",
    "nama_kepala_keluarga": "John Doe",
    "alamat": "Jl. Example No. 123",
    "rt_rw": "001/002",
    "tanggal_dikeluarkan": "2024-01-15",
    "anggota_keluarga": [...]  // Will be skipped (large array)
  },
  "table_name": "users"  // Optional, defaults to "users"
}
```

**Response Format**:
```json
{
  "success": true,
  "dynamic_fields": {
    "nomor_kk": "1234567890123456",
    "nama_kepala_keluarga": "John Doe",
    "alamat": "Jl. Example No. 123",
    "rt_rw": "001/002",
    "tanggal_dikeluarkan": "2024-01-15"
  },
  "auto_fields_created": [
    {
      "name": "nomor_kk",
      "label": "Nomor Kk",
      "type": "text",
      "required": false,
      "value": "1234567890123456"
    },
    ...
  ],
  "supabase_columns_created": ["nomor_kk", "nama_kepala_keluarga", "alamat", "rt_rw", "tanggal_dikeluarkan"],
  "total_fields": 5,
  "new_columns_count": 5,
  "message": "Processed 5 fields, created 5 new columns"
}
```

---

## Integration with Document Processing Pipeline

### Step 1: OCR Extraction
```typescript
// Document is scanned and OCR text is extracted
const ocrText = await scanDocument(file);
```

### Step 2: AI Classification & Extraction
```typescript
// AI classifies document type and extracts structured data
const { data } = await supabase.functions.invoke(
  "supabase-functions-ai-document-classifier",
  {
    body: {
      ocr_text: ocrText,
      file_name: file.name
    }
  }
);

// Returns structured_data with all extracted fields
const structuredData = data.structured_data;
```

### Step 3: Dynamic Field Processing
```typescript
// Auto-create columns and get dynamic fields
const { data: fieldsData } = await supabase.functions.invoke(
  "supabase-functions-auto-create-user-fields",
  {
    body: {
      structured_data: structuredData,
      table_name: "users"
    }
  }
);

// Use dynamic_fields for key-value storage
const dynamicFields = fieldsData.dynamic_fields;

// Use auto_fields_created for UI rendering
const formFields = fieldsData.auto_fields_created;
```

### Step 4: Data Storage
```typescript
// Insert data with all dynamic fields
const { error } = await supabase
  .from("users")
  .insert({
    email: userEmail,
    ...dynamicFields  // All fields are now columns in the table
  });
```

---

## Field Type Detection Logic

### Date Detection
```typescript
// Patterns recognized:
- yyyy-MM-dd (2024-01-15)
- dd-MM-yyyy (15-01-2024)
- yyyy/MM/dd (2024/01/15)
- dd/MM/yyyy (15/01/2024)
- ISO 8601 (2024-01-15T10:30:00Z)
```

### Number Detection
```typescript
// Patterns recognized:
- Integer: "123"
- Decimal: "123.45"
- Actual numbers: 123, 123.45
```

### Boolean Detection
```typescript
// Values recognized:
- true, false
- "true", "false"
- 1, 0 (as boolean)
```

---

## Database Schema Management

### Automatic Column Creation
The system uses Pica Passthrough API to execute SQL queries:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS nomor_kk TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tanggal_dikeluarkan DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_bayar NUMERIC;
```

### Column Existence Check
Before creating columns, the system checks:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'nomor_kk';
```

---

## Usage Examples

### Example 1: KTP Document
```typescript
const ktpData = {
  jenis_dokumen: "KTP",
  nik: "1234567890123456",
  nama: "John Doe",
  tempat_lahir: "Jakarta",
  tanggal_lahir: "1990-01-15",
  alamat: "Jl. Example No. 123"
};

// Process dynamic fields
const { data } = await supabase.functions.invoke(
  "supabase-functions-auto-create-user-fields",
  { body: { structured_data: ktpData } }
);

// Result: 5 new columns created (nik, nama, tempat_lahir, tanggal_lahir, alamat)
// jenis_dokumen is skipped (technical field)
```

### Example 2: KK Document
```typescript
const kkData = {
  jenis_dokumen: "KK",
  nomor_kk: "1234567890123456",
  nama_kepala_keluarga: "John Doe",
  alamat: "Jl. Example No. 123",
  rt_rw: "001/002",
  kelurahan_desa: "Kelurahan Example",
  kecamatan: "Kecamatan Example",
  kabupaten_kota: "Jakarta Selatan",
  provinsi: "DKI Jakarta",
  kode_pos: "12345",
  tanggal_dikeluarkan: "2024-01-15",
  anggota_keluarga: [
    { nama_lengkap: "John Doe", nik: "1234567890123456", ... },
    { nama_lengkap: "Jane Doe", nik: "1234567890123457", ... }
  ]
};

// Process dynamic fields
const { data } = await supabase.functions.invoke(
  "supabase-functions-auto-create-user-fields",
  { body: { structured_data: kkData } }
);

// Result: 10 new columns created (all header fields)
// anggota_keluarga is skipped (large array with complex objects)
```

### Example 3: Invoice Document
```typescript
const invoiceData = {
  jenis_dokumen: "Invoice",
  nomor_invoice: "INV-2024-001",
  tanggal_invoice: "2024-01-15",
  nama_supplier: "PT Example",
  subtotal: "1000000",
  pajak: "100000",
  total: "1100000"
};

// Process dynamic fields
const { data } = await supabase.functions.invoke(
  "supabase-functions-auto-create-user-fields",
  { body: { structured_data: invoiceData } }
);

// Result: 6 new columns created
// subtotal, pajak, total detected as NUMERIC type
// tanggal_invoice detected as DATE type
```

---

## Benefits

1. **Zero Manual Schema Management**: No need to manually create columns for new document types
2. **Type Safety**: Automatic type detection ensures correct SQL types
3. **Scalability**: Handles any document type with any number of fields
4. **Backward Compatible**: Works with existing code using `auto_fields_created` format
5. **Smart Filtering**: Automatically skips technical fields and large arrays
6. **Error Resilient**: Gracefully handles missing values and type detection failures

---

## Technical Notes

### Environment Variables Required
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for direct database access
- `SUPABASE_PROJECT_ID`: Project reference (20 chars)
- `PICA_SECRET_KEY`: Pica API secret key
- `PICA_SUPABASE_CONNECTION_KEY`: Pica Supabase connection key

### Fallback Mechanism
1. **Primary**: Direct Supabase connection using service role key
2. **Fallback**: Pica Passthrough API for SQL execution
3. **Graceful Degradation**: Returns success even if column creation fails

### Performance Considerations
- Column existence check is cached per request
- Batch column creation for multiple fields
- Async processing for non-blocking operations

---

## Future Enhancements

1. **Column Type Migration**: Automatically upgrade column types when needed (e.g., TEXT → NUMERIC)
2. **Index Creation**: Auto-create indexes for frequently queried fields
3. **Validation Rules**: Add automatic validation based on field patterns
4. **Field Relationships**: Detect and create foreign key relationships
5. **Data Migration**: Migrate existing data when column types change

---

## Troubleshooting

### Issue: Columns not being created
**Solution**: Check environment variables and ensure Pica credentials are set

### Issue: Type detection incorrect
**Solution**: Add field to `fieldTypeMap` in the Edge Function for explicit type mapping

### Issue: Large arrays causing issues
**Solution**: System automatically skips arrays > 10 items. Adjust threshold if needed.

### Issue: Nested objects not processed
**Solution**: This is by design. Flatten nested objects before processing or store as JSONB.

---

## Conclusion

The Dynamic Fields System provides a robust, scalable solution for automatic schema management in document processing workflows. It eliminates manual database schema updates and allows the system to adapt to any document type automatically.
