# Mealcart Trolley Seal Management System - Complete Documentation

## Overview

This is a Flight Catering Seal Management System built for SATS Security Services (SSS) to manage and track seals on airline meal carts/trolleys. The app allows security personnel to track flights and their associated equipment, scan and record seal numbers for various trolley types, generate printable reports for documentation, and manage Hi-Lift vehicle seals and driver information.

---

## Technology Stack

The frontend uses React 18 with TypeScript and Vite as the build tool. Styling is handled by Tailwind CSS with shadcn/ui components. State management uses React useState/useEffect hooks along with TanStack Query. The backend is powered by Supabase which provides PostgreSQL database, authentication, realtime subscriptions, and edge functions. Routing is managed by React Router DOM version 6.

---

## Database Schema

### Flights Table

Stores flight information and associated equipment data. The table includes an auto-generated UUID as the primary key, a user_id that references the user who created the flight, flight_number (such as "TR123"), destination, departure_time as a timestamp, and a status field which can be "pending", "in-progress", "completed", "printed", or "deleted".

The table also stores Hi-Lift equipment information including hilift_1_number (vehicle number), hilift_1_seal (front seal number), hilift_1_rear_seal, and corresponding fields for a second Hi-Lift unit. Additional fields include padlock_total (total number of padlocks used), driver_name, driver_id, and standard created_at and updated_at timestamps.

Row Level Security ensures users can only create, read, update, and delete their own flights using the auth.uid() equals user_id check.

### Seal Scans Table

Stores individual seal scan records for each equipment type. Each record has an auto-generated UUID, user_id referencing who scanned it, flight_id as a foreign key to the flights table, equipment_type (which can be "full-trolley", "half-trolley", "food-container", or "service-container"), seal_number containing the scanned value, scanned_at timestamp, and created_at timestamp.

Row Level Security allows users to select, insert, and delete their own seal scans, but update is not permitted.

### Profiles Table

Stores user profile information with the id as a primary key that references auth.users, a username field for display purposes on reports, and standard timestamps. Users can only select, insert, and update their own profile.

### Rate Limit Requests Table

Used internally for rate limiting edge function calls.

---

## Application Flow

### Login Page (Route: /)

Located at src/pages/Login.tsx. This page provides two tabs: a Login tab for email and password authentication via Supabase Auth, and a Login Request tab with a form to request account access which sends an email via an edge function. The page is branded with the Scoot logo.

### Flights Dashboard (Route: /flights)

Located at src/pages/Flights.tsx. This page lists all flights created in the last 6 hours that are not deleted. Each flight card shows the flight number, destination, status, and total seals count. Users can add new flights via a dialog, and flight numbers must start with "TR". Flights can be deleted using a soft delete approach that sets the status to "deleted". The page uses realtime updates via Supabase subscription and displays the username of whoever created each flight.

The system recognizes four equipment types: Full-Size Trolley (requires 2 seals per trolley), Half-Size Trolley (1 seal), Food Container (1 seal), and Service Container (1 seal).

### Equipment Selection (Route: /equipment/:flightId)

Located at src/pages/Equipment.tsx. This page shows four equipment type cards that users can click to navigate to the scan page. There are configuration dialogs for Hi-Lift 1 (vehicle number, front seal, rear seal), Pad Lock total, and Driver Name with ID. The page includes buttons to edit the template, preview the report, and print the report. Seal counts update in realtime.

### Seal Scanning (Route: /scan/:flightId/:equipmentType)

Located at src/pages/Scan.tsx. This page has an input field to enter or scan seal numbers, an add button with a camera icon for future barcode scanning functionality, a list showing all scanned seals with delete options, a count of total scanned seals, and a done button to return to the equipment page. Data syncs in realtime across devices.

### Preview and Print (Route: /preview/:flightId)

Located at src/pages/Preview.tsx. The screen preview shows all seal data organized by equipment type. The print template is A4-sized and includes a SATS logo header with date and flight number, a Hi-Lift equipment section with seal numbers, an SSS sticker information row, a signature section for Form Prepared By and Form Finalised By, a time section for checking start and end times, a main data table with columns for S/n, Cart No., Seal/Sticker No., and Remarks, padlock total with driver information at the bottom, and a footer with version information.

The flight status automatically updates to "printed" after printing. There is also an export to Excel button which is currently a placeholder.

