"use client";

import { useMemo, useState } from "react";
import { callBridgeAction } from "@/lib/bridge-actions";
import { modelOptions, shortcuts, slashCommands, type ShortcutItem } from "@/data/feature-catalog";
import { ShortcutManagerModal } from "@/components/ShortcutManagerModal";
import { ServiceIcon } from "@/components/ServiceIcon";
import { StructuredDataPanel } from "@/components/StructuredDataPanel";

type ChatMode = "rag" | "llm";

export function ChatComposer({ contextLabel = "Cette connaissance" }: { contextLabel?: string }) {
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<ChatMode>("rag");
  const [model, setModel] = useState(modelOptions[0].id);
  const [useReasoning, setUseReasoning] = useState(false);
  const [usePro, setUsePro] = useState(false);
  const [showSlash, setShowSlash] = useState(false);
  const [showShortcutManager, setShowShortcutManager] = useState(false);
  const [status, setStatus] = useState("Pret");

  const filteredCommands = useMemo(() => {
    if (!message.startsWith("/")) return slashCommands;
    const query = message.slice(1).toLowerCase();
    return slashCommands.filter((command) => command.name.toLowerCase().includes(query) || command.prompt.includes(query));
  }, [message]);

  function selectShortcut(shortcut: ShortcutItem) {
    setMessage(shortcut.prompt);
    setShowSlash(false);
    void callBridgeAction("knowledge_ai.shortcut.track_usage", { resourceId: shortcut.id });
  }

  async function createShortcutFromSlash() {
    const result = await callBridgeAction("knowledge_ai.shortcut.create", {
      payload: {
        name: "Nouveau raccourci",
        prompt: message.startsWith("/") ? message : "",
      },
    });
    setStatus(result.ok ? "Raccourci créé via Bridge" : result.error ?? "Action raccourci indisponible");
  }

  async function updateChatOption(payload: Record<string, unknown>) {
    const result = await callBridgeAction("knowledge_ai.conversation.options.set", { payload });
    setStatus(result.ok ? "Options chat mises a jour" : result.error ?? "Action options indisponible");
  }

  async function removeContext() {
    const result = await callBridgeAction("knowledge_ai.conversation.context.set", { payload: { contextLabel: null } });
    setStatus(result.ok ? "Contexte retire" : result.error ?? "Action contexte indisponible");
  }

  async function toggleSpeech() {
    const result = await callBridgeAction("knowledge_ai.speech.toggle", { payload: { surface: "chat-composer" } });
    setStatus(result.ok ? "Micro local synchronise" : result.error ?? "Action micro indisponible");
  }

  async function send() {
    if (!message.trim()) return;
    setStatus("Envoi via Bridge...");
    const result = await callBridgeAction("knowledge_ai.chat.stream", {
      message,
      provider: mode === "rag" ? "lmstudio_local" : "bridge_codex",
      options: { model, useReasoning, usePro },
    });
    setStatus(result.ok ? "Message envoye" : result.error ?? "Action Bridge indisponible");
    if (result.ok) setMessage("");
  }

  return (
    <section className="chat-surface">
      <div className="chat-messages">
        <article className="chat-message assistant">
          <div className="chat-avatar">C</div>
          <div>
            <strong>Connaissance Pro</strong>
            <p>Comment puis-je vous aider ? Les reponses doivent utiliser Bridge, LM Studio local ou DGX Spark LAN si l'admin l'active.</p>
          </div>
        </article>
        <article className="chat-message user">
          <div className="chat-avatar user">NC</div>
          <div>
            <strong>Nicolas Cleton</strong>
            <p>Resume les sources disponibles et cite les documents utiles.</p>
          </div>
        </article>
      </div>

      <StructuredDataPanel />

      <div className="shortcut-bar" aria-label="Raccourcis">
        {shortcuts.map((shortcut) => (
            <button key={shortcut.id} type="button" onClick={() => selectShortcut(shortcut)}>
            <span>{shortcut.name}</span>
          </button>
        ))}
        <button type="button" className="shortcut-edit" onClick={() => setShowShortcutManager(true)}>Modifier les raccourcis</button>
      </div>

      <div className="chat-context">
        <span>Contexte : {contextLabel}</span>
        <button type="button" onClick={() => void removeContext()}>Retirer le contexte</button>
      </div>

      <div className="chat-mode-row" aria-label="Mode">
        <button type="button" data-active={mode === "rag"} onClick={() => { setMode("rag"); void updateChatOption({ mode: "rag" }); }}>
          <ServiceIcon name="dashboard" size={15} />
          Connaissance Pro
        </button>
        <button type="button" data-active={mode === "llm"} onClick={() => { setMode("llm"); void updateChatOption({ mode: "llm" }); }}>
          <ServiceIcon name="brain" size={15} />
          LLM Direct
        </button>
        <select value={model} onChange={(event) => { setModel(event.target.value); void updateChatOption({ model: event.target.value }); }} aria-label="Modele">
          {modelOptions.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="chat-composer">
        {showSlash ? (
          <div className="slash-menu">
            <div className="slash-header">
              <strong>Raccourcis</strong>
              <button type="button" onClick={() => setShowSlash(false)}>Fermer</button>
            </div>
            {filteredCommands.map((command) => (
              <button key={command.id} type="button" onClick={() => setMessage(command.prompt)}>
                <span>{command.name}</span>
                <small>{command.description}</small>
              </button>
            ))}
            <button type="button" onClick={() => void createShortcutFromSlash()}>
              Creer un raccourci
            </button>
          </div>
        ) : null}
        <textarea
          aria-label="Écrivez votre message..."
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setShowSlash(event.target.value.startsWith("/"));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
          placeholder="Posez une question..."
        />
        <div className="chat-toolbar">
          <div className="chat-actions-left">
            <button type="button" aria-label="Attacher un fichier" onClick={() => void callBridgeAction("knowledge_ai.upload.file", { payload: { source: "chat-composer" } })}><ServiceIcon name="plus" /></button>
            <button type="button" data-active={useReasoning} onClick={() => { const next = !useReasoning; setUseReasoning(next); void updateChatOption({ useReasoning: next }); }}>Reasoning</button>
            <button type="button" data-active={usePro} onClick={() => { const next = !usePro; setUsePro(next); void updateChatOption({ usePro: next }); }}>Pro</button>
          </div>
          <div className="chat-actions-right">
            <button type="button" aria-label="Micro" onClick={() => void toggleSpeech()}><ServiceIcon name="mic" /></button>
            <button type="button" className="service-button" onClick={() => void send()}>
              <ServiceIcon name="send" size={15} />
              Envoyer
            </button>
          </div>
        </div>
      </div>
      <p className="service-muted" style={{ margin: 0 }}>{status}</p>
      <ShortcutManagerModal open={showShortcutManager} onClose={() => setShowShortcutManager(false)} />
    </section>
  );
}
