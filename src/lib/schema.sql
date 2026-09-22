-- ---------------------------------------------------------------------------
-- Pangisaug schema (Neon / node-postgres; Prisma removed)
-- Authoritative source of truth: this file. Column sets mirror the
-- INSERT / UPDATE / SELECT lists used across src/lib/db.ts exactly.
-- Idempotent: safe to run on every deploy/bootstrap.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "User" (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  email         text NOT NULL UNIQUE,
  "passwordHash" text NOT NULL,
  role          text NOT NULL DEFAULT 'USER',
  avatar        text,
  phone         text,
  "createdAt"   timestamptz NOT NULL DEFAULT now(),
  "updatedAt"   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Property" (
  id           text PRIMARY KEY,
  "landlordId" text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text NOT NULL,
  price        numeric NOT NULL,
  address      text NOT NULL,
  city         text NOT NULL,
  province     text,
  bedrooms     integer NOT NULL,
  bathrooms    integer NOT NULL,
  "areaSqm"    numeric,
  "listingType" text NOT NULL DEFAULT 'SALE',
  status       text NOT NULL DEFAULT 'PENDING_PAYMENT',
  "videoUrl"   text,
  featured     boolean NOT NULL DEFAULT false,
  "createdAt"  timestamptz NOT NULL DEFAULT now(),
  "updatedAt"  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Property_landlordId_idx" ON "Property"("landlordId");

CREATE TABLE IF NOT EXISTS "PropertyImage" (
  id          text PRIMARY KEY,
  "propertyId" text NOT NULL REFERENCES "Property"(id) ON DELETE CASCADE,
  url         text NOT NULL,
  "isCover"   boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT now()
());

CREATE TABLE IF NOT EXISTS "Payment" (
  id           text PRIMARY KEY,
  "landlordId" text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "propertyId" text NOT NULL REFERENCES "Property"(id) ON DELETE CASCADE,
  amount       numeric NOT NULL,
  reference    text NOT NULL UNIQUE,
  "gatewayRef" text,
  method       text,
  phone        text,
  status       text NOT NULL DEFAULT 'PENDING',
  "paidAt"     timestamptz,
  "createdAt"  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "VisitBooking" (
  id             text PRIMARY KEY,
  "userId"       text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "propertyId"   text NOT NULL REFERENCES "Property"(id) ON DELETE CASCADE,
  "visitorName"  text NOT NULL,
  phone          text NOT NULL,
  email          text NOT NULL,
  "preferredDate" text NOT NULL,
  "timeSlot"     text NOT NULL,
  notes          text,
  status         text NOT NULL DEFAULT 'PENDING',
  "createdAt"    timestamptz NOT NULL DEFAULT now(),
  "updatedAt"    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "VisitBooking_propertyId_idx" ON "VisitBooking"("propertyId");
