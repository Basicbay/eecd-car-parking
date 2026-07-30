export interface WifiVoucher {
  id: string
  code: string
  duration: string
  speedLimit: string
  createdAt: Date
  expiresAt: Date | null
  status: "Active" | "Used" | "Expired"
  apiStatus?: string
  connectedDevicesCount: number
  usedByDevice?: string
}

export interface WifiVoucherApiItem {
  id?: number
  voucher_code: string
  password: string
  batch: string
  realm: string
  profile: string
  status: string
  duration?: string
  bandwidth?: {
    download_speed: string
    upload_speed: string
    download_bps: number
    upload_bps: number
    bandwidth_formatted: string
  }
  connected_devices_count?: number
  time_info?: {
    created_datetime: string
    created_timestamp: number
    created_iso: string
    expire_datetime: string | null
    expire_timestamp: number | null
    expire_iso: string | null
    duration_sec: number
    duration_formatted: string
    time_used_sec: number
    time_left_sec: number
    time_left_formatted: string
  }
  user_details?: {
    extra_name: string
    extra_value: string
    time_used_sec: number
    data_used_bytes: number
    perc_time_used: number
    perc_data_used: number
  }
  created: string
  expire: string | null
}

export interface WifiVoucherPagination {
  current_page: number
  per_page: number
  total_items: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface WifiVoucherApiResponse {
  success: boolean
  action: string
  server_time?: string
  server_timestamp?: number
  timezone?: string
  pagination?: WifiVoucherPagination
  date?: string
  count: number
  data: WifiVoucherApiItem[]
}

export interface FetchWifiVouchersParams {
  page: number
  limit: number
  filter: string
  duration: string
  speedMbps: string
}

export interface FetchWifiVouchersResult {
  vouchers: WifiVoucher[]
  pagination: WifiVoucherPagination | null
}

export interface CreateWifiVouchersParams {
  duration: "1h" | "3h" | "5h" | "1d"
  speedMbps: number
  quantity: number
  realm?: string
}

export interface CreatedWifiVoucherApiItem {
  voucher_code: string
  password: string
  realm: string
  profile: string
  batch: string
  status: string
  duration: string
  speed_limit: string
  expire: string | null
}

export interface CreateWifiVouchersResponse {
  success: boolean
  message: string
  batch: string
  count: number
  data: CreatedWifiVoucherApiItem[]
}

export const WIFI_API_URL = process.env.NEXT_PUBLIC_WIFI_API ?? "http://10.20.3.250/api/vouchers.php/"
export const WIFI_DELETE_API_URL =
  process.env.NEXT_PUBLIC_WIFI_DELETE_API ?? "https://radiusdesk.ntnova.com/api/vouchers.php"

export const parseApiDate = (value: string) => new Date(value.replace(" ", "T"))

export const formatVoucherDate = (date: Date) => {
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const buddhistYear = ((date.getFullYear() + 543) % 100).toString().padStart(2, "0")
  const hour = date.getHours().toString().padStart(2, "0")
  const minute = date.getMinutes().toString().padStart(2, "0")

  return `${day}/${month}/${buddhistYear} ${hour}:${minute}`
}

export const formatBandwidth = (bandwidth?: WifiVoucherApiItem["bandwidth"]) => {
  if (!bandwidth) return "-"

  return `${bandwidth.download_speed.replace(" Mbps", "")}/${bandwidth.upload_speed}`
}

export const getVoucherStatus = (status: string, expiresAt: Date | null): WifiVoucher["status"] => {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus === "depleted") return "Expired"
  if (expiresAt && expiresAt.getTime() < Date.now()) return "Expired"
  if (normalizedStatus === "active" || normalizedStatus === "used") return "Used"
  return "Active"
}

export const getStatusApiFilter = (status: "All" | "Active" | "Used" | "Expired") => {
  if (status === "Active") return "new"
  if (status === "Used") return "active"
  if (status === "Expired") return "depleted"
  return "all"
}

export const deleteWifiVoucher = async (voucherCode: string) => {
  const url = new URL(WIFI_DELETE_API_URL)
  url.searchParams.set("voucher_code", voucherCode)

  const response = await fetch(url.toString(), {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete Wi-Fi voucher")
  }

  const text = await response.text()
  if (!text) return

  const result = JSON.parse(text) as { success?: boolean; message?: string }
  if (result.success === false) {
    throw new Error(result.message || "Failed to delete Wi-Fi voucher")
  }
}

export const createWifiVouchers = async ({
  duration,
  speedMbps,
  quantity,
  realm = "NT_Guest",
}: CreateWifiVouchersParams): Promise<CreateWifiVouchersResponse> => {
  const response = await fetch(WIFI_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      duration,
      speed_mbps: speedMbps,
      quantity,
      realm,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to create Wi-Fi vouchers")
  }

  const result = (await response.json()) as CreateWifiVouchersResponse

  if (!result.success) {
    throw new Error(result.message || "Failed to create Wi-Fi vouchers")
  }

  return result
}

export const fetchWifiVouchers = async ({
  page,
  limit,
  filter,
  duration,
  speedMbps,
}: FetchWifiVouchersParams): Promise<FetchWifiVouchersResult> => {
  const url = new URL(WIFI_API_URL)
  url.searchParams.set("page", page.toString())
  url.searchParams.set("limit", limit.toString())
  url.searchParams.set("filter", filter)
  url.searchParams.set("duration", duration)
  if (speedMbps !== "all") {
    url.searchParams.set("speed_mbps", speedMbps)
  }

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error("Failed to fetch Wi-Fi vouchers")
  }

  const result = (await response.json()) as WifiVoucherApiResponse

  if (!result.success) {
    throw new Error("Wi-Fi vouchers API returned unsuccessful response")
  }

  return {
    vouchers: result.data.map((voucher) => {
      const createdAt = parseApiDate(voucher.time_info?.created_datetime ?? voucher.created)
      const expireValue = voucher.time_info?.expire_datetime ?? voucher.expire
      const expiresAt = expireValue ? parseApiDate(expireValue) : null
      const userDetail = voucher.user_details?.extra_value || voucher.user_details?.extra_name
      const connectedDevices = voucher.connected_devices_count ?? 0

      return {
        id: voucher.id?.toString() ?? voucher.voucher_code,
        code: voucher.voucher_code,
        duration: voucher.time_info?.duration_formatted ?? voucher.duration ?? voucher.profile ?? "-",
        speedLimit: formatBandwidth(voucher.bandwidth),
        createdAt,
        expiresAt,
        status: getVoucherStatus(voucher.status, expiresAt),
        apiStatus: voucher.status,
        connectedDevicesCount: connectedDevices,
        usedByDevice: userDetail || (connectedDevices > 0 ? `${connectedDevices} devices` : voucher.batch),
      }
    }),
    pagination: result.pagination ?? null,
  }
}
