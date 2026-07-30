"use client"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Check,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  PlusCircle,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertDialog } from "@/components/ui/alert-dialog"

type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED"

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
  status: UserStatus
  roles: Role[]
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
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

interface UserForm {
  email: string
  fullName: string
  status: UserStatus
  password: string
  roleId: string
}

const defaultForm: UserForm = {
  email: "",
  fullName: "",
  status: "ACTIVE",
  password: "",
  roleId: "",
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

  return "ไม่สามารถดำเนินการได้"
}

const statusClassMap: Record<UserStatus, string> = {
  ACTIVE: "border-green-500/20 bg-green-500/10 text-green-400",
  INACTIVE: "border-muted-foreground/20 bg-muted/10 text-muted-foreground",
  SUSPENDED: "border-destructive/20 bg-destructive/10 text-destructive",
}

const statusLabelMap: Record<UserStatus, string> = {
  ACTIVE: "ใช้งาน",
  INACTIVE: "ปิดใช้งาน",
  SUSPENDED: "ระงับการใช้งาน",
}

const SUPER_ADMIN_ROLE_CODE = "SUPER_ADMIN"

const hasRoleCode = (user: ManagedUser, roleCode: string) =>
  user.roles.some((role) => role.code === roleCode)

const getVisibleRoles = (user: ManagedUser) => {
  if (hasRoleCode(user, SUPER_ADMIN_ROLE_CODE)) {
    return user.roles.filter((role) => role.code === SUPER_ADMIN_ROLE_CODE)
  }

  return user.roles.filter((role) => role.code !== SUPER_ADMIN_ROLE_CODE)
}

const isSuperAdmin = (user: ManagedUser) =>
  hasRoleCode(user, SUPER_ADMIN_ROLE_CODE)

const getPrimaryVisibleRoleId = (user: ManagedUser) =>
  getVisibleRoles(user)[0]?.id ?? ""

