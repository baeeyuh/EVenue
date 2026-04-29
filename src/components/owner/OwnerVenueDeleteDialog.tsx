"use client"

import { AlertTriangle, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type OwnerVenueDeleteDialogProps = {
  open: boolean
  venueName: string
  deleting?: boolean
  error?: string | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export default function OwnerVenueDeleteDialog({
  open,
  venueName,
  deleting = false,
  error,
  onOpenChange,
  onConfirm,
}: OwnerVenueDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!deleting) onOpenChange(nextOpen)
    }}>
      <DialogContent className="max-w-md rounded-2xl border-border/60">
        <DialogHeader className="gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <DialogTitle className="font-serif text-2xl font-light">
              Delete venue listing?
            </DialogTitle>
            <DialogDescription>
              This will remove <span className="font-medium text-foreground">{venueName}</span> from your venue listings.
            </DialogDescription>
          </div>
        </DialogHeader>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-border/60 bg-background"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            disabled={deleting}
            onClick={onConfirm}
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete Venue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
