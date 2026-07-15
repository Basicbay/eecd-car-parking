import AdminDashboard from "@/components/admin-dashboard"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "แดชบอร์ดผู้ดูแลระบบ | EECD Car Parking",
  description: "แดชบอร์ดควบคุมระบบจัดเก็บค่าจอดรถและรหัสไวไฟ",
}

export default function AdminPage() {
  return <AdminDashboard />
}
