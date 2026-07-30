"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Activity, AlertCircle, Clock, RefreshCw, Search, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AuditLog {
  id: string
  userId: string | null
  action: string
  resource: string
  resourceId: string | null
  oldData: Record<string, unknown> | null
  newData: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

interface Role {
  id: string
  code: string
  name: string
  description: string | null
}

interface ManagedUser {
  id: string
  username: string
  email: string | null
  fullName: string
  status: string
  roles: Role[]
}

interface ApiEnvelope<TData, TMetadata = Record<string, never>> {
  success: boolean
  message: string
  data: TData
  metadata: TMetadata
}

interface PaginationMetadata {
  page: number
  limit: number
  total: number
  totalPages: number
}

const actionLabels: Record<string, string> = {
  "user.created": "เพิ่มผู้ใช้",
  "user.updated": "แก้ไขผู้ใช้",
  "user.deleted": "ลบผู้ใช้",
  "user.password_reset": "เปลี่ยนรหัสผ่าน",
  "user.roles_assigned": "เปลี่ยนสิทธิ์",
  "user.email_changed": "แก้ไขอีเมล",
  "user.name_changed": "แก้ไขชื่อ",
  "user.status_changed": "เปลี่ยนสถานะ",
}

const actionOptions = Object.keys(actionLabels)
const hiddenActions = new Set(["user.username_changed"])

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
}

const actionClass = (action: string) => {
  if (action.includes("deleted")) {
    return "border-destructive/20 bg-destructive/10 text-destructive"
  }

  if (action.includes("created")) {
    return "border-green-500/20 bg-green-500/10 text-green-400"
  }

  if (action.includes("roles")) {
    return "border-primary/20 bg-primary/10 text-primary"
  }

  if (action.includes("password") || action.includes("status")) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300"
  }

  return "border-blue-500/20 bg-blue-500/10 text-blue-400"
}

const getErrorMessage = (payload: unknown) => {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload
  ) {
    const message = (payload as { message?: unknown }).message

    if (Array.isArray(message)) {
      return message.join(", ")
    }

    if (typeof message === "string") {
      return message
    }
  }

  return "ไม่สามารถโหลดข้อมูล logs ได้"
}

const formatThaiDateTime = (value: string) => {
  const date = new Date(value)
  const parts = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date)
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ""

  return `${getPart("day")}/${getPart("month")}/${getPart("year")} ${getPart(
    "hour",
  )}:${getPart("minute")}:${getPart("second")} น.`
}

const getDisplayName = (value: Record<string, unknown> | null) => {
  if (!value) return "ผู้ใช้"

  const fullName = value.fullName
  const username = value.username
  const email = value.email

  if (typeof fullName === "string" && fullName) {
    return fullName
  }

  if (typeof username === "string" && username) {
    return `@${username}`
  }

  if (typeof email === "string" && email) {
    return email
  }

  return "ผู้ใช้"
}

const getUsernameLabel = (value: Record<string, unknown> | null) => {
  const username = value?.username

  if (typeof username === "string" && username.trim()) {
    return `@${username}`
  }

  return getDisplayName(value)
}

const getTextValue = (
  value: Record<string, unknown> | null,
  key: string,
  fallback = "-",
) => {
  const field = value?.[key]

  if (typeof field === "string" && field.trim()) {
    return field
  }

  return fallback
}

const statusLabelMap: Record<string, string> = {
  ACTIVE: "ใช้งาน",
  INACTIVE: "ปิดใช้งาน",
  SUSPENDED: "ระงับการใช้งาน",
}

const getStatusValue = (value: Record<string, unknown> | null) => {
  const status = getTextValue(value, "status")

  return statusLabelMap[status] ?? status
}

const getIpAddress = (value: string | null) => {
  if (!value || value === "unknown") {
    return "-"
  }

  return value
}

const getRoleNames = (value: Record<string, unknown> | null) => {
  const roles = value?.roles

  if (!Array.isArray(roles)) {
    return ""
  }

  return roles
    .map((role) => {
      if (typeof role !== "object" || role === null) return null
      const code = (role as { code?: unknown }).code
      return typeof code === "string" ? roleLabels[code] ?? code : null
    })
    .filter(Boolean)
    .join(", ")
}

const getActorName = (
  userId: string | null,
  usersById: Map<string, ManagedUser>,
) => {
  if (!userId) {
    return "ระบบ"
  }

  const actor = usersById.get(userId)
  const fullName = actor?.fullName?.trim()
  const roleCode = actor?.roles[0]?.code

  if (fullName) {
    return fullName
  }

  return roleCode ? roleLabels[roleCode] ?? roleCode : "ผู้ดูแลระบบ"
}

