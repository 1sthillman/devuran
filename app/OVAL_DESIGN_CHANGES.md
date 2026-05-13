# Oval Design Changes

## Global Changes Needed:

### 1. All Buttons
- `rounded-lg` → `rounded-full` (pill shape)
- `rounded-xl` → `rounded-full` (pill shape)
- `rounded-2xl` → `rounded-3xl` (more rounded)

### 2. All Cards
- `rounded-xl` → `rounded-3xl`
- `rounded-2xl` → `rounded-3xl`

### 3. All Inputs & Selects
- `rounded-xl` → `rounded-full` (pill shape)
- `rounded-lg` → `rounded-2xl`

### 4. All Modals
- `rounded-3xl` → keep (already good)

### 5. All Icon Containers
- `rounded-xl` → `rounded-full`
- `rounded-lg` → `rounded-full`

### 6. Image Containers
- `rounded-xl` → `rounded-3xl`

## Files to Update:
1. ServiceForm.tsx - Add custom category input
2. StaffForm.tsx - Round all elements
3. SalonSetupForm.tsx - Round all elements
4. OwnerDashboard.tsx - Already partially done
5. Global CSS - Add utility classes
