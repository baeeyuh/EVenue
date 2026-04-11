import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthTabBar from "./AuthTabBar"
import Link from "next/link"

export default function LoginForm() {
  return (
    <div className="flex flex-col justify-center space-y-6 h-full">
      <AuthTabBar active="login" />

      <div>
        <h1 className="font-serif text-3xl font-light">Welcome back.</h1>
        <p className="text-xs text-muted-foreground mt-1">Log in to continue to EVenue</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Email</Label>
          <Input type="email" placeholder="you@email.com" className="bg-muted/50 border-border/60 h-10 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Password</Label>
          <Input type="password" placeholder="••••••••" className="bg-muted/50 border-border/60 h-10 text-sm" />
          <div className="text-right">
            <Link href="/authentication/forgot-password"
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>

      <Button className="w-full rounded-full bg-primary hover:bg-[#1a3148] text-white">
        Log In
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/authentication/signup" className="text-foreground font-medium underline underline-offset-2">
          Sign up
        </Link>
      </p>
    </div>
  )
}