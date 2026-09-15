import { ImageResponse } from "next/og";
import { arcadeMark } from "../../social-image";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return ["192", "512", "maskable"].map((size) => ({ size }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const dimensions = { width: size === "192" ? 192 : 512, height: size === "192" ? 192 : 512 };
  return new ImageResponse(arcadeMark(dimensions, size === "maskable" ? 0.5 : 0.62), dimensions);
}
