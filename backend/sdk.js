/**
 * Enviar un mensaje utilizando el SDK de Agents/Copilot.
 * Este módulo es un simple contenedor; se asume que el cliente del SDK
 * ya fue instanciado y pasado como argumento.
 */
async function sendMessage(client, text) {
  // En una implementación real, se usaría el cliente del SDK para enviar
  // la actividad correspondiente al bot.
  return client.postActivity({ type: 'message', text });
}

module.exports = { sendMessage };
