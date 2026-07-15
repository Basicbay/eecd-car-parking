import { auth } from "@/auth"
import AdminLayout from "@/components/admin-layout"

interface LayoutProps {
  children: React.ReactNode
}

export default async function Layout({ children }: LayoutProps) {
  const session = await auth()

  return (
    <AdminLayout
      adminEmail={session?.user?.email}
      adminName={session?.user?.name}
    >
      {children}
    </AdminLayout>
  )
}
