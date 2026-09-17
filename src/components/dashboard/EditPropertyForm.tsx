"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, CheckCircle2, ImagePlus, Trash2, X, Video, Save } from "lucide-react";

const labelCls = "mb-1 block text-xs font-semibold text-slate-500";
const inputCls =
  "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:opacity-50";

export function EditPropertyForm({ propertyId, isAdmin }: { propertyId: string; isAdmin: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ error?: string; ok?: string } | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    address: "",
    city: "",
    province: "",
    bedrooms: "",
    bathrooms: "",
    areaSqm: "",
    listingType: "RENT",
    videoUrl: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [landlordName, setLandlordName] = useState("");

  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Not found");
        const p = data.property;
        setForm({
          title: p.title,
          description: p.description,
          price: String(p.price),
          address: p.address,
          city: p.city,
          province: p.province ?? "",
          bedrooms: String(p.bedrooms),
          bathrooms: String(p.bathrooms),
          areaSqm: p.areaSqm ? String(p.areaSqm) : "",
          listingType: p.listingType,
          videoUrl: p.videoUrl ?? "",
        });
        setImages(p.images.map((i: { url: string }) => i.url));
        setLandlordName(p.landlord?.name ?? "");
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [propertyId]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const uploadFiles = async (files: FileList | null, kind: "image" | "video") => {
    if (!files || files.length === 0) return;
    setUploading(kind);
    setMessage(null);
    try {
      for (const file of Array.from(files).slice(0, 10)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        if (kind === "image") {
          setImages((arr) => (arr.length < 10 ? [...arr, data.url] : arr));
        } else {
          setForm((f) => ({ ...f, videoUrl: data.url }));
        }
      }
    } catch (e) {
      setMessage({ error: e instanceof Error ? e.message : "Upload failed" });
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    setMessage(null);
    if (!form.title || !form.price || !form.address || !form.city) {
      setMessage({ error: "Please fill in title, price, address, and city." });
      return;
    }
    if (images.length === 0) {
      setMessage({ error: "At least one image is required." });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseInt(form.price, 10),
          bedrooms: parseInt(form.bedrooms || "0", 10),
          bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : 0,
          areaSqm: form.areaSqm ? parseFloat(form.areaSqm) : null,
          videoUrl: form.videoUrl || null,
          images: images.map((url, idx) => ({ url, isCover: idx === 0 })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setMessage({ ok: "Property updated successfully." });
      setTimeout(() => router.push("/dashboard?tab=properties"), 1200);
    } catch (e) {
      setMessage({ error: e instanceof Error ? e.message : "Failed to update" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="grid h-48 place-items-center text-slate-400"><Loader2 className="size-5 animate-spin" /></div>;
  }

  if (notFound) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-600">
        Property not found or you do not have access to edit it.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {message?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{message.error}</p>
      )}
      {message?.ok && (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="size-4 shrink-0" /> {message.ok}
        </p>
      )}

      {isAdmin && landlordName && (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
          Editing as Administrator · Property owner: <span className="font-semibold">{landlordName}</span>
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">Property details</h2>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className={labelCls}>Title *</span>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Description *</span>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className={inputCls} />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className={labelCls}>Price (UGX) *</span>
              <input value={form.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} className={inputCls} inputMode="numeric" />
            </label>
            <label className="block">
              <span className={labelCls}>Listing type *</span>
              <select value={form.listingType} onChange={(e) => set("listingType", e.target.value)} className={inputCls}>
                <option value="RENT">For rent (monthly)</option>
                <option value="SALE">For sale</option>
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Area (m²)</span>
              <input value={form.areaSqm} onChange={(e) => set("areaSqm", e.target.value.replace(/[^\d.]/g, ""))} className={inputCls} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className={labelCls}>Address *</span>
              <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className={labelCls}>City *</span>
              <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className={labelCls}>Province / District</span>
              <input value={form.province} onChange={(e) => set("province", e.target.value)} className={inputCls} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className={labelCls}>Bedrooms *</span>
              <input value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value.replace(/\D/g, ""))} className={inputCls} inputMode="numeric" />
            </label>
            <label className="block">
              <span className={labelCls}>Bathrooms</span>
              <input value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value.replace(/[^\d.]/g, ""))} className={inputCls} />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">Photos</h2>
        <p className="text-sm text-slate-500">Up to 10 images. The first image is the cover.</p>
        <input ref={imageInput} type="file" accept="image/*" multiple hidden onChange={(e) => uploadFiles(e.target.files, "image")} />
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((url, i) => (
            <div key={url} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200">
              <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="20vw" />
              {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">COVER</span>}
              <button
                onClick={() => setImages((arr) => arr.filter((x) => x !== url))}
                aria-label="Remove photo"
                className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-red-600 text-white opacity-0 transition group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          {images.length < 10 && (
            <button
              onClick={() => imageInput.current?.click()}
              disabled={!!uploading}
              className="grid aspect-[4/3] place-items-center rounded-xl border-2 border-dashed border-slate-300 text-slate-500 transition hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
            >
              {uploading === "image" ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
            </button>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-bold text-slate-900">Walkthrough video (1 max)</h3>
          <input ref={videoInput} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={(e) => uploadFiles(e.target.files, "video")} />
          {form.videoUrl ? (
            <div className="relative mt-3 overflow-hidden rounded-xl border border-slate-200 bg-black">
              <video src={form.videoUrl} controls className="aspect-video w-full object-contain" />
              <button
                onClick={() => set("videoUrl", "")}
                className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                <X className="size-3.5" /> Remove video
              </button>
            </div>
          ) : (
            <button
              onClick={() => videoInput.current?.click()}
              disabled={!!uploading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-5 text-sm font-medium text-slate-500 transition hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
            >
              {uploading === "video" ? <Loader2 className="size-5 animate-spin" /> : <Video className="size-5" />} Upload video
            </button>
          )}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || !!uploading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          onClick={() => router.push("/dashboard?tab=properties")}
          className="rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}