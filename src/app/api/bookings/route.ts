import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role === "ADMIN") {
    const bookings = await prisma.visitBooking.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            images: { take: 1 },
            landlord: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    return NextResponse.json({ bookings });
  }

  if (user.role === "LANDLORD") {
    const bookings = await prisma.visitBooking.findMany({
      where: { property: { landlordId: user.id } },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        property: {
          select: { id: true, title: true, city: true, images: { take: 1 } },
        },
      },
    });
    return NextResponse.json({ bookings });
  }

  const bookings = await prisma.visitBooking.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          address: true,
          price: true,
          images: { take: 1 },
          landlord: { select: { name: true } },
        },
      },
    },
  });
  return NextResponse.json({ bookings });
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

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property || property.status !== "ACTIVE") {
      return NextResponse.json({ error: "This property is not available" }, { status: 400 });
    }
    if (property.landlordId === user.id) {
      return NextResponse.json({ error: "You cannot book your own property" }, { status: 400 });
    }

    const booking = await prisma.visitBooking.create({
      data: {
        userId: user.id,
        propertyId,
        visitorName,
        phone,
        email: email || user.email,
        preferredDate,
        timeSlot,
        notes: notes || null,
      },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    console.error("create booking", err);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}