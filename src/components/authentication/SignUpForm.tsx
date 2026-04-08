"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthTabBar from "./AuthTabBar"
import RolePicker, { type Role } from "./RolePicker"
import Link from "next/link"

export default function SignUpForm() {
  const [role, setRole] = useState<Role | null>(null)

  return (
    <div className="flex flex-col justify-center space-y-4 h-full">
      <AuthTabBar active="signup" />

      <div>
        <h1 className="font-serif text-3xl font-light">Join EVenue.</h1>
        <p className="text-xs text-muted-foreground mt-1">Create your account below</p>
      </div>

      <RolePicker value={role} onChange={setRole} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">First name</Label>
          <Input placeholder="Juan" className="bg-muted/50 border-border/60 h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Last name</Label>
          <Input placeholder="dela Cruz" className="bg-muted/50 border-border/60 h-9 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">business name</Label>
          <Input
            placeholder="Grand Palace Events Hall"
            className="bg-muted/50 border-border/60 h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Contact number</Label>
          <Input
            type="tel"
            placeholder="09XX XXX XXXX"
            className="bg-muted/50 border-border/60 h-9 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Business address</Label>
        <Input
          placeholder="Street, Barangay"
          className="bg-muted/50 border-border/60 h-9 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">City / Municipality</Label>
          <Input
            placeholder="Cagayan de Oro"
            className="bg-muted/50 border-border/60 h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Province</Label>
          <Input
            placeholder="Misamis Oriental"
            className="bg-muted/50 border-border/60 h-9 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Email</Label>
        <Input type="email" placeholder="you@email.com" className="bg-muted/50 border-border/60 h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Password</Label>
        <Input type="password" placeholder="Min. 8 characters" className="bg-muted/50 border-border/60 h-9 text-sm" />
      </div>

      <Button
        disabled={!role}
        className="w-full rounded-full bg-primary hover:bg-[#1a3148] text-white disabled:opacity-40"
      >
        Create Account
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link href="/authentication/login" className="text-foreground font-medium underline underline-offset-2">
          Log in
        </Link>
      </p>
    </div>
  )
}