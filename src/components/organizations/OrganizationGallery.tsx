"use client"
import { useState } from "react"
import Image from "next/image"
import { ChevronDown, X } from "lucide-react"

type OrganizationGalleryProps = {
  gallery?: string[] | null
}

export default function OrganizationGallery({ gallery }: OrganizationGalleryProps) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const images = (gallery ?? []).filter((img): img is string => typeof img === "string" && img.trim().length > 0)

  if (!images.length) {
    return (
      <div className="space-y-3">
        <h2 className="font-serif text-xl font-light">Gallery</h2>
        <div className="rounded-xl border border-border/40 bg-muted/30 p-6 text-sm text-muted-foreground">
          No gallery images yet.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="group inline-flex items-center gap-2 text-left"
        aria-expanded={isExpanded}
      >
        <h2 className="font-serif text-xl font-light">Gallery</h2>
        <span className="text-xs text-muted-foreground">({images.length})</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isExpanded ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {isExpanded && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {images.map((img, i) => (
          <div
            key={`${img}-${i}`}
            onClick={() => setLightbox(img)}
            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border border-border/40"
            style={{ aspectRatio: "1 / 1", minHeight: "8rem" }}
          >
            <Image
              src={img}
              alt={`Gallery ${i + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
        ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden"
            style={{ aspectRatio: "16 / 9", minHeight: "14rem" }}
          >
            <Image src={lightbox} alt="Lightbox" fill className="object-cover" sizes="100vw" />
          </div>
        </div>
      )}
    </div>
  )
}