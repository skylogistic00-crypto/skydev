# Entity Form Integration in Signup

## Changes Made

### 1. Header.tsx
- **Added imports**: SupplierForm, ConsigneeForm, ShipperForm components
- **Added state**: `showEntityForm` to track which entity form to display
- **Updated role selection**: Detects if selected role contains 'supplier', 'consignee', or 'shipper' keywords
- **Conditional rendering**: 
  - Shows SupplierForm when supplier role is selected
  - Shows ConsigneeForm when consignee role is selected
  - Shows ShipperForm when shipper role is selected
  - Shows default personal information form for other roles

### 2. AuthForm.tsx
- **Added imports**: SupplierForm, ConsigneeForm, ShipperForm components
- **Added state**: `showEntityForm` to track which entity form to display
- **Updated role selection**: Same detection logic as Header.tsx
- **Conditional rendering**: Same pattern as Header.tsx

## How It Works

1. User selects a role from the dropdown
2. The `onValueChange` handler checks if the role name contains:
   - 'supplier' → sets `showEntityForm` to 'supplier'
   - 'consignee' → sets `showEntityForm` to 'consignee'
   - 'shipper' → sets `showEntityForm` to 'shipper'
   - Otherwise → sets `showEntityForm` to null
3. Based on `showEntityForm` value:
   - If 'supplier': Renders `<SupplierForm />` component
   - If 'consignee': Renders `<ConsigneeForm />` component
   - If 'shipper': Renders `<ShipperForm />` component
   - If null: Renders default personal information form

## Role Detection Logic

```typescript
const lowerRole = value.toLowerCase();
if (lowerRole.includes('supplier')) {
  setShowEntityForm('supplier');
} else if (lowerRole.includes('consignee')) {
  setShowEntityForm('consignee');
} else if (lowerRole.includes('shipper')) {
  setShowEntityForm('shipper');
} else {
  setShowEntityForm(null);
}
```

## Benefits

1. **Reusability**: Uses existing form components (SupplierForm, ConsigneeForm, ShipperForm)
2. **Consistency**: Same form fields and validation as used elsewhere in the app
3. **Maintainability**: Changes to entity forms automatically reflect in signup
4. **User Experience**: Shows relevant fields based on selected role

## Testing Checklist

- [ ] Select supplier role → SupplierForm appears
- [ ] Select consignee role → ConsigneeForm appears
- [ ] Select shipper role → ShipperForm appears
- [ ] Select other roles → Default personal information form appears
- [ ] Form submission works correctly with entity-specific data
- [ ] Validation works for entity-specific fields
- [ ] Entity records are created correctly in database

## Notes

- The entity form components (SupplierForm, ConsigneeForm, ShipperForm) should be configured to work in "signup mode" if they have different behavior when used standalone vs in signup flow
- Consider adding a prop to these components to indicate they're being used in signup context if needed
- The forms should handle their own state and validation internally