### Template Editor (Route: /template-editor/:flightId)

Located at src/pages/TemplateEditor.tsx. This page allows customization of the print template appearance. The Layout tab controls page margin, logo height, cell padding, and border width. The Style tab controls font family and sizes for header, title, table, and seal text. The Colors tab controls header background, table border, and highlight colors. There is a live preview panel, settings are saved to localStorage per flight, and a reset to defaults option.

### Profile Page (Route: /profile)

Located at src/pages/Profile.tsx. Users can view their email (read-only) and edit their username which is displayed on printed reports. Changes are saved to the profiles table.

---

## Key Components

### AddFlightDialog

Located at src/components/AddFlightDialog.tsx. This is a modal dialog to add new flights. The flight number input enforces a "TR" prefix. Creating a flight sets default values: destination is "TBD" and departure time is 2 hours from now.

### ConnectionStatus

Located at src/components/ConnectionStatus.tsx. This component shows the Supabase realtime connection status as a visual indicator, with green meaning connected.

---

## Edge Functions

### send-login-request

Located at supabase/functions/send-login-request/index.ts. This function receives login request submissions and sends an email to an admin with user details including username, email, and staff number. It uses rate limiting to prevent spam.

---

## Design System

The design system uses HSL color format defined in src/index.css. Primary color is blue, secondary is a light blue-gray, accent is cyan, success is green, warning is orange, and destructive is red. Background is a very light blue-gray and foreground is a dark blue-gray.

Status colors are: pending uses muted background with muted foreground text, in-progress uses warning colors, completed uses success colors, and printed uses blue with white text.

---

## Data Flow

### Creating a Flight

User clicks Add Flight which opens the AddFlightDialog. User enters a flight number with the TR prefix enforced. The dialog creates a flight in the flights table with the user_id. The realtime subscription updates the Flights list automatically.

### Scanning Seals

User selects an equipment type from the Equipment page and navigates to the Scan page. User enters a seal number which saves to the seal_scans table. Realtime updates show the new seal immediately and the count updates on the Equipment page.

### Printing Report

User clicks Preview Report on the Equipment page. The Preview page fetches all data including flight details, seals, and profiles. Seals are grouped by equipment type. User clicks Print to open the browser print dialog. The afterprint event updates the flight status to "printed".

---

## Realtime Subscriptions

Both the Flights and Equipment pages use Supabase realtime to subscribe to database changes. When any change occurs on the flights or seal_scans tables, the data is automatically refreshed. The subscription is properly cleaned up when the component unmounts.

---

## Print Styling

The Preview page uses a separate print stylesheet with page margins set to 0.2cm and A4 portrait size. Tables avoid page breaks inside. Elements marked for screen-only are hidden during print, and elements marked for print-only are shown.

---

## Assets

The sats-logo.png file in src/assets shows the SATS Security Services logo and is used in the print header. The scoot-logo.png file in src/assets shows the Scoot airline logo and is used on the login page.

---

## Security

### Row Level Security

All tables have RLS enabled. Users can only access their own data. Policies use auth.uid() equals user_id checks.

### Database Function

The get_username_for_user function accepts a user UUID and securely returns the username for that user ID.

---

## Future Enhancements

Barcode and QR scanning is planned, with camera icons present but not yet functional. Export to Excel has a button but is not implemented. Hi-Lift 2 has UI structure but is not fully implemented in the preview. The watermark shows "Page 1" suggesting pagination is planned for multiple pages.

---

## Build and Deployment

For development, run npm run dev. To build for production, run npm run build. To preview the production build locally, run npm run preview. The app is deployed via Lovable's built-in deployment on the lovable.app domain.

---

## Key Business Logic

### Flight Number Validation

Flight numbers must start with "TR". Only numbers are allowed after the prefix. The minimum length is 4 characters, for example "TR12".

### Seal Count Display

For Full-Size Trolley, the displayed count is the actual count divided by 2 because each trolley requires 2 seals. For all other equipment types, the actual count is shown.

### Data Retention

The Flights page shows only flights from the last 6 hours. Deleted flights are hidden from the list but remain in the database.

### Print Template Row Height

Data rows are 40px in height. Empty filler rows are also 40px in height. The target is 25 total rows to fill an A4 page.
