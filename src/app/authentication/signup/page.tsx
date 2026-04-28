import AuthLeftPanel from "@/components/authentication/AuthLeftPanel"
import SignUpFormClientOnly from "@/components/authentication/SignUpFormClientOnly"

export default function SignUpPage() {
  return (
    <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-xl border border-border/60 shadow-sm sm:rounded-2xl lg:grid-cols-2">
      <div className="h-full">
        <AuthLeftPanel />
      </div>
      <div className="bg-background px-4 py-5 sm:px-8 sm:py-8 lg:p-10">
        <SignUpFormClientOnly />
      </div>
    </div>
  )
}