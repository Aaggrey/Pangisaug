import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, string> = {};
  if (body.name) data.name = body.name;
  if (body.email && body.email.toLowerCase() !== target.email) {
    const conflicting = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (conflicting) {
      return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
    }
    data.email = body.email.toLowerCase();
  }
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.role && ["ADMIN", "USER", "LANDLORD"].includes(body.role)) {
    data.role = body.role as Role;
  }
  if (body.password) {
    data.passwordHash = await bcrypt.hash(body.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
  });

  return NextResponse.json({ user: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}