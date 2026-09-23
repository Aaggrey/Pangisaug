import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  // Neon's compute autosuspends after 5 idle minutes; the first query after a
  // wake-up has to establish a fresh SSL connection, which can take >10s.
  // Bumping connectTimeoutMillis past that window lets the cold start finish
  // instead of aborting with "connection terminated due to connection timeout".
  // maxUses recycles pooled sockets before Neon's server-side lifetime cap
  // kills them mid-query (its default is ~5 minutes per pooled connection).
  maxUses: 2000,
});

// ---------------------------------------------------------------------------
// Row types (mirror the shapes the app's consumers dereference)
// ---------------------------------------------------------------------------

export type Role = "ADMIN" | "USER" | "LANDLORD";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  avatar: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { properties: number; bookings: number };
}

export interface PropertyImageRow {
  id: string;
  propertyId: string;
  url: string;
  isCover: boolean;
  createdAt: Date;
}

export interface PropertyRow {
  id: string;
  landlordId: string;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  province: string | null;
  status: "PENDING_PAYMENT" | "ACTIVE" | "INACTIVE";
  listingType: "SALE" | "RENT";
  propertyType?: string | null;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number | null;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  videoUrl?: string | null;
  landlord?: { id: string; name: string; email: string; avatar: string | null; phone?: string | null };
  images?: PropertyImageRow[];
}

export interface PaymentRow {
  id: string;
  landlordId: string;
  propertyId: string;
  amount: number;
  reference: string;
  gatewayRef: string | null;
  method: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: Date;
  paidAt: Date | null;
  property?: { id: string; title: string; landlordId?: string };
  landlord?: { id: string; name: string; email: string };
}

export interface VisitBookingRow {
  id: string;
  userId: string;
  propertyId: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  preferredDate: Date;
  timeSlot: string;
  visitorName?: string | null;
  phone?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  property?: {
    id: string;
    title: string;
    city: string;
    address?: string;
    price?: number;
    images?: PropertyImageRow[];
    landlord?: { id: string; name: string; email: string; phone?: string | null };
    landlordId?: string;
  };
  user?: { id: string; name: string; email: string };
}

// ---------------------------------------------------------------------------
// Core query helpers
// ---------------------------------------------------------------------------

type QueryRow = Record<string, unknown>;

async function run<T extends QueryRow = QueryRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await pool.query<T>(text, params as never[]);
  return res.rows;
}

// Numeric columns arrive as strings from pg; parse the ones we care about.
function num(v: unknown): number {
  return typeof v === "number" ? v : parseInt(String(v ?? 0), 10) || 0;
}

function bool(v: unknown): boolean {
  return v === true || v === 1 || String(v).toLowerCase() === "true";
}

function asBool(v: unknown): boolean {
  return bool(v);
}

function str(v: unknown): string | null {
  return v == null ? null : String(v);
}

function date(v: unknown): Date {
  return v instanceof Date ? v : new Date(v as string);
}

function textLike(v: unknown): { contains?: string } {
  return { contains: str(v) ?? undefined };
}

export function isDbError(err: unknown): err is { code?: string; message: string } {
  return typeof err === "object" && err !== null && "message" in err;
}

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

export interface PropertyQuery {
  status?: string;
  featured?: boolean;
  listingType?: string;
  intendedListerType?: string;
  city?: string;
  q?: string;
  location?: string;
  bedrooms?: number;
  min?: number;
  max?: number;
  take?: number;
  skip?: number;
  landlordId?: string;
  featuredOnly?: boolean;
  orderBy?: "createdAtDesc" | "featuredDesc";
  includeLandlord?: boolean;
  includeImages?: boolean;
}

