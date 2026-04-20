import { Suspense } from "react"
import AuthLeftPanel from "@/components/authentication/AuthLeftPanel"
import LoginForm from "@/components/authentication/LoginForm"

export default function LoginPage() {
  return (
    <div className="w-full max-w-6xl grid grid-cols-2 rounded-2xl overflow-hidden border border-border/60 shadow-sm">
      <AuthLeftPanel />
      <div className="bg-background p-10">
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}