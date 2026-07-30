"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  KeyRound,
  Lock,
  PanelLeft,
  PanelTop,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiEnvelope<TData, TMetadata = Record<string, never>> {
  success: boolean;
  message: string;
  data: TData;
  metadata: TMetadata;
}

interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface RolePermissions {
  role: Role;
  permissions: Permission[];
}

const SUPER_ADMIN_ROLE_CODE = "SUPER_ADMIN";

const resourceLabels: Record<string, string> = {
  "audit-log": "Audit Log",
  dashboard: "Dashboard",
  payment: "Payment",
  permission: "Permission",
  "permission-log": "Permission Log",
  role: "Role",
  user: "User",
  vehicle: "Vehicle",
  voucher: "Voucher",
};

const actionLabels: Record<string, string> = {
  view: "View",
  create: "Create",
  update: "Update",
  delete: "Delete",
  assign: "Assign",
  export: "Export",
  import: "Import",
  approve: "Approve",
};

const actionOrder = [
  "view",
  "create",
  "update",
  "delete",
  "assign",
  "approve",
  "export",
  "import",
];

const pagePermissionSections = [
  {
    title: "เมนูหลัก",
    items: [
      {
        label: "ภาพรวมลานจอดรถ",
        path: "/admin",
        permissionCode: "dashboard:view",
      },
      {
        label: "รถยนต์ในลานจอด",
        path: "/admin/vehicles",
        permissionCode: "vehicle:view",
      },
      {
        label: "รหัสคูปอง Wi-Fi",
        path: "/admin/vouchers",
        permissionCode: "voucher:view",
      },
      {
        label: "ประวัติชำระเงิน",
        path: "/admin/payments",
        permissionCode: "payment:view",
      },
    ],
  },
  {
    title: "สิทธิ์และผู้ใช้",
    items: [
      {
        label: "จัดการผู้ใช้",
        path: "/admin/users",
        permissionCode: "user:view",
      },
      {
        label: "ประวัติการจัดการผู้ใช้",
        path: "/admin/user-logs",
        permissionCode: "audit-log:view",
      },
      {
        label: "จัดการสิทธิ์",
        path: "/admin/permissions",
        permissionCode: "permission:view",
      },
      {
        label: "ประวัติการจัดการสิทธิ์",
        path: "/admin/permission-logs",
        permissionCode: "permission-log:view",
      },
    ],
  },
];
const pagePermissionCodes = new Set(
  pagePermissionSections.flatMap((section) =>
    section.items.map((item) => item.permissionCode),
  ),
);

const getErrorMessage = (payload: unknown) => {
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const message = (payload as { message?: unknown }).message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return "ไม่สามารถดำเนินการได้";
};

const getRoleLabel = (role: Role) => {
  if (role.code === SUPER_ADMIN_ROLE_CODE) return "Super Admin";
  if (role.code === "ADMIN") return "Admin";
  if (role.code === "MANAGER") return "Manager";

  return role.name || role.code;
};

const getResourceLabel = (resource: string) =>
  resourceLabels[resource] ?? resource;

const getActionLabel = (action: string) => actionLabels[action] ?? action;

const getPermissionTitle = (permission: Permission) =>
  `${getActionLabel(permission.action)} ${getResourceLabel(permission.resource)}`;

function PermissionsLoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-border/80 bg-card/50 p-4"
          >
            <div className="h-3 w-28 rounded bg-[#22262F]" />
            <div className="mt-4 h-8 w-16 rounded bg-[#22262F]" />
            <div className="mt-3 h-3 w-36 rounded bg-[#1D212A]" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
        <div className="rounded-lg border border-border/80 bg-card/60 p-4 space-y-3">
          <div className="h-4 w-24 rounded bg-[#22262F]" />
          <div className="h-3 w-40 rounded bg-[#1D212A]" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-14 rounded-md bg-[#121418]" />
          ))}
        </div>

        <div className="rounded-lg border border-border/80 bg-card/60 p-4 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-[#22262F]" />
              <div className="h-3 w-80 max-w-full rounded bg-[#1D212A]" />
            </div>
            <div className="h-9 w-28 rounded-md bg-[#22262F]" />
          </div>
          <div className="h-9 w-full max-w-lg rounded-md bg-[#121418]" />
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3">
            {Array.from({ length: 2 }).map((_, sectionIndex) => (
              <div
                key={sectionIndex}
                className="rounded-lg border border-border/80 bg-black/10 p-3 space-y-2"
              >
                <div className="h-3 w-24 rounded bg-[#22262F]" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {Array.from({ length: 4 }).map((_, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="h-9 rounded-md bg-[#121418]"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PermissionsManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<
    Set<string>
  >(new Set());
  const [savedPermissionIds, setSavedPermissionIds] = useState<Set<string>>(
    new Set(),
  );
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? null;
  const isSuperAdmin = selectedRole?.code === SUPER_ADMIN_ROLE_CODE;
  const effectivePermissionIds = isSuperAdmin
    ? new Set(permissions.map((permission) => permission.id))
    : selectedPermissionIds;
  const isDirty =
    !isSuperAdmin &&
    (selectedPermissionIds.size !== savedPermissionIds.size ||
      Array.from(selectedPermissionIds).some(
        (permissionId) => !savedPermissionIds.has(permissionId),
      ));
  const pagePermissionByCode = useMemo(() => {
    return new Map(
      permissions.map((permission) => [permission.code, permission]),
    );
  }, [permissions]);

  const groupedPermissions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filteredPermissions = permissions.filter((permission) => {
      if (pagePermissionCodes.has(permission.code)) {
        return false;
      }

      if (!normalizedSearch) return true;

      return [
        permission.code,
        permission.name,
        permission.description ?? "",
        getResourceLabel(permission.resource),
        getActionLabel(permission.action),
        getPermissionTitle(permission),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });

    return Object.entries(
      filteredPermissions.reduce<Record<string, Permission[]>>(
        (groups, permission) => {
          groups[permission.resource] = groups[permission.resource] ?? [];
          groups[permission.resource].push(permission);
          return groups;
        },
        {},
      ),
    )
      .map(([resource, resourcePermissions]) => ({
        resource,
        permissions: resourcePermissions.sort((first, second) => {
          const firstOrder = actionOrder.indexOf(first.action);
          const secondOrder = actionOrder.indexOf(second.action);

          if (firstOrder !== secondOrder) {
            return (
              (firstOrder === -1 ? Number.MAX_SAFE_INTEGER : firstOrder) -
              (secondOrder === -1 ? Number.MAX_SAFE_INTEGER : secondOrder)
            );
          }

          return first.code.localeCompare(second.code);
        }),
      }))
      .sort((first, second) =>
        getResourceLabel(first.resource).localeCompare(
          getResourceLabel(second.resource),
          "th",
        ),
      );
  }, [permissions, search]);

  const assignedCount = effectivePermissionIds.size;
  const pageAccessCount = permissions.filter(
    (permission) =>
      permission.action === "view" && effectivePermissionIds.has(permission.id),
  ).length;
  const isInitialLoading =
    isLoading && roles.length === 0 && permissions.length === 0;

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        fetch("/api/roles", { cache: "no-store" }),
        fetch("/api/permissions?page=1&limit=100&sort=code&order=ASC", {
          cache: "no-store",
        }),
      ]);
      const rolesPayload = (await rolesResponse.json()) as ApiEnvelope<Role[]>;
      const permissionsPayload =
        (await permissionsResponse.json()) as ApiEnvelope<
          Permission[],
          PaginationMetadata
        >;

      if (!rolesResponse.ok || !rolesPayload.success) {
        throw new Error(getErrorMessage(rolesPayload));
      }

      if (!permissionsResponse.ok || !permissionsPayload.success) {
        throw new Error(getErrorMessage(permissionsPayload));
      }

      const sortedRoles = [...rolesPayload.data].sort((first, second) => {
        if (first.code === SUPER_ADMIN_ROLE_CODE) return -1;
        if (second.code === SUPER_ADMIN_ROLE_CODE) return 1;
        return first.code.localeCompare(second.code);
      });

      setRoles(sortedRoles);
      setPermissions(permissionsPayload.data);
      setSelectedRoleId((current) => current || sortedRoles[0]?.id || "");
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "ไม่สามารถโหลดข้อมูลสิทธิ์ได้",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    if (!roleId) return;

    setIsRoleLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/roles/${roleId}/permissions`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiEnvelope<RolePermissions>;

      if (!response.ok || !payload.success) {
        throw new Error(getErrorMessage(payload));
      }

      const permissionIds = new Set(
        payload.data.permissions.map((permission) => permission.id),
      );

      setSelectedPermissionIds(permissionIds);
      setSavedPermissionIds(new Set(permissionIds));
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "ไม่สามารถโหลดสิทธิ์ของบทบาทนี้ได้",
      );
    } finally {
      setIsRoleLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchInitialData();
    }, 0);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRolePermissions(selectedRoleId);
    }, 0);

    return () => clearTimeout(timeout);
  }, [selectedRoleId]);

  const togglePermission = (permissionId: string) => {
    if (isSuperAdmin) return;

    setSelectedPermissionIds((current) => {
      const next = new Set(current);

      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }

      return next;
    });
  };

  const setResourcePermissions = (
    resourcePermissions: Permission[],
    checked: boolean,
  ) => {
    if (isSuperAdmin) return;

    setSelectedPermissionIds((current) => {
      const next = new Set(current);

      for (const permission of resourcePermissions) {
        if (checked) {
          next.add(permission.id);
        } else {
          next.delete(permission.id);
        }
      }

      return next;
    });
  };

  const togglePagePermission = (permissionCode: string) => {
    const permission = pagePermissionByCode.get(permissionCode);

    if (!permission) {
      return;
    }

    togglePermission(permission.id);
  };

  const handleSave = async () => {
    if (!selectedRole || isSuperAdmin) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/roles/${selectedRole.id}/permissions`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            permissionIds: Array.from(selectedPermissionIds),
          }),
        },
      );
      const payload = (await response.json()) as ApiEnvelope<RolePermissions>;

      if (!response.ok || !payload.success) {
        throw new Error(getErrorMessage(payload));
      }

      const permissionIds = new Set(
        payload.data.permissions.map((permission) => permission.id),
      );

      setSelectedPermissionIds(permissionIds);
      setSavedPermissionIds(new Set(permissionIds));
      setSuccess(`บันทึกสิทธิ์ของ ${getRoleLabel(selectedRole)} เรียบร้อยแล้ว`);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "ไม่สามารถบันทึกสิทธิ์ได้",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isInitialLoading) {
    return <PermissionsLoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/80 bg-card/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              บทบาททั้งหมด
            </span>
            <ShieldCheck className="size-4 text-primary" />
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{roles.length}</p>
          <p className="text-xs text-muted-foreground">กำหนดสิทธิ์ตามบทบาท</p>
        </div>
        <div className="rounded-lg border border-border/80 bg-card/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              สิทธิ์ที่เลือก
            </span>
            <KeyRound className="size-4 text-primary" />
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{assignedCount}</p>
          <p className="text-xs text-muted-foreground">
            จากทั้งหมด {permissions.length} สิทธิ์
          </p>
        </div>
        <div className="rounded-lg border border-border/80 bg-card/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              หน้าเข้าถึงได้
            </span>
            <CheckCircle2 className="size-4 text-primary" />
          </div>
          <p className="mt-3 text-2xl font-bold text-white">
            {pageAccessCount}
          </p>
          <p className="text-xs text-muted-foreground">
            นับจากสิทธิ์เข้าดูหน้า
          </p>
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

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
        <aside className="rounded-lg border border-border/80 bg-card/60 overflow-hidden">
          <div className="border-b border-[#22262F] px-4 py-3">
            <p className="text-sm font-bold text-white">เลือกบทบาท</p>
            <p className="text-xs text-muted-foreground">
              แก้ไขสิทธิ์ได้ทีละบทบาท
            </p>
          </div>
          <div className="divide-y divide-[#1D212A]">
            {roles.map((role) => {
              const active = role.id === selectedRoleId;
              const superAdmin = role.code === SUPER_ADMIN_ROLE_CODE;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    active ? "bg-primary/10" : "hover:bg-[#121418]/70"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-white">
                        {getRoleLabel(role)}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground font-mono">
                        {role.code}
                      </span>
                    </span>
                    {superAdmin && (
                      <Lock className="size-4 shrink-0 text-amber-300" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="relative rounded-lg border border-border/80 bg-card/60 overflow-hidden">
          {isRoleLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#090A0C]/60 backdrop-blur-[1px]">
              <div className="rounded-lg border border-border/80 bg-card px-4 py-3 text-xs font-semibold text-muted-foreground shadow-xl">
                <RefreshCw className="mx-auto mb-2 size-5 animate-spin text-primary" />
                กำลังโหลดสิทธิ์ของบทบาทนี้...
              </div>
            </div>
          )}
          <div className="border-b border-[#22262F] px-4 py-3 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">
                  {selectedRole
                    ? `สิทธิ์ของ ${getRoleLabel(selectedRole)}`
                    : "สิทธิ์ของบทบาท"}
                </p>
                <p className="text-xs text-muted-foreground">
                  จัดสิทธิ์ตามหน้าและฟังก์ชัน รองรับ permission
                  จำนวนมากด้วยการค้นหาและเลือกทั้งหมวด
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchInitialData}
                  disabled={isLoading || isRoleLoading || isSaving}
                  className="h-9 text-xs"
                >
                  <RefreshCw
                    className={`size-4 ${
                      isLoading || isRoleLoading ? "animate-spin" : ""
                    }`}
                  />
                  รีเฟรช
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={
                    !isDirty || isSaving || isRoleLoading || isSuperAdmin
                  }
                  className="h-9 text-xs bg-primary text-primary-foreground"
                >
                  {isSaving ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  บันทึกสิทธิ์
                </Button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1 max-w-lg">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                  <Search className="size-4" />
                </span>
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="ค้นหา เช่น Create User, Permission, user:create"
                  className="h-9 pl-9 text-xs"
                />
              </div>
              {isSuperAdmin && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                  <Lock className="size-3.5" />
                  Super Admin ได้สิทธิ์สูงสุดและไม่ควรแก้ไข
                </span>
              )}
              {isDirty && (
                <span className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
                  มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
                </span>
              )}
            </div>
          </div>

          <div className="divide-y divide-[#1D212A]">
            <div className="p-3 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <PanelLeft className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    การมองเห็นเมนู/หน้า
                  </p>
                  <p className="text-xs text-muted-foreground">
                    เลือกว่า role นี้จะเห็นเมนูใดใน sidebar
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3">
                {pagePermissionSections.map((section) => (
                  <div
                    key={section.title}
                    className="rounded-lg border border-border/80 bg-black/10 p-3 space-y-2"
                  >
                    <p className="text-xs font-bold text-muted-foreground uppercase">
                      {section.title}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {section.items.map((item) => {
                        const permission = pagePermissionByCode.get(
                          item.permissionCode,
                        );
                        const checked = permission
                          ? effectivePermissionIds.has(permission.id)
                          : false;

                        return (
                          <label
                            key={item.permissionCode}
                            className={`flex items-center gap-2 rounded-md border px-2.5 py-2 transition-colors ${
                              checked
                                ? "border-primary/30 bg-primary/10"
                                : "border-border bg-card/50 hover:border-muted-foreground/40"
                            } ${
                              isSuperAdmin || !permission
                                ? "cursor-not-allowed opacity-90"
                                : "cursor-pointer"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                togglePagePermission(item.permissionCode)
                              }
                              disabled={
                                isSuperAdmin ||
                                isRoleLoading ||
                                isSaving ||
                                !permission
                              }
                              className="shrink-0"
                            />
                            <span className="min-w-0">
                              <span className="block text-xs font-bold text-white truncate">
                                {item.label}
                              </span>
                              {!permission && (
                                <span className="block text-[11px] text-destructive">
                                  ไม่พบ permission {item.permissionCode}
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {groupedPermissions.length > 0 && (
              <div className="px-3 py-2 bg-black/10">
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  ฟังก์ชันเพิ่มเติม
                </p>
              </div>
            )}

            {groupedPermissions.map((group) => {
              const checkedCount = group.permissions.filter((permission) =>
                effectivePermissionIds.has(permission.id),
              ).length;
              const allChecked = checkedCount === group.permissions.length;
              const partialChecked =
                checkedCount > 0 && checkedCount < group.permissions.length;

              return (
                <div key={group.resource} className="p-3 space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                        <PanelTop className="size-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {getResourceLabel(group.resource)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          เลือกแล้ว {checkedCount}/{group.permissions.length}
                        </p>
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={(element) => {
                          if (element) {
                            element.indeterminate = partialChecked;
                          }
                        }}
                        onChange={(event) =>
                          setResourcePermissions(
                            group.permissions,
                            event.target.checked,
                          )
                        }
                        disabled={isSuperAdmin || isRoleLoading || isSaving}
                      />
                      เลือกทั้งหมวด
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-1.5">
                    {group.permissions.map((permission) => {
                      const checked = effectivePermissionIds.has(permission.id);

                      return (
                        <label
                          key={permission.id}
                          className={`flex min-h-0 items-center gap-2 rounded-md border px-2.5 py-2 transition-colors ${
                            checked
                              ? "border-primary/30 bg-primary/10"
                              : "border-border bg-card/50 hover:border-muted-foreground/40"
                          } ${
                            isSuperAdmin
                              ? "cursor-not-allowed opacity-90"
                              : "cursor-pointer"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(permission.id)}
                            disabled={isSuperAdmin || isRoleLoading || isSaving}
                            className="shrink-0"
                          />
                          <span className="min-w-0">
                            <span className="block text-xs font-bold text-white truncate">
                              {getPermissionTitle(permission)}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {!isLoading && !isRoleLoading && permissions.length === 0 && (
            <div className="p-10 text-center text-muted-foreground text-xs">
              <ShieldCheck className="mx-auto mb-3 size-8 text-[#22262F]" />
              ไม่พบข้อมูลสิทธิ์
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
