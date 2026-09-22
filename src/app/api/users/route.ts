import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSessionUser } from "@/lib/auth";
import {
  listUsers,
  findUserByEmail,
  createUser,
  countProperties,
  countVisitBookings,
} from "@/lib/db";
import type { Role } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  try {
    const users = await listUsers();
    const withCounts = await Promise.all(
      users.map(async (u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        avatar: u.avatar,
        createdAt: u.createdAt,
        _count: {
          properties: await countProperties({ landlordId: u.id }),
          bookings: await countVisitBookings({ userId: u.id }),
        },
      }))
    );

    return NextResponse.json({ users: withCounts });
  } catch (err) {
    console.error("list users", err);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, password, role, phone } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!["ADMIN", "USER", "LANDLORD"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const existing = await findUserByEmail(email.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const created = await createUser({
      name,
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
      role: role as Role,
      phone: phone || null,
    });

    return NextResponse.json(
      {
        user: {
          id: created.id,
          name: created.name,
          email: created.email,
          role: created.role,
          createdAt: created.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("create user", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
