import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import PinGate from "@/components/ui/PinGate";
import StickyNavbar from "@/components/ui/StickyNavbar";
import QueryProvider from "@/components/providers/QueryProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flockometer",
  description: "IFGF Attendance Counter",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Flockometer",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  }
};

export const viewport: Viewport = {
  themeColor: "#0072BC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${outfit.variable} font-sans antialiased h-full overflow-hidden bg-[#F3F4F6] text-[#1F2937]`}
      >
        <QueryProvider>
          <PinGate>
            <div className="h-full max-w-md mx-auto bg-white shadow-xl relative flex flex-col">
              <main className="flex-1 w-full overflow-hidden bg-white">
                {children}
              </main>
              <StickyNavbar />
            </div>
          </PinGate>
        </QueryProvider>
      </body>
    </html>
  );
}
