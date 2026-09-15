import type { Metadata, Viewport } from "next";
import "./globals.css";

const title = "TwisWua's Arcade Room";
const description = "TwisWua arcade games built for desktop and mobile.";

export const metadata: Metadata = {
  metadataBase: new URL("https://arcade.twiswua.com"),
  title,
  description,
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
  themeColor: "#d8dbc4",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
