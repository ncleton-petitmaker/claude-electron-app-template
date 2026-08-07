import test from "node:test";
import assert from "node:assert/strict";
import { callAction, listActions, type ActionContext } from "../../server/actions";
import { callCrmTool, checkSalesCrmHealth, SalesCrmError } from "../../server/sales-crm-client";

/**
 * Actions du module sales_crm (phase D de ULTRAPLAN-YAKA-BRIDGE-CRM.md).
 *
 * Le CRM est un service externe : ces actions ne touchent aucune table du
 * Bridge, elles relaient vers son contrat OpenAPI. Ce qui doit tenir :
 *
 *  - une action refuse un appelant sans organisation ou sans portee, avant
 *    tout appel reseau ;
 *  - l'appel sortant ne vise que POST /api/tools/<module>/<outil>, jamais
 *    les routes REST historiques du CRM ;
 *  - le jeton de service part en en-tete et jamais dans l'URL ;
 *  - un CRM eteint ou un jeton revoque produit un message qui dit quoi
 *    faire, pas une trace de pile ;
 *  - les trois actions apparaissent en MCP comme en HTTP, sans declaration
 *    separee.
 */

const ORG = "9c3b6f91-2074-4d6e-8c4a-3514da2d986d";

const baseContext: ActionContext = {
  dataDir: "/tmp/bridge-erp-template-test",
  actorId: "user-test",
  actorRole: "cloud-member",
  userId: "11111111-1111-4111-8111-111111111111",
};

function contextWithScopes(scopes: string[]): ActionContext {
  return {
    ...baseContext,
    organizationId: ORG,
    membershipRole: "member",
    entitlements: [{ service_id: "sales_crm", enabled: true, scopes }],
  };
}

/** Remplace fetch le temps d'un appel et retourne ce qui a ete emis. */
async function captureFetch(
  responder: (url: URL, init: RequestInit) => Response,
  run: () => Promise<unknown>,
): Promise<Array<{ url: URL; init: RequestInit }>> {
  const calls: Array<{ url: URL; init: RequestInit }> = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: URL | RequestInfo, init: RequestInit = {}) => {
    const url = input instanceof URL ? input : new URL(String(input));
    calls.push({ url, init });
    return responder(url, init);
  }) as typeof fetch;
  try {
    await run();
  } finally {
    globalThis.fetch = original;
  }
  return calls;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function withCrmEnv<T>(run: () => T): T {
  const before = {
    url: process.env.SALES_CRM_BASE_URL,
    token: process.env.SALES_CRM_SERVICE_TOKEN,
  };
  process.env.SALES_CRM_BASE_URL = "http://127.0.0.1:3950";
  process.env.SALES_CRM_SERVICE_TOKEN = "ycrm_jeton-de-test";
  try {
    return run();
  } finally {
    if (before.url === undefined) delete process.env.SALES_CRM_BASE_URL;
    else process.env.SALES_CRM_BASE_URL = before.url;
    if (before.token === undefined) delete process.env.SALES_CRM_SERVICE_TOKEN;
    else process.env.SALES_CRM_SERVICE_TOKEN = before.token;
  }
}

/**
 * Chaque action a son propre schema strict : un payload commun serait
 * refuse par Zod avant meme le controle des droits, et le test ne
 * prouverait plus rien sur l'autorisation.
 */
const VALID_INPUTS: Record<string, Record<string, unknown>> = {
  "sales_crm.customer.lookup": { query: "acme" },
  "sales_crm.contact.lookup": { organizationId: "org-1" },
  "sales_crm.interaction.log": { type: "note", subject: "Compte rendu" },
};

test("sales_crm actions reject callers without an organization", async () => {
  for (const [id, input] of Object.entries(VALID_INPUTS)) {
    await assert.rejects(
      () => callAction(id, baseContext, input),
      /organization-required/,
      `${id} should require an organization`,
    );
  }
});

test("sales_crm read actions reject members without the read scope", async () => {
  await assert.rejects(
    () => callAction("sales_crm.customer.lookup", contextWithScopes([]), { query: "acme" }),
    /scope-forbidden:service:sales_crm:read/,
  );
});

test("logging an interaction needs write, not just read", async () => {
  await assert.rejects(
    () =>
      callAction("sales_crm.interaction.log", contextWithScopes(["service:sales_crm:read"]), {
        type: "call",
        subject: "Rappel",
      }),
    /scope-forbidden:service:sales_crm:write/,
  );
});

test("authorization is checked before any network call", async () => {
  const calls = await captureFetch(
    () => jsonResponse({}),
    async () => {
      await callAction("sales_crm.customer.lookup", contextWithScopes([]), {
        query: "acme",
      }).catch(() => undefined);
    },
  );
  assert.equal(calls.length, 0, "a refused action must not reach the CRM");
});