export default function UsersManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [metadata, setMetadata] = useState<PaginationMetadata>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<UserStatus | "ALL">("ALL")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [form, setForm] = useState<UserForm>(defaultForm)

  const activeUsers = useMemo(
    () => users.filter((user) => user.status === "ACTIVE").length,
    [users],
  )
  const usersWithRoles = useMemo(
    () => users.filter((user) => user.roles.length > 0).length,
    [users],
  )
  const sortedUsers = useMemo(() => {
    return [...users].sort((first, second) => {
      const firstIsSuperAdmin = isSuperAdmin(first)
      const secondIsSuperAdmin = isSuperAdmin(second)

      if (firstIsSuperAdmin !== secondIsSuperAdmin) {
        return firstIsSuperAdmin ? -1 : 1
      }

      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      )
    })
  }, [users])

  const fetchRoles = async () => {
    const response = await fetch("/api/roles", { cache: "no-store" })
    const payload = (await response.json()) as ApiEnvelope<Role[]>

    if (!response.ok || !payload.success) {
      throw new Error(getErrorMessage(payload))
    }

    setRoles(payload.data)
  }

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)

    const params = new URLSearchParams({
      page: "1",
      limit: "100",
      sort: "createdAt",
      order: "DESC",
    })

    if (search.trim()) {
      params.set("search", search.trim())
    }

    if (statusFilter !== "ALL") {
      params.set("status", statusFilter)
    }

    try {
      const response = await fetch(`/api/users?${params.toString()}`, {
        cache: "no-store",
      })
      const payload = (await response.json()) as ApiEnvelope<
        ManagedUser[],
        PaginationMetadata
      >

      if (!response.ok || !payload.success) {
        throw new Error(getErrorMessage(payload))
      }

      setUsers(payload.data)
      setMetadata(payload.metadata)
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "ไม่สามารถโหลดข้อมูลผู้ใช้ได้",
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRoles().catch((rolesError) => {
        setError(
          rolesError instanceof Error
            ? rolesError.message
            : "ไม่สามารถโหลดข้อมูลสิทธิ์ผู้ใช้ได้",
        )
      })
    }, 0)

    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers()
    }, 250)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter])

  const resetForm = () => {
    setForm(defaultForm)
    setEditingUser(null)
    setShowPassword(false)
    setIsFormOpen(false)
  }

  const openCreateForm = () => {
    setError(null)
    setSuccess(null)
    setEditingUser(null)
    setShowPassword(false)
    setForm(defaultForm)
    setIsFormOpen(true)
  }

  const openEditForm = (user: ManagedUser) => {
    setError(null)
    setSuccess(null)
    setEditingUser(user)
    setShowPassword(false)
    setForm({
      email: user.email ?? "",
      fullName: user.fullName,
      status: user.status,
      password: "",
      roleId: getPrimaryVisibleRoleId(user),
    })
    setIsFormOpen(true)
  }

  const validateForm = () => {
    if (!form.email.trim() || !form.email.includes("@")) {
      return "กรุณากรอกอีเมลให้ถูกต้อง"
    }

    if (!form.fullName.trim()) {
      return "กรุณากรอกชื่อผู้ใช้"
    }

    if (!editingUser && form.password.length < 8) {
      return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"
    }

    if (form.password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(form.password)) {
      return "รหัสผ่านต้องมีตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และตัวเลข"
    }

    if (!form.roleId) {
      return "กรุณาเลือกสิทธิ์ผู้ใช้"
    }

    return null
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (editingUser) {
        const updateResponse = await fetch(`/api/users/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email.trim(),
            fullName: form.fullName.trim(),
            status: form.status,
          }),
        })
        const updatePayload = await updateResponse.json()

        if (!updateResponse.ok || !updatePayload.success) {
          throw new Error(getErrorMessage(updatePayload))
        }

        if (form.roleId !== getPrimaryVisibleRoleId(editingUser)) {
          const rolesResponse = await fetch(`/api/users/${editingUser.id}/roles`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roleIds: [form.roleId] }),
          })
          const rolesPayload = await rolesResponse.json()

          if (!rolesResponse.ok || !rolesPayload.success) {
            throw new Error(getErrorMessage(rolesPayload))
          }
        }

        if (form.password) {
          const passwordResponse = await fetch(
            `/api/users/${editingUser.id}/password`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password: form.password }),
            },
          )
          const passwordPayload = await passwordResponse.json()

          if (!passwordResponse.ok || !passwordPayload.success) {
            throw new Error(getErrorMessage(passwordPayload))
          }
        }

        setSuccess("อัปเดตผู้ใช้เรียบร้อยแล้ว")
      } else {
        const createResponse = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
            fullName: form.fullName.trim(),
            status: form.status,
          }),
        })
        const createPayload = await createResponse.json()

        if (!createResponse.ok || !createPayload.success) {
          throw new Error(getErrorMessage(createPayload))
        }

        const createdUser = createPayload.data as ManagedUser

        const rolesResponse = await fetch(`/api/users/${createdUser.id}/roles`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleIds: [form.roleId] }),
        })
        const rolesPayload = await rolesResponse.json()

        if (!rolesResponse.ok || !rolesPayload.success) {
          throw new Error(getErrorMessage(rolesPayload))
        }

        setSuccess("สร้างผู้ใช้เรียบร้อยแล้ว")
      }

      resetForm()
      await fetchUsers()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "ไม่สามารถบันทึกผู้ใช้ได้",
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingUser) {
      return
    }

    setIsDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      if (hasRoleCode(deletingUser, SUPER_ADMIN_ROLE_CODE)) {
        throw new Error("ไม่สามารถลบ Super Admin ได้")
      }

      const response = await fetch(`/api/users/${deletingUser.id}`, {
        method: "DELETE",
      })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(getErrorMessage(payload))
      }

      setSuccess("ลบผู้ใช้เรียบร้อยแล้ว")
      setDeletingUser(null)
      await fetchUsers()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "ไม่สามารถลบผู้ใช้ได้",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/80 bg-card/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              ผู้ใช้ทั้งหมด
            </span>
            <Users className="size-4 text-primary" />
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{metadata.total}</p>
          <p className="text-xs text-muted-foreground">บัญชีในระบบ</p>
        </div>
        <div className="rounded-lg border border-border/80 bg-card/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              กำลังใช้งาน
            </span>
            <ShieldCheck className="size-4 text-primary" />
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{activeUsers}</p>
          <p className="text-xs text-muted-foreground">บัญชีที่เปิดใช้งาน</p>
        </div>
        <div className="rounded-lg border border-border/80 bg-card/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              มีสิทธิ์แล้ว
            </span>
            <KeyRound className="size-4 text-primary" />
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{usersWithRoles}</p>
          <p className="text-xs text-muted-foreground">ผู้ใช้ที่กำหนดสิทธิ์แล้ว</p>
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
              placeholder="ค้นหาอีเมล หรือชื่อ-นามสกุล"
              className="h-9 pl-9 text-xs"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as UserStatus | "ALL")
            }
            className="h-9 rounded-lg border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="ACTIVE">ใช้งาน</option>
            <option value="INACTIVE">ปิดใช้งาน</option>
            <option value="SUSPENDED">ระงับการใช้งาน</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={fetchUsers}
            disabled={isLoading}
            className="h-9 text-xs"
          >
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            รีเฟรช
          </Button>
          <Button
            type="button"
            onClick={openCreateForm}
            className="h-9 bg-primary text-primary-foreground text-xs font-semibold"
          >
            <PlusCircle className="size-4" />
            เพิ่มผู้ใช้
          </Button>
        </div>
      </div>

      {(error || success) && (
        <div
          className={`rounded-lg border px-4 py-3 text-xs flex items-center gap-2 ${
            error
              ? "border-destructive/25 bg-destructive/10 text-destructive"
              : "border-green-500/25 bg-green-500/10 text-green-400"
          }`}
        >
          {error ? (
            <AlertCircle className="size-4 shrink-0" />
          ) : (
            <Check className="size-4 shrink-0" />
          )}
          <span className="font-medium">{error ?? success}</span>
        </div>
      )}

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-primary/20 bg-card/70 p-4 space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {editingUser ? (
                <Edit3 className="size-4 text-primary" />
              ) : (
                <PlusCircle className="size-4 text-primary" />
              )}
              {editingUser ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้"}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10"
              title="ปิด"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                อีเมล
              </label>
              <Input
                value={form.email}
                type="email"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className="h-9 text-xs"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                ชื่อผู้ใช้
              </label>
              <Input
                value={form.fullName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                className="h-9 text-xs"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                สถานะ
              </label>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as UserStatus,
                  }))
                }
                className="h-9 w-full rounded-lg border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isSaving}
              >
                <option value="ACTIVE">ใช้งาน</option>
                <option value="INACTIVE">ปิดใช้งาน</option>
                <option value="SUSPENDED">ระงับการใช้งาน</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,320px)_1fr] gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                {editingUser ? "รหัสผ่านใหม่" : "รหัสผ่าน"}
              </label>
              <div className="relative">
                <Input
                  value={form.password}
                  type={showPassword ? "text" : "password"}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder={
                    editingUser ? "เว้นว่างถ้าไม่เปลี่ยน" : "ChangeMe123!"
                  }
                  className="h-9 pr-10 text-xs"
                  disabled={isSaving}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-white transition-colors disabled:pointer-events-none disabled:opacity-50"
                  disabled={isSaving}
                  title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                สิทธิ์ผู้ใช้
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {roles
                  .filter((role) =>
                    editingUser && hasRoleCode(editingUser, SUPER_ADMIN_ROLE_CODE)
                      ? role.code === SUPER_ADMIN_ROLE_CODE
                      : role.code !== SUPER_ADMIN_ROLE_CODE,
                  )
                  .map((role) => (
                    <label
                      key={role.id}
                      className={`flex items-start gap-2 rounded-lg border p-3 cursor-pointer transition-all ${
                        form.roleId === role.id
                          ? "border-primary/30 bg-primary/10"
                          : "border-border bg-card/60 hover:border-muted-foreground/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="user-role"
                        checked={form.roleId === role.id}
                        onChange={() =>
                          setForm((current) => ({ ...current, roleId: role.id }))
                        }
                        className="mt-0.5"
                        disabled={isSaving}
                      />
                      <span className="min-w-0">
                        {/* <span className="block text-xs font-bold text-white">
                          {role.name}
                        </span> */}
                        <span className="block text-xs text-primary font-mono">
                          {role.code}
                        </span>
                        {/* {role.code === SUPER_ADMIN_ROLE_CODE && (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            เข้าถึงเมนูของ Admin ได้โดยธรรมชาติ
                          </span>
                        )} */}
                      </span>
                    </label>
                  ))}
                {roles.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                    ไม่พบข้อมูลสิทธิ์ผู้ใช้
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={resetForm}
              disabled={isSaving}
              className="h-9 text-xs"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-9 text-xs bg-primary text-primary-foreground"
            >
              {isSaving ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              บันทึก
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-lg border border-border/80 bg-card/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#22262F] bg-black/20 text-muted-foreground uppercase">
                <th className="py-3 px-4">ผู้ใช้</th>
                <th className="py-3 px-4">สิทธิ์</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4">เข้าสู่ระบบล่าสุด</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D212A]">
              {sortedUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`transition-colors ${
                    isSuperAdmin(user)
                      ? "bg-amber-500/[0.08] hover:bg-amber-500/[0.12]"
                      : "hover:bg-[#121418]/50"
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full border flex items-center justify-center font-bold ${
                          isSuperAdmin(user)
                            ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                            : "bg-primary/10 border-primary/20 text-primary"
                        }`}
                      >
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white flex items-center gap-2">
                          {user.fullName}
                          {/* {isSuperAdmin(user) && (
                            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              Super Admin
                            </span>
                          )} */}
                        </p>
                        <p className="text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1.5">
                      {getVisibleRoles(user).map((role) => (
                        <span
                          key={role.id}
                          className={`inline-flex rounded-lg border px-2 py-1 font-mono ${
                            role.code === SUPER_ADMIN_ROLE_CODE
                              ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                              : "border-primary/20 bg-primary/10 text-primary"
                          }`}
                        >
                          {role.code}
                        </span>
                      ))}
                      {user.roles.length === 0 && (
                        <span className="text-muted-foreground">ยังไม่ได้กำหนดสิทธิ์</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClassMap[user.status]}`}
                    >
                      {statusLabelMap[user.status]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString("th-TH")
                      : "-"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditForm(user)}
                        className="p-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                        title="แก้ไขผู้ใช้"
                      >
                        <Edit3 className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingUser(user)}
                        disabled={hasRoleCode(user, SUPER_ADMIN_ROLE_CODE)}
                        className="p-1.5 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-40"
                        title={
                          hasRoleCode(user, SUPER_ADMIN_ROLE_CODE)
                            ? "ไม่สามารถลบ Super Admin ได้"
                            : "ลบผู้ใช้"
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="p-10 text-center text-muted-foreground text-xs">
            <RefreshCw className="mx-auto mb-3 size-6 animate-spin text-primary" />
            กำลังโหลดข้อมูลผู้ใช้...
          </div>
        )}

        {!isLoading && users.length === 0 && (
          <div className="p-10 text-center text-muted-foreground text-xs">
            <UserCog className="mx-auto mb-3 size-8 text-[#22262F]" />
            ไม่พบข้อมูลผู้ใช้
          </div>
        )}
      </div>

      <AlertDialog
        isOpen={!!deletingUser}
        onClose={() => {
          if (!isDeleting) {
            setDeletingUser(null)
          }
        }}
        onConfirm={handleDelete}
        title="ยืนยันการลบผู้ใช้"
        description={
          deletingUser
            ? `ต้องการลบ ${deletingUser.fullName} ใช่ไหม รายการนี้จะถูกบันทึกในประวัติการใช้งาน`
            : ""
        }
        cancelText="ยกเลิก"
        confirmText="ลบผู้ใช้"
        loading={isDeleting}
      />
    </div>
  )
}
