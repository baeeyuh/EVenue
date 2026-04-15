import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ClientProfileContent() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/50 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-primary">Profile</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">My Profile</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Manage your account information and keep your event planning details updated.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" defaultValue="Jane" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue="Doe" />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="janedoe@email.com" />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" defaultValue="+63 912 345 6789" />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button className="rounded-full px-6">Save Changes</Button>
          </div>
        </div>
      </section>
    </main>
  )
}
