import PermissionAuditLogs from "@/components/permission-audit-logs"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "ประวัติการจัดการสิทธิ์ | EECD Car Parking",
  description: "ตรวจสอบประวัติการเปลี่ยนแปลงสิทธิ์ของบทบาทในระบบ EECD Car Parking",
}

export default function PermissionLogsPage() {
  return <PermissionAuditLogs />
}
