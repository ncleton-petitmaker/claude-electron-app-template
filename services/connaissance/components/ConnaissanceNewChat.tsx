"use client";

import { useEffect, useRef, useState } from "react";
import { callBridgeAction } from "@/lib/bridge-actions";
import {
  ShortcutsBar,
  ShortcutsManagerModal,
  SlashCommandMenu,
  type ConnaissanceShortcut,
} from "@/components/ConnaissanceShortcuts";
import { ChatHistory, type ChatHistoryConversation } from "@/components/ChatHistory";
import {
  ConnaissanceChatMessage,
  type KnowledgeChatCitation,
  type KnowledgeChatMessage,
  type KnowledgeStructuredData,
  type KnowledgeWebSource,
} from "@/components/ConnaissanceChatMessage";

type ChatMode = "rag" | "llm";
type LocalModel = "bridge-codex" | "lmstudio-local" | "dgx-spark-lan";

interface ConnaissanceNewChatProps {
  initialSettingsOpen?: boolean;
}

type ChatMessage = KnowledgeChatMessage;

type ChatShortcut = ConnaissanceShortcut;

const shortcuts: ChatShortcut[] = [
  {
    id: "translate",
    name: "Traduire",
    prompt: "Traduis ce texte en anglais : ",
    icon: "translate",
    mode: "llm",
    usageCount: 0,
    isDefault: true,
  },
  {
    id: "brainstorm",
    name: "Brainstorm",
    prompt: "Aide-moi à brainstormer sur le sujet suivant : ",
    icon: "brain",
    mode: "llm",
    usageCount: 0,
    isDefault: true,
  },
  {
    id: "linkedin",
    name: "Post LinkedIn",
    prompt: "Rédige un post LinkedIn professionnel sur : ",
    icon: "linkedin",
    mode: "llm",
    usageCount: 0,
    isDefault: true,
  },
  {
    id: "summary",
    name: "Fiche de synthèse",
    prompt: "Crée une fiche de synthèse structurée sur : ",
    icon: "document",
    mode: "llm",
    usageCount: 0,
    isDefault: true,
  },
];

const initialConversations: ChatHistoryConversation[] = [];

const fileTypes = [
  { name: "Documents", count: 126, size: "193MB", color: "blue", icon: "document" },
  { name: "Photos", count: 53, size: "321MB", color: "purple", icon: "image" },
  { name: "Vidéos", count: 3, size: "210MB", color: "pink", icon: "video" },
  { name: "Autres", count: 49, size: "194MB", color: "orange", icon: "file" },
];

