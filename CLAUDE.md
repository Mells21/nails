# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
npm run dev       # Vite dev server
npm run build     # Production build
npm run lint      # oxlint (rules in .oxlintrc.json)
npm run preview   # Preview production build
```

There is no test suite configured in this project.

## Environment

Copy `.env.example` to `.env` and fill in Firebase, WhatsApp Cloud API, and salon-info values (`VITE_*` vars, consumed via `import.meta.env`). `@mercadopago/sdk-react` is listed as a dependency but is currently unused — payment is handled manually (see below).

## Architecture

Nail salon booking app: React 19 + Vite, client-side routed with `react-router-dom`, Firebase (Auth + Firestore + Storage) as the only backend — no custom server.

### Auth & roles
- `src/context/AuthContext.jsx` subscribes to Firebase `onAuthStateChanged` and additionally fetches the Firestore `users/{uid}` doc to get `role` (`admin` | `client`). Both `user` (Firebase Auth) and `profile` (Firestore doc) are exposed via `useAuth()`.
- `src/components/layout/ProtectedRoute.jsx` gates routes by `role` prop and redirects mismatched roles to their home area (admin → `/admin`, client → `/reservar`) rather than showing a 403.
- Registration (`src/firebase/auth.js: registerClient`) always creates `role: 'client'` — admin accounts must be created manually in Firestore.

### Routing structure (`src/App.jsx`)
Two parallel layouts wrap route groups: `ClientLayout` (Navbar) for public/client routes, `AdminLayout` (AdminSidebar) for `/admin/*`. All client/admin routes are wrapped in `ProtectedRoute` with the appropriate `role`.

### Firebase data layer (`src/firebase/*.js`)
Firestore access is centralized per collection, not called directly from components:
- `appointments.js` — collection `appointments`. Status is a state machine: `pending_payment` → `pending_validation` (after proof upload) → `confirmed` (admin action) → `completed`/`cancelled`/`no_show`.
- `schedule.js` — collection `schedule`, one document per week keyed by that week's **Monday date string** (`YYYY-MM-DD`). Each doc's `days` map holds per-date config: `{ enabled, start, end, breaks: [{breakStart, breakEnd}] }`. `getAvailableSlots` is a pure function (not a Firestore call) that generates 30-minute slot candidates between `start`/`end`, excluding break overlaps and already-booked times — it's called client-side after fetching both the week's schedule and the day's booked appointments.
- `clients.js` — reads/updates `users` collection docs for CRM purposes (filters to `role === 'client'`).
- `storage.js` — three fixed upload paths in Firebase Storage: `references/{appointmentId}/photo_{n}`, `payment_proofs/{appointmentId}/proof`, `gallery/{filename}`.
- `auth.js` — thin wrapper over Firebase Auth + the `users` Firestore doc (which is the source of truth for `role`).

### Booking flow (`src/pages/client/BookingPage.jsx`)
A 4-step wizard (Servicio → Fecha y hora → Fotos → Pago) held in local component state, not a route-per-step:
1. Pick a service from `SERVICES` catalog (`src/utils/constants.js`).
2. Pick date/time — dates come from `schedule.js` weeks where the day is `enabled`; slots come from `getAvailableSlots` cross-referenced with appointments already booked for that date (statuses `confirmed`, `pending_payment`, `pending_validation` all block a slot).
3. Upload reference photos, review `BookingSummary`.
4. `createAppointment` is called (status starts `pending_payment`), then `ManualPayment` handles proof-of-payment upload → `submitPaymentProof` flips status to `pending_validation`. An admin later calls `confirmManualPayment` to reach `confirmed`. There is no automated payment gateway integration despite the MercadoPago dependency.

### WhatsApp integration (`src/utils/whatsapp.js`)
No WhatsApp Cloud API calls are wired up yet — messages are built as strings (`buildConfirmationMessage`, `buildReminderMessage`) and sent via `wa.me` deep links opened in a new tab (`openWhatsApp`), not the Cloud API despite `.env.example` defining `VITE_WA_*` vars for it.

### Domain constants (`src/utils/constants.js`)
`SERVICES` (id, name, duration in minutes, price in COP, emoji, color) and `APPOINTMENT_STATUSES` (label/color/bg per status) are the canonical catalogs referenced throughout booking, admin, and CRM screens — add new services/statuses here rather than inline.

### Locale
UI copy, Firestore field values (e.g. cancellation reasons), and WhatsApp messages are in Spanish (Colombia); date formatting uses `date-fns` with the `es` locale (`src/utils/dates.js`). Prices are formatted as COP via `formatPrice`.
