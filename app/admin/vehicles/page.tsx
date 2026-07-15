import VehiclesManagement from "@/components/vehicles-management"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "รถยนต์ในลานจอด | EECD Car Parking",
  description: "จัดการทะเบียนรถยนต์เข้า-ออก ตรวจเช็คตำแหน่งและสแกนการเข้าใช้ลานจอด",
}

export default function VehiclesPage() {
  return <VehiclesManagement />
}
