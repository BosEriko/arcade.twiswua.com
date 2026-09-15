import { ImageResponse } from "next/og";
import { arcadeMark } from "./social-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(arcadeMark(size), size);
}
