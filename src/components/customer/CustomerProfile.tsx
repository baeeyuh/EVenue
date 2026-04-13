"use client"
import { useState } from "react"
import { User, Mail, Phone, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function CustomerProfile() {
  const [editing, setEditing] = useState(false)

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-light">Profile Settings</h2>
        <Button
          variant="outline"
          className="rounded-full text-sm"
          onClick={() => setEditing(!editing)}
        >
          {editing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-serif text-xl font-light">
          JD
        </div>
        {editing && (
          <Button variant="outline" className="rounded-full text-xs">
            Change photo
          </Button>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {[
          { icon: User, label: "First name", placeholder: "Juan", type: "text" },
          { icon: User, label: "Last name", placeholder: "dela Cruz", type: "text" },
          { icon: Mail, label: "Email address", placeholder: "juan@email.com", type: "email" },
          { icon: Phone, label: "Phone number", placeholder: "+63 912 345 6789", type: "tel" },
        ].map(({ icon: Icon, label, placeholder, type }) => (
          <div key={label} className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Icon className="w-3 h-3" />
              {label}
            </Label>
            <Input
              type={type}
              placeholder={placeholder}
              disabled={!editing}
              className="rounded-xl border-border/60 bg-background disabled:opacity-60 disabled:cursor-not-allowed h-10 text-sm"
            />
          </div>
        ))}
      </div>

      {/* Change password */}
      <div className="border-t border-border/60 pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          <h3 className="font-serif text-lg font-light">Change Password</h3>
        </div>
        {["Current password", "New password", "Confirm new password"].map((label) => (
          <div key={label} className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {label}
            </Label>
            <Input
              type="password"
              placeholder="••••••••"
              disabled={!editing}
              className="rounded-xl border-border/60 bg-background disabled:opacity-60 disabled:cursor-not-allowed h-10 text-sm"
            />
          </div>
        ))}
      </div>

      {editing && (
        <Button className="w-full rounded-full bg-primary hover:bg-primary/90">
          Save Changes
        </Button>
      )}
    </div>
  )
}