import type { Metadata, Viewport } from "next";
import { Courier_Prime, Gaegu } from "next/font/google";
import { DoodleDefs } from "@/components/Doodle";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";
import "./app.css";

const gaegu = Gaegu({ variable: "--font-gaegu", weight: ["400", "700"], subsets: ["latin"] });
const courier = Courier_Prime({ variable: "--font-courier", weight: ["400", "700"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Caboodle",
  description: "Packing lists made for your trip: the whole kit and caboodle, packed.",
  applicationName: "Caboodle",
  appleWebApp: { capable: true, title: "Caboodle", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1819" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${gaegu.variable} ${courier.variable}`}>
      <body>
        <DoodleDefs />
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
