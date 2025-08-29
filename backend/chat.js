const directline = require('./directline');
const sdk = require('./sdk');

// Determina si se usa Direct Line o SDK basándose en la variable de entorno.
const USE_DIRECTLINE = process.env.USE_DIRECTLINE === 'true';

/**
 * Enviar un mensaje al bot usando Direct Line o el SDK.
 * @param {object} options - opciones necesarias para cada modo.
 * @param {string} options.text - mensaje a enviar.
 * @param {string} [options.secret] - secreto de Direct Line.
 * @param {string} [options.conversationId] - ID de la conversacion (Direct Line).
 * @param {string} [options.token] - token de conversacion (Direct Line).
 * @param {object} [options.client] - instancia del SDK.
 */
async function sendMessage(options) {
  if (USE_DIRECTLINE) {
    const { secret, conversationId, text } = options;
    return directline.sendMessage(secret, conversationId, text);
  }
  const { client, text } = options;
  return sdk.sendMessage(client, text);
}

module.exports = { USE_DIRECTLINE, sendMessage };
