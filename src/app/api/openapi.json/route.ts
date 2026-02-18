import { NextResponse } from "next/server";

const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Brand Radar API",
    version: "1.0.0",
    description: "REST API for clients, mentions, citations, queries, API keys, and webhook ingestion."
  },
  servers: [
    {
      url: "/api"
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "External API key generated from /api/v1/api-keys."
      }
    }
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    "/v1/clients": {
      get: {
        summary: "List clients",
        parameters: [{ name: "limit", in: "query", schema: { type: "integer", default: 50 } }],
        responses: { "200": { description: "Client list" }, "401": { description: "Unauthorized" }, "429": { description: "Rate limited" } }
      },
      post: {
        summary: "Create client",
        responses: { "201": { description: "Client created" }, "400": { description: "Validation failed" } }
      }
    },
    "/v1/clients/{id}": {
      get: { summary: "Get client by id", responses: { "200": { description: "Client detail" }, "404": { description: "Not found" } } },
      patch: { summary: "Update client", responses: { "200": { description: "Client updated" } } },
      delete: { summary: "Delete client", responses: { "200": { description: "Client deleted" } } }
    },
    "/v1/queries": {
      get: { summary: "List queries", responses: { "200": { description: "Query list" } } },
      post: { summary: "Create query", responses: { "201": { description: "Query created" } } }
    },
    "/v1/queries/{id}": {
      get: { summary: "Get query by id", responses: { "200": { description: "Query detail" } } },
      patch: { summary: "Update query", responses: { "200": { description: "Query updated" } } },
      delete: { summary: "Delete query", responses: { "200": { description: "Query deleted" } } }
    },
    "/v1/mentions": {
      get: { summary: "List mentions", responses: { "200": { description: "Mention list" } } },
      post: { summary: "Create mention", responses: { "201": { description: "Mention created" } } }
    },
    "/v1/citations": {
      get: { summary: "List citations", responses: { "200": { description: "Citation list" } } },
      post: { summary: "Create citation", responses: { "201": { description: "Citation created" } } }
    },
    "/v1/webhooks/ai-monitoring": {
      post: {
        summary: "Ingest AI monitoring webhook",
        security: [],
        responses: {
          "200": { description: "Processed" },
          "401": { description: "Invalid signature" }
        }
      }
    },
    "/v1/api-keys": {
      get: {
        summary: "List API keys (admin session required)",
        security: [],
        responses: { "200": { description: "API keys" }, "401": { description: "Unauthorized" } }
      },
      post: {
        summary: "Create API key (admin session required)",
        security: [],
        responses: { "201": { description: "API key created" }, "403": { description: "Admin required" } }
      }
    },
    "/v1/api-keys/{id}": {
      delete: {
        summary: "Revoke API key (admin session required)",
        security: [],
        responses: { "200": { description: "Revoked" } }
      }
    }
  }
};

export async function GET() {
  return NextResponse.json(openApiDocument);
}
