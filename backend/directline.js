const BASE_URL = 'https://directline.botframework.com/v3/directline';

/**
 * Crear una nueva conversación usando Direct Line REST.
 * @param {string} secret - Direct Line secret.
 * @returns {Promise<object>} Datos de la conversación.
 */
async function createConversation(secret) {
  const res = await fetch(`${BASE_URL}/conversations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` }
  });
  if (!res.ok) {
    throw new Error(`DirectLine error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/**
 * Enviar un mensaje a una conversación existente.
 * @param {string} secret - Direct Line secret.
 * @param {string} conversationId - ID de la conversación.
 * @param {string} text - Texto del mensaje.
 */
async function sendMessage(secret, conversationId, text) {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/activities`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type: 'message', text })
  });
  if (!res.ok) {
    throw new Error(`DirectLine error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/**
 * Obtener actividades nuevas de una conversación.
 * @param {string} secret - Direct Line secret.
 * @param {string} conversationId - ID de la conversación.
 * @param {string} [watermark] - Ultimo watermark recibido.
 */
async function getMessages(secret, conversationId, watermark) {
  const url = `${BASE_URL}/conversations/${conversationId}/activities` + (watermark ? `?watermark=${watermark}` : '');
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` }
  });
  if (!res.ok) {
    throw new Error(`DirectLine error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

module.exports = {
  createConversation,
  sendMessage,
  getMessages
};
