import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { properties: true, bookings: true } } },
  });

  return NextResponse.json({ users });
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

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

    const created = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: await bcrypt.hash(password, 10),
        role: role as Role,
        phone: phone || null,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (err) {
    console.error("create user", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}