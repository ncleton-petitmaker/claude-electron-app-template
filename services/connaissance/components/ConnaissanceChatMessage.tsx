"use client";

import { useMemo, useState } from "react";

export type KnowledgeChatRole = "user" | "agent" | "system";

export interface KnowledgeChatCitation {
  id: string;
  documentName: string;
  similarityScore?: number;
  verificationUrl?: string;
  chunkContent?: string;
  groupId?: string;
  knowledgeId?: string;
  contributorName?: string;
  createdAt?: string;
  groupTitle?: string;
}

export interface KnowledgeWebSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface KnowledgeChartVariant {
  type: "bar" | "horizontalBar" | "stackedBar" | "line" | "area" | "pie" | "doughnut" | "scatter" | "radar";
  displayName?: string;
  url: string;
  dataPoints?: number;
}

export interface KnowledgeStructuredData {
  type: "sql" | "chart";
  sqlQuery?: string;
  tableName?: string;
  columns?: string[];
  rows?: Array<Array<string | number | boolean | null>>;
  chartUrl?: string;
  chartType?: "bar" | "line" | "pie" | "doughnut";
  chartVariants?: KnowledgeChartVariant[];
  responseTimeMs?: number;
}

export interface KnowledgeChatMessage {
  id: string;
  role: KnowledgeChatRole;
  content: string;
  timestamp: Date;
  citations?: KnowledgeChatCitation[];
  webSources?: KnowledgeWebSource[];
  performanceMs?: number;
  structuredData?: KnowledgeStructuredData;
  isStreaming?: boolean;
}

interface ConnaissanceChatMessageProps {
  message: KnowledgeChatMessage;
  isStreaming?: boolean;
  agentName?: string;
  userName?: string;
  onCitationClick?: (citation: KnowledgeChatCitation) => void;
  onWebSourceClick?: (source: KnowledgeWebSource) => void;
}

const chartDisplayNames: Record<string, string> = {
  bar: "Barres",
  horizontalBar: "Barres horiz.",
  stackedBar: "Barres empilées",
  line: "Courbe",
  area: "Aire",
  pie: "Camembert",
  doughnut: "Anneau",
  scatter: "Nuage pts",
  radar: "Radar",
};

