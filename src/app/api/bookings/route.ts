import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  listVisitBookingsFiltered,
  createVisitBookingWithEmail,
  findPropertyById,
  getPropertyDetail,
  findUserById,
} from "@/lib/db";
import type { VisitBookingFullRow } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let bookings: VisitBookingFullRow[];
  if (user.role === "ADMIN") {
    bookings = await listVisitBookingsFiltered({});
  } else if (user.role === "LANDLORD") {
    bookings = await listVisitBookingsFiltered({ landlordId: user.id });
  } else {
    bookings = await listVisitBookingsFiltered({ userId: user.id });
  }

  const enriched = await Promise.all(
    bookings.map(async (b) => {
      const detail = await getPropertyDetail(b.propertyId);
      const booker = await findUserById(b.userId);
      const base = {
        id: b.id,
        userId: b.userId,
        propertyId: b.propertyId,
        status: b.status,
        preferredDate: b.preferredDate,
        timeSlot: b.timeSlot,
        visitorName: b.visitorName ?? null,
        phone: b.phone ?? null,
        email: b.email ?? null,
        notes: b.notes ?? null,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      };

      if (user.role === "ADMIN") {
        return {
          ...base,
          user: booker ? { id: booker.id, name: booker.name, email: booker.email } : null,
          property: detail
            ? {
                id: detail.id,
                title: detail.title,
                city: detail.city,
                images: detail.images.slice(0, 1),
                landlord: detail.landlord
                  ? { id: detail.landlord.id, name: detail.landlord.name, email: detail.landlord.email }
                  : undefined,
              }
            : undefined,
        };
      }

      if (user.role === "LANDLORD") {
        return {
          ...base,
          user: booker ? { id: booker.id, name: booker.name, email: booker.email } : null,
          property: detail
            ? {
                id: detail.id,
                title: detail.title,
                city: detail.city,
                images: detail.images.slice(0, 1),
              }
            : undefined,
        };
      }

      return {
        ...base,
        property: detail
          ? {
              id: detail.id,
              title: detail.title,
              city: detail.city,
              address: detail.address,
              price: detail.price,
              images: detail.images.slice(0, 1),
              landlord: detail.landlord ? { name: detail.landlord.name } : undefined,
            }
          : undefined,
      };
    })
  );

  return NextResponse.json({ bookings: enriched });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "LANDLORD") {
    return NextResponse.json({ error: "Sign up as a user to book visits" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { propertyId, visitorName, phone, email, preferredDate, timeSlot, notes } = body;

    if (!propertyId || !visitorName || !phone || !preferredDate || !timeSlot) {
      return NextResponse.json({ error: "Please fill in the required fields" }, { status: 400 });
    }

    const property = await findPropertyById(propertyId);
    if (!property || property.status !== "ACTIVE") {
      return NextResponse.json({ error: "This property is not available" }, { status: 400 });
    }
    if (property.landlordId === user.id) {
      return NextResponse.json({ error: "You cannot book your own property" }, { status: 400 });
    }

    const booking = await createVisitBookingWithEmail({
      userId: user.id,
      propertyId,
      visitorName: String(visitorName),
      phone: String(phone),
      email: email || user.email,
      preferredDate: new Date(String(preferredDate)),
      timeSlot,
      notes: notes || null,
    });

    return NextResponse.json(
      { booking: { ...booking, email: email || user.email } },
      { status: 201 }
    );
  } catch (err) {
    console.error("create booking", err);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}