export async function findProperties(opts: PropertyQuery = {}): Promise<PropertyRow[]> {
  const conds: string[] = [];
  const params: unknown[] = [];
  const p = () => params.length + 1;

  if (opts.status) {
    conds.push(`"status" = $${p()}`); params.push(opts.status);
  }
  if (opts.listingType) {
    conds.push(`"listingType" = $${p()}`); params.push(opts.listingType);
  }
  if (opts.intendedListerType) {
    conds.push(`"status" = $${p()}`); params.push("ACTIVE");
  }
  if (opts.featuredOnly) {
    conds.push(`"featured" = true`);
  }
  if (opts.landlordId) {
    conds.push(`"landlordId" = $${p()}`); params.push(opts.landlordId);
  }
  if (opts.city) {
    conds.push(`"city" = $${p()}`); params.push(opts.city);
  }
  if (opts.q) {
    conds.push(`("title" ILIKE $${p()} OR "description" ILIKE $${p()})`);
    const like = `%${opts.q}%`;
    params.push(like, like);
  }
  const hasSearch = opts.q || opts.location;
  if (hasSearch) {
    const loc = opts.location ?? opts.q ?? "";
    conds.push(
      `("city" ILIKE $${p()} OR "province" ILIKE $${p()} OR "address" ILIKE $${p()} OR "title" ILIKE $${p()})`
    );
    const like = `%${loc}%`;
    params.push(like, like, like, like);
  }
  if (opts.bedrooms) {
    conds.push(`"bedrooms" >= $${p()}`); params.push(opts.bedrooms);
  }
  if (opts.min) {
    conds.push(`"price" >= $${p()}`); params.push(opts.min);
  }
  if (opts.max) {
    conds.push(`"price" <= $${p()}`); params.push(opts.max);
  }

  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const order =
    opts.orderBy === "featuredDesc"
      ? `ORDER BY "featured" DESC, "createdAt" DESC`
      : `ORDER BY "createdAt" DESC`;
  const limit = opts.take ? `LIMIT ${opts.take}` : "";
  const offset = opts.skip ? `OFFSET ${opts.skip}` : "";

  const rows = await run(
    `SELECT * FROM "Property" ${where} ${order} ${limit} ${offset}`,
    params
  );

  const list: PropertyRow[] = rows.map((r) => ({
    id: String(r.id),
    landlordId: String(r.landlordId),
    title: String(r.title),
    description: String(r.description),
    price: num(r.price),
    address: String(r.address),
    city: String(r.city),
    province: str(r.province),
    status: String(r.status) as PropertyRow["status"],
    listingType: String(r.listingType) as "SALE" | "RENT",
    propertyType: str(r.propertyType),
    bedrooms: num(r.bedrooms),
    bathrooms: num(r.bathrooms),
    areaSqm: r.areaSqm == null ? null : num(r.areaSqm),
    featured: asBool(r.featured),
    createdAt: date(r.createdAt),
    updatedAt: date(r.updatedAt),
    videoUrl: str(r.videoUrl),
  }));

  if (opts.includeImages || opts.includeLandlord) {
    for (const prop of list) {
      if (opts.includeImages) {
        const imgRows = await run(
          `SELECT id, "propertyId", url, "isCover", "createdAt" FROM "PropertyImage" WHERE "propertyId" = $1 ORDER BY "isCover" DESC`,
          [prop.id]
        );
        prop.images = imgRows.map((im) => ({
          id: String(im.id),
          propertyId: String(im.propertyId),
          url: String(im.url),
          isCover: asBool(im.isCover),
          createdAt: date(im.createdAt),
        }));
      }
      if (opts.includeLandlord) {
        const lr = (
          await run(
            `SELECT id, name, email, avatar, phone FROM "User" WHERE id = $1`,
            [prop.landlordId]
          )
        )[0];
        if (lr) {
          prop.landlord = {
            id: String(lr.id),
            name: String(lr.name),
            email: String(lr.email),
            avatar: str(lr.avatar),
            phone: str(lr.phone),
          };
        }
      }
    }
  }

  return list;
}

export interface PropertyDetail extends PropertyRow {
  landlord?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    phone?: string | null;
  };
  images: PropertyImageRow[];
}

export async function findPropertyById(id: string): Promise<PropertyRow | null> {
  const rows = await findProperties({ status: undefined, landlordId: undefined, take: undefined, skip: undefined });
  const found = rows.find((r) => r.id === id);
  if (!found) return null;
  return found;
}

