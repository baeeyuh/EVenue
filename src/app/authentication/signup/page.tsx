import AuthLeftPanel from "@/components/authentication/AuthLeftPanel"
import SignUpFormClientOnly from "@/components/authentication/SignUpFormClientOnly"

export default function SignUpPage() {
  return (
    <div className="w-full max-w-6xl grid grid-cols-2 rounded-2xl overflow-hidden border border-border/60 shadow-sm">
      <AuthLeftPanel />
      <div className="bg-background p-10">
        <SignUpFormClientOnly />
      </div>
    </div>
  )
}