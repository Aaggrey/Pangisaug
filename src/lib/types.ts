import type {
  Role,
  UserRow,
  PropertyRow,
  PropertyImageRow,
  PaymentRow,
  VisitBookingRow,
} from "@/lib/db";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
}

export interface SessionUserJwt extends SessionUser {
  passwordHash?: string;
  phone?: string | null;
  createdAt?: Date;
}

export type SessionUserPublic = Pick<SessionUser, "id" | "name" | "email" | "role" | "avatar">;

export function toSessionUser(u: UserRow): SessionUserPublic {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
  };
}

export type PropertyWithImages = PropertyRow;

export type PropertyWithRelations = PropertyRow & { images: PropertyImageRow[] };

export const LISTING_FEE = 100000;

export type RoleName = Role;

export type ListingType = "SALE" | "RENT";