export async function getPropertyDetail(id: string): Promise<PropertyRow & { images: PropertyImageRow[]; landlord?: PropertyDetail["landlord"] } | null> {
  const prop = await findPropertyById(id);
  if (!prop) return null;
  const rows = await run(
    `SELECT * FROM "Property" WHERE id = $1`,
    [id]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  const out: PropertyRow & { images: PropertyImageRow[]; landlord?: PropertyDetail["landlord"] } = {
    id: String(r.id),
    landlordId: String(r.landlordId),
    title: String(r.title),
    description: String(r.description),
    price: num(r.price),
    address: String(r.address),
    city: String(r.city),
    province: str(r.province),
    status: String(r.status) as PropertyRow["status"],
    listingType: String(r.listingType) as "SALE" | "RENT",
    propertyType: str(r.propertyType),
    bedrooms: num(r.bedrooms),
    bathrooms: num(r.bathrooms),
    areaSqm: r.areaSqm == null ? null : num(r.areaSqm),
    featured: asBool(r.featured),
    createdAt: date(r.createdAt),
    updatedAt: date(r.updatedAt),
    videoUrl: str(r.videoUrl),
    images: [],
  };
  const imgRows = await run(
    `SELECT id, "propertyId", url, "isCover", "createdAt" FROM "PropertyImage" WHERE "propertyId" = $1 ORDER BY "isCover" DESC`,
    [id]
  );
  out.images = imgRows.map((im) => ({
    id: String(im.id),
    propertyId: String(im.propertyId),
    url: String(im.url),
    isCover: asBool(im.isCover),
    createdAt: date(im.createdAt),
  }));
  const lr = (
    await run(`SELECT id, name, email, avatar, phone FROM "User" WHERE id = $1`, [prop.landlordId])
  )[0];
  if (lr) {
    out.landlord = {
      id: String(lr.id),
      name: String(lr.name),
      email: String(lr.email),
      avatar: str(lr.avatar),
      phone: str(lr.phone),
    };
  }
  return out;
}

export async function createProperty(input: {
  landlordId: string;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  province?: string | null;
  bedrooms: number;
  bathrooms: number;
  areaSqm?: number | null;
  listingType: "SALE" | "RENT";
  status: string;
  videoUrl?: string | null;
  featured?: boolean;
  images?: { url: string; isCover?: boolean }[];
}): Promise<PropertyRow & { images: PropertyImageRow[] }> {
  const res = await run(
    `INSERT INTO "Property" ("landlordId", title, description, price, address, city, province, bedrooms, bathrooms, "areaSqm", "listingType", status, "videoUrl", featured, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now(), now())
     RETURNING id`,
    [
      input.landlordId,
      input.title,
      input.description,
      input.price,
      input.address,
      input.city,
      input.province ?? null,
      input.bedrooms,
      input.bathrooms,
      input.areaSqm ?? null,
      input.listingType,
      input.status,
      input.videoUrl ?? null,
      input.featured ?? false,
    ]
  );
  const id = String(res[0].id);
  if (input.images?.length) {
    for (const img of input.images) {
      await run(
        `INSERT INTO "PropertyImage" ("propertyId", url, "isCover", "createdAt") VALUES ($1,$2,$3, now())`,
        [id, img.url, img.isCover ?? false]
      );
    }
  }
  return (await getPropertyDetail(id)) as PropertyRow & { images: PropertyImageRow[] };
}

export async function updateProperty(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    price: number;
    address: string;
    city: string;
    province: string | null;
    bedrooms: number;
    bathrooms: number;
    areaSqm: number | null;
    listingType: string;
    status: string;
    videoUrl: string | null;
    featured: boolean;
    images?: { url: string; isCover?: boolean }[];
  }>
): Promise<PropertyRow & { images: PropertyImageRow[] } | null> {
  const sets: string[] = [];
  const params: unknown[] = [id];
  const val: Record<string, unknown> = { ...data };
  delete (val as { images?: unknown }).images;
  for (const [k, v] of Object.entries(val)) {
    sets.push(`"${k}" = $${params.length + 1}`);
    params.push(v);
  }
  sets.push(`"updatedAt" = now()`);
  await run(`UPDATE "Property" SET ${sets.join(", ")} WHERE id = $1`, params);
  return getPropertyDetail(id);
}

export async function deleteProperty(id: string): Promise<void> {
  await run(`DELETE FROM "PropertyImage" WHERE "propertyId" = $1`, [id]);
  await run(`DELETE FROM "Property" WHERE id = $1`, [id]);
}

