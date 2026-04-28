"use client"
import { cn } from "@/lib/utils"

export type Role = "client" | "owner"

const roles = [
  { value: "client" as Role, icon: "🎉", label: "Client", desc: "Looking for a venue to book" },
  { value: "owner" as Role, icon: "🏛️", label: "Venue Owner", desc: "I want to list my venue" },
]

interface RolePickerProps {
  value: Role | null
  onChange: (role: Role) => void
}

export default function RolePicker({ value, onChange }: RolePickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">I am a...</p>
  <div className="grid grid-cols-2 gap-2">
        {roles.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange(r.value)}
            className={cn(
              "relative flex flex-col items-start rounded-xl border p-3 text-left transition-all",
              value === r.value
                ? "border-[#0f1f2e] bg-background"
                : "border-border/60 bg-muted/40 hover:border-foreground/30"
            )}
          >
            {value === r.value && (
              <span className="absolute top-2 right-2.5 text-[10px] font-medium text-[#0f1f2e]">✓</span>
            )}
            <span className="text-lg mb-1.5">{r.icon}</span>
            <span className="text-xs font-medium text-foreground">{r.label}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{r.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}