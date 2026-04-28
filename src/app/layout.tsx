import type { Metadata } from "next"
import { Geist, Geist_Mono, Source_Sans_3, Playfair_Display } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"
import AppNavbar from "@/components/navbar/AppNavBar"

const playfairDisplayHeading = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
})

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "EVenue",
  description: "Find and Book Event Venues Easily",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        sourceSans3.variable,
        playfairDisplayHeading.variable,
        "font-sans"
      )}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col pb-(--app-navbar-bottom-height) lg:pb-0"
      >
        <AppNavbar />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}