import UserAuditLogs from "@/components/user-audit-logs"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "ประวัติการจัดการผู้ใช้ | EECD Car Parking",
  description: "ตรวจสอบประวัติการจัดการผู้ใช้ในระบบ EECD Car Parking",
}

export default function UserLogsPage() {
  return <UserAuditLogs />
}
