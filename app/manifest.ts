import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TwisWua's Arcade Room",
    short_name: "TwisWua Arcade",
    description: "TwisWua arcade games built for desktop and mobile.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#1b2b2b",
    theme_color: "#1b2b2b",
    categories: ["games", "entertainment"],
    icons: [
      { src: "/pwa-icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icons/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