export function ConnaissanceNewChat({ initialSettingsOpen = false }: ConnaissanceNewChatProps) {
  const [isChatListOpen, setIsChatListOpen] = useState(true);
  const [isDetailOpen, setIsDetailOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(initialSettingsOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>("rag");
  const [model, setModel] = useState<LocalModel>("lmstudio-local");
  const [useReasoning, setUseReasoning] = useState(false);
  const [contextLabel, setContextLabel] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined);
  const [conversationItems, setConversationItems] = useState<ChatHistoryConversation[]>(initialConversations);
  const [shortcutItems, setShortcutItems] = useState<ChatShortcut[]>(shortcuts);
  const [isShortcutManagerOpen, setIsShortcutManagerOpen] = useState(false);

  async function runAction(id: string, input: Record<string, unknown> = {}) {
    const result = await callBridgeAction(id, input);
    if (!result.ok) setLastError(result.error ?? "Action Bridge indisponible.");
    return result;
  }

  function providerForRuntime(value: LocalModel) {
    if (value === "bridge-codex") return "bridge_codex";
    if (value === "dgx-spark-lan") return "dgx_spark_lan";
    return "lmstudio_local";
  }

  async function handleSend(content: string) {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((current) => [...current, userMessage]);
    setIsLoading(true);
    setLastError(null);

    const result = await runAction("knowledge_ai.chat.stream", {
      message: content,
      provider: providerForRuntime(model),
      options: {
        model,
        useReasoning,
      },
    });

    setMessages((current) => [...current, buildAgentMessage(result.output)]);
    setIsLoading(false);
  }

  function handleShortcut(shortcut: ChatShortcut) {
    setLastError(null);
    void runAction("knowledge_ai.shortcut.track_usage", { resourceId: shortcut.id, payload: { shortcutId: shortcut.id } });
    void handleSend(shortcut.prompt);
  }

  function createShortcut(shortcut: Omit<ChatShortcut, "id">) {
    const next = { ...shortcut, id: `shortcut-${Date.now()}`, usageCount: 0 };
    setShortcutItems((current) => [...current, next]);
    void runAction("knowledge_ai.shortcut.create", { resourceId: next.id, payload: next });
  }

  function updateShortcuts(next: ChatShortcut[]) {
    setShortcutItems(next);
    void runAction("knowledge_ai.shortcut.reorder", { payload: { orderedIds: next.map((shortcut) => shortcut.id), shortcuts: next } });
  }

  function saveShortcut(shortcut: ChatShortcut, next: ChatShortcut[]) {
    setShortcutItems(next);
    void runAction("knowledge_ai.shortcut.update", { resourceId: shortcut.id, payload: shortcut });
  }

  function deleteShortcut(id: string) {
    setShortcutItems((current) => current.filter((shortcut) => shortcut.id !== id));
    void runAction("knowledge_ai.shortcut.delete", { resourceId: id, payload: { id } });
  }

  function selectConversation(conversation: ChatHistoryConversation) {
    setSelectedConversationId(conversation.id);
    setContextLabel(conversation.title);
    setMode(conversation.mode);
    setMessages([
      {
        id: `agent-conversation-${conversation.id}`,
        role: "agent",
        content: conversation.lastMessage ?? "Conversation chargée.",
        timestamp: new Date(),
      },
    ]);
    setLastError(null);
    void runAction("knowledge_ai.conversation.load", { resourceId: conversation.id });
  }

  function createConversation() {
    const next: ChatHistoryConversation = {
      id: `conversation-${Date.now()}`,
      title: "Nouvelle conversation",
      lastMessage: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
      isArchived: false,
      mode,
    };
    setConversationItems((current) => [next, ...current]);
    setSelectedConversationId(next.id);
    setMessages([]);
    setLastError(null);
    void runAction("knowledge_ai.conversation.clear", { resourceId: next.id });
  }

  function archiveConversation(id: string) {
    setConversationItems((current) =>
      current.map((conversation) => (conversation.id === id ? { ...conversation, isArchived: !conversation.isArchived } : conversation)),
    );
    void runAction("knowledge_ai.conversation.archive", { resourceId: id });
  }

  function deleteConversation(id: string) {
    setConversationItems((current) => current.filter((conversation) => conversation.id !== id));
    if (selectedConversationId === id) {
      setSelectedConversationId(undefined);
      setMessages([]);
    }
    void runAction("knowledge_ai.conversation.delete", { resourceId: id });
  }

  return (
    <div className="knowledge-source-app">
      <aside className="knowledge-source-sidebar">
        <div className="knowledge-source-logo">
          <span>C</span>
          <strong>Connaissance</strong>
        </div>

        <div className="knowledge-source-mode-switch" role="group" aria-label="Mode">
          <button className="active" type="button">
            <ChatIcon className="icon-4" />
            <span>Chat</span>
          </button>
          <a href="/dashboard">
            <DatabaseIcon />
            <span>Admin</span>
          </a>
        </div>

        <nav className="knowledge-source-nav" aria-label="Navigation principale">
          <a className="active" href="/chat">
            <ChatIcon />
            <span>Chat</span>
          </a>
          <a href="/upload">
            <PlusIcon />
            <span>Ajouter</span>
          </a>
          <a href="/dashboard">
            <RefreshIcon />
            <span>Connaissances</span>
          </a>
        </nav>

        <section className="knowledge-source-history" aria-label="Historique">
          <div className="knowledge-source-history-head">
            <span>Historique</span>
            <button type="button" onClick={createConversation} aria-label="Nouvelle conversation">
              <EditIcon />
            </button>
          </div>
          {conversationItems.length === 0 ? (
            <div className="knowledge-source-history-empty">
              <ChatStackIcon />
              <strong>Pas encore de conversations</strong>
              <p>Posez une question pour commencer</p>
            </div>
          ) : (
            <ChatHistory
              conversations={conversationItems}
              selectedConversationId={selectedConversationId}
              onSelectConversation={selectConversation}
              onNewConversation={createConversation}
              onArchiveConversation={archiveConversation}
              onDeleteConversation={deleteConversation}
            />
          )}
        </section>

        <button className="knowledge-source-profile" type="button" onClick={() => setIsSettingsOpen(true)}>
          <span>NC</span>
          <div>
            <strong>Nicolas Cleton</strong>
            <small>demo@example.test</small>
          </div>
          <ChevronRightIcon />
        </button>
      </aside>

      <main className="knowledge-source-main">
        <header className="knowledge-source-topbar">
          <button className="active" type="button" onClick={() => setMode("rag")}>
            <span>C</span>
            Connaissance Pro
          </button>
          <button type="button" onClick={() => setMode("llm")}>
            <SparkleIcon />
            Autres modèles
            <ChevronDownIcon />
          </button>
        </header>

        <div className="knowledge-source-chat-stage">
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            mode={mode}
            model={model}
            useReasoning={useReasoning}
            contextLabel={contextLabel}
            lastError={lastError}
            onClearContext={() => {
              setContextLabel("");
              void runAction("knowledge_ai.conversation.context.set", { payload: { contextLabel: null } });
            }}
            onModeChange={(nextMode) => {
              setMode(nextMode);
              void runAction("knowledge_ai.conversation.options.set", { payload: { mode: nextMode } });
            }}
            onModelChange={(nextModel) => {
              setModel(nextModel);
              void runAction("knowledge_ai.conversation.options.set", { payload: { provider: providerForRuntime(nextModel) } });
            }}
            onToggleReasoning={() => {
              setUseReasoning((value) => {
                const nextValue = !value;
                void runAction("knowledge_ai.conversation.options.set", { payload: { useReasoning: nextValue } });
                return nextValue;
              });
            }}
            onSend={handleSend}
            onAttachFile={() => runAction("knowledge_ai.upload.file")}
            onVoiceInput={() => runAction("knowledge_ai.speech.toggle")}
            onSelectShortcut={handleShortcut}
            shortcuts={shortcutItems}
            onEditShortcuts={() => setIsShortcutManagerOpen(true)}
          />
        </div>
      </main>

      {isSettingsOpen && (
        <div className="knowledge-v2-modal" role="dialog" aria-modal="true" aria-label="Paramètres">
          <div className="knowledge-v2-modal-panel">
            <div className="knowledge-v2-modal-head">
              <h2>Paramètres</h2>
              <button className="nav-icon-btn nav-icon-btn-small" onClick={() => setIsSettingsOpen(false)} aria-label="Fermer">
                <CloseIcon className="icon-4" />
              </button>
            </div>
            <div className="knowledge-v2-modal-grid">
              <button onClick={() => setLastError(null)}>Modèles locaux</button>
              <button onClick={() => setLastError(null)}>Projets</button>
              <button onClick={() => setLastError(null)}>Agents</button>
              <button onClick={() => setLastError(null)}>Bridge OAuth</button>
            </div>
          </div>
        </div>
      )}

      <ShortcutsManagerModal
        isOpen={isShortcutManagerOpen}
        shortcuts={shortcutItems}
        onClose={() => setIsShortcutManagerOpen(false)}
        onUpdateShortcuts={updateShortcuts}
        onSaveShortcut={saveShortcut}
        onCreateShortcut={createShortcut}
        onDeleteShortcut={deleteShortcut}
      />
    </div>
  );
}

function ChatPanel({
  messages,
  isLoading,
  mode,
  model,
  useReasoning,
  contextLabel,
  lastError,
  onClearContext,
  onModeChange,
  onModelChange,
  onToggleReasoning,
  onSend,
  onAttachFile,
  onVoiceInput,
  onSelectShortcut,
  shortcuts,
  onEditShortcuts,
}: {
  messages: ChatMessage[];
  isLoading: boolean;
  mode: ChatMode;
  model: LocalModel;
  useReasoning: boolean;
  contextLabel: string;
  lastError: string | null;
  onClearContext: () => void;
  onModeChange: (mode: ChatMode) => void;
  onModelChange: (model: LocalModel) => void;
  onToggleReasoning: () => void;
  onSend: (message: string) => void;
  onAttachFile: () => void;
  onVoiceInput: () => void;
  onSelectShortcut: (shortcut: ChatShortcut) => void;
  shortcuts: ChatShortcut[];
  onEditShortcuts: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const showEmptyState = messages.length === 0 && !isLoading;

  return (
    <div className="knowledge-v2-chat-panel">
      <div className="knowledge-v2-messages">
        <div className="knowledge-v2-message-inner">
          {showEmptyState ? (
            <EmptyState shortcuts={shortcuts} onSelectShortcut={onSelectShortcut} />
          ) : (
            <div className="knowledge-v2-message-stack">
              {messages.map((message) => (
                <ConnaissanceChatMessage
                  key={message.id}
                  message={message}
                  onCitationClick={(citation) => {
                    void callBridgeAction("knowledge_ai.citation.open", { resourceId: citation.id, payload: citation });
                    if (citation.verificationUrl) window.open(citation.verificationUrl, "_blank", "noopener,noreferrer");
                  }}
                  onWebSourceClick={(source) => {
                    void callBridgeAction("knowledge_ai.web_source.open", { resourceId: source.url, payload: source });
                  }}
                />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={endRef} />
            </div>
          )}
        </div>
      </div>

      {lastError && <div className="knowledge-v2-error">{lastError}</div>}

      <ChatInput
        mode={mode}
        model={model}
        useReasoning={useReasoning}
        contextLabel={contextLabel}
        onClearContext={onClearContext}
        onModeChange={onModeChange}
        onModelChange={onModelChange}
        onToggleReasoning={onToggleReasoning}
        onSend={onSend}
        onAttachFile={onAttachFile}
        onVoiceInput={onVoiceInput}
        onSelectShortcut={onSelectShortcut}
        shortcuts={shortcuts}
        onEditShortcuts={onEditShortcuts}
      />
    </div>
  );
}

function EmptyState({ shortcuts, onSelectShortcut }: { shortcuts: ChatShortcut[]; onSelectShortcut: (shortcut: ChatShortcut) => void }) {
  return (
    <div className="knowledge-v2-empty">
      <div className="knowledge-source-empty-logo">
        <span>C</span>
      </div>
      <p className="knowledge-source-empty-quote">« Répond avec vos données »</p>
      <p className="knowledge-source-empty-word">F I A B I L I T É</p>
    </div>
  );
}

function ChatInput({
  mode,
  model,
  useReasoning,
  contextLabel,
  onClearContext,
  onModeChange,
  onModelChange,
  onToggleReasoning,
  onSend,
  onAttachFile,
  onVoiceInput,
  onSelectShortcut,
  shortcuts,
  onEditShortcuts,
}: {
  mode: ChatMode;
  model: LocalModel;
  useReasoning: boolean;
  contextLabel: string;
  onClearContext: () => void;
  onModeChange: (mode: ChatMode) => void;
  onModelChange: (model: LocalModel) => void;
  onToggleReasoning: () => void;
  onSend: (message: string) => void;
  onAttachFile: () => void;
  onVoiceInput: () => void;
  onSelectShortcut: (shortcut: ChatShortcut) => void;
  shortcuts: ChatShortcut[];
  onEditShortcuts: () => void;
}) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showShortcutMenu, setShowShortcutMenu] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!textAreaRef.current) return;
    textAreaRef.current.style.height = "auto";
    textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 150)}px`;
  }, [message]);

  function handleSend() {
    if (!message.trim()) return;
    onSend(message.trim());
    setMessage("");
    setShowShortcutMenu(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
    if (event.key === "/" && message === "") {
      setShowShortcutMenu(true);
    }
    if (event.key === "Escape") {
      setShowShortcutMenu(false);
    }
  }

  function handleShortcut(shortcut: ChatShortcut) {
    setMessage(shortcut.prompt);
    setShowShortcutMenu(false);
    textAreaRef.current?.focus();
  }

  return (
    <div className="knowledge-v2-input-zone">
      {contextLabel && (
        <div className="knowledge-v2-context">
          <div>
            <LinkIcon className="icon-4" />
            <span>Contexte : {contextLabel}</span>
          </div>
          <button onClick={onClearContext} aria-label="Retirer le contexte">
            <CloseIcon className="icon-4" />
          </button>
        </div>
      )}

      <div className="knowledge-v2-mode-row">
        <ModeButton active={mode === "rag"} onClick={() => onModeChange("rag")} icon={<DatabaseIcon />} label="Connaissance Pro" />
        <ModeButton active={mode === "llm"} onClick={() => onModeChange("llm")} icon={<BrainIcon />} label="LLM Direct" />
      </div>

      {message === "" && !showShortcutMenu && (
        <ShortcutsBar shortcuts={shortcuts.slice(0, 4)} onSelectShortcut={handleShortcut} onEditShortcuts={onEditShortcuts} />
      )}

      <div className={`knowledge-v2-composer ${isFocused ? "focused" : ""}`}>
        <SlashCommandMenu
          isOpen={showShortcutMenu}
          filter={message.startsWith("/") ? message.slice(1) : ""}
          shortcuts={shortcuts}
          onClose={() => setShowShortcutMenu(false)}
          onSelectShortcut={handleShortcut}
          onCreateShortcut={onEditShortcuts}
        />
        <textarea
          ref={textAreaRef}
          value={message}
          onChange={(event) => {
            const nextMessage = event.target.value;
            setMessage(nextMessage);
            setShowShortcutMenu(nextMessage.startsWith("/"));
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={mode === "rag" ? "Posez une question..." : "Discutez avec l'IA..."}
          rows={1}
        />

        <div className="knowledge-v2-composer-toolbar">
          <div>
            <button onClick={onAttachFile} aria-label="Attacher un fichier">
              <PlusIcon />
            </button>
            <button onClick={onVoiceInput} aria-label="Entrée vocale">
              <MicrophoneIcon />
            </button>
            {mode === "llm" && (
              <button onClick={onToggleReasoning} className={useReasoning ? "active" : ""} aria-label={useReasoning ? "Raisonnement activé" : "Activer le raisonnement"}>
                <ReasoningClockIcon active={useReasoning} />
              </button>
            )}
          </div>

          <div>
            {mode === "llm" && <ModelSelector selectedModel={model} onSelect={onModelChange} />}
            <button className="knowledge-v2-send" onClick={handleSend} disabled={!message.trim()} aria-label="Envoyer">
              <ArrowUpIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="knowledge-v2-bubble-row">
      <div className="knowledge-v2-bubble-avatar">
        <span>C</span>
      </div>
      <div className="knowledge-v2-typing">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function buildAgentMessage(output: unknown): ChatMessage {
  const payload = isRecord(output) ? output : {};
  return {
    id: `agent-${Date.now()}`,
    role: "agent",
    content:
      stringValue(payload.message) ??
      stringValue(payload.answer) ??
      "Je suis prêt côté interface. Le runtime local-only répondra ici dès que Bridge aura validé l'action.",
    timestamp: new Date(),
    citations: arrayValue<KnowledgeChatCitation>(payload.citations),
    webSources: arrayValue<KnowledgeWebSource>(payload.webSources),
    structuredData: isStructuredData(payload.structuredData) ? payload.structuredData : undefined,
    performanceMs: numberValue(payload.performanceMs),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function arrayValue<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : undefined;
}

function isStructuredData(value: unknown): value is KnowledgeStructuredData {
  return isRecord(value) && (Array.isArray(value.rows) || typeof value.chartUrl === "string" || Array.isArray(value.chartVariants));
}

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={active ? "active" : ""}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ModelSelector({ selectedModel, onSelect }: { selectedModel: LocalModel; onSelect: (model: LocalModel) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const models: Array<{ id: LocalModel; name: string; shortName: string; provider: string; disabled?: boolean }> = [
    { id: "lmstudio-local", name: "LM Studio local", shortName: "LM Studio", provider: "Localhost" },
    { id: "bridge-codex", name: "Bridge Codex", shortName: "Codex", provider: "Bridge" },
    { id: "dgx-spark-lan", name: "DGX Spark LAN", shortName: "DGX Spark", provider: "Réseau local", disabled: true },
  ];
  const selected = models.find((modelInfo) => modelInfo.id === selectedModel) ?? models[0];

  return (
    <div className="knowledge-v2-model-select">
      <button onClick={() => setIsOpen((value) => !value)}>
        <span>{selected.shortName}</span>
        <ChevronDownIcon />
      </button>
      {isOpen && (
        <>
          <div className="knowledge-v2-model-backdrop" onClick={() => setIsOpen(false)} />
          <div className="knowledge-v2-model-menu">
            {models.map((modelInfo) => (
              <button
                key={modelInfo.id}
                disabled={modelInfo.disabled}
                onClick={() => {
                  if (modelInfo.disabled) return;
                  onSelect(modelInfo.id);
                  setIsOpen(false);
                }}
                className={selectedModel === modelInfo.id ? "active" : ""}
              >
                <div>
                  <strong>{modelInfo.name}</strong>
                  <span>{modelInfo.provider}</span>
                </div>
                {selectedModel === modelInfo.id && <CheckIcon />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NavIconLink({ href, icon, active, tooltip }: { href: string; icon: React.ReactNode; active?: boolean; tooltip: string }) {
  return (
    <a href={href} className={`nav-icon-btn ${active ? "active" : ""}`} title={tooltip} aria-label={tooltip}>
      {icon}
    </a>
  );
}

function ChatListItem({
  name,
  message,
  time,
  avatar,
  color,
  active,
  typing,
  onClick,
}: {
  name: string;
  message: string;
  time: string;
  avatar: string;
  color: string;
  active?: boolean;
  typing?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`chat-list-item ${active ? "active" : ""}`} onClick={onClick}>
      <div className={`knowledge-v2-chat-avatar ${color}`}>{avatar}</div>
      <div>
        <div>
          <strong>{name}</strong>
          <span>{time}</span>
        </div>
        <p>{typing ? <em>en train d'écrire...</em> : message}</p>
      </div>
    </button>
  );
}

function FileTypeItem({ icon, name, count, size, color, onClick }: { icon: string; name: string; count: number; size: string; color: string; onClick: () => void }) {
  const iconNode =
    icon === "document" ? <DocumentIcon /> : icon === "image" ? <ImageIcon /> : icon === "video" ? <VideoIcon /> : <FileIcon />;

  return (
    <button className="file-type-card" onClick={onClick}>
      <div className={`knowledge-v2-file-icon ${color}`}>{iconNode}</div>
      <div>
        <strong>{name}</strong>
        <p>
          {count} fichiers, {size}
        </p>
      </div>
      <ChevronRightIcon />
    </button>
  );
}

const ChatIcon = ({ className = "icon-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);

const UploadIcon = ({ className = "icon-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const DashboardIcon = ({ className = "icon-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const SearchIcon = ({ className = "icon-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const AnalyticsIcon = ({ className = "icon-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const SettingsIcon = ({ className = "icon-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChevronLeftIcon = ({ className = "icon-5" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
const ChevronRightIcon = ({ className = "icon-5" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const CloseIcon = ({ className = "icon-5" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const PlusIcon = ({ className = "icon-5" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const ImageIcon = ({ className = "icon-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
const FolderIcon = ({ className = "icon-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>;
const LinkIcon = ({ className = "icon-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
const DocumentIcon = ({ className = "icon-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const VideoIcon = ({ className = "icon-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>;
const FileIcon = ({ className = "icon-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const DatabaseIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>;
const BrainIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const MicrophoneIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-12 1.5a6 6 0 006 6m0 0v3.75m-3.75 0h7.5M12 15.75a3 3 0 003-3V6.75a3 3 0 10-6 0v6a3 3 0 003 3z" /></svg>;
const ArrowUpIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
const ChevronDownIcon = () => <svg className="icon-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const CheckIcon = () => <svg className="icon-4 text-primary-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const RefreshIcon = ({ className = "icon-5" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356M20.52 9.348A8.96 8.96 0 0012.001 3c-4.17 0-7.674 2.84-8.681 6.69m4.657 4.962H2.985v4.992m.496-4.992A8.96 8.96 0 0012.001 21c4.17 0 7.674-2.84 8.681-6.69" /></svg>;
const EditIcon = ({ className = "icon-5" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>;
const SparkleIcon = ({ className = "icon-4" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.091-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.091L9 5.25l.813 2.846a4.5 4.5 0 003.091 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.091zM18.25 8.25L17.8 9.8l-1.55.45 1.55.45.45 1.55.45-1.55 1.55-.45-1.55-.45-.45-1.55z" /></svg>;
const ChatStackIcon = ({ className = "icon-12" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 16h16M16 24h10M12 34l-6 4V14a8 8 0 018-8h20a8 8 0 018 8v12a8 8 0 01-8 8H12z" /><path strokeLinecap="round" strokeLinejoin="round" d="M10 28H8a6 6 0 00-6 6v8l5-3h19a6 6 0 006-6v-1" /></svg>;

function ReasoningClockIcon({ active }: { active: boolean }) {
  return (
    <svg className="icon-5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray={active ? "0" : "4 3"} />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {active && (
        <>
          <circle cx="12" cy="3" r="1" fill="currentColor" />
          <circle cx="21" cy="12" r="1" fill="currentColor" />
          <circle cx="12" cy="21" r="1" fill="currentColor" />
          <circle cx="3" cy="12" r="1" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
