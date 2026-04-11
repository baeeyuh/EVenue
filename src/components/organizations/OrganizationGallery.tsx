"use client"
import { useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"

export default function OrganizationGallery({ gallery }: { gallery: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <h2 className="font-serif text-xl font-light">Gallery</h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {gallery.map((img, i) => (
          <div
            key={i}
            onClick={() => setLightbox(img)}
            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border border-border/40"
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

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden">
            <Image src={lightbox} alt="Lightbox" fill className="object-cover" sizes="100vw" />
          </div>
        </div>
      )}
    </div>
  )
}