"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ParkingTicketModal from "@/components/parking-ticket-modal"
import {
  Car,
  Wifi,
  Receipt,
  PlusCircle,
  Clock,
  CheckCircle,
  Copy,
  TrendingUp,
  Sparkles,
  Check,
  FileText
} from "lucide-react"

// Types for Mock Data
interface Vehicle {
  id: string
  plate: string
  province: string
  slot: string
  checkInTime: Date
  status: "Parked" | "Paid" | "Exited"
  fee: number
}

interface WifiVoucher {
  code: string
  duration: string
  createdAt: Date
  status: "Active" | "Expired"
}

export default function AdminDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: "1",
      plate: "กข 1234",
      province: "กรุงเทพฯ",
      slot: "A-04",
      checkInTime: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
      status: "Parked",
      fee: 0,
    },
    {
      id: "2",
      plate: "3มง 9999",
      province: "ชลบุรี",
      slot: "B-12",
      checkInTime: new Date(Date.now() - 1000 * 60 * 60 * 2.5), // 2.5 hours ago
      status: "Parked",
      fee: 40,
    },
    {
      id: "3",
      plate: "รน 8888",
      province: "เชียงใหม่",
      slot: "A-10",
      checkInTime: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      status: "Paid",
      fee: 80,
    },
    {
      id: "4",
      plate: "ฆฆ 7777",
      province: "ขอนแก่น",
      slot: "C-03",
      checkInTime: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
      status: "Parked",
      fee: 0,
    },
  ])

  const [vouchers, setVouchers] = useState<WifiVoucher[]>([
    { code: "EECD-WIFI-8F92A", duration: "1 ชั่วโมง", createdAt: new Date(Date.now() - 1000 * 60 * 30), status: "Active" },
    { code: "EECD-WIFI-3B12D", duration: "3 ชั่วโมง", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5), status: "Active" },
    { code: "EECD-WIFI-9C7E1", duration: "24 ชั่วโมง", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25), status: "Expired" },
  ])

  // Form states
  const [newPlate, setNewPlate] = useState("")
  const [newProvince, setNewProvince] = useState("กรุงเทพฯ")
  const [newSlot, setNewSlot] = useState("A-01")
  const [selectedDuration, setSelectedDuration] = useState("1 ชั่วโมง")
  const [generatedVoucher, setGeneratedVoucher] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Ticket Modal states
  const [selectedVehicleForTicket, setSelectedVehicleForTicket] = useState<any | null>(null)
  const [isTicketOpen, setIsTicketOpen] = useState(false)

  // Handle vehicle check-in
  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlate.trim()) return

    const newVehicle: Vehicle = {
      id: Math.random().toString(36).substring(2, 9),
      plate: newPlate,
      province: newProvince,
      slot: newSlot,
      checkInTime: new Date(),
      status: "Parked",
      fee: 0,
    }

    setVehicles([newVehicle, ...vehicles])
    setNewPlate("")
    
    // Auto increment slot for testing convenience
    const alphabet = newSlot.charAt(0)
    const num = parseInt(newSlot.substring(2))
    const nextNum = num < 20 ? num + 1 : 1
    const nextSlot = `${alphabet}-${nextNum.toString().padStart(2, '0')}`
    setNewSlot(nextSlot)

    // Open ticket modal immediately for LPR printing simulation
    setSelectedVehicleForTicket({
      ...newVehicle,
      wifiCode: `EECD-WIFI-${newVehicle.id.toUpperCase()}`
    })
    setIsTicketOpen(true)
  }

  // Handle wifi voucher generation
  const handleGenerateVoucher = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let randomCode = "EECD-WIFI-"
    for (let i = 0; i < 5; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const newVoucher: WifiVoucher = {
      code: randomCode,
      duration: selectedDuration,
      createdAt: new Date(),
      status: "Active",
    }

    setVouchers([newVoucher, ...vouchers])
    setGeneratedVoucher(randomCode)
  }

  // Handle Copy to Clipboard
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Update park duration fees dynamically for active vehicles
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles((prevVehicles) =>
        prevVehicles.map((v) => {
          if (v.status !== "Parked") return v
          const durationHrs = (Date.now() - v.checkInTime.getTime()) / (1000 * 60 * 60)
          if (durationHrs <= 0.25) {
            return { ...v, fee: 0 }
          } else {
            const billableHours = Math.ceil(durationHrs)
            return { ...v, fee: billableHours * 20 }
          }
        })
      )
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const handlePay = (id: string) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, status: "Paid" } : v))
  }

  const handleExit = (id: string) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, status: "Exited" } : v))
  }

  const activeParkedCount = vehicles.filter(v => v.status === "Parked").length
  const totalSlots = 150
  const availableSlots = totalSlots - activeParkedCount
  const todayRevenue = vehicles.reduce((sum, v) => sum + (v.status !== "Parked" || v.fee > 0 ? v.fee : 0), 0)

  return (
    <div className="space-y-6">
      {/* Welcome Alert banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-[-30px] right-[-30px] opacity-10 blur-md pointer-events-none">
          <Sparkles className="size-36 text-primary" />
        </div>
        <div className="space-y-1.5 z-10">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            ยินดีต้อนรับเข้าสู่ระบบจัดการลานจอดรถ EECD <Sparkles className="size-4 text-primary animate-bounce" />
          </h3>
          <p className="text-xs text-muted-foreground max-w-xl">
            ระเบียบความปลอดภัยระดับสูง การทำงานสแกนป้ายทะเบียนกล้องความละเอียดสูง และระบบ Voucher รหัสผ่าน Wi-Fi พร้อมใช้งานแล้ว
          </p>
        </div>
        <div className="flex items-center gap-2.5 z-10">
          <div className="text-xs bg-[#121418] border border-border px-3 py-1.5 rounded-lg font-medium text-white flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            กล้อง LPR ใช้งานได้ปกติ
          </div>
        </div>
      </div>

      {/* Stats Showcase row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-card/60 border border-border/80 backdrop-blur-md rounded-2xl space-y-3 shadow-sm hover:border-primary/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">พื้นที่จอดว่าง</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Car className="size-4.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">{availableSlots}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">จากทั้งหมด {totalSlots} ช่องจอด</p>
            </div>
            <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
              {Math.round((availableSlots / totalSlots) * 100)}% ว่าง
            </span>
          </div>
        </div>

        <div className="p-5 bg-card/60 border border-border/80 backdrop-blur-md rounded-2xl space-y-3 shadow-sm hover:border-primary/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">รถที่กำลังจอด</span>
            <div className="h-8 w-8 rounded-lg bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center text-[#EAB308]">
              <Clock className="size-4.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">{activeParkedCount}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">จอดอยู่ ณ ขณะนี้</p>
            </div>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
              เรียลไทม์
            </span>
          </div>
        </div>

        <div className="p-5 bg-card/60 border border-border/80 backdrop-blur-md rounded-2xl space-y-3 shadow-sm hover:border-primary/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Wi-Fi Voucher วันนี้</span>
            <div className="h-8 w-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <Wifi className="size-4.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">{vouchers.filter(v => v.status === "Active").length}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">ถูกสร้างในระบบวันนี้</p>
            </div>
            <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp className="size-3" />
              +15%
            </span>
          </div>
        </div>

        <div className="p-5 bg-card/60 border border-border/80 backdrop-blur-md rounded-2xl space-y-3 shadow-sm hover:border-primary/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">ประมาณการรายได้วันนี้</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Receipt className="size-4.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">฿{todayRevenue}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">รวมค่าบริการชำระและค่าธรรมเนียม</p>
            </div>
            <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
              {vehicles.filter(v => v.status !== "Parked" || v.fee > 0).length} รายการ
            </span>
          </div>
        </div>
      </section>

      {/* Live Activity Lists */}
      <div className="grid grid-cols-2 gap-5">

        {/* Vehicles Table Card */}
        <div className="bg-card/60 border border-border/80 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#22262F] flex items-center justify-between bg-card/20">
            <div className="flex items-center gap-2">
              <Car className="size-4.5 text-primary" />
              <h3 className="text-sm font-bold text-white">รายการรถยนต์เข้า-ออกล่าสุด</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#22262F] text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-black/20">
                  <th className="py-3 px-4">ทะเบียนรถ</th>
                  <th className="py-3 px-4">จังหวัด</th>
                  <th className="py-3 px-4">ช่องจอด</th>
                  <th className="py-3 px-4">เวลาเช็คอิน</th>
                  <th className="py-3 px-4">อัตราค่าจอด</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D212A]">
                {vehicles.slice(0, 5).map((v) => (
                  <tr key={v.id} className="hover:bg-[#121418]/45 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{v.plate}</td>
                    <td className="py-3 px-4 text-muted-foreground">{v.province}</td>
                    <td className="py-3 px-4 font-mono text-primary font-semibold">{v.slot}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {v.checkInTime.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {v.status === "Exited" ? (
                        <span className="text-muted-foreground font-normal line-through">฿{v.fee}</span>
                      ) : v.fee === 0 ? (
                        <span className="text-green-400 font-semibold">จอดฟรี</span>
                      ) : (
                        `฿${v.fee}`
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {v.status === "Parked" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                          กำลังจอด
                        </span>
                      )}
                      {v.status === "Paid" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                          <CheckCircle className="size-3" />
                          ชำระเงินแล้ว
                        </span>
                      )}
                      {v.status === "Exited" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#22262F] text-muted-foreground px-2 py-0.5 rounded-full">
                          ออกจากลานจอด
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedVehicleForTicket({
                              ...v,
                              wifiCode: `EECD-WIFI-${v.id.toUpperCase()}`
                            })
                            setIsTicketOpen(true)
                          }}
                          className="p-1 rounded bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                          title="ดูบัตรจอดรถ / Wi-Fi"
                        >
                          <FileText className="size-3.5" />
                          บัตรจอด
                        </button>
                        {v.status === "Parked" && (
                          <button
                            onClick={() => handlePay(v.id)}
                            className="px-2 py-1 rounded bg-[#EAB308]/10 hover:bg-[#EAB308]/20 border border-[#EAB308]/20 text-[#EAB308] text-[10px] font-semibold transition-all cursor-pointer"
                          >
                            จ่ายเงิน
                          </button>
                        )}
                        {v.status === "Paid" && (
                          <button
                            onClick={() => handleExit(v.id)}
                            className="px-2 py-1 rounded bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-[10px] font-semibold transition-all cursor-pointer"
                          >
                            ออก
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Wi-Fi Vouchers Table Card */}
        <div className="bg-card/60 border border-border/80 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#22262F] flex items-center justify-between bg-card/20">
            <div className="flex items-center gap-2">
              <Wifi className="size-4.5 text-primary" />
              <h3 className="text-sm font-bold text-white">รายการรหัส Wi-Fi Voucher ล่าสุด</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#22262F] text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-black/20">
                  <th className="py-3 px-4">รหัสคูปอง Wi-Fi</th>
                  <th className="py-3 px-4">ระยะเวลา</th>
                  <th className="py-3 px-4">วันที่/เวลาสร้าง</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D212A]">
                {vouchers.slice(0, 5).map((v) => (
                  <tr key={v.code} className="hover:bg-[#121418]/45 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white tracking-wider">
                      {v.code}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{v.duration}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {v.createdAt.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })} ({v.createdAt.toLocaleDateString("th-TH", { day: 'numeric', month: 'short' })})
                    </td>
                    <td className="py-3 px-4">
                      {v.status === "Active" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          เปิดใช้งาน
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                          หมดอายุ
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleCopy(v.code)}
                          className="p-1 rounded bg-[#121418] hover:bg-muted border border-border text-muted-foreground hover:text-white transition-all cursor-pointer"
                          title="คัดลอกรหัสผ่าน"
                        >
                          {copiedCode === v.code ? (
                            <Check className="size-3.5 text-green-400" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {vouchers.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              ไม่มีรหัส Wi-Fi Voucher ในระบบ
            </div>
          )}
        </div>
      </div>

      {/* Ticket Modal popup */}
      <ParkingTicketModal
        isOpen={isTicketOpen}
        onClose={() => {
          setIsTicketOpen(false)
          setSelectedVehicleForTicket(null)
        }}
        vehicle={selectedVehicleForTicket}
      />
    </div>
  )
}
