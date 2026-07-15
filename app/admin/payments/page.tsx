import PaymentsManagement from "@/components/payments-management"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "ประวัติชำระเงิน | EECD Car Parking",
  description: "ประวัติทำรายการบันทึกการสแกนจ่ายเงินค่าจอดรถและรหัสไวไฟของระบบ EECD",
}

export default function PaymentsPage() {
  return <PaymentsManagement />
}
