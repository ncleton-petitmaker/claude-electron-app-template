export interface BridgeLaunchTicket {
  id: string;
  organizationId: string;
  userId: string;
  serviceId: string;
  serviceInstanceId?: string | null;
  returnTo?: string | null;
}

export type BridgeLaunchResult =
  | { ok: true; ticket: BridgeLaunchTicket }
  | { ok: false; error: string };

export async function consumeBridgeLaunchTicket(ticket: string, returnTo?: string): Promise<BridgeLaunchResult> {
  const baseUrl = process.env.BRIDGE_CONTROL_PLANE_URL;
  if (!baseUrl) return { ok: false, error: "bridge-control-plane-url-missing" };

  const response = await fetch(new URL("/bridge/launch-ticket/consume", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      payload: {
        ticket,
        returnTo,
      },
    }),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    ticket?: Record<string, unknown>;
  };
  if (!response.ok || !data.ok || !data.ticket) {
    return { ok: false, error: data.error ?? `bridge-launch-consume-failed:${response.status}` };
  }
  return {
    ok: true,
    ticket: {
      id: String(data.ticket.id ?? ""),
      organizationId: String(data.ticket.organizationId ?? ""),
      userId: String(data.ticket.userId ?? ""),
      serviceId: String(data.ticket.serviceId ?? ""),
      serviceInstanceId: typeof data.ticket.serviceInstanceId === "string" ? data.ticket.serviceInstanceId : null,
      returnTo: typeof data.ticket.returnTo === "string" ? data.ticket.returnTo : null,
    },
  };
}

export function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/chat";
  return value;
}
