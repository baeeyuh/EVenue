import Link from "next/link"

interface AuthTabBarProps {
  active: "login" | "signup"
}

export default function AuthTabBar({ active }: AuthTabBarProps) {
  return (
    <div className="flex gap-5 border-b border-border/60 pb-2 sm:gap-6">
      <Link
        href="/authentication/login"
        className={
          active === "login"
            ? "border-b-2 border-foreground pb-2 -mb-2 text-[13px] font-medium sm:text-sm"
            : "pb-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
        }
      >
        Log In
      </Link>
      <Link
        href="/authentication/signup"
        className={
          active === "signup"
            ? "border-b-2 border-foreground pb-2 -mb-2 text-[13px] font-medium sm:text-sm"
            : "pb-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
        }
      >
        Sign Up
      </Link>
    </div>
  )
}