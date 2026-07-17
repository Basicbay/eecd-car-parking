"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Car,
  Calendar,
  Clock,
  CreditCard,
  QrCode,
  Wifi,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Lock,
  ArrowLeft,
  Search,
  Sparkles,
  Download,
} from "lucide-react";

// Types matching the rest of the application
interface Vehicle {
  id: string;
  plate: string;
  province: string;
  slot: string;
  checkInTime: Date;
  status: "Parked" | "Paid" | "Exited";
  fee: number;
  imageUrl?: string;
}

const MOCK_CAR_IMAGES = [
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&auto=format&fit=crop&q=80",
];

const MOCK_VEHICLES_DB: Vehicle[] = [
  {
    id: "1",
    plate: "กข 1234",
    province: "กรุงเทพฯ",
    slot: "A-01",
    checkInTime: new Date(Date.now() - 1000 * 60 * 20),
    status: "Parked",
    fee: 20,
    imageUrl: MOCK_CAR_IMAGES[0],
  },
  {
    id: "2",
    plate: "3มง 9999",
    province: "ชลบุรี",
    slot: "B-03",
    checkInTime: new Date(Date.now() - 1000 * 60 * 60 * 2.5),
    status: "Parked",
    fee: 60,
    imageUrl: MOCK_CAR_IMAGES[1],
  },
  {
    id: "3",
    plate: "รน 8888",
    province: "เชียงใหม่",
    slot: "A-05",
    checkInTime: new Date(Date.now() - 1000 * 60 * 60 * 4),
    status: "Paid",
    fee: 80,
    imageUrl: MOCK_CAR_IMAGES[2],
  },
  {
    id: "4",
    plate: "ฆฆ 7777",
    province: "ขอนแก่น",
    slot: "C-01",
    checkInTime: new Date(Date.now() - 1000 * 60 * 10),
    status: "Parked",
    fee: 0,
    imageUrl: MOCK_CAR_IMAGES[3],
  },
  {
    id: "5",
    plate: "สส 5555",
    province: "ระยอง",
    slot: "B-01",
    checkInTime: new Date(Date.now() - 1000 * 60 * 60 * 6),
    status: "Exited",
    fee: 120,
    imageUrl: MOCK_CAR_IMAGES[4],
  },
];

