"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, Camera } from "lucide-react";

export function PropertyGallery({ images, videoUrl }: { images: string[]; videoUrl?: string | null }) {
  const [current, setCurrent] = useState(0);
  const [showVideo, setShowVideo] = useState(videoUrl ? true : false);

  const total = images.length + (videoUrl ? 1 : 0);
  const list = showVideo && videoUrl ? [] : images;

  const go = (i: number) => {
    const idx = (i + total) % total;
    if (videoUrl && idx === 0) {
      setShowVideo(true);
    } else {
      setShowVideo(false);
      setCurrent(videoUrl ? idx - 1 : idx);
    }
  };

  if (!list.length && videoUrl) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
        <video src={videoUrl} controls className="aspect-[16/10] w-full object-contain" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        {list.length > 0 ? (
          <Image
            key={list[current]}
            src={list[current]}
            alt="Property"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 70vw"
          />
        ) : null}

        {videoUrl && (
          <button
            onClick={() => go(0)}
            className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/80"
          >
            <Play className="size-4" /> {showVideo ? "Show photos" : "Watch video tour"}
          </button>
        )}

        <button
          onClick={() => go(current - 1)}
          aria-label="Previous"
          className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-800 shadow-md transition hover:bg-white"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={() => go(current + 1)}
          aria-label="Next"
          className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-800 shadow-md transition hover:bg-white"
        >
          <ChevronRight className="size-5" />
        </button>

        <span className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          <Camera className="mr-1 inline size-3.5" />
          {showVideo ? 1 : current + 1} / {total}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
        {videoUrl && (
          <button
            onClick={() => go(0)}
            className={`relative aspect-video overflow-hidden rounded-xl border-2 transition ${
              showVideo ? "border-brand-600" : "border-transparent hover:border-brand-300"
            }`}
          >
            <span className="absolute inset-0 grid place-items-center bg-black text-white">
              <Play className="size-6" fill="white" />
            </span>
          </button>
        )}
        {images.map((img, i) => (
          <button
            key={img}
            onClick={() => go(i + (videoUrl ? 1 : 0))}
            className={`relative aspect-video overflow-hidden rounded-xl border-2 transition ${
              !showVideo && i === current ? "border-brand-600" : "border-transparent hover:border-brand-300"
            }`}
          >
            <Image src={img} alt="Thumbnail" fill className="object-cover" sizes="20vw" />
          </button>
        ))}
      </div>
    </div>
  );
}