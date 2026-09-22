import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSessionUser } from "@/lib/auth";
import { findUserById, findUserByEmail, updateUser, deleteUser } from "@/lib/db";
import type { Role } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const target = await findUserById(id);
    if (!target) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const data: Partial<{
      name: string;
      email: string;
      phone: string | null;
      passwordHash: string;
      role: Role;
    }> = {};

    if (body.name) data.name = body.name;
    if (body.email && body.email.toLowerCase() !== target.email) {
      const conflict = await findUserByEmail(body.email.toLowerCase());
      if (conflict) {
        return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
      }
      data.email = body.email.toLowerCase();
    }
    if (body.phone !== undefined) data.phone = body.phone ?? null;
    if (body.role && ["ADMIN", "USER", "LANDLORD"].includes(body.role)) {
      data.role = body.role as Role;
    }
    if (body.password) {
      data.passwordHash = await bcrypt.hash(body.password, 10);
    }

    const updated = await updateUser(id, data);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        phone: updated.phone,
        createdAt: updated.createdAt,
      },
    });
  } catch (err) {
    console.error("update user", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  try {
    const { id } = await params;
    if (id === user.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    await deleteUser(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete user", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}