export async function countProperties(opts: { status?: string; landlordId?: string } = {}): Promise<number> {
  const conds: string[] = [];
  const params: unknown[] = [];
  const p = () => params.length + 1;
  if (opts.status) { conds.push(`"status" = $${p()}`); params.push(opts.status); }
  if (opts.landlordId) { conds.push(`"landlordId" = $${p()}`); params.push(opts.landlordId); }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const rows = await run(`SELECT COUNT(*)::int AS c FROM "Property" ${where}`, params);
  return num(rows[0]?.c);
}

export async function distinctCities(): Promise<string[]> {
  const rows = await run(`SELECT DISTINCT city FROM "Property" WHERE status = 'ACTIVE'`);
  return rows.map((r) => String(r.city));
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await run(`SELECT * FROM "User" WHERE email = $1`, [email]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return mapUserRow(r);
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const rows = await run(`SELECT * FROM "User" WHERE id = $1`, [id]);
  if (rows.length === 0) return null;
  return mapUserRow(rows[0]);
}

function mapUserRow(r: QueryRow): UserRow {
  return {
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    passwordHash: String(r.passwordHash),
    role: String(r.role) as Role,
    avatar: str(r.avatar),
    phone: str(r.phone),
    createdAt: date(r.createdAt),
    updatedAt: date(r.updatedAt),
  };
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  phone?: string | null;
  avatar?: string | null;
}): Promise<UserRow & { _count?: { properties: number; bookings: number } }> {
  const rows = await run(
    `INSERT INTO "User" (name, email, "passwordHash", role, phone, avatar, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6, now(), now()) RETURNING *`,
    [input.name, input.email, input.passwordHash, input.role, input.phone ?? null, input.avatar ?? null]
  );
  return mapUserRow(rows[0]);
}

export async function updateUser(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string | null;
    passwordHash: string;
    role: Role;
    avatar: string | null;
  }>
): Promise<UserRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [id];
  for (const [k, v] of Object.entries(data)) {
    sets.push(`"${k}" = $${params.length + 1}`);
    params.push(v);
  }
  sets.push(`"updatedAt" = now()`);
  await run(`UPDATE "User" SET ${sets.join(", ")} WHERE id = $1`, params);
  return findUserById(id);
}

export async function deleteUser(id: string): Promise<void> {
  await run(`DELETE FROM "User" WHERE id = $1`, [id]);
}

export async function listUsers(): Promise<UserRow[]> {
  const rows = await run(`SELECT * FROM "User" ORDER BY "createdAt" DESC`);
  return rows.map(mapUserRow);
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export async function findPaymentById(id: string): Promise<PaymentRow | null> {
  const rows = await run(`SELECT * FROM "Payment" WHERE id = $1`, [id]);
  if (rows.length === 0) return null;
  return mapPaymentRow(rows[0]);
}

export async function findPaymentByReference(reference: string): Promise<PaymentRow | null> {
  const rows = await run(`SELECT * FROM "Payment" WHERE reference = $1`, [reference]);
  if (rows.length === 0) return null;
  return mapPaymentRow(rows[0]);
}

export async function findPendingPaymentByProperty(propertyId: string): Promise<PaymentRow | null> {
  const rows = await run(
    `SELECT * FROM "Payment" WHERE "propertyId" = $1 AND status = 'PENDING' LIMIT 1`,
    [propertyId]
  );
  return rows.length ? mapPaymentRow(rows[0]) : null;
}

function mapPaymentRow(r: QueryRow): PaymentRow {
  return {
    id: String(r.id),
    landlordId: String(r.landlordId),
    propertyId: String(r.propertyId),
    amount: num(r.amount),
    reference: String(r.reference),
    gatewayRef: str(r.gatewayRef),
    method: String(r.method),
    status: String(r.status) as PaymentRow["status"],
    createdAt: date(r.createdAt),
    paidAt: r.paidAt == null ? null : date(r.paidAt),
  };
}

export async function createPayment(input: {
  landlordId: string;
  propertyId: string;
  amount: number;
  reference: string;
  method: string;
  status?: string;
  gatewayRef?: string | null;
}): Promise<PaymentRow> {
  const rows = await run(
    `INSERT INTO "Payment" ("landlordId", "propertyId", amount, reference, "gatewayRef", method, status, "createdAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7, now()) RETURNING *`,
    [input.landlordId, input.propertyId, input.amount, input.reference, input.gatewayRef ?? null, input.method, input.status ?? "PENDING"]
  );
  return mapPaymentRow(rows[0]);
}

export async function updatePayment(
  id: string,
  data: Partial<{
    status: string;
    gatewayRef: string | null;
    paidAt: Date;
  }>
): Promise<PaymentRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [id];
  for (const [k, v] of Object.entries(data)) {
    sets.push(`"${k}" = $${params.length + 1}`);
    params.push(v);
  }
  await run(`UPDATE "Payment" SET ${sets.join(", ")} WHERE id = $1`, params);
  return findPaymentById(id);
}

