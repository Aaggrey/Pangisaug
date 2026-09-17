import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(["USER", "LANDLORD"]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid registration data" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        phone: parsed.data.phone,
        role: parsed.data.role,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("register error", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}