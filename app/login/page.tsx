import LoginForm from "@/components/login-form"
import { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | EECD Car Parking Management",
  description: "เข้าสู่ระบบผู้ดูแลระบบจัดการลานจอดรถ EECD",
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full bg-[#090A0C] items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
