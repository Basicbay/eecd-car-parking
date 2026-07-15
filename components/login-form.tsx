"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  ParkingSquare,
  Car,
  Wifi,
  Receipt,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, { message: "กรุณากรอกชื่อผู้ใช้งาน" }),
  password: z.string().min(1, { message: "กรุณากรอกรหัสผ่าน" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "admin",
      password: "admin1234",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ กรุณาลองใหม่อีกครั้ง");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#090A0C] text-foreground">
      {/* Split layout: Left Panel (Branding & Live Mock Dashboard) */}
      <div className="hidden lg:flex w-[55%] flex-col justify-between p-12 bg-gradient-to-br from-[#0B0C0E] via-[#121418] to-[#090A0C] border-r border-[#22262F] relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

        {/* Logo/Brand Header */}
        <div className="flex items-center gap-3 z-10">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <ParkingSquare className="size-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              EECD{" "}
              <span className="text-primary text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                PARKING
              </span>
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Management System
            </p>
          </div>
        </div>

        {/* Live Mock Dashboard (Center Content) */}
        <div className="my-auto max-w-2xl z-10 space-y-8">
          <div className="space-y-3">
            <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
              ควบคุมการจอดรถและ <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-amber-300">
                ระบบจัดการ Wi-Fi
              </span>{" "}
              ในหนึ่งเดียว
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              ระบบศูนย์กลางจัดการข้อมูลรถเข้า-ออก อัตราค่าจอด
              บันทึกการสแกนจ่ายเงิน รวมถึงการสร้าง Voucher
              อินเทอร์เน็ตความเร็วสูงสำหรับผู้ใช้บริการลานจอดรถ
            </p>
          </div>

          {/* Mini Live Stats Showcase */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-card/40 border border-border backdrop-blur-md space-y-3 hover:border-primary/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  ที่ว่างลานจอด
                </span>
                <Car className="size-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">
                  128{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / 150
                  </span>
                </p>
                <div className="h-1.5 w-full bg-[#1A1D24] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: "85%" }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-card/40 border border-border backdrop-blur-md space-y-3 hover:border-primary/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  Wi-Fi Voucher วันนี้
                </span>
                <Wifi className="size-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">
                  85{" "}
                  <span className="text-xs font-normal text-green-400 font-medium ml-1">
                    +12%
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  รหัสคูปองพร้อมใช้งาน
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-card/40 border border-border backdrop-blur-md space-y-3 hover:border-primary/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  รายได้วันนี้
                </span>
                <Receipt className="size-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">฿4,250</p>
                <p className="text-[10px] text-muted-foreground">
                  ชำระเงินสำเร็จ 42 รายการ
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-card/40 border border-border backdrop-blur-md space-y-3 hover:border-primary/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  ความปลอดภัย
                </span>
                <ShieldCheck className="size-4 text-green-400" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">99.9%</p>
                <p className="text-[10px] text-muted-foreground">
                  ระบบออนไลน์ทํางานเสถียร
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground/80 z-10 flex justify-between items-center">
          <span>
            &copy; {new Date().getFullYear()} EECD Car Park Management.
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Server Online
          </span>
        </div>
      </div>

      {/* Right Panel (Login Form Container) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 relative">
        {/* Glow behind card for mobile */}
        <div className="absolute inset-0 bg-[#090A0C] lg:hidden -z-10" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[80%] h-[40%] rounded-full bg-primary/3 blur-[100px] pointer-events-none lg:hidden" />

        <div className="w-full max-w-md space-y-8 bg-card/30 lg:bg-transparent p-8 lg:p-0 rounded-2xl border border-border/50 lg:border-none backdrop-blur-sm lg:backdrop-blur-none">
          {/* Logo header for mobile */}
          <div className="flex flex-col items-center text-center lg:hidden space-y-2 mb-6">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <ParkingSquare className="size-7 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              EECD <span className="text-primary">PARKING</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              ระบบจัดการลานจอดรถสำหรับผู้ดูแล
            </p>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h3 className="text-2xl font-bold text-white tracking-tight lg:text-3xl">
              เข้าสู่ระบบดูแลลานจอด
            </h3>
            <p className="text-sm text-muted-foreground">
              กรอกข้อมูลบัญชีผู้ใช้เพื่อเริ่มต้นจัดการระบบ
            </p>
          </div>

          {/* Form Action */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2.5 animate-fadeIn">
                <AlertCircle className="size-4 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Username field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                  ชื่อผู้ใช้งาน (Username)
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground group-focus-within:text-primary transition-colors duration-200">
                    <User className="size-4" />
                  </span>
                  <Input
                    {...register("username")}
                    type="text"
                    placeholder="ใส่ชื่อผู้ใช้งานของคุณ"
                    className="pl-10"
                    autoComplete="username"
                    disabled={isLoading}
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                    รหัสผ่าน (Password)
                  </label>
                </div>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground group-focus-within:text-primary transition-colors duration-200">
                    <Lock className="size-4" />
                  </span>
                  <Input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="ใส่รหัสผ่านของคุณ"
                    autoComplete="current-password"
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-white transition-colors duration-200"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Demo Credentials Info Note
            <div className="p-3.5 rounded-xl bg-card border border-border/80 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                ข้อมูลสิทธิ์ทดลองเข้าใช้งาน (Demo Account)
              </p>
              <div className="grid grid-cols-2 gap-1 font-mono text-[11px] pt-1">
                <div>User: <span className="text-primary font-bold">admin</span></div>
                <div>Pass: <span className="text-primary font-bold">admin1234</span></div>
              </div>
            </div> */}

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold h-11 rounded-lg transition-all duration-300 shadow-lg shadow-primary/10 hover:shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                  กำลังลงชื่อเข้าใช้งาน...
                </>
              ) : (
                <>
                  เข้าสู่ระบบจัดการ
                  <ArrowRight className="size-4 shrink-0 transition-transform duration-200 group-hover/button:translate-x-1" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