export async function listPayments(opts: {
  landlordId?: string;
  limit?: number;
}): Promise<PaymentRow[]> {
  const conds: string[] = [];
  const params: unknown[] = [];
  const p = () => params.length + 1;
  if (opts.landlordId) { conds.push(`"landlordId" = $${p()}`); params.push(opts.landlordId); }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const limit = opts.limit ? `LIMIT ${opts.limit}` : "";
  const rows = await run(`SELECT * FROM "Payment" ${where} ORDER BY "createdAt" DESC ${limit}`, params);
  return rows.map(mapPaymentRow);
}

export async function countPayments(opts: { landlordId?: string } = {}): Promise<number> {
  const conds: string[] = [];
  const params: unknown[] = [];
  const p = () => params.length + 1;
  if (opts.landlordId) { conds.push(`"landlordId" = $${p()}`); params.push(opts.landlordId); }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const rows = await run(`SELECT COUNT(*)::int AS c FROM "Payment" ${where}`, params);
  return num(rows[0]?.c);
}

export async function sumPayments(opts: { landlordId?: string } = {}): Promise<number> {
  const conds: string[] = [];
  const params: unknown[] = [];
  const p = () => params.length + 1;
  if (opts.landlordId) { conds.push(`"landlordId" = $${p()}`); params.push(opts.landlordId); }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const rows = await run(`SELECT COALESCE(SUM(amount),0)::numeric AS s FROM "Payment" ${where}`, params);
  const s = String(rows[0]?.s ?? "0");
  return parseFloat(s) || 0;
}

// ---------------------------------------------------------------------------
// Visit bookings
// ---------------------------------------------------------------------------

export async function countVisitBookings(opts: {
  userId?: string;
  landlordId?: string;
  propertyId?: string;
} = {}): Promise<number> {
  const conds: string[] = [];
  const params: unknown[] = [];
  const p = () => params.length + 1;
  if (opts.userId) { conds.push(`"userId" = $${p()}`); params.push(opts.userId); }
  if (opts.propertyId) { conds.push(`"propertyId" = $${p()}`); params.push(opts.propertyId); }
  if (opts.landlordId) { conds.push(`"propertyId" IN (SELECT id FROM "Property" WHERE "landlordId" = $${p()})`); params.push(opts.landlordId); }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const rows = await run(`SELECT COUNT(*)::int AS c FROM "VisitBooking" ${where}`, params);
  return num(rows[0]?.c);
}

export async function findVisitBookingById(id: string): Promise<VisitBookingRow | null> {
  const rows = await run(`SELECT * FROM "VisitBooking" WHERE id = $1`, [id]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: String(r.id),
    userId: String(r.userId),
    propertyId: String(r.propertyId),
    status: String(r.status) as VisitBookingRow["status"],
    preferredDate: date(r.preferredDate),
    timeSlot: String(r.timeSlot),
    visitorName: str(r.visitorName),
    phone: str(r.phone),
    notes: str(r.notes),
    createdAt: date(r.createdAt),
    updatedAt: date(r.updatedAt),
  };
}

