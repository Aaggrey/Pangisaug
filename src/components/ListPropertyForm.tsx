"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ImagePlus,
  Video,
  Trash2,
  Loader2,
  UploadCloud,
  CheckCircle2,
  Wallet,
  X,
  Info,
} from "lucide-react";
import { LISTING_FEE } from "@/lib/types";

export function ListPropertyForm({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
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
  });

  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<"MTN_MOMO" | "AIRTEL_MOMO">("MTN_MOMO");
  const [momoPhone, setMomoPhone] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [promptSent, setPromptSent] = useState(false);
  const [polling, setPolling] = useState(false);
  const [message, setMessage] = useState<{ error?: string; ok?: string } | null>(null);

  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const uploadFiles = async (files: FileList | null, kind: "image" | "video") => {
    if (!files || files.length === 0) return;
    setUploading(kind === "image" ? "image" : "video");
    setMessage(null);

    const maxVideo = 1;
    const toUpload = kind === "video" ? Array.from(files).slice(0, maxVideo) : Array.from(files);

    try {
      for (const file of toUpload) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        if (kind === "image") {
          setImages((arr) => (arr.length < 10 ? [...arr, data.url] : arr));
        } else {
          setVideoUrl(data.url);
        }
      }
    } catch (e) {
      setMessage({ error: e instanceof Error ? e.message : "Upload failed" });
    } finally {
      setUploading(null);
    }
  };

  const submit = async () => {
    setMessage(null);
    if (!form.title || !form.description || !form.price || !form.address || !form.city || !form.bedrooms) {
      setMessage({ error: "Please fill in all required fields (title, description, price, address, city, bedrooms)." });
      return;
    }
    if (images.length === 0) {
      setMessage({ error: "Please upload at least one property photo." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseInt(form.price, 10),
          bedrooms: parseInt(form.bedrooms, 10),
          bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : 1,
          areaSqm: form.areaSqm ? parseFloat(form.areaSqm) : null,
          videoUrl,
          images: images.map((url, idx) => ({ url, isCover: idx === 0 })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create listing");
      setPropertyId(data.property.id);
      if (isAdmin) {
        setMessage({ ok: "Property created and published by admin approval." });
        router.push(`/properties/${data.property.id}`);
        router.refresh();
      }
    } catch (e) {
      setMessage({ error: e instanceof Error ? e.message : "Failed to create listing" });
    } finally {
      setSubmitting(false);
    }
  };

  const pay = async () => {
    if (!propertyId) return;
    setPaying(true);
    setMessage(null);
    try {
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, method, phone: momoPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payment failed");

      setPaymentId(data.payment.id);
      setPromptSent(true);

      if (data.gatewayStatus === "SUCCESS") {
        setMessage({ ok: `Payment of UGX ${LISTING_FEE.toLocaleString()} confirmed (Ref: ${data.payment.reference}). Your listing is now live!` });
        setTimeout(() => {
          router.push(`/properties/${propertyId}`);
          router.refresh();
        }, 1800);
        return;
      }

      let attempts = 0;
      setPolling(true);
      const poll = async () => {
        attempts += 1;
        try {
          const r = await fetch(`/api/payment/status?paymentId=${data.payment.id}`);
          const d = await r.json();
          if (d.status === "SUCCESS") {
            setPolling(false);
            setMessage({ ok: `Payment of UGX ${LISTING_FEE.toLocaleString()} confirmed (Ref: ${d.payment.reference}). Your listing is now live!` });
            setTimeout(() => {
              router.push(`/properties/${propertyId}`);
              router.refresh();
            }, 1800);
            return;
          }
          if (d.status === "FAILED") {
            setPolling(false);
            setMessage({ error: d.reason ? `Payment failed: ${d.reason}` : "Payment was not completed. You can retry." });
            return;
          }
        } catch {
          // keep polling on transient errors
        }
        if (attempts < 45) {
          setTimeout(poll, 4000);
        } else {
          setPolling(false);
          setMessage({ error: "We still haven't seen your payment. Check your phone and approve the prompt, or contact +256 772 403372." });
        }
      };
      poll();
    } catch (e) {
      setMessage({ error: e instanceof Error ? e.message : "Payment failed" });
      setPaying(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:opacity-50";
  const labelCls = "mb-1 block text-xs font-semibold text-slate-500";

  if (propertyId && !isAdmin) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <Wallet className="size-6" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Pay to publish your listing</h2>
          <p className="mt-1 text-sm text-slate-600">
            Your property was saved. It goes live on Pangisaug once the one-time listing fee is paid.
          </p>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Listing fee</span>
              <span className="font-bold text-slate-900">UGX {LISTING_FEE.toLocaleString()}</span>
            </div>

            {!promptSent && (
              <>
                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-semibold text-slate-500">Pay with mobile money</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMethod("MTN_MOMO")}
                      className={`rounded-xl border-2 p-3 text-center text-sm font-bold transition ${
                        method === "MTN_MOMO"
                          ? "border-brand-600 bg-brand-50 text-brand-800"
                          : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
                      }`}
                    >
                      <span className="mb-1 block rounded bg-yellow-400 px-2 py-0.5 text-xs font-bold text-black">MTN</span>
                      MTN Mobile Money
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod("AIRTEL_MOMO")}
                      className={`rounded-xl border-2 p-3 text-center text-sm font-bold transition ${
                        method === "AIRTEL_MOMO"
                          ? "border-brand-600 bg-brand-50 text-brand-800"
                          : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
                      }`}
                    >
                      <span className="mb-1 block rounded bg-red-500 px-2 py-0.5 text-xs font-bold text-white">AIRTEL</span>
                      Airtel Money
                    </button>
                  </div>
                </div>
                <label className="mt-3 block">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">MoMo phone number *</span>
                  <input
                    value={momoPhone}
                    onChange={(e) => setMomoPhone(e.target.value.replace(/[^\d+]/g, ""))}
                    placeholder="0701 234 567"
                    inputMode="tel"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                  <span className="mt-1 block text-[11px] text-slate-400">
                    You'll receive a prompt on your phone to approve the {LISTING_FEE.toLocaleString()} UGX charge.
                  </span>
                </label>
              </>
            )}

            {promptSent && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-bold">Prompt sent to {momoPhone}</p>
                <p className="mt-0.5 text-xs">
                  Open your phone, dial your PIN and approve the UGX {LISTING_FEE.toLocaleString()} charge. {polling && "Waiting for the network to confirmâ€¦"}
                </p>
              </div>
            )}
          </div>

          {message?.error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{message.error}</p>
          )}
          {message?.ok && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="size-4 shrink-0" /> {message.ok}
            </p>
          )}

          <button
            onClick={pay}
            disabled={paying || polling || promptSent || !!message?.ok}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60"
          >
            {paying || polling ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
            {promptSent
              ? polling
                ? "Waiting for approvalâ€¦"
                : "Checking paymentâ€¦"
              : paying
              ? "Sending promptâ€¦"
              : `Pay UGX ${LISTING_FEE.toLocaleString()} & publish`}
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="mt-3 w-full rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Save for later â€” pay from dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {propertyId && isAdmin && message?.ok && (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="size-4 shrink-0" /> {message.ok}
        </p>
      )}
      {message?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{message.error}</p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">Property details</h2>
        <p className="text-sm text-slate-500">Tell buyers and renters about your property.</p>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelCls}>Title *</span>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} placeholder="e.g. 3-bedroom house in Cavite" />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Description *</span>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className={inputCls} placeholder="Describe the property, nearby amenities, and why it's a great findâ€¦" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className={labelCls}>Price (UGX) *</span>
              <input value={form.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} className={inputCls} placeholder="2,500,000" inputMode="numeric" />
            </label>
            <label className="block">
              <span className={labelCls}>Listing type *</span>
              <select value={form.listingType} onChange={(e) => set("listingType", e.target.value)} className={inputCls}>
                <option value="RENT">For rent (monthly)</option>
                <option value="SALE">For sale</option>
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Area (mÂ²)</span>
              <input value={form.areaSqm} onChange={(e) => set("areaSqm", e.target.value.replace(/[^\d.]/g, ""))} className={inputCls} placeholder="120" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className={labelCls}>Address *</span>
              <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} placeholder="123 Rizal St." />
            </label>
            <label className="block">
              <span className={labelCls}>City *</span>
              <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} placeholder="e.g. Manila" />
            </label>
            <label className="block">
              <span className={labelCls}>Province</span>
              <input value={form.province} onChange={(e) => set("province", e.target.value)} className={inputCls} placeholder="e.g. Metro Manila" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className={labelCls}>Bedrooms *</span>
              <input value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value.replace(/\D/g, ""))} className={inputCls} placeholder="3" inputMode="numeric" />
            </label>
            <label className="block">
              <span className={labelCls}>Bathrooms</span>
              <input value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value.replace(/[^\d.]/g, ""))} className={inputCls} placeholder="2" />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">Photos {!isAdmin && "(required)"}</h2>
        <p className="text-sm text-slate-500">Upload up to 10 images (JPG, PNG, WebP). The first image becomes the cover.</p>

        <input
          ref={imageInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => uploadFiles(e.target.files, "image")}
        />

        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((url, i) => (
            <div key={url} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200">
              <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="20vw" />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">COVER</span>
              )}
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
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Video className="size-5 text-brand-600" /> Walkthrough video {!isAdmin && "(1 max)"}
        </h2>
        <p className="text-sm text-slate-500">
          {isAdmin ? "Add a video tour for this property." : "Landlords may upload exactly one walkthrough video (MP4, WebM, MOV)."}
        </p>

        <input
          ref={videoInput}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          hidden
          onChange={(e) => uploadFiles(e.target.files, "video")}
        />

        <div className="mt-4">
          {videoUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-black">
              <video src={videoUrl} controls className="aspect-video w-full object-contain" />
              <button
                onClick={() => setVideoUrl(null)}
                className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                <X className="size-3.5" /> Remove video
              </button>
            </div>
          ) : (
            <button
              onClick={() => videoInput.current?.click()}
              disabled={!!uploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-8 text-sm font-medium text-slate-500 transition hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
            >
              {uploading === "video" ? (
                <>
                  <Loader2 className="size-5 animate-spin" /> Uploading videoâ€¦
                </>
              ) : (
                <>
                  <UploadCloud className="size-5" /> Upload video (optional)
                </>
              )}
            </button>
          )}
        </div>
      </section>

      {!isAdmin && (
        <section className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-5">
          <Info className="mt-0.5 size-5 shrink-0 text-brand-700" />
          <p className="text-sm text-brand-900">
            <span className="font-bold">Listing fee: UGX {LISTING_FEE.toLocaleString()}.</span>{" "}
            Your listing stays <span className="font-bold">pending</span> until payment is confirmed, then it goes live
            immediately. No refunds once published.
          </p>
        </section>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={submitting || !!uploading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          {submitting
            ? isAdmin
              ? "Publishingâ€¦"
              : "Submitting listingâ€¦"
            : isAdmin
            ? "Publish property"
            : "Submit & pay listing fee"}
        </button>
        <button
          onClick={() => router.back()}
          className="rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
