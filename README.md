# StayFinder

StayFinder is a full-stack accommodation booking platform. Users can discover places to stay, publish their own properties, and manage booking requests as guests or hosts.

The frontend is built with Next.js and React (the user interface is in Swedish), the backend is a REST API built with Hono, and Supabase (PostgreSQL + Auth) provides the database and authentication.

## Live Demo

- **Frontend:** https://stayfinder-2qvs.vercel.app/
- **Backend API:** https://stayfinder-blush.vercel.app/
- **API health check:** https://stayfinder-blush.vercel.app/health

## Features

### Authentication
- Register, log in and log out
- Session stored in an HTTP-only cookie managed by the backend
- Protected API routes with authentication middleware
- Endpoint for the currently authenticated user

### Properties
- Browse published properties
- Filter by city, guest capacity and price range, and sort by price
- Pagination
- View property details
- Create, edit, publish and delete your own listings
- Overview of your own listings

### Bookings
- Request a booking for a property (created with status `pending`)
- View your own bookings as a guest
- View incoming booking requests as a host
- Hosts confirm or decline requests
- Guests cancel or edit their own bookings
- Overlapping bookings are prevented
- Guest capacity and date ranges are validated

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Node.js, Hono, TypeScript, Zod |
| Database & auth | Supabase (PostgreSQL, Supabase Auth, `@supabase/ssr`) |
| Testing | Vitest |
| Deployment | Vercel |

## Architecture

```text
Browser (Next.js)
   │  fetch(..., { credentials: "include" })
   ▼
Hono API ── CORS ── Supabase client middleware ── Origin check ── Routes
   │                                                              │
   │   Zod validation · authentication · ownership checks         │
   ▼                                                              ▼
Supabase Auth (session cookie)                         Supabase PostgreSQL
```

Request flow:

1. The frontend calls the API through a small `api()` helper that always sends cookies.
2. The backend creates a Supabase client per request from the session cookie (`@supabase/ssr`).
3. Request bodies and query parameters are validated with Zod; route parameters are validated as UUIDs.
4. Route handlers check authentication and authorization (ownership, guest vs host).
5. Database calls run with the signed-in user's session, so PostgreSQL Row Level Security can act as a second line of defence.

## Project Structure

```text
stayfinder/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── bookings/            # My bookings
│       │   │   └── requests/        # Incoming booking requests
│       │   ├── dashboard/
│       │   ├── login/
│       │   ├── register/
│       │   ├── properties/
│       │   │   ├── [id]/            # Property details
│       │   │   │   └── edit/
│       │   │   ├── mine/
│       │   │   └── new/
│       │   └── page.tsx
│       ├── components/              # BookingForm, Navbar, PropertyCard, SearchBar
│       ├── context/                 # AuthContext
│       ├── lib/                     # api.ts (fetch helper)
│       └── types/
│
├── backend/
│   └── src/
│       ├── config/                  # Environment validation (Zod)
│       ├── database/                # Supabase queries
│       ├── middleware/              # auth, supabase client, origin check, error handler
│       ├── routes/                  # auth, properties, bookings
│       ├── schemas/                 # Zod schemas (+ tests)
│       ├── types/
│       ├── utils/
│       ├── app.ts                   # Hono app (CORS, middleware, routes)
│       └── index.ts                 # Node server entry point
│
├── supabase/
│   ├── config.toml
│   └── seed.sql
│
├── package.json                     # Supabase CLI
└── README.md
```

## API Overview

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | API health check |
| GET | `/` | API status |

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | – | Register (email, password min. 8 characters, name 2–100 characters) |
| POST | `/auth/login` | – | Log in and set the session cookie |
| POST | `/auth/logout` | – | Log out and clear the session cookie |
| GET | `/auth/me` | Required | Get the authenticated user |

### Properties

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/properties` | Optional | Browse and filter published properties |
| GET | `/properties/mine` | Required | The authenticated user's properties |
| GET | `/properties/:id` | Optional | Get a property by ID |
| POST | `/properties` | Required | Create a property |
| PATCH | `/properties/:id` | Required (owner) | Update a property |
| DELETE | `/properties/:id` | Required (owner) | Delete a property |

Listing filters: `city`, `guests`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`.

### Bookings

