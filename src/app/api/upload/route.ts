import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getSessionUser } from "@/lib/auth";

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "LANDLORD" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only landlords and admins can upload media" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const maxSize = 15 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: "File is too large (max 15MB)" }, { status: 400 });
  }

  const isImage = ALLOWED_IMAGE.includes(file.type);
  const isVideo = ALLOWED_VIDEO.includes(file.type);
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const kind = isVideo ? "videos" : "images";
  const ext = path.extname(file.name) || (isImage ? ".jpg" : ".mp4");

  const pathname = `uploads/${kind}/${randomUUID()}${ext}`;
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  const filename = pathname.split("/").pop() ?? "";
  return NextResponse.json({
    url: blob.url,
    kind: isVideo ? "video" : "image",
    filename,
  });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const { url } = await req.json();
  if (!url || typeof url !== "string" || !url.startsWith("https://")) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  try {
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Blob not found" }, { status: 404 });
  }
}
