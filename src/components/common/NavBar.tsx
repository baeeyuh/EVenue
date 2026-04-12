import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center ">
            <Image
              src="/images/logo1.png"
              alt="EVenue logo"
              width={160}
              height={160}
              className="object-contain"
              style={{ width: "auto", height: "3rem" }}
            />
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" className="rounded-full px-5">
            <Link href="/venues">Venues</Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-full px-5">
            <Link href="/organizations">Organizations</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-5">
            <Link href="/authentication/login">Log In</Link>
          </Button>
          <Button asChild className="rounded-full px-5">
            <Link href="/authentication/signup">Sign Up</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}