import { NextRequest, NextResponse } from "next/server";
import { consumeBridgeLaunchTicket, safeReturnTo } from "@/lib/bridge-launch";

export async function GET(request: NextRequest) {
  const ticket = request.nextUrl.searchParams.get("ticket");
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  if (!ticket) {
    return NextResponse.redirect(new URL("/settings?error=ticket-required", request.url));
  }

  const consumed = await consumeBridgeLaunchTicket(ticket, returnTo);
  if (!consumed.ok) {
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(consumed.error)}`, request.url));
  }

  const response = NextResponse.redirect(new URL(consumed.ticket.returnTo ?? returnTo, request.url));
  response.cookies.set("connaissance_bridge_session", Buffer.from(JSON.stringify(consumed.ticket)).toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
