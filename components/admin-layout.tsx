"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ParkingSquare,
  Car,
  Wifi,
  Receipt,
  LogOut,
  Clock,
  Sparkles,
  Search,
  Menu,
  X,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  adminEmail?: string | null;
  adminName?: string | null;
}

export default function AdminLayout({
  children,
  adminEmail,
  adminName,
}: AdminLayoutProps) {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isSignOutLoading, setIsSignOutLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Update clock effect
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setCurrentTime(
        date.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) +
          " | " +
          date.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
      );
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
    },
    {
      label: "รถยนต์ในลานจอด",
      path: "/admin/vehicles",
      icon: Car,
      section: "admin",
    },
    {
      label: "รหัสคูปอง Wi-Fi",
      path: "/admin/vouchers",
      icon: Wifi,
      section: "admin",
    },
    {
      label: "ประวัติชำระเงิน",
      path: "/admin/payments",
      icon: Receipt,
      section: "admin",
    },
    {
      label: "ค้นหาข้อมูลค่าบริการ",
      path: "/pay/search",
      icon: Search,
      newTab: true,
      section: "customer",
    },
  ];

  // Get current page header title
  const getHeaderTitle = () => {
    const activeItem = menuItems.find((item) => isActive(item.path));
    return activeItem ? activeItem.label : "ผู้ดูแลระบบ";
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
                  <p className="text-[10px] mt-0.5 text-muted-foreground uppercase tracking-widest">
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
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2">
                  ผู้ดูแลระบบ
                </div>
                {menuItems
                  .filter((item) => item.section === "admin")
                  .map((item) => {
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

              {/* Section: ลูกค้า */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2">
                  ลูกค้า
                </div>
                {menuItems
                  .filter((item) => item.section === "customer")
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
              </div>
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
                  {adminName || "Admin User"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {adminEmail || "admin@carpark.com"}
                </p>
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
              <p className="text-[10px] mt-0.5 text-muted-foreground uppercase tracking-widest">
                Admin Dashboard
              </p>
            </div>
          </Link>

          {/* Nav List */}
          <nav className="space-y-4">
            {/* Section: ผู้ดูแลระบบ */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2">
                ผู้ดูแลระบบ
              </div>
              {menuItems
                .filter((item) => item.section === "admin")
                .map((item) => {
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

            {/* Section: ลูกค้า */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2">
                ลูกค้า
              </div>
              {menuItems
                .filter((item) => item.section === "customer")
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
            </div>
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
                {adminName || "Admin User"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {adminEmail || "admin@carpark.com"}
              </p>
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
        <header className="h-16 border-b border-[#22262F] bg-[#0B0C0E]/80 backdrop-blur-md p-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
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
              <h2 className="text-sm sm:text-md font-bold text-white tracking-tight">
                {getHeaderTitle()}
              </h2>
              <p className="text-[10px] text-muted-foreground hidden sm:block">
                ดูข้อมูลเรียลไทม์ จัดการรถเข้าออก และคูปองอินเทอร์เน็ต
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Timer Widget */}
            <div className="hidden md:flex items-center gap-2 bg-[#121418] border border-[#22262F] px-3.5 py-1.5 rounded-lg text-xs text-muted-foreground font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
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
        <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
