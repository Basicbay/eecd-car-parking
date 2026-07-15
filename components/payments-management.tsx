"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ParkingTicketModal from "@/components/parking-ticket-modal"
import {
  Receipt,
  Search,
  CheckCircle,
  XCircle,
  TrendingUp,
  Download,
  Printer,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  QrCode,
  FileText
} from "lucide-react"

interface Transaction {
  id: string
  plate: string
  province: string
  checkInTime: Date
  paymentTime: Date
  amount: number
  method: "PromptPay" | "Rabbit LINE Pay" | "Cash"
  status: "Success" | "Failed"
}

export default function PaymentsManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "TXN-881A2D",
      plate: "กข 1234",
      province: "กรุงเทพฯ",
      checkInTime: new Date(Date.now() - 1000 * 60 * 120),
      paymentTime: new Date(Date.now() - 1000 * 60 * 10),
      amount: 40,
      method: "PromptPay",
      status: "Success"
    },
    {
      id: "TXN-994K5R",
      plate: "3มง 9999",
      province: "ชลบุรี",
      checkInTime: new Date(Date.now() - 1000 * 60 * 300),
      paymentTime: new Date(Date.now() - 1000 * 60 * 20),
      amount: 100,
      method: "Rabbit LINE Pay",
      status: "Success"
    },
    {
      id: "TXN-334X9C",
      plate: "รน 8888",
      province: "เชียงใหม่",
      checkInTime: new Date(Date.now() - 1000 * 60 * 60 * 4),
      paymentTime: new Date(Date.now() - 1000 * 60 * 60 * 3.5),
      amount: 80,
      method: "PromptPay",
      status: "Success"
    },
    {
      id: "TXN-112Z5P",
      plate: "ฆฆ 7777",
      province: "ขอนแก่น",
      checkInTime: new Date(Date.now() - 1000 * 60 * 60 * 5),
      paymentTime: new Date(Date.now() - 1000 * 60 * 60 * 4.9),
      amount: 100,
      method: "Cash",
      status: "Success"
    },
    {
      id: "TXN-554M8L",
      plate: "สส 5555",
      province: "ระยอง",
      checkInTime: new Date(Date.now() - 1000 * 60 * 60 * 8),
      paymentTime: new Date(Date.now() - 1000 * 60 * 60 * 7.8),
      amount: 160,
      method: "PromptPay",
      status: "Failed"
    }
  ])

  const [search, setSearch] = useState("")
  const [methodFilter, setMethodFilter] = useState<"All" | "PromptPay" | "Rabbit LINE Pay" | "Cash">("All")

  // Ticket Modal states
  const [selectedVehicleForTicket, setSelectedVehicleForTicket] = useState<any | null>(null)
  const [isTicketOpen, setIsTicketOpen] = useState(false)

  // Calculated values
  const successTransactions = transactions.filter(t => t.status === "Success")
  const totalRevenue = successTransactions.reduce((sum, t) => sum + t.amount, 0)
  const averageBill = successTransactions.length > 0 ? Math.round(totalRevenue / successTransactions.length) : 0

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.plate.includes(search) || t.id.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = methodFilter === "All" ? true : t.method === methodFilter
    return matchesSearch && matchesFilter
  })

  // Export Mock CSV
  const handleExport = () => {
    alert("ระบบกำลังสร้างไฟล์รายงานประวัติชำระเงินในรูปแบบ CSV... (จำลอง)")
  }

  // Open Ticket handler
  const handleOpenTicket = (t: Transaction) => {
    // Map transaction details to ticket props
    setSelectedVehicleForTicket({
      id: t.id.replace("TXN-", "").toLowerCase(),
      plate: t.plate,
      province: t.province,
      slot: "A-04", // mock slot
      checkInTime: t.checkInTime,
      fee: t.amount,
      wifiCode: `EECD-WIFI-${t.id.replace("TXN-", "")}`
    })
    setIsTicketOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Financial Overview stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-card/60 border border-border/80 backdrop-blur-md rounded-2xl flex items-center justify-between shadow-sm hover:border-primary/20 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">รายได้ชำระสำเร็จรวม</span>
            <h3 className="text-3xl font-extrabold text-white">฿{totalRevenue}</h3>
            <p className="text-[10px] text-muted-foreground">ผ่านสแกน QR Code และเงินสด</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
            <DollarSign className="size-5" />
          </div>
        </div>

        <div className="p-5 bg-card/60 border border-border/80 backdrop-blur-md rounded-2xl flex items-center justify-between shadow-sm hover:border-primary/20 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">รายการชำระสำเร็จ</span>
            <h3 className="text-3xl font-extrabold text-white">{successTransactions.length} รายการ</h3>
            <p className="text-[10px] text-muted-foreground">อัตราสำเร็จ {Math.round((successTransactions.length / transactions.length) * 100)}%</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Receipt className="size-5" />
          </div>
        </div>

        <div className="p-5 bg-card/60 border border-border/80 backdrop-blur-md rounded-2xl flex items-center justify-between shadow-sm hover:border-primary/20 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">ค่าจอดรถเฉลี่ย/คัน</span>
            <h3 className="text-3xl font-extrabold text-white">฿{averageBill}</h3>
            <p className="text-[10px] text-muted-foreground">ประมาณการเวลาจอด 3-4 ชั่วโมง</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <ArrowUpRight className="size-5" />
          </div>
        </div>
      </section>

      {/* Main transactions logs container */}
      <div className="bg-card/60 border border-border/80 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#22262F] flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-card/20">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
              <Search className="size-4" />
            </span>
            <Input
              type="text"
              placeholder="ค้นหาทะเบียนรถ หรือหมายเลขทำรายการ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8.5 text-xs"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
              className="flex h-8.5 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="All">ทุกช่องทางชำระ</option>
              <option value="PromptPay">PromptPay QR</option>
              <option value="Rabbit LINE Pay">Rabbit LINE Pay</option>
              <option value="Cash">ชำระเงินสด</option>
            </select>

            <Button
              onClick={handleExport}
              variant="outline"
              className="border-border text-xs gap-1.5 h-8.5 cursor-pointer text-muted-foreground hover:text-white"
            >
              <Download className="size-3.5" />
              ส่งออก CSV
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#22262F] text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-black/20">
                <th className="py-3.5 px-4">เลขทำรายการ (TXN ID)</th>
                <th className="py-3.5 px-4">ทะเบียนรถ</th>
                <th className="py-3.5 px-4">จังหวัด</th>
                <th className="py-3.5 px-4">เวลาเช็คอิน</th>
                <th className="py-3.5 px-4">เวลาจ่ายเงิน</th>
                <th className="py-3.5 px-4">ช่องทาง</th>
                <th className="py-3.5 px-4">ยอดเงิน</th>
                <th className="py-3.5 px-4">สถานะ</th>
                <th className="py-3.5 px-4 text-right">ใบเสร็จ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D212A]">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-[#121418]/45 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white tracking-wider">
                    {t.id}
                  </td>
                  <td className="py-3 px-4 font-bold text-white">{t.plate}</td>
                  <td className="py-3 px-4 text-muted-foreground">{t.province}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {t.checkInTime.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {t.paymentTime.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1">
                      {t.method === "PromptPay" && <QrCode className="size-3.5 text-blue-400" />}
                      {t.method === "Rabbit LINE Pay" && <CreditCard className="size-3.5 text-primary" />}
                      {t.method === "Cash" && <DollarSign className="size-3.5 text-green-400" />}
                      <span className="text-[10px] text-muted-foreground font-medium">{t.method}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-white">฿{t.amount}</td>
                  <td className="py-3 px-4">
                    {t.status === "Success" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-green-500/10 border border-green-500/20 text-green-400 px-2.5 py-0.5 rounded-full">
                        <CheckCircle className="size-3" />
                        สำเร็จ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-0.5 rounded-full">
                        <XCircle className="size-3" />
                        ล้มเหลว
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {t.status === "Success" ? (
                      <button
                        onClick={() => handleOpenTicket(t)}
                        className="p-1 rounded bg-[#121418] hover:bg-muted border border-border text-muted-foreground hover:text-white transition-all cursor-pointer inline-flex items-center justify-center gap-1 text-[10px] font-medium px-2 py-1"
                        title="ดูใบเสร็จ / บัตรจอดรถ"
                      >
                        <Printer className="size-3.5" />
                        ตั๋ว/ใบเสร็จ
                      </button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic px-2">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
            <Receipt className="size-10 text-[#22262F] stroke-[1.5]" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-white">ไม่พบประวัติชำระเงิน</p>
              <p className="text-[10px] text-muted-foreground">ลองเปลี่ยนแปลงคำค้นหา หรือกรองด้วยช่องทางอื่น</p>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Modal Popup */}
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
