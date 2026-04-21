"use client";

import { useId, useRef } from "react";
import Image from "next/image";
import { ImageUp, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ImageUploadProps = {
  value: string;
  onChange: (nextValue: string) => void;
  onError?: (message: string | null) => void;
  maxSizeMB?: number;
};

export function ImageUpload({
  value,
  onChange,
  onError,
  maxSizeMB = 5,
}: ImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError?.("Please upload a valid image file");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      onError?.(`Please upload an image smaller than ${maxSizeMB}MB`);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
        onError?.(null);
      }
    };

    reader.onerror = () => {
      onError?.("Failed to read selected image");
    };

    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2">
      <Input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          void handleFileSelect(e);
        }}
        className="hidden"
      />

      <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
        {!value ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-background text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5"
          >
            <ImageUp className="mb-2 h-5 w-5" />
            <p className="text-sm font-medium">Upload venue image</p>
            <p className="mt-1 text-xs">JPG, PNG, WEBP up to {maxSizeMB}MB</p>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="relative h-44 w-full overflow-hidden rounded-xl">
              <Image
                src={value}
                alt="Venue preview"
                fill
                className="object-cover"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-border/60"
                onClick={() => inputRef.current?.click()}
              >
                Change
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-border/60"
                onClick={() => onChange("")}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
