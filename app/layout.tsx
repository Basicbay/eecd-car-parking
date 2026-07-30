import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import AuthSessionProvider from "@/components/auth-session-provider";
import "./globals.css";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
});

export const metadata: Metadata = {
  title: "ระบบจัดการที่จอดรถ | EECD Car Parking Management",
  description: "ระบบบริหารจัดการที่จอดรถและคูปองไวไฟ - EECD Car Parking Management System",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`dark ${ibmPlexSansThai.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
