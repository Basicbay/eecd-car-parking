"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ParkingSquare,
  Car,
  Wifi,
  Receipt,
  LogOut,
  Search,
  Menu,
  X,
  ShieldCheck,
  Users,
  Activity,
  KeyRound,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface SessionUserWithRole {
  role?: string | null;
  permissions?: string[];
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isSignOutLoading, setIsSignOutLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const sessionUser = session?.user as
    | (NonNullable<typeof session>["user"] & SessionUserWithRole)
    | undefined;
  const adminName = session?.user?.name;
  const adminEmail = session?.user?.email;
  const adminRole = sessionUser?.role;
  const userPermissions = sessionUser?.permissions ?? [];
  const hasPermission = (permission?: string) => {
    if (!permission) {
      return true;
    }

    if (status === "loading") {
      return true;
    }

    return (
      userPermissions.includes("*") || userPermissions.includes(permission)
    );
  };
  const roleLabelMap: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    MANAGER: "Manager",
    USER: "User",
  };
  const roleLabel = adminRole
    ? (roleLabelMap[adminRole] ?? adminRole)
    : status === "loading"
      ? "กำลังโหลด Role..."
      : "ไม่พบข้อมูล Role";

  // Update clock effect
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      const timeStr = date.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const dateStr = date.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      setCurrentTime(`วันที่ ${dateStr} เวลา ${timeStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    setIsSignOutLoading(true);
    await signOut({ callbackUrl: "/login" });
  };

  // Helper to determine if link is active
  const isActive = (path: string) => {
    if (path === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(path);
  };

  // Sidebar Menu configuration
  const menuItems = [
    {
      label: "ภาพรวมลานจอดรถ",
      path: "/admin",
      icon: ParkingSquare,
      section: "admin",
      permission: "dashboard:view",
    },
    {
      label: "รถยนต์ในลานจอด",
      path: "/admin/vehicles",
      icon: Car,
      section: "admin",
      permission: "vehicle:view",
    },
    {
      label: "รหัสคูปอง Wi-Fi",
      path: "/admin/vouchers",
      icon: Wifi,
      section: "admin",
      permission: "voucher:view",
    },
    {
      label: "ประวัติชำระเงิน",
      path: "/admin/payments",
      icon: Receipt,
      section: "admin",
      permission: "payment:view",
    },
    {
      label: "จัดการผู้ใช้",
      path: "/admin/users",
      icon: Users,
      section: "access",
      permission: "user:view",
    },
    {
      label: "ประวัติการจัดการผู้ใช้",
      path: "/admin/user-logs",
      icon: Activity,
      section: "access",
      permission: "audit-log:view",
    },
    {
      label: "จัดการสิทธิ์",
      path: "/admin/permissions",
      icon: ShieldCheck,
      section: "access",
      permission: "permission:view",
    },
    {
      label: "ประวัติการจัดการสิทธิ์",
      path: "/admin/permission-logs",
      icon: KeyRound,
      section: "access",
      permission: "permission-log:view",
    },
    {
      label: "ค้นหาข้อมูลค่าบริการ",
      path: "/pay/search",
      icon: Search,
      newTab: true,
      section: "customer",
    },
  ];
  const adminMenuItems = menuItems.filter(
    (item) => item.section === "admin" && hasPermission(item.permission),
  );
  const accessMenuItems = menuItems.filter(
    (item) => item.section === "access" && hasPermission(item.permission),
  );

  // Get current page header title
  const currentMenuItem = menuItems.find((item) => isActive(item.path));
  const canAccessCurrentPage = hasPermission(currentMenuItem?.permission);
  const getHeaderTitle = () => {
    return currentMenuItem ? currentMenuItem.label : "ผู้ดูแลระบบ";
  };

  return (
    <div className="flex h-screen w-full bg-[#090A0C] text-foreground overflow-hidden">
      {/* Mobile Sidebar Overlay / Drawer */}
      <div
        className={`fixed inset-0 z-50 flex md:hidden bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          isMobileSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileSidebarOpen(false)}
      >
        <aside
          className={`w-64 h-full bg-[#0B0C0E] border-r border-[#22262F] p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-8">
            {/* Brand Header */}
            <div className="flex items-center justify-between">
              <Link
                href="/admin"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="flex items-center gap-3 hover:opacity-90 transition-opacity"
              >
                <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                  <ParkingSquare className="size-5.5 stroke-[2.5]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                    EECD{" "}
                    <span className="text-primary text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                      PARKING
                    </span>
                  </h1>
                  <p className="text-xs mt-0.5 text-muted-foreground uppercase tracking-widest">
                    Admin
                  </p>
                </div>
              </Link>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1 rounded-lg hover:bg-[#121418] text-muted-foreground hover:text-white transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Mobile Nav List */}
            <nav className="space-y-4">
              {/* Section: ผู้ดูแลระบบ */}
              {adminMenuItems.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2">
                    เมนูหลัก
                  </div>
                  {adminMenuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                          active
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted-foreground hover:text-white hover:bg-[#121418] border border-transparent"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="size-4" />
                          {item.label}
                        </span>
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Section: สิทธิ์และผู้ใช้ */}
              {accessMenuItems.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2">
                    สิทธิ์และผู้ใช้
                  </div>
                  {accessMenuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                          active
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted-foreground hover:text-white hover:bg-[#121418] border border-transparent"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="size-4" />
                          {item.label}
                        </span>
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Section: ลูกค้า */}
              {/* <div className="space-y-1.5">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2">
                  ลูกค้า
                </div>
                {menuItems
                  .filter(
                    (item) =>
                      item.section === "customer" &&
                      hasPermission(item.permission),
                  )
                  .map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        target={item.newTab ? "_blank" : undefined}
                        rel={item.newTab ? "noopener noreferrer" : undefined}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                          active
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted-foreground hover:text-white hover:bg-[#121418] border border-transparent"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="size-4" />
                          {item.label}
                        </span>
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                        )}
                      </Link>
                    );
                  })}
              </div> */}
            </nav>
          </div>

          {/* Mobile User Profile and Sign out */}
          <div className="border-t border-[#22262F] pt-4 space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                {adminName ? adminName.charAt(0) : "A"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {adminName || "ผู้ดูแลระบบ"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {adminEmail || "admin@carpark.com"}
                </p>
                <span className="mt-1 inline-flex rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {roleLabel}
                </span>
              </div>
            </div>

            <Button
              onClick={() => {
                setIsMobileSidebarOpen(false);
                handleLogout();
              }}
              disabled={isSignOutLoading}
              variant="outline"
              className="w-full h-8 flex items-center justify-center gap-2 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 text-xs py-1.5 cursor-pointer text-muted-foreground"
            >
              {isSignOutLoading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-muted-foreground border-t-transparent" />
              ) : (
                <LogOut className="size-3.5" />
              )}
              ออกจากระบบ
            </Button>
          </div>
        </aside>
      </div>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex w-64 flex-col bg-[#0B0C0E] border-r border-[#22262F] p-6 justify-between shrink-0">
        <div className="space-y-8">
          {/* Brand Header */}
          <Link
            href="/admin"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <ParkingSquare className="size-5.5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                EECD{" "}
                <span className="text-primary text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                  PARKING
                </span>
              </h1>
              <p className="text-xs mt-0.5 text-muted-foreground tracking-widest">
                Management System
              </p>
            </div>
          </Link>

          {/* Nav List */}
          <nav className="space-y-10">
            {/* Section: ผู้ดูแลระบบ */}
            {adminMenuItems.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2">
                  เมนูหลัก
                </div>
                {adminMenuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                        active
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-muted-foreground hover:text-white hover:bg-[#121418] border border-transparent"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="size-4" />
                        {item.label}
                      </span>
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Section: สิทธิ์และผู้ใช้ */}
            {accessMenuItems.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2">
                  สิทธิ์และผู้ใช้
                </div>
                {accessMenuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                        active
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-muted-foreground hover:text-white hover:bg-[#121418] border border-transparent"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="size-4" />
                        {item.label}
                      </span>
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Section: ลูกค้า */}
            {/* <div className="space-y-1.5">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2">
                ลูกค้า
              </div>
              {menuItems
                .filter(
                  (item) =>
                    item.section === "customer" &&
                    hasPermission(item.permission),
                )
                .map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      target={item.newTab ? "_blank" : undefined}
                      rel={item.newTab ? "noopener noreferrer" : undefined}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                        active
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-muted-foreground hover:text-white hover:bg-[#121418] border border-transparent"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="size-4" />
                        {item.label}
                      </span>
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                      )}
                    </Link>
                  );
                })}
            </div> */}
          </nav>
        </div>

        {/* User Profile and Sign out */}
        <div className="border-t border-[#22262F] pt-4 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
              {adminName ? adminName.charAt(0) : "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {adminName || "ผู้ดูแลระบบ"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {adminEmail || "admin@carpark.com"}
              </p>
              <span className="mt-1 inline-flex rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {roleLabel}
              </span>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            disabled={isSignOutLoading}
            variant="outline"
            className="w-full h-8 flex items-center justify-center gap-2 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 text-xs py-1.5 cursor-pointer text-muted-foreground"
          >
            {isSignOutLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-muted-foreground border-t-transparent" />
            ) : (
              <LogOut className="size-3.5" />
            )}
            ออกจากระบบ
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#090A0C]">
        {/* Top Header Bar */}
        <header className="h-20 border-b border-[#22262F] bg-[#0B0C0E]/80 backdrop-blur-md p-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="h-9 w-9 rounded-lg bg-primary/10 flex md:hidden items-center justify-center text-primary cursor-pointer border border-primary/20 hover:bg-primary/20 transition-all active:scale-95 shrink-0"
              title="เปิดเมนู"
            >
              <Menu className="size-4.5" />
            </button>

            <div className="h-8 w-8 rounded-lg bg-primary/10 hidden sm:flex md:hidden items-center justify-center text-primary">
              <ParkingSquare className="size-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-md font-bold text-white tracking-tight">
                {getHeaderTitle()}
              </h2>
              <p className="text-xs text-muted-foreground hidden sm:block">
                ดูข้อมูลเรียลไทม์ จัดการรถเข้าออก และคูปองอินเทอร์เน็ต
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Timer Widget */}
            <div className="hidden md:flex items-center gap-2 bg-[#121418] border border-[#22262F] px-3.5 py-1.5 rounded-lg text-xs text-muted-foreground font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
              {currentTime || "กำลังโหลด..."}
            </div>

            {/* Logout Mobile */}
            <Button
              onClick={handleLogout}
              disabled={isSignOutLoading}
              variant="outline"
              size="icon"
              className="md:hidden border-border hover:bg-destructive/10 hover:text-destructive text-muted-foreground size-8"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        {/* Dynamic page content */}
        <div className="p-4 sm:p-6 space-y-6 w-full mx-auto">
          {canAccessCurrentPage ? (
            children
          ) : (
            <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-6 text-sm text-destructive">
              <p className="font-bold">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
              <p className="mt-1 text-xs">
                กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดสิทธิ์การมองเห็นเมนูนี้
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
