import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const { id } = await params;
  const { featured } = await req.json();

  const property = await prisma.property.update({
    where: { id },
    data: { featured: Boolean(featured) },
  });

  return NextResponse.json({ property });
}