"use client"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Clock,
  History,
  KeyRound,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Role {
  id: string
  code: string
  name: string
  description: string | null
}

interface ManagedUser {
  id: string
  email: string | null
  fullName: string
  roles: Role[]
}

interface Permission {
  id: string
  code: string
  name: string
  description: string | null
  resource: string
  action: string
}

interface RolePermissionsData {
  role?: Role
  permissions?: Permission[]
}

interface AuditLog {
  id: string
  userId: string | null
  action: string
  resource: string
  resourceId: string | null
  oldData: RolePermissionsData | null
  newData: RolePermissionsData | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
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

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
}

const actionLabel = "เปลี่ยนสิทธิ์บทบาท"

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

  return "ไม่สามารถโหลดประวัติการจัดการสิทธิ์ได้"
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

const getRoleLabel = (role?: Role) => {
  if (!role) return "บทบาท"

  return roleLabels[role.code] ?? role.name ?? role.code
}

const getPermissionLabel = (permission: Permission) =>
  permission.name || permission.code

const getPermissionChanges = (log: AuditLog) => {
  const oldPermissions = log.oldData?.permissions ?? []
  const newPermissions = log.newData?.permissions ?? []
  const oldById = new Map(oldPermissions.map((permission) => [permission.id, permission]))
  const newById = new Map(newPermissions.map((permission) => [permission.id, permission]))
  const added = newPermissions.filter((permission) => !oldById.has(permission.id))
  const removed = oldPermissions.filter((permission) => !newById.has(permission.id))

  return { added, removed }
}

const getActorName = (
  userId: string | null,
  usersById: Map<string, ManagedUser>,
) => {
  if (!userId) return "ระบบ"

  const actor = usersById.get(userId)
  const fullName = actor?.fullName?.trim()
  const roleCode = actor?.roles[0]?.code

  if (fullName) return fullName

  return roleCode ? roleLabels[roleCode] ?? roleCode : "ผู้ดูแลระบบ"
}

const getIpAddress = (value: string | null) => {
  if (!value || value === "unknown") return "-"

  return value
}

export default function PermissionAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [usersById, setUsersById] = useState<Map<string, ManagedUser>>(new Map())
  const [metadata, setMetadata] = useState<PaginationMetadata>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const roles = useMemo(() => {
    const roleMap = new Map<string, Role>()

    for (const log of logs) {
      const role = log.newData?.role ?? log.oldData?.role

      if (role) {
        roleMap.set(role.code, role)
      }
    }

    return Array.from(roleMap.values()).sort((first, second) =>
      getRoleLabel(first).localeCompare(getRoleLabel(second), "th"),
    )
  }, [logs])

  const filteredLogs = logs.filter((log) => {
    const role = log.newData?.role ?? log.oldData?.role

    if (roleFilter !== "all" && role?.code !== roleFilter) {
      return false
    }

    if (!search.trim()) {
      return true
    }

    const changes = getPermissionChanges(log)
    const searchableText = [
      getActorName(log.userId, usersById),
      getRoleLabel(role),
      log.ipAddress ?? "",
      ...changes.added.map(getPermissionLabel),
      ...changes.removed.map(getPermissionLabel),
    ]
      .join(" ")
      .toLowerCase()

    return searchableText.includes(search.trim().toLowerCase())
  })

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
    })

    try {
      const response = await fetch(
        `/api/audit-logs/permission-management?${params.toString()}`,
        { cache: "no-store" },
      )
      const payload = (await response.json()) as ApiEnvelope<
        AuditLog[],
        PaginationMetadata
      >

      if (!response.ok || !payload.success) {
        throw new Error(getErrorMessage(payload))
      }

      setLogs(payload.data)
      setMetadata(payload.metadata)
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "ไม่สามารถโหลดประวัติการจัดการสิทธิ์ได้",
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers()
      fetchLogs()
    }, 0)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/80 bg-card/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              รายการทั้งหมด
            </span>
            <History className="size-4 text-primary" />
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{metadata.total}</p>
          <p className="text-xs text-muted-foreground">ประวัติการเปลี่ยนสิทธิ์บทบาท</p>
        </div>
        <div className="rounded-lg border border-border/80 bg-card/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              รูปแบบเวลา
            </span>
            <Clock className="size-4 text-primary" />
          </div>
          <p className="mt-3 text-sm font-bold text-white">เวลาไทย</p>
          <p className="text-xs text-muted-foreground">
            วัน/เดือน/ปี พ.ศ. ชั่วโมง:นาที:วินาที น.
          </p>
        </div>
        <div className="rounded-lg border border-border/80 bg-card/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              รายการที่แสดง
            </span>
            <KeyRound className="size-4 text-primary" />
          </div>
          <p className="mt-3 text-sm font-bold text-white">จัดการสิทธิ์</p>
          <p className="text-xs text-muted-foreground">
            แสดงการเพิ่มและถอด permission ของแต่ละ role
          </p>
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
              placeholder="ค้นหา เช่น Admin, View User, IP Address"
              className="h-9 pl-9 text-xs"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">ทุกบทบาท</option>
            {roles.map((role) => (
              <option key={role.code} value={role.code}>
                {getRoleLabel(role)}
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
                <th className="py-3 px-4">บทบาท</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D212A]">
              {filteredLogs.map((log) => {
                const role = log.newData?.role ?? log.oldData?.role
                const changes = getPermissionChanges(log)
                const actor = getActorName(log.userId, usersById)

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-[#121418]/50 transition-colors align-top"
                  >
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {formatThaiDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                        {actionLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                      {getRoleLabel(role)}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                      {getIpAddress(log.ipAddress)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">
                        {actor} เปลี่ยนสิทธิ์ของ {getRoleLabel(role)}
                      </p>
                      <div className="mt-2 space-y-1 text-muted-foreground">
                        {changes.added.length > 0 && (
                          <p>
                            เพิ่ม:{" "}
                            <span className="text-green-400">
                              {changes.added.map(getPermissionLabel).join(", ")}
                            </span>
                          </p>
                        )}
                        {changes.removed.length > 0 && (
                          <p>
                            ถอด:{" "}
                            <span className="text-destructive">
                              {changes.removed.map(getPermissionLabel).join(", ")}
                            </span>
                          </p>
                        )}
                        {changes.added.length === 0 && changes.removed.length === 0 && (
                          <p>ไม่มีรายการ permission ที่เปลี่ยนแปลง</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="p-10 text-center text-muted-foreground text-xs">
            <RefreshCw className="mx-auto mb-3 size-6 animate-spin text-primary" />
            กำลังโหลดประวัติการจัดการสิทธิ์...
          </div>
        )}

        {!isLoading && filteredLogs.length === 0 && (
          <div className="p-10 text-center text-muted-foreground text-xs">
            <ShieldCheck className="mx-auto mb-3 size-8 text-[#22262F]" />
            ไม่พบประวัติการจัดการสิทธิ์
          </div>
        )}
      </div>
    </div>
  )
}
