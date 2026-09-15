import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TwisWua's Arcade Room",
    short_name: "TwisWua Arcade",
    description: "TwisWua arcade games built for desktop and mobile.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f7f1",
    theme_color: "#d8dbc4",
    icons: [
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      { src: "/icon", sizes: "512x512", type: "image/png" },
    ],
  };
}
