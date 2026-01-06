# Mealcart Trolley Seal Management System - Complete Documentation

## Overview

This is a **Flight Catering Seal Management System** built for SATS Security Services (SSS) to manage and track seals on airline meal carts/trolleys. The app allows security personnel to:
- Track flights and their associated equipment
- Scan/record seal numbers for various trolley types
- Generate printable reports for documentation
- Manage Hi-Lift vehicle seals and driver information

---

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React useState/useEffect + TanStack Query
- **Backend**: Supabase (PostgreSQL database + Auth + Realtime + Edge Functions)
- **Routing**: React Router DOM v6

---

## Database Schema

### Tables

#### 1. `flights`
Stores flight information and associated equipment data.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (auto-generated) |
| user_id | uuid | References the user who created the flight |
| flight_number | text | Flight number (e.g., "TR123") |
| destination | text | Flight destination |
| departure_time | timestamp | Scheduled departure time |
| status | text | Status: "pending", "in-progress", "completed", "printed", "deleted" |
| hilift_1_number | text | Hi-Lift 1 vehicle number |
| hilift_1_seal | text | Hi-Lift 1 front seal number |
| hilift_1_rear_seal | text | Hi-Lift 1 rear seal number |
| hilift_2_number | text | Hi-Lift 2 vehicle number |
| hilift_2_seal | text | Hi-Lift 2 front seal number |
| hilift_2_rear_seal | text | Hi-Lift 2 rear seal number |
| padlock_total | text | Total number of padlocks used |
| driver_name | text | Driver's name |
| driver_id | text | Driver's ID number |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

**RLS Policies**: Users can only CRUD their own flights (using `auth.uid() = user_id`).

#### 2. `seal_scans`
Stores individual seal scan records for each equipment type.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (auto-generated) |
| user_id | uuid | References the user who scanned |
| flight_id | uuid | Foreign key to flights table |
| equipment_type | text | Type: "full-trolley", "half-trolley", "food-container", "service-container" |
| seal_number | text | The scanned seal number |
| scanned_at | timestamp | When the seal was scanned |
| created_at | timestamp | Creation timestamp |

**RLS Policies**: Users can SELECT, INSERT, DELETE their own seal scans (no UPDATE).

#### 3. `profiles`
Stores user profile information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (references auth.users) |
| username | text | Display name for reports |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

**RLS Policies**: Users can SELECT, INSERT, UPDATE their own profile only.

#### 4. `rate_limit_requests`
For rate limiting edge function calls (internal use).

---

## Application Flow

### 1. Login Page (`/`)
**File**: `src/pages/Login.tsx`

Features:
- **Login Tab**: Email/password authentication via Supabase Auth
- **Login Request Tab**: Form to request account access (sends email via edge function)
- Branded with Scoot logo

```tsx
// Key authentication flow
const handleLogin = async (e: React.FormEvent) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (data.user) {
    navigate("/flights");
  }
};
```

### 2. Flights Dashboard (`/flights`)
**File**: `src/pages/Flights.tsx`

Features:
- Lists all flights created in the last 6 hours (not deleted)
- Shows flight number, destination, status, total seals count
- Add new flights via dialog (flight numbers must start with "TR")
- Delete flights (soft delete - sets status to "deleted")
- Realtime updates via Supabase subscription
- Shows username of flight creator

```tsx
// Equipment types configuration
const equipmentTypes = [
  { id: "full-trolley", name: "Full-Size Trolley", sealCount: 2 },
  { id: "half-trolley", name: "Half-Size Trolley", sealCount: 1 },
  { id: "food-container", name: "Food Container", sealCount: 1 },
  { id: "service-container", name: "Service Container", sealCount: 1 }
];
```

### 3. Equipment Selection (`/equipment/:flightId`)
**File**: `src/pages/Equipment.tsx`

Features:
- Shows 4 equipment type cards (click to scan seals)
- Hi-Lift 1 configuration dialog (number, front seal, rear seal)
- Pad Lock total dialog
- Driver Name & ID dialog
- Edit Template button (links to template editor)
- Preview Report / Print Report buttons
- Realtime seal count updates

### 4. Seal Scanning (`/scan/:flightId/:equipmentType`)
**File**: `src/pages/Scan.tsx`

Features:
- Input field to enter/scan seal numbers
- Add seal button with camera icon (for future barcode scanning)
- Displays list of scanned seals with delete option
- Shows total count of scanned seals
- Done button to return to equipment page
- Realtime sync across devices

```tsx
// Save seal to database
const handleAddSeal = async () => {
  const { error } = await supabase.from("seal_scans").insert({
    user_id: user.id,
    flight_id: flightId,
    equipment_type: equipmentType,
    seal_number: currentSeal,
  });
};
```

### 5. Preview & Print (`/preview/:flightId`)
**File**: `src/pages/Preview.tsx`

Features:
- **Screen preview**: Shows all seal data organized by equipment type
- **Print template**: A4-sized printable report with:
  - SATS logo header
  - Date and flight number
  - Hi-Lift equipment section with seal numbers
  - SSS sticker information row
  - Signature section (Form Prepared By / Form Finalised By)
  - Time section (checking start/end times)
  - Main data table (S/n, Cart No., Seal/Sticker No., Remarks)
  - Padlock total and driver information
  - Footer with version info
- Auto-updates flight status to "printed" after printing
- Export to Excel button (placeholder)

