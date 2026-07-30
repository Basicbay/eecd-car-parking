import UsersManagement from "@/components/users-management"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "จัดการผู้ใช้ | EECD Car Parking",
  description: "จัดการบัญชีผู้ใช้และมอบสิทธิ์ในระบบ EECD Car Parking",
}

export default function UsersPage() {
  return <UsersManagement />
}