All booking routes require authentication.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/bookings` | List bookings (`from`, `to`, `limit` 1–100 default 20, `offset`) |
| GET | `/bookings/:id` | Get a booking |
| POST | `/bookings` | Create a booking request |
| PATCH | `/bookings/:id` | Update a booking |

### Common status codes

| Code | Meaning |
|---|---|
| 400 | Invalid input, invalid UUID, invalid dates, too many guests |
| 401 | Not authenticated |
| 403 | Authenticated but not allowed (not the owner / not a party to the booking) |
| 404 | Resource not found (or property not published) |
| 409 | Overlapping booking, confirmed booking cannot be edited, or property with bookings cannot be deleted |

Error responses use a single shape: `{ "error": "message" }`, and validation errors add `"details": { "field": ["message"] }`.

## Business Rules

### Properties
- Only the owner can update or delete a property.
- A property that has bookings cannot be deleted.
- `user_id` is always taken from the authenticated session, never from the request body.

### Bookings
- Creating a booking requires an existing, published property.
- The number of guests cannot exceed the property's `max_guests`.
- Check-out must be after check-in.
- Dates may not overlap an existing `pending` or `confirmed` booking for the same property. This is checked by the API and enforced by a database exclusion constraint, so concurrent requests cannot double-book.
- New bookings always start as `pending`, and `user_id` comes from the session.
- Only the guest or the property host can update a booking.
- **Guests** can cancel their booking, or change dates and guest count while it is still `pending`. They cannot change the status to anything other than `cancelled`, and a confirmed booking cannot be edited.
- **Hosts** can only change the booking status (confirm or decline).
- Cancelled bookings cannot be modified.
- Bookings cannot be permanently deleted. Guests and hosts can cancel a booking by changing its status to cancelled. Cancelled bookings remain in the database and cannot be modified.
- Capacity, date order and overlaps are re-validated on every update.

## Authentication and Security

StayFinder uses Supabase Auth. The backend owns the session and stores it in cookies; the frontend never handles tokens directly.

| Attribute | Production | Development |
|---|---|---|
| `HttpOnly` | yes | yes |
| `Secure` | yes | no |
| `SameSite` | `None` | `Lax` |
| `Path` | `/` | `/` |
| `Domain` | not set (host-only cookie on the API domain) | not set |

Why `SameSite=None` in production: the frontend and backend run on different `*.vercel.app` subdomains. `vercel.app` is on the Public Suffix List, so the two apps are different *sites* and requests between them are cross-site. `SameSite=Lax` cookies are not sent with cross-site `fetch()` calls.

Other measures:
- CORS allows only the exact frontend origin (`FRONTEND_URL`) with credentials enabled.
- An origin-check middleware protects the API against cross-site requests. This matters more with `SameSite=None`, since the browser no longer limits when the cookie is sent.
- Environment variables are validated at startup with Zod.
- Errors go through a central error handler.
- Secrets are never committed (`.env*` is ignored, `.env.example` is allowed).

### Known limitation: third-party cookies

Because the session cookie is set by a different site than the one the user is visiting, browsers that block third-party cookies (for example Safari, Brave, and Chrome in Incognito mode) may not keep the user logged in.

The robust fix is to make the cookie first-party, either by:
- proxying the API through the frontend (a Next.js rewrite from `/api/*` to the backend), or
- hosting both apps on subdomains of one custom domain (for example `app.example.com` and `api.example.com`) and setting `COOKIE_DOMAIN=.example.com`.

Do not set `COOKIE_DOMAIN` when running on `*.vercel.app`; browsers reject cookies for public suffixes.

## Getting Started

### Prerequisites

- Node.js and npm
- A Supabase project (or the Supabase CLI for a local stack)

### 1. Clone and install

```bash
git clone https://github.com/Shayaa63/stayfinder.git
cd stayfinder

cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment variables

**Backend** (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `development`, `production` or `test` |
| `HONO_PORT` | no | `4000` | Port for the local Node server |
| `FRONTEND_URL` | no | `http://localhost:3000` | Exact frontend origin, no trailing slash. Used for CORS |
| `SUPABASE_URL` | yes | – | Supabase project URL |
| `SUPABASE_ANON_KEY` | yes | – | Supabase anon/publishable key |
| `COOKIE_DOMAIN` | no | not set | Only for a shared custom domain (see above) |

```env
NODE_ENV=development
HONO_PORT=4000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Frontend** (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Always set `NEXT_PUBLIC_API_URL` explicitly. If it is missing, the frontend falls back to `http://localhost:4000`, which does not match the backend's default port.

### 3. Run

```bash
# terminal 1
cd backend
npm run dev        # http://localhost:4000

# terminal 2
cd frontend
npm run dev        # http://localhost:3000
```

## Database

Supabase PostgreSQL stores properties and bookings. Authentication data lives in Supabase Auth.

Data model:

| Table | Main columns |
|---|---|
| `properties` | `property_id`, `user_id`, `title`, `description`, `city`, `country`, `address`, `price_per_night`, `max_guests`, `images`, `is_published`, `updated_at` |
| `bookings` | `booking_id`, `property_id`, `user_id`, `guest_name`, `guest_email`, `check_in`, `check_out`, `guests`, `status` (`pending`, `confirmed`, `cancelled`) |

`supabase/seed.sql` creates a local-only test user plus sample properties and bookings.

### Migrations

The schema is versioned in `supabase/migrations/`:

| File | Purpose |
|---|---|
| `001_initial_schema.sql` | Baseline that mirrors the production database: tables, check constraints, indexes, a gist exclusion constraint that prevents overlapping `pending`/`confirmed` bookings, and Row Level Security policies |
| `002_tighten_booking_rules.sql` | Removes booking DELETE policies and adds database-level protections for booking updates, including immutable `user_id`/`property_id` and read-only cancelled bookings |

The migration files document the database schema and changes. The presence of a migration file in this repository does not confirm that it has been applied in production. Verify the migration status in Supabase before assuming it has been deployed.

To recreate the database locally (requires Docker):

```bash
npx supabase start
npx supabase db reset   # runs the migrations and seed.sql
```

## Testing and Build

### Backend

```bash
cd backend
npm test            # Vitest
npm run typecheck   # tsc --noEmit
npm run build
```

Current coverage: Zod property schema tests (`property.schema.test.ts`). Route, authorization and booking-rule tests are planned. `backend/stayfinder-api-tests.http` contains manual API requests for use with a REST client.

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

## Deployment

The frontend and backend are deployed as separate Vercel projects.

**Backend:** `NODE_ENV=production`, `FRONTEND_URL` (exact frontend origin), `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

**Frontend:** `NEXT_PUBLIC_API_URL` (the backend URL).

## Roadmap

- Make the session cookie first-party (API proxy or shared custom domain)
- Broaden test coverage to routes, authorization and booking rules

## Project Status

StayFinder is a full-stack project demonstrating frontend development, REST API design, authentication and authorization, database integration and booking management.