**Print Template Structure**:
```
┌─────────────────────────────────────────────────┐
│  SATS Logo  │     Date: 24/01/2025              │
│             │     Flight No: TR123              │
├─────────────┴───────────────────────────────────┤
│ Hi-Lift 1 - [Number] │ Rear Seal: xxx, Front: x │
├─────────────────────────────────────────────────┤
│ SSS sticker nos... │ Colour: │ From: │ Ends:   │
├─────────────────────────────────────────────────┤
│ PREPARED BY: [name] │ FINALISED BY: │  Scoot   │
├─────────────────────────────────────────────────┤
│ Time-commences & Time-end: HH:MM hrs - HH:MM   │
├────┬───────────┬──────────────────┬─────────────┤
│S/n │ Cart No.  │ Seal/Sticker No. │ Remarks    │
├────┼───────────┼──────────────────┼─────────────┤
│ 1  │ 5 Full... │ 123, 456, 789... │            │
│    │           │                  │            │
├────┴───────────┼──────────────────┼─────────────┤
│                │ TOTAL PADLOCKS:  │ [count]    │
│ NAME: [driver] │ ACKNOWLEDGE BY:  │            │
│ ID: [id]       │                  │            │
└────────────────┴──────────────────┴─────────────┘
```

### 6. Template Editor (`/template-editor/:flightId`)
**File**: `src/pages/TemplateEditor.tsx`

Features:
- Customize print template appearance
- **Layout tab**: Page margin, logo height, cell padding, border width
- **Style tab**: Font family, header/title/table/seal font sizes
- **Colors tab**: Header background, table border, highlight colors
- Live preview panel
- Save settings to localStorage (per flight)
- Reset to defaults

### 7. Profile Page (`/profile`)
**File**: `src/pages/Profile.tsx`

Features:
- View email (read-only)
- Edit username (displayed on printed reports)
- Save changes to profiles table

---

## Key Components

### AddFlightDialog
**File**: `src/components/AddFlightDialog.tsx`

- Modal dialog to add new flights
- Flight number input with "TR" prefix enforced
- Creates flight with default values (destination: "TBD", departure: 2 hours from now)

### ConnectionStatus
**File**: `src/components/ConnectionStatus.tsx`

- Shows Supabase realtime connection status
- Visual indicator (green = connected)

---

## Edge Functions

### send-login-request
**File**: `supabase/functions/send-login-request/index.ts`

- Receives login request submissions
- Sends email to admin with user details (username, email, staff number)
- Uses rate limiting to prevent spam

---

## Design System

### Color Tokens (HSL format in `src/index.css`)

```css
:root {
  --primary: 210 100% 40%;        /* Blue */
  --secondary: 210 30% 90%;
  --accent: 195 85% 45%;          /* Cyan */
  --success: 142 76% 36%;         /* Green */
  --warning: 38 92% 50%;          /* Orange */
  --destructive: 0 75% 50%;       /* Red */
  --background: 210 20% 98%;
  --foreground: 215 25% 15%;
}
```

### Status Colors
- **pending**: `bg-muted text-muted-foreground`
- **in-progress**: `bg-warning text-warning-foreground`
- **completed**: `bg-success text-success-foreground`
- **printed**: `bg-blue-500 text-white`

---

## Data Flow

### Creating a Flight
1. User clicks "Add Flight" → AddFlightDialog opens
2. User enters flight number (TR prefix enforced)
3. Dialog creates flight in `flights` table with user_id
4. Realtime subscription updates Flights list

### Scanning Seals
1. User selects equipment type from Equipment page
2. Navigates to Scan page
3. Enters seal number → saves to `seal_scans` table
4. Realtime updates show new seal immediately
5. Count updates on Equipment page

### Printing Report
1. User clicks "Preview Report" on Equipment page
2. Preview page fetches all data (flight, seals, profiles)
3. Groups seals by equipment type
4. User clicks "Print" → browser print dialog
5. `afterprint` event updates flight status to "printed"

---

## Realtime Subscriptions

Both Flights and Equipment pages use Supabase realtime:

```tsx
// Subscribe to changes
const channel = supabase
  .channel('flights-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'flights'
  }, () => {
    fetchFlights(); // Refresh data
  })
  .subscribe();

// Cleanup on unmount
return () => {
  supabase.removeChannel(channel);
};
```

---

## Print Styling

The Preview page uses a separate print stylesheet:

```css
@media print {
  @page { 
    margin: 0.2cm; 
    size: A4 portrait; 
  }
  table { 
    page-break-inside: avoid; 
  }
  .print:hidden { display: none; }
  .print:block { display: block; }
}
```

---

## Assets

- `src/assets/sats-logo.png` - SATS Security Services logo (used in print header)
- `src/assets/scoot-logo.png` - Scoot airline logo (used in login page)

---

## Security

### Row Level Security (RLS)
All tables have RLS enabled:
- Users can only access their own data
- Policies use `auth.uid() = user_id` checks

### Database Function
`get_username_for_user(user_uuid)` - Secure function to get username by user ID

---

## Future Enhancements (Placeholders)

1. **Barcode/QR scanning** - Camera icons present but not functional
2. **Export to Excel** - Button exists but not implemented
3. **Hi-Lift 2** - UI structure exists but not fully implemented in preview
4. **Multiple pages** - Watermark shows "Page 1" suggesting pagination planned

---

## Build & Deployment

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

The app is deployed via Lovable's built-in deployment (lovable.app domain).

---

## Key Business Logic

### Flight Number Validation
- Must start with "TR"
- Only numbers allowed after prefix
- Minimum 4 characters (e.g., "TR12")

### Seal Count Display
- Full-Size Trolley: count ÷ 2 (because each trolley needs 2 seals)
- Other equipment: shows actual count

### Data Retention
- Flights page shows flights from last 6 hours only
- "Deleted" flights are hidden but not removed from database

### Print Template Row Height
- Data rows: 40px height
- Empty filler rows: 40px height
- Target total rows: 25 (to fill A4 page)
