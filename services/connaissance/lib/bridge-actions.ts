export interface BridgeActionResult<T = unknown> {
  ok: boolean;
  output?: T;
  error?: string;
}

export async function callBridgeAction<T = unknown>(id: string, input: Record<string, unknown> = {}): Promise<BridgeActionResult<T>> {
  const response = await fetch(`/api/bridge/actions/${encodeURIComponent(id)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json().catch(() => ({}))) as BridgeActionResult<T>;
  if (!response.ok) return { ok: false, error: data.error ?? `bridge-action-failed:${response.status}` };
  return data;
}
