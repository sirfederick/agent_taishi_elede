// app.js — Pre-chat + Agents SDK usando "Cadena de conexión" (Direct Connect URL)
(function () {
  'use strict';

  // ===== CONFIG RÁPIDA =====
  // Pegar AQUÍ la "Cadena de conexión" (una sola línea, sin saltos)
  const CONNECTION_STRING = "https://60b9ea0e2763e584bde31c89cb713a.e4.environment.api.powerplatform.com/copilotstudio/dataverse-backed/authenticated/bots/cr63c_agent/conversations?api-version=2022-03-01-preview";
  const PIN_ALLOWLIST = ["1234"];  // cambiá/añadí PINs
  // =========================

  const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const uid = s => { let h=0; for (let i=0;i<s.length;i++){ h=((h<<5)-h)+s.charCodeAt(i); h|=0 } return "u"+Math.abs(h); };

  function ensureWebChatScript() {
    if (window.WebChat) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.botframework.com/botframework-webchat/latest/webchat.js";
      s.onload = () => res();
      s.onerror = e => rej(e);
      document.head.appendChild(s);
    });
  }

  async function startChat(name, email, pin) {
    // Validar connection string
    if (!CONNECTION_STRING || !/^https?:\/\//.test(CONNECTION_STRING)) {
      document.getElementById('pc-warn')?.removeAttribute('hidden');
      throw new Error("CONNECTION_STRING inválida o vacía");
    }

    // Import Agents SDK (ESM)
    const { CopilotStudioClient, CopilotStudioWebChat, ConnectionSettings } =
      await import("https://cdn.jsdelivr.net/npm/@microsoft/agents-copilotstudio-client/+esm");

    const settings   = new ConnectionSettings({ directConnectUrl: CONNECTION_STRING });
    const client     = new CopilotStudioClient(settings, ""); // "No authentication"
    const directLine = CopilotStudioWebChat.createConnection(client, { showTyping: true });

    const styleOptions = {
      backgroundColor: "hsl(0, 0%, 42%)",
      bubbleBackground: "#2f2f2f",
      bubbleBorderColor: "#3a3a3a",
      bubbleTextColor: "#ffffff",
      bubbleFromUserBackground: "#333333",
      bubbleFromUserBorderColor: "#3a3a3a",
      bubbleFromUserTextColor: "#ffffff",
      sendBoxBackground: "#3b3b3b",
      sendBoxTextColor: "#ffffff",
      sendBoxBorderBottom: "1px solid rgba(255,255,255,.12)",
      hideSendBox: false,
      hideUploadButton: false,
      suggestedActionsStackedLayoutButtonTextColor: "#ffffff",
      suggestedActionsBackground: "#2f2f2f",
      suggestedActionsBorderColor: "#3a3a3a",
      subtle: "#cfcfcf"
    };

    const host = document.getElementById("webchat-host");
    const userID = uid(email);

    window.WebChat.renderWebChat(
      { directLine, locale: "es-ES", userID, username: name, styleOptions },
      host
    );

    try {
      window.WebChat.postActivity({
        type: "event", name: "prechat",
        from: { id: userID, name },
        value: { name, email, pin }
      });
    } catch {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    const pre = document.getElementById('prechat');
    const nameI  = document.getElementById('pc-name');
    const emailI = document.getElementById('pc-email');
    const pinI   = document.getElementById('pc-pin');
    const go     = document.getElementById('pc-go');
    const err    = document.getElementById('pc-err');

    go.addEventListener('click', async () => {
      const name  = (nameI.value || '').trim();
      const email = (emailI.value || '').trim();
      const pin   = (pinI.value || '').trim();
      const pinOK = PIN_ALLOWLIST.length ? PIN_ALLOWLIST.includes(pin) : /^\d{4,8}$/.test(pin);

      if (!name || !validEmail(email) || !pinOK) { err.style.display = 'block'; return; }
      err.style.display = 'none';
      sessionStorage.setItem('prechat', JSON.stringify({ name, email }));

      try {
        await ensureWebChatScript();
        await startChat(name, email, pin);
        pre.style.display = 'none';
      } catch (e) {
        console.error(e);
        err.textContent = "No se pudo iniciar el chat. Revisá la cadena de conexión y la consola.";
        err.style.display = 'block';
      }
    });
  });
})();
