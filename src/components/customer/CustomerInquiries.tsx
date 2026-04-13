import { MessageSquare, Clock, CheckCircle2, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { userInquiries } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const statusConfig = {
  Pending: {
    label: "Pending",
    class: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  Replied: {
    label: "Replied",
    class: "bg-green-50 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
}

export default function CustomerInquiries() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-light">My Inquiries</h2>
        <span className="text-xs text-muted-foreground">{userInquiries.length} total</span>
      </div>

      {userInquiries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/60 rounded-2xl">
          <MessageSquare className="w-8 h-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No inquiries yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Browse venues and send your first inquiry</p>
        </div>
      ) : (
        <div className="space-y-3">
          {userInquiries.map((inquiry) => {
            const status = statusConfig[inquiry.status]
            const Icon = status.icon
            return (
              <div
                key={inquiry.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border/60 bg-card hover:border-border transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{inquiry.organizationName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{inquiry.message}</p>
                  </div>
                </div>
                <div className={cn(
                  "inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border self-start sm:self-center shrink-0",
                  status.class
                )}>
                  <Icon className="w-3 h-3" />
                  {status.label}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}