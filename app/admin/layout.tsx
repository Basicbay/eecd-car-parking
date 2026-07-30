import AdminLayout from "@/components/admin-layout"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return <AdminLayout>{children}</AdminLayout>
}
