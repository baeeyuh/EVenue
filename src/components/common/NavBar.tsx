import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NavBar() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-auto w-auto items-center justify-center overflow-hidden">
            <Image
              src="/images/logo1.png"
              alt="EVenue logo"
              width={160}
              height={100}
              className="object-contain"
            />
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <Button asChild variant="ghost" className="rounded-full px-6">
            <Link href="/venues">Browse Venues</Link>
          </Button>

          <Button asChild variant="outline" className="rounded-full px-6">
            <Link href="/login">Log In</Link>
          </Button>

          <Button asChild className="rounded-full px-6">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}