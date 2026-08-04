const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "")
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "")

const joinUrlPath = (...parts: Array<string | undefined>) =>
  parts
    .filter((part): part is string => Boolean(part))
    .map(trimSlashes)
    .filter(Boolean)
    .join("/")

const getApiRoot = () => trimTrailingSlash(process.env.NEXT_PUBLIC_API ?? "http://localhost:3000")

const getApiVersion = () => process.env.NEXT_PUBLIC_API_VERSION ?? "/v1"

export const buildApiUrl = (
  servicePath: string,
  endpointPath: string,
  searchParams?: URLSearchParams,
) => {
  const query = searchParams?.toString()
  const path = joinUrlPath("api", getApiVersion(), servicePath, endpointPath)

  return `${getApiRoot()}/${path}${query ? `?${query}` : ""}`
}

export const buildAuthApiUrl = (
  endpointPath: string,
  searchParams?: URLSearchParams,
) =>
  buildApiUrl(
    process.env.NEXT_PUBLIC_AUTH_API ?? "/auth",
    endpointPath,
    searchParams,
  )

export const buildParkingApiUrl = (
  endpointPath: string,
  searchParams?: URLSearchParams,
) =>
  buildApiUrl(
    process.env.NEXT_PUBLIC_PARKING_API ?? "/parking",
    endpointPath,
    searchParams,
  )

export const buildPaymentApiUrl = (
  endpointPath: string,
  searchParams?: URLSearchParams,
) =>
  buildApiUrl(
    process.env.NEXT_PUBLIC_PAYMENT_API ?? "/payment",
    endpointPath,
    searchParams,
  )
