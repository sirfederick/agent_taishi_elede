# TAISHI · README + Blueprint (MVP marca blanca)

**Objetivo**: Poner en producción un **agente marca blanca** en **Microsoft Copilot Studio (PAYG)** conectado a un **backend propio en DigitalOcean (DO)** con **RAG multicliente** (aislamiento por sub‑cliente) y dejar preparada una ruta de migración opcional a **Azure**.

---

## 0) TL;DR (micro‑plan)

* **Hoy**: mantener el Droplet DO y conectar vía **Custom Connector** (PAYG por mensaje en Copilot Studio).
* **RAG**: colección/índice por **sub‑cliente** (p. ej., `qdrant:collection_{subclient}` o Azure AI Search índice‑por‑tenant).
* **Headers**: `X-Subclient-Id` (ruteo) + `X-API-Key` (auth) desde el conector.
* **HTTPS**: dominio + Nginx/Caddy + Certbot.
* **Observabilidad**: IDs de trazas + métricas p95 + costo por conversación.

---

## 1) Alcance MVP

* **Canales**: Web App de Copilot Studio (y opcional **Teams**).
* **Backend**: FastAPI/Node en DO (puerta de entrada REST).
* **RAG**: Qdrant/pgvector en DO **o** Azure AI Search (opcional).
* **Multicliente**: ruteo por encabezado `X-Subclient-Id` → índice/colección dedicada.
* **Seguridad**: API Key, CORS mínimo, rate limit básico, máscara PII.
* **Logs**: request\_id, tenant\_id, latencia, costo estimado.

**Fuera de alcance (MVP)**: billing automatizado, SSO B2C, panel avanzado de costos, multi‑zona.

---

## 2) Arquitectura (visión rápida)

**Opción A (recomendada para hoy)**

* Copilot Studio (PAYG) → **Custom Connector** → **API DO** → RAG DO (Qdrant/pgvector).

**Opción B (evolución Azure)**

* Copilot Studio → Custom Connector → **Azure Functions/Container Apps** → **Azure AI Search** (índice por tenant).

---

## 3) Multitenancy (modelo)

* **Identidad de sub‑cliente** via `X-Subclient-Id`.
* **Aislamiento de datos**:

  * Qdrant: **colección por sub‑cliente**.
  * Azure AI Search: **índice por sub‑cliente** (S3 High Density si hay miles de índices pequeños).
* **Naming**: `tenant_{slug}` (evitar espacios/acentos).

---

## 4) RAG: curado y chunking

* **Ingesta**: PDFs/TXT/Docs a un bucket/carpeta por sub‑cliente.
* **Parsing + chunking**: tamaño 600–900 tokens, **overlap 10–15%**.
* **Metadata por chunk (JSON)**:

  ```json
  {
    "tenant_id": "acme",
    "doc_id": "whitepaper-2025.pdf",
    "chunk_id": "whitepaper-2025.pdf#p3#c007",
    "page": 3,
    "heading": "Introducción",
    "lang": "es",
    "tags": ["ISO27001"],
    "embedding_model": "text-embedding-3-large",
    "chunk_size_tokens": 800,
    "overlap_tokens": 80,
    "hash": "sha256:..."
  }
  ```
* **Buenas prácticas**: normalizar idioma, títulos (`#`, `##`), y referencias de fuente.

---

## 5) Seguridad y cumplimiento

* **Transporte**: HTTPS obligatorio.
* **Auth API**: `X-API-Key` + rotate keys.
* **CORS**: restringir orígenes.
* **PII**: máscara básica en logs; evitar volcado de prompts con datos sensibles.
* **Rate limiting**: por IP y por `tenant_id`.

---

## 6) Observabilidad

* **Log** (ndjson): `ts`, `tenant_id`, `request_id`, `latency_ms`, `tokens_in/out`, `cost_usd_est`.
* **Métricas**: p50/p95, error rate, conversaciones/día por tenant.
* **Trazabilidad**: `request_id` propagado del conector al backend.

---

## 7) Costos (modelo mental)

* **Copilot Studio (PAYG)**: \$ por **mensaje** (consumo). Packs opcionales.
* **DO**: costo fijo de tu Droplet.
* **Opcional Azure**: Azure AI Search / Functions / Container Apps (consumo o plan).

---

## 8) Prerrequisitos

* **Cuenta Microsoft 365 / Power Platform** con acceso a **Copilot Studio** (PAYG o pack).
* **Dominio + DNS** apuntando al Droplet DO.
* **Certificado TLS** (Let’s Encrypt) y reverse proxy (Nginx/Caddy).
* **API key** segura para el backend.

---

## 9) Pasos (Kaizen, sprints cortos)

**Sprint 0 — Alta de cuentas**

1. Activar Copilot Studio en tu tenant (PAYG habilitado).
2. Verificar acceso a crear **Custom Connectors**.

**Sprint 1 — Backend DO**

1. Exponer endpoint `/rag/query` (FastAPI/Node) con headers `X-Subclient-Id`, `X-API-Key`.
2. Configurar Nginx + TLS + healthcheck `/health`.
3. Conectar a Qdrant/pgvector (colección por sub‑cliente).

**Sprint 1.1 — Custom Connector**

1. Importar OpenAPI (ver §10) y setear **Base URL**, **X-API-Key**, variables.
2. Probar desde Copilot Studio (Test) con dos `X-Subclient-Id`.

**Sprint 1.2 — Publicación del Copilot**

1. Publicar canal **Web** (y opcional **Teams**).
2. Crear prompt del sistema con políticas de atribución y límites.

**Sprint 2 — Ingesta RAG**

1. Subir 2–3 documentos por sub‑cliente.
2. Validar calidad de recuperación y citación.

---

## 10) API (OpenAPI mínimo)

```yaml
openapi: 3.0.3
info: {title: RAG Connector, version: "1.0.0"}
servers:
  - url: https://tu-dominio-do/api
paths:
  /rag/query:
    post:
      summary: Query RAG
      parameters:
        - in: header
          name: X-Subclient-Id
          required: true
          schema: {type: string}
        - in: header
          name: X-API-Key
          required: true
          schema: {type: string}
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                question: {type: string}
                k: {type: integer, default: 5}
              required: [question]
      responses:
        "200": {description: ok}
```

---

## 11) Configuración HTTPS (Nginx + Certbot, resumen)

* Reverse proxy en `:443` → `localhost:8000`.
* Redirección `:80` → `:443`.
* Renovación automática de certificados (cron/systemd timer).

---

## 12) Pruebas

* **Funcionales**: consulta simple devuelve 200 + `tenant` correcto.
* **Carga**: 100 req/min, p95 < 6s (web), errores < 1%.
* **Seguridad**: rechazo 401 sin `X-API-Key`.

---

## 13) Roadmap (post‑MVP)

* **SSO Entra ID B2C** multi‑tenant.
* **Azure AI Search** (índice por sub‑cliente, S3 HD si escala).
* **Observabilidad avanzada** (App Insights + OpenTelemetry).
* **Facturación** por conversación/usuario (dashboard).

---

## 14) Roles & Responsabilidades

* **Infra/API**: DO (hoy) / Azure (futuro).
* **Copilot**: definición, conexión, publicación.
* **Datos**: curación, chunking, versionado por sub‑cliente.
* **Seguridad**: gestión de llaves, WAF/rate limits, backups.
