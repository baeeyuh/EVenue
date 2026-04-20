import Link from "next/link"

interface AuthTabBarProps {
  active: "login" | "signup"
}

export default function AuthTabBar({ active }: AuthTabBarProps) {
  return (
    <div className="border-b border-border/60 pb-2 flex gap-6">
      <Link
        href="/authentication/login"
        className={
          active === "login"
            ? "text-sm font-medium border-b-2 border-foreground pb-2 -mb-2"
            : "text-sm text-muted-foreground hover:text-foreground transition-colors pb-2"
        }
      >
        Log In
      </Link>
      <Link
        href="/authentication/signup"
        className={
          active === "signup"
            ? "text-sm font-medium border-b-2 border-foreground pb-2 -mb-2"
            : "text-sm text-muted-foreground hover:text-foreground transition-colors pb-2"
        }
      >
        Sign Up
      </Link>
    </div>
  )
}