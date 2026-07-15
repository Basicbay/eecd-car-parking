"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ParkingTicketModal from "@/components/parking-ticket-modal"
import {
  Car,
  Search,
  Filter,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Grid,
  List,
  MapPin,
  RefreshCw,
  LogOut,
  FileText
} from "lucide-react"

interface Vehicle {
  id: string
  plate: string
  province: string
  slot: string
  checkInTime: Date
  status: "Parked" | "Paid" | "Exited"
  fee: number
}

export default function VehiclesManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: "1", plate: "กข 1234", province: "กรุงเทพฯ", slot: "A-01", checkInTime: new Date(Date.now() - 1000 * 60 * 20), status: "Parked", fee: 20 },
    { id: "2", plate: "3มง 9999", province: "ชลบุรี", slot: "B-03", checkInTime: new Date(Date.now() - 1000 * 60 * 60 * 2.5), status: "Parked", fee: 60 },
    { id: "3", plate: "รน 8888", province: "เชียงใหม่", slot: "A-05", checkInTime: new Date(Date.now() - 1000 * 60 * 60 * 4), status: "Paid", fee: 80 },
    { id: "4", plate: "ฆฆ 7777", province: "ขอนแก่น", slot: "C-01", checkInTime: new Date(Date.now() - 1000 * 60 * 10), status: "Parked", fee: 0 },
    { id: "5", plate: "สส 5555", province: "ระยอง", slot: "B-01", checkInTime: new Date(Date.now() - 1000 * 60 * 60 * 6), status: "Exited", fee: 120 },
  ])

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"All" | "Parked" | "Paid" | "Exited">("All")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")

  // Form states
  const [newPlate, setNewPlate] = useState("")
  const [newProvince, setNewProvince] = useState("กรุงเทพฯ")
  const [newSlot, setNewSlot] = useState("A-02")
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Ticket Modal states
  const [selectedVehicleForTicket, setSelectedVehicleForTicket] = useState<any | null>(null)
  const [isTicketOpen, setIsTicketOpen] = useState(false)

  // Map slots config
  const zones = ["A", "B", "C"]
  const slotNumbers = ["01", "02", "03", "04", "05", "06", "07", "08"]

  // Handle manual check-in
  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlate.trim()) return

    // Check if slot is occupied
    const isOccupied = vehicles.some(v => v.slot === newSlot && v.status !== "Exited")
    if (isOccupied) {
      alert(`ช่องจอด ${newSlot} มีรถจอดอยู่แล้ว กรุณาเลือกช่องจอดอื่น`)
      return
    }

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
    setIsFormOpen(false)

    // Auto open printed ticket modal for check-in
    setSelectedVehicleForTicket({
      ...newVehicle,
      wifiCode: `EECD-WIFI-${newVehicle.id.toUpperCase()}`
    })
    setIsTicketOpen(true)
  }

  const handlePay = (id: string) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, status: "Paid" } : v))
  }

  const handleExit = (id: string) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, status: "Exited" } : v))
  }

  // Filter & Search Logic
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.plate.includes(search) || v.province.includes(search) || v.slot.includes(search)
    const matchesFilter = statusFilter === "All" ? true : v.status === statusFilter
    return matchesSearch && matchesFilter
  })

  // Get occupying vehicle for a slot
  const getSlotOccupant = (slotCode: string) => {
    return vehicles.find(v => v.slot === slotCode && v.status !== "Exited")
  }

  return (
    <div className="space-y-6">
      {/* Subheader Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search & Filter controls */}
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
              <Search className="size-4" />
            </span>
            <Input
              type="text"
              placeholder="ค้นหาทะเบียนรถ, จังหวัด หรือช่องจอด..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="flex h-9 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
            >
              <option value="All">ทุกสถานะ</option>
              <option value="Parked">กำลังจอดอยู่</option>
              <option value="Paid">ชำระเงินแล้ว</option>
              <option value="Exited">ออกจากลานจอด</option>
            </select>

            <div className="flex rounded-lg border border-border bg-card p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  viewMode === "table" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-white"
                }`}
                title="มุมมองตาราง"
              >
                <List className="size-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-white"
                }`}
                title="แผนผังช่องจอด"
              >
                <Grid className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold h-9 rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <PlusCircle className="size-4" />
          เช็คอินรถเข้าจอดใหม่
        </Button>
      </div>

      {/* Manual Check-In Modal/Card */}
      {isFormOpen && (
        <div className="p-5 bg-card/85 border border-primary/20 backdrop-blur-md rounded-2xl space-y-4 max-w-lg animate-fadeIn">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Car className="size-4 text-primary" />
              กรอกข้อมูลเพื่อบันทึกเช็คอินรถเข้า
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-muted-foreground hover:text-white"
            >
              ยกเลิก
            </button>
          </div>

          <form onSubmit={handleCheckIn} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">เลขทะเบียนรถ</label>
                <Input
                  type="text"
                  placeholder="เช่น 3มง 9999"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">จังหวัด</label>
                <select
                  value={newProvince}
                  onChange={(e) => setNewProvince(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
                >
                  <option value="กรุงเทพฯ">กรุงเทพฯ</option>
                  <option value="ชลบุรี">ชลบุรี</option>
                  <option value="เชียงใหม่">เชียงใหม่</option>
                  <option value="ขอนแก่น">ขอนแก่น</option>
                  <option value="ระยอง">ระยอง</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">ช่องจอด</label>
                <select
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
                >
                  {zones.map(z =>
                    slotNumbers.map(n => {
                      const code = `${z}-${n}`
                      const occupant = getSlotOccupant(code)
                      return (
                        <option key={code} value={code} disabled={!!occupant}>
                          {code} {occupant ? `(ไม่ว่าง: ${occupant.plate})` : ""}
                        </option>
                      )
                    })
                  )}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
                className="text-xs h-9 cursor-pointer"
              >
                ปิดหน้าต่าง
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold h-9 cursor-pointer"
              >
                ยืนยันการบันทึก
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* View Mode 1: Table List */}
      {viewMode === "table" && (
        <div className="bg-card/60 border border-border/80 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#22262F] text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-black/20">
                  <th className="py-3.5 px-4">ทะเบียนรถ</th>
                  <th className="py-3.5 px-4">จังหวัด</th>
                  <th className="py-3.5 px-4">ตำแหน่งช่องจอด</th>
                  <th className="py-3.5 px-4">เวลาเช็คอิน</th>
                  <th className="py-3.5 px-4">ชั่วโมงสะสม</th>
                  <th className="py-3.5 px-4">ค่าบริการลานจอด</th>
                  <th className="py-3.5 px-4">สถานะ</th>
                  <th className="py-3.5 px-4 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D212A]">
                {filteredVehicles.map((v) => {
                  const durationHrs = (Date.now() - v.checkInTime.getTime()) / (1000 * 60 * 60)
                  return (
                    <tr key={v.id} className="hover:bg-[#121418]/45 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{v.plate}</td>
                      <td className="py-3 px-4 text-muted-foreground">{v.province}</td>
                      <td className="py-3 px-4 font-mono text-primary font-semibold">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {v.slot}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {v.checkInTime.toLocaleDateString("th-TH")} &bull; {v.checkInTime.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {v.status === "Exited" ? "-" : `${Math.ceil(durationHrs)} ชม.`}
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
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                            กำลังจอด
                          </span>
                        )}
                        {v.status === "Paid" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-green-500/10 border border-green-500/20 text-green-400 px-2.5 py-0.5 rounded-full">
                            <CheckCircle className="size-3" />
                            ชำระเงินแล้ว
                          </span>
                        )}
                        {v.status === "Exited" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#22262F] text-muted-foreground px-2.5 py-0.5 rounded-full">
                            <LogOut className="size-3" />
                            ออกแล้ว
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
                              className="px-2.5 py-1 rounded bg-[#EAB308]/10 hover:bg-[#EAB308]/20 border border-[#EAB308]/20 text-[#EAB308] text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <CreditCard className="size-3" />
                              รับชำระเงิน
                            </button>
                          )}
                          {v.status === "Paid" && (
                            <button
                              onClick={() => handleExit(v.id)}
                              className="px-2.5 py-1 rounded bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <LogOut className="size-3" />
                              ยืนยันออก
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredVehicles.length === 0 && (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
              <Car className="size-10 text-[#22262F] stroke-[1.5]" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-white">ไม่พบข้อมูลรถยนต์</p>
                <p className="text-[10px] text-muted-foreground">ลองเปลี่ยนคำค้นหา หรือกรองตามสถานะอื่น</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Mode 2: Grid Map View */}
      {viewMode === "grid" && (
        <div className="space-y-6">
          {zones.map(zone => (
            <div key={zone} className="p-5 bg-card/40 border border-border/80 backdrop-blur-md rounded-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-[#22262F] pb-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  โซนจอดรถ {zone} (Parking Zone {zone})
                </h4>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  กำลังใช้งาน {vehicles.filter(v => v.slot.startsWith(zone) && v.status !== "Exited").length} / {slotNumbers.length}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                {slotNumbers.map(num => {
                  const code = `${zone}-${num}`
                  const occupant = getSlotOccupant(code)

                  return (
                    <div
                      key={code}
                      className={`p-3.5 rounded-xl border flex flex-col items-center justify-between text-center min-h-[90px] transition-all relative group overflow-hidden ${
                        occupant
                          ? occupant.status === "Paid"
                            ? "bg-green-500/5 border-green-500/30 hover:border-green-500/50"
                            : "bg-primary/5 border-primary/30 hover:border-primary/55"
                          : "bg-card border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      {/* Slot code label */}
                      <span className="text-[10px] font-bold text-muted-foreground group-hover:text-white transition-colors">
                        {code}
                      </span>

                      {occupant ? (
                        <div className="space-y-1 my-1">
                          <p className="text-xs font-bold text-white tracking-wide">{occupant.plate}</p>
                          <p className="text-[9px] text-muted-foreground truncate max-w-[80px]">{occupant.province}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-green-400 font-semibold my-1">ว่าง</span>
                      )}

                      {/* Small action tag */}
                      {occupant && (
                        <div className="absolute inset-0 bg-[#090A0C]/90 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2">
                          <span className="text-[9px] text-white font-semibold">{occupant.plate}</span>
                          <span className="text-[8px] text-primary font-mono">฿{occupant.fee}</span>
                          
                          <button
                            onClick={() => {
                              setSelectedVehicleForTicket({
                                ...occupant,
                                wifiCode: `EECD-WIFI-${occupant.id.toUpperCase()}`
                              })
                              setIsTicketOpen(true)
                            }}
                            className="w-full text-[8px] py-0.5 rounded bg-blue-500 hover:bg-blue-600 text-white font-bold cursor-pointer"
                          >
                            ดูบัตรจอด
                          </button>
                          
                          {occupant.status === "Parked" ? (
                            <button
                              onClick={() => handlePay(occupant.id)}
                              className="w-full text-[8px] py-0.5 rounded bg-primary text-primary-foreground font-bold cursor-pointer"
                            >
                              จ่ายเงิน
                            </button>
                          ) : (
                            <button
                              onClick={() => handleExit(occupant.id)}
                              className="w-full text-[8px] py-0.5 rounded bg-green-500 text-white font-bold cursor-pointer"
                            >
                              ปล่อยรถออก
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

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
