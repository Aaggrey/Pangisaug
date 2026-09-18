import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN" && user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { blobs } = await list({ prefix: "uploads/" });

  const files = blobs.map((b) => {
    const isVideo = b.pathname.includes("/videos/");
    return {
      url: b.url,
      kind: isVideo ? "video" : "image",
      size: b.size,
      name: b.pathname.split("/").pop() ?? b.url,
    };
  });

  files.sort((a, b) => b.name.localeCompare(a.name));

  return NextResponse.json({ files, isAdmin: user.role === "ADMIN" });
}
