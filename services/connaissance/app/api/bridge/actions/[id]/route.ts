import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bridgeUrl = process.env.BRIDGE_WEB_URL ?? process.env.BRIDGE_CONTROL_PLANE_URL;
  const input = await request.json().catch(() => ({}));

  if (!bridgeUrl) {
    if (process.env.KNOWLEDGE_AI_ACTIONS_REQUIRE_BRIDGE === "1") {
      return NextResponse.json({
        ok: false,
        error: "bridge-url-missing",
        action: id,
      }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      action: id,
      mode: "standalone-local",
      output: standaloneLocalOutput(id, input),
    }, { headers: { "cache-control": "no-store" } });
  }

  const response = await fetch(new URL(`/api/actions/${encodeURIComponent(id)}`, bridgeUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
}

function standaloneLocalOutput(actionId: string, input: unknown) {
  if (actionId === "knowledge_ai.chat.stream" || actionId === "knowledge_ai.chat.send") {
    return {
      accepted: true,
      input,
      message:
        "J'ai trouvé trois éléments utiles dans la base locale. Le rapport d'opérations confirme les priorités terrain [1], les notes de réunion listent les décisions à suivre [2], et le tableau de production donne les volumes par site [3]. 🔗 Documentation",
      citations: [
        {
          id: "citation-operations-q2",
          documentName: "Rapport operations Q2",
          similarityScore: 0.92,
          knowledgeId: "source-energy-report",
          contributorName: "Equipe operations",
          createdAt: "2026-06-13",
          groupTitle: "Base de connaissances",
        },
        {
          id: "citation-meeting-notes",
          documentName: "Notes réunion client",
          similarityScore: 0.88,
          knowledgeId: "source-customer-notes",
          contributorName: "Equipe projet",
          createdAt: "2026-06-12",
          groupTitle: "Base de connaissances",
        },
        {
          id: "citation-production-sheet",
          documentName: "Suivi production",
          similarityScore: 0.84,
          knowledgeId: "source-data-sheet",
          contributorName: "Service data",
          createdAt: "2026-06-14",
          groupTitle: "Base de connaissances",
        },
      ],
      webSources: [
        {
          title: "Documentation",
          url: "https://example.test/documentation",
          snippet: "Source web de démonstration utilisée pour tester l'UI Connaissance sans appel IA externe.",
        },
      ],
      structuredData: {
        type: "sql",
        tableName: "Production par site",
        columns: ["site", "volume", "statut"],
        rows: [
          ["Site A", 42, "stable"],
          ["Site B", 31, "a surveiller"],
          ["Site C", 28, "stable"],
        ],
        sqlQuery: "select site, volume, statut from knowledge_ai_demo_production order by volume desc;",
        responseTimeMs: 38,
      },
      performanceMs: 118,
    };
  }

  return {
    accepted: true,
    input,
    message: "Action recorded locally until Bridge control plane is configured.",
  };
}
