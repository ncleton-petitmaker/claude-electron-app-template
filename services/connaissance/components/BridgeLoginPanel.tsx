"use client";

import { useRef, useState } from "react";
import { authLabels } from "@/data/feature-catalog";
import { callBridgeAction } from "@/lib/bridge-actions";
import { ServiceIcon } from "@/components/ServiceIcon";

export function BridgeLoginPanel() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("Connexion par email");
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  async function sendOtp() {
    setStatus("Envoi en cours...");
    const result = await callBridgeAction("knowledge_ai.auth.otp.send", {
      payload: { email },
    });
    setStatus(result.ok ? "Un code à 6 chiffres a été envoyé à" : result.error ?? "Erreur inconnue");
    setOtpSent(true);
  }

  async function verify(code: string) {
    setStatus("Vérification...");
    const result = await callBridgeAction("knowledge_ai.auth.otp.verify", {
      payload: { email, codeLength: code.length },
    });
    setStatus(result.ok ? "OAuth Bridge prêt" : result.error ?? "Erreur inconnue");
  }

  function updateDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) inputs.current[index + 1]?.focus();
    const code = next.join("");
    if (code.length === 6) void verify(code);
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="service-logo login-logo">C</div>
        <h1>Connaissance Pro</h1>
        <p>{authLabels[0]}</p>

        {!otpSent ? (
          <form onSubmit={(event) => { event.preventDefault(); void sendOtp(); }} className="login-form">
            <span className="upload-icon"><ServiceIcon name="email" /></span>
            <h2>Connexion par email</h2>
            <p>Recevez un code de connexion sécurisé</p>
            <label>
              Adresse email
              <input className="service-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@entreprise.com" required />
            </label>
            <button className="service-button" type="submit" disabled={!email}>
              Recevoir le code
            </button>
          </form>
        ) : (
          <section className="login-form">
            <span className="upload-icon"><ServiceIcon name="settings" /></span>
            <h2>Entrez le code</h2>
            <p>Un code à 6 chiffres a été envoyé à<br /><strong>{email}</strong></p>
            <div className="otp-row">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => { inputs.current[index] = node; }}
                  value={digit}
                  inputMode="numeric"
                  maxLength={1}
                  onChange={(event) => updateDigit(index, event.target.value)}
                  aria-label={`Code ${index + 1}`}
                />
              ))}
            </div>
            <div className="knowledge-actions">
              <button type="button" onClick={() => void sendOtp()}>Renvoyer le code</button>
              <button type="button" onClick={() => setOtpSent(false)}>Utiliser une autre adresse</button>
            </div>
          </section>
        )}

        <p className="service-muted">{status}</p>
        <p className="login-footer">Connaissance.pro - Votre base de connaissances intelligente</p>
      </section>
    </main>
  );
}
