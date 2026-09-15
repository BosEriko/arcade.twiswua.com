import { ImageResponse } from "next/og";
import { arcadeCard } from "./social-image";

export const alt = "TwisWua's Arcade Room — retro-style browser games";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(arcadeCard(size), size);
}