export async function createVisitBooking(input: {
  userId: string;
  propertyId: string;
  visitorName?: string | null;
  phone?: string | null;
  preferredDate: Date;
  timeSlot: string;
  notes?: string | null;
}): Promise<VisitBookingRow> {
  const rows = await run(
    `INSERT INTO "VisitBooking" ("userId", "propertyId", "visitorName", phone, "preferredDate", "timeSlot", notes, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7, now(), now()) RETURNING *`,
    [input.userId, input.propertyId, input.visitorName ?? null, input.phone ?? null, input.preferredDate, input.timeSlot, input.notes ?? null]
  );
  const r = rows[0];
  return {
    id: String(r.id),
    userId: String(r.userId),
    propertyId: String(r.propertyId),
    status: String(r.status) as VisitBookingRow["status"],
    preferredDate: date(r.preferredDate),
    timeSlot: String(r.timeSlot),
    visitorName: str(r.visitorName),
    phone: str(r.phone),
    notes: str(r.notes),
    createdAt: date(r.createdAt),
    updatedAt: date(r.updatedAt),
  };
}

export async function updateVisitBooking(
  id: string,
  data: Partial<{ status: string; notes: string | null }>
): Promise<VisitBookingRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [id];
  for (const [k, v] of Object.entries(data)) {
    sets.push(`"${k}" = $${params.length + 1}`);
    params.push(v);
  }
  sets.push(`"updatedAt" = now()`);
  await run(`UPDATE "VisitBooking" SET ${sets.join(", ")} WHERE id = $1`, params);
  return findVisitBookingById(id);
}

export async function listVisitBookingsForUser(userId: string): Promise<VisitBookingRow[]> {
  const rows = await run(`SELECT * FROM "VisitBooking" WHERE "userId" = $1 ORDER BY "createdAt" DESC`, [userId]);
  return rows.map((r) => ({
    id: String(r.id),
    userId: String(r.userId),
    propertyId: String(r.propertyId),
    status: String(r.status) as VisitBookingRow["status"],
    preferredDate: date(r.preferredDate),
    timeSlot: String(r.timeSlot),
    visitorName: str(r.visitorName),
    phone: str(r.phone),
    notes: str(r.notes),
    createdAt: date(r.createdAt),
    updatedAt: date(r.updatedAt),
  }));
}

export async function listVisitBookingsForLandlord(landlordId: string): Promise<VisitBookingRow[]> {
  const rows = await run(
    `SELECT vb.* FROM "VisitBooking" vb JOIN "Property" pr ON pr.id = vb."propertyId"
     WHERE pr."landlordId" = $1 ORDER BY vb."createdAt" DESC`,
    [landlordId]
  );
  return rows.map((r) => ({
    id: String(r.id),
    userId: String(r.userId),
    propertyId: String(r.propertyId),
    status: String(r.status) as VisitBookingRow["status"],
    preferredDate: date(r.preferredDate),
    timeSlot: String(r.timeSlot),
    visitorName: str(r.visitorName),
    phone: str(r.phone),
    notes: str(r.notes),
    createdAt: date(r.createdAt),
    updatedAt: date(r.updatedAt),
  }));
}

export async function listAllVisitBookings(): Promise<VisitBookingRow[]> {
  const rows = await run(`SELECT * FROM "VisitBooking" ORDER BY "createdAt" DESC`);
  return rows.map((r) => ({
    id: String(r.id),
    userId: String(r.userId),
    propertyId: String(r.propertyId),
    status: String(r.status) as VisitBookingRow["status"],
    preferredDate: date(r.preferredDate),
    timeSlot: String(r.timeSlot),
    visitorName: str(r.visitorName),
    phone: str(r.phone),
    notes: str(r.notes),
    createdAt: date(r.createdAt),
    updatedAt: date(r.updatedAt),
  }));
}

// ---------------------------------------------------------------------------
// Transaction helper (finalizePayment / failPayment atomicity)
// ---------------------------------------------------------------------------

