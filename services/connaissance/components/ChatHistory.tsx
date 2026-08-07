"use client";

import { useMemo, useState } from "react";

export type ChatHistoryMode = "rag" | "llm";

export interface ChatHistoryConversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessage?: string;
  isArchived: boolean;
  mode: ChatHistoryMode;
  contextTitle?: string | null;
}

interface ChatHistoryProps {
  conversations: ChatHistoryConversation[];
  selectedConversationId?: string;
  isLoading?: boolean;
  onSelectConversation: (conversation: ChatHistoryConversation) => void;
  onNewConversation: () => void;
  onArchiveConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
}

export function ChatHistory({
  conversations,
  selectedConversationId,
  isLoading = false,
  onSelectConversation,
  onNewConversation,
  onArchiveConversation,
  onDeleteConversation,
}: ChatHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return conversations.filter((conversation) => {
      if (!showArchived && conversation.isArchived) return false;
      if (!query) return true;
      return (
        conversation.title.toLowerCase().includes(query) ||
        conversation.lastMessage?.toLowerCase().includes(query) ||
        conversation.contextTitle?.toLowerCase().includes(query)
      );
    });
  }, [conversations, searchQuery, showArchived]);

  const groupedConversations = useMemo(() => groupByDate(filteredConversations), [filteredConversations]);

  return (
    <div className="knowledge-v2-history">
      <div className="knowledge-v2-history-header">
        <div className="knowledge-v2-history-title-row">
          <h2>Historique</h2>
          <button type="button" onClick={onNewConversation} className="knowledge-v2-history-new">
            <PlusIcon />
            <span>Nouveau</span>
          </button>
        </div>

        <label className="knowledge-v2-history-search">
          <SearchIcon />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Rechercher..."
            aria-label="Rechercher dans l'historique"
          />
        </label>
      </div>

      <div className="knowledge-v2-history-scroll">
        {isLoading ? (
          <LoadingState />
        ) : filteredConversations.length === 0 ? (
          <EmptyState hasSearch={Boolean(searchQuery)} />
        ) : (
          <div className="knowledge-v2-history-groups">
            {Object.entries(groupedConversations).map(([date, items]) => (
              <section key={date} className="knowledge-v2-history-group">
                <div className="knowledge-v2-history-date">{date}</div>
                {items.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={conversation.id === selectedConversationId}
                    onClick={() => onSelectConversation(conversation)}
                    onArchive={onArchiveConversation ? () => onArchiveConversation(conversation.id) : undefined}
                    onDelete={onDeleteConversation ? () => onDeleteConversation(conversation.id) : undefined}
                  />
                ))}
              </section>
            ))}
          </div>
        )}
      </div>

      {conversations.some((conversation) => conversation.isArchived) ? (
        <div className="knowledge-v2-history-footer">
          <button type="button" onClick={() => setShowArchived((value) => !value)}>
            <ArchiveIcon />
            <span>{showArchived ? "Masquer archivées" : "Voir archivées"}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ConversationItem({
  conversation,
  isSelected,
  onClick,
  onArchive,
  onDelete,
}: {
  conversation: ChatHistoryConversation;
  isSelected: boolean;
  onClick: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const ModeIcon = conversation.mode === "rag" ? DatabaseIcon : BrainIcon;

  return (
    <button
      type="button"
      className={`knowledge-v2-history-item ${isSelected ? "selected" : ""} ${conversation.isArchived ? "archived" : ""}`}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <span className={`knowledge-v2-history-mode ${conversation.mode}`}>
        <ModeIcon />
      </span>
      <span className="knowledge-v2-history-item-content">
        <span className="knowledge-v2-history-item-title">
          <strong>{conversation.title}</strong>
          {conversation.isArchived ? <em>Archivée</em> : null}
        </span>
        {conversation.lastMessage ? <span className="knowledge-v2-history-last">{conversation.lastMessage}</span> : null}
        <span className="knowledge-v2-history-meta">
          <span>{formatRelativeTime(conversation.updatedAt)}</span>
          <span>{conversation.messageCount} messages</span>
        </span>
      </span>
      {showActions && (onArchive || onDelete) ? (
        <span className="knowledge-v2-history-actions">
          {onArchive ? (
            <button
              type="button"
              aria-label={conversation.isArchived ? "Désarchiver" : "Archiver"}
              onClick={(event) => {
                event.stopPropagation();
                onArchive();
              }}
            >
              <ArchiveIcon />
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              aria-label="Supprimer"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
            >
              <TrashIcon />
            </button>
          ) : null}
        </span>
      ) : null}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="knowledge-v2-history-loading" aria-label="Chargement de l'historique">
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item}>
          <span />
          <div>
            <span />
            <span />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="knowledge-v2-history-empty">
      <div>
        <ChatIcon />
      </div>
      <h3>{hasSearch ? "Aucun résultat" : "Pas de conversations"}</h3>
      <p>{hasSearch ? "Essayez avec d'autres termes de recherche" : "Commencez une nouvelle conversation"}</p>
    </div>
  );
}

function groupByDate(conversations: ChatHistoryConversation[]) {
  const groups: Record<string, ChatHistoryConversation[]> = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  for (const conversation of conversations) {
    const date = conversation.updatedAt;
    let group = "Plus ancien";
    if (isSameDay(date, today)) group = "Aujourd'hui";
    else if (isSameDay(date, yesterday)) group = "Hier";
    else if (date > lastWeek) group = "Cette semaine";
    else if (date > lastMonth) group = "Ce mois";
    if (!groups[group]) groups[group] = [];
    groups[group].push(conversation);
  }
  return groups;
}

function isSameDay(dateA: Date, dateB: Date) {
  return dateA.getDate() === dateB.getDate() && dateA.getMonth() === dateB.getMonth() && dateA.getFullYear() === dateB.getFullYear();
}

function formatRelativeTime(value: Date) {
  const deltaSeconds = Math.max(0, Math.round((Date.now() - value.getTime()) / 1000));
  if (deltaSeconds < 60) return "maintenant";
  const minutes = Math.round(deltaSeconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return value.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.4-4 8-9 8a9.9 9.9 0 0 1-4.3-.95L3 20l1.4-3.72A7.3 7.3 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 8h14M5 8a2 2 0 1 1 0-4h14a2 2 0 1 1 0 4M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8m-9 4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m19 7-.87 12.14A2 2 0 0 1 16.14 21H7.86a2 2 0 0 1-2-1.86L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7v10c0 2.2 3.6 4 8 4s8-1.8 8-4V7M4 7c0 2.2 3.6 4 8 4s8-1.8 8-4M4 7c0-2.2 3.6-4 8-4s8 1.8 8 4m0 5c0 2.2-3.6 4-8 4s-8-1.8-8-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9.66 17h4.68M12 3v1m6.36 1.64-.7.7M21 12h-1M4 12H3m3.34-5.66-.7-.7m2.82 9.9a5 5 0 1 1 7.08 0l-.55.55A3.37 3.37 0 0 0 14 18.47V19a2 2 0 1 1-4 0v-.53c0-.9-.36-1.75-.99-2.39l-.55-.54Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