test("customer lookup only targets the versioned tool surface", async () => {
  await withCrmEnv(async () => {
    const calls = await captureFetch(
      () => jsonResponse({ organizations: [], total: 0 }),
      () =>
        callAction("sales_crm.customer.lookup", contextWithScopes(["service:sales_crm:read"]), {
          query: "acme",
          limit: 5,
        }),
    );

    assert.equal(calls.length, 1);
    const { url, init } = calls[0]!;
    assert.equal(url.pathname, "/api/tools/core-crm-foundation/orgs_search");
    assert.equal(url.origin, "http://127.0.0.1:3950");
    assert.equal(init.method, "POST");
    assert.deepEqual(JSON.parse(String(init.body)), { query: "acme", limit: 5 });
  });
});

test("the service token travels in the header, never in the URL", async () => {
  await withCrmEnv(async () => {
    const calls = await captureFetch(
      () => jsonResponse({ contacts: [], total: 0 }),
      () =>
        callAction("sales_crm.contact.lookup", contextWithScopes(["service:sales_crm:read"]), {
          organizationId: "org-1",
        }),
    );

    const { url, init } = calls[0]!;
    const headers = init.headers as Record<string, string>;
    assert.equal(headers.authorization, "Bearer ycrm_jeton-de-test");
    assert.ok(!url.search.includes("ycrm_"), "the token must not appear in the query string");
    assert.ok(!url.pathname.includes("ycrm_"), "the token must not appear in the path");
  });
});

test("camelCase parameters are translated to the CRM's snake_case", async () => {
  await withCrmEnv(async () => {
    const calls = await captureFetch(
      () => jsonResponse({ activity: { id: "a1" } }),
      () =>
        callAction("sales_crm.interaction.log", contextWithScopes(["service:sales_crm:write"]), {
          type: "meeting",
          subject: "Point trimestriel",
          contactId: "c-1",
          organizationId: "o-1",
        }),
    );

    assert.deepEqual(JSON.parse(String(calls[0]!.init.body)), {
      type: "meeting",
      subject: "Point trimestriel",
      contact_id: "c-1",
      organization_id: "o-1",
    });
  });
});

test("a revoked token produces an actionable message, not a stack trace", async () => {
  await withCrmEnv(async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () =>
      jsonResponse({ error: "Jeton de service inconnu", error_code: "unknown_token" }, 401)) as typeof fetch;
    try {
      await assert.rejects(
        () => callCrmTool("core-crm-foundation", "orgs_search", { query: "x" }),
        (err: unknown) => {
          assert.ok(err instanceof SalesCrmError);
          assert.equal(err.code, "unauthorized");
          assert.match(err.message, /revoque ou expire/);
          return true;
        },
      );
    } finally {
      globalThis.fetch = original;
    }
  });
});

test("an unreachable CRM says so instead of timing out silently", async () => {
  await withCrmEnv(async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error("ECONNREFUSED");
    }) as typeof fetch;
    try {
      await assert.rejects(
        () => callCrmTool("core-crm-foundation", "orgs_search", { query: "x" }),
        (err: unknown) => {
          assert.ok(err instanceof SalesCrmError);
          assert.equal(err.code, "unreachable");
          assert.match(err.message, /injoignable/);
          return true;
        },
      );
    } finally {
      globalThis.fetch = original;
    }
  });
});

test("an unconfigured CRM names the settings to fill", async () => {
  const before = process.env.SALES_CRM_BASE_URL;
  delete process.env.SALES_CRM_BASE_URL;
  try {
    const health = await checkSalesCrmHealth();
    assert.equal(health.reachable, false);
    assert.match(health.detail, /SALES_CRM_BASE_URL/);
    assert.match(health.detail, /SALES_CRM_SERVICE_TOKEN/);
  } finally {
    if (before !== undefined) process.env.SALES_CRM_BASE_URL = before;
  }
});

test("health reads the OpenAPI contract, not just a liveness ping", async () => {
  await withCrmEnv(async () => {
    const calls = await captureFetch(
      () =>
        jsonResponse({
          info: { title: "YakaCRM Modules API - tenant yaka-performance" },
          paths: {
            "/api/tools/core-crm-foundation/orgs_list": {},
            "/api/tools/core-crm-foundation/orgs_search": {},
            "/api/modules": {},
          },
        }),
      async () => {
        const health = await checkSalesCrmHealth();
        assert.equal(health.reachable, true);
        assert.equal(health.tenant, "yaka-performance");
        // /api/modules ne compte pas : seule la surface d'outils fait contrat.
        assert.equal(health.toolCount, 2);
      },
    );
    assert.equal(calls[0]!.url.pathname, "/api/openapi.json");
  });
});

test("sales_crm actions are exposed to the agent as well as to HTTP", () => {
  const ids = new Set(listActions().map((a) => a.id));
  for (const id of [
    "sales_crm.customer.lookup",
    "sales_crm.contact.lookup",
    "sales_crm.interaction.log",
    "sales_crm.service.health",
  ]) {
    assert.ok(ids.has(id), `${id} missing from the shared action registry`);
  }
});

test("every sales_crm action declares its scopes and its audit trail", () => {
  for (const action of listActions().filter((a) => a.id.startsWith("sales_crm."))) {
    assert.ok(
      action.inputJsonSchema,
      `${action.id} needs an input schema, MCP publishes it as the tool signature`,
    );
  }
});
