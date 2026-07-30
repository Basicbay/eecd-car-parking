import PermissionsManagement from "@/components/permissions-management"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "จัดการ Permission | EECD Car Parking",
  description: "จัดการสิทธิ์การเข้าถึงระบบ EECD Car Parking",
}

export default function PermissionsPage() {
  return <PermissionsManagement />
}