const describeLog = (log: AuditLog, usersById: Map<string, ManagedUser>) => {
  const beforeName = getDisplayName(log.oldData)
  const afterName = getDisplayName(log.newData)
  const actor = getActorName(log.userId, usersById)

  switch (log.action) {
    case "user.created":
      return `${actor} เพิ่มผู้ใช้ ${afterName}`
    case "user.updated":
      return `${actor} แก้ไขข้อมูลผู้ใช้ ${afterName}`
    case "user.deleted":
      return `${actor} ลบผู้ใช้ ${beforeName}`
    case "user.password_reset":
      return `${actor} เปลี่ยนรหัสผ่านของ ${getUsernameLabel(log.newData ?? log.oldData)}`
    case "user.roles_assigned": {
      const roles = getRoleNames(log.newData)
      return `${actor} เปลี่ยนสิทธิ์ของ ${afterName}${roles ? ` เป็น ${roles}` : ""}`
    }
    case "user.email_changed":
      return `${actor} แก้ไขอีเมลของ ${afterName} จาก ${getTextValue(
        log.oldData,
        "email",
      )} เป็น ${getTextValue(log.newData, "email")}`
    case "user.name_changed":
      return `${actor} แก้ไขชื่อผู้ใช้จาก ${getTextValue(
        log.oldData,
        "fullName",
      )} เป็น ${getTextValue(log.newData, "fullName")}`
    case "user.status_changed":
      return `${actor} เปลี่ยนสถานะของ ${afterName} จาก ${getStatusValue(
        log.oldData,
      )} เป็น ${getStatusValue(log.newData)}`
    default:
      return `${actor} ทำรายการกับ ${afterName}`
  }
}

const describeDetails = (log: AuditLog) => {
  const details: string[] = []

  if (log.resourceId) {
    details.push(`รหัสอ้างอิง: ${log.resourceId}`)
  }

  return details.join(" · ")
}

export default function UserAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [usersById, setUsersById] = useState<Map<string, ManagedUser>>(new Map())
  const [metadata, setMetadata] = useState<PaginationMetadata>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users?page=1&limit=100", {
        cache: "no-store",
      })
      const payload = (await response.json()) as ApiEnvelope<
        ManagedUser[],
        PaginationMetadata
      >

      if (response.ok && payload.success) {
        setUsersById(new Map(payload.data.map((user) => [user.id, user])))
      }
    } catch {
      setUsersById(new Map())
    }
  }

  const fetchLogs = async () => {
    setIsLoading(true)
    setError(null)

    const params = new URLSearchParams({
      page: "1",
      limit: "50",
      resource: "user",
    })

    if (search.trim()) {
      params.set("search", search.trim())
    }

    if (actionFilter !== "all") {
      params.set("action", actionFilter)
    }

    try {
      const response = await fetch(`/api/audit-logs?${params.toString()}`, {
        cache: "no-store",
      })
      const payload = (await response.json()) as ApiEnvelope<
        AuditLog[],
        PaginationMetadata
      >

      if (!response.ok || !payload.success) {
        throw new Error(getErrorMessage(payload))
      }

      setLogs(payload.data.filter((log) => !hiddenActions.has(log.action)))
      setMetadata(payload.metadata)
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "ไม่สามารถโหลดข้อมูล logs ได้",
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers()
    }, 0)

    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchLogs()
    }, 250)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, actionFilter])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/80 bg-card/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              รายการทั้งหมด
            </span>
            <Activity className="size-4 text-primary" />
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{metadata.total}</p>
          <p className="text-xs text-muted-foreground">ประวัติการจัดการผู้ใช้</p>
        </div>
        <div className="rounded-lg border border-border/80 bg-card/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              รูปแบบเวลา
            </span>
            <Clock className="size-4 text-primary" />
          </div>
          <p className="mt-3 text-sm font-bold text-white">เวลาไทย</p>
          <p className="text-xs text-muted-foreground">วัน/เดือน/ปี พ.ศ. ชั่วโมง:นาที:วินาที น.</p>
        </div>
        <div className="rounded-lg border border-border/80 bg-card/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              รายการที่บันทึก
            </span>
            <UserCheck className="size-4 text-primary" />
          </div>
          <p className="mt-3 text-sm font-bold text-white">จัดการผู้ใช้</p>
          <p className="text-xs text-muted-foreground">เพิ่ม ลบ เปลี่ยนรหัสผ่าน เปลี่ยนสถานะ และแก้ไขข้อมูลผู้ใช้</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-lg">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
              <Search className="size-4" />
            </span>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหาประวัติการทำรายการ"
              className="h-9 pl-9 text-xs"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">ทุกประเภท</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {actionLabels[action] ?? action}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={fetchLogs}
          disabled={isLoading}
          className="h-9 text-xs"
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          รีเฟรช
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="rounded-lg border border-border/80 bg-card/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#22262F] bg-black/20 text-muted-foreground uppercase">
                <th className="py-3 px-4">วันที่และเวลา</th>
                <th className="py-3 px-4">ประเภท</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D212A]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#121418]/50 transition-colors align-top">
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                    {formatThaiDateTime(log.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 font-semibold ${actionClass(log.action)}`}
                    >
                      {actionLabels[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                    {getIpAddress(log.ipAddress)}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-white">
                      {describeLog(log, usersById)}
                    </p>
                    {describeDetails(log) && (
                      <p className="mt-1 text-muted-foreground">
                        {describeDetails(log)}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="p-10 text-center text-muted-foreground text-xs">
            <RefreshCw className="mx-auto mb-3 size-6 animate-spin text-primary" />
            กำลังโหลด audit logs...
          </div>
        )}

        {!isLoading && logs.length === 0 && (
          <div className="p-10 text-center text-muted-foreground text-xs">
            <Activity className="mx-auto mb-3 size-8 text-[#22262F]" />
            ไม่พบข้อมูล logs
          </div>
        )}
      </div>
    </div>
  )
}
