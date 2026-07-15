import VouchersManagement from "@/components/vouchers-management"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "รหัสคูปอง Wi-Fi | EECD Car Parking",
  description: "จัดการและสร้างรหัสผ่านไวไฟสำหรับลูกค้าผู้มาใช้บริการในระบบลานจอดรถ EECD",
}

export default function VouchersPage() {
  return <VouchersManagement />
}
