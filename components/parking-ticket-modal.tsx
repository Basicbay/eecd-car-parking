"use client"

import * as React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  X,
  Printer,
  Download,
  Wifi,
  QrCode,
  Share2,
  Check,
  FileText
} from "lucide-react"

interface ParkingTicketModalProps {
  isOpen: boolean
  onClose: () => void
  vehicle: {
    id: string
    plate: string
    province: string
    slot: string
    checkInTime: Date
    fee?: number
    wifiCode?: string
  } | null
}

// Procedural SVG QR Code Generator
function MockQRCode({ value }: { value: string }) {
  const size = 29
  const matrix = Array(size).fill(0).map(() => Array(size).fill(0))

  const fillRect = (x: number, y: number, w: number, h: number, val: number) => {
    for (let r = y; r < y + h; r++) {
      for (let c = x; c < x + w; c++) {
        if (r >= 0 && r < size && c >= 0 && c < size) {
          matrix[r][c] = val
        }
      }
    }
  }

  // Draw finder patterns
  // Top-left
  fillRect(0, 0, 7, 7, 1)
  fillRect(1, 1, 5, 5, 0)
  fillRect(2, 2, 3, 3, 1)

  // Top-right
  fillRect(22, 0, 7, 7, 1)
  fillRect(23, 1, 5, 5, 0)
  fillRect(24, 2, 3, 3, 1)

  // Bottom-left
  fillRect(0, 22, 7, 7, 1)
  fillRect(1, 23, 5, 5, 0)
  fillRect(2, 24, 3, 3, 1)

  // Alignment pattern
  fillRect(18, 18, 5, 5, 1)
  fillRect(19, 19, 3, 3, 0)
  matrix[20][20] = 1

  // Seed deterministic hash
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (
        (r < 8 && c < 8) || 
        (r < 8 && c > 20) || 
        (r > 20 && c < 8) || 
        (r >= 18 && r <= 22 && c >= 18 && c <= 22)
      ) {
        continue
      }
      const val = ((Math.abs(hash ^ (r * 123 + c * 456))) % 2 === 0) ? 1 : 0
      matrix[r][c] = val
    }
  }

  // Build SVG path
  let pathData = ""
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        pathData += `M${c},${r} h1 v1 h-1 z `
      }
    }
  }

  return (
    <svg className="w-32 h-32 mx-auto" viewBox="0 0 29 29" shapeRendering="crispEdges">
      <rect width="29" height="29" fill="white" />
      <path d={pathData} fill="black" />
    </svg>
  )
}

// Procedural SVG Barcode Generator
function MockBarcode({ value }: { value: string }) {
  const numLines = 50
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
  }

  const bars = []
  let x = 2
  for (let i = 0; i < numLines; i++) {
    const seed = Math.abs(hash ^ (i * 789))
    const isBar = seed % 3 !== 0
    const barWidth = (seed % 2) + 1
    if (isBar && x < 96) {
      bars.push(<rect key={i} x={x} y={0} width={barWidth} height={35} fill="black" />)
      x += barWidth
    }
    x += 1.5 
  }

  return (
    <svg className="w-full h-10" viewBox="0 0 100 35" preserveAspectRatio="none">
      <rect width="100" height="35" fill="white" />
      {bars}
    </svg>
  )
}