export function ChatMessage({
  message,
  isStreaming = false,
  agentName = "Connaissance.pro",
  userName = "Vous",
  onCitationClick,
  onWebSourceClick,
}: ConnaissanceChatMessageProps) {
  const isUser = message.role === "user";

  const citationsMap = useMemo(() => {
    const map = new Map<number, KnowledgeChatCitation>();
    message.citations?.forEach((citation, index) => map.set(index + 1, citation));
    return map;
  }, [message.citations]);

  const webSourcesMap = useMemo(() => {
    const map = new Map<string, KnowledgeWebSource>();
    message.webSources?.forEach((source) => {
      if (source.title) map.set(source.title.toLowerCase(), source);
      const domain = getDomain(source.url);
      if (domain) {
        map.set(domain.toLowerCase(), source);
        map.set(domain.split(".")[0]?.toLowerCase() ?? domain.toLowerCase(), source);
      }
    });
    return map;
  }, [message.webSources]);

  if (message.role === "system") {
    return <SystemMessage content={message.content} />;
  }

  return (
    <article className={`knowledge-v2-chat-message ${isUser ? "user" : "agent"}`}>
      <div className="knowledge-v2-chat-avatar" aria-hidden="true">
        {isUser ? initials(userName) : "C"}
      </div>

      <div className="knowledge-v2-chat-content">
        <span className="knowledge-v2-chat-sender">{isUser ? userName : agentName}</span>
        <div className="knowledge-v2-chat-bubble">
          <MessageContent
            content={message.content}
            isUser={isUser}
            citationsMap={citationsMap}
            webSourcesMap={webSourcesMap}
            onCitationClick={onCitationClick}
          />
          {(isStreaming || message.isStreaming) && !isUser && <InlineTyping />}
        </div>

        {message.structuredData ? <StructuredDataView data={message.structuredData} /> : null}

        {message.citations?.length ? (
          <section className="knowledge-v2-chat-sources" aria-label={`Sources (${message.citations.length})`}>
            <div className="knowledge-v2-chat-sources-title">
              <DocumentIcon />
              <span>Sources ({message.citations.length})</span>
            </div>
            <div className="knowledge-v2-chat-source-stack">
              {message.citations.map((citation, index) => (
                <SourceCard
                  key={citation.id || `${citation.documentName}-${index}`}
                  citation={citation}
                  index={index + 1}
                  onClick={() => onCitationClick?.(citation)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {message.webSources?.length ? (
          <div className="knowledge-v2-web-sources">
            {message.webSources.map((source, index) => (
              <WebSourceBadge key={`${source.url}-${index}`} source={source} onClick={() => onWebSourceClick?.(source)} />
            ))}
          </div>
        ) : null}

        <div className="knowledge-v2-chat-meta">
          <span>{formatRelativeTime(message.timestamp)}</span>
          {message.performanceMs && !isUser ? <span>{message.performanceMs}ms</span> : null}
        </div>
      </div>
    </article>
  );
}

export const ConnaissanceChatMessage = ChatMessage;

function MessageContent({
  content,
  isUser,
  citationsMap,
  webSourcesMap,
  onCitationClick,
}: {
  content: string;
  isUser: boolean;
  citationsMap: Map<number, KnowledgeChatCitation>;
  webSourcesMap: Map<string, KnowledgeWebSource>;
  onCitationClick?: (citation: KnowledgeChatCitation) => void;
}) {
  const cleaned = cleanRagResponse(content);
  const codeParts = cleaned.split(/(```[\s\S]*?```|`[^`]+`)/g);

  return (
    <div className="knowledge-v2-message-markdown">
      {codeParts.map((part, index) => {
        if (part.startsWith("```")) {
          const code = part.replace(/```\w*\n?/g, "").replace(/```$/, "");
          return (
            <pre key={index} className="knowledge-v2-code-block">
              <code>{code}</code>
            </pre>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={index} className="knowledge-v2-inline-code">
              {part.slice(1, -1)}
            </code>
          );
        }
        return (
          <span key={index}>
            {parseInline(part, `${index}`, isUser, citationsMap, webSourcesMap, onCitationClick)}
          </span>
        );
      })}
    </div>
  );
}

function parseInline(
  text: string,
  keyPrefix: string,
  isUser: boolean,
  citationsMap: Map<number, KnowledgeChatCitation>,
  webSourcesMap: Map<string, KnowledgeWebSource>,
  onCitationClick?: (citation: KnowledgeChatCitation) => void,
) {
  const segments = parseSlackLinks(text, keyPrefix, isUser);
  return segments.map((segment, segmentIndex) => {
    if (typeof segment !== "string") return segment;

    const citationSegments = parseCitations(segment, `${keyPrefix}-${segmentIndex}`, isUser, citationsMap, onCitationClick);
    return citationSegments.map((citationSegment, citationIndex) => {
      if (typeof citationSegment !== "string") return citationSegment;

      const webSegments = parseWebSourceLinks(citationSegment, `${keyPrefix}-${segmentIndex}-${citationIndex}`, isUser, webSourcesMap);
      return webSegments.map((webSegment, webIndex) => {
        if (typeof webSegment !== "string") return webSegment;
        return parseBold(webSegment, `${keyPrefix}-${segmentIndex}-${citationIndex}-${webIndex}`);
      });
    });
  });
}

function parseSlackLinks(text: string, keyPrefix: string, isUser: boolean) {
  const result: Array<string | JSX.Element> = [];
  const regex = /<(https?:\/\/[^>]+?)(?:\|([^>]+))?>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let linkIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) result.push(text.slice(lastIndex, match.index));
    let url = match[1];
    let label = match[2];
    if (url.includes("|")) {
      const pipeIndex = url.indexOf("|");
      label = url.slice(pipeIndex + 1);
      url = url.slice(0, pipeIndex);
    }
    result.push(
      <a
        key={`${keyPrefix}-link-${linkIndex++}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`knowledge-v2-inline-link ${isUser ? "user" : ""}`}
      >
        <LinkIconSmall />
        <span>{label || shortUrl(url)}</span>
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) result.push(text.slice(lastIndex));
  return result.length ? result : [text];
}

function parseCitations(
  text: string,
  keyPrefix: string,
  isUser: boolean,
  citationsMap: Map<number, KnowledgeChatCitation>,
  onCitationClick?: (citation: KnowledgeChatCitation) => void,
) {
  const result: Array<string | JSX.Element> = [];
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) result.push(text.slice(lastIndex, match.index));
    const citationIndex = Number.parseInt(match[1], 10);
    const citation = citationsMap.get(citationIndex);
    if (!citation) {
      result.push(match[0]);
    } else {
      result.push(
        <a
          key={`${keyPrefix}-citation-${index++}`}
          href={citation.verificationUrl || "#"}
          onClick={(event) => {
            event.preventDefault();
            onCitationClick?.(citation);
          }}
          className={`knowledge-v2-inline-citation ${isUser ? "user" : ""}`}
          title={citation.documentName}
        >
          {citationIndex}
        </a>,
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) result.push(text.slice(lastIndex));
  return result.length ? result : [text];
}

function parseWebSourceLinks(
  text: string,
  keyPrefix: string,
  isUser: boolean,
  webSourcesMap: Map<string, KnowledgeWebSource>,
) {
  const result: Array<string | JSX.Element> = [];
  const regex = /([🔗⮡]\s*)([A-Za-zÀ-ÿ][\w\-À-ÿ]*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) result.push(text.slice(lastIndex, match.index));
    const symbol = match[1];
    const sourceName = match[2];
    const source = webSourcesMap.get(sourceName.toLowerCase());
    if (!source) {
      result.push(match[0]);
    } else {
      result.push(
        <a
          key={`${keyPrefix}-web-${index++}`}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`knowledge-v2-inline-web-source ${isUser ? "user" : ""}`}
        >
          <span>{symbol}</span>
          <span>{sourceName}</span>
        </a>,
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) result.push(text.slice(lastIndex));
  return result.length ? result : [text];
}

function parseBold(text: string, keyPrefix: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-bold-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return <span key={`${keyPrefix}-text-${index}`}>{part}</span>;
  });
}

export function StructuredDataView({ data }: { data: KnowledgeStructuredData }) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const variants = data.chartVariants ?? [];
  const currentVariant = variants[selectedVariantIndex];
  const currentChartUrl = currentVariant?.url || data.chartUrl;
  const rowCount = data.rows?.length ?? 0;
  const colCount = data.columns?.length ?? 0;
  const isSingleValue = rowCount === 1 && colCount === 1 && data.rows?.[0]?.[0] !== null;
  const singleValue = isSingleValue ? data.rows?.[0]?.[0] : null;
  const singleValueColumn = isSingleValue ? data.columns?.[0] : null;

  if (!currentChartUrl && !rowCount) return null;

  return (
    <section className="knowledge-v2-structured-data">
      <header>
        <div className="knowledge-v2-structured-icon">
          <AnalyticsTinyIcon />
        </div>
        <div>
          <h3>{data.tableName || "Données structurées"}</h3>
          {rowCount ? <p>{rowCount} lignes · {colCount} colonnes</p> : null}
        </div>
        {data.responseTimeMs ? <span>{data.responseTimeMs}ms</span> : null}
      </header>

      {isSingleValue && !currentChartUrl ? (
        <div className="knowledge-v2-kpi">
          <span>{singleValueColumn?.replace(/_/g, " ") || "Résultat"}</span>
          <strong>{formatNumber(singleValue)}</strong>
        </div>
      ) : null}

      {currentChartUrl ? (
        <div className="knowledge-v2-chart-preview">
          <button type="button" onClick={() => setIsFullscreen(true)} aria-label="Afficher le graphique en plein écran">
            <img src={currentChartUrl} alt={data.tableName || "Graphique"} />
          </button>
          {variants.length > 1 ? (
            <div className="knowledge-v2-chart-selector">
              {variants.map((variant, index) => (
                <button
                  key={`${variant.type}-${index}`}
                  type="button"
                  className={selectedVariantIndex === index ? "active" : ""}
                  onClick={() => setSelectedVariantIndex(index)}
                >
                  <AnalyticsTinyIcon />
                  <span>{chartDisplayNames[variant.type] || variant.displayName || variant.type}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {data.rows?.length && data.columns?.length ? (
        <div className="knowledge-v2-data-table">
          <table>
            <thead>
              <tr>
                {data.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.slice(0, 10).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`}>{cell === null ? "-" : String(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.rows.length > 10 ? <p>Affichage de 10 lignes sur {data.rows.length}</p> : null}
        </div>
      ) : null}

      {data.sqlQuery ? (
        <details className="knowledge-v2-sql-details">
          <summary>Voir la requête SQL</summary>
          <pre>{data.sqlQuery}</pre>
        </details>
      ) : null}

      {isFullscreen && currentChartUrl ? (
        <div className="knowledge-v2-chart-fullscreen" role="dialog" aria-modal="true" onClick={() => setIsFullscreen(false)}>
          <button type="button" aria-label="Fermer le graphique" onClick={() => setIsFullscreen(false)}>
            <CloseIconSmall />
          </button>
          <img src={currentChartUrl} alt={data.tableName || "Graphique"} onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
    </section>
  );
}

function SourceCard({ citation, index, onClick }: { citation: KnowledgeChatCitation; index: number; onClick: () => void }) {
  const hasUrl = Boolean(citation.verificationUrl);
  const content = (
    <>
      <div className="knowledge-v2-source-index">{index}</div>
      <div className="knowledge-v2-source-content">
        <p>{citation.documentName}</p>
        <div>
          {citation.contributorName ? <span>{citation.contributorName}</span> : null}
          {citation.createdAt ? <span>{formatDate(citation.createdAt)}</span> : null}
          {citation.similarityScore ? <span>{Math.round(citation.similarityScore * 100)}%</span> : null}
        </div>
      </div>
      {hasUrl ? <ExternalIcon /> : null}
    </>
  );

  if (!hasUrl) {
    return (
      <button type="button" className="knowledge-v2-source-card" onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <a
      href={citation.verificationUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="knowledge-v2-source-card"
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      {content}
    </a>
  );
}

function WebSourceBadge({ source, onClick }: { source: KnowledgeWebSource; onClick: () => void }) {
  const domain = getDomain(source.url);
  const label = source.title && !/^Source \d+$/i.test(source.title) ? source.title : domain;

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="knowledge-v2-web-source-badge"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <span className="knowledge-v2-web-source-favicon">{domain.slice(0, 1).toUpperCase()}</span>
      <span>{label}</span>
      <ExternalIcon />
    </a>
  );
}

function SystemMessage({ content }: { content: string }) {
  return (
    <div className="knowledge-v2-system-message">
      <span>{content}</span>
    </div>
  );
}

function InlineTyping() {
  return (
    <span className="knowledge-v2-inline-typing" aria-label="Réponse en cours">
      <span />
      <span />
      <span />
    </span>
  );
}

function cleanRagResponse(text: string) {
  return text
    .replace(/(:books:|📚)\s*Sources vérifiées[^]*?(?=\n\n💡|\n\n🔗|$)/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function shortUrl(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname === "/" ? "" : `${parsed.pathname.slice(0, 20)}...`}`;
  } catch {
    return `${url.slice(0, 30)}...`;
  }
}

function formatRelativeTime(value: Date) {
  const date = value instanceof Date ? value : new Date(value);
  const deltaSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (deltaSeconds < 60) return "maintenant";
  const deltaMinutes = Math.round(deltaSeconds / 60);
  if (deltaMinutes < 60) return `il y a ${deltaMinutes} min`;
  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) return `il y a ${deltaHours} h`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return value;
  }
}

function formatNumber(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return "-";
  const numberValue = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (Number.isNaN(numberValue)) return String(value);
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(numberValue);
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.6L19 9.4V19a2 2 0 0 1-2 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIconSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AnalyticsTinyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 17v-5M12 17V7M16 17v-8M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIconSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
