import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const MIME_TYPES: Record<string, string> = {
  usdz: "model/vnd.usdz+zip",
  glb: "model/gltf-binary",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

  try {
    const buffer = readFileSync(join(process.cwd(), "public", "models", filename));
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        "Cache-Control": ext === "usdz" ? "no-cache" : "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
