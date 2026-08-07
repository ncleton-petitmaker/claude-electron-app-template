/**
 * Client du CRM commercial independant.
 *
 * Bridge n'heberge pas le CRM : il l'appelle. Une seule surface est
 * autorisee, `POST /api/tools/<module>/<outil>`, qui est le contrat
 * versionne decrit par la specification OpenAPI du CRM. Les routes REST
 * historiques du CRM, plus nombreuses mais non versionnees, restent hors
 * de portee : une seule surface a securiser, documenter et faire evoluer.
 *
 * L'adresse et le jeton viennent de la configuration du service, jamais du
 * code ni de la requete. Un integrateur se coupe donc en revoquant un
 * jeton, sans redeploiement.
 *
 * Cf. modules/sales_crm/module.config.json et ULTRAPLAN-YAKA-BRIDGE-CRM.md.
 */

export interface SalesCrmSettings {
  baseUrl: string;
  serviceToken: string;
}

export class SalesCrmError extends Error {
  constructor(
    message: string,
    readonly code:
      | "not-configured"
      | "unreachable"
      | "unauthorized"
      | "forbidden"
      | "tool-not-found"
      | "invalid-input"
      | "crm-error",
    readonly status?: number,
  ) {
    super(message);
    this.name = "SalesCrmError";
  }
}

/**
 * Lit l'adresse et le jeton. Les variables d'environnement portent le
 * prefixe du service pour qu'un poste puisse heberger plusieurs services
 * Bridge sans collision.
 */
export function readSalesCrmSettings(): SalesCrmSettings | null {
  const baseUrl =
    process.env.SALES_CRM_BASE_URL ??
    process.env.NEXT_PUBLIC_SALES_CRM_SERVICE_URL ??
    "";
  const serviceToken = process.env.SALES_CRM_SERVICE_TOKEN ?? "";
  if (!baseUrl || !serviceToken) return null;
  return { baseUrl, serviceToken };
}

function requireSettings(): SalesCrmSettings {
  const settings = readSalesCrmSettings();
  if (!settings) {
    throw new SalesCrmError(
      "Le CRM n'est pas configure : renseigner SALES_CRM_BASE_URL et SALES_CRM_SERVICE_TOKEN dans la configuration du service, puis relancer le daemon.",
      "not-configured",
    );
  }
  return settings;
}

/** Delai au-dela duquel on rend la main plutot que de laisser un ecran figé. */
const TIMEOUT_MS = 15_000;

/**
 * Invoque un outil du CRM. Traduit chaque code HTTP en une erreur dont le
 * message dit quoi faire : un 401 ici veut dire « jeton revoque ou
 * expire », pas « erreur inattendue ».
 */
export async function callCrmTool<T = unknown>(
  moduleId: string,
  toolId: string,
  input: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const { baseUrl, serviceToken } = requireSettings();
  const url = new URL(`/api/tools/${moduleId}/${toolId}`, baseUrl);

  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${serviceToken}`,
      },
      body: JSON.stringify(input),
      signal: combined,
      cache: "no-store",
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new SalesCrmError(
      `Le CRM (${baseUrl}) est injoignable : ${reason}. Verifier qu'il tourne et que l'adresse du service est correcte.`,
      "unreachable",
    );
  }

  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    error_code?: string;
    [key: string]: unknown;
  };

  if (response.ok) return body as T;

  const detail = body.error ?? `HTTP ${response.status}`;
  switch (response.status) {
    case 401:
      throw new SalesCrmError(
        `Le CRM a refuse le jeton de service (${detail}). Il est probablement revoque ou expire : en emettre un nouveau cote CRM et le remettre dans la configuration du service.`,
        "unauthorized",
        401,
      );
    case 403:
      throw new SalesCrmError(
        `Le jeton de service ne porte pas les droits necessaires (${detail}). Emettre un jeton avec la portee tools:invoke.`,
        "forbidden",
        403,
      );
    case 404:
      throw new SalesCrmError(
        `L'outil ${moduleId}.${toolId} n'existe pas dans ce CRM (${detail}). Comparer avec sa specification OpenAPI : le module est peut-etre desactive pour ce tenant.`,
        "tool-not-found",
        404,
      );
    case 400:
      throw new SalesCrmError(
        `Le CRM a refuse les parametres de ${moduleId}.${toolId} : ${detail}.`,
        "invalid-input",
        400,
      );
    default:
      throw new SalesCrmError(
        `Le CRM a repondu ${response.status} sur ${moduleId}.${toolId} : ${detail}.`,
        "crm-error",
        response.status,
      );
  }
}

export interface SalesCrmHealth {
  reachable: boolean;
  status: number | null;
  serviceUrl: string | null;
  tenant: string | null;
  toolCount: number | null;
  detail: string;
  checkedAt: string;
}

/**
 * Etat de sante du CRM, lu depuis sa specification OpenAPI plutot que
 * depuis un simple /health : un service qui repond mais n'annonce plus
 * aucun outil est en panne du point de vue de Bridge, meme s'il est vivant.
 */
export async function checkSalesCrmHealth(signal?: AbortSignal): Promise<SalesCrmHealth> {
  const checkedAt = new Date().toISOString();
  const settings = readSalesCrmSettings();

  if (!settings) {
    return {
      reachable: false,
      status: null,
      serviceUrl: null,
      tenant: null,
      toolCount: null,
      detail:
        "CRM non configure : renseigner SALES_CRM_BASE_URL et SALES_CRM_SERVICE_TOKEN dans la configuration du service.",
      checkedAt,
    };
  }

  const url = new URL("/api/openapi.json", settings.baseUrl);
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  try {
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${settings.serviceToken}` },
      signal: combined,
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        reachable: false,
        status: response.status,
        serviceUrl: settings.baseUrl,
        tenant: null,
        toolCount: null,
        detail:
          response.status === 401
            ? "Le CRM repond mais refuse le jeton de service : le remplacer."
            : `Le CRM a repondu ${response.status} sur /api/openapi.json.`,
        checkedAt,
      };
    }

    const spec = (await response.json()) as {
      info?: { title?: string };
      paths?: Record<string, unknown>;
    };
    const toolPaths = Object.keys(spec.paths ?? {}).filter((p) => p.startsWith("/api/tools/"));
    // Le titre de la specification porte « ... - tenant <id> ».
    const tenant = spec.info?.title?.match(/tenant\s+(\S+)/)?.[1] ?? null;

    return {
      reachable: true,
      status: response.status,
      serviceUrl: settings.baseUrl,
      tenant,
      toolCount: toolPaths.length,
      detail: `Le CRM repond et annonce ${toolPaths.length} outils.`,
      checkedAt,
    };
  } catch (err) {
    return {
      reachable: false,
      status: null,
      serviceUrl: settings.baseUrl,
      tenant: null,
      toolCount: null,
      detail: `Le CRM est injoignable : ${err instanceof Error ? err.message : String(err)}`,
      checkedAt,
    };
  }
}
