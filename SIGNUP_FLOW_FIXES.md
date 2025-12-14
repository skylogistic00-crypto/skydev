# Signup Flow Fixes - Summary

## Changes Made

### 1. AuthContext.tsx
- **Simplified fetchUserProfile**: Removed retry logic and changed from `.maybeSingle()` to `.single()` since Edge Function guarantees profile creation
- **Auto-login after signup**: Added `await supabase.auth.signInWithPassword({ email, password })` in the `signUp` function
- Profile is now fetched only from `public.users` table based on `auth.uid()`

### 2. Database Schema (Migration 20240306)
Added `user_id` column and missing fields to all entity tables:

#### Employees Table
- `user_id` (references auth.users)
- `full_name`, `position`, `department`, `hire_date`
- `status`, `address`, `city`, `country`
- Auto-generated `employee_code` (EMP00001, EMP00002, etc.)

#### Drivers Table
- `user_id` (references auth.users)
- `full_name`, `license_number`, `license_type`, `license_expiry`
- `status`, `address`, `city`, `country`
- Auto-generated `driver_code` (DRV00001, DRV00002, etc.)

#### Suppliers, Customers, Consignees, Shippers
- `user_id` (references auth.users)
- `address`, `status`, `currency`, `payment_terms`, `category`
- `bank_name`, `bank_account_holder`

#### Customers Only
- `birth_date` field added

### 3. Edge Function (signup-multi-entity)
- **Payload filtering**: Only allowed columns are inserted into entity tables
- **Correct column names**: Uses proper column names for each entity type:
  - Suppliers: `supplier_name`, `contact_person`, `phone_number`
  - Customers: `customer_name`, `contact_person`, `phone_number`
  - Consignees: `consignee_name`, `contact_person`, `phone_number`
  - Shippers: `shipper_name`, `contact_person`, `phone_number`
  - Employees: `full_name`, `email`, `phone`
  - Drivers: `full_name`, `email`, `phone`

#### Allowed Columns by Entity Type
```typescript
{
  supplier: ['address', 'city', 'country', 'is_pkp', 'tax_id', 'bank_name', 'bank_account_holder', 'payment_terms', 'category', 'currency', 'status'],
  customer: ['address', 'city', 'country', 'is_pkp', 'tax_id', 'bank_name', 'bank_account_holder', 'payment_terms', 'category', 'currency', 'status', 'birth_date'],
  consignee: ['address', 'city', 'country', 'is_pkp', 'tax_id', 'bank_name', 'bank_account_holder', 'payment_terms', 'category', 'currency', 'status'],
  shipper: ['address', 'city', 'country', 'is_pkp', 'tax_id', 'bank_name', 'bank_account_holder', 'payment_terms', 'category', 'currency', 'status'],
  employee: ['position', 'department', 'hire_date', 'address', 'city', 'country', 'status'],
  driver: ['license_number', 'license_type', 'license_expiry', 'address', 'city', 'country', 'status'],
}
```

### 4. Header.tsx
- Removed duplicate `signIn` call after signup (now handled in AuthContext)

## Flow After Changes

1. User fills signup form
2. Frontend calls `signUp()` from AuthContext
3. AuthContext calls Edge Function `signup-multi-entity`
4. Edge Function:
   - Creates auth user
   - Creates user profile in `public.users`
   - Creates entity record (filtered payload)
5. AuthContext automatically calls `signInWithPassword()`
6. Auth state change triggers `fetchUserProfile()`
7. User is logged in with profile loaded

## Errors Fixed

- ✅ PGRST204 (No rows found) - Profile now guaranteed by Edge Function
- ✅ 'supabaseKey is required' - Removed retry logic
- ✅ Column mismatch errors - Using correct column names
- ✅ Duplicate login - Removed from Header.tsx
- ✅ Invalid columns in entity tables - Payload filtering implemented

## Testing Checklist

- [ ] Signup as Customer
- [ ] Signup as Supplier
- [ ] Signup as Consignee
- [ ] Signup as Shipper
- [ ] Signup as Employee
- [ ] Signup as Driver
- [ ] Verify auto-login works
- [ ] Verify profile loads correctly
- [ ] Verify entity record created with correct columns
- [ ] Verify no PGRST204 errors
- [ ] Verify no 'supabaseKey is required' errors