export async function withTransaction<T>(
  fn: (
    q: {
      run: (text: string, params?: unknown[]) => Promise<void>;
      query: (text: string, params?: unknown[]) => Promise<QueryRow[]>;
    }
  ) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const q = {
      async run(text: string, params: unknown[] = []) {
        await client.query(text, params as never[]);
      },
      async query(text: string, params: unknown[] = []) {
        const res = await client.query(text, params as never[]);
        return res.rows as QueryRow[];
      },
    };
    const result = await fn(q);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/** Friendly alias kept for parity with prior code that used prisma.$transaction. */
export const $transaction = withTransaction;

// ---------------------------------------------------------------------------
// Image replacement (mirrors prisma property.update images create/set)
// ---------------------------------------------------------------------------

export async function replacePropertyImages(
  propertyId: string,
  images: { url: string; isCover?: boolean }[]
): Promise<void> {
  await run(`DELETE FROM "PropertyImage" WHERE "propertyId" = $1`, [propertyId]);
  for (const img of images) {
    await run(
      `INSERT INTO "PropertyImage" ("propertyId", url, "isCover", "createdAt") VALUES ($1,$2,$3, now())`,
      [propertyId, img.url, img.isCover ?? false]
    );
  }
}

// ---------------------------------------------------------------------------
// Payment creation that stores the mobile-money phone (initiate flow)
// ---------------------------------------------------------------------------

export async function createPaymentWithPhone(input: {
  landlordId: string;
  propertyId: string;
  amount: number;
  reference: string;
  method: string;
  phone?: string | null;
  status?: string;
}): Promise<PaymentRow> {
  const rows = await run(
    `INSERT INTO "Payment" ("landlordId", "propertyId", amount, reference, "gatewayRef", method, phone, status, "createdAt")
     VALUES ($1,$2,$3,$4,null,$5,$6,$7, now()) RETURNING *`,
    [input.landlordId, input.propertyId, input.amount, input.reference, input.method, input.phone ?? null, input.status ?? "PENDING"]
  );
  return mapPaymentRow(rows[0]);
}

// ---------------------------------------------------------------------------
// Bookings list/create that expose the email column like prisma did
// ---------------------------------------------------------------------------

export interface VisitBookingFullRow extends VisitBookingRow {
  email?: string | null;
}

export async function createVisitBookingWithEmail(input: {
  userId: string;
  propertyId: string;
  visitorName: string;
  phone: string;
  email: string;
  preferredDate: Date;
  timeSlot: string;
  notes?: string | null;
}): Promise<VisitBookingFullRow> {
  const rows = await run(
    `INSERT INTO "VisitBooking" ("userId", "propertyId", "visitorName", phone, email, "preferredDate", "timeSlot", notes, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now(), now()) RETURNING *`,
    [input.userId, input.propertyId, input.visitorName, input.phone, input.email, input.preferredDate, input.timeSlot, input.notes ?? null]
  );
  const r = rows[0];
  return {
    id: String(r.id),
    userId: String(r.userId),
    propertyId: String(r.propertyId),
    status: String(r.status) as VisitBookingRow["status"],
    preferredDate: date(r.preferredDate),
    timeSlot: String(r.timeSlot),
    visitorName: str(r.visitorName) ?? "",
    phone: str(r.phone) ?? "",
    email: str(r.email) ?? "",
    notes: str(r.notes),
    createdAt: date(r.createdAt),
    updatedAt: date(r.updatedAt),
  };
}

export async function listVisitBookingsFiltered(opts: {
  userId?: string;
  landlordId?: string;
} = {}): Promise<VisitBookingFullRow[]> {
  const conds: string[] = [];
  const params: unknown[] = [];
  const p = () => params.length + 1;
  const join = opts.landlordId ? `JOIN "Property" pr ON pr.id = vb."propertyId"` : "";
  if (opts.userId) {
    conds.push(`vb."userId" = $${p()}`); params.push(opts.userId);
  }
  if (opts.landlordId) {
    conds.push(`pr."landlordId" = $${p()}`); params.push(opts.landlordId);
  }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const rows = await run(
    `SELECT vb.* FROM "VisitBooking" vb ${join} ${where} ORDER BY vb."createdAt" DESC`,
    params
  );
  return rows.map((r) => ({
    id: String(r.id),
    userId: String(r.userId),
    propertyId: String(r.propertyId),
    status: String(r.status) as VisitBookingRow["status"],
    preferredDate: date(r.preferredDate),
    timeSlot: String(r.timeSlot),
    visitorName: str(r.visitorName) ?? "",
    phone: str(r.phone) ?? "",
    email: str(r.email) ?? "",
    notes: str(r.notes),
    createdAt: date(r.createdAt),
    updatedAt: date(r.updatedAt),
  }));
}

export default pool;
