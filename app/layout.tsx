import type { Metadata, Viewport } from "next";
import Pwa from "./pwa";
import "./globals.css";

const title = "TwisWua's Arcade Room";
const description = "TwisWua arcade games built for desktop and mobile.";

export const metadata: Metadata = {
  metadataBase: new URL("https://arcade.twiswua.com"),
  title,
  description,
  applicationName: "TwisWua Arcade",
  appleWebApp: {
    capable: true,
    title: "TwisWua Arcade",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: title,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1b2b2b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}<Pwa /></body>
    </html>
  );
}