export default function ParkingTicketModal({ isOpen, onClose, vehicle }: ParkingTicketModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !vehicle) return null

  // Generate deterministic details
  const ticketId = `TKT-${vehicle.id.toUpperCase()}-${vehicle.slot.replace("-", "")}`
  const wifiCode = vehicle.wifiCode || `EECD-WIFI-${vehicle.id.toUpperCase()}`
  const qrCodePayload = `https://eecd-carpark.com/pay/${vehicle.id}`

  // Print PDF Trigger
  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML
    const originalContent = document.body.innerHTML

    if (printContent) {
      // Create printable document in iframe or window
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Parking Ticket - ${ticketId}</title>
              <style>
                body {
                  font-family: monospace;
                  padding: 20px;
                  color: #000;
                  background: #fff;
                  display: flex;
                  justify-content: center;
                }
                .ticket {
                  width: 300px;
                  text-align: center;
                  border: 1px dashed #000;
                  padding: 15px;
                }
                .line { border-top: 1px dashed #000; margin: 10px 0; }
                .bold { font-weight: bold; }
                .big { font-size: 18px; }
                svg { margin: 10px auto; display: block; }
              </style>
            </head>
            <body>
              <div class="ticket">
                <h2>EECD SMART PARKING</h2>
                <p>บัตรจอดรถและรหัสไวไฟอัตโนมัติ</p>
                <div class="line"></div>
                <p class="bold">ทะเบียน: ${vehicle.plate} (${vehicle.province})</p>
                <p class="bold">ช่องจอด: ${vehicle.slot}</p>
                <p>เข้าเมื่อ: ${vehicle.checkInTime.toLocaleString("th-TH")}</p>
                <div class="line"></div>
                <p>สแกนชำระเงินค่าบริการ</p>
                <!-- QR Code representation in text or image -->
                <div style="font-weight: bold; padding: 10px; border: 1px solid #000; display: inline-block; margin: 5px 0;">
                  [ QR CODE FOR PAYMENT ]
                </div>
                <div class="line"></div>
                <p class="bold">FREE WI-FI ACCOUNT</p>
                <p class="big bold" style="background:#eee; padding:5px; border-radius:4px; font-family:monospace;">Code: ${wifiCode}</p>
                <p style="font-size:10px;">เชื่อมต่อ SSID: <b>EECD-FreeWiFi</b></p>
                <div class="line"></div>
                <p style="font-size: 10px;">กรุณาเก็บรักษาบัตรนี้เพื่อสแกนจ่ายเงิน<br>และเชื่อมต่อ Wi-Fi ในพื้นที่จอดรถ</p>
                <p style="font-size: 9px; margin-top: 10px;">ID: ${ticketId}</p>
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                }
              </script>
            </body>
          </html>
        `)
        printWindow.document.close()
      }
    }
  }

  // Save Image Simulator
  const handleDownloadImage = () => {
    setDownloading(true)
    setTimeout(() => {
      setDownloading(false)
      alert(`บันทึกตั๋วเช็คอินรถยนต์สำเร็จเป็นไฟล์ ${ticketId}.png (จำลอง)`)
    }, 1500)
  }

  // Copy Wifi Voucher Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(wifiCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn cursor-pointer"
    >
      {/* Modal Dialog container */}
      <div className="relative w-full max-w-md bg-[#121418] border border-border/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] cursor-default">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#22262F] bg-black/40">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="size-4.5 text-primary" />
            บัตรจอดรถและรหัส Wi-Fi (e-Ticket)
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-white transition-colors"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center bg-[#090A0C]">
          
          {/* Printable Ticket Area */}
          <div
            ref={printAreaRef}
            className="w-full max-w-[290px] bg-white text-black p-6 rounded-lg relative shadow-md font-mono select-none"
            style={{
              backgroundImage: "radial-gradient(circle at 100% 150px, transparent 12px, white 12px), radial-gradient(circle at 0px 150px, transparent 12px, white 12px)"
            }}
          >
            {/* Top Cut Jagged Mock */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-white" style={{
              clipPath: "polygon(0% 100%, 3% 0%, 6% 100%, 9% 0%, 12% 100%, 15% 0%, 18% 100%, 21% 0%, 24% 100%, 27% 0%, 30% 100%, 33% 0%, 36% 100%, 39% 0%, 42% 100%, 45% 0%, 48% 100%, 51% 0%, 54% 100%, 57% 0%, 60% 100%, 63% 0%, 66% 100%, 69% 0%, 72% 100%, 75% 0%, 78% 100%, 81% 0%, 84% 100%, 87% 0%, 90% 100%, 93% 0%, 96% 100%, 99% 0%, 100% 100%)"
            }} />

            {/* Ticket Content */}
            <div className="text-center space-y-4 pt-2">
              <div>
                <h4 className="font-extrabold text-sm tracking-tight text-black">EECD SMART PARKING</h4>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">Automated Receipt System</p>
              </div>

              {/* Barcode representation */}
              <div className="space-y-1">
                <MockBarcode value={ticketId} />
                <p className="text-[8px] font-bold text-zinc-600 tracking-widest">{ticketId}</p>
              </div>

              <div className="border-t border-dashed border-zinc-300 my-2"></div>

              {/* Vehicle parameters */}
              <div className="space-y-1.5 text-left text-[11px] text-zinc-800">
                <div className="flex justify-between">
                  <span>ทะเบียนรถ:</span>
                  <span className="font-bold text-black">{vehicle.plate}</span>
                </div>
                <div className="flex justify-between">
                  <span>จังหวัด:</span>
                  <span className="font-bold text-black">{vehicle.province}</span>
                </div>
                <div className="flex justify-between">
                  <span>ช่องจอดรับสิทธิ์:</span>
                  <span className="font-bold text-black">{vehicle.slot}</span>
                </div>
                <div className="flex justify-between">
                  <span>เวลาเข้าจอด:</span>
                  <span className="font-bold text-black">
                    {vehicle.checkInTime.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })} ({vehicle.checkInTime.toLocaleDateString("th-TH")})
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-zinc-300 my-2"></div>

              {/* QR Code section */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-black flex items-center gap-1 justify-center">
                  <QrCode className="size-3.5 text-zinc-800" />
                  สแกนชำระค่าบริการจอดรถ
                </p>
                <div className="p-2 border border-zinc-200 inline-block bg-white rounded">
                  <MockQRCode value={qrCodePayload} />
                </div>
                <p className="text-[8px] text-zinc-500 max-w-[200px] mx-auto leading-relaxed">
                  สแกนชำระเงินก่อนนำรถออก ระบบเปิดประตูอัตโนมัติเมื่อตรวจสอบสถานะชำระเงินเรียบร้อย
                </p>
              </div>

              <div className="border-t border-dashed border-zinc-300 my-2"></div>

              {/* WiFi voucher section */}
              <div className="space-y-2 bg-zinc-50 p-2.5 rounded border border-zinc-100">
                <p className="text-[9px] font-bold text-zinc-700 flex items-center gap-1 justify-center uppercase tracking-wide">
                  <Wifi className="size-3.5 text-zinc-800 animate-pulse" />
                  Free WiFi Credentials
                </p>
                <div className="bg-zinc-200 py-1.5 px-3 rounded font-bold text-xs tracking-wider text-black select-text">
                  {wifiCode}
                </div>
                <p className="text-[8px] text-zinc-500 leading-normal">
                  SSID: <b>EECD-FreeWiFi</b><br />
                  ใช้สิทธิ์อินเทอร์เน็ตได้ฟรีในพื้นที่
                </p>
              </div>

              <div className="border-t border-dashed border-zinc-300 my-2"></div>

              {/* Footer details */}
              <div className="text-[8px] text-zinc-400 space-y-1">
                <p>ขอบคุณที่ใช้บริการลานจอดรถ EECD</p>
                <p>สิทธิ์การจอดคิดอัตราบริการตามที่ระบุในเงื่อนไข</p>
              </div>
            </div>

            {/* Bottom Cut Jagged Mock */}
            <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white" style={{
              clipPath: "polygon(0% 0%, 3% 100%, 6% 0%, 9% 100%, 12% 0%, 15% 100%, 18% 0%, 21% 100%, 24% 0%, 27% 100%, 30% 0%, 33% 100%, 36% 0%, 39% 100%, 42% 0%, 45% 100%, 48% 0%, 51% 100%, 54% 0%, 57% 100%, 60% 0%, 63% 100%, 66% 0%, 69% 100%, 72% 0%, 75% 100%, 78% 0%, 81% 100%, 84% 0%, 87% 100%, 90% 0%, 93% 100%, 96% 0%, 99% 100%, 100% 0%)"
            }} />
          </div>
        </div>

        {/* Modal Action Controls Footer */}
        <div className="p-4 border-t border-[#22262F] bg-black/40 flex flex-col gap-2">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-border text-xs gap-1.5 h-9 cursor-pointer text-muted-foreground hover:text-white"
            >
              <Printer className="size-3.5" />
              ดูไฟล์ / สั่งพิมพ์ PDF
            </Button>
            <Button
              onClick={handleDownloadImage}
              disabled={downloading}
              className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold h-9 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {downloading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Download className="size-3.5" />
              )}
              บันทึกเป็นไฟล์ภาพ
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopyCode}
              variant="ghost"
              className="flex-1 text-xs gap-1.5 h-8.5 border border-transparent hover:bg-muted text-muted-foreground hover:text-white cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-green-400" />
                  <span className="text-green-400">คัดลอกรหัส Wi-Fi สำเร็จ!</span>
                </>
              ) : (
                <>
                  <Wifi className="size-3.5" />
                  คัดลอกรหัสคูปอง Wi-Fi
                </>
              )}
            </Button>
            
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-xs h-8.5 text-muted-foreground hover:text-white cursor-pointer"
            >
              ปิดหน้าจอ
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
