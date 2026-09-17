"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, Loader2, Trash2, Image as ImageIcon, Video } from "lucide-react";

interface MediaFile {
  url: string;
  kind: "image" | "video";
  size: number;
  name: string;
}

export function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const res = await fetch("/api/media");
    const data = await res.json();
    setFiles(data.files);
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const fd = new FormData();
      fd.append("file", file);
      await fetch("/api/upload", { method: "POST", body: fd });
    }
    await load();
    setUploading(false);
  };

  const del = async (url: string) => {
    if (!confirm("Delete this file?")) return;
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    await load();
  };

  const filtered = files?.filter((f) => filter === "all" || f.kind === filter) ?? [];
  const totalSize = files?.reduce((s, f) => s + f.size, 0) ?? 0;

  if (!files) {
    return <div className="grid h-40 place-items-center text-slate-400"><Loader2 className="size-5 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:opacity-60"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
          {uploading ? "Uploading…" : "Upload files"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          multiple
          hidden
          onChange={(e) => upload(e.target.files)}
        />

        <div className="flex gap-1.5">
          {(["all", "image", "video"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filter === f ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f === "all" ? "All" : f === "image" ? "Images" : "Videos"}
            </button>
          ))}
        </div>

        <p className="ml-auto text-xs text-slate-500">
          {filtered.length} file{filtered.length !== 1 ? "s" : ""} · {(totalSize / 1024 / 1024).toFixed(1)} MB total
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
          No files uploaded yet.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {filtered.map((f) => (
            <div key={f.url} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {f.kind === "image" ? (
                <Image src={f.url} alt={f.name} fill className="object-cover" sizes="20vw" />
              ) : (
                <div className="grid h-full place-items-center bg-slate-800">
                  <Video className="size-8 text-brand-400" />
                </div>
              )}
              <button
                onClick={() => del(f.url)}
                aria-label="Delete"
                className="absolute bottom-2 right-2 grid size-7 place-items-center rounded-full bg-red-600 text-white opacity-0 shadow-lg transition group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
              <span className="absolute bottom-2 left-2 max-w-[calc(100%-2.5rem)] truncate rounded bg-black/60 px-2 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                {f.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}