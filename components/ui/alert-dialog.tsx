import * as React from "react"
import { Button } from "@/components/ui/button"

interface AlertDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  cancelText?: string
  confirmText?: string
  loading?: boolean
}

export function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  cancelText = "ยกเลิก",
  confirmText = "ยืนยันการลบ",
  loading = false
}: AlertDialogProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fadeIn" 
        onClick={loading ? undefined : onClose}
      />
      
      {/* Content wrapper */}
      <div className="relative bg-[#121418] border border-[#22262F] w-full max-w-[400px] rounded-2xl p-6 shadow-2xl space-y-5 animate-scaleIn z-10">
        <div className="space-y-2">
          <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-border hover:bg-[#1C2028] text-xs cursor-pointer h-9 px-4 text-muted-foreground hover:text-white"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold h-9 px-4 cursor-pointer"
          >
            {loading ? "กำลังลบ..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
