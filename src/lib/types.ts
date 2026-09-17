import type { User as PrismaUser, Property, PropertyImage, VisitBooking } from "@prisma/client";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

export type Role = "ADMIN" | "USER" | "LANDLORD";

export type PropertyWithRelations = Property & {
  landlord: Pick<PrismaUser, "id" | "name" | "email" | "avatar">;
  images: PropertyImage[];
};

export type BookingWithRelations = VisitBooking & {
  property: Property & { landlord: PrismaUser; images: PropertyImage[] };
};

export const LISTING_FEE = 100000; // UGX listing fee per property