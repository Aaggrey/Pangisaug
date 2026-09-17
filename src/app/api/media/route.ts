import { NextResponse } from "next/server";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN" && user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const base = path.join(process.cwd(), "public", "uploads");
  const files: { url: string; kind: "image" | "video"; size: number; name: string }[] = [];

  for (const kind of ["images", "videos"] as const) {
    try {
      const dir = path.join(base, kind);
      const entries = await readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        if (!e.isFile()) continue;
        const s = await stat(path.join(dir, e.name));
        files.push({
          url: `/uploads/${kind}/${e.name}`,
          kind: kind === "videos" ? "video" : "image",
          size: s.size,
          name: e.name,
        });
      }
    } catch {
      // directory missing
    }
  }

  files.sort((a, b) => b.name.localeCompare(a.name));

  return NextResponse.json({ files, isAdmin: user.role === "ADMIN" });
}