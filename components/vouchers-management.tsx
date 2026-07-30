"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertDialog } from "@/components/ui/alert-dialog"
import {
  createWifiVouchers,
  deleteWifiVoucher,
  fetchWifiVouchers,
  formatVoucherDate,
  getStatusApiFilter,
  type CreateWifiVouchersParams,
  type WifiVoucher,
} from "@/lib/wifi-vouchers"
import {
  Wifi,
  Search,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Trash2,
  Printer,
  RefreshCw,
  Sparkles,
  Server,
  Zap
} from "lucide-react"

const getCreateDuration = (duration: string): CreateWifiVouchersParams["duration"] => {
  if (duration.startsWith("3")) return "3h"
  if (duration.startsWith("5")) return "5h"
  if (duration.startsWith("24")) return "1d"
  return "1h"
}

const getCreateSpeedMbps = (speedLimit: string) => Number(speedLimit.match(/\d+/)?.[0] ?? 100)

export default function VouchersManagement() {
  const [localVouchers, setLocalVouchers] = useState<WifiVoucher[]>([])
  const [deletedVoucherIds, setDeletedVoucherIds] = useState<string[]>([])

  // Search & Filter
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Used" | "Expired">("All")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [durationFilter, setDurationFilter] = useState("all")
  const [speedMbpsFilter, setSpeedMbpsFilter] = useState("all")
  const apiStatusFilter = getStatusApiFilter(statusFilter)
  const { data: apiResult, isFetching, refetch } = useQuery({
    queryKey: ["wifi-vouchers", page, limit, apiStatusFilter, durationFilter, speedMbpsFilter],
    queryFn: () =>
      fetchWifiVouchers({
        page,
        limit,
        filter: apiStatusFilter,
        duration: durationFilter,
        speedMbps: speedMbpsFilter,
      }),
  })
  const { mutateAsync: createVouchers, isPending: isGenerating } = useMutation({
    mutationFn: createWifiVouchers,
  })
  const apiVouchers = React.useMemo(() => apiResult?.vouchers ?? [], [apiResult])
  const pagination = apiResult?.pagination ?? null

  const vouchers = React.useMemo(
    () => [
      ...localVouchers,
      ...apiVouchers.filter((voucher) => !deletedVoucherIds.includes(voucher.id)),
    ],
    [apiVouchers, deletedVoucherIds, localVouchers]
  )
  
  // Generation state
  const [duration, setDuration] = useState("1 ชั่วโมง")
  const [speedLimit, setSpeedLimit] = useState("100/100 Mbps")
  const [quantity, setQuantity] = useState(1)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [batchHistory, setBatchHistory] = useState<string[] | null>(null)

  // Deletion state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [voucherToDelete, setVoucherToDelete] = useState<string | null>(null)
  const [selectedVoucherIds, setSelectedVoucherIds] = useState<string[]>([])
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([])
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState<{ deleted: number; total: number } | null>(null)

  // Generate Vouchers
  const handleGenerate = async () => {
    setDeleteMessage(null)

    try {
      const result = await createVouchers({
        duration: getCreateDuration(duration),
        speedMbps: getCreateSpeedMbps(speedLimit),
        quantity,
        realm: "NT_Guest",
      })

      setBatchHistory(result.data.map((voucher) => voucher.voucher_code))
      await refetch()
    } catch (error) {
      setDeleteMessage(error instanceof Error ? error.message : "ไม่สามารถสร้างรหัส Wi-Fi ได้")
    }
  }

  /*
  const handleGenerateLocalMock = () => {
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
        status: "Active",
        apiStatus: "new",
        connectedDevicesCount: 0
      })
      generatedCodes.push(randomCode)
    }

    setLocalVouchers([...newVouchersList, ...localVouchers])
    setBatchHistory(generatedCodes)
  }

  */

  const handleTriggerDelete = (id: string) => {
    const voucher = vouchers.find(v => v.id === id)

    if (voucher?.apiStatus?.toLowerCase() === "active") {
      setDeleteMessage("ไม่สามารถลบได้ เนื่องจากลูกค้ากำลังใช้งานอยู่ (Active)")
      return
    }

    setDeleteMessage(null)
    setVoucherToDelete(id)
    setBulkDeleteIds([])
    setIsDeleteDialogOpen(true)
  }

  const handleToggleSelectVoucher = (id: string, checked: boolean) => {
    setSelectedVoucherIds((currentIds) =>
      checked ? [...currentIds, id] : currentIds.filter((selectedId) => selectedId !== id)
    )
  }

  const handleToggleSelectAll = (checked: boolean) => {
    const selectableIds = filteredVouchers
      .filter((voucher) => voucher.apiStatus?.toLowerCase() !== "active")
      .map((voucher) => voucher.id)

    setSelectedVoucherIds((currentIds) => {
      if (!checked) {
        return currentIds.filter((selectedId) => !selectableIds.includes(selectedId))
      }

      return Array.from(new Set([...currentIds, ...selectableIds]))
    })
  }

  const handleTriggerBulkDelete = () => {
    const selectedVouchers = vouchers.filter((voucher) => selectedVoucherIds.includes(voucher.id))
    const activeVouchers = selectedVouchers.filter((voucher) => voucher.apiStatus?.toLowerCase() === "active")
    const deletableIds = selectedVouchers
      .filter((voucher) => voucher.apiStatus?.toLowerCase() !== "active")
      .map((voucher) => voucher.id)

    if (activeVouchers.length > 0) {
      setDeleteMessage("ไม่สามารถลบได้ เนื่องจากลูกค้ากำลังใช้งานอยู่ (Active)")
    }

    if (deletableIds.length === 0) {
      return
    }

    setVoucherToDelete(null)
    setBulkDeleteIds(deletableIds)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    const idsToDelete = bulkDeleteIds.length > 0 ? bulkDeleteIds : voucherToDelete ? [voucherToDelete] : []
    if (idsToDelete.length > 0) {
      const targetVouchers = idsToDelete
        .map((id) => vouchers.find(v => v.id === id))
        .filter((voucher): voucher is WifiVoucher => Boolean(voucher))

      if (targetVouchers.length === 0) return

      setIsDeleting(true)
      setDeleteProgress({ deleted: 0, total: targetVouchers.length })
      try {
        const deletedIds: string[] = []

        for (const voucher of targetVouchers) {
          await deleteWifiVoucher(voucher.code)
          deletedIds.push(voucher.id)
          setDeleteProgress({ deleted: deletedIds.length, total: targetVouchers.length })
        }

        setLocalVouchers(localVouchers.filter(v => !deletedIds.includes(v.id)))
        setDeletedVoucherIds([...deletedVoucherIds, ...deletedIds])
        setSelectedVoucherIds(selectedVoucherIds.filter((id) => !deletedIds.includes(id)))
        setDeleteMessage(`ลบคูปอง Wi-Fi สำเร็จ ${deletedIds.length} รายการ`)
        await refetch()
      } catch (error) {
        setDeleteMessage(error instanceof Error ? error.message : "ไม่สามารถลบคูปอง Wi-Fi ได้")
      } finally {
        setIsDeleting(false)
        setDeleteProgress(null)
      }

      setIsDeleteDialogOpen(false)
      setVoucherToDelete(null)
      setBulkDeleteIds([])
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
  const selectableVoucherIds = filteredVouchers
    .filter((voucher) => voucher.apiStatus?.toLowerCase() !== "active")
    .map((voucher) => voucher.id)
  const selectedOnPageCount = selectableVoucherIds.filter((id) => selectedVoucherIds.includes(id)).length
  const isAllSelectableSelected = selectableVoucherIds.length > 0 && selectedOnPageCount === selectableVoucherIds.length

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
                disabled={isGenerating}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold h-9 rounded-lg cursor-pointer"
              >
                {isGenerating ? "กำลังสร้างรหัสผ่าน Wi-Fi..." : "สร้างรหัสผ่าน Wi-Fi"}
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
                <div className=" overflow-y-auto space-y-1.5 pr-1.5 scrollbar-thin">
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
                  onChange={(e) => {
                    setPage(1)
                    setStatusFilter(e.target.value as "All" | "Active" | "Used" | "Expired")
                  }}
                  className="flex h-8.5 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="All">ทุกสถานะคูปอง</option>
                  <option value="Active">เปิดการใช้งานอยู่</option>
                  <option value="Used">อุปกรณ์รับสิทธิ์แล้ว</option>
                  <option value="Expired">คูปองหมดอายุ</option>
                </select>

                <select
                  value={durationFilter}
                  onChange={(e) => {
                    setPage(1)
                    setDurationFilter(e.target.value)
                  }}
                  className="flex h-8.5 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="all">ทุกระยะเวลา</option>
                  <option value="1h">1 ชั่วโมง</option>
                  <option value="3h">3 ชั่วโมง</option>
                  <option value="5h">5 ชั่วโมง</option>
                  <option value="1d">1 วัน</option>
                </select>

                <select
                  value={speedMbpsFilter}
                  onChange={(e) => {
                    setPage(1)
                    setSpeedMbpsFilter(e.target.value)
                  }}
                  className="flex h-8.5 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="all">ทุกความเร็ว</option>
                  <option value="30">30 Mbps</option>
                  <option value="50">50 Mbps</option>
                  <option value="100">100 Mbps</option>
                  <option value="300">300 Mbps</option>
                </select>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleTriggerBulkDelete}
                  disabled={selectedVoucherIds.length === 0 || isDeleting}
                  className="h-8.5 text-xs font-semibold"
                >
                  <Trash2 className="size-3.5" />
                  ลบที่เลือก ({selectedVoucherIds.length})
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="border-border size-8.5 text-muted-foreground hover:text-white"
                  title="รีเฟรชตาราง"
                >
                  <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
                </Button>

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

            {deleteMessage && (
              <div className="px-4 py-3 border-b border-[#22262F] bg-black/20 text-xs font-semibold text-white">
                {deleteMessage}
              </div>
            )}

            {deleteProgress && (
              <div className="px-4 py-3 border-b border-[#22262F] bg-primary/10 text-xs font-semibold text-primary">
                กำลังลบ {deleteProgress.deleted} / {deleteProgress.total} รายการ
              </div>
            )}

            {/* Vouchers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#22262F] text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-black/20">
                    <th className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isAllSelectableSelected}
                        disabled={selectableVoucherIds.length === 0 || isDeleting}
                        onChange={(e) => handleToggleSelectAll(e.target.checked)}
                        className="size-4 rounded border-border bg-card accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="เลือกรายการทั้งหมด"
                      />
                    </th>
                    <th className="py-3 px-4">รหัสผ่าน</th>
                    {/* <th className="py-3 px-4">code</th> */}
                    <th className="py-3 px-4">ระยะเวลา</th>
                    <th className="py-3 px-4">ความเร็ว (Speed)</th>
                    <th className="py-3 px-4">วันที่/เวลาสร้าง</th>
                    <th className="py-3 px-4">เวลาหมดอายุ</th>
                    {/* <th className="py-3 px-4">รายละเอียดผู้ใช้งาน</th> */}
                    <th className="py-3 px-4">จำนวนอุปกรณ์</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D212A]">
                  {filteredVouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-[#121418]/45 transition-colors">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedVoucherIds.includes(v.id)}
                          disabled={v.apiStatus?.toLowerCase() === "active" || isDeleting}
                          onChange={(e) => handleToggleSelectVoucher(v.id, e.target.checked)}
                          className="size-4 rounded border-border bg-card accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                          title={v.apiStatus?.toLowerCase() === "active" ? "ไม่สามารถลบได้ เนื่องจากลูกค้ากำลังใช้งานอยู่ (Active)" : "เลือกรายการ"}
                          aria-label={`เลือก ${v.code}`}
                        />
                      </td>
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
                      {/* <td className="py-3 px-4 font-mono text-muted-foreground">{v.code}</td> */}
                      <td className="py-3 px-4 text-muted-foreground">{v.duration}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                          {v.speedLimit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatVoucherDate(v.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {v.expiresAt ? formatVoucherDate(v.expiresAt) : "-"}
                      </td>
                      {/* <td className="py-3 px-4 text-muted-foreground italic truncate max-w-[140px]">
                        {v.usedByDevice || "-"}
                      </td> */}
                      <td className="py-3 px-4 text-muted-foreground">{v.connectedDevicesCount}</td>
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

            {pagination && (
              <div className="p-4 border-t border-[#22262F] flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-card/20">
                <span className="text-xs text-muted-foreground">
                  หน้า {pagination.current_page} / {pagination.total_pages} ทั้งหมด {pagination.total_items} รายการ
                </span>
                <div className="flex gap-2 justify-end">
                  <select
                    value={limit}
                    onChange={(e) => {
                      setPage(1)
                      setLimit(Number(e.target.value))
                    }}
                    className="flex h-8 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value={10}>10 / หน้า</option>
                    <option value={20}>20 / หน้า</option>
                    <option value={50}>50 / หน้า</option>
                    <option value={100}>100 / หน้า</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.has_prev}
                    onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                    className="border-border h-8 text-xs text-muted-foreground hover:text-white disabled:opacity-50"
                  >
                    ก่อนหน้า
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.has_next}
                    onClick={() => setPage((currentPage) => currentPage + 1)}
                    className="border-border h-8 text-xs text-muted-foreground hover:text-white disabled:opacity-50"
                  >
                    ถัดไป
                  </Button>
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
        loading={isDeleting}
        title={bulkDeleteIds.length > 0 ? "ยืนยันการลบรหัสคูปอง Wi-Fi หลายรายการ" : "ยืนยันการลบรหัสคูปอง Wi-Fi"}
        description={
          deleteProgress
            ? `กำลังลบ ${deleteProgress.deleted} / ${deleteProgress.total} รายการ`
            : 
          bulkDeleteIds.length > 0
            ? `คุณแน่ใจหรือไม่ว่าต้องการลบรหัสคูปอง Wi-Fi ${bulkDeleteIds.length} รายการ? ระบบจะแสดงจำนวนที่ลบไปแล้วระหว่างดำเนินการ`
            : "คุณแน่ใจหรือไม่ว่าต้องการลบรหัสคูปอง Wi-Fi นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้ และรหัสคูปองนี้จะถูกลบออกจากระบบอย่างถาวร"
        }
      />
    </div>
  )
}
