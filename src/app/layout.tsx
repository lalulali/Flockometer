import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PinGate from "@/components/ui/PinGate";
import FloatingNavbar from "@/components/ui/FloatingNavbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flockometer",
  description: "IFGF Attendance Counter",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.variable} font-sans antialiased h-full bg-[#F3F4F6] text-[#1F2937]`}
      >
        <PinGate>
          <div className="min-h-full max-w-[375px] mx-auto bg-white shadow-xl relative overflow-x-hidden flex flex-col">
            <main className="flex-1 pb-32">
              {children}
            </main>
            <FloatingNavbar />
          </div>
        </PinGate>
      </body>
    </html>
  );
}
