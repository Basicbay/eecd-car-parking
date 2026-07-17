"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertDialog } from "@/components/ui/alert-dialog"
import {
  Wifi,
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Trash2,
  Download,
  Printer,
  Sparkles,
  Server,
  Zap
} from "lucide-react"

interface WifiVoucher {
  id: string
  code: string
  duration: string
  speedLimit: string
  createdAt: Date
  expiresAt: Date
  status: "Active" | "Used" | "Expired"
  usedByDevice?: string
}

const INITIAL_VOUCHERS: WifiVoucher[] = [
  {
    id: "1",
    code: "EECD-WIFI-A5B2D",
    duration: "1 ชั่วโมง",
    speedLimit: "100/100 Mbps",
    createdAt: new Date(Date.now() - 1000 * 60 * 20),
    expiresAt: new Date(Date.now() + 1000 * 60 * 40),
    status: "Active"
  },
  {
    id: "2",
    code: "EECD-WIFI-9R3K1",
    duration: "3 ชั่วโมง",
    speedLimit: "100/100 Mbps",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.5),
    expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    status: "Active"
  },
  {
    id: "3",
    code: "EECD-WIFI-7X8C4",
    duration: "5 ชั่วโมง",
    speedLimit: "200/200 Mbps",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 1),
    status: "Used",
    usedByDevice: "iPhone 15 Pro (192.168.10.42)"
  },
  {
    id: "4",
    code: "EECD-WIFI-1Z9P8",
    duration: "24 ชั่วโมง",
    speedLimit: "500/500 Mbps",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30),
    expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    status: "Expired"
  }
]

