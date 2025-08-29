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


## Autenticación con Azure AD
1. En Azure AD, registra una aplicación y otórgale el permiso `CopilotStudio.Copilots.Invoke`.
2. Crea un archivo `.env` (o copia `.env.example`) con:
   ```
   AZURE_TENANT_ID=<tu-tenant-id>
   AZURE_CLIENT_ID=<tu-client-id>
   AZURE_CLIENT_SECRET=<tu-client-secret>
   USE_S2S_CONNECTION=true # o false para flujo de usuario
   ```
3. En el backend usa estos valores para obtener un token OAuth antes de llamar al SDK. Ejemplo:
   ```js
   const { getAccessToken } = require('./backend/auth');
   const token = await getAccessToken();
   ```
   Si `USE_S2S_CONNECTION` es `true`, se usa un Service Principal; si es `false`, se usa flujo de usuario (Device Code).
