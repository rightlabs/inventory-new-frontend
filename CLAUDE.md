# Gayatri Industries - Frontend Documentation

## Tech Stack
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components

## Project Structure

```
app/
├── (auth)/
│   └── page.tsx              # Login page
├── (dashboard)/
│   ├── layout.tsx            # Dashboard layout with sidebar
│   ├── dashboard/page.tsx    # Main dashboard (admin only)
│   ├── sales/page.tsx        # Sales orders
│   ├── purchase/page.tsx     # Purchase orders
│   ├── customers/page.tsx    # Customer management
│   ├── vendors/page.tsx      # Vendor management
│   └── inventory/page.tsx    # Inventory management

components/
├── Forms/
│   ├── SaleForm.tsx          # Sale creation form
│   ├── PurchaseForm.tsx      # Purchase creation form
│   └── ...
├── Sale/
│   └── ItemSelection.tsx     # Item selector for sales
├── sidebar.tsx               # Navigation sidebar (role-aware)
└── ui/                       # shadcn/ui components

contexts/
├── userContext.tsx           # User state & role management
└── globalContext.tsx         # Global app state

api/
├── auth.ts                   # Auth API calls
├── dashboard.ts              # Dashboard API calls
└── ...                       # Other API modules

types/
└── type.ts                   # TypeScript interfaces
```

## Role-Based Access

### Implementation

1. **Sidebar Filtering** (`components/sidebar.tsx`):
```typescript
const routes = [
  { label: "Dashboard", href: "/dashboard", roles: ["admin"] },
  { label: "Sales Orders", href: "/sales", roles: ["admin", "sales"] },
  // ...
];

// Filter based on user role
const filteredRoutes = routes.filter(
  (route) => !user?.role || route.roles.includes(user.role)
);
```

2. **Login Redirect** (`app/(auth)/page.tsx`):
```typescript
const userRole = res.data.data.user?.role;
if (userRole === "sales") {
  window.location.href = "/sales";
} else {
  window.location.href = "/dashboard";
}
```

3. **Route Protection** (`app/(dashboard)/dashboard/page.tsx`):
```typescript
useEffect(() => {
  if (user?.role === "sales") {
    router.replace("/sales");
  }
}, [user, router]);
```

## Recent Updates (December 2024)

### Numeric Input Validation

Added input sanitization to prevent invalid characters in number fields:

**Files Modified**:
- `components/Forms/SaleForm.tsx`
- `components/Forms/PurchaseForm.tsx`
- `components/Sale/ItemSelection.tsx`

**Helper Functions**:
```typescript
// Strip non-numeric characters (allow digits and one decimal point)
const sanitizeNumericInput = (value: string): string => {
  let sanitized = value.replace(/[^0-9.]/g, '');
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }
  return sanitized;
};

// Prevent invalid key presses
const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (
    e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' ||
    e.key === 'Escape' || e.key === 'Enter' || e.key === '.' ||
    e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
    e.key === 'Home' || e.key === 'End'
  ) {
    return;
  }
  if (e.ctrlKey || e.metaKey) return;
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
};
```

**Usage**:
```tsx
<Input
  type="text"
  inputMode="decimal"
  value={formData.discount}
  onChange={(e) => setFormData(prev => ({
    ...prev,
    discount: sanitizeNumericInput(e.target.value)
  }))}
  onKeyDown={handleNumericKeyDown}
/>
```

### Credit Limit Warning

Changed from blocking to warning when credit limit is 0 or exceeded:

```typescript
if (selectedCustomer.creditLimit === 0) {
  toast("Note: Customer has no credit limit set", { icon: "ℹ️" });
} else if (potentialNewBalance > selectedCustomer.creditLimit) {
  toast("Warning: This sale exceeds the customer's credit limit", { icon: "⚠️" });
}
// Sale proceeds regardless
```

### Role-Based UI

- Dashboard link hidden from sidebar for sales role
- Sales users redirected to `/sales` on login
- Sales users redirected if they try to access `/dashboard` directly

## User Context

```typescript
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "sales";
}

// Usage
const { user } = useUser();
if (user?.role === "sales") {
  // Sales-specific logic
}
```

## API Integration

All API calls go through the `api/` directory and use axios with cookie-based auth:

```typescript
// api/auth.ts
export const userLogin = (data: { email: string; password: string }) => {
  return axios.post(`${API_URL}/user/login`, data, { withCredentials: true });
};
```

## Environment

- Backend API: `http://localhost:9010/api/v1`
- Frontend Dev: `http://localhost:3000` (or 3001 if 3000 is busy)

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Component Patterns

### Forms
- Use controlled inputs with React state
- Validate on submit, show errors via toast
- Use `sanitizeNumericInput` for all currency/quantity fields

### Data Fetching
- Use `useEffect` for initial data load
- Show loading spinner while fetching
- Handle errors gracefully with toast messages

### Navigation
- Use Next.js `useRouter` for programmatic navigation
- Use `Link` component for static navigation
- Check user role before showing/allowing access