export default function VouchersManagement() {
  const [vouchers, setVouchers] = useState<WifiVoucher[]>(INITIAL_VOUCHERS)

  // Search & Filter
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Used" | "Expired">("All")
  
  // Generation state
  const [duration, setDuration] = useState("1 ชั่วโมง")
  const [speedLimit, setSpeedLimit] = useState("100/100 Mbps")
  const [quantity, setQuantity] = useState(1)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [batchHistory, setBatchHistory] = useState<string[] | null>(null)

  // Deletion state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [voucherToDelete, setVoucherToDelete] = useState<string | null>(null)

  // Generate Vouchers
  const handleGenerate = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    const newVouchersList: WifiVoucher[] = []
    const generatedCodes: string[] = []

    for (let q = 0; q < quantity; q++) {
      let randomCode = "EECD-WIFI-"
      for (let i = 0; i < 5; i++) {
        randomCode += chars.charAt(Math.floor(Math.random() * chars.length))
      }

      let durationMs = 1000 * 60 * 60 // Default 1 hour
      if (duration === "3 ชั่วโมง") durationMs = 1000 * 60 * 60 * 3
      if (duration === "5 ชั่วโมง") durationMs = 1000 * 60 * 60 * 5
      if (duration === "24 ชั่วโมง") durationMs = 1000 * 60 * 60 * 24

      newVouchersList.push({
        id: Math.random().toString(36).substring(2, 9),
        code: randomCode,
        duration,
        speedLimit,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + durationMs),
        status: "Active"
      })
      generatedCodes.push(randomCode)
    }

    setVouchers([...newVouchersList, ...vouchers])
    setBatchHistory(generatedCodes)
  }

  const handleTriggerDelete = (id: string) => {
    setVoucherToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (voucherToDelete) {
      setVouchers(vouchers.filter(v => v.id !== voucherToDelete))
      setIsDeleteDialogOpen(false)
      setVoucherToDelete(null)
    }
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filteredVouchers = vouchers.filter(v => {
    const matchesSearch = v.code.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = statusFilter === "All" ? true : v.status === statusFilter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Vouchers Stats Dashboard Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-card/60 border border-border/80 backdrop-blur-md rounded-2xl flex items-center justify-between shadow-sm hover:border-primary/20 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">คูปองที่เปิดใช้งานอยู่</span>
            <h3 className="text-3xl font-extrabold text-white">{vouchers.filter(v => v.status === "Active").length} รหัส</h3>
            <p className="text-xs text-muted-foreground">พร้อมเชื่อมต่ออินเทอร์เน็ต</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
            <Wifi className="size-5" />
          </div>
        </div>

        <div className="p-5 bg-card/60 border border-border/80 backdrop-blur-md rounded-2xl flex items-center justify-between shadow-sm hover:border-primary/20 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">อุปกรณ์ที่ใช้งานแล้ว</span>
            <h3 className="text-3xl font-extrabold text-white">{vouchers.filter(v => v.status === "Used").length} ครั้ง</h3>
            <p className="text-xs text-muted-foreground">สแกนเปิดใช้งาน Wi-Fi แล้ว</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Server className="size-5" />
          </div>
        </div>

        <div className="p-5 bg-card/60 border border-border/80 backdrop-blur-md rounded-2xl flex items-center justify-between shadow-sm hover:border-primary/20 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">คูปองทั้งหมดในระบบ</span>
            <h3 className="text-3xl font-extrabold text-white">{vouchers.length} รหัส</h3>
            <p className="text-xs text-muted-foreground">ประวัติรวมตั้งแต่เริ่มต้น</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Zap className="size-5" />
          </div>
        </div>
      </section>

      {/* Main Action Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Generator panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 bg-card/60 border border-border/80 backdrop-blur-md rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <PlusCircle className="size-4.5 text-primary" />
              <h3 className="text-sm font-bold text-white">สร้างรหัส Wi-Fi Voucher</h3>
            </div>

            <div className="space-y-3.5">
              {/* Duration select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">ระยะเวลาสิทธิ์ใช้งาน</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
                >
                  <option value="1 ชั่วโมง">1 ชั่วโมง</option>
                  <option value="3 ชั่วโมง">3 ชั่วโมง</option>
                  <option value="5 ชั่วโมง">5 ชั่วโมง</option>
                  <option value="24 ชั่วโมง">24 ชั่วโมง (1 วัน)</option>
                </select>
              </div>

              {/* Speed limit selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">ความเร็วอินเทอร์เน็ต (Speed Limit)</label>
                <select
                  value={speedLimit}
                  onChange={(e) => setSpeedLimit(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
                >
                  <option value="50/50 Mbps">50/50 Mbps (ความเร็วพื้นฐาน)</option>
                  <option value="100/100 Mbps">100/100 Mbps (ความเร็วแนะนำ)</option>
                  <option value="200/200 Mbps">200/200 Mbps (ความเร็วสูง)</option>
                  <option value="500/500 Mbps">500/500 Mbps (ความเร็วระดับพรีเมียม)</option>
                </select>
              </div>

              {/* Quantity select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">จำนวนรหัสที่ต้องการสุ่ม</label>
                <div className="flex gap-2">
                  {[1, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantity(num)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                        quantity === num
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border hover:bg-[#121418] text-muted-foreground"
                      }`}
                    >
                      {num} รหัส
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 h-9 rounded-lg border border-border bg-card px-2.5 text-center text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold h-9 rounded-lg cursor-pointer"
              >
                สร้างรหัสผ่าน Wi-Fi
              </Button>
            </div>

            {/* Generated Batch Output preview */}
            {batchHistory && (
              <div className="pt-3 border-t border-[#22262F] space-y-2.5 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                    <Sparkles className="size-3" />
                    รหัสที่ถูกสร้างล่าสุด ({batchHistory.length} รหัส)
                  </span>
                  <button
                    onClick={() => setBatchHistory(null)}
                    className="text-xs text-muted-foreground hover:text-white"
                  >
                    ล้างการแสดงผล
                  </button>
                </div>
                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1.5 scrollbar-thin">
                  {batchHistory.map((code) => (
                    <div
                      key={code}
                      className="flex items-center justify-between gap-2 p-2 rounded bg-black/40 border border-[#22262F]"
                    >
                      <span className="font-mono text-xs font-bold text-white">{code}</span>
                      <button
                        onClick={() => handleCopy(code)}
                        className="text-xs text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        {copiedCode === code ? (
                          <>
                            <Check className="size-3 text-green-400" />
                            <span className="text-green-400">คัดลอกแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>คัดลอก</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Vouchers List Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-card/60 border border-border/80 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Table toolbar */}
            <div className="p-4 border-b border-[#22262F] flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-card/20">
              <div className="relative flex-1 max-w-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                  <Search className="size-4" />
                </span>
                <Input
                  type="text"
                  placeholder="ค้นหารหัสคูปอง Wi-Fi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8.5 text-xs"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "All" | "Active" | "Used" | "Expired")}
                  className="flex h-8.5 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="All">ทุกสถานะคูปอง</option>
                  <option value="Active">เปิดการใช้งานอยู่</option>
                  <option value="Used">อุปกรณ์รับสิทธิ์แล้ว</option>
                  <option value="Expired">คูปองหมดอายุ</option>
                </select>

                <Button
                  variant="outline"
                  size="icon"
                  className="border-border size-8.5 text-muted-foreground hover:text-white"
                  title="พิมพ์รหัสทั้งหมด"
                >
                  <Printer className="size-4" />
                </Button>
              </div>
            </div>

            {/* Vouchers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#22262F] text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-black/20">
                    <th className="py-3 px-4">รหัสคูปอง Wi-Fi</th>
                    <th className="py-3 px-4">ระยะเวลา</th>
                    <th className="py-3 px-4">ความเร็ว (Speed)</th>
                    <th className="py-3 px-4">วันที่/เวลาสร้าง</th>
                    <th className="py-3 px-4">เวลาหมดอายุ</th>
                    <th className="py-3 px-4">รายละเอียดผู้ใช้งาน</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D212A]">
                  {filteredVouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-[#121418]/45 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white tracking-wider">
                        <span className="inline-flex items-center gap-1.5">
                          <span>{v.code}</span>
                          <button
                            onClick={() => handleCopy(v.code)}
                            className="p-1 rounded hover:bg-[#1C2028] text-muted-foreground hover:text-white transition-colors cursor-pointer"
                            title="คัดลอกรหัสคูปอง"
                          >
                            {copiedCode === v.code ? (
                              <Check className="size-3.5 text-green-400" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </button>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{v.duration}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                          {v.speedLimit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {v.createdAt.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {v.expiresAt.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground italic truncate max-w-[140px]">
                        {v.usedByDevice || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {v.status === "Active" && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            เปิดใช้งาน
                          </span>
                        )}
                        {v.status === "Used" && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="size-3" />
                            ใช้งานแล้ว
                          </span>
                        )}
                        {v.status === "Expired" && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                            <XCircle className="size-3" />
                            หมดอายุ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleTriggerDelete(v.id)}
                          className="p-1 rounded bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive transition-all cursor-pointer inline-flex items-center justify-center"
                          title="ลบรหัส"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredVouchers.length === 0 && (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                <Wifi className="size-10 text-[#22262F] stroke-[1.5]" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-white">ไม่พบรหัส Wi-Fi Voucher</p>
                  <p className="text-xs text-muted-foreground">ลองเปลี่ยนคำค้นหา หรือฟิลเตอร์เพื่อค้นหาใหม่</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="ยืนยันการลบรหัสคูปอง Wi-Fi"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบรหัสคูปอง Wi-Fi นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้ และรหัสคูปองนี้จะถูกลบออกจากระบบอย่างถาวร"
      />
    </div>
  )
}
