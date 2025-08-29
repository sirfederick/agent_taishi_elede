# ELEDE · Línea Directa – Formador (Embed SDK)
Archivos sincronizados para usar **Aplicación web** de Copilot Studio con **SDK** dentro del Droplet.

## Cómo usar
1) Abre `index.html` y, al final, donde dice **Pega AQUÍ el snippet**,
   inserta el bloque oficial que te da Copilot Studio (incluye el `<script src="...">` del SDK y la llamada a `MicrosoftAgents.renderChat({...})`).
2) Dentro de ese bloque, reemplaza `connectionString` con tu **Cadena de conexión**.
3) Sube `index.html`, `app.js` y `app.css` a tu servidor (misma carpeta).
4) Abre la URL del droplet. Verás el gate **Nombre + Email + PIN** (PIN por defecto: `ELEDE2025`).
5) Tras pasar el gate, el widget se renderiza en `#agent-root`.

> Si no aparece el chat a los 5 segundos, el archivo te mostrará un mensaje rojo:
> "No se detectó el SDK". Verifica que pegaste el snippet correcto y que el canal está habilitado.

