import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  countProperties,
  countVisitBookings,
  countPayments,
  sumPayments,
} from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = user.role === "ADMIN";

  const [properties, bookings, payments, totalRevenue] = await Promise.all([
    countProperties({ landlordId: isAdmin ? undefined : user.id }),
    countVisitBookings({
      ...(isAdmin ? {} : user.role === "USER" ? { userId: user.id } : { landlordId: user.id }),
    }),
    countPayments({ landlordId: isAdmin ? undefined : user.id }),
    sumPayments({ landlordId: isAdmin ? undefined : user.id }),
  ]);

  return NextResponse.json({
    userRole: user.role,
    properties,
    bookings,
    payments,
    totalRevenue,
  });
}
