import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "knowledge_ai",
    slug: "connaissance",
    providerMode: process.env.KNOWLEDGE_AI_PROVIDER_MODE ?? "local_only",
    generatedAt: new Date().toISOString(),
  });
}
