# SETUP SIGNUP MULTI ENTITAS (VERSI FINAL)

## Overview
Sistem signup telah direvisi untuk menggunakan Edge Function `supabase-functions-signup-multi-entity` yang menangani pembuatan user dan entity secara terpadu.

## Edge Function Details

**Function Name:** `supabase-functions-signup-multi-entity`  
**Path:** `supabase/functions/signup-multi-entity/index.ts`  
**Version:** 9 (Deployed)

### Environment Variables Required

Tambahkan di Supabase Dashboard → Edge Functions → Secrets:

```
SUPABASE_URL=<your-project-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

## API Request Format

### Endpoint
```
POST /functions/v1/supabase-functions-signup-multi-entity
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Request Body
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe",
  "phone": "+62812345678",
  "entity_type": "customer",
  "details": {
    "entity_name": "PT Example",
    "contact_person": "John Doe",
    "city": "Jakarta",
    "country": "Indonesia",
    "address": "Jl. Example No. 123",
    "is_pkp": "yes",
    "tax_id": "01.234.567.8-901.000",
    "bank_name": "BCA",
    "bank_account_holder": "PT Example",
    "payment_terms": "NET 30",
    "category": "retail",
    "currency": "IDR",
    "status": "ACTIVE"
  },
  "file_urls": {
    "upload_ktp": "LOCAL:/mnt/data/ktp.jpg",
    "upload_npwp": "LOCAL:/mnt/data/npwp.jpg"
  }
}
```

## Supported Entity Types

1. **karyawan** - Employee (role: admin)
2. **supplier** - Supplier (role: viewer)
3. **customer** - Customer (role: viewer)
4. **consignee** - Consignee (role: viewer)
5. **shipper** - Shipper (role: viewer)
6. **driver_perusahaan** - Company Driver (role: viewer)
7. **driver_mitra** - Partner Driver (role: viewer)

## Field Mapping by Entity Type

### For Suppliers, Customers, Consignees, Shippers
**details** object should contain:
- `entity_name` - Company/Entity name
- `contact_person` - Contact person name
- `city` - City
- `country` - Country
- `address` - Full address
- `is_pkp` - PKP status (yes/no)
- `tax_id` - Tax ID (NPWP)
- `bank_name` - Bank name
- `bank_account_holder` - Account holder name
- `payment_terms` - Payment terms
- `category` - Business category
- `currency` - Currency (default: IDR)
- `status` - Status (default: ACTIVE)

### For Employees/Drivers (karyawan, driver_perusahaan, driver_mitra)
**details** object should contain:
- `ktp_address` - KTP address
- `ktp_number` - KTP number
- `religion` - Religion
- `ethnicity` - Ethnicity
- `education` - Education level
- `license_number` - Driver license number (for drivers)
- `license_expiry_date` - License expiry date (for drivers)

**file_urls** object can contain:
- `selfie_photo` - Selfie photo URL
- `family_card` - Family card URL
- `ktp_document` - KTP document URL
- `sim_document` - Driver license URL
- `skck_document` - SKCK document URL

## Frontend Implementation

### AuthContext (src/contexts/AuthContext.tsx)
```typescript
const signUp = async (
  email: string,
  password: string,
  fullName: string,
  entityType: string = "customer",
  phone?: string,
  details?: Record<string, any>,
  fileUrls?: Record<string, string>
) => {
  const { data, error } = await supabase.functions.invoke('supabase-functions-signup-multi-entity', {
    body: {
      email,
      password,
      full_name: fullName,
      entity_type: entityType,
      phone,
      details: details || {},
      file_urls: fileUrls || {},
    },
  });

  if (error) throw error;
  return data;
};
```

### AuthForm Component (src/components/AuthForm.tsx)
The form now:
1. Collects all entity-specific data in `details` object
2. Collects file references in `file_urls` object
3. Calls `signUp()` with proper parameters
4. Handles success/error responses

## Response Format

### Success Response (201)
```json
{
  "success": true,
  "user_id": "uuid-here",
  "message": "User created successfully. Please check your email for verification."
}
```

### Error Responses

**409 - User Already Exists**
```json
{
  "error": "An account with this email already exists. Please login instead or use a different email."
}
```

**400 - Validation Error**
```json
{
  "error": "Missing required fields: email, password"
}
```

**500 - Server Error**
```json
{
  "error": "Failed to create user profile"
}
```

## Database Tables Affected

1. **auth.users** - Supabase Auth user
2. **public.users** - User profile with role
3. **Entity-specific tables:**
   - `suppliers` (for supplier entity_type)
   - `customers` (for customer entity_type)
   - `consignees` (for consignee entity_type)
   - `shippers` (for shipper entity_type)

## Security Features

1. **Email Verification** - Users are created with `is_active: false` until email is verified
2. **Service Role Key** - Edge Function uses service role for admin operations
3. **Rollback on Error** - If user profile creation fails, auth user is deleted
4. **Upsert Logic** - Handles duplicate key errors gracefully
5. **CORS Headers** - Properly configured for cross-origin requests

## Testing

### Test with cURL
```bash
curl -X POST https://your-project.supabase.co/functions/v1/supabase-functions-signup-multi-entity \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "full_name": "Test User",
    "phone": "+62812345678",
    "entity_type": "customer",
    "details": {
      "entity_name": "Test Company",
      "address": "Test Address"
    },
    "file_urls": {}
  }'
```

## Migration History

- `20240303_add_phone_to_users.sql` - Added phone column
- `20240304_ensure_users_role_column.sql` - Ensured role column exists
- `20240305_add_birth_date_to_customers.sql` - Added birth_date to customers

## Notes

- File uploads are currently stored as LOCAL references (placeholder)
- Future enhancement: Implement actual file upload to Supabase Storage
- Role assignment is automatic based on entity_type
- All new users start as inactive until email verification