export default function CustomerPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // Component States
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [copiedPlate, setCopiedPlate] = useState(false);
  const [searchPlate, setSearchPlate] = useState("");
  const [searchError, setSearchError] = useState("");

  // Payment states
  const [selectedMethod, setSelectedMethod] = useState<
    "promptpay" | "card" | "linepay"
  >("promptpay");
  const [processing, setProcessing] = useState(false);
  const [creditCard, setCreditCard] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Generate PNG QR Code for download & long press capability
  useEffect(() => {
    if (!vehicle || vehicle.fee === 0 || selectedMethod !== "promptpay") return;

    const value = `PROMPTYPAY-EECD-CARPARK-FEE-${vehicle.fee}`;
    const size = 29;
    const matrix = Array(size)
      .fill(0)
      .map(() => Array(size).fill(0));

    const fillRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      val: number,
    ) => {
      for (let r = y; r < y + h; r++) {
        for (let c = x; c < x + w; c++) {
          if (r >= 0 && r < size && c >= 0 && c < size) {
            matrix[r][c] = val;
          }
        }
      }
    };

    // Draw finder patterns
    fillRect(0, 0, 7, 7, 1);
    fillRect(1, 1, 5, 5, 0);
    fillRect(2, 2, 3, 3, 1);

    fillRect(22, 0, 7, 7, 1);
    fillRect(23, 1, 5, 5, 0);
    fillRect(24, 2, 3, 3, 1);

    fillRect(0, 22, 7, 7, 1);
    fillRect(1, 23, 5, 5, 0);
    fillRect(2, 24, 3, 3, 1);

    // Alignment pattern
    fillRect(18, 18, 5, 5, 1);
    fillRect(19, 19, 3, 3, 0);
    matrix[20][20] = 1;

    // Seed deterministic hash
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c > 20) ||
          (r > 20 && c < 8) ||
          (r >= 18 && r <= 22 && c >= 18 && c <= 22)
        ) {
          continue;
        }
        const val = Math.abs(hash ^ (r * 123 + c * 456)) % 2 === 0 ? 1 : 0;
        matrix[r][c] = val;
      }
    }

    let pathData = "";
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c] === 1) {
          pathData += `M${c},${r} h1 v1 h-1 z `;
        }
      }
    }

    // Create SVG string with namespaces
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" shape-rendering="crispEdges" width="400" height="400"><rect width="29" height="29" fill="white" /><path d="${pathData}" fill="black" /></svg>`;

    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, 400, 400);
        context.drawImage(image, 0, 0, 400, 400);

        try {
          const pngURL = canvas.toDataURL("image/png");
          setQrCodeDataUrl(pngURL);
        } catch (err) {
          console.error("Failed to generate QR Code PNG", err);
        }
      }
      URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  }, [vehicle, selectedMethod]);

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const downloadLink = document.createElement("a");
    downloadLink.href = qrCodeDataUrl;
    downloadLink.download = `promptpay-qr-${vehicle?.plate?.replace(/\s+/g, "") || "payment"}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Initialize client-side current time
  useEffect(() => {
    const timeout = setTimeout(() => {
      setNow(Date.now());
    }, 0);
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Load vehicle data on mount/id change
  useEffect(() => {
    if (!id) return;

    // Set dynamic page title
    document.title = "ชำระค่าบริการจอดรถ | EECD Parking";

    const fetchVehicle = () => {
      const found = MOCK_VEHICLES_DB.find((v) => v.id === id);
      if (found) {
        setVehicle(found);
        setSearchError("");
        return;
      }
      setVehicle(null);
    };

    const timeout = setTimeout(() => {
      fetchVehicle();
      setLoading(false);
    }, 0);

    return () => clearTimeout(timeout);
  }, [id]);

  // Handle Search if vehicle is not found directly
  const handleSearchVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPlate.trim()) return;

    const cleanSearch = searchPlate.replace(/\s+/g, "");
    const found = MOCK_VEHICLES_DB.find(
      (v) =>
        v.plate.replace(/\s+/g, "").includes(cleanSearch) ||
        v.id.toLowerCase() === cleanSearch.toLowerCase(),
    );

    if (found) {
      // Redirect to the matching ticket page
      router.push(`/pay/${found.id}`);
      return;
    }
    setSearchError("ไม่พบข้อมูลทะเบียนรถยนต์ หรือหมายเลขบัตรจอดรถนี้ในระบบ");
  };

  // Handle WiFi code copying
  const copyWifiCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle License Plate copying
  const copyPlate = (plate: string) => {
    navigator.clipboard.writeText(plate);
    setCopiedPlate(true);
    setTimeout(() => setCopiedPlate(false), 2000);
  };

  // Submit payment
  const handlePay = () => {
    if (!vehicle) return;
    setProcessing(true);

    // Simulate payment transaction delay
    setTimeout(() => {
      // 1. Update in-memory vehicle status to "Paid"
      const found = MOCK_VEHICLES_DB.find((v) => v.id === vehicle.id);
      if (found) {
        found.status = "Paid";
      }

      // 2. Update local component state
      setVehicle((prev) => (prev ? { ...prev, status: "Paid" } : null));
      setProcessing(false);
    }, 1800);
  };

  // Calculate parking time and dynamic fee if vehicle is still parked
  const getDurationText = () => {
    if (!vehicle || now === 0) return "-";
    const durationHrs =
      (now - vehicle.checkInTime.getTime()) / (1000 * 60 * 60);
    return `${Math.ceil(Math.max(0.1, durationHrs))} ชม.`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090A0C] text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground">
          กำลังดึงข้อมูลบัตรจอดรถ...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090A0C] text-white flex flex-col font-sans selection:bg-primary selection:text-[#090A0C]">
      {/* Header Banner */}
      <header className="border-b border-[#22262F] bg-[#121418]/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            <h1 className="text-xs font-bold tracking-wider uppercase text-white">
              EECD Car Parking
            </h1>
          </div>
          <span className="text-xs text-muted-foreground font-semibold bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            Customer Portal
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col gap-6">
        {vehicle ? (
          <>
            {/* 1. Ticket Card Details */}
            <div className="bg-[#121418]/90 border border-[#22262F] rounded-2xl shadow-xl p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-primary tracking-wider uppercase">
                    บัตรจอดรถดิจิทัล
                  </span>
                  <h2 className="text-sm font-extrabold text-white mt-0.5">
                    ข้อมูลการใช้บริการ
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-muted-foreground">
                    TICKET ID
                  </span>
                  <p className="text-xs font-mono font-bold text-white uppercase">
                    {vehicle.id}
                  </p>
                </div>
              </div>

              {/* Car Photo Display */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/40 border border-[#22262F]">
                {vehicle.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={vehicle.imageUrl}
                    alt={`ภาพรถทะเบียน ${vehicle.plate}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Car className="size-8 stroke-[1.2]" />
                    <span className="text-xs">ไม่พบบันทึกรูปภาพจากกล้อง</span>
                  </div>
                )}
                {/* Status Indicator over image */}
                <div className="absolute top-3 right-3">
                  {vehicle.status === "Parked" && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-primary text-[#090A0C] px-2.5 py-0.5 rounded-full shadow-md">
                      <span className="h-1 w-1 rounded-full bg-[#090A0C] animate-ping" />
                      กำลังจอดอยู่
                    </span>
                  )}
                  {vehicle.status === "Paid" && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-green-500 text-white px-2.5 py-0.5 rounded-full shadow-md">
                      ชำระเงินแล้ว
                    </span>
                  )}
                  {vehicle.status === "Exited" && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#22262F] text-muted-foreground px-2.5 py-0.5 rounded-full shadow-md">
                      ออกจากลานจอดแล้ว
                    </span>
                  )}
                </div>
              </div>

              {/* Ticket Parameters Grid */}
              <div className="grid grid-cols-2 gap-3.5 bg-black/20 p-3.5 rounded-xl border border-[#22262F]/40 text-xs">
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">
                    ทะเบียนรถ
                  </span>
                  <div className="font-bold text-white text-sm flex items-center gap-1.5">
                    <span>{vehicle.plate}</span>
                    <button
                      onClick={() => copyPlate(vehicle.plate)}
                      className="p-1 rounded hover:bg-[#1C2028] text-muted-foreground hover:text-white transition-colors cursor-pointer"
                      title="คัดลอกทะเบียนรถ"
                    >
                      {copiedPlate ? (
                        <Check className="size-3.5 text-green-400" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {vehicle.province}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">
                    ช่องจอดรถ
                  </span>
                  <p className="font-mono font-bold text-primary text-sm flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {vehicle.slot}
                  </p>
                </div>

                <div className="space-y-0.5 col-span-2 border-t border-[#22262F]/50 pt-2.5">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">
                    เวลาเช็คอินเข้าจอด
                  </span>
                  <p className="font-semibold text-white">
                    วันที่{" "}
                    {vehicle.checkInTime.toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    เวลา{" "}
                    {vehicle.checkInTime.toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    น.
                  </p>
                </div>

                <div className="space-y-0.5 pt-1">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">
                    ระยะเวลาจอดรวม
                  </span>
                  <p className="font-bold text-white flex items-center gap-1">
                    <Clock className="size-3.5 text-muted-foreground" />
                    {vehicle.status === "Exited" ? "-" : getDurationText()}
                  </p>
                </div>

                <div className="space-y-0.5 pt-1">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">
                    ค่าจอดรถสะสม
                  </span>
                  <p className="font-extrabold text-white text-sm">
                    {vehicle.fee === 0 ? "จอดฟรี" : `฿${vehicle.fee}`}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Dynamic Content: Payment OR Success Receipt */}
            {vehicle.status === "Parked" ? (
              // Payment Section
              <div className="bg-[#121418]/90 border border-[#22262F] rounded-2xl shadow-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  ชำระเงินผ่านช่องทางออนไลน์
                </h3>

                {/* Total amount summary banner */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground">
                    ยอดเงินที่ต้องชำระ
                  </span>
                  <span className="text-2xl font-black text-primary">
                    ฿{vehicle.fee}
                  </span>
                </div>

                {vehicle.fee === 0 ? (
                  // Free parking check-out button
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-muted-foreground text-center">
                      ขณะนี้ยอดชำระของคุณคือ 0 บาท
                      สามารถกดปุ่มยืนยันการเช็คเอาท์เพื่อเสร็จสิ้นกระบวนการได้ทันที
                    </p>
                    <button
                      onClick={handlePay}
                      disabled={processing}
                      className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-[#090A0C] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 transition-all duration-300"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          กำลังดำเนินการ...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-4" />
                          ยืนยันการออก (จอดฟรี)
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Payment method selector buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setSelectedMethod("promptpay")}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                          selectedMethod === "promptpay"
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-black/20 border-[#22262F] hover:border-muted-foreground/30 text-muted-foreground hover:text-white"
                        }`}
                      >
                        <QrCode className="size-5" />
                        <span className="text-xs font-bold">PromptPay</span>
                      </button>

                      <button
                        onClick={() => setSelectedMethod("card")}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                          selectedMethod === "card"
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-black/20 border-[#22262F] hover:border-muted-foreground/30 text-muted-foreground hover:text-white"
                        }`}
                      >
                        <CreditCard className="size-5" />
                        <span className="text-xs font-bold">บัตรเครดิต</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMethod("linepay")}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                          selectedMethod === "linepay"
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-black/20 border-[#22262F] hover:border-muted-foreground/30 text-muted-foreground hover:text-white"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/line.png" alt="LINE" className="size-5 object-contain" />
                        <span className="text-xs font-bold">LINE Pay</span>
                      </button>
                    </div>

                    {/* Payment options details section */}
                    <div className="bg-black/30 border border-[#22262F] p-4 rounded-xl min-h-[160px] flex flex-col justify-center">
                      {selectedMethod === "promptpay" && (
                        <div className="text-center space-y-3.5 flex flex-col items-center">
                          {/* PromptPay Header */}
                          <div className="flex items-center justify-center gap-1 bg-[#0f2c59] py-1 px-3.5 rounded-lg border border-[#1d4c8a]/50 w-fit mx-auto">
                            <span className="text-xs font-black tracking-wide text-white uppercase">
                              Prompt
                            </span>
                            <span className="text-xs font-black tracking-wide text-[#a5d1ff] uppercase">
                              Pay
                            </span>
                          </div>
                          {/* Procedural QR Code representing PromtPay */}
                          <div className="p-2.5 border border-[#22262F] bg-white inline-block rounded-xl mx-auto shadow-inner">
                            {qrCodeDataUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={qrCodeDataUrl}
                                alt="PromptPay QR Code"
                                className="w-40 h-40 mx-auto select-all"
                                style={{ WebkitTouchCallout: "default" }}
                              />
                            ) : (
                              <div className="w-40 h-40 mx-auto flex items-center justify-center bg-white rounded-lg">
                                <Loader2 className="size-6 text-[#090A0C] animate-spin" />
                              </div>
                            )}
                          </div>
                          {/* Save QR Image Button */}
                          <button
                            type="button"
                            onClick={handleDownloadQR}
                            disabled={!qrCodeDataUrl}
                            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-[#0f2c59] hover:bg-[#13386e] text-white border border-[#1d4c8a]/50 py-2 px-4 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                          >
                            <Download className="size-3.5" />
                            บันทึกภาพ QR Code ลงเครื่อง
                          </button>
                          <p className="text-xs text-muted-foreground max-w-[240px] mx-auto leading-normal">
                            บันทึกภาพ QR Code (หรือกดค้างเพื่อบันทึก)
                            และสแกนผ่านแอปธนาคารเพื่อชำระเงินได้ทันที
                          </p>
                        </div>
                      )}

                      {selectedMethod === "card" && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold uppercase">
                            <Lock className="size-3 text-green-400" />
                            บัตรเครดิตชำระผ่านระบบความปลอดภัยสูง SSL
                          </div>
                          <div className="space-y-2 text-xs">
                            <input
                              type="text"
                              placeholder="หมายเลขบัตร (16 หลัก)"
                              maxLength={19}
                              value={creditCard.number}
                              onChange={(e) =>
                                setCreditCard({
                                  ...creditCard,
                                  number: e.target.value
                                    .replace(/\D/g, "")
                                    .replace(/(.{4})/g, "$1 ")
                                    .trim(),
                                })
                              }
                              className="w-full bg-[#121418] border border-[#22262F] focus:border-primary/80 focus:ring-1 focus:ring-primary/80 h-9 px-3 rounded-lg text-xs outline-none transition-all"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="ด/ป หมดอายุ (MM/YY)"
                                maxLength={5}
                                value={creditCard.expiry}
                                onChange={(e) =>
                                  setCreditCard({
                                    ...creditCard,
                                    expiry: e.target.value
                                      .replace(/\D/g, "")
                                      .replace(/(.{2})/g, "$1/")
                                      .replace(/\/$/, ""),
                                  })
                                }
                                className="w-full bg-[#121418] border border-[#22262F] focus:border-primary/80 focus:ring-1 focus:ring-primary/80 h-9 px-3 rounded-lg text-xs outline-none transition-all"
                              />
                              <input
                                type="password"
                                placeholder="CVV"
                                maxLength={3}
                                value={creditCard.cvv}
                                onChange={(e) =>
                                  setCreditCard({
                                    ...creditCard,
                                    cvv: e.target.value.replace(/\D/g, ""),
                                  })
                                }
                                className="w-full bg-[#121418] border border-[#22262F] focus:border-primary/80 focus:ring-1 focus:ring-primary/80 h-9 px-3 rounded-lg text-xs outline-none transition-all"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="ชื่อผู้ถือบัตรภาษาอังกฤษ"
                              value={creditCard.name}
                              onChange={(e) =>
                                setCreditCard({
                                  ...creditCard,
                                  name: e.target.value.toUpperCase(),
                                })
                              }
                              className="w-full bg-[#121418] border border-[#22262F] focus:border-primary/80 focus:ring-1 focus:ring-primary/80 h-9 px-3 rounded-lg text-xs outline-none transition-all"
                            />
                          </div>
                        </div>
                      )}

                      {selectedMethod === "linepay" && (
                        <div className="text-center py-4 space-y-3 flex flex-col items-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/line.png"
                            alt="LINE Pay"
                            className="size-12 object-contain mx-auto"
                          />
                          <div>
                            <p className="text-xs font-bold text-white">
                              Rabbit LINE Pay
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-normal max-w-[240px] mx-auto">
                              ชำระเงินสะดวกผ่านบัญชี Rabbit LINE Pay
                              หรือกระเป๋าเงิน LINE Wallet ของคุณ
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pay Button Action */}
                    <button
                      onClick={handlePay}
                      disabled={
                        processing ||
                        (selectedMethod === "card" &&
                          (!creditCard.number ||
                            !creditCard.expiry ||
                            !creditCard.cvv))
                      }
                      className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/95 text-[#090A0C] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-[0.98]"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="size-4 animate-spin text-[#090A0C]" />
                          กำลังตัดเงินเพื่อชำระค่าบริการ...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="size-4 text-[#090A0C]" />
                          ชำระเงินค่าบริการ ฿{vehicle.fee} บาท
                        </>
                      )}
                    </button>
                  </>
                )}

                <div className="flex items-start justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="size-4 text-muted-foreground" />
                  ธุรกรรมของคุณได้รับการคุ้มครองด้วยการเข้ารหัสข้อมูลที่ปลอดภัย
                </div>
              </div>
            ) : (
              // Success Screen Section
              <div className="bg-[#121418]/90 border border-[#22262F] rounded-2xl shadow-xl p-5 text-center space-y-5 animate-fadeIn">
                <div className="size-16 rounded-full bg-green-500/15 border-2 border-green-500/35 text-green-400 flex items-center justify-center mx-auto shadow-lg shadow-green-500/5">
                  <CheckCircle2 className="size-8 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-green-400 tracking-wider uppercase">
                    ทำรายการสำเร็จ
                  </span>
                  <h3 className="text-base font-extrabold text-white">
                    ชำระเงินเสร็จสมบูรณ์แล้ว!
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-[250px] mx-auto leading-relaxed">
                    ระบบได้รับยอดชำระของคุณเรียบร้อยแล้ว
                    ประตูทางออกลานจอดจะเปิดโดยอัตโนมัติเมื่อขับเข้าใกล้ที่กั้นภายใน
                    15 นาที
                  </p>
                </div>

                <div className="border-t border-dashed border-[#22262F] my-4"></div>

                {/* WiFi Coupon Section */}
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl space-y-2.5 text-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-10 w-10 bg-primary/10 rounded-bl-full flex items-center justify-center text-primary pr-1 pt-1 opacity-60">
                    <Sparkles className="size-3.5" />
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                    <Wifi className="size-3 text-primary animate-pulse" />
                    คูปอง Free Wi-Fi ใช้งานฟรี
                  </span>

                  <div className="flex gap-2 max-w-[260px] mx-auto">
                    <div className="flex-1 bg-black/40 border border-[#22262F] h-10 flex items-center justify-center rounded-lg font-mono font-bold text-sm tracking-wider text-white select-all">
                      {`EECD-WIFI-${vehicle.id.toUpperCase()}`}
                    </div>
                    <button
                      onClick={() =>
                        copyWifiCode(`EECD-WIFI-${vehicle.id.toUpperCase()}`)
                      }
                      className="px-3 rounded-lg bg-primary hover:bg-primary/95 text-[#090A0C] font-semibold text-xs transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
                      title="คัดลอกรหัสคูปอง"
                    >
                      {copied ? (
                        <Check className="size-4" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground leading-normal max-w-[200px] mx-auto">
                    SSID: <b>EECD-FreeWiFi</b> (ใช้งานได้ 1
                    ชั่วโมงหลังจากเริ่มเชื่อมต่ออุปกรณ์เครื่องแรก)
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          // 3. Fallback: Ticket Search / Not Found Screen
          <div className="bg-[#121418]/90 border border-[#22262F] rounded-2xl shadow-xl p-6 text-center space-y-5 animate-fadeIn">
            {id === "search" ? (
              <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
                <Car className="size-6 text-primary animate-pulse" />
              </div>
            ) : (
              <div className="size-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="size-6" />
              </div>
            )}

            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-white">
                {id === "search"
                  ? "ค้นหาข้อมูลค่าบริการจอดรถ"
                  : "ไม่พบบันทึกบัตรจอดรถ"}
              </h2>
              <p className="text-xs text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
                {id === "search"
                  ? "กรุณากรอกเลขทะเบียนรถเพื่อค้นหาข้อมูลบัตรจอดรถและตรวจสอบยอดชำระเงิน"
                  : "อาจเป็นเพราะไม่พบรหัสบัตรจอดรถนี้ในฐานข้อมูล หรือตัวรถได้ออกจากลานจอดรถไปแล้วเรียบร้อย"}
              </p>
            </div>

            {searchError && (
              <div className="p-3 bg-amber-500/10 text-balance border border-amber-500/20 text-amber-400 rounded-lg text-xs font-semibold">
                {searchError}
              </div>
            )}

            <div className="border-t border-[#22262F] my-4"></div>

            {/* Manual Plate Search Form */}
            <form
              onSubmit={handleSearchVehicle}
              className="space-y-3.5 text-left"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  ระบุเลขทะเบียนรถเพื่อค้นหา
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                    <Search className="size-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="เช่น กข 1234 หรือ 3มง 9999"
                    value={searchPlate}
                    onChange={(e) => setSearchPlate(e.target.value)}
                    className="w-full bg-black/30 border border-[#22262F] focus:border-primary/80 focus:ring-1 focus:ring-primary/80 h-10 pl-9 pr-3 rounded-xl text-xs outline-none text-white transition-all font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-[#090A0C] text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all duration-300"
              >
                ค้นหาข้อมูลค่าบริการ
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer Details */}
      <footer className="border-t border-[#22262F] bg-[#121418]/25 py-4 px-2 text-center mt-auto">
        <p className="text-xs text-muted-foreground text-balance">
          ระบบจัดการลานจอดรถ EECD Car Parking ปลอดภัย เชื่อถือได้ 24 ชั่วโมง
        </p>
      </footer>
    </div>
  );
}
